// Optional per-problem "building the intuition" progressions.
// APPROACHES[slug] = [{ name, time, space, idea: [paragraphs...], code }]
// When present, the problem page shows this progression instead of the one-line approach panel.
const APPROACHES = {};

APPROACHES["trapping-rain-water"] = [
  {
    name: "Brute force — the formula, made literal",
    time: "O(n²)", space: "O(1)",
    idea: [
      "Water sitting on column i is walled in by the tallest bar to its left and the tallest bar to its right, and it fills to the lower of those two walls. So the answer at each column is exactly water[i] = min(maxLeft, maxRight) − height[i] (never negative).",
      "The brute force computes that definition directly: for every column, scan left for its tallest left wall and right for its tallest right wall. Correct and obvious — but quadratic, because every column re-scans the whole array to find maxima it will compute again for the next column.",
    ],
    code: `def trap(height):
    n = len(height)
    total = 0
    for i in range(n):
        left_max  = max(height[: i + 1])   # tallest wall to the left
        right_max = max(height[i:])        # tallest wall to the right
        total += min(left_max, right_max) - height[i]
    return total`,
  },
  {
    name: "Precompute the maxima — O(n) space",
    time: "O(n)", space: "O(n)",
    idea: [
      "The brute force wastes all its time recomputing the same maxima. Compute them once: sweep left-to-right to fill maxLeft[], right-to-left to fill maxRight[], then apply the identical formula in one final pass.",
      "Three passes, two extra arrays, zero cleverness — this is the version you should be able to write in your sleep. The two-pointer trick that follows is nothing but a compression of it, so nail this one first.",
    ],
    code: `def trap(height):
    n = len(height)
    maxLeft, maxRight = [0] * n, [0] * n
    for i in range(1, n):
        maxLeft[i] = max(maxLeft[i - 1], height[i - 1])
    for i in range(n - 2, -1, -1):
        maxRight[i] = max(maxRight[i + 1], height[i + 1])
    return sum(max(0, min(maxLeft[i], maxRight[i]) - height[i])
               for i in range(n))`,
  },
  {
    name: "Two pointers — O(1) space (optimal)",
    time: "O(n)", space: "O(1)",
    idea: [
      "The observation that kills the arrays: you never need both maxima exactly — only min(maxLeft, maxRight). And if you already know one side's max is the smaller one, the other side's exact value is irrelevant. If maxLeft = 3 and you know maxRight ≥ 3, the water at that cell is 3 − height[i], full stop — whether the right max turns out to be 4 or 400.",
      "So walk in from both ends, keeping left_max (the max of everything the left pointer has passed) and right_max (the max of everything the right pointer has passed). left_max is EXACT for the left cell — the left pointer has seen its whole left side. right_max is only a lower bound on that cell's true right max — the right pointer hasn't scanned the middle yet. But a lower bound is enough: if left_max < right_max, the true right max is ≥ right_max > left_max, so min = left_max with certainty. The left cell's fate is sealed; settle it and step in. Symmetrically on the other side. You always advance the pointer behind the weaker wall, because the weaker wall is the binding constraint and it's fully known.",
      "Mental model: two survey teams walk in from the ends, each carrying its record-so-far. Whichever team holds the lower record knows its current cell is capped by its own record — the other team's record already beats it, and the other side can only get taller. So the lower-record team commits its cell and steps forward. The pointers are lazily evaluating min(prefixMax, suffixMax), resolving a cell only the moment the min becomes provable. That's the whole trick: deferred certainty, not cleverness.",
      "Correctness note worth having ready: the invariant is about the MAXES, not the current bars. Comparing height[l] vs height[r] also works, but its proof is subtler; comparing left_max vs right_max is the version whose proof you can state in two sentences under pressure. The natural generalization is Trapping Rain Water II (2-D): same idea — always resolve the cell behind the globally weakest boundary wall — except the boundary is a whole perimeter, so \"which wall is weakest\" needs a min-heap instead of a two-way comparison.",
    ],
    code: `def trap(height):
    l, r = 0, len(height) - 1
    left_max = right_max = water = 0
    while l < r:
        left_max  = max(left_max,  height[l])
        right_max = max(right_max, height[r])
        if left_max < right_max:
            water += left_max - height[l]    # left_max >= height[l] >= 0
            l += 1
        else:
            water += right_max - height[r]
            r -= 1
    return water`,
  },
];
