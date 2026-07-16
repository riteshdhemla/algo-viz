// Step generators for interactive visualizations.
// Each entry: VIS[slug] = { gen, code, inputs }
// gen(...) returns frames [{d, l, c, done?}]; components are deep-copied on push.

const VIS = {};
const cp = x => JSON.parse(JSON.stringify(x));

function mkFrames() {
  const frames = [];
  frames.add = (d, l, comps, done) => frames.push({ d, l, c: cp(comps), done: !!done });
  return frames;
}
const kvEntries = obj => Object.entries(obj).map(([k, v]) => [k, v]);

// ---------------------------------------------------------------- Two Sum
VIS["two-sum"] = {
  inputs: [
    { name: "nums", label: "nums", type: "arr", def: "[3, 7, 11, 2, 9, 15]" },
    { name: "target", label: "target", type: "int", def: "9", min: -9999, max: 9999 },
  ],
  code: `def twoSum(nums, target):
    seen = {}
    for i, n in enumerate(nums):
        need = target - n
        if need in seen:
            return [seen[need], i]
        seen[n] = i
    return []`,
  gen(nums, target) {
    const f = mkFrames();
    const seen = {};
    const arr = hl => ({ t: "arr", label: "nums", v: nums, hl });
    const map = hl => ({ t: "kv", label: "seen (value → index)", entries: kvEntries(seen), hl });
    const vars = extra => ({ t: "vars", entries: [["target", target], ...extra] });
    f.add(`Start with an empty hash map. For each number we ask: has target − n already been seen?`, 2, [arr({}), map(), vars([])]);
    for (let i = 0; i < nums.length; i++) {
      const need = target - nums[i];
      f.add(`i = ${i}: n = ${nums[i]}, so we need ${target} − ${nums[i]} = ${need} to complete the pair.`, 4,
        [arr({ [i]: "p" }), map(), vars([["n", nums[i]], ["need", need]])]);
      if (need in seen) {
        f.add(`${need} IS in the map at index ${seen[need]} — found the pair! Return [${seen[need]}, ${i}].`, 6,
          [arr({ [i]: "g", [seen[need]]: "g" }), map({ [need]: "g" }), vars([["n", nums[i]], ["need", need]])]);
        f.add(`Done: nums[${seen[need]}] + nums[${i}] = ${nums[seen[need]]} + ${nums[i]} = ${target}. One pass, O(n) time.`, 6,
          [arr({ [i]: "g", [seen[need]]: "g" }), map({ [need]: "g" })], true);
        return f;
      }
      f.add(`${need} is not in the map yet. Store nums[${i}] = ${nums[i]} → ${i} so later numbers can find it.`, 7,
        [arr({ [i]: "y" }), (seen[nums[i]] = i, map({ [nums[i]]: "y" })), vars([["n", nums[i]], ["need", need]])]);
    }
    f.add(`No pair sums to ${target}. Return [].`, 8, [arr({}), map()], true);
    return f;
  },
};

// ------------------------------------------------------- Contains Duplicate
VIS["contains-duplicate"] = {
  inputs: [{ name: "nums", label: "nums", type: "arr", def: "[3, 7, 1, 9, 7, 4]" }],
  code: `def containsDuplicate(nums):
    seen = set()
    for n in nums:
        if n in seen:
            return True
        seen.add(n)
    return False`,
  gen(nums) {
    const f = mkFrames();
    const seen = [];
    const arr = hl => ({ t: "arr", label: "nums", v: nums, hl });
    const st = hl => ({ t: "set", label: "seen", v: seen, hl });
    f.add(`A hash set remembers every number we have passed. A repeat lookup is O(1).`, 2, [arr({}), st()]);
    for (let i = 0; i < nums.length; i++) {
      const dup = seen.includes(nums[i]);
      f.add(`Check ${nums[i]}: is it already in the set?`, 4, [arr({ [i]: "p" }), st(dup ? { [nums[i]]: "r" } : {})]);
      if (dup) {
        f.add(`Yes — ${nums[i]} was seen before. Duplicate found, return True.`, 5,
          [arr({ [i]: "r", [nums.indexOf(nums[i])]: "r" }), st({ [nums[i]]: "r" })], true);
        return f;
      }
      seen.push(nums[i]);
      f.add(`Not seen yet. Add ${nums[i]} to the set and continue.`, 6, [arr({ [i]: "y" }), st({ [nums[i]]: "y" })]);
    }
    f.add(`Scanned everything with no repeats — return False.`, 7, [arr({}), st()], true);
    return f;
  },
};

