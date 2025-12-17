const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const LOGMEAL_TOKEN = process.env.LOGMEAL_TOKEN;
const LOGMEAL_API_BASE = "https://api.logmeal.com/v2";

// Handig om te zien dat server leeft in je browser
app.get("/", (req, res) => {
  res.send("OK - backend draait. Gebruik POST /api/logmeal/nutrition of GET /health");
});
app.get("/health", (req, res) => res.json({ ok: true }));

function extractTrackedNutrientsFromLogMeal(respJson) {
  const out = { hydration: 0, carbs: 0, fat: 0, protein: 0 };

  const stack = [respJson];
  while (stack.length) {
    const cur = stack.pop();
    if (!cur) continue;

    if (Array.isArray(cur)) {
      cur.forEach(x => stack.push(x));
      continue;
    }
    if (typeof cur !== "object") continue;

    for (const [k, v] of Object.entries(cur)) {
      const key = String(k).toLowerCase();

      if (typeof v === "number") {
        if (key.includes("protein")) out.protein = v;
        if (key.includes("carb")) out.carbs = v;
        if (key.includes("fat")) out.fat = v;
        if (key.includes("water") || key.includes("hydration")) out.hydration = v;
      }

      if (v && typeof v === "object") {
        const name = String(v.name || v.label || v.code || k || "").toLowerCase();
        const num =
          typeof v.quantity === "number" ? v.quantity :
          typeof v.value === "number" ? v.value :
          null;

        if (num !== null) {
          if (name.includes("protein")) out.protein = num;
          if (name.includes("carb")) out.carbs = num;
          if (name.includes("fat")) out.fat = num;
          if (name.includes("water") || name.includes("hydration")) out.hydration = num;
        }
      }

      stack.push(v);
    }
  }

  // water vaak in ml/gram -> liters
  if (out.hydration > 20) out.hydration = out.hydration / 1000;

  for (const k of Object.keys(out)) {
    if (typeof out[k] !== "number" || !isFinite(out[k])) out[k] = 0;
  }
  return out;
}

app.post("/api/logmeal/nutrition", async (req, res) => {
  try {
    const { foodName, grams, nutrientsWanted } = req.body || {};
    if (!foodName || !grams) return res.status(400).json({ error: "foodName and grams required" });
    if (!LOGMEAL_TOKEN) return res.status(500).json({ error: "LOGMEAL_TOKEN missing on server" });

    const url = `${LOGMEAL_API_BASE}/nutrition/recipe/compute_nutrients`;

    const payload = {
      ingredients: [{ ingredientName: foodName, ingredientAmount: grams }],
    };

    console.log("➡️ /api/logmeal/nutrition", payload);

    // timeout zodat hij niet “oneindig laadt”
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);

    let r;
    try {
      r = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${LOGMEAL_TOKEN}`,
        },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
    } finally {
      clearTimeout(t);
    }

    console.log("⬅️ LogMeal status:", r.status);

    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      console.log("❌ LogMeal error body:", txt);
      return res.status(r.status).send(txt || "LogMeal error");
    }

    const data = await r.json();
    const extracted = extractTrackedNutrientsFromLogMeal(data);

    const wanted = Array.isArray(nutrientsWanted)
      ? nutrientsWanted
      : ["hydration", "carbs", "fat", "protein"];

    const filtered = {};
    wanted.forEach(n => {
      if (["hydration", "carbs", "fat", "protein"].includes(n)) filtered[n] = extracted[n] ?? 0;
    });

    return res.json(filtered);
  } catch (e) {
    console.error("❌ server error:", e);
    return res.status(500).json({ error: "server error", detail: String(e?.message || e) });
  }
});

app.listen(3000, () => console.log("✅ Backend draait op http://localhost:3000"));
