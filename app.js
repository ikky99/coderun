// Simple navigation system
function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

// -------------------
// Utility
// -------------------
function calculateAge(dobValue) {
  if (!dobValue) return null;
  const dob = new Date(dobValue);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// -------------------
// Tracking: only these are allowed (as you requested)
// -------------------
const TRACKABLE = new Set(["hydration", "carbs", "fat", "protein"]);
const MAX_PHASE = 14;

// Unit defaults
const UNIT_MAP = {
  hydration: "L",
  protein: "g",
  carbs: "g",
  fat: "g",
};

// -------------------
// App state
// -------------------
let trackedGoals = []; // each: { id, nutrient, unit, target, current, phase }

// -------------------
// Buttons / navigation wiring
// -------------------
document.getElementById("btn-gen-realistic").onclick = () => {
  const name = document.getElementById("username").value;
  const dob = document.getElementById("dob").value;
  const gender = document.getElementById("gender-welcome").value;
  const length = document.getElementById("length").value;
  const weight = document.getElementById("weight").value;
  const age = calculateAge(dob);
  console.log("User info (welcome):", { name, dob, age, gender, length, weight });
  if (age !== null) console.log("Age:", age);
  show("screen-error-realistic");
};

document.getElementById("btn-gen-own").onclick = () => {
  const name = document.getElementById("username").value;
  const dob = document.getElementById("dob").value;
  const gender = document.getElementById("gender-welcome").value;
  const length = document.getElementById("length").value;
  const weight = document.getElementById("weight").value;
  const age = calculateAge(dob);
  console.log("User info (own goals):", { name, dob, age, gender, length, weight });
  if (age !== null) console.log("Age:", age);
  show("screen-gen-own");
};

// return buttons
document.querySelectorAll(".btn-return").forEach(btn => {
  btn.onclick = () => show(btn.dataset.target);
});

// After realistic goal → tracking choose
document.getElementById("btn-realistic-continue").onclick = () =>
  show("screen-track-choose");

// After own goals → garden
document.getElementById("own-continue").onclick = () => {
  if (trackedGoals.length === 0) addGoalFromValue("hydration");
  initGarden();
};

// After tracking choose → garden
document.getElementById("track-continue").onclick = () => {
  if (trackedGoals.length === 0) addGoalFromValue("hydration");
  initGarden();
};

document.getElementById("btn-change-tracked").onclick = () =>
  show("screen-track-choose");

document.getElementById("btn-add-food").onclick = () => prepareAddFood();

// -------------------
// Add/track chips logic (shared for track and own screens)
// -------------------
function optionElementByValue(selectEl, value) {
  return Array.from(selectEl.options).find(o => o.value === value);
}

function removeOptionFromSelect(selectEl, value) {
  const opt = optionElementByValue(selectEl, value);
  if (opt) opt.remove();
}

function addOptionToSelect(selectEl, value, label, unit) {
  if (optionElementByValue(selectEl, value)) return;
  const o = document.createElement("option");
  o.value = value;
  o.textContent = label;
  if (unit) o.dataset.unit = unit;
  selectEl.appendChild(o);
}

function addGoalFromValue(value) {
  if (!TRACKABLE.has(value)) return; // hard guard
  if (trackedGoals.find(g => g.nutrient === value)) return;

  const unit = UNIT_MAP[value] || "";
  const defaultTarget = value === "hydration" ? 2 : 50;

  trackedGoals.push({
    id: uid(),
    nutrient: value,
    unit,
    target: defaultTarget,
    current: 0,
    phase: 1,
  });
}

// track-screen add btn
document.getElementById("add-track-btn").onclick = () => {
  const select = document.getElementById("add-track-select");
  const v = select.value;
  if (!v) return;
  addGoalFromValue(v);

  renderTrackList();
  renderOwnList();

  removeOptionFromSelect(select, v);
  removeOptionFromSelect(document.getElementById("add-own-select"), v);
};

// own-screen add btn
document.getElementById("add-own-btn").onclick = () => {
  const select = document.getElementById("add-own-select");
  const v = select.value;
  if (!v) return;

  addGoalFromValue(v);

  removeOptionFromSelect(select, v);
  removeOptionFromSelect(document.getElementById("add-track-select"), v);

  renderOwnList();
};

// render functions
function renderTrackList() {
  const list = document.getElementById("track-list");
  list.innerHTML = "";
  trackedGoals.forEach(g => {
    const chip = document.createElement("div");
    chip.className = "chip";
    chip.innerHTML = `<div class="label">${capitalize(g.nutrient)} — target: ${g.target}${g.unit}</div>`;
    list.appendChild(chip);
  });
}

function renderOwnList() {
  const list = document.getElementById("own-track-list");
  list.innerHTML = "";
  trackedGoals.forEach(g => {
    const card = document.createElement("div");
    card.className = "goal-card";
    card.dataset.goalId = g.id;
    card.innerHTML = `
      <div style="flex:1;">
        <strong>${capitalize(g.nutrient)}</strong>
        <div style="font-size:0.85rem; color: #bcd">${g.unit} per day</div>
      </div>
      <input type="number" step="any" min="0" value="${g.target}" title="Daily target" />
      <button class="btn-remove small">Remove</button>
    `;

    const input = card.querySelector("input");
    input.oninput = (e) => {
      const val = parseFloat(e.target.value) || 0;
      g.target = val;
      renderTrackList();
    };

    const removeBtn = card.querySelector(".btn-remove");
    removeBtn.onclick = () => {
      trackedGoals = trackedGoals.filter(x => x.id !== g.id);

      addOptionToSelect(document.getElementById("add-own-select"), g.nutrient, capitalize(g.nutrient), g.unit);
      addOptionToSelect(document.getElementById("add-track-select"), g.nutrient, capitalize(g.nutrient), g.unit);

      renderOwnList();
      renderTrackList();
    };

    list.appendChild(card);
  });

  renderTrackList();
}

// -------------------
// Garden generation and rendering
// -------------------
function initGarden() {
  show("screen-garden");

  const garden = document.getElementById("garden");
  garden.innerHTML = "";

  const totalCells = 20;
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "garden-cell";

    if (i < trackedGoals.length) {
      const g = trackedGoals[i];
      if (!g.phase) g.phase = 1;

      const img = document.createElement("img");
      img.src = `images/${g.phase}.png`;
      img.onerror = () => {
        img.style.display = "none";
        const seed = document.createElement("div");
        seed.style.width = "28px";
        seed.style.height = "28px";
        seed.style.borderRadius = "50%";
        seed.style.background = "#c89b4a";
        seed.style.boxShadow = "0 2px 4px rgba(0,0,0,0.5) inset";
        seed.title = `${capitalize(g.nutrient)} (phase ${g.phase})`;
        cell.appendChild(seed);
      };
      img.title = `${capitalize(g.nutrient)} - phase ${g.phase}`;
      cell.appendChild(img);

      cell.onclick = () => openFlower(g, i);
      cell.dataset.goalId = g.id;
    } else {
      const dry = document.createElement("div");
      dry.className = "dry-cell";
      cell.appendChild(dry);
    }

    garden.appendChild(cell);
  }
}