// ------------------------------------------------------------ Valid Anagram
VIS["valid-anagram"] = {
  inputs: [
    { name: "s", label: "s", type: "str", def: "racecar", max: 14 },
    { name: "t", label: "t", type: "str", def: "carrace", max: 14 },
  ],
  code: `def isAnagram(s, t):
    if len(s) != len(t):
        return False
    count = {}
    for c in s:
        count[c] = count.get(c, 0) + 1
    for c in t:
        if count.get(c, 0) == 0:
            return False
        count[c] -= 1
    return True`,
  gen(s, t) {
    const f = mkFrames();
    const count = {};
    const S = hl => ({ t: "arr", label: "s", v: [...s], hl, ch: true });
    const T = hl => ({ t: "arr", label: "t", v: [...t], hl, ch: true });
    const M = hl => ({ t: "kv", label: "count", entries: kvEntries(count), hl });
    if (s.length !== t.length) {
      f.add(`Lengths differ (${s.length} vs ${t.length}) — cannot be anagrams. Return False.`, 3, [S({}), T({})], true);
      return f;
    }
    f.add(`Same length. Count each character of s, then spend those counts scanning t.`, 4, [S({}), T({}), M()]);
    for (let i = 0; i < s.length; i++) {
      count[s[i]] = (count[s[i]] || 0) + 1;
      f.add(`Count '${s[i]}' from s → ${count[s[i]]}.`, 6, [S({ [i]: "p" }), T({}), M({ [s[i]]: "p" })]);
    }
    for (let i = 0; i < t.length; i++) {
      if (!count[t[i]]) {
        f.add(`t needs '${t[i]}' but its count is already 0 — not an anagram. Return False.`, 9,
          [S({}), T({ [i]: "r" }), M({ [t[i]]: "r" })], true);
        return f;
      }
      count[t[i]] -= 1;
      f.add(`Spend one '${t[i]}' for t → count is now ${count[t[i]]}.`, 10, [S({}), T({ [i]: "y" }), M({ [t[i]]: "y" })]);
    }
    f.add(`Every count balanced out to zero — "${t}" is an anagram of "${s}". Return True.`, 11, [S({}), T({}), M()], true);
    return f;
  },
};

// ------------------------------------------- Product of Array Except Self
VIS["product-of-array-except-self"] = {
  inputs: [{ name: "nums", label: "nums", type: "arr", def: "[1, 2, 3, 4]", max: 8 }],
  code: `def productExceptSelf(nums):
    res = [1] * len(nums)
    prefix = 1
    for i in range(len(nums)):
        res[i] = prefix
        prefix *= nums[i]
    suffix = 1
    for i in range(len(nums) - 1, -1, -1):
        res[i] *= suffix
        suffix *= nums[i]
    return res`,
  gen(nums) {
    const f = mkFrames();
    const n = nums.length;
    const res = new Array(n).fill(1);
    let prefix = 1, suffix = 1;
    const A = hl => ({ t: "arr", label: "nums", v: nums, hl });
    const R = hl => ({ t: "arr", label: "res", v: res, hl });
    const V = () => ({ t: "vars", entries: [["prefix", prefix], ["suffix", suffix]] });
    f.add(`Answer[i] = (product of everything left of i) × (product of everything right of i). Two passes, no division.`, 2, [A({}), R({}), V()]);
    for (let i = 0; i < n; i++) {
      res[i] = prefix;
      f.add(`Left→right: res[${i}] = prefix = ${prefix} (product of all numbers left of index ${i}).`, 5, [A({ [i]: "p" }), R({ [i]: "p" }), V()]);
      prefix *= nums[i];
      f.add(`Multiply prefix by nums[${i}] = ${nums[i]} → prefix = ${prefix}.`, 6, [A({ [i]: "y" }), R({}), V()]);
    }
    f.add(`Prefix pass done. Now sweep right→left multiplying in suffix products.`, 7, [A({}), R({}), V()]);
    for (let i = n - 1; i >= 0; i--) {
      res[i] *= suffix;
      f.add(`Right→left: res[${i}] ×= suffix = ${suffix} → res[${i}] = ${res[i]}.`, 9, [A({ [i]: "p" }), R({ [i]: "p" }), V()]);
      suffix *= nums[i];
      f.add(`Multiply suffix by nums[${i}] = ${nums[i]} → suffix = ${suffix}.`, 10, [A({ [i]: "y" }), R({}), V()]);
    }
    f.add(`Done in O(n) time and O(1) extra space: res = [${res.join(", ")}].`, 11, [A({}), { t: "arr", label: "res", v: res, hl: Object.fromEntries(res.map((_, i) => [i, "g"])) }], true);
    return f;
  },
};

