// Hash router + pages.
const app = document.getElementById("app");
const DIFF_NAME = { E: "Easy", M: "Medium", H: "Hard" };

let searchQuery = "";
let vizOnly = false;
let hideUnderstood = false;

// --- "understood" progress, persisted in localStorage ---
const UNDERSTOOD_KEY = "algoviz.understood.v1";
function loadUnderstood() {
  try { return new Set(JSON.parse(localStorage.getItem(UNDERSTOOD_KEY) || "[]")); }
  catch { return new Set(); }
}
const understood = loadUnderstood();
function saveUnderstood() {
  try { localStorage.setItem(UNDERSTOOD_KEY, JSON.stringify([...understood])); } catch { /* storage disabled */ }
}
function isUnderstood(slug) { return understood.has(slug); }
function toggleUnderstood(slug, val) {
  const on = val === undefined ? !understood.has(slug) : val;
  if (on) understood.add(slug); else understood.delete(slug);
  saveUnderstood();
  return on;
}

function overallProgressMarkup() {
  const total = Object.keys(PROBLEMS).length;
  const done = understood.size;
  const pct = Math.round((done / total) * 100);
  return `<div class="overall-progress${done === total ? " complete" : ""}" id="overall-progress">
    <div class="op-head">
      <span class="op-title">Your progress</span>
      <span class="op-count" id="op-count">${done} / ${total} understood · ${pct}%</span>
    </div>
    <div class="op-track"><div class="op-fill" id="op-fill" style="width:${pct}%"></div></div>
  </div>`;
}

// Updates the overall progress bar in place (hero lives outside #lists, so it isn't rebuilt by renderLists).
function updateOverallProgress() {
  const total = Object.keys(PROBLEMS).length;
  const done = understood.size;
  const pct = Math.round((done / total) * 100);
  const fill = document.getElementById("op-fill");
  const count = document.getElementById("op-count");
  const wrap = document.getElementById("overall-progress");
  if (fill) fill.style.width = pct + "%";
  if (count) count.textContent = `${done} / ${total} understood · ${pct}%`;
  if (wrap) wrap.classList.toggle("complete", done === total);
}

function homePage() {
  const total = Object.keys(PROBLEMS).length;
  const vizCount = Object.keys(VIS).length;
  app.innerHTML = `
    <section class="hero">
      <h1>Visualize the optimal solution to every problem</h1>
      <p>All ${total} problems of the NeetCode 150, each with its best-known approach, complexity, and a
         <span class="badge viz">▶ interactive</span> step-by-step animation of the optimal algorithm
         running on real input — with the code line highlighted at every step.</p>
      <div class="stats">
        <div class="stat"><b>${total}</b> problems</div>
        <div class="stat"><b>${DATA.length}</b> categories</div>
        <div class="stat"><b>${vizCount}</b> interactive visualizations</div>
        <div class="stat progress-stat"><b id="understood-count">${understood.size}</b> understood</div>
      </div>
      <div class="toolbar">
        <input class="search" id="search" placeholder="Search problems… (e.g. two sum, stack)" value="${esc(searchQuery)}">
        <label class="toggle"><input type="checkbox" id="vizonly" ${vizOnly ? "checked" : ""}> Interactive only</label>
        <label class="toggle"><input type="checkbox" id="hideund" ${hideUnderstood ? "checked" : ""}> Hide understood</label>
        ${reviewRemaining().length
          ? `<a class="btn primary review-btn" href="#/review">▶ Review ${reviewRemaining().length} unchecked</a>`
          : `<span class="review-btn done">✓ All understood</span>`}
      </div>
    </section>
    ${overallProgressMarkup()}
    <div id="lists"></div>`;
  document.getElementById("search").addEventListener("input", e => {
    searchQuery = e.target.value;
    renderLists();
  });
  document.getElementById("vizonly").addEventListener("change", e => {
    vizOnly = e.target.checked;
    renderLists();
  });
  document.getElementById("hideund").addEventListener("change", e => {
    hideUnderstood = e.target.checked;
    renderLists();
  });
  // Toggle "understood" straight from a card without navigating to it.
  document.getElementById("lists").addEventListener("click", e => {
    const box = e.target.closest(".card-check");
    if (!box) return;
    e.preventDefault();
    e.stopPropagation();
    toggleUnderstood(box.dataset.slug);
    const countEl = document.getElementById("understood-count");
    if (countEl) countEl.textContent = understood.size;
    updateOverallProgress();
    renderLists();
  });
  renderLists();
}

