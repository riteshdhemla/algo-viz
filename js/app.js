// Hash router + pages.
const app = document.getElementById("app");
const DIFF_NAME = { E: "Easy", M: "Medium", H: "Hard" };

let searchQuery = "";
let vizOnly = false;

function homePage() {
  const total = Object.keys(PROBLEMS).length;
  const vizCount = Object.keys(VIS).length;
  app.innerHTML = `
    <section class="hero">
      <h1>Visualize the optimal solution to every problem</h1>
      <p>The ${total} problems of the NeetCode 150, each with its best-known approach and complexity.
         Problems marked <span class="badge viz">▶ interactive</span> have a step-by-step animation of the
         optimal algorithm running on real input — with the code line highlighted at every step.</p>
      <div class="stats">
        <div class="stat"><b>${total}</b> problems</div>
        <div class="stat"><b>${DATA.length}</b> categories</div>
        <div class="stat"><b>${vizCount}</b> interactive visualizations</div>
      </div>
      <div class="toolbar">
        <input class="search" id="search" placeholder="Search problems… (e.g. two sum, stack)" value="${esc(searchQuery)}">
        <label class="toggle"><input type="checkbox" id="vizonly" ${vizOnly ? "checked" : ""}> Interactive only</label>
      </div>
    </section>
    <div id="lists"></div>`;
  document.getElementById("search").addEventListener("input", e => {
    searchQuery = e.target.value;
    renderLists();
  });
  document.getElementById("vizonly").addEventListener("change", e => {
    vizOnly = e.target.checked;
    renderLists();
  });
  renderLists();
}

function renderLists() {
  const q = searchQuery.trim().toLowerCase();
  const html = DATA.map(([cat, items]) => {
    const filtered = items.filter(([slug, title, , approach]) => {
      if (vizOnly && !VIS[slug]) return false;
      if (!q) return true;
      return (title + " " + cat + " " + approach).toLowerCase().includes(q);
    });
    if (!filtered.length) return "";
    return `<section class="cat">
      <h2>${esc(cat)} <em>${filtered.length}</em></h2>
      <div class="grid">
        ${filtered.map(([slug, title, diff, approach]) => `
          <a class="card" href="#/p/${slug}">
            <div class="row1">
              <div class="title">${esc(title)}</div>
              ${VIS[slug] ? `<span class="badge viz">▶ interactive</span>` : ""}
              <span class="badge ${diff}">${DIFF_NAME[diff]}</span>
            </div>
            <div class="approach">${esc(approach)}</div>
          </a>`).join("")}
      </div>
    </section>`;
  }).join("");
  document.getElementById("lists").innerHTML = html || `<div class="no-results">No problems match “${esc(searchQuery)}”.</div>`;
}

function problemPage(slug) {
  const p = PROBLEMS[slug];
  if (!p) {
    app.innerHTML = `<a class="back" href="#/">← All problems</a><div class="no-results">Unknown problem.</div>`;
    return;
  }
  app.innerHTML = `
    <a class="back" href="#/">← All problems</a>
    <h1 class="ptitle">${esc(p.title)}</h1>
    <div class="pmeta">
      <span class="badge ${p.diff}">${DIFF_NAME[p.diff]}</span>
      <span class="cat-badge">${esc(p.cat)}</span>
      <a class="lc-link" href="https://leetcode.com/problems/${p.slug}/" target="_blank" rel="noopener">View on LeetCode ↗</a>
    </div>
    <div class="panel">
      <h3>Optimal approach</h3>
      <p class="big">${esc(p.approach)}</p>
      <div class="cx">
        <div>Time<code>${esc(p.time)}</code></div>
        <div>Space<code>${esc(p.space)}</code></div>
      </div>
    </div>
    <div id="vizroot"></div>`;
  const root = document.getElementById("vizroot");
  if (VIS[slug]) {
    mountVisualizer(root, VIS[slug]);
  } else {
    root.innerHTML = `<div class="soon">🎬 An interactive visualization for this problem is coming soon.<br>
      New visualizers are being added — <a href="#/">browse the ${Object.keys(VIS).length} interactive ones</a> in the meantime.</div>`;
  }
}

function route() {
  const hash = location.hash || "#/";
  const m = hash.match(/^#\/p\/([a-z0-9-]+)/);
  window.scrollTo(0, 0);
  if (m) problemPage(m[1]);
  else homePage();
}

window.addEventListener("hashchange", route);
route();
