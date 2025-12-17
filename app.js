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

// -------------------
// App state
// -------------------
let trackedGoals = []; // each: { id, nutrient, unit, target, current, phase }
const MAX_PHASE = 14;

// Unit defaults
const UNIT_MAP = {
  hydration: 'L',
  protein: 'g',
  carbs: 'g',
  fibers: 'g'
};

// -------------------
// Buttons / navigation wiring
// -------------------
document.getElementById("btn-gen-realistic").onclick = () => {
  // read welcome inputs and print age to console
  const name = document.getElementById("username").value;
  const dob = document.getElementById("dob").value;
  const gender = document.getElementById("gender-welcome").value;
  const length = document.getElementById("length").value;
  const weight = document.getElementById("weight").value;
  const age = calculateAge(dob);
  console.log("User info (welcome):", { name, dob, age, gender, length, weight });
  if (age !== null) console.log("Age:", age);

  // show error screen
  show("screen-error-realistic");
};

document.getElementById("btn-gen-own").onclick = () => {
  // read welcome inputs and print age to console
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
  // if no trackedGoals, seed with hydration default
  if (trackedGoals.length === 0) {
    addGoalFromOption({ value: 'hydration', unit: UNIT_MAP['hydration'], defaultTarget: 2 });
  }
  initGarden();
};

// After tracking choose → garden
document.getElementById("track-continue").onclick = () => {
  // build trackedGoals from track-list chips if not already
  // (we already add when chips created)
  if (trackedGoals.length === 0) {
    addGoalFromOption({ value: 'hydration', unit: UNIT_MAP['hydration'], defaultTarget: 2 });
  }
  initGarden();
};

document.getElementById("btn-change-tracked").onclick = () =>
  show("screen-track-choose");

document.getElementById("btn-add-food").onclick = () =>
  prepareAddFood();

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
  // avoid duplicates
  if (optionElementByValue(selectEl, value)) return;
  const o = document.createElement("option");
  o.value = value;
  o.textContent = label;
  if (unit) o.dataset.unit = unit;
  selectEl.appendChild(o);
}

function addGoalFromOption(opt) {
  // opt: { value, unit, defaultTarget }
  const value = opt.value;
  // check not already exist
  if (trackedGoals.find(g => g.nutrient === value)) return;

  const newGoal = {
    id: uid(),
    nutrient: value,
    unit: opt.unit || UNIT_MAP[value] || '',
    target: opt.defaultTarget || 1,
    current: 0,
    phase: 1
  };
  trackedGoals.push(newGoal);
}

// track-screen add btn
document.getElementById("add-track-btn").onclick = () => {
  const select = document.getElementById("add-track-select");
  const v = select.value;
  if (!v) return;
  const unit = select.selectedOptions[0]?.dataset.unit || UNIT_MAP[v] || '';
  // create chip in track-list and add to trackedGoals if missing
  if (!trackedGoals.find(g => g.nutrient === v)) {
    const defaultTarget = v === 'hydration' ? 2 : 50;
    trackedGoals.push({
      id: uid(),
      nutrient: v,
      unit,
      target: defaultTarget,
      current: 0,
      phase: 1
    });
    renderTrackList();
    // remove option so user cannot add same one again
    removeOptionFromSelect(select, v);
    // also remove from own select to keep consistent
    removeOptionFromSelect(document.getElementById("add-own-select"), v);
  }
};

// own-screen add btn — show goal card with editable target and remove
document.getElementById("add-own-btn").onclick = () => {
  const select = document.getElementById("add-own-select");
  const v = select.value;
  if (!v) return;
  if (trackedGoals.find(g => g.nutrient === v)) return;

  const unit = select.selectedOptions[0]?.dataset.unit || UNIT_MAP[v] || '';
  const defaultTarget = v === 'hydration' ? 2 : 50;

  const goal = {
    id: uid(),
    nutrient: v,
    unit,
    target: defaultTarget,
    current: 0,
    phase: 1
  };
  trackedGoals.push(goal);

  // remove option in both selects so cannot re-add
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
    // wire input change and remove
    const input = card.querySelector("input");
    input.oninput = (e) => {
      const val = parseFloat(e.target.value) || 0;
      g.target = val;
      renderTrackList(); // keep track-list up to date display
    };
    const removeBtn = card.querySelector(".btn-remove");
    removeBtn.onclick = () => {
      // remove from trackedGoals
      trackedGoals = trackedGoals.filter(x => x.id !== g.id);
      // re-add option to selects
      addOptionToSelect(document.getElementById("add-own-select"), g.nutrient, capitalize(g.nutrient), g.unit);
      addOptionToSelect(document.getElementById("add-track-select"), g.nutrient, capitalize(g.nutrient), g.unit);
      renderOwnList();
      renderTrackList();
    };

    list.appendChild(card);
  });
  renderTrackList();
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// -------------------
// Garden generation and rendering
// -------------------
function initGarden() {
  show("screen-garden");

  const garden = document.getElementById("garden");
  garden.innerHTML = "";

  // make 20 cells. For first n (trackedGoals.length) place seeds (phase=1)
  const totalCells = 20;
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "garden-cell";

    if (i < trackedGoals.length) {
      const g = trackedGoals[i];
      // ensure goal phase at least 1
      if (!g.phase) g.phase = 1;

      const img = document.createElement("img");
      img.src = `images/${g.phase}.png`;
      img.onerror = () => {
        // fallback to small seed representation: a circle via data URL or just empty
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

      // // small progress bar
      // const bar = document.createElement("div");
      // bar.className = "progress-bar";
      // bar.innerHTML = `<div class="progress-fill" style="width:${computePercent(g)}%"></div>`;
      // cell.appendChild(bar);
      // (Removed progress bar under each plant — now visible only in detail screen)

      cell.onclick = () => openFlower(g, i);

      // store reference for later updates
      cell.dataset.goalId = g.id;

    } else {
      // dry field cell
      const dry = document.createElement("div");
      dry.className = "dry-cell";
      cell.appendChild(dry);
    }

    garden.appendChild(cell);
  }
}