// ---------------------------------------------------------- Valid Palindrome
VIS["valid-palindrome"] = {
  inputs: [{ name: "s", label: "s", type: "str", def: "No lemon, no melon", max: 20 }],
  code: `def isPalindrome(s):
    l, r = 0, len(s) - 1
    while l < r:
        while l < r and not s[l].isalnum():
            l += 1
        while l < r and not s[r].isalnum():
            r -= 1
        if s[l].lower() != s[r].lower():
            return False
        l += 1
        r -= 1
    return True`,
  gen(s) {
    const f = mkFrames();
    const isAlnum = c => /[a-z0-9]/i.test(c);
    const S = (hl, ptrs) => ({ t: "arr", label: "s", v: [...s].map(c => (c === " " ? "␣" : c)), hl, ptrs, ch: true });
    let l = 0, r = s.length - 1;
    f.add(`Two pointers start at both ends; non-alphanumeric characters are skipped, letters compared case-insensitively.`, 2, [S({}, { [l]: "L", [r]: "R" })]);
    while (l < r) {
      while (l < r && !isAlnum(s[l])) {
        f.add(`'${s[l] === " " ? "␣" : s[l]}' at L is not alphanumeric — skip it.`, 5, [S({ [l]: "d" }, { [l]: "L", [r]: "R" })]);
        l++;
      }
      while (l < r && !isAlnum(s[r])) {
        f.add(`'${s[r] === " " ? "␣" : s[r]}' at R is not alphanumeric — skip it.`, 7, [S({ [r]: "d" }, { [l]: "L", [r]: "R" })]);
        r--;
      }
      if (l >= r) break;
      const a = s[l].toLowerCase(), b = s[r].toLowerCase();
      if (a !== b) {
        f.add(`Compare '${a}' vs '${b}' — mismatch. Not a palindrome, return False.`, 9, [S({ [l]: "r", [r]: "r" }, { [l]: "L", [r]: "R" })], true);
        return f;
      }
      f.add(`Compare '${a}' vs '${b}' — match. Move both pointers inward.`, 8, [S({ [l]: "g", [r]: "g" }, { [l]: "L", [r]: "R" })]);
      l++; r--;
    }
    f.add(`Pointers met — every pair matched. It is a palindrome, return True.`, 12, [S({}, { [Math.min(l, r)]: "L R" })], true);
    return f;
  },
};

// --------------------------------------------------------------- Two Sum II
VIS["two-sum-ii-input-array-is-sorted"] = {
  inputs: [
    { name: "numbers", label: "numbers (sorted)", type: "arr", def: "[1, 3, 4, 5, 7, 10, 11]" },
    { name: "target", label: "target", type: "int", def: "9", min: -9999, max: 9999 },
  ],
  code: `def twoSum(numbers, target):
    l, r = 0, len(numbers) - 1
    while l < r:
        s = numbers[l] + numbers[r]
        if s == target:
            return [l + 1, r + 1]
        if s < target:
            l += 1
        else:
            r -= 1`,
  gen(numbers, target) {
    const f = mkFrames();
    numbers = [...numbers].sort((a, b) => a - b);
    let l = 0, r = numbers.length - 1;
    const A = (hl, ptrs) => ({ t: "arr", label: "numbers", v: numbers, hl, ptrs });
    const V = s => ({ t: "vars", entries: [["target", target], ["sum", s ?? "—"]] });
    f.add(`Sorted input lets two pointers replace the hash map: too small → move L right, too big → move R left.`, 2, [A({}, { [l]: "L", [r]: "R" }), V()]);
    while (l < r) {
      const s = numbers[l] + numbers[r];
      if (s === target) {
        f.add(`${numbers[l]} + ${numbers[r]} = ${s} = target — found it! Return the 1-indexed pair [${l + 1}, ${r + 1}].`, 6,
          [A({ [l]: "g", [r]: "g" }, { [l]: "L", [r]: "R" }), V(s)], true);
        return f;
      }
      if (s < target) {
        f.add(`${numbers[l]} + ${numbers[r]} = ${s} < ${target} — too small, so move L right to grow the sum.`, 8,
          [A({ [l]: "y", [r]: "p" }, { [l]: "L", [r]: "R" }), V(s)]);
        l++;
      } else {
        f.add(`${numbers[l]} + ${numbers[r]} = ${s} > ${target} — too big, so move R left to shrink the sum.`, 10,
          [A({ [l]: "p", [r]: "y" }, { [l]: "L", [r]: "R" }), V(s)]);
        r--;
      }
    }
    f.add(`Pointers crossed without hitting the target — no pair exists.`, 3, [A({}, {}), V()], true);
    return f;
  },
};

