let hadFoodInputToday = false;
let currentDay = 0;

// -------------------
// Simple navigation system
// -------------------
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
// Tracking
// -------------------
const TRACKABLE = new Set(["hydration", "carbs", "fat", "protein"]);
const MAX_PHASE = 14;

const UNIT_MAP = {
  hydration: "L",
  protein: "g",
  carbs: "g",
  fat: "g",
};

// ✅ Bloem per nutrient (mapnaam in /images)
const FLOWER_FOLDER_MAP = {
  hydration: "bloem1",
  protein: "bloem2",
  carbs: "bloem3",
  fat: "bloem4",
};

// ✅ pas aan als je bestanden .jpg zijn
const IMG_EXT = "png";

// helper: juiste image path voor deze nutrient + phase
function getFlowerImagePath(goal, phase) {
  const folder = FLOWER_FOLDER_MAP[goal?.nutrient] || "bloem1";
  const p = Math.max(1, Math.min(MAX_PHASE, parseInt(phase, 10) || 1));
  return `images/${folder}/${p}.${IMG_EXT}`;
}

// Garden fixed layout
const GRID_COLS = 5;
const GRID_ROWS = 8;       // max 8 rijen
const LANE_ROWS = 2;       // 2 rijen per voedingswaarde
const MAX_LANES = Math.floor(GRID_ROWS / LANE_ROWS); // 4 lanes

// -------------------
// App state
// -------------------
let trackedGoals = []; // { id, nutrient, unit, target, current, phase, cycle }

// -------------------
// Buttons
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

document.querySelectorAll(".btn-return").forEach(btn => {
  btn.onclick = () => show(btn.dataset.target);
});

document.getElementById("btn-realistic-continue").onclick = () =>
  show("screen-track-choose");

document.getElementById("own-continue").onclick = () => {
  if (trackedGoals.length === 0) addGoalFromValue("hydration");
  initGarden();
};

document.getElementById("track-continue").onclick = () => {
  if (trackedGoals.length === 0) addGoalFromValue("hydration");
  initGarden();
};

document.getElementById("btn-change-tracked").onclick = () =>
  show("screen-track-choose");

document.getElementById("btn-add-food").onclick = () => prepareAddFood();

// -------------------
// Add/track chips logic
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
  if (!TRACKABLE.has(value)) return;
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
    cycle: 0,
  });
}

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

document.getElementById("add-own-btn").onclick = () => {
  const select = document.getElementById("add-own-select");
  const v = select.value;
  if (!v) return;

  addGoalFromValue(v);

  removeOptionFromSelect(select, v);
  removeOptionFromSelect(document.getElementById("add-track-select"), v);

  renderOwnList();
};

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
      g.target = parseFloat(e.target.value) || 0;
      renderTrackList();
    };

    card.querySelector(".btn-remove").onclick = () => {
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
// Garden rendering (8 rows fixed, 2 rows per nutrient)
// -------------------
function initGarden() {
  show("screen-garden");
  renderGarden();
}

function cellIndex(row, col) {
  return row * GRID_COLS + col;
}

function renderGarden() {
  const garden = document.getElementById("garden");
  if (!garden) return;

  garden.innerHTML = "";

  const totalCells = GRID_ROWS * GRID_COLS;
  const cells = [];

  // maak lege grid
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "garden-cell";

    const dry = document.createElement("div");
    dry.className = "dry-cell";
    cell.appendChild(dry);

    garden.appendChild(cell);
    cells.push(cell);
  }

  // max 4 nutrients laten zien (past in 8 rijen)
  const visibleGoals = trackedGoals.slice(0, MAX_LANES);

  visibleGoals.forEach((g, laneIndex) => {
    if (!g.phase) g.phase = 1;
    if (typeof g.cycle !== "number") g.cycle = 0;

    const startRow = laneIndex * LANE_ROWS; // 0,2,4,6

    const placePlant = (row, col, phase, clickable) => {
      const idx = cellIndex(row, col);
      const cell = cells[idx];
      if (!cell) return;

      cell.innerHTML = "";

      const img = document.createElement("img");
      img.src = getFlowerImagePath(g, phase);
      img.onerror = () => {
        img.style.display = "none";
        const seed = document.createElement("div");
        seed.style.width = "28px";
        seed.style.height = "28px";
        seed.style.borderRadius = "50%";
        seed.style.background = "#c89b4a";
        seed.style.boxShadow = "0 2px 4px rgba(0,0,0,0.5) inset";
        cell.appendChild(seed);
      };

      img.title = `${capitalize(g.nutrient)} - phase ${phase}`;
      cell.appendChild(img);

      cell.onclick = null;
      if (clickable) {
        cell.style.cursor = "pointer";
        cell.onclick = () => openFlower(g, laneIndex);
      }
    };

    // teken alle "volle" bloemen
    for (let c = 0; c < g.cycle; c++) {
      const rowOffset = Math.floor(c / GRID_COLS); // 0 of 1
      if (rowOffset >= LANE_ROWS) break;
      const col = c % GRID_COLS;
      placePlant(startRow + rowOffset, col, MAX_PHASE, true);
    }

    // teken actieve (groeiende) bloem
    const activeRowOffset = Math.floor(g.cycle / GRID_COLS); // 0 of 1
    const activeCol = g.cycle % GRID_COLS;

    if (activeRowOffset < LANE_ROWS) {
      placePlant(startRow + activeRowOffset, activeCol, g.phase, true);
    }
  });
}

