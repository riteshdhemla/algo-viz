# AlgoViz — LeetCode Solution Visualizer

A website that visualizes the **best possible (optimal) solution** to LeetCode problems,
starting with the [NeetCode 150](https://neetcode.io/practice/practice/neetcode150) problem list.

## What it does

- **All 150 problems** across 18 categories (Arrays & Hashing, Two Pointers, Sliding Window, Stack,
  Binary Search, Linked List, Trees, Tries, Heap, Backtracking, Graphs, DP, Greedy, Intervals,
  Math & Geometry, Bit Manipulation), each with:
  - the optimal approach explained in one sentence
  - time and space complexity
  - a link to the problem on LeetCode
- **Interactive step-by-step visualizations for all 150 problems** — every problem animates its
  optimal algorithm running on real input:
  - play / pause / step / seek / speed controls
  - the Python solution shown alongside, with the **current line highlighted at every step**
  - animated arrays, bars, hash maps, sets, stacks, linked lists, binary trees, grids,
    interval timelines, and 2-D DP tables
  - editable inputs — run the algorithm on your own data
- Search and "interactive only" filtering on the home page.

## Running locally

It's a fully static site with zero dependencies — no build step.

```bash
# any static file server works:
python3 -m http.server 8000
# then open http://localhost:8000
```

Or just open `index.html` directly in a browser.

## Deploying to GitHub Pages

A deploy workflow is included at `.github/workflows/pages.yml`. To get a live URL:

1. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions** (one-time).
2. Merge this branch to `main` (or run the workflow manually via **Actions → Deploy to GitHub Pages → Run workflow**).

The site will be published at `https://<user>.github.io/algo-viz/`.

## Coverage

**All 150 problems are visualized** — every category is complete: arrays & hashing, two pointers,
sliding window, stack, binary search, linked lists, trees, tries, heaps, backtracking, graphs,
advanced graphs, 1-D and 2-D DP, greedy, intervals, math & geometry, and bit manipulation.

## Adding a new visualizer

Everything lives in `js/`:

- `data.js` — the 150-problem catalog (title, difficulty, approach, complexity).
- `statements.js` — one-line problem statements for each problem.
- `engine.js` — generic renderers (array, bars, map, set, stack, vars, linked list, tree, grid, interval timeline, 2-D DP table) and the playback engine.
- `visualizers.js` — one entry per visualized problem: `VIS["<slug>"] = { inputs, code, gen }`,
  where `gen(...)` returns a list of frames `{ d: description, l: code line, c: [components] }`.
- `app.js` — hash router and pages.

To add a problem, write a `gen` function that runs the optimal algorithm while pushing a frame
at each meaningful step — the engine handles all rendering and controls.