// ------------------------------------------------ Container With Most Water
VIS["container-with-most-water"] = {
  inputs: [{ name: "height", label: "height", type: "arr", def: "[1, 8, 6, 2, 5, 4, 8, 3, 7]", max: 12 }],
  code: `def maxArea(height):
    l, r = 0, len(height) - 1
    best = 0
    while l < r:
        area = (r - l) * min(height[l], height[r])
        best = max(best, area)
        if height[l] < height[r]:
            l += 1
        else:
            r -= 1
    return best`,
  gen(height) {
    const f = mkFrames();
    height = height.map(h => Math.max(0, h));
    let l = 0, r = height.length - 1, best = 0;
    const B = (hl, ptrs) => ({ t: "bars", label: "height", v: height, hl, ptrs });
    const V = (area) => ({ t: "vars", entries: [["area", area ?? "—"], ["best", best]] });
    f.add(`Width is widest at the ends. The shorter wall limits the area, so always move the shorter one inward.`, 2, [B({}, { [l]: "L", [r]: "R" }), V()]);
    while (l < r) {
      const area = (r - l) * Math.min(height[l], height[r]);
      const improved = area > best;
      best = Math.max(best, area);
      f.add(`area = width ${r - l} × min(${height[l]}, ${height[r]}) = ${area}.${improved ? ` New best!` : ` Best stays ${best}.`}`, 6,
        [B({ [l]: improved ? "g" : "p", [r]: improved ? "g" : "p" }, { [l]: "L", [r]: "R" }), V(area)]);
      if (height[l] < height[r]) {
        f.add(`Left wall (${height[l]}) is shorter — keeping it can never help, so move L inward.`, 8,
          [B({ [l]: "y" }, { [l]: "L", [r]: "R" }), V(area)]);
        l++;
      } else {
        f.add(`Right wall (${height[r]}) is the shorter (or equal) one — move R inward.`, 10,
          [B({ [r]: "y" }, { [l]: "L", [r]: "R" }), V(area)]);
        r--;
      }
    }
    f.add(`Pointers met. The most water we can contain is ${best}.`, 11, [B({}, {}), V()], true);
    return f;
  },
};

// -------------------------------------- Best Time to Buy and Sell Stock
VIS["best-time-to-buy-and-sell-stock"] = {
  inputs: [{ name: "prices", label: "prices", type: "arr", def: "[7, 1, 5, 3, 6, 4]", max: 12 }],
  code: `def maxProfit(prices):
    buy = 0
    best = 0
    for sell in range(1, len(prices)):
        if prices[sell] < prices[buy]:
            buy = sell
        else:
            best = max(best, prices[sell] - prices[buy])
    return best`,
  gen(prices) {
    const f = mkFrames();
    prices = prices.map(p => Math.max(0, p));
    let buy = 0, best = 0;
    const B = (hl, ptrs) => ({ t: "bars", label: "prices by day", v: prices, hl, ptrs });
    const V = profit => ({ t: "vars", entries: [["profit", profit ?? "—"], ["best", best]] });
    f.add(`One pass: remember the cheapest day so far (buy) and try selling on every later day.`, 2, [B({}, { [buy]: "buy" }), V()]);
    for (let sell = 1; sell < prices.length; sell++) {
      if (prices[sell] < prices[buy]) {
        f.add(`Day ${sell}: price ${prices[sell]} is a new low — move the buy day here.`, 6,
          [B({ [sell]: "y" }, { [buy]: "buy", [sell]: "sell" }), V()]);
        buy = sell;
      } else {
        const profit = prices[sell] - prices[buy];
        const improved = profit > best;
        best = Math.max(best, profit);
        f.add(`Day ${sell}: sell at ${prices[sell]}, bought at ${prices[buy]} → profit ${profit}.${improved ? " New best!" : ""}`, 8,
          [B({ [buy]: "g", [sell]: improved ? "g" : "p" }, { [buy]: "buy", [sell]: "sell" }), V(profit)]);
      }
    }
    f.add(`Maximum profit: ${best}.`, 9, [B({}, { [buy]: "buy" }), V()], true);
    return f;
  },
};

