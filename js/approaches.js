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

APPROACHES["maximum-subarray"] = [
  {
    name: "Brute force — try every subarray",
    time: "O(n²)", space: "O(1)",
    idea: [
      "The answer is the largest sum among all contiguous subarrays, so just compute them all. Fix a start index, extend the end one step at a time keeping a running sum, and track the best. No cleverness — this is the definition, made literal.",
      "It works but re-walks overlapping ranges endlessly. The whole game is to get the same answer in one pass.",
    ],
    code: `def maxSubArray(nums):
    best = nums[0]
    for i in range(len(nums)):
        cur = 0
        for j in range(i, len(nums)):
            cur += nums[j]          # sum of nums[i..j]
            best = max(best, cur)
    return best`,
  },
  {
    name: "Kadane's algorithm — O(n)",
    time: "O(n)", space: "O(1)",
    idea: [
      "Ask a sharper question: what is the best subarray ENDING at index i? It's one of two things — either it extends the best subarray ending at i−1, or it starts fresh at nums[i]. So cur = max(nums[i], cur + nums[i]).",
      "The unlock hides in that max: if the running sum ever goes negative, carrying it into the next element can only drag the total down — a fresh start is strictly better. So a negative prefix is simply dropped. That single comparison replaces the entire inner loop.",
      "Keep a separate best across all positions, because the maximum subarray might end anywhere, not necessarily at the last index.",
    ],
    code: `def maxSubArray(nums):
    best = cur = nums[0]
    for n in nums[1:]:
        cur = max(n, cur + n)   # extend, or restart at n
        best = max(best, cur)
    return best`,
  },
];

APPROACHES["best-time-to-buy-and-sell-stock"] = [
  {
    name: "Brute force — every buy/sell pair",
    time: "O(n²)", space: "O(1)",
    idea: [
      "Buy on some day, sell on a later day, and you want the biggest gap. Try all ordered pairs and keep the largest sell − buy.",
      "Quadratic, and it recomputes the same thing: for any sell day, the only buy day that matters is the cheapest one before it.",
    ],
    code: `def maxProfit(prices):
    best = 0
    for buy in range(len(prices)):
        for sell in range(buy + 1, len(prices)):
            best = max(best, prices[sell] - prices[buy])
    return best`,
  },
  {
    name: "One pass — track the minimum so far",
    time: "O(n)", space: "O(1)",
    idea: [
      "Walk the days once, remembering the cheapest price seen so far. That price is, by definition, the best possible buy day for selling on today or any later day.",
      "So at each day compute today's price − min-so-far and keep the best. One variable replaces the inner loop entirely — the same 'the past is fully summarized by one number' move as Kadane's.",
    ],
    code: `def maxProfit(prices):
    min_price = float("inf")
    best = 0
    for p in prices:
        min_price = min(min_price, p)     # cheapest buy day so far
        best = max(best, p - min_price)   # sell today at that buy
    return best`,
  },
];

APPROACHES["product-of-array-except-self"] = [
  {
    name: "Brute force — re-multiply for each index",
    time: "O(n²)", space: "O(1)",
    idea: [
      "answer[i] is the product of everything except nums[i]. Directly: for each i, loop the array multiplying all the other elements.",
      "Correct, quadratic, and wasteful — every position re-multiplies almost the same numbers.",
    ],
    code: `def productExceptSelf(nums):
    res = []
    for i in range(len(nums)):
        prod = 1
        for j in range(len(nums)):
            if j != i:
                prod *= nums[j]
        res.append(prod)
    return res`,
  },
  {
    name: "Total product ÷ nums[i] — the tempting trap",
    time: "O(n)", space: "O(1)",
    idea: [
      "Multiply everything once, then divide by nums[i] per index. O(n) — but the problem forbids division, and for good reason: a single zero makes total 0 and the division undefined (two zeros make every answer 0).",
      "Worth knowing precisely why it's disallowed — it points straight at the fix: keep the left product and the right product separately, and never divide.",
    ],
    code: `def productExceptSelf(nums):
    total = 1
    for n in nums:
        total *= n
    return [total // n for n in nums]   # breaks on any zero, and division is banned`,
  },
  {
    name: "Prefix × suffix products",
    time: "O(n)", space: "O(1) extra",
    idea: [
      "answer[i] = (product of everything to the LEFT of i) × (product of everything to the RIGHT of i). Neither factor contains nums[i], so no division is ever needed.",
      "Do it in two sweeps that write straight into the output array: left-to-right lay down the running prefix product, then right-to-left multiply in the running suffix product. The output array carries the state, so only O(1) extra space beyond it.",
    ],
    code: `def productExceptSelf(nums):
    n = len(nums)
    res = [1] * n
    prefix = 1
    for i in range(n):
        res[i] = prefix          # product of everything left of i
        prefix *= nums[i]
    suffix = 1
    for i in range(n - 1, -1, -1):
        res[i] *= suffix         # times product of everything right of i
        suffix *= nums[i]
    return res`,
  },
];