function computePercent(goal) {
  if (!goal || !goal.target || goal.target === 0) return 0;
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  return isNaN(pct) ? 0 : pct;
}

function refreshGardenUI() {
  const garden = document.getElementById("garden");
  if (!garden) return;
  Array.from(garden.children).forEach(cell => {
    const id = cell.dataset.goalId;
    if (!id) return;
    const goal = trackedGoals.find(g => g.id === id);
    if (!goal) return;

    const img = cell.querySelector("img");
    if (img) {
      img.src = `images/${goal.phase}.png`;
      img.title = `${capitalize(goal.nutrient)} - phase ${goal.phase}`;
    }
  });
}

// -------------------
// Flower detail (plant detail)
// -------------------
function openFlower(goal, indexOrUndefined) {
  show("screen-flower");
  const goalObj = (typeof goal === "object") ? goal : trackedGoals[indexOrUndefined];
  if (!goalObj) return;

  document.getElementById("flower-nutrient").textContent = capitalize(goalObj.nutrient);
  document.getElementById("flower-preview").innerHTML =
    `<img src="images/${goalObj.phase}.png" onerror="this.style.display='none'">`;
  document.getElementById("flower-progress-text").textContent =
    `Progress: ${goalObj.current}${goalObj.unit} / ${goalObj.target}${goalObj.unit} (${computePercent(goalObj)}%) — Phase ${goalObj.phase}`;

  const canvas = document.getElementById("flower-graph");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "#2a4863";
  ctx.strokeRect(20, 60, 260, 40);

  const pct = computePercent(goalObj);
  ctx.fillStyle = "#58c0ff";
  ctx.fillRect(22, 62, (260 * pct / 100), 36);

  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText(`${pct}%`, 130, 50);
}

