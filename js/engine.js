// Rendering + playback engine for step-based visualizations.
// A visualizer generates frames: { d: description, l: code line (1-based), c: [components], done?: true }
// Component types:
//   arr   {t:'arr',  label, v:[...], hl:{i:cls}, ptrs:{i:'L'|['L','R']}, ch?:true}
//   bars  {t:'bars', label, v:[...], hl:{i:cls}, ptrs:{i:...}}
//   kv    {t:'kv',   label, entries:[[k,v],...], hl:{k:cls}}
//   set   {t:'set',  label, v:[...], hl:{val:cls}}
//   stack {t:'stack',label, v:[...], hl:{i:cls}}   (index 0 = bottom)
//   vars  {t:'vars', entries:[[name,val],...], hl:{name:cls}}
//   ll    {t:'ll',   v:[{val,dir:'R'|'L'|null}], ptrs:{i:...}}
//   tree  {t:'tree', v:[15 values, null = absent], hl:{i:cls}}
// cls: p (blue) g (green) r (red) y (yellow) w (window) d (dim)

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function ptrLabels(ptrs, i) {
  if (!ptrs || ptrs[i] === undefined) return "";
  const p = ptrs[i];
  return Array.isArray(p) ? p.join(" ") : String(p);
}

function renderArr(c) {
  const cellCls = c.ch ? "cell ch" : "cell";
  const cols = c.v.map((val, i) => {
    const hl = (c.hl && c.hl[i]) ? " c-" + c.hl[i] : "";
    const lbl = ptrLabels(c.ptrs, i);
    return `<div class="col">
      <div class="${cellCls}${hl}">${esc(val)}</div>
      <div class="idx">${i}</div>
      <div class="ptr${lbl ? "" : " empty"}">${esc(lbl) || "."}</div>
    </div>`;
  }).join("");
  return block(c.label, `<div class="cells">${cols}</div>`);
}

function renderBars(c) {
  const max = Math.max(1, ...c.v.map(Number));
  const cols = c.v.map((val, i) => {
    const h = Math.max(6, Math.round((Number(val) / max) * 110));
    const hl = (c.hl && c.hl[i]) ? " c-" + c.hl[i] : "";
    const lbl = ptrLabels(c.ptrs, i);
    return `<div class="col barcol">
      <div class="bval">${esc(val)}</div>
      <div class="bar${hl}" style="height:${h}px"></div>
      <div class="idx">${i}</div>
      <div class="ptr${lbl ? "" : " empty"}">${esc(lbl) || "."}</div>
    </div>`;
  }).join("");
  return block(c.label, `<div class="cells">${cols}</div>`);
}

function renderKV(c) {
  const chips = c.entries.length
    ? c.entries.map(([k, v]) => {
        const hl = (c.hl && c.hl[k] !== undefined) ? " c-" + c.hl[k] : "";
        return `<div class="chip${hl}">${esc(k)} → ${esc(v)}</div>`;
      }).join("")
    : `<div class="chip none">empty</div>`;
  return block(c.label, `<div class="chips">${chips}</div>`);
}

function renderSet(c) {
  const chips = c.v.length
    ? c.v.map(v => {
        const hl = (c.hl && c.hl[v] !== undefined) ? " c-" + c.hl[v] : "";
        return `<div class="chip${hl}">${esc(v)}</div>`;
      }).join("")
    : `<div class="chip none">empty</div>`;
  return block(c.label, `<div class="chips">${chips}</div>`);
}

function renderStack(c) {
  const chips = c.v.length
    ? c.v.map((v, i) => {
        const hl = (c.hl && c.hl[i] !== undefined) ? " c-" + c.hl[i] : "";
        const top = i === c.v.length - 1 ? " ← top" : "";
        return `<div class="chip${hl}">${esc(v)}${top}</div>`;
      }).join("")
    : `<div class="chip none">empty</div>`;
  return block(c.label, `<div class="stackv">${chips}</div><div class="stack-base"></div>`);
}

function renderVars(c) {
  const chips = c.entries.map(([k, v]) => {
    const hl = (c.hl && c.hl[k] !== undefined) ? " c-" + c.hl[k] : "";
    return `<div class="chip varchip${hl}"><b>${esc(k)}</b> = ${esc(v)}</div>`;
  }).join("");
  return block(c.label, `<div class="chips">${chips}</div>`);
}

function renderLL(c) {
  const parts = [];
  c.v.forEach((node, i) => {
    if (i > 0) {
      const prev = c.v[i - 1];
      let g = "·", dim = " dim";
      if (prev.dir === "R" && node.dir === "L") { g = "⇄"; dim = ""; }
      else if (prev.dir === "R") { g = "→"; dim = ""; }
      else if (node.dir === "L") { g = "←"; dim = ""; }
      parts.push(`<div class="llgap${dim}">${g}</div>`);
    }
    const hl = (c.hl && c.hl[i]) ? " c-" + c.hl[i] : "";
    const lbl = ptrLabels(c.ptrs, i);
    parts.push(`<div class="col llnode">
      <div class="cell${hl}">${esc(node.val)}</div>
      <div class="llnull">${node.dir === null ? "→ ∅" : "&nbsp;"}</div>
      <div class="ptr${lbl ? "" : " empty"}">${esc(lbl) || "."}</div>
    </div>`);
  });
  return block(c.label, `<div class="llrow">${parts.join("")}</div>`);
}

