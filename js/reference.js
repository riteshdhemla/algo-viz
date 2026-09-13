// Python reference: data structures and template patterns.
//
// PY_STRUCTS[] = { group, items: [{ id, name, tag, blurb, use, imports, ops, code, gotchas, problems }] }
//   ops:      [[operation, complexity, note], ...]
//   problems: NeetCode slugs that lean on the structure (linked to their pages).
//
// PY_PATTERNS[] = { group, items: [{ id, name, signals, time, space, code, notes, problems }] }
//   signals:  phrases in a problem statement that should make you reach for the template.

const PY_STRUCTS = [

["Built-in containers", [
{
  id: "list",
  name: "list",
  tag: "dynamic array",
  blurb: "A growable array of references. Contiguous, so indexing is instant but inserting or deleting anywhere but the end shifts everything after it.",
  use: "Your default sequence: the input itself, a DP table, a result buffer, a stack (append/pop at the end).",
  imports: "",
  ops: [
    ["a[i], a[i] = x", "O(1)", "Index from the end with negative indices: a[-1] is the last item."],
    ["a.append(x)", "O(1) amortized", "Occasional resize copies, but averaged over n appends it is constant."],
    ["a.pop()", "O(1)", "Pop from the end — this is what makes a list a perfectly good stack."],
    ["a.pop(0), a.insert(0, x)", "O(n)", "Every later element shifts. Need this in a loop? Use a deque."],
    ["x in a", "O(n)", "Linear scan. If you are doing this inside a loop, you want a set."],
    ["a[i:j]", "O(j − i)", "Slicing copies. a[:] is a full O(n) shallow copy."],
    ["a.sort(), sorted(a)", "O(n log n)", "Timsort — near-linear on partly sorted data. sort() is in place, sorted() copies."],
    ["a + b, a * k", "O(n + m), O(n·k)", "Building a list by repeated + in a loop is quadratic; append instead."],
    ["len(a), min(a), max(a)", "O(1), O(n), O(n)", "len is stored, the others scan."],
  ],
  code: `nums = [3, 1, 4, 1, 5]

nums.append(9)              # [3, 1, 4, 1, 5, 9]
top = nums.pop()            # 9        — list as a stack
nums.sort(reverse=True)     # [5, 4, 3, 1, 1]
nums.sort(key=lambda x: -x) # sort by any key function

grid = [[0] * 3 for _ in range(4)]   # 4x3 of zeros — CORRECT
# grid = [[0] * 3] * 4               # WRONG: 4 references to ONE row

# Enumerate and zip beat manual index juggling.
for i, x in enumerate(nums):
    ...
for a, b in zip(nums, nums[1:]):     # every adjacent pair
    ...

# Comprehensions are the idiomatic map/filter.
squares = [x * x for x in nums if x % 2]`,
  gotchas: [
    "[[0] * m] * n makes n aliases of the SAME row — mutating one mutates all. Use a comprehension.",
    "Default arguments like def f(path=[]) are created once and shared across calls. Use None as the default.",
    "Deleting while iterating skips elements. Iterate over a copy (for x in a[:]) or build a new list.",
  ],
  problems: ["product-of-array-except-self", "rotate-image", "spiral-matrix"],
},
{
  id: "tuple",
  name: "tuple",
  tag: "immutable · hashable",
  blurb: "An immutable sequence. Because it cannot change, it can be hashed — which makes it the key type for every memo, visited set, and heap entry you will ever write.",
  use: "Coordinates in a grid, composite dict/set keys, memo keys, (priority, item) pairs pushed on a heap.",
  imports: "",
  ops: [
    ["t[i], len(t)", "O(1)", "Same indexing as a list, minus every mutating method."],
    ["hash(t)", "O(k)", "Hashable if every element is — that is the whole point."],
    ["a, b = b, a", "O(1)", "Tuple packing/unpacking: the cleanest swap in any language."],
  ],
  code: `seen = set()
seen.add((r, c))                 # grid cells as set members
memo = {(i, j): value}           # composite memo key

# Heaps compare tuples element by element — priority first.
heapq.heappush(heap, (dist, node))

# Sorting by several keys at once.
people.sort(key=lambda p: (-p.score, p.name))   # score desc, then name asc

l, r = 0, len(nums) - 1          # multiple assignment
nums[i], nums[j] = nums[j], nums[i]`,
  gotchas: [
    "A one-element tuple needs the trailing comma: (5,) not (5).",
    "A tuple holding a list is not hashable — immutability has to go all the way down.",
  ],
  problems: ["k-closest-points-to-origin", "number-of-islands", "network-delay-time"],
},
{
  id: "str",
  name: "str",
  tag: "immutable sequence",
  blurb: "An immutable sequence of characters. Every 'modification' builds a new string, which is why string building in a loop is the classic accidental O(n²).",
  use: "Anything character-based — but collect pieces in a list and \"\".join them at the end.",
  imports: "",
  ops: [
    ["s[i], len(s)", "O(1)", "Indexing is constant; strings know their length."],
    ["s[i:j]", "O(j − i)", "Slices copy. s[::-1] reverses in O(n)."],
    ["s + t inside a loop", "O(n²) total", "Each + copies everything so far. Use a list and join."],
    ["\"\".join(parts)", "O(total)", "The right way to build a string. One allocation."],
    ["sub in s, s.find(sub)", "O(n·m) worst", "Fine for interview sizes; know it is not free."],
    ["ord(c), chr(i)", "O(1)", "ord(c) - ord('a') maps 'a'..'z' to 0..25 for a 26-slot count array."],
  ],
  code: `s = "hello world"

parts = []
for w in s.split():
    parts.append(w[::-1])
out = " ".join(parts)            # build strings this way

s.lower(), s.strip(), s.replace("a", "b")
c.isalnum(), c.isdigit(), c.isalpha()

# 26-letter frequency array — no hashing, fixed space.
count = [0] * 26
for c in s:
    count[ord(c) - ord('a')] += 1

# Strings are sequences, so all the sequence tricks apply.
is_pal = s == s[::-1]`,
  gotchas: [
    "s[i] = 'x' is a TypeError. Convert to a list, mutate, then join.",
    "Building output with += in a loop is quadratic — the single most common accidental blowup in Python solutions.",
  ],
  problems: ["valid-anagram", "longest-palindromic-substring", "encode-and-decode-strings"],
},
{
  id: "dict",
  name: "dict",
  tag: "hash map",
  blurb: "The hash map. Average O(1) lookup, insert, and delete, and since Python 3.7 it keeps insertion order.",
  use: "Value → index, value → count, node → neighbors, state → memoized answer. If you catch yourself scanning a list to find something, this is the fix.",
  imports: "",
  ops: [
    ["d[k], d[k] = v, del d[k]", "O(1) average", "Worst case O(n) under hash collisions — not a concern in practice."],
    ["k in d", "O(1) average", "Checks keys only, never values."],
    ["d.get(k, default)", "O(1)", "Read a missing key without a KeyError and without inserting it."],
    ["d.setdefault(k, [])", "O(1)", "Insert-if-absent then return; defaultdict is usually cleaner."],
    ["d.items() / keys() / values()", "O(1) to make, O(n) to walk", "Views, not copies — they track the dict live."],
    ["d.pop(k), popitem()", "O(1)", "popitem() removes the last-inserted pair (LIFO)."],
  ],
  code: `# The Two Sum move: remember what you have seen, keyed by value.
def two_sum(nums, target):
    seen = {}                        # value -> index
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i

# Grouping without defaultdict.
groups = {}
for w in words:
    key = tuple(sorted(w))
    groups.setdefault(key, []).append(w)

# Comprehension + inversion.
index = {v: i for i, v in enumerate(nums)}

for k, v in d.items():
    ...
d1 | d2                          # merged copy (3.9+)`,
  gotchas: [
    "Keys must be hashable — a list can never be a key, a tuple can.",
    "d[k] on a missing key raises KeyError; use .get or a defaultdict when absence is normal.",
    "Do not add or remove keys while iterating over the dict — snapshot with list(d) first.",
  ],
  problems: ["two-sum", "group-anagrams", "lru-cache", "time-based-key-value-store"],
},
{
  id: "set",
  name: "set / frozenset",
  tag: "hash set",
  blurb: "An unordered collection of unique hashable items with O(1) membership. A dict without the values.",
  use: "\"Have I seen this?\", dedupe, visited marks in a traversal, and the O(1) lookup that turns an O(n²) scan into O(n).",
  imports: "",
  ops: [
    ["s.add(x), s.discard(x)", "O(1) average", "discard is the no-KeyError version of remove."],
    ["x in s", "O(1) average", "The reason the structure exists."],
    ["a & b", "O(min(|a|, |b|))", "Intersection walks the smaller set."],
    ["a | b, a - b, a ^ b", "O(|a| + |b|)", "Union, difference, symmetric difference."],
    ["a <= b", "O(|a|)", "Subset test."],
    ["frozenset(x)", "O(n)", "Immutable and hashable — usable as a dict key or inside another set."],
  ],
  code: `def has_duplicate(nums):
    seen = set()
    for n in nums:
        if n in seen:
            return True          # duplicate found in O(1)
        seen.add(n)
    return False

# Only start counting a run from its true beginning — O(n) overall.
nums_set = set(nums)
best = 0
for n in nums_set:
    if n - 1 not in nums_set:    # n starts a streak
        length = 1
        while n + length in nums_set:
            length += 1
        best = max(best, length)

visited = {(0, 0)}               # set literal of a tuple
unique = set(word) & set(other)  # shared letters`,
  gotchas: [
    "{} is an empty dict, not an empty set. Use set().",
    "Sets have no order — never rely on iteration order, and never index into one.",
    "Only hashable items go in: set of lists is a TypeError, set of tuples is fine.",
  ],
  problems: ["contains-duplicate", "longest-consecutive-sequence", "valid-sudoku"],
},
]],

["collections, heapq, bisect", [
{
  id: "deque",
  name: "collections.deque",
  tag: "double-ended queue",
  blurb: "A doubly linked list of blocks: O(1) push and pop at both ends. The list's O(n) pop(0) problem, solved.",
  use: "Every BFS queue, every monotonic-window trick, and any rotate/sliding buffer.",
  imports: "from collections import deque",
  ops: [
    ["append(x), pop()", "O(1)", "Right end."],
    ["appendleft(x), popleft()", "O(1)", "Left end — this is what a list cannot do."],
    ["dq[0], dq[-1]", "O(1)", "The ends are cheap; the middle is not."],
    ["dq[k] in the middle", "O(n)", "Not an array. If you need random access, use a list."],
    ["deque(maxlen=k)", "O(1) per push", "Auto-evicts from the far end — a fixed-size window for free."],
    ["rotate(k)", "O(k)", "Shifts the ends around without copying the whole thing."],
  ],
  code: `from collections import deque

# BFS — the canonical use.
q = deque([start])
seen = {start}
while q:
    node = q.popleft()
    for nxt in graph[node]:
        if nxt not in seen:
            seen.add(nxt)
            q.append(nxt)

# Monotonic decreasing deque of INDICES: front is the window max.
dq = deque()
for i, n in enumerate(nums):
    while dq and nums[dq[-1]] < n:
        dq.pop()                     # smaller values can never win again
    dq.append(i)
    if dq[0] <= i - k:
        dq.popleft()                 # front slid out of the window
    if i >= k - 1:
        out.append(nums[dq[0]])`,
  gotchas: [
    "Using a list as a BFS queue with pop(0) turns an O(V+E) traversal into O(V²).",
    "Store indices, not values, in a monotonic deque — you need them to know when the front expires.",
  ],
  problems: ["binary-tree-level-order-traversal", "sliding-window-maximum", "rotting-oranges"],
},
{
  id: "counter",
  name: "collections.Counter",
  tag: "multiset",
  blurb: "A dict subclass built for counting: missing keys read as 0, and it supports multiset arithmetic.",
  use: "Frequency tables, anagram comparison, top-k by count, \"can we build A out of B\" questions.",
  imports: "from collections import Counter",
  ops: [
    ["Counter(iterable)", "O(n)", "One pass, one line, done."],
    ["c[k]", "O(1)", "Missing keys return 0 instead of raising — and do NOT get inserted."],
    ["c.most_common(k)", "O(n log k)", "Omit k for a full sort: O(n log n)."],
    ["c1 == c2", "O(n)", "The whole anagram check in one comparison."],
    ["c1 + c2, c1 - c2", "O(n)", "Multiset add and subtract (- drops non-positive counts)."],
    ["c1 & c2, c1 | c2", "O(n)", "Per-key min and max — intersection / union of multisets."],
  ],
  code: `from collections import Counter

Counter("aab")                       # Counter({'a': 2, 'b': 1})
Counter(s) == Counter(t)             # valid anagram, one line

count = Counter(nums)
count.most_common(k)                 # [(value, freq), ...] top k

# Sliding-window counts: keep the map exact by deleting zeros.
window = Counter()
window[s[r]] += 1
window[s[l]] -= 1
if window[s[l]] == 0:
    del window[s[l]]                 # so len(window) means "distinct in window"`,
  gotchas: [
    "c[missing] returns 0 but c.most_common and len() only see keys that were actually written.",
    "Counter subtraction with - discards zero and negative counts; use c.subtract() to keep them.",
    "most_common on a huge alphabet is a full sort — bucket sort by count is O(n) when you need top-k fast.",
  ],
  problems: ["top-k-frequent-elements", "valid-anagram", "task-scheduler", "permutation-in-string"],
},
{
  id: "defaultdict",
  name: "collections.defaultdict",
  tag: "auto-initializing map",
  blurb: "A dict that builds a default value the first time a key is read, so the \"is this key here yet?\" branch disappears.",
  use: "Adjacency lists (defaultdict(list)), grouping, counting (defaultdict(int)), sets of neighbors (defaultdict(set)).",
  imports: "from collections import defaultdict",
  ops: [
    ["d[k] on a missing key", "O(1)", "Calls the factory, stores the result, returns it."],
    ["defaultdict(list) / (int) / (set)", "O(1)", "The three you will use over and over."],
    ["defaultdict(lambda: [0] * 26)", "O(1) per new key", "Any zero-argument callable works as a factory."],
  ],
  code: `from collections import defaultdict

# Adjacency list from an edge list — the graph one-liner.
graph = defaultdict(list)
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)               # undirected

# Grouping.
groups = defaultdict(list)
for w in words:
    groups[tuple(sorted(w))].append(w)

# Counting.
freq = defaultdict(int)
for n in nums:
    freq[n] += 1`,
  gotchas: [
    "Merely READING a missing key inserts it — so `if graph[x]:` can silently grow the dict and change len().",
    "Use .get(k) or `k in d` when you want a pure lookup with no side effect.",
  ],
  problems: ["course-schedule", "clone-graph", "group-anagrams", "alien-dictionary"],
},
{
  id: "heapq",
  name: "heapq",
  tag: "binary min-heap",
  blurb: "A min-heap over an ordinary list. Push and pop in O(log n), peek the minimum in O(1). Python has no max-heap — you negate.",
  use: "Top-k, k-way merge, running median (two heaps), Dijkstra and Prim, and any \"always take the smallest remaining\" scheduler.",
  imports: "import heapq",
  ops: [
    ["heapq.heappush(h, x)", "O(log n)", "h is just a list kept in heap order."],
    ["heapq.heappop(h)", "O(log n)", "Removes and returns the smallest."],
    ["h[0]", "O(1)", "Peek the minimum without popping."],
    ["heapq.heapify(a)", "O(n)", "Turns an existing list into a heap in place — cheaper than n pushes."],
    ["heappushpop / heapreplace", "O(log n)", "One sift instead of two — the fast way to keep a size-k heap."],
    ["nlargest(k, it) / nsmallest", "O(n log k)", "Convenient, but a manual size-k heap avoids the extra copy."],
  ],
  code: `import heapq

# Top-k largest: keep a MIN-heap of size k, evict the smallest.
h = []
for n in nums:
    heapq.heappush(h, n)
    if len(h) > k:
        heapq.heappop(h)
kth_largest = h[0]

# Max-heap: negate on the way in and on the way out.
maxheap = [-n for n in nums]
heapq.heapify(maxheap)
largest = -heapq.heappop(maxheap)

# Keyed entries: tuples compare left to right.
heapq.heappush(pq, (dist, node))
d, node = heapq.heappop(pq)

# Tie-break with a counter so unorderable payloads are never compared.
heapq.heappush(pq, (priority, next(counter), task))`,
  gotchas: [
    "heapq is min-only. For a max-heap negate the key (works for numbers; for strings sort differently).",
    "A heap is NOT sorted — only h[0] is meaningful. Iterating gives you heap order, not sorted order.",
    "If two tuples tie on the first element Python compares the next one; add a unique counter when the payload is not comparable.",
    "There is no decrease-key. In Dijkstra, push the improved distance again and skip stale pops.",
  ],
  problems: ["kth-largest-element-in-an-array", "find-median-from-data-stream", "merge-k-sorted-lists", "network-delay-time"],
},
{
  id: "bisect",
  name: "bisect",
  tag: "binary search on a sorted list",
  blurb: "Binary search over an already-sorted list, without you writing the off-by-one. bisect_left is lower_bound, bisect_right is upper_bound.",
  use: "Insertion points, counting elements ≤ x, patience sorting for LIS, any \"find the first element ≥ target\".",
  imports: "from bisect import bisect_left, bisect_right, insort",
  ops: [
    ["bisect_left(a, x)", "O(log n)", "First index where x could go — the first element ≥ x."],
    ["bisect_right(a, x)", "O(log n)", "Past the last x — so bisect_right − bisect_left counts occurrences."],
    ["insort(a, x)", "O(n)", "The search is log n but the insert shifts — do not build a list this way in a loop."],
    ["key= parameter (3.10+)", "O(log n)", "Search a list of records by one field without decorating it."],
  ],
  code: `from bisect import bisect_left, bisect_right, insort

i = bisect_left(a, x)                # first index with a[i] >= x
j = bisect_right(a, x)               # first index with a[j] > x
count_of_x = j - i
exists = i < len(a) and a[i] == x

# Longest Increasing Subsequence in O(n log n): tails[i] = smallest
# possible tail of an increasing subsequence of length i + 1.
tails = []
for n in nums:
    i = bisect_left(tails, n)
    if i == len(tails):
        tails.append(n)
    else:
        tails[i] = n
lis = len(tails)`,
  gotchas: [
    "The list must already be sorted — bisect will happily return nonsense otherwise.",
    "insort is O(n) per call, so n inserts is O(n²). Sort once, or use a heap, or sortedcontainers (not in the stdlib).",
  ],
  problems: ["longest-increasing-subsequence", "time-based-key-value-store", "search-a-2d-matrix"],
},
{
  id: "stdlib",
  name: "Interview stdlib grab bag",
  tag: "functools, itertools, math",
  blurb: "The handful of stdlib helpers that actually come up: memoization, infinity, integer math, and a few iterator tools.",
  use: "Cutting boilerplate out of DP, comparisons, and combinatorics.",
  imports: "from functools import cache, lru_cache, cmp_to_key\nimport math, itertools",
  ops: [
    ["@cache / @lru_cache(None)", "O(1) per hit", "Turns a plain recursion into top-down DP. Arguments must be hashable."],
    ["math.inf, -math.inf", "O(1)", "Safe initial values for min/max sweeps; float('inf') is the same thing."],
    ["divmod(a, b)", "O(1)", "Quotient and remainder together — handy for grid index ↔ (r, c)."],
    ["math.gcd(a, b), math.comb(n, k)", "O(log n), O(k)", "No need to hand-roll Euclid or Pascal."],
    ["itertools.accumulate(a)", "O(n)", "Running prefix sums (pass an operator for prefix products/max)."],
    ["itertools.pairwise(a) (3.10+)", "O(n)", "Adjacent pairs without the zip(a, a[1:]) copy."],
    ["cmp_to_key(f)", "O(1) wrap", "When the order needs a pairwise comparison, not a key."],
  ],
  code: `from functools import cache
import math, itertools

# Top-down DP: memoization for free.
@cache
def dp(i, remaining):
    if remaining == 0: return 1
    if i == len(coins) or remaining < 0: return 0
    return dp(i + 1, remaining) + dp(i, remaining - coins[i])

best = -math.inf
r, c = divmod(idx, cols)                 # flat index -> grid cell
prefix = list(itertools.accumulate(nums))
for a, b in itertools.pairwise(nums):    # adjacent pairs
    ...

# Custom pairwise ordering (e.g. "largest number" concatenation).
from functools import cmp_to_key
nums.sort(key=cmp_to_key(lambda a, b: (b + a > a + b) - (b + a < a + b)))`,
  gotchas: [
    "@cache on a method keeps `self` alive in the cache — fine for one interview call, a leak in real code.",
    "A memoized function that takes a list argument will raise: convert to a tuple first.",
    "Recursion in CPython dies around depth 1000; deep DFS on a 10⁵-node line graph needs an iterative rewrite.",
  ],
  problems: ["coin-change-ii", "climbing-stairs", "longest-common-subsequence"],
},
]],

["Sorted containers", [
{
  id: "sortedlist",
  name: "sortedcontainers.SortedList",
  tag: "sorted multiset",
  blurb: "A sequence kept in sorted order with O(log n) insert and delete — and, unlike a heap, positional indexing, so you can read the min, the max, and the k-th element of the same live collection.",
  use: "When the collection changes AND you need order statistics from it: the median of a stream, the max and min of a window, \"the smallest value above x\" as things come and go.",
  imports: "from sortedcontainers import SortedList",
  ops: [
    ["SortedList(iterable)", "O(n log n)", "Or SortedList() and add as you go."],
    ["sl.add(x)", "O(log n)", "Keeps the order. This is bisect.insort without the O(n) shift."],
    ["sl.remove(x) / sl.discard(x)", "O(log n)", "Removes by VALUE. remove raises if absent, discard does not."],
    ["sl[i], sl[0], sl[-1]", "O(log n)", "Positional indexing — the thing a heap can never give you."],
    ["sl.bisect_left(x) / bisect_right(x)", "O(log n)", "Same semantics as the bisect module, on a live structure."],
    ["x in sl, sl.index(x), sl.count(x)", "O(log n)", "count matters: this is a multiset, duplicates are kept."],
    ["sl.pop(i)", "O(log n)", "Defaults to the last element."],
    ["sl.irange(lo, hi)", "O(log n + k)", "Iterate just the values in a range, without slicing a copy."],
    ["len(sl)", "O(1)", "Cached."],
  ],
  code: `from sortedcontainers import SortedList

sl = SortedList([5, 1, 3])           # [1, 3, 5]
sl.add(2)                            # [1, 2, 3, 5]
sl.discard(3)                        # [1, 2, 5]   — no error if absent

sl[0], sl[-1]                        # min and max, by position
sl[len(sl) // 2]                     # the median, in O(log n)

i = sl.bisect_left(4)                # first index with sl[i] >= 4
list(sl.irange(2, 5))                # every value in [2, 5]

# A window that needs BOTH ends: add on the right, remove by value on the left.
def window_spreads(nums, k):
    window, out = SortedList(), []
    for r, n in enumerate(nums):
        window.add(n)
        if r >= k:
            window.remove(nums[r - k])       # arbitrary removal — a heap cannot
        if r >= k - 1:
            out.append(window[-1] - window[0])   # max - min of the window
    return out

# Sort by a derived key with SortedList(key=...) -> a SortedKeyList.
by_end = SortedList(intervals, key=lambda iv: iv[1])`,
  gotchas: [
    "sortedcontainers is NOT in the standard library. LeetCode's judge has it; a bare python3 does not, and some interviewers will not let you import it. Know the stdlib fallback below.",
    "It is a multiset — SortedList([1, 1]) keeps both. Use SortedSet when you want uniqueness.",
    "remove(x) deletes by value, not by index; pop(i) deletes by index. Mixing them up silently removes the wrong element.",
    "Never mutate an object after inserting it in a way that changes its sort order — the tree invariant breaks and lookups start missing.",
    "The O(log n) is real but the constant is a Python-level B-tree of lists. When a monotonic deque or a heap applies, it is still several times faster.",
  ],
  problems: ["sliding-window-maximum", "find-median-from-data-stream", "kth-largest-element-in-a-stream"],
},
{
  id: "sorteddict",
  name: "SortedDict / SortedSet",
  tag: "sorted map · sorted set",
  blurb: "The same B-tree, keyed. A dict whose keys stay in sorted order, and a set you can index and range-scan — the ordered map and ordered set that Python otherwise lacks.",
  use: "Floor/ceiling lookups (\"the closest key at or below x\"), sweep lines over event times, and any place you would reach for C++ std::map or Java TreeMap.",
  imports: "from sortedcontainers import SortedDict, SortedSet",
  ops: [
    ["sd[k] = v, del sd[k]", "O(log n)", "Ordinary dict syntax, order maintained."],
    ["iterate sd", "O(n)", "Yields keys in SORTED order, not insertion order."],
    ["sd.bisect_left(k) / bisect_right(k)", "O(log n)", "Index of a key in key order — the floor/ceiling primitive."],
    ["sd.keys()[i], sd.peekitem(i)", "O(log n)", "Indexable views. peekitem(-1) is the largest key."],
    ["sd.irange(lo, hi)", "O(log n + k)", "Keys within a range; irange_key on a SortedKeyList."],
    ["sd.popitem(i)", "O(log n)", "Pop by position — index 0 for the smallest key."],
    ["ss.add(x) / ss.discard(x) / ss[i]", "O(log n)", "SortedSet: unique, ordered, and indexable."],
    ["ss | ss2, ss & ss2, ss - ss2", "O(n log n)", "Set algebra, result still sorted."],
  ],
  code: `from sortedcontainers import SortedDict, SortedSet

sd = SortedDict({5: "e", 1: "a", 3: "c"})    # iterates keys 1, 3, 5

# Floor / ceiling of a key that need not be present.
i = sd.bisect_left(4)                        # 2 — the position in key order
ceiling = sd.keys()[i] if i < len(sd) else None       # 5
floor = sd.keys()[i - 1] if i else None               # 3

k, v = sd.peekitem(-1)                       # largest key and its value
list(sd.irange(2, 4))                        # [3] — keys inside [2, 4]

# Sweep line: a sorted map of deltas gives concurrency at every event time.
def max_concurrent(intervals):
    delta = SortedDict()
    for start, end in intervals:
        delta[start] = delta.get(start, 0) + 1
        delta[end] = delta.get(end, 0) - 1
    live = peak = 0
    for t in delta:                          # already in time order
        live += delta[t]
        peak = max(peak, live)
    return peak

ss = SortedSet([3, 1, 3])                    # SortedSet([1, 3]) — deduped
ss[0], ss.bisect_left(2), list(ss.irange(1, 3))`,
  gotchas: [
    "A plain dict is INSERTION-ordered, not key-sorted, and so is OrderedDict. If you need keys in sorted order you need this, or a list you re-sort.",
    "SortedSet drops duplicates, so it cannot answer \"how many copies of x\" — that is SortedList's job.",
    "peekitem(i) takes a position, not a key. peekitem(0) is the smallest; there is no peekitem(key).",
    "Deleting a key while iterating a view mutates the view underneath you — snapshot with list(sd) first.",
  ],
  problems: ["time-based-key-value-store", "meeting-rooms-ii", "minimum-interval-to-include-each-query"],
},
{
  id: "ordered-fallbacks",
  name: "Stdlib fallbacks for ordered data",
  tag: "bisect · heap · Fenwick",
  blurb: "sortedcontainers ships with no Python. These three cover nearly everything it does using only the standard library — and one of them is what the interviewer is actually asking for.",
  use: "Any time you would reach for a SortedList but cannot import one: pick by which operations you actually need.",
  imports: "from bisect import bisect_left, insort\nimport heapq\nfrom collections import Counter",
  ops: [
    ["sorted list + insort", "O(log n) search, O(n) insert", "The memmove is C-speed, so this beats a Python B-tree up to roughly 10⁴–10⁵ inserts."],
    ["heap + lazy deletion", "O(log n) amortized", "Arbitrary removal, deferred until the element reaches the top."],
    ["two heaps", "O(log n) add, O(1) median", "When the only order statistic you need is a fixed rank."],
    ["Fenwick tree (BIT)", "O(log n)", "Counts, ranks, and k-th smallest over a compressed value range."],
    ["sorted() once, then scan", "O(n log n)", "The best answer whenever the collection does not actually change."],
  ],
  code: `# 1. Sorted list + bisect — simplest, and fast enough far more often than you expect.
from bisect import bisect_left, insort
arr = []
insort(arr, x)                       # O(n) shift, tiny constant
i = bisect_left(arr, target)

# 2. Heap + lazy deletion — arbitrary removal without a tree.
import heapq
from collections import Counter

class LazyHeap:
    def __init__(self):
        self.heap, self.pending = [], Counter()

    def push(self, x):
        heapq.heappush(self.heap, x)

    def remove(self, x):             # O(1) now; paid for at the top later
        self.pending[x] += 1

    def top(self):
        while self.heap and self.pending[self.heap[0]]:
            self.pending[self.heap[0]] -= 1
            heapq.heappop(self.heap)
        return self.heap[0] if self.heap else None

# 3. Fenwick tree over compressed values — ranks and k-th smallest.
class BIT:
    def __init__(self, n):
        self.n = n
        self.tree = [0] * (n + 1)

    def add(self, i, delta=1):       # i is 1-based
        while i <= self.n:
            self.tree[i] += delta
            i += i & -i

    def prefix(self, i):             # how many stored values are <= i
        total = 0
        while i > 0:
            total += self.tree[i]
            i -= i & -i
        return total

    def kth(self, k):                # smallest i with prefix(i) >= k
        pos, step = 0, 1 << self.n.bit_length()
        while step:
            nxt = pos + step
            if nxt <= self.n and self.tree[nxt] < k:
                pos, k = nxt, k - self.tree[nxt]
            step >>= 1
        return pos + 1`,
  gotchas: [
    "Check the constraints before assuming insort is too slow: n ≤ 10⁴ with an O(n) insert is 10⁸ byte-moves in C, which runs in well under a second.",
    "Lazy deletion only cleans the top, so the heap keeps every stale entry in memory. Bound it by also tracking a live count if the churn is large.",
    "A Fenwick tree indexes by VALUE, not by position, so large or sparse values need coordinate compression first (sorted(set(values)) and a value → rank dict).",
    "BIT indices are 1-based. Using 0 makes add loop forever, since 0 + (0 & -0) is 0.",
  ],
  problems: ["find-median-from-data-stream", "sliding-window-maximum", "kth-largest-element-in-an-array"],
},
]],

["Structures you write yourself", [
{
  id: "listnode",
  name: "ListNode (singly linked list)",
  tag: "pointers",
  blurb: "The node class LeetCode hands you. Everything is pointer rewiring — and almost every rewiring bug is fixed by a dummy head.",
  use: "Reversal, merging, cycle detection, removing the k-th node, reordering.",
  imports: "",
  ops: [
    ["access by index", "O(n)", "No random access — you walk."],
    ["insert / delete given the previous node", "O(1)", "The one thing linked lists beat arrays at."],
    ["length", "O(n)", "Walk it, or track it yourself."],
  ],
  code: `class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

# Dummy head: removes every "what if the head changes?" special case.
def remove_all(head, target):
    dummy = ListNode(0, head)
    prev = dummy
    while prev.next:
        if prev.next.val == target:
            prev.next = prev.next.next   # delete without touching head
        else:
            prev = prev.next
    return dummy.next

# Reverse in place: three pointers, no allocation.
def reverse(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next
        cur.next = prev
        prev, cur = cur, nxt
    return prev`,
  gotchas: [
    "Save cur.next BEFORE you overwrite it, or you lose the rest of the list.",
    "Return dummy.next, never dummy, and never the original head after a reversal.",
    "Check `while fast and fast.next` before stepping two — the order of those two checks matters.",
  ],
  problems: ["reverse-linked-list", "merge-two-sorted-lists", "reorder-list", "remove-nth-node-from-end-of-list"],
},
{
  id: "treenode",
  name: "TreeNode (binary tree)",
  tag: "recursion",
  blurb: "Two children and a value. Almost every tree problem is one recursive function whose return value is chosen well.",
  use: "Traversals, depth and diameter, validation, BST search, lowest common ancestor, path sums.",
  imports: "",
  ops: [
    ["DFS traversal", "O(n) time, O(h) space", "h = height; O(log n) balanced, O(n) in a degenerate chain."],
    ["BFS level order", "O(n) time, O(w) space", "w = widest level, up to n/2 leaves."],
    ["BST search / insert", "O(h)", "O(log n) only while the tree stays balanced."],
  ],
  code: `class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

# Top-down: pass state DOWN as arguments.
def valid(node, lo, hi):
    if not node: return True
    if not (lo < node.val < hi): return False
    return valid(node.left, lo, node.val) and valid(node.right, node.val, hi)

# Bottom-up: return facts UP and combine them. Depth and diameter in one pass.
best = 0
def depth(node):
    nonlocal best
    if not node: return 0
    l, r = depth(node.left), depth(node.right)
    best = max(best, l + r)          # path through this node
    return 1 + max(l, r)`,
  gotchas: [
    "Handle `if not node` first — it is the base case for essentially every tree recursion.",
    "In a BST, an in-order walk visits values in sorted order. That single fact solves validation and k-th smallest.",
    "Node values can be negative; initialize path-sum answers to -inf, not 0.",
  ],
  problems: ["invert-binary-tree", "diameter-of-binary-tree", "validate-binary-search-tree", "binary-tree-maximum-path-sum"],
},
{
  id: "trie",
  name: "Trie (prefix tree)",
  tag: "dict of dicts",
  blurb: "A tree keyed by characters: shared prefixes share a path. Lookup costs the length of the word, never the size of the dictionary.",
  use: "Prefix queries, autocomplete, wildcard word search, and pruning a grid DFS against a whole word list at once.",
  imports: "",
  ops: [
    ["insert(word)", "O(L)", "L = word length, independent of how many words are stored."],
    ["search(word) / startsWith(prefix)", "O(L)", "Walk one character at a time."],
    ["space", "O(total characters)", "Shared prefixes are stored once."],
  ],
  code: `class TrieNode:
    def __init__(self):
        self.children = {}           # char -> TrieNode
        self.word = False

class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for c in word:
            node = node.children.setdefault(c, TrieNode())
        node.word = True

    def _walk(self, s):
        node = self.root
        for c in s:
            if c not in node.children:
                return None
            node = node.children[c]
        return node

    def search(self, word):
        node = self._walk(word)
        return bool(node and node.word)

    def startsWith(self, prefix):
        return self._walk(prefix) is not None

# Lightweight version: nested plain dicts, "$" marks a complete word.
root = {}
for w in words:
    node = root
    for c in w:
        node = node.setdefault(c, {})
    node["$"] = w`,
  gotchas: [
    "The end-of-word flag is not optional — without it \"app\" looks present just because \"apple\" is.",
    "For Word Search II, walk the trie alongside the grid DFS and delete leaves as you match, or you re-find the same words.",
  ],
  problems: ["implement-trie-prefix-tree", "design-add-and-search-words-data-structure", "word-search-ii"],
},
{
  id: "unionfind",
  name: "Union-Find (disjoint set union)",
  tag: "near O(1) per op",
  blurb: "Tracks a partition into disjoint groups. With path compression and union by size, each operation is effectively constant (inverse Ackermann).",
  use: "Connected components, cycle detection in an undirected graph, Kruskal's MST, \"are these two in the same group?\" queries.",
  imports: "",
  ops: [
    ["find(x)", "O(α(n)) ≈ O(1)", "Path compression flattens the tree as it walks."],
    ["union(a, b)", "O(α(n)) ≈ O(1)", "Attaches the smaller tree under the larger."],
    ["component count", "O(1)", "Start at n and decrement on every successful union."],
  ],
  code: `class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n
        self.count = n               # number of components

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path halving
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False             # already together -> this edge closes a cycle
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        self.count -= 1
        return True

def find_redundant(n, edges):
    dsu = DSU(n)
    for u, v in edges:
        if not dsu.union(u, v):
            return [u, v]            # this edge closes a cycle`,
  gotchas: [
    "Compare ROOTS, not raw values — `if a == b` instead of `if find(a) == find(b)` is the classic bug.",
    "Without union by size the tree can degenerate into a chain and find becomes O(n).",
    "Union-Find handles undirected connectivity only; directed cycles need DFS colors or Kahn's algorithm.",
  ],
  problems: ["number-of-connected-components-in-an-undirected-graph", "redundant-connection", "graph-valid-tree", "min-cost-to-connect-all-points"],
},
{
  id: "graph",
  name: "Graph as an adjacency list",
  tag: "dict of lists",
  blurb: "There is no graph class — you build a dict from node to neighbors, and every graph algorithm reads from that.",
  use: "Anything with edges: courses and prerequisites, flights, word ladders, islands (an implicit grid graph).",
  imports: "from collections import defaultdict",
  ops: [
    ["build from an edge list", "O(V + E)", "One pass over the edges."],
    ["iterate a node's neighbors", "O(deg(v))", "Total O(E) across a full traversal."],
    ["DFS / BFS", "O(V + E)", "Every node and edge visited once, given a visited set."],
  ],
  code: `from collections import defaultdict

graph = defaultdict(list)
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)               # drop this line if directed

indegree = [0] * n                   # for topological sort
for u, v in edges:
    indegree[v] += 1

# A grid IS a graph — neighbors are computed, not stored.
DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))
def neighbors(r, c):
    for dr, dc in DIRS:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols:
            yield nr, nc

# Weighted: store (neighbor, weight) pairs.
wgraph = defaultdict(list)
for u, v, w in edges:
    wgraph[u].append((v, w))`,
  gotchas: [
    "Add both directions for an undirected graph, exactly one for a directed one — getting this backwards breaks cycle detection.",
    "Nodes with no edges never appear in a defaultdict built from edges; iterate range(n) when isolated nodes matter.",
    "A visited set is mandatory. Without it any cycle is an infinite loop.",
  ],
  problems: ["clone-graph", "course-schedule", "number-of-islands", "word-ladder"],
},
]],

];