function refreshGardenUI() {
  renderGarden();
}

// -------------------
// Flower detail
// -------------------
function computePercent(goal) {
  if (!goal || !goal.target || goal.target === 0) return 0;
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  return isNaN(pct) ? 0 : pct;
}

function openFlower(goal, indexOrUndefined) {
  show("screen-flower");
  const goalObj = (typeof goal === "object") ? goal : trackedGoals[indexOrUndefined];
  if (!goalObj) return;

  document.getElementById("flower-nutrient").textContent = capitalize(goalObj.nutrient);
  document.getElementById("flower-preview").innerHTML =
    `<img src="${getFlowerImagePath(goalObj, goalObj.phase)}" onerror="this.style.display='none'">`;

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
// Add Food + OpenFoodFacts
// -------------------
let lastAnalyzed = null;

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
    const nutrients = await fetchNutritionFromOpenFoodFacts({ foodName, grams, nutrientsWanted });

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
  } catch (err) {
    console.error(err);
    status.textContent = "OpenFoodFacts error. Try a more specific name (brand + product).";
  }
};

document.getElementById("btn-add-food-save").onclick = () => {
  const foodName = (document.getElementById("food-name").value || "Food").trim();

  const inputs = Array.from(document.querySelectorAll("#food-values input"));
  const additionsByGoalId = {};
  inputs.forEach(inp => {
    additionsByGoalId[inp.dataset.goalId] = parseFloat(inp.value) || 0;
  });

  Object.entries(additionsByGoalId).forEach(([id, addVal]) => {
    const g = trackedGoals.find(x => x.id === id);
    if (!g) return;

    g.current += addVal;

    if (g.target && g.target > 0) {
      while (g.current >= g.target) {
        g.current -= g.target;

        g.phase = (g.phase || 1) + 1;

        // als max bereikt -> nieuwe seed rechts
        if (g.phase > MAX_PHASE) {
          g.phase = 1;
          g.cycle = (typeof g.cycle === "number" ? g.cycle : 0) + 1;
        }
      }
    }
  });

  hadFoodInputToday = true;
  console.log(`Added ${foodName}:`, additionsByGoalId, { analyzed: lastAnalyzed });
  refreshGardenUI();
  show("screen-garden");
};

document.getElementById("skip-btn").addEventListener("click", () => {
  currentDay += 1;

  // als je vandaag niks hebt ingevoerd: 1 fase terug voor elke tracked goal
  if (!hadFoodInputToday) {
    trackedGoals.forEach(g => regressOnePhase(g));
  }

  hadFoodInputToday = false;

  refreshGardenUI();
  show("screen-garden");
});

// -------------------
// OpenFoodFacts adapter (NO API KEY NEEDED)
// -------------------
async function fetchNutritionFromOpenFoodFacts({ foodName, grams, nutrientsWanted }) {
  const SEARCH_URL =
    "https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=10&search_terms=";

  const q = encodeURIComponent(foodName);
  const r = await fetch(SEARCH_URL + q);
  if (!r.ok) throw new Error(`OpenFoodFacts search failed (${r.status})`);
  const data = await r.json();

  const products = Array.isArray(data.products) ? data.products : [];
  const product = pickBestOffProduct(products, foodName);

  if (!product || !product.nutriments) {
    return hydrationFallbackOnly(foodName, grams, nutrientsWanted);
  }

  const n = product.nutriments;

  const per100 = {
    protein: toNum(n.proteins_100g),
    carbs: toNum(n.carbohydrates_100g),
    fat: toNum(n.fat_100g),
    hydration: toNum(n.water_100g),
  };

  const factor = grams / 100;

  let scaled = {
    protein: per100.protein * factor,
    carbs: per100.carbs * factor,
    fat: per100.fat * factor,
    hydration: per100.hydration * factor,
  };

  if (!scaled.hydration || scaled.hydration === 0) {
    const fb = hydrationFallbackOnly(foodName, grams, ["hydration"]);
    if (typeof fb.hydration === "number") scaled.hydration = fb.hydration;
  }

  const out = {};
  nutrientsWanted.forEach(k => {
    if (TRACKABLE.has(k)) out[k] = (typeof scaled[k] === "number" && isFinite(scaled[k])) ? scaled[k] : 0;
  });

  return out;
}

function pickBestOffProduct(products, query) {
  const q = (query || "").toLowerCase();
  const withNutr = products.filter(p => p && p.nutriments);
  if (withNutr.length === 0) return null;

  const exact = withNutr.find(p => (p.product_name || "").toLowerCase().includes(q));
  if (exact) return exact;

  return withNutr[0];
}

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
    out.hydration = grams / 1000;
  }
  return out;
}

function toNum(v) {
  if (typeof v === "number" && isFinite(v)) return v;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function round2(x) {
  return Math.round(x * 100) / 100;
}

function regressOnePhase(goal) {
  if (!goal) return;

  if ((goal.phase || 1) <= 1) {
    if ((goal.cycle || 0) > 0) {
      goal.cycle -= 1;
      goal.phase = MAX_PHASE;
    } else {
      goal.phase = 1;
    }
  } else {
    goal.phase -= 1;
  }

  goal.current = 0;
}

// -------------------
// initial
// -------------------
renderOwnList();
renderTrackList();