// --------------------- Longest Substring Without Repeating Characters
VIS["longest-substring-without-repeating-characters"] = {
  inputs: [{ name: "s", label: "s", type: "str", def: "abcabcbb", max: 16 }],
  code: `def lengthOfLongestSubstring(s):
    seen = set()
    l = 0
    best = 0
    for r in range(len(s)):
        while s[r] in seen:
            seen.remove(s[l])
            l += 1
        seen.add(s[r])
        best = max(best, r - l + 1)
    return best`,
  gen(s) {
    const f = mkFrames();
    const seen = [];
    let l = 0, best = 0;
    const S = (r, extra) => {
      const hl = {};
      for (let i = l; i <= r; i++) hl[i] = "w";
      Object.assign(hl, extra);
      return { t: "arr", label: "s (window = blue outline)", v: [...s], hl, ptrs: { [l]: "L", [r]: r >= l ? "R" : undefined }, ch: true };
    };
    const St = hl => ({ t: "set", label: "seen (chars in window)", v: seen, hl });
    const V = () => ({ t: "vars", entries: [["best", best]] });
    f.add(`Slide a window [L, R] that never contains a repeated character; a set tracks what's inside.`, 2, [S(-1), St(), V()]);
    for (let r = 0; r < s.length; r++) {
      while (seen.includes(s[r])) {
        f.add(`'${s[r]}' is already in the window — shrink: remove '${s[l]}' at L and move L right.`, 7,
          [S(r - 1, { [r]: "r", [l]: "y" }), St({ [s[l]]: "y", [s[r]]: "r" }), V()]);
        seen.splice(seen.indexOf(s[l]), 1);
        l++;
      }
      seen.push(s[r]);
      const len = r - l + 1;
      const improved = len > best;
      best = Math.max(best, len);
      f.add(`Add '${s[r]}'. Window "${s.slice(l, r + 1)}" has length ${len}.${improved ? " New best!" : ""}`, 10,
        [S(r, { [r]: improved ? "g" : "p" }), St({ [s[r]]: "p" }), V()]);
    }
    f.add(`Longest substring without repeats has length ${best}. Each char enters and leaves the window once → O(n).`, 11, [S(s.length - 1), St(), V()], true);
    return f;
  },
};

// --------------------------------------------------------- Valid Parentheses
VIS["valid-parentheses"] = {
  inputs: [{ name: "s", label: "s", type: "str", def: "({[]})()", max: 14 }],
  code: `def isValid(s):
    pairs = {')': '(', ']': '[', '}': '{'}
    stack = []
    for c in s:
        if c in pairs:
            if not stack or stack[-1] != pairs[c]:
                return False
            stack.pop()
        else:
            stack.append(c)
    return len(stack) == 0`,
  gen(s) {
    const f = mkFrames();
    const pairs = { ")": "(", "]": "[", "}": "{" };
    const stack = [];
    const S = hl => ({ t: "arr", label: "s", v: [...s], hl, ch: true });
    const St = hl => ({ t: "stack", label: "stack", v: stack, hl });
    f.add(`Openers go on a stack. Every closer must match the most recent unclosed opener — the stack top.`, 3, [S({}), St()]);
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (pairs[c]) {
        if (!stack.length || stack[stack.length - 1] !== pairs[c]) {
          f.add(stack.length
            ? `'${c}' needs '${pairs[c]}' on top, but the top is '${stack[stack.length - 1]}' — invalid. Return False.`
            : `'${c}' arrives with an empty stack — nothing to close. Return False.`, 7,
            [S({ [i]: "r" }), St(stack.length ? { [stack.length - 1]: "r" } : {})], true);
          return f;
        }
        f.add(`'${c}' matches the top '${stack[stack.length - 1]}' — pop it.`, 8, [S({ [i]: "g" }), St({ [stack.length - 1]: "g" })]);
        stack.pop();
      } else {
        stack.push(c);
        f.add(`'${c}' is an opener — push it on the stack.`, 10, [S({ [i]: "p" }), St({ [stack.length - 1]: "p" })]);
      }
    }
    if (stack.length) {
      f.add(`Input consumed but ${stack.length} opener(s) were never closed — return False.`, 11,
        [S({}), St(Object.fromEntries(stack.map((_, i) => [i, "r"])))], true);
    } else {
      f.add(`Input consumed and the stack is empty — every bracket matched. Return True.`, 11, [S({}), St()], true);
    }
    return f;
  },
};