APPROACHES["koko-eating-bananas"] = [
  {
    name: "Linear scan — try every speed",
    time: "O(max(piles) · n)", space: "O(1)",
    idea: [
      "Speed k lets Koko finish in sum(ceil(pile / k)) hours. Start at k = 1 and increase until the hours fit within h. The first speed that works is the answer.",
      "Correct but slow when pile sizes are large. The key realization is that we're searching for a threshold in a space we can probe.",
    ],
    code: `def minEatingSpeed(piles, h):
    k = 1
    while True:
        hours = sum((p + k - 1) // k for p in piles)   # ceil division
        if hours <= h:
            return k
        k += 1`,
  },
  {
    name: "Binary search on the answer",
    time: "O(n log max(piles))", space: "O(1)",
    idea: [
      "Feasibility is monotonic: if speed k finishes in time, every faster speed does too. That single fact means the 'works / doesn't work' line is a clean threshold — exactly the shape binary search exploits.",
      "The conceptual leap is that we binary-search over the ANSWER space (speeds 1..max pile), not over an input array. Each guess is checked with the same O(n) hours computation; halve the range toward the smallest workable speed.",
      "This 'binary search the answer' pattern recurs whenever the answer is a number and the feasibility test is monotonic (split array largest sum, ship packages in D days, and friends).",
    ],
    code: `def minEatingSpeed(piles, h):
    lo, hi = 1, max(piles)
    while lo < hi:
        k = (lo + hi) // 2
        hours = sum((p + k - 1) // k for p in piles)
        if hours <= h:
            hi = k        # k works — try slower
        else:
            lo = k + 1    # too slow — must speed up
    return lo`,
  },
];

APPROACHES["longest-increasing-subsequence"] = [
  {
    name: "DP on endings — O(n²)",
    time: "O(n²)", space: "O(n)",
    idea: [
      "Let dp[i] be the length of the longest increasing subsequence that ENDS at index i. To extend to i, look back at every earlier j with nums[j] < nums[i] and take the best dp[j] + 1.",
      "Clear and correct, but the inner look-back is linear per element. The optimization attacks exactly that scan.",
    ],
    code: `def lengthOfLIS(nums):
    dp = [1] * len(nums)
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)`,
  },
  {
    name: "Patience sorting — O(n log n)",
    time: "O(n log n)", space: "O(n)",
    idea: [
      "Keep an array tails where tails[k] is the SMALLEST possible tail value of any increasing subsequence of length k+1. Smaller tails leave more room for future numbers to extend, so keeping them minimal is always safe.",
      "For each number, binary-search its slot in tails. If it's larger than every tail, it extends the longest run so far — append it. Otherwise it replaces the first tail ≥ it, lowering that length's tail without changing any lengths. tails stays sorted throughout, which is what makes the binary search valid.",
      "The unintuitive part: tails is NOT itself a valid subsequence — it's a bookkeeping array of best-possible tails. But its LENGTH always equals the current LIS length, and that's all we return. Replacing rather than growing is 'keep options open,' the same instinct behind many greedy-plus-binary-search solutions.",
    ],
    code: `from bisect import bisect_left

def lengthOfLIS(nums):
    tails = []
    for n in nums:
        i = bisect_left(tails, n)
        if i == len(tails):
            tails.append(n)     # n extends the longest run
        else:
            tails[i] = n        # smaller tail for that length
    return len(tails)`,
  },
];

