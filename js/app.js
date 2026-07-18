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
      <p>All ${total} problems of the NeetCode 150, each with its best-known approach, complexity, and a
         <span class="badge viz">▶ interactive</span> step-by-step animation of the optimal algorithm
         running on real input — with the code line highlighted at every step.</p>
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
      return (title + " " + cat + " " + approach + " " + (STATEMENTS[slug] || "")).toLowerCase().includes(q);
    });
    if (!filtered.length) return "";
    return `<section class="cat">
      <h2>${esc(cat)} <em>${filtered.length}</em></h2>
      <div class="grid">
        ${filtered.map(([slug, title, diff]) => `
          <a class="card" href="#/p/${slug}">
            <div class="row1">
              <div class="title">${esc(title)}</div>
              ${VIS[slug] ? `<span class="badge viz">▶ interactive</span>` : ""}
              <span class="badge ${diff}">${DIFF_NAME[diff]}</span>
            </div>
            <div class="approach">${esc(STATEMENTS[slug] || "")}</div>
          </a>`).join("")}
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
  const root = document.getElementById("vizroot");
  if (VIS[slug]) {
    mountVariants(root, VIS[slug].variants || [VIS[slug]]);
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