// -------------------------------------------------------- Daily Temperatures
VIS["daily-temperatures"] = {
  inputs: [{ name: "temps", label: "temperatures", type: "arr", def: "[73, 74, 75, 71, 69, 72, 76, 73]", max: 10 }],
  code: `def dailyTemperatures(temps):
    res = [0] * len(temps)
    stack = []
    for i, t in enumerate(temps):
        while stack and temps[stack[-1]] < t:
            j = stack.pop()
            res[j] = i - j
        stack.append(i)
    return res`,
  gen(temps) {
    const f = mkFrames();
    const res = new Array(temps.length).fill(0);
    const stack = [];
    const A = hl => ({ t: "arr", label: "temperatures", v: temps, hl });
    const R = hl => ({ t: "arr", label: "res (days until warmer)", v: res, hl });
    const St = hl => ({ t: "stack", label: "stack (indices waiting)", v: stack.map(j => `${j} (${temps[j]}°)`), hl });
    f.add(`Days still waiting for warmth sit on a stack, coldest on top. A new warm day resolves them all at once.`, 3, [A({}), St(), R({})]);
    for (let i = 0; i < temps.length; i++) {
      f.add(`Day ${i}: ${temps[i]}°. Pop every waiting day colder than this.`, 5, [A({ [i]: "p" }), St(), R({})]);
      while (stack.length && temps[stack[stack.length - 1]] < temps[i]) {
        const j = stack[stack.length - 1];
        f.add(`Day ${j} (${temps[j]}°) < ${temps[i]}° — resolved! It waited ${i} − ${j} = ${i - j} day(s).`, 7,
          [A({ [i]: "p", [j]: "g" }), St({ [stack.length - 1]: "g" }), (res[j] = i - j, R({ [j]: "g" }))]);
        stack.pop();
      }
      stack.push(i);
      f.add(`Push day ${i} — it now waits for a warmer day.`, 8, [A({ [i]: "y" }), St({ [stack.length - 1]: "y" }), R({})]);
    }
    f.add(`Days left on the stack never see a warmer day — they stay 0. res = [${res.join(", ")}].`, 9,
      [A({}), St(), { t: "arr", label: "res (days until warmer)", v: res, hl: Object.fromEntries(res.map((_, i) => [i, "g"])) }], true);
    return f;
  },
};

// ------------------------------------------------------------- Binary Search
VIS["binary-search"] = {
  inputs: [
    { name: "nums", label: "nums (sorted)", type: "arr", def: "[-8, -3, 0, 2, 5, 9, 12, 17, 23, 31, 42]" },
    { name: "target", label: "target", type: "int", def: "31", min: -9999, max: 9999 },
  ],
  code: `def search(nums, target):
    l, r = 0, len(nums) - 1
    while l <= r:
        m = (l + r) // 2
        if nums[m] == target:
            return m
        if nums[m] < target:
            l = m + 1
        else:
            r = m - 1
    return -1`,
  gen(nums, target) {
    const f = mkFrames();
    nums = [...nums].sort((a, b) => a - b);
    let l = 0, r = nums.length - 1;
    const A = (hl, ptrs) => {
      const full = {};
      for (let i = 0; i < nums.length; i++) if (i < l || i > r) full[i] = "d";
      Object.assign(full, hl);
      return { t: "arr", label: "nums (dimmed = eliminated)", v: nums, hl: full, ptrs };
    };
    const V = m => ({ t: "vars", entries: [["target", target], ["m", m ?? "—"]] });
    f.add(`The search range is [L, R]. Each comparison with the middle eliminates half of it.`, 2, [A({}, { [l]: "L", [r]: "R" }), V()]);
    while (l <= r) {
      const m = (l + r) >> 1;
      f.add(`m = (${l} + ${r}) // 2 = ${m}. Compare nums[${m}] = ${nums[m]} with target ${target}.`, 4,
        [A({ [m]: "p" }, { [l]: "L", [m]: "M", [r]: "R" }), V(m)]);
      if (nums[m] === target) {
        f.add(`nums[${m}] = ${target} — found the target at index ${m} in O(log n) steps.`, 6,
          [A({ [m]: "g" }, { [m]: "M" }), V(m)], true);
        return f;
      }
      if (nums[m] < target) {
        f.add(`${nums[m]} < ${target} — the target must be right of m. Discard the left half: L = ${m + 1}.`, 8,
          [A({ [m]: "y" }, { [l]: "L", [m]: "M", [r]: "R" }), V(m)]);
        l = m + 1;
      } else {
        f.add(`${nums[m]} > ${target} — the target must be left of m. Discard the right half: R = ${m - 1}.`, 10,
          [A({ [m]: "y" }, { [l]: "L", [m]: "M", [r]: "R" }), V(m)]);
        r = m - 1;
      }
    }
    f.add(`L passed R — the range is empty, so ${target} is not in the array. Return -1.`, 11, [A({}, {}), V()], true);
    return f;
  },
};

