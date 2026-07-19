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

APPROACHES["two-sum"] = [
  {
    name: "Brute force — check every pair",
    time: "O(n²)", space: "O(1)",
    idea: [
      "You need two numbers that add to target, so try all pairs: for each i, scan every later j and test nums[i] + nums[j].",
      "It works, but for each element you re-scan the rest of the array looking for one specific value — target − nums[i]. Searching for a specific value is exactly what a hash map does in O(1).",
    ],
    code: `def twoSum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]`,
  },
  {
    name: "One pass with a hash map",
    time: "O(n)", space: "O(n)",
    idea: [
      "Reframe the inner loop as a lookup: as you pass each number, its complement is target − n. If you've already seen that complement, you've found the pair.",
      "Store each number's index in a map as you go, and check for the complement before storing. One pass, because by the time the second member of a pair arrives, the first is already in the map.",
    ],
    code: `def twoSum(nums, target):
    seen = {}                       # value -> index
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i`,
  },
];

APPROACHES["longest-substring-without-repeating-characters"] = [
  {
    name: "Brute force — check every substring",
    time: "O(n³)", space: "O(n)",
    idea: [
      "Generate every substring and test whether it has all distinct characters; keep the longest that passes. There are O(n²) substrings and each uniqueness check is O(n).",
      "The waste: when a substring fails because of a repeat, we throw away everything and restart, even though most of the work carries over. A moving window fixes exactly that.",
    ],
    code: `def lengthOfLongestSubstring(s):
    best = 0
    for i in range(len(s)):
        for j in range(i, len(s)):
            if len(set(s[i:j + 1])) == j - i + 1:
                best = max(best, j - i + 1)
    return best`,
  },
  {
    name: "Sliding window",
    time: "O(n)", space: "O(min(n, alphabet))",
    idea: [
      "Keep a window [l, r] that always holds distinct characters, tracked in a set. Extend r one step at a time. When the new character is already inside, shrink from the left — dropping characters — until the duplicate is gone.",
      "Each pointer only ever moves forward, so every character enters and leaves the window at most once: O(n) total. The window never rebuilds from scratch; that reuse of work is what collapses the cubic brute force to linear.",
    ],
    code: `def lengthOfLongestSubstring(s):
    seen = set()
    l = best = 0
    for r in range(len(s)):
        while s[r] in seen:
            seen.remove(s[l])
            l += 1
        seen.add(s[r])
        best = max(best, r - l + 1)
    return best`,
  },
];

APPROACHES["3sum"] = [
  {
    name: "Brute force — every triplet",
    time: "O(n³)", space: "O(1)",
    idea: [
      "Three nested loops over all triplets, keep those summing to zero, dedupe at the end. Correct but cubic, and deduping is fiddly.",
      "The fix leans on a tool you already have: once the first number is fixed, finding two more that hit a target is just Two Sum — and Two Sum is fast on a SORTED array.",
    ],
    code: `def threeSum(nums):
    res = set()
    n = len(nums)
    for i in range(n):
        for j in range(i + 1, n):
            for k in range(j + 1, n):
                if nums[i] + nums[j] + nums[k] == 0:
                    res.add(tuple(sorted((nums[i], nums[j], nums[k]))))
    return [list(t) for t in res]`,
  },
  {
    name: "Sort, then fix one + two pointers",
    time: "O(n²)", space: "O(1)",
    idea: [
      "Sort the array first. Then fix each nums[i] and look for two numbers in the rest that sum to −nums[i] using the sorted-array Two Sum: a left and right pointer that move inward — too small, move left up; too big, move right down.",
      "Sorting also makes dedup trivial: skip over equal values for both the fixed element and the pointers, so identical triplets are never generated in the first place. One O(n) two-pointer sweep per fixed element gives O(n²) overall.",
    ],
    code: `def threeSum(nums):
    nums.sort()
    res = []
    for i in range(len(nums)):
        if i > 0 and nums[i] == nums[i - 1]:
            continue                       # skip duplicate anchors
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:   l += 1
            elif s > 0: r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                l += 1
                while l < r and nums[l] == nums[l - 1]:
                    l += 1                 # skip duplicate pairs
    return res`,
  },
];