function renderTree(c) {
  const W = 560, NODE_R = 18;
  const pos = i => {
    const d = Math.floor(Math.log2(i + 1));
    const k = i - (Math.pow(2, d) - 1);
    return { x: ((k + 0.5) / Math.pow(2, d)) * W, y: 34 + d * 64 };
  };
  let edges = "", nodes = "";
  c.v.forEach((val, i) => {
    if (val === null || val === undefined) return;
    const { x, y } = pos(i);
    if (i > 0) {
      const p = pos((i - 1) >> 1);
      edges += `<line class="edge" x1="${p.x}" y1="${p.y}" x2="${x}" y2="${y}"></line>`;
    }
    const hl = (c.hl && c.hl[i]) ? ` class="n-${c.hl[i]}"` : "";
    nodes += `<g${hl}><circle cx="${x}" cy="${y}" r="${NODE_R}"></circle>
      <text x="${x}" y="${y + 5}" text-anchor="middle">${esc(val)}</text></g>`;
  });
  const maxD = Math.floor(Math.log2(c.v.length));
  const H = 34 + maxD * 64 + 34;
  return block(c.label, `<svg class="treesvg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="max-width:100%">${edges}${nodes}</svg>`);
}

function renderGrid(c) {
  const rows = c.v.map((row, r) => `<div class="grow">${row.map((val, cc) => {
    const key = r + "," + cc;
    const cls = (c.hl && c.hl[key]) ? " c-" + c.hl[key] : "";
    return `<div class="cell gcell${cls}">${esc(val)}</div>`;
  }).join("")}</div>`).join("");
  return block(c.label, `<div class="gridwrap">${rows}</div>`);
}

function renderIV(c) {
  // c.v: [{s, e, cls, label}] — intervals drawn on a shared time axis
  const lo = Math.min(...c.v.map(x => x.s));
  const hi = Math.max(...c.v.map(x => x.e));
  const span = hi - lo || 1;
  const rows = c.v.map(x => {
    const left = ((x.s - lo) / span) * 100;
    const width = Math.max(3, ((x.e - x.s) / span) * 100);
    const cls = x.cls ? " c-" + x.cls : "";
    return `<div class="ivrow"><div class="ivbar${cls}" style="left:${left}%;width:${width}%">${esc(x.label ?? `[${x.s}, ${x.e}]`)}</div></div>`;
  }).join("");
  return block(c.label, `<div class="ivwrap">${rows}<div class="ivaxis"><span>${esc(lo)}</span><span>${esc(hi)}</span></div></div>`);
}

function block(label, inner) {
  return `<div class="viz-block">${label ? `<div class="viz-label">${esc(label)}</div>` : ""}${inner}</div>`;
}

const RENDERERS = { arr: renderArr, bars: renderBars, kv: renderKV, set: renderSet, stack: renderStack, vars: renderVars, ll: renderLL, tree: renderTree, grid: renderGrid, iv: renderIV };

function renderFrame(stage, frame) {
  stage.innerHTML = frame.c.map(c => RENDERERS[c.t](c)).join("");
}

// ---------- playback ----------

const SPEEDS = [["0.5×", 1700], ["1×", 1000], ["1.5×", 600], ["2×", 350]];