// ------------------------------------------------------ Reverse Linked List
VIS["reverse-linked-list"] = {
  inputs: [{ name: "vals", label: "list values", type: "arr", def: "[1, 2, 3, 4, 5]", max: 8, min: 1 }],
  code: `def reverseList(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`,
  gen(vals) {
    const f = mkFrames();
    const n = vals.length;
    // dirs[i]: 'R' points to i+1, 'L' points to i-1, null points to None
    const dirs = vals.map((_, i) => (i === n - 1 ? null : "R"));
    const LL = (ptrs, hl) => ({ t: "ll", label: "list", v: vals.map((v, i) => ({ val: v, dir: dirs[i] })), ptrs, hl });
    const V = (prev, curr, nxt) => ({
      t: "vars", entries: [
        ["prev", prev === -1 ? "None" : `node ${vals[prev]}`],
        ["curr", curr >= n || curr === -1 ? "None" : `node ${vals[curr]}`],
        ["nxt", nxt === undefined ? "—" : (nxt >= n ? "None" : `node ${vals[nxt]}`)],
      ],
    });
    let prev = -1, curr = 0;
    f.add(`Walk the list once. At each node, flip its next pointer backwards — prev trails one node behind curr.`, 3,
      [LL({ [curr]: "curr" }, { [curr]: "p" }), V(prev, curr)]);
    while (curr < n) {
      const nxt = curr + 1;
      f.add(`Save nxt = curr.next (${nxt >= n ? "None" : "node " + vals[nxt]}) so we don't lose the rest of the list.`, 5,
        [LL({ [curr]: "curr", ...(nxt < n ? { [nxt]: "nxt" } : {}), ...(prev >= 0 ? { [prev]: "prev" } : {}) }, { [curr]: "p", ...(nxt < n ? { [nxt]: "y" } : {}) }), V(prev, curr, nxt)]);
      dirs[curr] = prev === -1 ? null : "L";
      f.add(`Flip: curr.next now points to ${prev === -1 ? "None" : "node " + vals[prev]} — the link is reversed.`, 6,
        [LL({ [curr]: "curr", ...(nxt < n ? { [nxt]: "nxt" } : {}), ...(prev >= 0 ? { [prev]: "prev" } : {}) }, { [curr]: "g" }), V(prev, curr, nxt)]);
      prev = curr;
      curr = nxt;
      f.add(`Advance: prev = node ${vals[prev]}, curr = ${curr >= n ? "None" : "node " + vals[curr]}.`, 8,
        [LL({ [prev]: "prev", ...(curr < n ? { [curr]: "curr" } : {}) }, { ...(curr < n ? { [curr]: "p" } : {}) }), V(prev, curr)]);
    }
    f.add(`curr is None — every link is flipped. prev (node ${vals[prev]}) is the new head. O(n) time, O(1) space.`, 9,
      [LL({ [prev]: "head" }, Object.fromEntries(vals.map((_, i) => [i, "g"]))), V(prev, -1)], true);
    return f;
  },
};

// ---------------------------------------------------------- Maximum Subarray
VIS["maximum-subarray"] = {
  inputs: [{ name: "nums", label: "nums", type: "arr", def: "[-2, 1, -3, 4, -1, 2, 1, -5, 4]", max: 12, min: 1 }],
  code: `def maxSubArray(nums):
    best = nums[0]
    cur = 0
    for i, n in enumerate(nums):
        if cur < 0:
            cur = 0
        cur += n
        best = max(best, cur)
    return best`,
  gen(nums) {
    const f = mkFrames();
    let best = nums[0], cur = 0, start = 0;
    let bestL = 0, bestR = 0;
    const A = (i, extra) => {
      const hl = {};
      for (let k = start; k <= i; k++) hl[k] = "w";
      Object.assign(hl, extra);
      return { t: "arr", label: "nums (blue outline = current subarray)", v: nums, hl };
    };
    const V = () => ({ t: "vars", entries: [["cur", cur], ["best", best]] });
    f.add(`Kadane's algorithm: keep a running sum, but if it ever goes negative, dragging it along can only hurt — restart.`, 3, [A(-1), V()]);
    for (let i = 0; i < nums.length; i++) {
      if (cur < 0) {
        f.add(`Running sum ${cur} is negative — it would only drag down what follows. Restart the subarray at index ${i}.`, 6,
          [A(i - 1, { [i]: "y" }), V()]);
        cur = 0;
        start = i;
      }
      cur += nums[i];
      const improved = cur > best;
      if (improved) { best = cur; bestL = start; bestR = i; }
      f.add(`Add nums[${i}] = ${nums[i]} → cur = ${cur}.${improved ? ` New best sum!` : ` Best stays ${best}.`}`, improved ? 8 : 7,
        [A(i, { [i]: improved ? "g" : "p" }), V()]);
    }
    const hl = {};
    for (let k = bestL; k <= bestR; k++) hl[k] = "g";
    f.add(`Best subarray is [${nums.slice(bestL, bestR + 1).join(", ")}] with sum ${best}. One pass, O(n).`, 9,
      [{ t: "arr", label: "nums", v: nums, hl }, V()], true);
    return f;
  },
};