// compute percentage (0..100)
function computePercent(goal) {
  if (!goal || !goal.target || goal.target === 0) return 0;
  const pct = Math.min(100, Math.round((goal.current / goal.target) * 100));
  return isNaN(pct) ? 0 : pct;
}

// update garden UI progress visuals and images
function refreshGardenUI() {
  const garden = document.getElementById("garden");
  if (!garden) return;
  Array.from(garden.children).forEach(cell => {
    const id = cell.dataset.goalId;
    if (!id) return;
    const goal = trackedGoals.find(g => g.id === id);
    if (!goal) return;
    // update image
    const img = cell.querySelector("img");
    if (img) {
      img.src = `images/${goal.phase}.png`;
      img.title = `${capitalize(goal.nutrient)} - phase ${goal.phase}`;
    }
    // update progress fill
    const fill = cell.querySelector(".progress-fill");
    if (fill) {
      fill.style.width = computePercent(goal) + "%";
    }
  });
}

// -------------------
// Flower detail (plant detail)
// -------------------
function openFlower(goal, indexOrUndefined) {
  show("screen-flower");
  const goalObj = (typeof goal === 'object') ? goal : trackedGoals[indexOrUndefined];
  if (!goalObj) return;

  document.getElementById("flower-nutrient").textContent = capitalize(goalObj.nutrient);
  document.getElementById("flower-preview").innerHTML =
    `<img src="images/${goalObj.phase}.png" onerror="this.style.display='none'">`;
  document.getElementById("flower-progress-text").textContent =
    `Progress: ${goalObj.current}${goalObj.unit} / ${goalObj.target}${goalObj.unit} (${computePercent(goalObj)}%) — Phase ${goalObj.phase}`;

  // simple canvas graph: show a single bar to visualize percent
  const canvas = document.getElementById("flower-graph");
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // draw background
  ctx.fillStyle = "#0b1220";
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // draw border
  ctx.strokeStyle = "#2a4863";
  ctx.strokeRect(20,60,260,40);
  // fill percent
  const pct = computePercent(goalObj);
  ctx.fillStyle = "#58c0ff";
  ctx.fillRect(22,62, (260 * pct / 100), 36);
  ctx.fillStyle = "#fff";
  ctx.font = "16px Arial";
  ctx.fillText(`${pct}%`, 130, 50);
}

// -------------------
// Add Food screen handling
// -------------------
function prepareAddFood() {
  show("screen-add-food");
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

document.getElementById("btn-add-food-save").onclick = () => {
  const foodName = document.getElementById("food-name").value || 'Food';
  const inputs = Array.from(document.querySelectorAll("#food-values input"));
  const additions = {};

  inputs.forEach(inp => {
    const id = inp.dataset.goalId;
    const val = parseFloat(inp.value) || 0;
    if (!additions[id]) additions[id] = 0;
    additions[id] += val;
  });

  // Apply additions to trackedGoals
  Object.entries(additions).forEach(([id, addVal]) => {
    const g = trackedGoals.find(x => x.id === id);
    if (!g) return;
    g.current += addVal;
    // check for progress >= target -> advance phases accordingly
    if (g.target && g.target > 0) {
      while (g.current >= g.target) {
        g.current -= g.target;
        if (g.phase < MAX_PHASE) g.phase++;
        else {
          // if already at max phase, keep at max and cap current to target
          g.current = Math.min(g.current, g.target);
          break;
        }
      }
    }
  });

  console.log(`Added ${foodName}:`, additions);
  // refresh UI
  refreshGardenUI();
  // go back to garden
  show("screen-garden");
};

// -------------------
// initial sample: keep empty trackedGoals until user adds
// -------------------
renderOwnList();
renderTrackList();