function renderLists() {
  const q = searchQuery.trim().toLowerCase();
  const html = DATA.map(([cat, items]) => {
    const filtered = items.filter(([slug, title, , approach]) => {
      if (vizOnly && !VIS[slug]) return false;
      if (hideUnderstood && isUnderstood(slug)) return false;
      if (!q) return true;
      return (title + " " + cat + " " + approach + " " + (STATEMENTS[slug] || "")).toLowerCase().includes(q);
    });
    if (!filtered.length) return "";
    const catTotal = items.length;
    const catDone = items.reduce((n, [slug]) => n + (isUnderstood(slug) ? 1 : 0), 0);
    const catPct = Math.round((catDone / catTotal) * 100);
    return `<section class="cat">
      <h2>${esc(cat)} <em>${filtered.length}</em>
        <span class="cat-prog${catDone === catTotal ? " complete" : ""}" title="${catDone} of ${catTotal} understood">
          <span class="cat-prog-track"><span class="cat-prog-fill" style="width:${catPct}%"></span></span>
          ${catDone}/${catTotal} understood
        </span>
      </h2>
      <div class="grid">
        ${filtered.map(([slug, title, diff]) => {
          const done = isUnderstood(slug);
          return `<a class="card${done ? " understood" : ""}" href="#/p/${slug}">
            <div class="row1">
              <div class="title">${esc(title)}</div>
              ${VIS[slug] ? `<span class="badge viz">▶ interactive</span>` : ""}
              <span class="badge ${diff}">${DIFF_NAME[diff]}</span>
              <button type="button" class="card-check${done ? " on" : ""}" data-slug="${slug}"
                role="checkbox" aria-checked="${done}" title="${done ? "Understood — click to unmark" : "Mark as understood"}">✓</button>
            </div>
            <div class="approach">${esc(STATEMENTS[slug] || "")}</div>
          </a>`;
        }).join("")}
      </div>
    </section>`;
  }).join("");
  document.getElementById("lists").innerHTML = html || `<div class="no-results">No problems match “${esc(searchQuery)}”.</div>`;
}

// Renders the "Building the intuition" progression of approaches.
function approachesSection(list) {
  return `<div class="approaches">
    <h3 class="approaches-h">Building the intuition</h3>
    <p class="approaches-sub">The optimal solution is a compression of simpler ones. Read the progression to see where it comes from.</p>
    ${list.map((a, i) => `
      <details class="approach-card" open>
        <summary>
          <span class="astep">${i + 1}</span>
          <span class="aname">${esc(a.name)}</span>
          <span class="acx">${esc(a.time)} time · ${esc(a.space)} space</span>
        </summary>
        <div class="abody">
          ${a.idea.map(par => `<p>${esc(par)}</p>`).join("")}
          <pre class="acode">${esc(a.code)}</pre>
        </div>
      </details>`).join("")}
  </div>`;
}

// Mounts a visualizer, with a tab selector when a problem has multiple variants.
function mountVariants(root, variants) {
  if (variants.length === 1) {
    mountVisualizer(root, variants[0]);
    return;
  }
  root.innerHTML = `
    <div class="variant-tabs">
      ${variants.map((v, i) => `<button class="variant-tab${i === 0 ? " active" : ""}" data-vi="${i}">${esc(v.name)}</button>`).join("")}
    </div>
    <div class="viz-mount"></div>`;
  const mount = root.querySelector(".viz-mount");
  const select = i => {
    root.querySelectorAll(".variant-tab").forEach((b, bi) => b.classList.toggle("active", bi === i));
    mountVisualizer(mount, variants[i]);
  };
  root.querySelectorAll(".variant-tab").forEach(b => b.addEventListener("click", () => select(+b.dataset.vi)));
  select(0);
}

// The problem content (shared by the normal problem page and review mode).
function problemBodyHTML(p, slug, backHref) {
  return `
    <a class="back" href="${backHref}">← ${backHref === "#/review" ? "Back to review" : "All problems"}</a>
    <h1 class="ptitle">${esc(p.title)}</h1>
    <div class="pmeta">
      <span class="badge ${p.diff}">${DIFF_NAME[p.diff]}</span>
      <span class="cat-badge">${esc(p.cat)}</span>
      <a class="lc-link" href="https://leetcode.com/problems/${p.slug}/" target="_blank" rel="noopener">View on LeetCode ↗</a>
    </div>
    <label class="understand-toggle${isUnderstood(slug) ? " on" : ""}" id="understand-toggle">
      <input type="checkbox" id="understand-box" ${isUnderstood(slug) ? "checked" : ""}>
      <span class="box"></span>
      <span class="txt">${isUnderstood(slug) ? "You understand this solution" : "I understand this solution"}</span>
    </label>
    ${STATEMENTS[p.slug] ? `<div class="panel">
      <h3>Problem</h3>
      <p class="big">${esc(STATEMENTS[p.slug])}</p>
    </div>` : ""}
    ${APPROACHES[p.slug] ? approachesSection(APPROACHES[p.slug]) : `<div class="panel">
      <h3>Optimal approach</h3>
      <p class="big">${esc(p.approach)}</p>
      <div class="cx">
        <div>Time<code>${esc(p.time)}</code></div>
        <div>Space<code>${esc(p.space)}</code></div>
      </div>
    </div>`}
    <div id="vizroot"></div>`;
}

