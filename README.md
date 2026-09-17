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
- **Python data structures reference** (`#/python`) — 19 entries covering the built-in containers
  (list, tuple, str, dict, set), the stdlib workhorses (deque, Counter, defaultdict, heapq, bisect,
  functools/itertools), the sorted containers (`SortedList`, `SortedDict`/`SortedSet`, and the
  stdlib fallbacks — bisect, lazy-deletion heaps, Fenwick trees — for when you cannot import them),
  and the structures you write yourself (ListNode, TreeNode, Trie, Union-Find, adjacency lists).
  Each one gives the per-operation cost, an idiomatic snippet, the gotchas that quietly cost you a
  factor of n, and links to the problems that use it.
- **Template patterns reference** (`#/patterns`) — 28 templates grouped by shape: two pointers,
  sliding windows, prefix sums, monotonic stacks, both flavours of binary search, linked-list
  rewiring, tree DFS/BFS, grid and graph traversal, topological sort, Dijkstra, heaps, ordered
  multisets, intervals, backtracking, greedy, 1-D and 2-D DP, and bit tricks. Each has the signals that should make you
  reach for it, a copy-paste Python template, why it works, and the problems to practise it on.
  Problem pages link back to the templates and structures they use.
- **Industry coding, level by level** (`#/codesignal`) — the other interview: one small system
  specified in four levels, each landing on the code the last level left behind. Three practice
  challenges (in-memory file storage, a banking system, a key/field database), twelve levels, with
  for each level the operations it adds, the design decisions, the worked example, the traps the
  tests poke at, and the full Python solution — **with the lines that level adds highlighted**, so
  you can watch the same class grow from 21 lines to 141. Plus the shape of the format itself: the
  four rungs that recur in every one of these (CRUD → ranked query → time → history) and an
  eight-item playbook of the habits that decide whether level 4 is reachable at all.

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
- `reference.js` — the Python data-structure (`PY_STRUCTS`) and template-pattern (`PY_PATTERNS`) reference.
- `codesignal.js` — the industry-coding challenges (`CS_CHALLENGES`), the format notes (`CS_FORMAT`),
  the playbook (`CS_PLAYBOOK`), and the shared traps (`CS_PITFALLS`).
- `statements.js` — one-line problem statements for each problem.
- `engine.js` — generic renderers (array, bars, map, set, stack, vars, linked list, tree, grid, interval timeline, 2-D DP table) and the playback engine.
- `visualizers.js` — one entry per visualized problem: `VIS["<slug>"] = { inputs, code, gen }`,
  where `gen(...)` returns a list of frames `{ d: description, l: code line, c: [components] }`.
- `app.js` — hash router and pages (`#/`, `#/p/<slug>`, `#/python[/<id>]`, `#/patterns[/<id>]`,
  `#/codesignal[/<challenge>[/<level>]]`).

To add a problem, write a `gen` function that runs the optimal algorithm while pushing a frame
at each meaningful step — the engine handles all rendering and controls.

## Adding a reference entry

Append an entry to the right group in `js/reference.js`:

- a data structure needs `{ id, name, tag, blurb, use, imports, ops, code, gotchas, problems }`,
  where `ops` is a list of `[operation, complexity, note]`;
- a pattern needs `{ id, name, signals, time, space, code, notes, problems }`.

`problems` holds NeetCode slugs — they render as links, and each problem page automatically shows
the entries that name it. The `id` is the deep-link anchor (`#/patterns/<id>`).

## Adding an industry-coding challenge

Append an entry to `CS_CHALLENGES` in `js/codesignal.js`:

```
{ id, name, tag, blurb, story, structures, patterns, levels: [
    { n, name, minutes, ops, idea, design, code, trace, pitfalls }, … ] }
```

`ops` is a list of `[signature, description]`; `structures` and `patterns` are ids from
`js/reference.js` and render as links. Each level's `code` is the **complete** solution at that
level, not a fragment — the page diffs it against the previous level's code (line-level LCS, in
`csAddedLines`) to highlight what the level added, so the levels must be cumulative. Write and run
the Python before pasting it in; every solution on that page was executed against a test suite
covering the edge cases listed under each level's traps.
