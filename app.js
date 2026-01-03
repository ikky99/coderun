let hadFoodInputToday = false;

// -------------------
// Simple navigation system
// -------------------
function show(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  const screen = document.getElementById(id);
  if (screen) screen.classList.add("active");

  updateContinueButtons();
  updateWorkoutVisibility(); 
  
  updateAddRowVisibility();
}



const FLOWER_STAGE_TEXT = {
  1: "Stage 1 – Seed planted\nA tiny seed drops into the soil. Your adventure has officially begun. Every great garden starts here.",
  2: "Stage 2 – Seed takes root\nThe seed wiggles and settles in. Roots are forming beneath the surface. Something good is coming.",
  3: "Stage 3 – Sprout emerges\nPop! A little sprout breaks through the ground. Your effort is already paying off. Keep feeding that momentum.",
  4: "Stage 4 – First leaves form\nFresh green leaves unfold. The plant is finding its rhythm. You’re doing great so far.",
  5: "Stage 5 – Plant strengthens\nThe stem grows taller and sturdier. This plant means business now. Your consistency is showing.",
  6: "Stage 6 – Buds appear\nTiny buds appear like secret surprises. The plant is getting ready for something special. Stay on track!",
  7: "Stage 7 – Protective leaves grow\nThe buds are wrapped up safely. The flower is almost ready to shine. One more push!",
  8: "Stage 8 – First petal grows\nThe first petal peeks out. Blooming has officially started. That’s a win!",
  9: "Stage 9 – Second petal grows\nAnother petal joins the party. The flower is coming to life. Progress looks good on you.",
  10: "Stage 10 – Third petal grows\nMore petals, more color. The bloom is getting fuller by the day. Keep stacking those successes.",
  11: "Stage 11 – Fourth petal grows\nThe flower is almost complete. It’s looking healthy and happy. Your streak is strong.",
  12: "Stage 12 – Fifth petal grows\nJust one step away! The flower is nearly at full power. Don’t stop now.",
  13: "Stage 13 – Final petal completes the flower\nBoom! The flower is fully bloomed. You’ve reached the goal. Take a moment to admire it.",
  14: "Stage 14 – Seeds spread\nThe flower scatters its seeds across the garden. Your success creates new growth. Let the cycle begin again!"
};


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

function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

function requireAtLeastOneGoal() {
  if (trackedGoals.length === 0) {
    alert("Please add at least one goal before continuing.");
    return false;
  }
  return true;
}


function updateContinueButtons() {
  const disabled = trackedGoals.length === 0;

  const ownBtn = document.getElementById("own-continue");
  const trackBtn = document.getElementById("track-continue");

  if (ownBtn) ownBtn.disabled = disabled;
  if (trackBtn) trackBtn.disabled = disabled;
}