function wireProblem(slug, onToggle) {
  const box = document.getElementById("understand-box");
  box.addEventListener("change", () => {
    const on = toggleUnderstood(slug, box.checked);
    const wrap = document.getElementById("understand-toggle");
    wrap.classList.toggle("on", on);
    wrap.querySelector(".txt").textContent = on ? "You understand this solution" : "I understand this solution";
    if (onToggle) onToggle(on);
  });
  const root = document.getElementById("vizroot");
  if (VIS[slug]) {
    mountVariants(root, VIS[slug].variants || [VIS[slug]]);
  } else {
    root.innerHTML = `<div class="soon">🎬 An interactive visualization for this problem is coming soon.<br>
      New visualizers are being added — <a href="#/">browse the ${Object.keys(VIS).length} interactive ones</a> in the meantime.</div>`;
  }
}

function problemPage(slug) {
  const p = PROBLEMS[slug];
  if (!p) {
    app.innerHTML = `<a class="back" href="#/">← All problems</a><div class="no-results">Unknown problem.</div>`;
    return;
  }
  app.innerHTML = problemBodyHTML(p, slug, "#/");
  wireProblem(slug);
}

// --- Review mode: step through problems not yet marked understood ---
const ORDERED = DATA.flatMap(([, items]) => items.map(it => it[0]));
function reviewRemaining() { return ORDERED.filter(s => !isUnderstood(s)); }
function nextReview(slug, dir) {
  const i = ORDERED.indexOf(slug);
  for (let j = i + dir; j >= 0 && j < ORDERED.length; j += dir) {
    if (!isUnderstood(ORDERED[j])) return ORDERED[j];
  }
  return null;
}

function startReview() {
  const rem = reviewRemaining();
  if (!rem.length) { app.innerHTML = reviewDoneHTML(); return; }
  location.hash = "#/review/" + rem[0];
}

function reviewDoneHTML() {
  return `<a class="back" href="#/">← All problems</a>
    <div class="review-done">
      <div class="rd-emoji">🎉</div>
      <h1>All caught up</h1>
      <p>You've marked every problem understood. Uncheck any problem to send it back to the review queue.</p>
      <a class="btn primary" href="#/">Back to all problems</a>
    </div>`;
}

function reviewPage(slug) {
  const p = PROBLEMS[slug];
  if (!p) { location.hash = "#/review"; return; }
  const remaining = reviewRemaining().length;
  const done = ORDERED.length - remaining;
  const bar = `<div class="review-bar">
    <div class="rb-left">
      <span class="rb-tag">Review mode</span>
      <span class="rb-status"><b id="rb-remaining">${remaining}</b> left to review · ${done}/${ORDERED.length} understood</span>
    </div>
    <div class="rb-nav">
      <button class="btn" data-prev title="Previous unchecked problem">← Prev</button>
      <button class="btn" data-skip title="Skip to next unchecked problem">Skip →</button>
      <button class="btn primary" data-gotit title="Mark understood and go to next">Got it ✓ Next</button>
      <a class="btn" href="#/">Exit</a>
    </div>
  </div>`;
  app.innerHTML = bar + problemBodyHTML(p, slug, "#/review");

  const refreshRemaining = () => {
    const el = document.getElementById("rb-remaining");
    if (el) el.textContent = reviewRemaining().length;
  };
  wireProblem(slug, refreshRemaining);

  const go = s => { location.hash = "#/review/" + s; };
  app.querySelector("[data-prev]").addEventListener("click", () => {
    const s = nextReview(slug, -1) || reviewRemaining().filter(x => x !== slug).slice(-1)[0];
    if (s) go(s);
  });
  app.querySelector("[data-skip]").addEventListener("click", () => {
    const s = nextReview(slug, +1) || reviewRemaining().filter(x => x !== slug)[0];
    if (s) go(s);
  });
  app.querySelector("[data-gotit]").addEventListener("click", () => {
    toggleUnderstood(slug, true);
    const rem = reviewRemaining();
    if (!rem.length) { location.hash = "#/review"; return; }
    go(nextReview(slug, +1) || rem[0]);
  });
}

function route() {
  const hash = location.hash || "#/";
  window.scrollTo(0, 0);
  let m;
  if ((m = hash.match(/^#\/review\/([a-z0-9-]+)/))) reviewPage(m[1]);
  else if (hash.replace(/\/$/, "") === "#/review") startReview();
  else if ((m = hash.match(/^#\/p\/([a-z0-9-]+)/))) problemPage(m[1]);
  else homePage();
}

window.addEventListener("hashchange", route);
route();