// -------------------
// Add Food screen handling + OpenFoodFacts integration
// -------------------
let lastAnalyzed = null; // { foodName, grams, nutrients: {hydration,carbs,fat,protein} }

function prepareAddFood() {
  show("screen-add-food");

  document.getElementById("food-status").textContent = "Fill name + grams, then Analyze.";
  lastAnalyzed = null;

  const container = document.getElementById("food-values");
  container.innerHTML = "";

  trackedGoals.forEach(g => {
    const row = document.createElement("div");
    row.className = "food-row";
    row.innerHTML = `
      <div style="flex:1">${capitalize(g.nutrient)}</div>
      <input type="number" step="any" min="0" placeholder="0" data-goal-id="${g.id}" />
      <div style="width:28px; text-align:center">${g.unit}</div>
    `;
    container.appendChild(row);
  });
}

// Analyze button
document.getElementById("btn-food-analyze").onclick = async () => {
  const status = document.getElementById("food-status");
  const foodName = (document.getElementById("food-name").value || "").trim();
  const grams = parseFloat(document.getElementById("food-grams").value) || 0;

  if (!foodName || grams <= 0) {
    status.textContent = "Please enter a food name and grams (> 0).";
    return;
  }

  const nutrientsWanted = trackedGoals.map(g => g.nutrient).filter(n => TRACKABLE.has(n));

  status.textContent = "Analyzing with OpenFoodFacts...";
  try {
    const nutrients = await fetchNutritionFromOpenFoodFacts({
      foodName,
      grams,
      nutrientsWanted,
    });

    const inputs = Array.from(document.querySelectorAll("#food-values input"));
    inputs.forEach(inp => {
      const goalId = inp.dataset.goalId;
      const goal = trackedGoals.find(g => g.id === goalId);
      if (!goal) return;

      const v = nutrients[goal.nutrient];
      inp.value = (typeof v === "number" && isFinite(v)) ? String(round2(v)) : "0";
    });

    lastAnalyzed = { foodName, grams, nutrients };
    status.textContent = "Done. You can edit values, then press Add.";
    console.log("OpenFoodFacts nutrients (filtered):", nutrients);
  } catch (err) {
    console.error(err);
    status.textContent = "OpenFoodFacts error. Try a more specific name (brand + product).";
  }
};

// Save button
document.getElementById("btn-add-food-save").onclick = () => {
  const foodName = (document.getElementById("food-name").value || "Food").trim();

  const inputs = Array.from(document.querySelectorAll("#food-values input"));
  const additionsByGoalId = {};
  inputs.forEach(inp => {
    const id = inp.dataset.goalId;
    const val = parseFloat(inp.value) || 0;
    additionsByGoalId[id] = val;
  });

  Object.entries(additionsByGoalId).forEach(([id, addVal]) => {
    const g = trackedGoals.find(x => x.id === id);
    if (!g) return;

    g.current += addVal;

    if (g.target && g.target > 0) {
      while (g.current >= g.target) {
        g.current -= g.target;
        if (g.phase < MAX_PHASE) g.phase++;
        else {
          g.current = Math.min(g.current, g.target);
          break;
        }
      }
    }
  });

  console.log(`Added ${foodName}:`, additionsByGoalId, { analyzed: lastAnalyzed });
  refreshGardenUI();
  show("screen-garden");
};