APPROACHES["find-median-from-data-stream"] = [
  {
    name: "Keep it sorted — insert in place",
    time: "O(n) add · O(1) median", space: "O(n)",
    idea: [
      "The median is trivial if the data is sorted: it's the middle element (or the average of the two middle ones). So keep a sorted list and binary-search the insertion point for each new number.",
      "Finding where to insert is O(log n), but actually inserting shifts elements — O(n) per add. Over a long stream that's too slow. The insight: you don't need everything sorted, only the boundary in the middle.",
    ],
    code: `import bisect

class MedianFinder:
    def __init__(self):
        self.a = []
    def addNum(self, num):
        bisect.insort(self.a, num)   # O(n) because of the shift
    def findMedian(self):
        n = len(self.a)
        if n % 2:
            return self.a[n // 2]
        return (self.a[n // 2 - 1] + self.a[n // 2]) / 2`,
  },
  {
    name: "Two heaps straddling the middle",
    time: "O(log n) add · O(1) median", space: "O(n)",
    idea: [
      "Split the numbers into a lower half and an upper half. Store the lower half in a MAX-heap (so its largest — the middle-left value — is instantly on top) and the upper half in a MIN-heap (its smallest — the middle-right value — on top). The median is read straight off the one or two roots.",
      "Each add pushes, then rebalances: move a value across so the max-heap's top never exceeds the min-heap's top, and keep the sizes within one of each other. Both are O(log n) heap operations — no O(n) shifting.",
      "The move that makes it click: you never need the halves internally sorted, only the boundary between them. Two heaps maintain exactly that boundary and nothing more.",
    ],
    code: `from heapq import heappush, heappop

class MedianFinder:
    def __init__(self):
        self.small = []   # max-heap (store negatives): lower half
        self.large = []   # min-heap: upper half
    def addNum(self, num):
        heappush(self.small, -num)
        heappush(self.large, -heappop(self.small))    # keep values ordered
        if len(self.large) > len(self.small):          # keep sizes balanced
            heappush(self.small, -heappop(self.large))
    def findMedian(self):
        if len(self.small) > len(self.large):
            return -self.small[0]
        return (-self.small[0] + self.large[0]) / 2`,
  },
];

APPROACHES["house-robber"] = [
  {
    name: "Recursion — rob or skip each house",
    time: "O(2ⁿ)", space: "O(n)",
    idea: [
      "At house i you make one choice: rob it (take nums[i], then you must skip i+1) or skip it (move to i+1). The best from i is the max of those two futures.",
      "Written directly it's exponential, because rob(i+2) gets recomputed through many different paths. But notice the answer from position i depends only on i — that overlap is the door to DP.",
    ],
    code: `def rob(nums):
    def dfs(i):
        if i >= len(nums):
            return 0
        return max(dfs(i + 1),             # skip house i
                   nums[i] + dfs(i + 2))   # rob house i
    return dfs(0)`,
  },
  {
    name: "Rolling variables — O(1) space",
    time: "O(n)", space: "O(1)",
    idea: [
      "best(i) = max(best(i−1), best(i−2) + nums[i]): either skip house i and keep the best up to i−1, or rob it and add it to the best up to i−2. That recurrence turns the exponential tree into a single left-to-right sweep.",
      "And best(i) only ever looks two steps back, so a full dp array is overkill — two rolling variables (best up to i−1 and up to i−2) carry everything needed. This 'collapse the table to a couple of variables' step is the same one that takes Fibonacci and climbing-stairs DP to O(1).",
    ],
    code: `def rob(nums):
    prev, cur = 0, 0    # best up to i-2, best up to i-1
    for n in nums:
        prev, cur = cur, max(cur, prev + n)
    return cur`,
  },
];

APPROACHES["coin-change"] = [
  {
    name: "Greedy — largest coin first (and why it fails)",
    time: "O(amount)", space: "O(1)",
    idea: [
      "The instinct is to grab the biggest coin ≤ the remaining amount and repeat. For coin systems like US currency this happens to work — which is exactly why it's a trap.",
      "It is NOT correct in general. With coins [1, 3, 4] and amount 6, greedy takes 4 + 1 + 1 = three coins, but 3 + 3 = two coins is optimal. Taking the locally biggest coin can strand you into needing many small ones. Because a greedy choice isn't safe here, you must actually consider all options — that's the cue for DP.",
    ],
    code: `def coinChange(coins, amount):   # WRONG in general — e.g. coins=[1,3,4], amount=6
    coins.sort(reverse=True)
    count = 0
    for c in coins:
        while amount >= c:
            amount -= c
            count += 1
    return count if amount == 0 else -1`,
  },
  {
    name: "Bottom-up DP over amounts",
    time: "O(amount · coins)", space: "O(amount)",
    idea: [
      "Define dp[a] = the fewest coins that make amount a. To make a, whichever coin you use last leaves a − coin behind, so dp[a] = 1 + min(dp[a − coin]) over all coins that fit.",
      "Build dp from 0 upward: every value a is solved using only smaller, already-final answers. No greedy gamble — the min considers every coin, so it can't be fooled by [1, 3, 4]. Unreachable amounts stay at infinity and map to −1.",
    ],
    code: `def coinChange(coins, amount):
    dp = [0] + [float("inf")] * amount
    for a in range(1, amount + 1):
        for c in coins:
            if a - c >= 0:
                dp[a] = min(dp[a], 1 + dp[a - c])
    return dp[amount] if dp[amount] != float("inf") else -1`,
  },
];