function updateAddRowVisibility() {
  const show = trackedGoals.length < TRACKABLE.size;

  const trackRow = document.getElementById("add-track-row");
  const ownRow = document.getElementById("add-own-row");

  if (trackRow) trackRow.style.display = show ? "flex" : "none";
  if (ownRow) ownRow.style.display = show ? "flex" : "none";
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

// Bloem per nutrient (/images)
const FLOWER_FOLDER_MAP = {
  hydration: "bloem1",
  protein: "bloem2",
  carbs: "bloem3",
  fat: "bloem4",
};

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

let goalMode = null; // "realistic" | "own" | null
let userProfile = null; // { age, gender, heightCm, weightKg, name }

// -------------------
// Buttons
// -------------------
document.getElementById("btn-gen-realistic").onclick = () => {
  const name = (document.getElementById("username").value || "").trim();
  const dob = document.getElementById("dob").value;
  const gender = document.getElementById("gender-welcome").value;
  const heightCm = parseFloat(document.getElementById("length").value);
  const weightKg = parseFloat(document.getElementById("weight").value);
  const age = calculateAge(dob);

  if (!age || !heightCm || !weightKg) {
    alert("Please fill in date of birth, length (cm) and weight (kg).");
    return;
  }

  goalMode = "realistic";
  userProfile = { name, age, gender, heightCm, weightKg };

  // reset nutrients selection
  trackedGoals = [];
  resetTrackSelects();

  
  updateAddRowVisibility();
  renderTrackList();
  renderOwnList();

  // hint off for now
  document.getElementById("realistic-hint").style.display = "none";

  // Show the new info screen
  show("screen-info-goals");
};

// Continue from info screen to activity + track selection
document.getElementById("btn-info-continue").onclick = () => {
  document.getElementById("realistic-hint").style.display = "block";
  show("screen-track-choose");
};


document.getElementById("btn-gen-own").onclick = () => {
  const name = (document.getElementById("username").value || "").trim();
  const dob = document.getElementById("dob").value;
  const gender = document.getElementById("gender-welcome").value;
  const heightCm = parseFloat(document.getElementById("length").value);
  const weightKg = parseFloat(document.getElementById("weight").value);
  const age = calculateAge(dob);

  goalMode = "own"; // or "realistic"
updateWorkoutVisibility();

  userProfile = { name, age, gender, heightCm, weightKg };

  // ✅ ADD THIS
  trackedGoals = [];
  resetTrackSelects();
  renderOwnList();
  renderTrackList();
  updateContinueButtons();
  
  updateAddRowVisibility();

  document.getElementById("realistic-hint").style.display = "none";

  show("screen-gen-own");
};

function updateWorkoutVisibility() {
  const wrapper = document.getElementById("workouts-wrapper");
  if (!wrapper) return;
  wrapper.style.display = (goalMode === "realistic") ? "block" : "none";
}



document.querySelectorAll(".btn-return").forEach(btn => {
  btn.onclick = () => {
    // als je teruggaat naar welcome, hint uitzetten
    if (btn.dataset.target === "screen-welcome") {
      document.getElementById("realistic-hint").style.display = "none";
    }
    show(btn.dataset.target);
  };
});

// kept but not used
document.getElementById("btn-realistic-continue").onclick = () =>
  show("screen-track-choose");

document.getElementById("own-continue").onclick = () => {
  if (!requireAtLeastOneGoal()) return;
  show("screen-info-intro");
};


document.getElementById("track-continue").onclick = () => {
  if (!requireAtLeastOneGoal()) return;

  if (goalMode === "realistic") {
    const workouts = parseInt(
      document.getElementById("workouts-per-week").value,
      10
    ) || 0;

    applyRealisticTargets({
      profile: userProfile,
      workoutsPerWeek: workouts
    });

    renderTrackList();
  }

  show("screen-info-intro");
};




document.getElementById("btn-change-tracked").onclick = () => {
  resetTrackSelects();
  
updateAddRowVisibility();

  trackedGoals.forEach(g => {
    removeOptionFromSelect(
      document.getElementById("add-track-select"),
      g.nutrient
    );
    removeOptionFromSelect(
      document.getElementById("add-own-select"),
      g.nutrient
    );
  });

  document.getElementById("realistic-hint").style.display =
    (goalMode === "realistic") ? "block" : "none";

  renderTrackList();
  show("screen-track-choose");
};



document.getElementById("btn-add-food").onclick = () => prepareAddFood();

// -------------------
// Select reset
// -------------------
function resetTrackSelects() {
  const addTrack = document.getElementById("add-track-select");
  const addOwn = document.getElementById("add-own-select");

  addTrack.innerHTML = "";
  addOwn.innerHTML = "";

  const opts = [
    { v: "hydration", label: "Hydration", unit: "L" },
    { v: "protein", label: "Protein", unit: "g" },
    { v: "carbs", label: "Carbs", unit: "g" },
    { v: "fat", label: "Fat", unit: "g" },
  ];

  opts.forEach(o => {
    const a = document.createElement("option");
    a.value = o.v;
    a.textContent = o.label;
    a.dataset.unit = o.unit;
    addTrack.appendChild(a);

    const b = document.createElement("option");
    b.value = o.v;
    b.textContent = o.label;
    b.dataset.unit = o.unit;
    addOwn.appendChild(b);
  });
}

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

  updateContinueButtons();
  
  updateAddRowVisibility();
}