function mountVisualizer(root, spec) {
  // spec: {gen: (inputs) => frames, code: string, inputs: [{name,label,type,def,min,max}]}
  const codeLines = spec.code.trimEnd().split("\n");
  root.innerHTML = `
    ${spec.inputs && spec.inputs.length ? `<div class="inputs">
      ${spec.inputs.map((inp, i) => `<div class="field">
        <label>${esc(inp.label)}</label>
        <input data-i="${i}" class="${inp.type === "int" ? "short" : ""}" value="${esc(inp.def)}" spellcheck="false">
      </div>`).join("")}
      <button class="btn primary" data-run>Run ▸</button>
      <div class="input-err" data-err></div>
    </div>` : ""}
    <div class="viz-wrap">
      <div>
        <div class="stage" data-stage></div>
        <div class="descbar" data-desc></div>
        <div class="controls">
          <button class="btn" data-reset title="Reset">⏮</button>
          <button class="btn" data-prev title="Previous step">◀</button>
          <button class="btn primary" data-play title="Play / pause" style="min-width:78px">▶ Play</button>
          <button class="btn" data-next title="Next step">▶</button>
          <select data-speed>${SPEEDS.map(([l], i) => `<option value="${i}"${i === 1 ? " selected" : ""}>${l}</option>`).join("")}</select>
          <span class="counter" data-counter></span>
        </div>
        <input type="range" class="seek" data-seek min="0" value="0">
      </div>
      <div class="codepanel">
        <h3>Optimal solution</h3>
        <div class="code" data-code>
          ${codeLines.map((ln, i) => `<div class="ln" data-ln="${i + 1}"><span class="no">${i + 1}</span><span>${esc(ln) || " "}</span></div>`).join("")}
        </div>
      </div>
    </div>`;

  const $ = sel => root.querySelector(sel);
  const stage = $("[data-stage]"), desc = $("[data-desc]"), counter = $("[data-counter]");
  const seek = $("[data-seek]"), playBtn = $("[data-play]");
  const errBox = $("[data-err]");

  let frames = [], idx = 0, timer = null;

  function show(i) {
    idx = Math.max(0, Math.min(i, frames.length - 1));
    const f = frames[idx];
    renderFrame(stage, f);
    desc.textContent = f.d;
    desc.classList.toggle("done", !!f.done);
    counter.textContent = `step ${idx + 1} / ${frames.length}`;
    seek.value = idx;
    root.querySelectorAll(".ln.active").forEach(n => n.classList.remove("active"));
    if (f.l) {
      const ln = root.querySelector(`.ln[data-ln="${f.l}"]`);
      if (ln) { ln.classList.add("active"); ln.scrollIntoView({ block: "nearest" }); }
    }
    if (idx === frames.length - 1) pause();
  }

  function play() {
    if (idx >= frames.length - 1) idx = -1;
    playBtn.textContent = "❚❚ Pause";
    const delay = SPEEDS[+$("[data-speed]").value][1];
    timer = setInterval(() => {
      if (idx >= frames.length - 1) pause();
      else show(idx + 1);
    }, delay);
    show(idx + 1);
  }
  function pause() {
    if (timer) clearInterval(timer);
    timer = null;
    playBtn.textContent = "▶ Play";
  }

  function regenerate() {
    let inputs = [];
    if (spec.inputs) {
      try {
        inputs = spec.inputs.map((inp, i) => parseInput(root.querySelector(`input[data-i="${i}"]`).value, inp));
        if (errBox) errBox.textContent = "";
      } catch (e) {
        if (errBox) errBox.textContent = e.message;
        return;
      }
    }
    pause();
    frames = spec.gen(...inputs);
    seek.max = frames.length - 1;
    show(0);
  }

  playBtn.addEventListener("click", () => (timer ? pause() : play()));
  $("[data-prev]").addEventListener("click", () => { pause(); show(idx - 1); });
  $("[data-next]").addEventListener("click", () => { pause(); show(idx + 1); });
  $("[data-reset]").addEventListener("click", () => { pause(); show(0); });
  seek.addEventListener("input", () => { pause(); show(+seek.value); });
  $("[data-speed]").addEventListener("change", () => { if (timer) { pause(); play(); } });
  const runBtn = root.querySelector("[data-run]");
  if (runBtn) {
    runBtn.addEventListener("click", regenerate);
    root.querySelectorAll(".inputs input").forEach(inp =>
      inp.addEventListener("keydown", e => { if (e.key === "Enter") regenerate(); }));
  }

  regenerate();
}

function parseInput(raw, inp) {
  raw = raw.trim();
  if (inp.type === "int") {
    const n = parseInt(raw, 10);
    if (isNaN(n)) throw new Error(`${inp.label}: expected an integer`);
    const min = inp.min ?? 1, max = inp.max ?? 20;
    if (n < min || n > max) throw new Error(`${inp.label}: must be between ${min} and ${max}`);
    return n;
  }
  if (inp.type === "str") {
    const s = raw.replace(/^["']|["']$/g, "");
    if (s.length === 0) throw new Error(`${inp.label}: cannot be empty`);
    if (s.length > (inp.max ?? 20)) throw new Error(`${inp.label}: max ${inp.max ?? 20} characters`);
    return s;
  }
  if (inp.type === "words") {
    const cleaned = raw.replace(/^\[|\]$/g, "");
    const words = cleaned.split(",").map(w => w.trim().replace(/^["']|["']$/g, "")).filter(w => w);
    if (!words.length) throw new Error(`${inp.label}: cannot be empty`);
    if (words.length > (inp.max ?? 8)) throw new Error(`${inp.label}: max ${inp.max ?? 8} words`);
    if (words.some(w => w.length > 10)) throw new Error(`${inp.label}: each word max 10 characters`);
    return words;
  }
  // int array: accepts "[1,2,3]" or "1, 2, 3"
  const cleaned = raw.replace(/^\[|\]$/g, "");
  if (!cleaned.trim()) throw new Error(`${inp.label}: cannot be empty`);
  const arr = cleaned.split(",").map(x => {
    const n = parseInt(x.trim(), 10);
    if (isNaN(n)) throw new Error(`${inp.label}: "${x.trim()}" is not an integer`);
    if (Math.abs(n) > 9999) throw new Error(`${inp.label}: values must be within ±9999`);
    return n;
  });
  const maxLen = inp.max ?? 14;
  if (arr.length > maxLen) throw new Error(`${inp.label}: max ${maxLen} elements`);
  if (inp.min && arr.length < inp.min) throw new Error(`${inp.label}: needs at least ${inp.min} elements`);
  return arr;
}