APPROACHES["container-with-most-water"] = [
  {
    name: "Brute force — every pair of lines",
    time: "O(n²)", space: "O(1)",
    idea: [
      "Area between lines i and j is width (j − i) × height min(h[i], h[j]). Try all pairs and keep the max.",
      "Quadratic. The improvement comes from realizing which end is worth moving: the shorter line is what caps the area, so keeping it can never help.",
    ],
    code: `def maxArea(height):
    best = 0
    for i in range(len(height)):
        for j in range(i + 1, len(height)):
            best = max(best, (j - i) * min(height[i], height[j]))
    return best`,
  },
  {
    name: "Two pointers from the ends",
    time: "O(n)", space: "O(1)",
    idea: [
      "Start with the widest possible container: one pointer at each end. The area is limited by the shorter wall, so move THAT pointer inward — moving the taller one only loses width while the same short wall still caps the height, so it can never improve.",
      "Every step discards a wall that provably can't be part of a better container, so a single inward sweep is enough. Same 'the weaker side is the binding constraint, advance it' logic as Trapping Rain Water.",
    ],
    code: `def maxArea(height):
    l, r = 0, len(height) - 1
    best = 0
    while l < r:
        best = max(best, (r - l) * min(height[l], height[r]))
        if height[l] < height[r]:
            l += 1        # short wall caps us — abandon it
        else:
            r -= 1
    return best`,
  },
];

APPROACHES["kth-largest-element-in-an-array"] = [
  {
    name: "Sort and index",
    time: "O(n log n)", space: "O(1)",
    idea: [
      "Sort the array and read the k-th largest directly. Simple and often perfectly fine in practice.",
      "But it fully orders the array when we only care about ONE position. Two ways to do less: keep just the k largest in a heap, or partition toward the exact index.",
    ],
    code: `def findKthLargest(nums, k):
    nums.sort()
    return nums[-k]`,
  },
  {
    name: "Min-heap of size k",
    time: "O(n log k)", space: "O(k)",
    idea: [
      "Maintain a min-heap holding only the k largest seen so far. Push each number; if the heap exceeds k, pop the smallest. The root is then always the k-th largest.",
      "You never sort the losers — anything that falls out of the top k is discarded in O(log k). Great when k is small or the data streams in.",
    ],
    code: `import heapq

def findKthLargest(nums, k):
    heap = []
    for n in nums:
        heapq.heappush(heap, n)
        if len(heap) > k:
            heapq.heappop(heap)
    return heap[0]`,
  },
  {
    name: "Quickselect — average O(n)",
    time: "O(n) average", space: "O(1)",
    idea: [
      "The k-th largest sits at a fixed index (n − k) in the sorted order. Quickselect finds that one index without sorting: partition around a pivot, and recurse into ONLY the side that contains the target index — the other half is thrown away untouched.",
      "Each partition is linear and the problem roughly halves each round, giving n + n/2 + n/4 + … ≈ O(n) on average. It's quicksort that only ever follows one branch.",
    ],
    code: `def findKthLargest(nums, k):
    target = len(nums) - k
    def select(lo, hi):
        pivot, p = nums[hi], lo
        for i in range(lo, hi):
            if nums[i] <= pivot:
                nums[i], nums[p] = nums[p], nums[i]
                p += 1
        nums[p], nums[hi] = nums[hi], nums[p]
        if   p < target: return select(p + 1, hi)
        elif p > target: return select(lo, p - 1)
        return nums[p]
    return select(0, len(nums) - 1)`,
  },
];