document.getElementById("add-track-btn").onclick = () => {
  const select = document.getElementById("add-track-select");
  const v = select.value;
  if (!v) return;

  addGoalFromValue(v);
  updateAddRowVisibility();
  // als realistic mode: targets meteen updaten (op basis van huidige workouts)
  if (goalMode === "realistic") {
    const workouts = parseInt(document.getElementById("workouts-per-week").value, 10) || 0;
    applyRealisticTargets({ profile: userProfile, workoutsPerWeek: workouts });
  }

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
  updateAddRowVisibility();

  removeOptionFromSelect(select, v);
  removeOptionFromSelect(document.getElementById("add-track-select"), v);

  renderOwnList();
};

function renderTrackList() {
  const list = document.getElementById("track-list");
  list.innerHTML = "";

  trackedGoals.forEach(g => {
    const card = document.createElement("div");
    card.className = "goal-card";

    card.innerHTML = `
      <div style="flex:1">
        <strong>${capitalize(g.nutrient)}</strong>
        <div style="font-size:0.8rem; opacity:0.8">${g.unit} per day</div>
      </div>

      <input type="number" step="any" min="0" value="${round2(g.target)}" />

      <button class="btn-remove small">Remove</button>
    `;

    /* edit target */
    card.querySelector("input").oninput = (e) => {
      g.target = parseFloat(e.target.value) || 0;
    };

    /* remove goal */
    card.querySelector(".btn-remove").onclick = () => {
      trackedGoals = trackedGoals.filter(x => x.id !== g.id);

      addOptionToSelect(
        document.getElementById("add-track-select"),
        g.nutrient,
        capitalize(g.nutrient),
        g.unit
      );

      addOptionToSelect(
        document.getElementById("add-own-select"),
        g.nutrient,
        capitalize(g.nutrient),
        g.unit
      );

      renderTrackList();
      updateContinueButtons();
      updateAddRowVisibility();
    };

    list.appendChild(card);
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

      <input
        type="number"
        step="any"
        min="0"
        value="${g.target}"
        title="Daily target"
      />

      <button class="btn-remove small">Remove</button>
    `;

    // ✅ FIX: correctly get the input
    const input = card.querySelector("input");

    input.oninput = (e) => {
      g.target = parseFloat(e.target.value) || 0;
      renderTrackList();
    };

    card.querySelector(".btn-remove").onclick = () => {
      trackedGoals = trackedGoals.filter(x => x.id !== g.id);

      addOptionToSelect(
        document.getElementById("add-own-select"),
        g.nutrient,
        capitalize(g.nutrient),
        g.unit
      );

      addOptionToSelect(
        document.getElementById("add-track-select"),
        g.nutrient,
        capitalize(g.nutrient),
        g.unit
      );

      renderOwnList();
      renderTrackList();
      updateContinueButtons();
      updateAddRowVisibility();
    };

    list.appendChild(card);
  });

  renderTrackList();
}



// -------------------
// REALISTIC GOALS (NEW)
// -------------------
function applyRealisticTargets({ profile, workoutsPerWeek }) {
  if (!profile) return;

  const age = profile.age;
  const gender = profile.gender;
  const weightKg = profile.weightKg;
  const heightCm = profile.heightCm;

  // Mifflin-St Jeor BMR
  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  let s = 0;
  if (gender === "male") s = 5;
  else if (gender === "female") s = -161;
  else s = -78; // "other" -> midden tussen man/vrouw als simpele benadering

  const bmr = base + s;

  // Activity factor gebaseerd op workouts/week
  const w = clamp(workoutsPerWeek, 0, 7);
  let af = 1.2;
  if (w >= 2 && w <= 3) af = 1.375;
  else if (w >= 4 && w <= 5) af = 1.55;
  else if (w >= 6) af = 1.725;

  const tdee = bmr * af;

  // Protein g/kg
  let proteinPerKg = 1.2;
  if (w >= 2 && w <= 3) proteinPerKg = 1.6;
  if (w >= 4) proteinPerKg = 1.8;

  const proteinG = clamp(proteinPerKg * weightKg, 60, 220);

  // Fat % calories
  const fatPct = (w >= 4) ? 0.30 : 0.25;
  const fatG = clamp((tdee * fatPct) / 9, 40, 140);

  // Carbs = rest
  const kcalProtein = proteinG * 4;
  const kcalFat = fatG * 9;
  const remaining = Math.max(0, tdee - kcalProtein - kcalFat);
  const carbsG = clamp(remaining / 4, 80, 500);

  // Hydration: 35ml/kg + 0.4L per workout
  const hydrationL = clamp((35 * weightKg) / 1000 + (0.4 * w), 1.5, 5.0);

  // Apply only to selected tracked goals
trackedGoals.forEach(g => {

  if (g.nutrient === "protein") g.target = round2(proteinG);
  if (g.nutrient === "fat") g.target = round2(fatG);
  if (g.nutrient === "carbs") g.target = round2(carbsG);
  if (g.nutrient === "hydration") g.target = round2(hydrationL);
});


  console.log("Realistic targets applied:", {
    profile,
    workoutsPerWeek: w,
    bmr: round2(bmr),
    tdee: round2(tdee),
    targets: {
      proteinG: round2(proteinG),
      fatG: round2(fatG),
      carbsG: round2(carbsG),
      hydrationL: round2(hydrationL),
    }
  });
}

// als workouts/week verandert, meteen targets updaten (alleen in realistic mode)
document.getElementById("workouts-per-week").addEventListener("change", () => {
  if (goalMode !== "realistic") return;
  const workouts = parseInt(document.getElementById("workouts-per-week").value, 10) || 0;
  applyRealisticTargets({ profile: userProfile, workoutsPerWeek: workouts });
  renderTrackList();
});

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
    `Progress: ${round2(goalObj.current)}${goalObj.unit} / ${round2(goalObj.target)}${goalObj.unit} (${computePercent(goalObj)}%) — Phase ${goalObj.phase}`;

  const stageTextEl = document.getElementById("flower-stage-text");
  const phase = clamp(goalObj.phase || 1, 1, MAX_PHASE);

  stageTextEl.textContent =
  FLOWER_STAGE_TEXT[phase] || "";

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
    status.className = "status status-error";
    return;
  }

  // SHOW LOADING STATE
  status.textContent = "Analyzing with OpenFoodFacts...";
  status.className = "status status-loading";

  const nutrientsWanted = trackedGoals.map(g => g.nutrient).filter(n => TRACKABLE.has(n));

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

    // SHOW SUCCESS STATE
    if (Object.values(nutrients).every(v => v === 0)) {
      status.textContent = `Food "${foodName}" found but no nutritional data available.`;
      status.className = "status status-error";
    } else {
      status.textContent = `Food "${foodName}" found and analyzed. You can edit values, then press Add.`;
      status.className = "status status-success";
    }

  } catch (err) {
    console.error(err);
    status.textContent = `Error analyzing "${foodName}". Try a more specific name (brand + product).`;
    status.className = "status status-error";
  }
};

document.getElementById("food-name").addEventListener("input", () => {
  const status = document.getElementById("food-status");
  status.textContent = "Fill name + grams, then Analyze.";
  status.className = "status status-idle";
});



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
  renderGarden();
  show("screen-garden");
};

document.getElementById("skip-btn").addEventListener("click", () => {


  // als je vandaag niks hebt ingevoerd: 1 fase terug voor elke tracked goal
  if (!hadFoodInputToday) {
    trackedGoals.forEach(g => regressOnePhase(g));
  }

  hadFoodInputToday = false;

  renderGarden();
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


document.getElementById("btn-start-garden").onclick = () => {
  initGarden();
};


// -------------------
// initial
// -------------------


renderOwnList();
renderTrackList();
updateContinueButtons();
updateAddRowVisibility();