// -------------------
// OpenFoodFacts adapter (NO API KEY NEEDED)
// -------------------
async function fetchNutritionFromOpenFoodFacts({ foodName, grams, nutrientsWanted }) {
  // Public search endpoint. Returns multiple products.
  const SEARCH_URL =
    "https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=10&search_terms=";

  // Some extra heuristics: search with the same string
  const q = encodeURIComponent(foodName);
  const r = await fetch(SEARCH_URL + q);
  if (!r.ok) throw new Error(`OpenFoodFacts search failed (${r.status})`);
  const data = await r.json();

  const products = Array.isArray(data.products) ? data.products : [];
  const product = pickBestOffProduct(products, foodName);
  if (!product || !product.nutriments) {
    // Hydration fallback for plain water/drinks
    return hydrationFallbackOnly(foodName, grams, nutrientsWanted);
  }

  const n = product.nutriments;

  // OFF nutriments are often per 100g:
  const per100 = {
    protein: toNum(n.proteins_100g),
    carbs: toNum(n.carbohydrates_100g),
    fat: toNum(n.fat_100g),
    // sometimes present:
    hydration: toNum(n.water_100g),
  };

  // Scale to grams
  const factor = grams / 100;
  let scaled = {
    protein: per100.protein * factor,
    carbs: per100.carbs * factor,
    fat: per100.fat * factor,
    hydration: per100.hydration * factor,
  };

  // If hydration missing, use fallback for drinks
  if (!scaled.hydration || scaled.hydration === 0) {
    const fb = hydrationFallbackOnly(foodName, grams, ["hydration"]);
    if (typeof fb.hydration === "number") scaled.hydration = fb.hydration;
  }

  // Return only the nutrients the user tracks
  const out = {};
  nutrientsWanted.forEach(k => {
    if (TRACKABLE.has(k)) out[k] = (typeof scaled[k] === "number" && isFinite(scaled[k])) ? scaled[k] : 0;
  });

  return out;
}

// Pick a decent product from results (best effort)
function pickBestOffProduct(products, query) {
  const q = (query || "").toLowerCase();

  // prefer products with nutriments + some name
  const withNutr = products.filter(p => p && p.nutriments);
  if (withNutr.length === 0) return null;

  // try exact-ish match on product_name
  const exact = withNutr.find(p => (p.product_name || "").toLowerCase().includes(q));
  if (exact) return exact;

  // otherwise just take first with nutriments
  return withNutr[0];
}

// Hydration fallback: treats many drinks as ~water by mass (grams -> liters)
function hydrationFallbackOnly(foodName, grams, nutrientsWanted) {
  const out = {};
  nutrientsWanted.forEach(k => out[k] = 0);

  const name = (foodName || "").toLowerCase();
  const looksLikeDrink =
    name.includes("water") ||
    name.includes("cola") ||
    name.includes("soda") ||
    name.includes("juice") ||
    name.includes("tea") ||
    name.includes("coffee") ||
    name.includes("milk");

  if (looksLikeDrink && nutrientsWanted.includes("hydration")) {
    // assume grams ~= ml; liters = grams / 1000
    out.hydration = grams / 1000;
  }
  return out;
}

// helpers
function toNum(v) {
  if (typeof v === "number" && isFinite(v)) return v;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}
function round2(x) {
  return Math.round(x * 100) / 100;
}

// -------------------
// initial sample
// -------------------
renderOwnList();
renderTrackList();