const PY_PATTERNS = [

["Arrays & strings", [
{
  id: "two-pointers-ends",
  name: "Two pointers from both ends",
  signals: ["a sorted array", "\"find a pair that…\"", "palindromes", "maximize something between two indices"],
  time: "O(n)", space: "O(1)",
  code: `def two_pointers(arr, target):
    l, r = 0, len(arr) - 1
    while l < r:
        total = arr[l] + arr[r]
        if total == target:
            return [l, r]
        if total < target:
            l += 1               # need a bigger sum
        else:
            r -= 1               # need a smaller sum
    return []`,
  notes: [
    "This works only because the array is sorted: moving a pointer changes the sum in a known direction, so each step eliminates a whole row or column of the pair grid.",
    "For 3Sum, fix the first element in an outer loop and run this on the rest — and skip duplicate values at every level.",
    "In Container With Most Water always move the SHORTER line: the shorter one is the binding constraint, so moving the taller one can never help.",
  ],
  problems: ["two-sum-ii-input-array-is-sorted", "3sum", "container-with-most-water", "valid-palindrome", "trapping-rain-water"],
},
{
  id: "hash-map-seen",
  name: "Hash map of what you have seen",
  signals: ["\"find a pair / complement\"", "\"has this appeared before?\"", "grouping by a computed key", "an O(n²) double loop that only needs a lookup"],
  time: "O(n)", space: "O(n)",
  code: `# One pass: check for the complement BEFORE storing the current value,
# so an element can never pair with itself.
def two_sum(nums, target):
    seen = {}                            # value -> index
    for i, n in enumerate(nums):
        if target - n in seen:
            return [seen[target - n], i]
        seen[n] = i

# Group by a canonical key — anagrams share a letter-count signature.
from collections import defaultdict

def group_anagrams(words):
    groups = defaultdict(list)
    for w in words:
        key = tuple(sorted(w))           # or a 26-slot count tuple, O(k)
        groups[key].append(w)
    return list(groups.values())

# Membership only? A set is the same idea without the values.
def has_duplicate(nums):
    seen = set()
    for n in nums:
        if n in seen:
            return True
        seen.add(n)
    return False`,
  notes: [
    "The whole move is trading O(n) space for the inner loop: anything you would re-scan for, store keyed by what you will look it up by.",
    "Check first, then insert. Inserting first lets an element match itself — the classic Two Sum off-by-one.",
    "Choosing the KEY is the real work: a sorted tuple of letters, a 26-count tuple, (row, col, box) for Sudoku, a normalized shape for grouped islands.",
  ],
  problems: ["two-sum", "contains-duplicate", "group-anagrams", "valid-sudoku", "longest-consecutive-sequence"],
},
{
  id: "sliding-window-variable",
  name: "Sliding window (variable size)",
  signals: ["\"longest / shortest subarray or substring such that…\"", "a constraint that breaks when the window grows and heals when it shrinks"],
  time: "O(n)", space: "O(k)",
  code: `def longest_valid(s):
    window = {}                  # or a Counter / running sum
    best, l = 0, 0
    for r, ch in enumerate(s):
        window[ch] = window.get(ch, 0) + 1      # expand right

        while INVALID(window):                  # shrink from the left
            window[s[l]] -= 1
            if window[s[l]] == 0:
                del window[s[l]]
            l += 1

        best = max(best, r - l + 1)             # window is valid here
    return best`,
  notes: [
    "Each index enters the window once and leaves once, so the inner while does not make this quadratic — it is O(n) total.",
    "For a LONGEST answer, record the size after shrinking back to valid. For a SHORTEST, shrink while still valid and record inside the loop.",
    "The pattern only applies when validity is monotone: growing can only break the constraint, shrinking can only fix it. Negative numbers break that for sum problems — use prefix sums instead.",
  ],
  problems: ["longest-substring-without-repeating-characters", "longest-repeating-character-replacement", "minimum-window-substring"],
},
{
  id: "sliding-window-fixed",
  name: "Sliding window (fixed size k)",
  signals: ["\"every window of size k\"", "\"a permutation of s1 inside s2\"", "a rolling average or sum"],
  time: "O(n)", space: "O(k)",
  code: `def fixed_window(nums, k):
    total = sum(nums[:k])
    best = total
    for r in range(k, len(nums)):
        total += nums[r] - nums[r - k]    # add the new, drop the old
        best = max(best, total)
    return best`,
  notes: [
    "The whole trick is the incremental update: never recompute the window from scratch, or you are back to O(n·k).",
    "For character-count windows compare two 26-slot arrays, or keep a `matches` counter and update it by ±1 as counts change.",
    "When the window's answer is a max or min rather than a sum, a plain counter is not enough — use a monotonic deque.",
  ],
  problems: ["permutation-in-string", "sliding-window-maximum"],
},
{
  id: "fast-slow",
  name: "Fast & slow pointers",
  signals: ["\"does it have a cycle?\"", "\"find the middle\"", "\"the duplicate number without modifying the array\""],
  time: "O(n)", space: "O(1)",
  code: `def has_cycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            break
    else:
        return None              # fast fell off the end: no cycle

    # Floyd phase 2: a second walker from the head meets slow at the entrance.
    slow2 = head
    while slow2 is not slow:
        slow = slow.next
        slow2 = slow2.next
    return slow                  # start of the cycle`,
  notes: [
    "Distance argument: when they meet, the distance from the head to the cycle entrance equals the distance from the meeting point to the entrance. That is why phase 2 works.",
    "Same loop finds the middle: when fast falls off, slow is at the midpoint (the second middle for even lengths).",
    "Find the Duplicate Number is this algorithm in disguise — treat nums[i] as a pointer from i to nums[i].",
  ],
  problems: ["linked-list-cycle", "find-the-duplicate-number", "reorder-list"],
},
{
  id: "prefix-sum",
  name: "Prefix sums & running products",
  signals: ["many range-sum queries", "\"subarray sums to k\"", "\"product of everything except self\""],
  time: "O(n) build, O(1) per query", space: "O(n)",
  code: `# Range sums: prefix[i] = sum of the first i elements.
prefix = [0]
for n in nums:
    prefix.append(prefix[-1] + n)
range_sum = prefix[j + 1] - prefix[i]          # inclusive i..j

# Count subarrays summing to k — prefix sums + a hash map.
seen = {0: 1}                                  # empty prefix
running = count = 0
for n in nums:
    running += n
    count += seen.get(running - k, 0)
    seen[running] = seen.get(running, 0) + 1

# Prefix/suffix passes without division (Product of Array Except Self).
out = [1] * len(nums)
pre = 1
for i in range(len(nums)):
    out[i] = pre
    pre *= nums[i]
suf = 1
for i in range(len(nums) - 1, -1, -1):
    out[i] *= suf
    suf *= nums[i]`,
  notes: [
    "Seeding the map with {0: 1} accounts for subarrays that start at index 0 — forgetting it is the standard bug.",
    "This is the tool when a sliding window fails because values can be negative.",
    "The two-pass prefix/suffix idea generalizes: max, min, and gcd all work the same way.",
  ],
  problems: ["product-of-array-except-self", "maximum-subarray", "best-time-to-buy-and-sell-stock"],
},
{
  id: "monotonic-stack",
  name: "Monotonic stack",
  signals: ["\"next greater / previous smaller element\"", "histograms and rectangles", "\"how many days until…\""],
  time: "O(n)", space: "O(n)",
  code: `def next_greater(nums):
    res = [-1] * len(nums)
    stack = []                   # indices, values DECREASING bottom -> top
    for i, n in enumerate(nums):
        while stack and nums[stack[-1]] < n:
            res[stack.pop()] = n     # n is the answer for that index
        stack.append(i)
    return res

# Largest rectangle: pop when the bar breaks the increasing invariant,
# and the popped bar's width runs from the new left boundary to i.
def largest_rectangle(heights):
    stack = []                   # (start_index, height), heights INCREASING
    best = 0
    for i, h in enumerate(heights + [0]):    # sentinel flushes the stack
        start = i
        while stack and stack[-1][1] > h:
            idx, height = stack.pop()
            best = max(best, height * (i - idx))
            start = idx          # this bar can extend back to there
        stack.append((start, h))
    return best`,
  notes: [
    "Choose the invariant by the question: a decreasing stack answers \"next greater\", an increasing stack answers \"next smaller\".",
    "Each index is pushed once and popped once — that is why the nested while is still O(n).",
    "Appending a sentinel (0, or infinity) saves a duplicated flush loop after the main pass.",
  ],
  problems: ["daily-temperatures", "largest-rectangle-in-histogram", "car-fleet", "min-stack"],
},
]],

["Binary search", [
{
  id: "binary-search-index",
  name: "Binary search on an index",
  signals: ["a sorted array", "O(log n) demanded", "\"find the first / last position where…\""],
  time: "O(log n)", space: "O(1)",
  code: `def search(nums, target):
    l, r = 0, len(nums) - 1              # INCLUSIVE bounds
    while l <= r:
        mid = (l + r) // 2               # Python ints never overflow
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            l = mid + 1
        else:
            r = mid - 1
    return -1

# Lower bound (first index with nums[i] >= target) — half-open bounds.
def lower_bound(nums, target):
    l, r = 0, len(nums)                  # r is EXCLUSIVE
    while l < r:
        mid = (l + r) // 2
        if nums[mid] < target:
            l = mid + 1
        else:
            r = mid                      # keep mid as a candidate
    return l                             # == bisect_left(nums, target)`,
  notes: [
    "Pick one bound convention and stay in it. Inclusive `l <= r` with mid ± 1, or half-open `l < r` with r = mid. Mixing them is where infinite loops come from.",
    "The half-open form never needs an equality check and returns an insertion point, which is usually what the harder problems actually want.",
    "In a rotated array, one half is always sorted: work out which, then decide whether the target lies inside it.",
  ],
  problems: ["binary-search", "search-a-2d-matrix", "find-minimum-in-rotated-sorted-array", "search-in-rotated-sorted-array"],
},
{
  id: "binary-search-answer",
  name: "Binary search on the answer",
  signals: ["\"minimum speed / capacity / time such that it works\"", "a small answer range and an expensive verifier", "the answer is monotone: if x works, x+1 works"],
  time: "O(n log(range))", space: "O(1)",
  code: `def min_feasible(lo, hi, feasible):
    while lo < hi:
        mid = (lo + hi) // 2
        if feasible(mid):
            hi = mid             # mid might be the answer — keep it
        else:
            lo = mid + 1         # mid is too small
    return lo

# Koko Eating Bananas: is speed k fast enough?
def feasible(k):
    return sum(math.ceil(p / k) for p in piles) <= h

answer = min_feasible(1, max(piles), feasible)`,
  notes: [
    "You are not searching the array, you are searching the space of possible answers. Write feasible(x) first, then confirm it is monotone — false…false, true…true.",
    "Bounds: lo is the smallest conceivable answer, hi the largest that is obviously fine. Getting hi wrong is easier to debug than getting the loop wrong.",
    "For a maximum instead of a minimum, flip it: `if feasible(mid): lo = mid` with `mid = (lo + hi + 1) // 2` to avoid an infinite loop.",
  ],
  problems: ["koko-eating-bananas", "swim-in-rising-water", "median-of-two-sorted-arrays"],
},
]],

["Linked lists", [
{
  id: "reverse-list",
  name: "In-place reversal",
  signals: ["\"reverse the list / a sublist / every k nodes\"", "\"compare the list to its reverse\""],
  time: "O(n)", space: "O(1)",
  code: `def reverse(head):
    prev, cur = None, head
    while cur:
        nxt = cur.next           # save before overwriting
        cur.next = prev          # flip
        prev, cur = cur, nxt     # advance
    return prev                  # new head

# Reverse the first k nodes and return (new_head, new_tail).
def reverse_k(head, k):
    prev, cur = None, head
    for _ in range(k):
        cur.next, prev, cur = prev, cur, cur.next
    return prev, head            # head is now the tail of the reversed run`,
  notes: [
    "Three pointers, always in the same order: save next, flip, advance. Write it enough times that it is muscle memory.",
    "For a sublist or k-group, keep a pointer to the node BEFORE the run so you can stitch the reversed piece back in.",
    "Palindrome / reorder problems combine this with fast-slow: find the middle, reverse the second half, then walk both halves.",
  ],
  problems: ["reverse-linked-list", "reverse-nodes-in-k-group", "reorder-list"],
},
{
  id: "dummy-head",
  name: "Dummy head & two-pass merging",
  signals: ["the head might be removed or replaced", "merging sorted lists", "\"remove the n-th node from the end\""],
  time: "O(n)", space: "O(1)",
  code: `def merge(l1, l2):
    dummy = tail = ListNode()
    while l1 and l2:
        if l1.val <= l2.val:
            tail.next, l1 = l1, l1.next
        else:
            tail.next, l2 = l2, l2.next
        tail = tail.next
    tail.next = l1 or l2         # attach whatever is left
    return dummy.next

# Remove the n-th node from the end: gap of n, then walk both.
def remove_nth(head, n):
    dummy = ListNode(0, head)
    slow = fast = dummy
    for _ in range(n):
        fast = fast.next
    while fast.next:
        slow, fast = slow.next, fast.next
    slow.next = slow.next.next
    return dummy.next`,
  notes: [
    "A dummy node deletes the entire \"what if we remove the head?\" branch. Use one whenever the head can change.",
    "Starting both pointers at the dummy (not at head) is what makes removing the first node fall out of the general case.",
    "Merging k lists: either merge them pairwise (O(N log k)) or push the heads on a heap (also O(N log k)).",
  ],
  problems: ["merge-two-sorted-lists", "remove-nth-node-from-end-of-list", "merge-k-sorted-lists", "add-two-numbers"],
},
]],

["Trees", [
{
  id: "tree-dfs",
  name: "DFS on a tree (top-down vs bottom-up)",
  signals: ["depth, diameter, path sums", "validation with a value range", "\"is this a subtree of that?\""],
  time: "O(n)", space: "O(h)",
  code: `# Bottom-up: children return facts, the parent combines them.
def dfs(node):
    if not node:
        return 0                         # base case first, always
    left  = dfs(node.left)
    right = dfs(node.right)
    return 1 + max(left, right)          # max depth

# Top-down: carry state down through the arguments.
def dfs(node, lo, hi):
    if not node:
        return True
    if not (lo < node.val < hi):
        return False
    return dfs(node.left, lo, node.val) and dfs(node.right, node.val, hi)

# Iterative in-order (BST -> sorted order), when recursion is banned.
stack, cur = [], root
while stack or cur:
    while cur:
        stack.append(cur)
        cur = cur.left
    cur = stack.pop()
    visit(cur.val)
    cur = cur.right`,
  notes: [
    "Ask one question: does the parent need to SEND information down (top-down) or COLLECT it up (bottom-up)? That decides the signature.",
    "When the answer at a node is not the same thing you must return to the parent (diameter, max path sum), keep the global answer in a nonlocal variable and return the recursive quantity.",
    "In-order on a BST yields sorted values — that alone solves validation, k-th smallest, and \"two sum in a BST\".",
  ],
  problems: ["maximum-depth-of-binary-tree", "diameter-of-binary-tree", "validate-binary-search-tree", "kth-smallest-element-in-a-bst", "binary-tree-maximum-path-sum"],
},
{
  id: "tree-bfs",
  name: "BFS / level-order traversal",
  signals: ["\"level by level\"", "\"the right side view\"", "shortest path in an unweighted structure", "\"the minimum number of steps\""],
  time: "O(n)", space: "O(w)",
  code: `from collections import deque

def level_order(root):
    if not root:
        return []
    out, q = [], deque([root])
    while q:
        level = []
        for _ in range(len(q)):          # freeze this level's size FIRST
            node = q.popleft()
            level.append(node.val)
            if node.left:  q.append(node.left)
            if node.right: q.append(node.right)
        out.append(level)
    return out`,
  notes: [
    "`for _ in range(len(q))` is the whole trick: it snapshots the current level before you start adding the next one.",
    "The right side view is the last node of each level; the minimum depth is the first level containing a leaf.",
    "BFS gives shortest paths only when every edge costs the same. Weighted edges need Dijkstra.",
  ],
  problems: ["binary-tree-level-order-traversal", "binary-tree-right-side-view", "count-good-nodes-in-binary-tree"],
},
]],

["Graphs", [
{
  id: "grid-dfs",
  name: "Grid DFS / flood fill",
  signals: ["\"count the islands / regions\"", "\"the largest connected area\"", "\"cells reachable from the border\""],
  time: "O(rows·cols)", space: "O(rows·cols)",
  code: `def dfs(r, c):
    if not (0 <= r < rows and 0 <= c < cols) or grid[r][c] != "1":
        return 0
    grid[r][c] = "0"                     # mark BEFORE recursing
    return 1 + sum(dfs(r + dr, c + dc)
                   for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)))

islands = 0
for r in range(rows):
    for c in range(cols):
        if grid[r][c] == "1":
            dfs(r, c)
            islands += 1`,
  notes: [
    "Mark the cell visited BEFORE the recursive calls, or two neighbors bounce into each other forever.",
    "Mutating the grid is O(1) space beyond the recursion; use a separate visited set when the input must survive.",
    "A 1000×1000 grid can recurse 10⁶ deep and blow the stack — switch to an explicit stack or BFS at that size.",
  ],
  problems: ["number-of-islands", "max-area-of-island", "pacific-atlantic-water-flow", "surrounded-regions"],
},
{
  id: "multi-source-bfs",
  name: "BFS on a graph or grid (incl. multi-source)",
  signals: ["\"the fewest steps / shortest transformation\"", "\"how long until everything is infected\"", "distance from any of several starts"],
  time: "O(V + E)", space: "O(V)",
  code: `from collections import deque

# Seed the queue with EVERY source: one BFS gives the distance to the nearest.
def spread(grid):
    q = deque()
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == ROTTEN:
                q.append((r, c))

    minutes = 0
    while q:
        for _ in range(len(q)):          # one level = one minute
            r, c = q.popleft()
            for nr, nc in neighbors(r, c):
                if grid[nr][nc] == FRESH:
                    grid[nr][nc] = ROTTEN   # mark on ENQUEUE, not on dequeue
                    q.append((nr, nc))
        if q:
            minutes += 1
    return minutes`,
  notes: [
    "Mark visited when you enqueue. Marking on dequeue lets the same cell get queued several times and quietly turns BFS quadratic.",
    "Multi-source BFS costs the same as single-source and answers \"distance to the nearest source\" in one pass — no loop over sources.",
    "Level-by-level counting gives the step count; a distance dict gives the same thing per node if you prefer.",
  ],
  problems: ["rotting-oranges", "walls-and-gates", "word-ladder"],
},
{
  id: "topo-sort",
  name: "Topological sort (Kahn's algorithm)",
  signals: ["prerequisites and dependencies", "\"is there a valid ordering?\"", "cycle detection in a DIRECTED graph"],
  time: "O(V + E)", space: "O(V + E)",
  code: `from collections import defaultdict, deque

def topo_order(n, edges):                # edge (u, v): u must come before v
    graph = defaultdict(list)
    indeg = [0] * n
    for u, v in edges:
        graph[u].append(v)
        indeg[v] += 1

    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in graph[u]:
            indeg[v] -= 1
            if indeg[v] == 0:            # all prerequisites done
                q.append(v)

    return order if len(order) == n else []   # short order => a cycle exists`,
  notes: [
    "`len(order) < n` is the cycle test — the nodes stuck in a cycle never reach indegree 0.",
    "Get the edge direction right: \"take b before a\" means the edge runs b → a. Reversing it is the most common wrong answer.",
    "The DFS alternative uses three colors (unvisited / in-progress / done) and detects a cycle when it reaches an in-progress node; the reversed post-order is the topological order.",
  ],
  problems: ["course-schedule", "course-schedule-ii", "alien-dictionary"],
},
{
  id: "dijkstra",
  name: "Dijkstra (shortest path, weighted)",
  signals: ["weighted edges with non-negative costs", "\"the minimum time for the signal to reach everyone\"", "\"the cheapest path\""],
  time: "O(E log V)", space: "O(V + E)",
  code: `import heapq
from collections import defaultdict

def dijkstra(n, edges, src):
    graph = defaultdict(list)
    for u, v, w in edges:
        graph[u].append((v, w))

    dist = {}
    pq = [(0, src)]                      # (distance, node)
    while pq:
        d, u = heapq.heappop(pq)
        if u in dist:
            continue                     # stale entry — already finalized
        dist[u] = d
        for v, w in graph[u]:
            if v not in dist:
                heapq.heappush(pq, (d + w, v))
    return dist`,
  notes: [
    "heapq has no decrease-key, so you push improved distances and skip stale pops with the `if u in dist: continue` guard.",
    "The first time a node is popped, its distance is final — that is the invariant the whole algorithm rests on.",
    "Negative weights break it (use Bellman-Ford). All-equal weights make it pointless (use BFS). A limit of k stops makes it Bellman-Ford again.",
  ],
  problems: ["network-delay-time", "cheapest-flights-within-k-stops", "swim-in-rising-water", "min-cost-to-connect-all-points"],
},
]],

["Heaps & intervals", [
{
  id: "top-k-heap",
  name: "Top-k with a size-k heap",
  signals: ["\"the k largest / smallest / most frequent\"", "\"the k-th …\"", "a stream where you cannot hold everything"],
  time: "O(n log k)", space: "O(k)",
  code: `import heapq

# k largest: a MIN-heap of size k, evicting the smallest.
h = []
for n in nums:
    heapq.heappush(h, n)
    if len(h) > k:
        heapq.heappop(h)
kth_largest = h[0]

# By frequency, with a keyed heap.
from collections import Counter
count = Counter(nums)
h = []
for val, freq in count.items():
    heapq.heappush(h, (freq, val))
    if len(h) > k:
        heapq.heappop(h)
top_k = [val for freq, val in h]`,
  notes: [
    "The heap holds the k best seen so far and its root is the weakest of them — that is what makes each eviction O(log k) instead of O(log n).",
    "Sorting is O(n log n) and quickselect is O(n) average; the heap wins when k is small or the input is a stream.",
    "Top-k-by-frequency has an O(n) bucket-sort answer: index the buckets by count and read from the high end.",
  ],
  problems: ["kth-largest-element-in-an-array", "top-k-frequent-elements", "k-closest-points-to-origin", "kth-largest-element-in-a-stream"],
},
{
  id: "two-heaps",
  name: "Two heaps (running median)",
  signals: ["\"the median of a stream\"", "keeping a set split into a lower and an upper half"],
  time: "O(log n) per add, O(1) median", space: "O(n)",
  code: `import heapq

small, large = [], []                    # small: MAX-heap (negated), large: MIN-heap

def add(num):
    heapq.heappush(small, -num)
    # every element of small must be <= every element of large
    heapq.heappush(large, -heapq.heappop(small))
    if len(large) > len(small):          # keep small the same size or one bigger
        heapq.heappush(small, -heapq.heappop(large))

def median():
    if len(small) > len(large):
        return -small[0]
    return (-small[0] + large[0]) / 2`,
  notes: [
    "Push-then-rebalance unconditionally: it is shorter than comparing against the tops and impossible to get subtly wrong.",
    "The size invariant decides where the median lives — pick one (small ≥ large) and enforce it every add.",
    "Same shape solves \"IPO\"-style problems: one heap for what is available, one for what is affordable.",
  ],
  problems: ["find-median-from-data-stream"],
},
{
  id: "ordered-window",
  name: "Ordered multiset over a sliding window",
  signals: ["\"the max and the min of every window\"", "\"the k-th smallest as elements come and go\"", "you must remove an ARBITRARY element, not just the extreme"],
  time: "O(n log k)", space: "O(k)",
  code: `from sortedcontainers import SortedList

# Longest subarray where max - min <= limit.
def longest_window(nums, limit):
    window = SortedList()
    best = l = 0
    for r, n in enumerate(nums):
        window.add(n)
        while window[-1] - window[0] > limit:
            window.remove(nums[l])           # by value, not by index
            l += 1
        best = max(best, r - l + 1)
    return best

# Stdlib version: one monotonic deque per extreme. O(n), no third-party import.
from collections import deque

def longest_window_stdlib(nums, limit):
    maxq, minq = deque(), deque()            # decreasing / increasing indices
    best = l = 0
    for r, n in enumerate(nums):
        while maxq and nums[maxq[-1]] < n:
            maxq.pop()
        while minq and nums[minq[-1]] > n:
            minq.pop()
        maxq.append(r)
        minq.append(r)
        while nums[maxq[0]] - nums[minq[0]] > limit:
            if maxq[0] == l:
                maxq.popleft()
            if minq[0] == l:
                minq.popleft()
            l += 1
        best = max(best, r - l + 1)
    return best`,
  notes: [
    "Reach for an ordered multiset only when a heap genuinely will not do — that is, when you need to delete an element that is not at the top, or read a rank other than the extreme.",
    "If you need exactly one extreme per window, a monotonic deque is O(n) and beats this; two deques cover max AND min at the same cost.",
    "Removal is by value, so a multiset is required: two equal values in the window must delete one occurrence, not both.",
    "State the dependency out loud in an interview. SortedList is on LeetCode's judge but is third-party, so have the deque or two-heap answer ready.",
  ],
  problems: ["sliding-window-maximum", "find-median-from-data-stream", "longest-repeating-character-replacement"],
},
{
  id: "intervals",
  name: "Interval sorting & sweep",
  signals: ["\"merge overlapping intervals\"", "\"how many meeting rooms?\"", "\"the fewest removals to make them disjoint\""],
  time: "O(n log n)", space: "O(n)",
  code: `# Merge: sort by start, extend or append.
intervals.sort(key=lambda x: x[0])
merged = []
for start, end in intervals:
    if merged and start <= merged[-1][1]:
        merged[-1][1] = max(merged[-1][1], end)     # overlap -> extend
    else:
        merged.append([start, end])

# Max concurrent (Meeting Rooms II): a min-heap of end times.
import heapq
intervals.sort(key=lambda x: x[0])
ends = []
for start, end in intervals:
    if ends and ends[0] <= start:
        heapq.heappop(ends)                          # a room freed up
    heapq.heappush(ends, end)
rooms = len(ends)

# Non-overlapping: sort by END and greedily keep the earliest finisher.
intervals.sort(key=lambda x: x[1])
kept, last_end = 0, -math.inf
for start, end in intervals:
    if start >= last_end:
        kept += 1
        last_end = end`,
  notes: [
    "The sort key IS the algorithm: sort by start to merge, sort by end for maximum non-overlapping selection.",
    "Decide up front whether touching endpoints ([1,2] and [2,3]) count as overlapping — the whole solution hinges on `<` versus `<=`.",
    "The heap in Meeting Rooms II tracks rooms currently in use; its size at the end is the answer.",
  ],
  problems: ["merge-intervals", "insert-interval", "non-overlapping-intervals", "meeting-rooms-ii", "minimum-interval-to-include-each-query"],
},
]],

["Backtracking", [
{
  id: "backtracking-subsets",
  name: "Subsets, permutations, combinations",
  signals: ["\"all possible …\"", "\"every combination that sums to target\"", "the answer is a list of lists, not a count"],
  time: "O(n·2ⁿ) subsets, O(n·n!) permutations", space: "O(n) recursion",
  code: `def subsets(nums):
    res, path = [], []
    def backtrack(i):
        if i == len(nums):
            res.append(path[:])          # COPY — path keeps mutating
            return
        path.append(nums[i])             # choose
        backtrack(i + 1)
        path.pop()                       # un-choose
        backtrack(i + 1)                 # skip nums[i]
    backtrack(0)
    return res

def combination_sum(candidates, target):
    res, path = [], []
    def backtrack(start, remaining):
        if remaining == 0:
            res.append(path[:]); return
        if remaining < 0:
            return                       # prune
        for i in range(start, len(candidates)):
            path.append(candidates[i])
            backtrack(i, remaining - candidates[i])   # i, not i+1: reuse allowed
            path.pop()
    backtrack(0, target)
    return res

# Skipping duplicates: sort first, then skip equal siblings at the same depth.
for i in range(start, len(nums)):
    if i > start and nums[i] == nums[i - 1]:
        continue`,
  notes: [
    "Append a COPY (path[:]) — appending path itself stores a reference that later mutations will empty out.",
    "Every choose must have a matching un-choose. Keeping them adjacent around the recursive call makes that impossible to forget.",
    "Pass `i` to allow reuse of an element, `i + 1` to move past it. That single character is the difference between Combination Sum I and II.",
    "Prune as early as you can — sorting the candidates lets you `break` instead of `continue` once the remainder goes negative.",
  ],
  problems: ["subsets", "subsets-ii", "permutations", "combination-sum", "combination-sum-ii", "palindrome-partitioning", "letter-combinations-of-a-phone-number"],
},
{
  id: "backtracking-grid",
  name: "Backtracking on a grid or board",
  signals: ["\"does the word exist in the grid?\"", "N-Queens and Sudoku", "place something, recurse, take it back"],
  time: "O(rows·cols·4^L)", space: "O(L)",
  code: `def exist(board, word):
    rows, cols = len(board), len(board[0])

    def dfs(r, c, i):
        if i == len(word):
            return True
        if not (0 <= r < rows and 0 <= c < cols) or board[r][c] != word[i]:
            return False

        board[r][c] = "#"                # mark as on the current path
        found = (dfs(r + 1, c, i + 1) or dfs(r - 1, c, i + 1) or
                 dfs(r, c + 1, i + 1) or dfs(r, c - 1, i + 1))
        board[r][c] = word[i]            # RESTORE on the way out
        return found

    return any(dfs(r, c, 0) for r in range(rows) for c in range(cols))`,
  notes: [
    "The difference from flood fill: here you restore the cell after recursing, because it is only blocked along the CURRENT path.",
    "For N-Queens, track attacked columns and both diagonals in three sets — col, r + c, and r − c — for O(1) validity checks.",
    "When you are matching many words at once, walk a trie alongside the DFS so one traversal prunes against the whole word list.",
  ],
  problems: ["word-search", "n-queens", "word-search-ii"],
},
]],

["Greedy", [
{
  id: "greedy-scan",
  name: "Greedy one-pass scan",
  signals: ["\"can you reach the end?\"", "\"the minimum number of jumps / refuels / partitions\"", "a locally best choice that provably cannot be beaten later"],
  time: "O(n)", space: "O(1)",
  code: `# Jump Game: track the furthest index still reachable.
def can_jump(nums):
    reach = 0
    for i, jump in enumerate(nums):
        if i > reach:
            return False                 # a gap you cannot cross
        reach = max(reach, i + jump)
    return True

# Jump Game II: BFS by levels, without a queue. Each "level" is one jump.
def min_jumps(nums):
    jumps = left = right = 0
    while right < len(nums) - 1:
        furthest = max(i + nums[i] for i in range(left, right + 1))
        left, right = right + 1, furthest
        jumps += 1
    return jumps

# Gas Station: if the running tank goes negative, no start in the
# stretch you just crossed can work — restart after it.
def start_station(gain, cost):
    if sum(gain) < sum(cost):
        return -1
    start = tank = 0
    for i in range(len(gain)):
        tank += gain[i] - cost[i]
        if tank < 0:
            start, tank = i + 1, 0
    return start

# Partition Labels: extend the current cut to the last occurrence seen so far.
def partition_labels(s):
    last = {c: i for i, c in enumerate(s)}
    res, start, end = [], 0, 0
    for i, c in enumerate(s):
        end = max(end, last[c])
        if i == end:                     # nothing later reaches back
            res.append(end - start + 1)
            start = i + 1
    return res`,
  notes: [
    "Greedy is only correct with an exchange argument: show that taking the local best never rules out an optimal completion. If you cannot state that argument, it is probably DP.",
    "Gas Station's proof is the key one: if the tank goes negative at i, every start between the old start and i also fails, so you can skip them all — one pass instead of n².",
    "Jump Game II is a BFS over index levels in disguise; seeing that is what turns the O(n²) DP into O(n).",
  ],
  problems: ["jump-game", "jump-game-ii", "gas-station", "partition-labels", "merge-triplets-to-form-target-triplet"],
},
{
  id: "greedy-range",
  name: "Track a range of possibilities",
  signals: ["a wildcard or unknown that could count as several things", "\"is some interpretation valid?\"", "you are tempted to branch and try both"],
  time: "O(n)", space: "O(1)",
  code: `# Valid Parenthesis String: instead of branching on every '*',
# carry the MIN and MAX possible number of open brackets.
def check_valid_string(s):
    lo = hi = 0                          # lo: '*' all ')', hi: '*' all '('
    for c in s:
        if c == "(":
            lo, hi = lo + 1, hi + 1
        elif c == ")":
            lo, hi = lo - 1, hi - 1
        else:                            # '*'
            lo, hi = lo - 1, hi + 1
        if hi < 0:
            return False                 # too many ')' under every reading
        lo = max(lo, 0)                  # never fewer than zero open
    return lo == 0                       # zero open is achievable`,
  notes: [
    "Branching on each wildcard is O(2ⁿ). Carrying an interval of reachable states collapses it to one pass, because the set of reachable counts is always a contiguous range.",
    "Clamping lo at 0 matters: a negative low would let a later ')' be cancelled by an open bracket that was never really there.",
    "Same idea shows up in stock-with-cooldown style problems, where you carry the best value of each state instead of enumerating histories.",
  ],
  problems: ["valid-parenthesis-string", "hand-of-straights", "task-scheduler"],
},
]],

["Dynamic programming", [
{
  id: "dp-1d",
  name: "1-D DP (and rolling variables)",
  signals: ["\"in how many ways…\"", "\"the maximum you can get without taking adjacent…\"", "the answer at i depends on a couple of earlier answers"],
  time: "O(n)", space: "O(n) → O(1)",
  code: `# Bottom-up table.
dp = [0] * (n + 1)
dp[0], dp[1] = 1, 1
for i in range(2, n + 1):
    dp[i] = dp[i - 1] + dp[i - 2]

# Only the last two states matter -> two variables, O(1) space.
prev, cur = 1, 1
for _ in range(2, n + 1):
    prev, cur = cur, prev + cur

# House Robber: take this house and skip one, or skip this one.
def rob(nums):
    rob1 = rob2 = 0
    for n in nums:
        rob1, rob2 = rob2, max(rob2, rob1 + n)
    return rob2

# Kadane: the best subarray ending here either extends or restarts.
best = cur = nums[0]
for n in nums[1:]:
    cur = max(n, cur + n)
    best = max(best, cur)`,
  notes: [
    "Write the recurrence in words before any code: \"the answer at i in terms of the answers before i.\" The code is then transcription.",
    "If dp[i] only reads dp[i-1] and dp[i-2], collapse the array into two variables — same algorithm, O(1) space.",
    "Coin Change is the unbounded-knapsack shape: for each amount, try every coin; the loop order decides combinations vs permutations.",
  ],
  problems: ["climbing-stairs", "house-robber", "coin-change", "maximum-subarray", "longest-increasing-subsequence", "word-break"],
},
{
  id: "dp-2d",
  name: "2-D DP (grids, two sequences, knapsack)",
  signals: ["two strings compared", "paths through a grid", "\"can we hit exactly this sum?\"", "the state needs two indices"],
  time: "O(n·m)", space: "O(n·m) → O(m)",
  code: `# Two sequences: dp[i][j] = answer for s1[i:] and s2[j:].
dp = [[0] * (m + 1) for _ in range(n + 1)]
for i in range(n - 1, -1, -1):
    for j in range(m - 1, -1, -1):
        if s1[i] == s2[j]:
            dp[i][j] = 1 + dp[i + 1][j + 1]      # match: consume both
        else:
            dp[i][j] = max(dp[i + 1][j], dp[i][j + 1])
lcs = dp[0][0]

# Subset sum / 0-1 knapsack, one row, iterated BACKWARDS so each item is used once.
possible = [False] * (target + 1)
possible[0] = True
for num in nums:
    for t in range(target, num - 1, -1):
        possible[t] |= possible[t - num]

# Top-down when the transitions are easier to state than to order.
from functools import cache
@cache
def dp(i, j):
    if i == n or j == m:
        return 0
    ...`,
  notes: [
    "Define the state in one sentence and write it above the table. Half of all DP bugs are an unclear definition, not a wrong loop.",
    "The row/column of size n+1 exists so the empty-prefix base case needs no special casing.",
    "Iterate the knapsack row backwards for 0-1 (each item once) and forwards for unbounded (reuse allowed). That direction is the entire difference.",
    "Stuck on the ordering? Write it top-down with @cache first, then convert to a table if you need the space or the speed.",
  ],
  problems: ["longest-common-subsequence", "unique-paths", "edit-distance", "partition-equal-subset-sum", "coin-change-ii", "target-sum"],
},
]],

["Bit manipulation", [
{
  id: "bit-tricks",
  name: "Bit tricks worth memorizing",
  signals: ["\"without using + or −\"", "\"every element appears twice except one\"", "subsets of a small set", "counting set bits"],
  time: "O(1) per trick", space: "O(1)",
  code: `x & 1                    # low bit: odd?
x >> 1, x << 1           # divide / multiply by 2
x & (x - 1)              # clear the lowest set bit  -> loop to count bits
x & -x                   # ISOLATE the lowest set bit
x ^ x == 0               # a value XORed with itself cancels
a ^ b ^ a == b           # which is why XOR finds the unpaired element

# Count set bits.
count = 0
while x:
    x &= x - 1
    count += 1

# Add without '+': XOR is the sum, AND<<1 is the carry.
while b:
    a, b = a ^ b, (a & b) << 1

# Iterate every subset of an n-element set.
for mask in range(1 << n):
    subset = [items[i] for i in range(n) if mask & (1 << i)]

# dp over bits: bits(i) = bits(i >> 1) + (i & 1)
dp = [0] * (n + 1)
for i in range(1, n + 1):
    dp[i] = dp[i >> 1] + (i & 1)`,
  notes: [
    "Python ints are arbitrary precision and negatives have infinitely many leading 1s — mask with & 0xFFFFFFFF when a problem specifies 32-bit behavior, then convert back if the result should be negative.",
    "XOR is its own inverse and is commutative, which is why \"everything appears twice except one\" collapses to a single fold.",
    "1 << n subsets is only tractable for n ≤ ~20 — bitmask DP lives in that range.",
  ],
  problems: ["single-number", "number-of-1-bits", "counting-bits", "sum-of-two-integers", "missing-number", "reverse-bits"],
},
]],

];
