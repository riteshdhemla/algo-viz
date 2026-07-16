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
- **Interactive step-by-step visualizations** for a growing set of problems (16 so far).
  Each one animates the optimal algorithm running on real input:
  - play / pause / step / seek / speed controls
  - the Python solution shown alongside, with the **current line highlighted at every step**
  - animated arrays, bars, hash maps, sets, stacks, linked lists, and binary trees
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

It can be hosted as-is on GitHub Pages (Settings → Pages → deploy from branch).

## Currently visualized problems

| Problem | Technique animated |
|---|---|
| Two Sum | one-pass hash map |
| Contains Duplicate | hash set |
| Valid Anagram | frequency counting |
| Product of Array Except Self | prefix/suffix products |
| Valid Palindrome | two pointers with skipping |
| Two Sum II | converging two pointers |
| Container With Most Water | two pointers on bars |
| Best Time to Buy and Sell Stock | sliding window min-tracking |
| Longest Substring Without Repeating Characters | sliding window + set |
| Valid Parentheses | stack matching |
| Daily Temperatures | monotonic stack |
| Binary Search | halving with L/M/R pointers |
| Reverse Linked List | in-place pointer flipping |
| Maximum Subarray | Kadane's algorithm |
| Climbing Stairs | bottom-up DP (Fibonacci) |
| Invert Binary Tree | BFS child swapping |

## Adding a new visualizer

Everything lives in `js/`:

- `data.js` — the 150-problem catalog (title, difficulty, approach, complexity).
- `engine.js` — generic renderers (array, bars, map, set, stack, vars, linked list, tree) and the playback engine.
- `visualizers.js` — one entry per visualized problem: `VIS["<slug>"] = { inputs, code, gen }`,
  where `gen(...)` returns a list of frames `{ d: description, l: code line, c: [components] }`.
- `app.js` — hash router and pages.

To add a problem, write a `gen` function that runs the optimal algorithm while pushing a frame
at each meaningful step — the engine handles all rendering and controls.