APPROACHES["daily-temperatures"] = [
  {
    name: "Brute force — scan ahead for each day",
    time: "O(n²)", space: "O(1)",
    idea: [
      "For each day, walk forward until you find a warmer temperature and record the gap. Straightforward, quadratic in the worst case (a long descending run).",
      "The waste: colder days keep re-scanning the same stretch. A stack lets each warmer day resolve all the days waiting on it at once.",
    ],
    code: `def dailyTemperatures(temps):
    res = [0] * len(temps)
    for i in range(len(temps)):
        for j in range(i + 1, len(temps)):
            if temps[j] > temps[i]:
                res[i] = j - i
                break
    return res`,
  },
  {
    name: "Monotonic decreasing stack",
    time: "O(n)", space: "O(n)",
    idea: [
      "Keep a stack of indices whose temperatures are still waiting for something warmer, in decreasing order. When today is warmer than the temperature at the stack's top, that day's answer is resolved — pop it and record the distance. Repeat until the top is warmer than today, then push today.",
      "Each index is pushed once and popped once, so the whole thing is O(n). A warm day settling several colder days in one shot is what removes the repeated forward scans.",
    ],
    code: `def dailyTemperatures(temps):
    res = [0] * len(temps)
    stack = []                    # indices, temps decreasing
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            res[j] = i - j
        stack.append(i)
    return res`,
  },
];

APPROACHES["climbing-stairs"] = [
  {
    name: "Recursion — branch at each step",
    time: "O(2ⁿ)", space: "O(n)",
    idea: [
      "From step i you can take 1 or 2 steps, so ways(i) = ways(i+1) + ways(i+2). Written directly, it explores an exponential tree.",
      "But ways(i) depends only on i, and the same i is recomputed through countless paths — the signature of overlapping subproblems that DP collapses. (This is literally Fibonacci in disguise.)",
    ],
    code: `def climbStairs(n):
    def ways(i):
        if i >= n:
            return 1 if i == n else 0
        return ways(i + 1) + ways(i + 2)
    return ways(0)`,
  },
  {
    name: "Two rolling variables",
    time: "O(n)", space: "O(1)",
    idea: [
      "Fill the recurrence bottom-up instead of top-down. Each answer needs only the previous two, so carry them in two variables and slide forward — no array, no recursion stack.",
      "The exponential tree becomes a single loop of n additions. Recognizing 'the state only reaches two steps back' is what licenses the O(1) space.",
    ],
    code: `def climbStairs(n):
    a, b = 1, 1        # ways to reach the two steps below
    for _ in range(n):
        a, b = b, a + b
    return a`,
  },
];

APPROACHES["group-anagrams"] = [
  {
    name: "Sort each word as its key",
    time: "O(n · k log k)", space: "O(n · k)",
    idea: [
      "Anagrams become identical once their letters are sorted, so sorting a word gives a canonical key. Bucket every word under its sorted form in a hash map.",
      "Clean and correct; the only cost is sorting each length-k word. If k is large you can skip the sort entirely.",
    ],
    code: `def groupAnagrams(strs):
    groups = {}
    for w in strs:
        key = "".join(sorted(w))
        groups.setdefault(key, []).append(w)
    return list(groups.values())`,
  },
  {
    name: "Character-count key",
    time: "O(n · k)", space: "O(n · k)",
    idea: [
      "Anagrams also share the same letter FREQUENCIES, so a 26-slot count tuple is an equally valid canonical key — and building it is linear in the word length, no sort needed.",
      "Same bucketing idea, a faster key: trade the k log k sort for an O(k) count. A nice reminder that the 'signature' you group by can often be computed more cheaply than sorting.",
    ],
    code: `def groupAnagrams(strs):
    groups = {}
    for w in strs:
        count = [0] * 26
        for c in w:
            count[ord(c) - ord("a")] += 1
        groups.setdefault(tuple(count), []).append(w)
    return list(groups.values())`,
  },
];