// ---------------------------------------------------------- Climbing Stairs
VIS["climbing-stairs"] = {
  inputs: [{ name: "n", label: "n (steps)", type: "int", def: "8", min: 2, max: 12 }],
  code: `def climbStairs(n):
    one, two = 1, 1
    for _ in range(n - 1):
        one, two = one + two, one
    return one`,
  gen(n) {
    const f = mkFrames();
    const ways = new Array(n + 1).fill("?");
    ways[0] = 1; ways[1] = 1;
    let one = 1, two = 1;
    const A = hl => ({ t: "arr", label: "ways to reach each step", v: ways, hl });
    const V = () => ({ t: "vars", entries: [["one", one], ["two", two]] });
    f.add(`To stand on step i you came from i−1 or i−2, so ways(i) = ways(i−1) + ways(i−2) — Fibonacci. Two variables suffice.`, 2,
      [A({ 0: "p", 1: "p" }), V()]);
    for (let i = 2; i <= n; i++) {
      const next = one + two;
      ways[i] = next;
      f.add(`ways(${i}) = ways(${i - 1}) + ways(${i - 2}) = ${one} + ${two} = ${next}.`, 4,
        [(two = one, one = next, A({ [i]: "g", [i - 1]: "p", [i - 2]: "p" })), V()]);
    }
    f.add(`There are ${one} distinct ways to climb ${n} steps — computed in O(n) time and O(1) space.`, 5,
      [A({ [n]: "g" }), V()], true);
    return f;
  },
};

// -------------------------------------------------------- Invert Binary Tree
VIS["invert-binary-tree"] = {
  inputs: [],
  code: `def invertTree(root):
    if not root:
        return None
    queue = deque([root])
    while queue:
        node = queue.popleft()
        node.left, node.right = node.right, node.left
        if node.left:
            queue.append(node.left)
        if node.right:
            queue.append(node.right)
    return root`,
  gen() {
    const f = mkFrames();
    // heap-array representation, 15 slots (depth 3)
    const tree = [4, 2, 7, 1, 3, 6, 9, null, null, null, null, null, null, null, null];
    const queue = [0];
    const swapSub = (a, i, j) => {
      if (i >= a.length && j >= a.length) return;
      const vi = i < a.length ? a[i] : null, vj = j < a.length ? a[j] : null;
      if (i < a.length) a[i] = vj;
      if (j < a.length) a[j] = vi;
      if (2 * i + 1 < a.length || 2 * j + 1 < a.length) swapSub(a, 2 * i + 1, 2 * j + 1);
      if (2 * i + 2 < a.length || 2 * j + 2 < a.length) swapSub(a, 2 * i + 2, 2 * j + 2);
    };
    const T = hl => ({ t: "tree", label: "tree", v: tree, hl });
    const Q = hl => ({ t: "set", label: "queue (BFS)", v: queue.map(i => tree[i]), hl });
    f.add(`BFS with a queue: visit every node once and swap its two children in place.`, 4, [T({}), Q()]);
    while (queue.length) {
      const i = queue.shift();
      f.add(`Dequeue node ${tree[i]}.`, 6, [T({ [i]: "p" }), Q()]);
      const l = 2 * i + 1, r = 2 * i + 2;
      const hasKids = (l < tree.length && tree[l] !== null) || (r < tree.length && tree[r] !== null);
      swapSub(tree, l, r);
      f.add(hasKids
        ? `Swap the children of ${tree[i]}: left ⇄ right (their whole subtrees move with them).`
        : `Node ${tree[i]} is a leaf — swapping two empty children changes nothing.`, 7,
        [T({ [i]: "p", ...(l < tree.length && tree[l] !== null ? { [l]: "y" } : {}), ...(r < tree.length && tree[r] !== null ? { [r]: "y" } : {}) }), Q()]);
      const added = [];
      if (l < tree.length && tree[l] !== null) { queue.push(l); added.push(tree[l]); }
      if (r < tree.length && tree[r] !== null) { queue.push(r); added.push(tree[r]); }
      if (added.length) {
        f.add(`Enqueue the children ${added.join(" and ")} so they get inverted too.`, 10,
          [T({ [i]: "g" }), Q(Object.fromEntries(added.map(v => [v, "y"])))]);
      }
    }
    f.add(`Queue empty — every node's children are swapped. The tree is fully inverted (mirrored). O(n) time.`, 11,
      [T(Object.fromEntries(tree.map((v, i) => [i, v !== null ? "g" : undefined]).filter(([, c]) => c))), Q()], true);
    return f;
  },
};
