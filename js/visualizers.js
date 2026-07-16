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

// ============================ batch 2 ============================

// ------------------------------------------------------------------- 3Sum
VIS["3sum"] = {
  inputs: [{ name: "nums", label: "nums", type: "arr", def: "[-1, 0, 1, 2, -1, -4]", max: 7, min: 3 }],
  code: `def threeSum(nums):
    nums.sort()
    res = []
    for i in range(len(nums)):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        l, r = i + 1, len(nums) - 1
        while l < r:
            s = nums[i] + nums[l] + nums[r]
            if s < 0:
                l += 1
            elif s > 0:
                r -= 1
            else:
                res.append([nums[i], nums[l], nums[r]])
                l += 1
                while l < r and nums[l] == nums[l - 1]:
                    l += 1
    return res`,
  gen(nums) {
    const f = mkFrames();
    nums = [...nums].sort((a, b) => a - b);
    const res = [];
    const A = (hl, ptrs) => ({ t: "arr", label: "nums (sorted)", v: nums, hl, ptrs });
    const R = hl => ({ t: "set", label: "res (triplets)", v: res.map(t => `[${t.join(", ")}]`), hl });
    f.add(`Sort first. Then anchor each element i and run the two-pointer Two Sum II on the rest, looking for −nums[i].`, 2, [A({}, {}), R()]);
    for (let i = 0; i < nums.length; i++) {
      if (i > 0 && nums[i] === nums[i - 1]) {
        f.add(`nums[${i}] = ${nums[i]} equals the previous anchor — skip it to avoid duplicate triplets.`, 6,
          [A({ [i]: "d" }, { [i]: "i" }), R()]);
        continue;
      }
      let l = i + 1, r = nums.length - 1;
      if (l >= r) break;
      f.add(`Anchor i = ${i} (${nums[i]}). Two pointers now search the right side for a pair summing to ${-nums[i]}.`, 7,
        [A({ [i]: "p" }, { [i]: "i", [l]: "L", [r]: "R" }), R()]);
      while (l < r) {
        const s = nums[i] + nums[l] + nums[r];
        if (s < 0) {
          f.add(`${nums[i]} + ${nums[l]} + ${nums[r]} = ${s} < 0 — too small, move L right.`, 11,
            [A({ [i]: "p", [l]: "y" }, { [i]: "i", [l]: "L", [r]: "R" }), R()]);
          l++;
        } else if (s > 0) {
          f.add(`${nums[i]} + ${nums[l]} + ${nums[r]} = ${s} > 0 — too big, move R left.`, 13,
            [A({ [i]: "p", [r]: "y" }, { [i]: "i", [l]: "L", [r]: "R" }), R()]);
          r--;
        } else {
          res.push([nums[i], nums[l], nums[r]]);
          f.add(`${nums[i]} + ${nums[l]} + ${nums[r]} = 0 — triplet found!`, 15,
            [A({ [i]: "g", [l]: "g", [r]: "g" }, { [i]: "i", [l]: "L", [r]: "R" }), R({ [`[${res[res.length - 1].join(", ")}]`]: "g" })]);
          l++;
          while (l < r && nums[l] === nums[l - 1]) {
            f.add(`nums[${l}] repeats the previous L value — skip to avoid a duplicate triplet.`, 18,
              [A({ [i]: "p", [l]: "d" }, { [i]: "i", [l]: "L", [r]: "R" }), R()]);
            l++;
          }
        }
      }
    }
    f.add(`All anchors processed — ${res.length} unique triplet(s) sum to zero. O(n²) total.`, 19, [A({}, {}), R()], true);
    return f;
  },
};

// ------------------------------------------------------ Trapping Rain Water
VIS["trapping-rain-water"] = {
  inputs: [{ name: "height", label: "height", type: "arr", def: "[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]", max: 12 }],
  code: `def trap(height):
    l, r = 0, len(height) - 1
    leftMax, rightMax = height[l], height[r]
    water = 0
    while l < r:
        if leftMax < rightMax:
            l += 1
            leftMax = max(leftMax, height[l])
            water += leftMax - height[l]
        else:
            r -= 1
            rightMax = max(rightMax, height[r])
            water += rightMax - height[r]
    return water`,
  gen(height) {
    const f = mkFrames();
    height = height.map(h => Math.max(0, h));
    let l = 0, r = height.length - 1;
    let leftMax = height[l], rightMax = height[r], water = 0;
    const B = (hl, ptrs) => ({ t: "bars", label: "elevation map", v: height, hl, ptrs });
    const V = () => ({ t: "vars", entries: [["leftMax", leftMax], ["rightMax", rightMax], ["water", water]] });
    f.add(`Water above a bar is bounded by min(leftMax, rightMax). Advance the side with the smaller max — its bound is certain.`, 3,
      [B({}, { [l]: "L", [r]: "R" }), V()]);
    while (l < r) {
      if (leftMax < rightMax) {
        l++;
        leftMax = Math.max(leftMax, height[l]);
        const add = leftMax - height[l];
        water += add;
        f.add(add > 0
          ? `leftMax (${leftMax}) < rightMax — move L to ${l}. Bar is ${height[l]}, so ${add} unit(s) of water sit on it.`
          : `leftMax < rightMax — move L to ${l}. Bar ${height[l]} reaches leftMax, no water here.`, 9,
          [B({ [l]: add > 0 ? "g" : "y" }, { [l]: "L", [r]: "R" }), V()]);
      } else {
        r--;
        rightMax = Math.max(rightMax, height[r]);
        const add = rightMax - height[r];
        water += add;
        f.add(add > 0
          ? `rightMax (${rightMax}) ≤ leftMax side — move R to ${r}. Bar is ${height[r]}, so ${add} unit(s) of water sit on it.`
          : `rightMax side is the smaller bound — move R to ${r}. Bar ${height[r]} reaches rightMax, no water here.`, 13,
          [B({ [r]: add > 0 ? "g" : "y" }, { [l]: "L", [r]: "R" }), V()]);
      }
    }
    f.add(`Pointers met — total trapped water: ${water} units. One pass, O(1) extra space.`, 14, [B({}, {}), V()], true);
    return f;
  },
};

// ---------------------------------------------------------------- Min Stack
VIS["min-stack"] = {
  inputs: [],
  code: `class MinStack:
    def __init__(self):
        self.stack = []  # (value, min so far)

    def push(self, val):
        m = min(val, self.stack[-1][1]) if self.stack else val
        self.stack.append((val, m))

    def pop(self):
        self.stack.pop()

    def top(self):
        return self.stack[-1][0]

    def getMin(self):
        return self.stack[-1][1]`,
  gen() {
    const f = mkFrames();
    const stack = []; // [val, min]
    const St = hl => ({ t: "stack", label: "stack (value · min so far)", v: stack.map(([v, m]) => `${v} · min ${m}`), hl });
    const ops = [
      ["push", 5], ["push", 2], ["push", 7], ["getMin"], ["pop"],
      ["push", 1], ["getMin"], ["pop"], ["top"], ["getMin"],
    ];
    f.add(`Trick: store the minimum-so-far NEXT TO each value. Then getMin never has to search — it just peeks the top.`, 3, [St()]);
    for (const [op, val] of ops) {
      if (op === "push") {
        const m = stack.length ? Math.min(val, stack[stack.length - 1][1]) : val;
        stack.push([val, m]);
        f.add(`push(${val}): min so far = min(${val}${stack.length > 1 ? `, ${stack[stack.length - 2][1]}` : ""}) = ${m}. Store the pair (${val}, ${m}).`, 7,
          [St({ [stack.length - 1]: "p" })]);
      } else if (op === "pop") {
        const [v] = stack[stack.length - 1];
        f.add(`pop(): remove ${v}. The pair below already remembers ITS own min — nothing to recompute.`, 10,
          [St({ [stack.length - 1]: "r" })]);
        stack.pop();
      } else if (op === "top") {
        f.add(`top() → ${stack[stack.length - 1][0]} — first element of the top pair. O(1).`, 13,
          [St({ [stack.length - 1]: "p" })]);
      } else {
        f.add(`getMin() → ${stack[stack.length - 1][1]} — second element of the top pair. O(1), no scanning.`, 16,
          [St({ [stack.length - 1]: "g" })]);
      }
    }
    f.add(`Every operation — push, pop, top, getMin — ran in O(1) by pairing each value with the min beneath it.`, 16, [St()], true);
    return f;
  },
};

// ----------------------------------------------------- Koko Eating Bananas
VIS["koko-eating-bananas"] = {
  inputs: [
    { name: "piles", label: "piles", type: "arr", def: "[3, 6, 7, 11]", max: 8, min: 1 },
    { name: "h", label: "h (hours)", type: "int", def: "8", min: 1, max: 40 },
  ],
  code: `def minEatingSpeed(piles, h):
    l, r = 1, max(piles)
    res = r
    while l <= r:
        k = (l + r) // 2
        hours = sum(ceil(p / k) for p in piles)
        if hours <= h:
            res = k
            r = k - 1
        else:
            l = k + 1
    return res`,
  gen(piles, h) {
    const f = mkFrames();
    piles = piles.map(p => Math.max(1, p));
    if (h < piles.length) h = piles.length; // one hour per pile is the physical minimum
    let l = 1, r = Math.max(...piles), res = r;
    const P = hl => ({ t: "arr", label: "piles", v: piles, hl });
    const Hrs = (k, hl) => ({ t: "arr", label: `hours per pile at speed k = ${k}`, v: piles.map(p => Math.ceil(p / k)), hl });
    const V = (k, hours) => ({ t: "vars", entries: [["l", l], ["r", r], ["k", k ?? "—"], ["hours", hours ?? "—"], ["h", h], ["res", res]] });
    f.add(`Binary search the ANSWER: eating speed k lives in [1, max pile]. Checking a k is just a sum of ceilings.`, 2, [P({}), V()]);
    while (l <= r) {
      const k = (l + r) >> 1;
      const hours = piles.reduce((s, p) => s + Math.ceil(p / k), 0);
      f.add(`Try k = (${l} + ${r}) // 2 = ${k}: total hours = ${piles.map(p => Math.ceil(p / k)).join(" + ")} = ${hours}.`, 6,
        [P({}), Hrs(k, Object.fromEntries(piles.map((_, i) => [i, "p"]))), V(k, hours)]);
      if (hours <= h) {
        res = k;
        f.add(`${hours} ≤ ${h} — speed ${k} works! Remember it and try slower: r = ${k - 1}.`, 9,
          [P({}), Hrs(k, Object.fromEntries(piles.map((_, i) => [i, "g"]))), V(k, hours)]);
        r = k - 1;
      } else {
        f.add(`${hours} > ${h} — too slow. Koko must eat faster: l = ${k + 1}.`, 11,
          [P({}), Hrs(k, Object.fromEntries(piles.map((_, i) => [i, "r"]))), V(k, hours)]);
        l = k + 1;
      }
    }
    f.add(`Search space empty — the minimum workable speed is ${res} bananas/hour. O(n log max).`, 12, [P({}), V()], true);
    return f;
  },
};

// -------------------------------------------------------------- House Robber
VIS["house-robber"] = {
  inputs: [{ name: "nums", label: "house values", type: "arr", def: "[2, 7, 9, 3, 1]", max: 10, min: 1 }],
  code: `def rob(nums):
    rob1, rob2 = 0, 0
    # rob1 = best up to i-2, rob2 = best up to i-1
    for n in nums:
        rob1, rob2 = rob2, max(rob1 + n, rob2)
    return rob2`,
  gen(nums) {
    const f = mkFrames();
    let rob1 = 0, rob2 = 0;
    const A = hl => ({ t: "arr", label: "houses", v: nums, hl });
    const V = () => ({ t: "vars", entries: [["rob1 (i−2)", rob1], ["rob2 (i−1)", rob2]] });
    f.add(`At each house: either rob it (adding to the best two houses back) or skip it (keeping the best so far).`, 2, [A({}), V()]);
    for (let i = 0; i < nums.length; i++) {
      const take = rob1 + nums[i], skip = rob2;
      const taken = take > skip;
      [rob1, rob2] = [rob2, Math.max(take, skip)];
      f.add(`House ${i} (${nums[i]}): rob it → ${take - nums[i]} + ${nums[i]} = ${take}, or skip → ${skip}. ` +
        (taken ? `Robbing wins: best = ${rob2}.` : `Skipping wins: best stays ${rob2}.`), 5,
        [A({ [i]: taken ? "g" : "y" }), V()]);
    }
    f.add(`Maximum loot without robbing two adjacent houses: ${rob2}. O(n) time, two variables of space.`, 6, [A({}), V()], true);
    return f;
  },
};

// --------------------------------------------------------------- Coin Change
VIS["coin-change"] = {
  inputs: [
    { name: "coins", label: "coins", type: "arr", def: "[1, 3, 4]", max: 4, min: 1 },
    { name: "amount", label: "amount", type: "int", def: "6", min: 1, max: 9 },
  ],
  code: `def coinChange(coins, amount):
    dp = [float("inf")] * (amount + 1)
    dp[0] = 0
    for a in range(1, amount + 1):
        for c in coins:
            if a - c >= 0:
                dp[a] = min(dp[a], 1 + dp[a - c])
    return dp[amount] if dp[amount] != float("inf") else -1`,
  gen(coins, amount) {
    const f = mkFrames();
    coins = [...new Set(coins.map(c => Math.max(1, c)))].sort((a, b) => a - b);
    const INF = Infinity;
    const dp = new Array(amount + 1).fill(INF);
    dp[0] = 0;
    const D = hl => ({ t: "arr", label: "dp[a] = fewest coins to make amount a", v: dp.map(x => (x === INF ? "∞" : x)), hl });
    const C = hl => ({ t: "arr", label: "coins", v: coins, hl });
    f.add(`Build up from amount 0 (needs 0 coins). Every amount a asks each coin: "1 + dp[a − coin]" — take the minimum.`, 3,
      [C({}), D({ 0: "g" })]);
    for (let a = 1; a <= amount; a++) {
      for (let ci = 0; ci < coins.length; ci++) {
        const c = coins[ci];
        if (a - c < 0) continue;
        const cand = 1 + dp[a - c];
        if (cand < dp[a]) {
          dp[a] = cand;
          f.add(`a = ${a}, coin ${c}: 1 + dp[${a - c}] = ${cand === INF ? "∞" : cand} — new best for dp[${a}].`, 7,
            [C({ [ci]: "p" }), D({ [a]: "g", [a - c]: "p" })]);
        } else {
          f.add(`a = ${a}, coin ${c}: 1 + dp[${a - c}] = ${cand === INF ? "∞" : cand} — not better than dp[${a}] = ${dp[a] === INF ? "∞" : dp[a]}.`, 7,
            [C({ [ci]: "y" }), D({ [a]: "y", [a - c]: "p" })]);
        }
      }
    }
    f.add(dp[amount] === INF
      ? `dp[${amount}] stayed ∞ — the amount cannot be made from these coins. Return -1.`
      : `dp[${amount}] = ${dp[amount]} — the fewest coins for amount ${amount}. O(amount × coins).`, 8,
      [C({}), D({ [amount]: dp[amount] === INF ? "r" : "g" })], true);
    return f;
  },
};

// -------------------------------------------------------- Number of Islands
VIS["number-of-islands"] = {
  inputs: [],
  code: `def numIslands(grid):
    rows, cols = len(grid), len(grid[0])
    count = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1
                grid[r][c] = "#"
                stack = [(r, c)]
                while stack:
                    i, j = stack.pop()
                    for di, dj in [(1,0),(-1,0),(0,1),(0,-1)]:
                        ni, nj = i + di, j + dj
                        if 0 <= ni < rows and 0 <= nj < cols \\
                                and grid[ni][nj] == "1":
                            grid[ni][nj] = "#"
                            stack.append((ni, nj))
    return count`,
  gen() {
    const f = mkFrames();
    const grid = [
      [1, 1, 0, 0, 0],
      [1, 1, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 0, 1, 1],
    ];
    const rows = grid.length, cols = grid[0].length;
    const visited = new Set();
    let count = 0;
    const G = extra => {
      const hl = {};
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          hl[r + "," + c] = grid[r][c] === 0 ? "d" : (visited.has(r + "," + c) ? "g" : "w");
      Object.assign(hl, extra);
      return { t: "grid", label: "grid (dim = water, green = counted land)", v: grid, hl };
    };
    const V = () => ({ t: "vars", entries: [["count", count]] });
    f.add(`Scan every cell. Each time we step on land not yet claimed, that's ONE new island — flood-fill claims all of it.`, 3, [G(), V()]);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 1 && !visited.has(r + "," + c)) {
          count++;
          visited.add(r + "," + c);
          f.add(`Unclaimed land at (${r}, ${c}) — island #${count} found! Flood-fill everything connected to it.`, 7,
            [G({ [r + "," + c]: "p" }), V()]);
          const stack = [[r, c]];
          while (stack.length) {
            const [i, j] = stack.pop();
            for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const ni = i + di, nj = j + dj;
              if (ni >= 0 && ni < rows && nj >= 0 && nj < cols && grid[ni][nj] === 1 && !visited.has(ni + "," + nj)) {
                visited.add(ni + "," + nj);
                stack.push([ni, nj]);
                f.add(`(${ni}, ${nj}) is connected land — claim it for island #${count} so it's never counted again.`, 17,
                  [G({ [ni + "," + nj]: "p" }), V()]);
              }
            }
          }
        }
      }
    }
    f.add(`Scan complete: ${count} islands. Every cell was visited a constant number of times → O(m·n).`, 18, [G(), V()], true);
    return f;
  },
};

// ---------------------------------------------------------- Rotting Oranges
VIS["rotting-oranges"] = {
  inputs: [],
  code: `def orangesRotting(grid):
    rows, cols = len(grid), len(grid[0])
    queue = deque()
    fresh = 0
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1: fresh += 1
            elif grid[r][c] == 2: queue.append((r, c))
    minutes = 0
    while queue and fresh:
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < rows and 0 <= nc < cols \\
                        and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc))
        minutes += 1
    return minutes if fresh == 0 else -1`,
  gen() {
    const f = mkFrames();
    const grid = [
      [2, 1, 1],
      [1, 1, 0],
      [0, 1, 1],
    ];
    const rows = grid.length, cols = grid[0].length;
    let queue = [], fresh = 0, minutes = 0;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 1) fresh++;
        else if (grid[r][c] === 2) queue.push([r, c]);
      }
    const SYM = ["·", "🍊", "🤢"];
    const G = extra => {
      const hl = {};
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          hl[r + "," + c] = grid[r][c] === 0 ? "d" : (grid[r][c] === 2 ? "r" : "y");
      Object.assign(hl, extra);
      return { t: "grid", label: "oranges (yellow = fresh, red = rotten)", v: grid.map(row => row.map(x => SYM[x])), hl };
    };
    const V = () => ({ t: "vars", entries: [["minutes", minutes], ["fresh", fresh]] });
    f.add(`Multi-source BFS: ALL rotten oranges spread at once. Each BFS layer = one minute of rot.`, 8, [G(), V()]);
    while (queue.length && fresh) {
      const next = [];
      const infected = [];
      for (const [r, c] of queue) {
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] === 1) {
            grid[nr][nc] = 2;
            fresh--;
            next.push([nr, nc]);
            infected.push(nr + "," + nc);
          }
        }
      }
      minutes++;
      f.add(`Minute ${minutes}: every rotten orange infects its fresh 4-neighbors — ${infected.length} orange(s) turn. ${fresh} still fresh.`, 20,
        [G(Object.fromEntries(infected.map(k => [k, "p"]))), V()]);
      queue = next;
    }
    if (fresh === 0) {
      f.add(`No fresh oranges left after ${minutes} minute(s) — that's the answer. BFS layers = elapsed time.`, 21, [G(), V()], true);
    } else {
      f.add(`The rot can't spread further but ${fresh} orange(s) stay fresh — unreachable. Return -1.`, 21, [G(), V()], true);
    }
    return f;
  },
};

// ============================ batch 3: arrays, windows, stacks ============================

// ------------------------------------------------------------ Group Anagrams
VIS["group-anagrams"] = {
  inputs: [{ name: "strs", label: "words (comma-separated)", type: "words", def: "eat, tea, tan, ate, nat, bat" }],
  code: `def groupAnagrams(strs):
    groups = defaultdict(list)
    for w in strs:
        key = "".join(sorted(w))
        groups[key].append(w)
    return list(groups.values())`,
  gen(strs) {
    const f = mkFrames();
    const groups = {};
    const A = hl => ({ t: "arr", label: "strs", v: strs, hl });
    const G = hl => ({ t: "kv", label: "groups (sorted key → anagrams)", entries: Object.entries(groups).map(([k, v]) => [k, `[${v.join(", ")}]`]), hl });
    f.add(`Anagrams become identical when their letters are sorted — so the sorted word is a perfect bucket key.`, 2, [A({}), G()]);
    strs.forEach((w, i) => {
      const key = [...w].sort().join("");
      const isNew = !groups[key];
      (groups[key] = groups[key] || []).push(w);
      f.add(`"${w}" sorts to key "${key}" — ${isNew ? "start a new group" : `join the existing "${key}" group`}.`, 5,
        [A({ [i]: isNew ? "p" : "g" }), G({ [key]: isNew ? "p" : "g" })]);
    });
    f.add(`One pass done: ${Object.keys(groups).length} group(s). Each word cost O(k log k) to sort its key.`, 6, [A({}), G()], true);
    return f;
  },
};

// ---------------------------------------------------- Top K Frequent Elements
VIS["top-k-frequent-elements"] = {
  inputs: [
    { name: "nums", label: "nums", type: "arr", def: "[1, 1, 1, 2, 2, 3]" },
    { name: "k", label: "k", type: "int", def: "2", min: 1, max: 10 },
  ],
  code: `def topKFrequent(nums, k):
    count = {}
    for n in nums:
        count[n] = count.get(n, 0) + 1
    buckets = [[] for _ in range(len(nums) + 1)]
    for n, c in count.items():
        buckets[c].append(n)
    res = []
    for c in range(len(nums), 0, -1):
        for n in buckets[c]:
            res.append(n)
            if len(res) == k:
                return res`,
  gen(nums, k) {
    const f = mkFrames();
    k = Math.min(k, new Set(nums).size);
    const count = {};
    const A = hl => ({ t: "arr", label: "nums", v: nums, hl });
    const C = hl => ({ t: "kv", label: "count", entries: kvEntries(count), hl });
    const buckets = Array.from({ length: nums.length + 1 }, () => []);
    const B = hl => ({ t: "arr", label: "buckets (index = frequency)", v: buckets.map(b => b.length ? b.join(",") : "·"), hl });
    const res = [];
    const R = hl => ({ t: "set", label: `res (top ${k})`, v: res, hl });
    f.add(`Counting sort idea: a value's frequency is at most n, so frequencies can be bucket-sorted — no heap, no O(n log n).`, 2, [A({}), C()]);
    nums.forEach((n, i) => { count[n] = (count[n] || 0) + 1; });
    f.add(`First pass: count every value. ${Object.entries(count).map(([n, c]) => `${n}×${c}`).join(", ")}.`, 4, [A({}), C(Object.fromEntries(Object.keys(count).map(n => [n, "p"])))]);
    for (const [n, c] of Object.entries(count)) {
      buckets[c].push(n);
      f.add(`Value ${n} occurred ${c} time(s) — drop it into bucket ${c}.`, 7, [C({ [n]: "y" }), B({ [c]: "y" })]);
    }
    for (let c = nums.length; c > 0 && res.length < k; c--) {
      for (const n of buckets[c]) {
        res.push(n);
        f.add(`Read buckets from the highest frequency down: take ${n} (frequency ${c}).`, 11, [B({ [c]: "g" }), R({ [n]: "g" })]);
        if (res.length === k) break;
      }
    }
    f.add(`Top ${k} most frequent: [${res.join(", ")}] — all in O(n) time.`, 13, [B({}), R()], true);
    return f;
  },
};

// ---------------------------------------------- Longest Consecutive Sequence
VIS["longest-consecutive-sequence"] = {
  inputs: [{ name: "nums", label: "nums", type: "arr", def: "[100, 4, 200, 1, 3, 2]" }],
  code: `def longestConsecutive(nums):
    s = set(nums)
    best = 0
    for n in s:
        if n - 1 not in s:
            length = 1
            while n + length in s:
                length += 1
            best = max(best, length)
    return best`,
  gen(nums) {
    const f = mkFrames();
    const s = [...new Set(nums)];
    let best = 0;
    const S = hl => ({ t: "set", label: "set(nums)", v: s, hl });
    const V = () => ({ t: "vars", entries: [["best", best]] });
    f.add(`Put everything in a set. Only numbers with NO left neighbor (n−1 absent) can start a run — everyone else is mid-run.`, 2, [S(), V()]);
    for (const n of s) {
      if (s.includes(n - 1)) {
        f.add(`${n}: ${n - 1} is in the set, so ${n} sits inside some run — skip it as a starting point.`, 5, [S({ [n]: "d", [n - 1]: "y" }), V()]);
        continue;
      }
      let length = 1;
      const runHl = { [n]: "p" };
      f.add(`${n}: ${n - 1} is absent — ${n} starts a run. Count upward.`, 5, [S(runHl), V()]);
      while (s.includes(n + length)) {
        runHl[n + length] = "g";
        length++;
        f.add(`${n + length - 1} is in the set — the run ${n}…${n + length - 1} now has length ${length}.`, 8, [S(runHl), V()]);
      }
      best = Math.max(best, length);
      f.add(`Run starting at ${n} ends with length ${length}. best = ${best}.`, 9, [S(runHl), V()]);
    }
    f.add(`Every number is visited at most twice, so this is O(n) despite the inner loop. Answer: ${best}.`, 10, [S(), V()], true);
    return f;
  },
};

// ------------------------------------------------- Encode and Decode Strings
VIS["encode-and-decode-strings"] = {
  inputs: [{ name: "strs", label: "words (comma-separated)", type: "words", def: "neet, code, love, you" }],
  code: `def encode(strs):
    return "".join(f"{len(w)}#{w}" for w in strs)

def decode(s):
    res, i = [], 0
    while i < len(s):
        j = s.index("#", i)
        length = int(s[i:j])
        res.append(s[j+1 : j+1+length])
        i = j + 1 + length
    return res`,
  gen(strs) {
    const f = mkFrames();
    let enc = "";
    const W = hl => ({ t: "arr", label: "strs", v: strs, hl });
    const E = hl => ({ t: "arr", label: "encoded", v: [...enc], hl, ch: true });
    f.add(`Delimiters alone break if a word contains them. Length-prefixing ("4#word") is unambiguous for ANY content.`, 2, [W({})]);
    strs.forEach((w, i) => {
      enc += `${w.length}#${w}`;
      f.add(`Encode "${w}" → append "${w.length}#${w}".`, 2, [W({ [i]: "p" }), E(Object.fromEntries([...Array(w.length + 2).keys()].map(o => [enc.length - 1 - o, "p"])))]);
    });
    const res = [];
    const R = hl => ({ t: "set", label: "decoded", v: res, hl });
    let i = 0;
    f.add(`Now decode: read digits up to '#' to learn the next word's exact length — no guessing needed.`, 5, [E({}), R()]);
    while (i < enc.length) {
      const j = enc.indexOf("#", i);
      const len = parseInt(enc.slice(i, j), 10);
      const word = enc.slice(j + 1, j + 1 + len);
      const hl = {};
      for (let x = i; x <= j; x++) hl[x] = "y";
      for (let x = j + 1; x < j + 1 + len; x++) hl[x] = "g";
      res.push(word);
      f.add(`Read "${enc.slice(i, j)}#" → next word is exactly ${len} chars: "${word}".`, 9, [E(hl), R({ [word]: "g" })]);
      i = j + 1 + len;
    }
    f.add(`Round trip complete: [${res.join(", ")}] — identical to the input, in O(n).`, 11, [E({}), R()], true);
    return f;
  },
};

// -------------------------------------- Longest Repeating Character Replacement
VIS["longest-repeating-character-replacement"] = {
  inputs: [
    { name: "s", label: "s", type: "str", def: "AABABBA", max: 14 },
    { name: "k", label: "k", type: "int", def: "1", min: 0, max: 5 },
  ],
  code: `def characterReplacement(s, k):
    count = {}
    l = 0
    best = 0
    for r in range(len(s)):
        count[s[r]] = count.get(s[r], 0) + 1
        while (r - l + 1) - max(count.values()) > k:
            count[s[l]] -= 1
            l += 1
        best = max(best, r - l + 1)
    return best`,
  gen(s, k) {
    const f = mkFrames();
    const count = {};
    let l = 0, best = 0;
    const S = (r, extra) => {
      const hl = {};
      for (let i = l; i <= r; i++) hl[i] = "w";
      Object.assign(hl, extra || {});
      return { t: "arr", label: "s (window)", v: [...s], hl, ptrs: { [l]: "L", ...(r >= l ? { [r]: "R" } : {}) }, ch: true };
    };
    const C = hl => ({ t: "kv", label: "count (in window)", entries: kvEntries(count), hl });
    const V = maxf => ({ t: "vars", entries: [["k", k], ["max count", maxf], ["best", best]] });
    f.add(`A window works if every char except the most common one can be replaced: (length − max count) ≤ k.`, 2, [S(-1), C(), V(0)]);
    for (let r = 0; r < s.length; r++) {
      count[s[r]] = (count[s[r]] || 0) + 1;
      let maxf = Math.max(...Object.values(count));
      f.add(`Take '${s[r]}'. Window length ${r - l + 1}, max count ${maxf} → needs ${r - l + 1 - maxf} replacement(s).`, 6, [S(r, { [r]: "p" }), C({ [s[r]]: "p" }), V(maxf)]);
      while ((r - l + 1) - Math.max(...Object.values(count)) > k) {
        count[s[l]] -= 1;
        if (!count[s[l]]) delete count[s[l]];
        f.add(`Needs more than k = ${k} replacements — invalid. Drop '${s[l]}' and slide L to ${l + 1}.`, 9, [S(r, { [l]: "y" }), C(), V(Math.max(...Object.values(count)))]);
        l++;
      }
      const len = r - l + 1;
      const improved = len > best;
      best = Math.max(best, len);
      if (improved) f.add(`Valid window "${s.slice(l, r + 1)}" of length ${len} — new best!`, 10, [S(r, { [r]: "g" }), C(), V(Math.max(...Object.values(count)))]);
    }
    f.add(`Longest substring fixable with ≤ ${k} replacement(s): ${best}. One pass, O(n).`, 11, [S(s.length - 1), C(), V("—")], true);
    return f;
  },
};

// ---------------------------------------------------- Permutation in String
VIS["permutation-in-string"] = {
  inputs: [
    { name: "s1", label: "s1 (pattern)", type: "str", def: "ab", max: 6 },
    { name: "s2", label: "s2", type: "str", def: "eidbaooo", max: 16 },
  ],
  code: `def checkInclusion(s1, s2):
    if len(s1) > len(s2):
        return False
    need = Counter(s1)
    window = Counter(s2[:len(s1)])
    if window == need:
        return True
    for r in range(len(s1), len(s2)):
        window[s2[r]] += 1
        l = r - len(s1)
        window[s2[l]] -= 1
        if window[s2[l]] == 0:
            del window[s2[l]]
        if window == need:
            return True
    return False`,
  gen(s1, s2) {
    const f = mkFrames();
    const m = s1.length;
    const S2 = (lo, extra) => {
      const hl = {};
      for (let i = lo; i < lo + m; i++) hl[i] = "w";
      Object.assign(hl, extra || {});
      return { t: "arr", label: "s2 (fixed-size window)", v: [...s2], hl, ch: true };
    };
    const cnt = str => { const c = {}; for (const ch of str) c[ch] = (c[ch] || 0) + 1; return c; };
    const eq = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
    const need = cnt(s1);
    const N = () => ({ t: "kv", label: "need (from s1)", entries: kvEntries(need) });
    if (m > s2.length) {
      f.add(`s1 is longer than s2 — no window can hold a permutation. Return False.`, 3, [S2(0), N()], true);
      return f;
    }
    let window = cnt(s2.slice(0, m));
    const W = hl => ({ t: "kv", label: "window counts", entries: kvEntries(window), hl });
    f.add(`A permutation of s1 is just any substring with s1's exact letter counts — slide a window of size ${m} and compare counts.`, 4, [S2(0), N(), W()]);
    if (eq(window, need)) {
      f.add(`The first window "${s2.slice(0, m)}" already matches s1's counts — permutation found!`, 6, [S2(0, Object.fromEntries([...Array(m).keys()].map(i => [i, "g"]))), N(), W()], true);
      return f;
    }
    f.add(`First window "${s2.slice(0, m)}" doesn't match. Slide right one character at a time.`, 6, [S2(0), N(), W()]);
    for (let r = m; r < s2.length; r++) {
      const l = r - m;
      window[s2[r]] = (window[s2[r]] || 0) + 1;
      window[s2[l]] -= 1;
      if (!window[s2[l]]) delete window[s2[l]];
      const lo = l + 1;
      if (eq(window, need)) {
        f.add(`Window "${s2.slice(lo, lo + m)}" matches s1's counts exactly — permutation found! Return True.`, 15,
          [S2(lo, Object.fromEntries([...Array(m).keys()].map(i => [lo + i, "g"]))), N(), W()], true);
        return f;
      }
      f.add(`Slide: gain '${s2[r]}', drop '${s2[l]}' → window "${s2.slice(lo, lo + m)}" still ≠ need.`, 14, [S2(lo, { [r]: "p", [l]: "d" }), N(), W({ [s2[r]]: "p" })]);
    }
    f.add(`No window of size ${m} ever matched — s2 contains no permutation of s1. Return False.`, 16, [S2(s2.length - m), N(), W()], true);
    return f;
  },
};

// -------------------------------------------------- Minimum Window Substring
VIS["minimum-window-substring"] = {
  inputs: [
    { name: "s", label: "s", type: "str", def: "ADOBECODEBANC", max: 16 },
    { name: "t", label: "t", type: "str", def: "ABC", max: 6 },
  ],
  code: `def minWindow(s, t):
    need = Counter(t)
    have, goal = 0, len(need)
    best = ""
    window = {}
    l = 0
    for r, c in enumerate(s):
        window[c] = window.get(c, 0) + 1
        if c in need and window[c] == need[c]:
            have += 1
        while have == goal:
            if not best or r - l + 1 < len(best):
                best = s[l:r+1]
            window[s[l]] -= 1
            if s[l] in need and window[s[l]] < need[s[l]]:
                have -= 1
            l += 1
    return best`,
  gen(s, t) {
    const f = mkFrames();
    const need = {};
    for (const c of t) need[c] = (need[c] || 0) + 1;
    const goal = Object.keys(need).length;
    let have = 0, best = "", l = 0;
    const window = {};
    const S = (r, extra) => {
      const hl = {};
      for (let i = l; i <= r; i++) hl[i] = "w";
      Object.assign(hl, extra || {});
      return { t: "arr", label: "s (window)", v: [...s], hl, ptrs: { [l]: "L", ...(r >= l ? { [r]: "R" } : {}) }, ch: true };
    };
    const N = () => ({ t: "kv", label: "need (from t)", entries: kvEntries(need) });
    const V = () => ({ t: "vars", entries: [["have", have], ["goal", goal], ["best", best || "—"]] });
    f.add(`Expand right until the window covers all of t, then shrink left while it still covers — every shrink may set a new best.`, 2, [S(-1), N(), V()]);
    for (let r = 0; r < s.length; r++) {
      const c = s[r];
      window[c] = (window[c] || 0) + 1;
      if (need[c] && window[c] === need[c]) {
        have++;
        f.add(`Take '${c}' — its need is now fully met (${have}/${goal} characters satisfied).`, 10, [S(r, { [r]: "g" }), N(), V()]);
      } else {
        f.add(`Take '${c}'${need[c] ? ` (still short on '${c}')` : ` (not needed)`}.`, 8, [S(r, { [r]: "p" }), N(), V()]);
      }
      while (have === goal) {
        if (!best || r - l + 1 < best.length) {
          best = s.slice(l, r + 1);
          f.add(`Window "${best}" covers all of t — new smallest so far (length ${best.length}).`, 13, [S(r, Object.fromEntries([...Array(r - l + 1).keys()].map(i => [l + i, "g"]))), N(), V()]);
        }
        window[s[l]] -= 1;
        if (need[s[l]] && window[s[l]] < need[s[l]]) {
          have--;
          f.add(`Shrink: dropping '${s[l]}' breaks coverage (${have}/${goal}) — stop shrinking, expand again.`, 16, [S(r, { [l]: "r" }), N(), V()]);
        } else {
          f.add(`Shrink: '${s[l]}' was surplus — window still covers t.`, 14, [S(r, { [l]: "y" }), N(), V()]);
        }
        l++;
      }
    }
    f.add(best ? `Smallest window containing all of "${t}": "${best}". O(n) — each pointer only moves forward.`
               : `No window of s ever covered "${t}" — return "".`, 18, [S(s.length - 1), N(), V()], true);
    return f;
  },
};

// ----------------------------------------------------- Sliding Window Maximum
VIS["sliding-window-maximum"] = {
  inputs: [
    { name: "nums", label: "nums", type: "arr", def: "[1, 3, -1, -3, 5, 3, 6, 7]" },
    { name: "k", label: "k", type: "int", def: "3", min: 1, max: 8 },
  ],
  code: `def maxSlidingWindow(nums, k):
    dq = deque()  # indices, values decreasing
    res = []
    for r in range(len(nums)):
        while dq and nums[dq[-1]] < nums[r]:
            dq.pop()
        dq.append(r)
        if dq[0] == r - k:
            dq.popleft()
        if r >= k - 1:
            res.append(nums[dq[0]])
    return res`,
  gen(nums, k) {
    const f = mkFrames();
    k = Math.min(k, nums.length);
    const dq = [];
    const res = [];
    const A = (r, extra) => {
      const hl = {};
      for (let i = Math.max(0, r - k + 1); i <= r; i++) hl[i] = "w";
      Object.assign(hl, extra || {});
      return { t: "arr", label: `nums (window of ${k})`, v: nums, hl };
    };
    const D = hl => ({ t: "set", label: "deque (index:value, decreasing)", v: dq.map(i => `${i}:${nums[i]}`), hl });
    const R = () => ({ t: "arr", label: "res (max per window)", v: res, hl: {} });
    f.add(`Keep a deque of indices whose values are DECREASING — the front is always the window max. Smaller values behind a bigger one can never matter.`, 2, [A(-1), D(), R()]);
    for (let r = 0; r < nums.length; r++) {
      while (dq.length && nums[dq[dq.length - 1]] < nums[r]) {
        const dead = dq.pop();
        f.add(`${nums[r]} arrives — ${nums[dead]} (index ${dead}) is smaller AND older, so it can never be a max again. Pop it.`, 6, [A(r, { [r]: "p", [dead]: "r" }), D(), R()]);
      }
      dq.push(r);
      if (dq[0] === r - k) {
        f.add(`Index ${dq[0]} slid out of the window — drop it from the front.`, 9, [A(r, { [dq[0]]: "d" }), D({ [`${dq[0]}:${nums[dq[0]]}`]: "r" }), R()]);
        dq.shift();
      }
      if (r >= k - 1) {
        res.push(nums[dq[0]]);
        f.add(`Window [${r - k + 1}..${r}]: the deque front holds the max, ${nums[dq[0]]}.`, 11, [A(r, { [dq[0]]: "g" }), D({ [`${dq[0]}:${nums[dq[0]]}`]: "g" }), R()]);
      } else {
        f.add(`Push index ${r} — window not full yet.`, 7, [A(r, { [r]: "y" }), D({ [`${r}:${nums[r]}`]: "y" }), R()]);
      }
    }
    f.add(`res = [${res.join(", ")}]. Every index enters and leaves the deque once → O(n) total.`, 12, [A(nums.length - 1), D(), R()], true);
    return f;
  },
};

// ------------------------------------------- Evaluate Reverse Polish Notation
VIS["evaluate-reverse-polish-notation"] = {
  inputs: [{ name: "tokens", label: "tokens (comma-separated)", type: "words", def: "2, 1, +, 3, *", max: 12 }],
  code: `def evalRPN(tokens):
    stack = []
    for t in tokens:
        if t in "+-*/":
            b = stack.pop()
            a = stack.pop()
            if t == "+": stack.append(a + b)
            elif t == "-": stack.append(a - b)
            elif t == "*": stack.append(a * b)
            else: stack.append(int(a / b))
        else:
            stack.append(int(t))
    return stack[0]`,
  gen(tokens) {
    const f = mkFrames();
    const stack = [];
    const T = hl => ({ t: "arr", label: "tokens", v: tokens, hl });
    const S = hl => ({ t: "stack", label: "stack", v: stack, hl });
    const OPS = { "+": (a, b) => a + b, "-": (a, b) => a - b, "*": (a, b) => a * b, "/": (a, b) => Math.trunc(a / b) };
    f.add(`Postfix needs no parentheses: numbers wait on a stack, and each operator consumes the top two.`, 2, [T({}), S()]);
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (OPS[t]) {
        if (stack.length < 2) {
          f.add(`Operator '${t}' has fewer than two operands — invalid expression.`, 5, [T({ [i]: "r" }), S()], true);
          return f;
        }
        const b = stack.pop(), a = stack.pop();
        const val = OPS[t](a, b);
        stack.push(val);
        f.add(`'${t}': pop ${b} and ${a}, compute ${a} ${t} ${b} = ${val}, push the result.`, 7, [T({ [i]: "p" }), S({ [stack.length - 1]: "g" })]);
      } else {
        const n = parseInt(t, 10);
        if (isNaN(n)) {
          f.add(`Token '${t}' is neither a number nor an operator — invalid expression.`, 13, [T({ [i]: "r" }), S()], true);
          return f;
        }
        stack.push(n);
        f.add(`'${t}' is a number — push it.`, 12, [T({ [i]: "y" }), S({ [stack.length - 1]: "y" })]);
      }
    }
    f.add(`All tokens consumed — the single value left, ${stack[0]}, is the answer. O(n).`, 13, [T({}), S({ 0: "g" })], true);
    return f;
  },
};

// --------------------------------------------------------- Generate Parentheses
VIS["generate-parentheses"] = {
  inputs: [{ name: "n", label: "n (pairs)", type: "int", def: "3", min: 1, max: 4 }],
  code: `def generateParenthesis(n):
    res = []
    def dfs(cur, open, close):
        if len(cur) == 2 * n:
            res.append(cur)
            return
        if open < n:
            dfs(cur + "(", open + 1, close)
        if close < open:
            dfs(cur + ")", open, close + 1)
    dfs("", 0, 0)
    return res`,
  gen(n) {
    const f = mkFrames();
    const res = [];
    const C = (cur, hlLast) => ({ t: "arr", label: "current string", v: cur ? [...cur] : ["·"], hl: hlLast && cur ? { [cur.length - 1]: hlLast } : {}, ch: true });
    const R = hl => ({ t: "set", label: "res", v: res, hl });
    const V = (o, c) => ({ t: "vars", entries: [["open", o], ["close", c], ["n", n]] });
    f.add(`Backtracking with two rules: '(' allowed while opens remain, ')' allowed only while it wouldn't unbalance.`, 3, [C(""), R(), V(0, 0)]);
    const dfs = (cur, open, close) => {
      if (cur.length === 2 * n) {
        res.push(cur);
        f.add(`"${cur}" is complete and balanced — add it to the results.`, 5, [C(cur, "g"), R({ [cur]: "g" }), V(open, close)]);
        return;
      }
      if (open < n) {
        f.add(`"${cur || "ε"}": open ${open} < ${n}, so we may add '(' → "${cur}(".`, 8, [C(cur + "(", "p"), R(), V(open + 1, close)]);
        dfs(cur + "(", open + 1, close);
      }
      if (close < open) {
        f.add(`"${cur || "ε"}": close ${close} < open ${open}, so ')' keeps it balanced → "${cur})".`, 10, [C(cur + ")", "y"), R(), V(open, close + 1)]);
        dfs(cur + ")", open, close + 1);
      }
    };
    dfs("", 0, 0);
    f.add(`All ${res.length} well-formed combinations for n = ${n} generated — the two rules prune every invalid branch early.`, 12, [C(""), R()], true);
    return f;
  },
};

// ------------------------------------------- Largest Rectangle in Histogram
VIS["largest-rectangle-in-histogram"] = {
  inputs: [{ name: "heights", label: "heights", type: "arr", def: "[2, 1, 5, 6, 2, 3]", max: 10 }],
  code: `def largestRectangleArea(heights):
    stack = []  # (start index, height)
    best = 0
    for i, h in enumerate(heights + [0]):
        start = i
        while stack and stack[-1][1] > h:
            idx, hh = stack.pop()
            best = max(best, hh * (i - idx))
            start = idx
        stack.append((start, h))
    return best`,
  gen(heights) {
    const f = mkFrames();
    heights = heights.map(h => Math.max(0, h));
    const stack = [];
    let best = 0;
    const B = (hl, ptrs) => ({ t: "bars", label: "histogram", v: heights, hl, ptrs });
    const S = hl => ({ t: "stack", label: "stack (start, height)", v: stack.map(([s, h]) => `(${s}, h=${h})`), hl });
    const V = () => ({ t: "vars", entries: [["best", best]] });
    f.add(`Bars wait on an increasing stack. When a shorter bar arrives, each taller bar's maximal rectangle is decided — width runs from its start to here.`, 3, [B({}, {}), S(), V()]);
    const ext = [...heights, 0];
    for (let i = 0; i < ext.length; i++) {
      const h = ext[i];
      let start = i;
      const isVirtual = i === heights.length;
      while (stack.length && stack[stack.length - 1][1] > h) {
        const [idx, hh] = stack.pop();
        const area = hh * (i - idx);
        const improved = area > best;
        best = Math.max(best, area);
        const hl = {};
        for (let x = idx; x < i && x < heights.length; x++) hl[x] = improved ? "g" : "y";
        f.add(`${isVirtual ? "End of input" : `Bar ${i} (h=${h})`} is lower than h=${hh} — that rectangle is done: ${hh} × ${i - idx} = ${area}.${improved ? " New best!" : ""}`, 8,
          [B(hl, isVirtual ? {} : { [i]: "i" }), S(), V()]);
        start = idx;
      }
      if (!isVirtual) {
        stack.push([start, h]);
        f.add(`Push bar h=${h} with start ${start} — it could still extend a rectangle to the right${start < i ? ` (start inherited from popped taller bars)` : ""}.`, 10,
          [B({ [i]: "p" }, { [i]: "i" }), S({ [stack.length - 1]: "p" }), V()]);
      }
    }
    f.add(`Largest rectangle area: ${best}. Each bar is pushed and popped once → O(n).`, 11, [B({}, {}), S(), V()], true);
    return f;
  },
};

// -------------------------------------------------------------------- Car Fleet
VIS["car-fleet"] = {
  inputs: [
    { name: "position", label: "position", type: "arr", def: "[10, 8, 0, 5, 3]", max: 8, min: 1 },
    { name: "speed", label: "speed", type: "arr", def: "[2, 4, 1, 1, 3]", max: 8, min: 1 },
    { name: "target", label: "target", type: "int", def: "12", min: 1, max: 9999 },
  ],
  code: `def carFleet(target, position, speed):
    cars = sorted(zip(position, speed), reverse=True)
    fleets = []  # arrival times, as a stack
    for pos, spd in cars:
        time = (target - pos) / spd
        if not fleets or time > fleets[-1]:
            fleets.append(time)
    return len(fleets)`,
  gen(position, speed, target) {
    const f = mkFrames();
    if (position.length !== speed.length) {
      f.add(`position and speed must have the same length — got ${position.length} vs ${speed.length}.`, 1, [{ t: "vars", entries: [["error", "length mismatch"]] }], true);
      return f;
    }
    speed = speed.map(x => Math.max(1, x));
    const cars = position.map((p, i) => [p, speed[i]]).sort((a, b) => b[0] - a[0]);
    const fleets = [];
    const round2 = x => Math.round(x * 100) / 100;
    const C = hl => ({ t: "arr", label: "cars sorted by position (pos @ speed)", v: cars.map(([p, s]) => `${p}@${s}`), hl });
    const S = hl => ({ t: "stack", label: "fleets (arrival time)", v: fleets.map(t => `t=${round2(t)}`), hl });
    const V = () => ({ t: "vars", entries: [["target", target], ["fleets", fleets.length]] });
    f.add(`Sort cars front to back. A car catches the fleet ahead iff it would arrive no later — then it merges and adopts that fleet's time.`, 2, [C({}), S(), V()]);
    cars.forEach(([pos, spd], i) => {
      const time = (target - pos) / spd;
      if (!fleets.length || time > fleets[fleets.length - 1]) {
        fleets.push(time);
        f.add(`Car at ${pos} (speed ${spd}) arrives at t=${round2(time)} — later than the fleet ahead, so it can't catch up: NEW fleet.`, 7, [C({ [i]: "p" }), S({ [fleets.length - 1]: "p" }), V()]);
      } else {
        f.add(`Car at ${pos} (speed ${spd}) would arrive at t=${round2(time)} ≤ the fleet ahead (t=${round2(fleets[fleets.length - 1])}) — it catches up and merges.`, 6, [C({ [i]: "g" }), S({ [fleets.length - 1]: "g" }), V()]);
      }
    });
    f.add(`${fleets.length} fleet(s) reach the target. Sorting dominates: O(n log n).`, 8, [C({}), S(), V()], true);
    return f;
  },
};

// ============================ batch 4: binary search, linked lists, trees ============================

// ------------------------------------------------------------ Search a 2D Matrix
VIS["search-a-2d-matrix"] = {
  inputs: [{ name: "target", label: "target", type: "int", def: "16", min: -9999, max: 9999 }],
  code: `def searchMatrix(matrix, target):
    rows, cols = len(matrix), len(matrix[0])
    l, r = 0, rows * cols - 1
    while l <= r:
        m = (l + r) // 2
        val = matrix[m // cols][m % cols]
        if val == target:
            return True
        if val < target:
            l = m + 1
        else:
            r = m - 1
    return False`,
  gen(target) {
    const f = mkFrames();
    const matrix = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]];
    const rows = matrix.length, cols = matrix[0].length;
    let l = 0, r = rows * cols - 1;
    const G = extra => {
      const hl = {};
      for (let i = 0; i < rows * cols; i++) if (i < l || i > r) hl[Math.floor(i / cols) + "," + (i % cols)] = "d";
      Object.assign(hl, extra || {});
      return { t: "grid", label: "matrix (dimmed = eliminated)", v: matrix, hl };
    };
    const V = (m, val) => ({ t: "vars", entries: [["target", target], ["l", l], ["m", m ?? "—"], ["r", r], ["val", val ?? "—"]] });
    f.add(`Rows are sorted and each row continues the previous — so the matrix IS one sorted list of ${rows * cols} cells. Binary search flat indices.`, 3, [G(), V()]);
    while (l <= r) {
      const m = (l + r) >> 1;
      const val = matrix[Math.floor(m / cols)][m % cols];
      const key = Math.floor(m / cols) + "," + (m % cols);
      if (val === target) {
        f.add(`Flat index ${m} → cell (${Math.floor(m / cols)}, ${m % cols}) = ${val} — target found! Return True.`, 8, [G({ [key]: "g" }), V(m, val)], true);
        return f;
      }
      if (val < target) {
        f.add(`Flat m = ${m} → value ${val} < ${target} — everything before it is smaller too. l = ${m + 1}.`, 10, [G({ [key]: "y" }), V(m, val)]);
        l = m + 1;
      } else {
        f.add(`Flat m = ${m} → value ${val} > ${target} — everything after it is bigger too. r = ${m - 1}.`, 12, [G({ [key]: "y" }), V(m, val)]);
        r = m - 1;
      }
    }
    f.add(`Range empty — ${target} is not in the matrix. Return False. O(log(m·n)).`, 13, [G(), V()], true);
    return f;
  },
};

// ------------------------------------ Find Minimum in Rotated Sorted Array
VIS["find-minimum-in-rotated-sorted-array"] = {
  inputs: [{ name: "nums", label: "nums (rotated sorted)", type: "arr", def: "[4, 5, 6, 7, 0, 1, 2]", min: 1 }],
  code: `def findMin(nums):
    l, r = 0, len(nums) - 1
    while l < r:
        m = (l + r) // 2
        if nums[m] > nums[r]:
            l = m + 1
        else:
            r = m
    return nums[l]`,
  gen(nums) {
    const f = mkFrames();
    let l = 0, r = nums.length - 1;
    const A = (hl, ptrs) => {
      const full = {};
      for (let i = 0; i < nums.length; i++) if (i < l || i > r) full[i] = "d";
      Object.assign(full, hl || {});
      return { t: "arr", label: "nums (dimmed = eliminated)", v: nums, hl: full, ptrs };
    };
    f.add(`The minimum is the rotation point. Compare mid against the RIGHT end: if mid is bigger, the drop is to mid's right.`, 2, [A({}, { [l]: "L", [r]: "R" })]);
    while (l < r) {
      const m = (l + r) >> 1;
      if (nums[m] > nums[r]) {
        f.add(`nums[${m}] = ${nums[m]} > nums[${r}] = ${nums[r]} — the drop (minimum) must be right of m. l = ${m + 1}.`, 6, [A({ [m]: "y" }, { [l]: "L", [m]: "M", [r]: "R" })]);
        l = m + 1;
      } else {
        f.add(`nums[${m}] = ${nums[m]} ≤ nums[${r}] = ${nums[r]} — mid..right is sorted, so the minimum is at m or left of it. r = ${m}.`, 8, [A({ [m]: "p" }, { [l]: "L", [m]: "M", [r]: "R" })]);
        r = m;
      }
    }
    f.add(`Pointers met at index ${l} — the minimum is ${nums[l]}. O(log n).`, 9, [A({ [l]: "g" }, { [l]: "L R" })], true);
    return f;
  },
};

// ------------------------------------------ Search in Rotated Sorted Array
VIS["search-in-rotated-sorted-array"] = {
  inputs: [
    { name: "nums", label: "nums (rotated sorted)", type: "arr", def: "[4, 5, 6, 7, 0, 1, 2]", min: 1 },
    { name: "target", label: "target", type: "int", def: "0", min: -9999, max: 9999 },
  ],
  code: `def search(nums, target):
    l, r = 0, len(nums) - 1
    while l <= r:
        m = (l + r) // 2
        if nums[m] == target:
            return m
        if nums[l] <= nums[m]:  # left half sorted
            if nums[l] <= target < nums[m]:
                r = m - 1
            else:
                l = m + 1
        else:                   # right half sorted
            if nums[m] < target <= nums[r]:
                l = m + 1
            else:
                r = m - 1
    return -1`,
  gen(nums, target) {
    const f = mkFrames();
    let l = 0, r = nums.length - 1;
    const A = (hl, ptrs) => {
      const full = {};
      for (let i = 0; i < nums.length; i++) if (i < l || i > r) full[i] = "d";
      Object.assign(full, hl || {});
      return { t: "arr", label: "nums (dimmed = eliminated)", v: nums, hl: full, ptrs };
    };
    const V = m => ({ t: "vars", entries: [["target", target], ["m", m ?? "—"]] });
    f.add(`After rotation, one half around mid is ALWAYS still sorted. Figure out which, then check if the target lies in that sorted half.`, 2, [A({}, { [l]: "L", [r]: "R" }), V()]);
    while (l <= r) {
      const m = (l + r) >> 1;
      if (nums[m] === target) {
        f.add(`nums[${m}] = ${target} — found at index ${m}. O(log n).`, 6, [A({ [m]: "g" }, { [m]: "M" }), V(m)], true);
        return f;
      }
      if (nums[l] <= nums[m]) {
        if (nums[l] <= target && target < nums[m]) {
          f.add(`Left half [${nums[l]}..${nums[m]}] is sorted and contains ${target} — search it. r = ${m - 1}.`, 9, [A({ [m]: "p" }, { [l]: "L", [m]: "M", [r]: "R" }), V(m)]);
          r = m - 1;
        } else {
          f.add(`Left half [${nums[l]}..${nums[m]}] is sorted but ${target} is NOT inside it — go right. l = ${m + 1}.`, 11, [A({ [m]: "y" }, { [l]: "L", [m]: "M", [r]: "R" }), V(m)]);
          l = m + 1;
        }
      } else {
        if (nums[m] < target && target <= nums[r]) {
          f.add(`Right half [${nums[m]}..${nums[r]}] is sorted and contains ${target} — search it. l = ${m + 1}.`, 14, [A({ [m]: "p" }, { [l]: "L", [m]: "M", [r]: "R" }), V(m)]);
          l = m + 1;
        } else {
          f.add(`Right half [${nums[m]}..${nums[r]}] is sorted but ${target} is NOT inside it — go left. r = ${m - 1}.`, 16, [A({ [m]: "y" }, { [l]: "L", [m]: "M", [r]: "R" }), V(m)]);
          r = m - 1;
        }
      }
    }
    f.add(`Range empty — ${target} is not in the array. Return -1.`, 17, [A({}, {}), V()], true);
    return f;
  },
};

// --------------------------------------------------- Merge Two Sorted Lists
VIS["merge-two-sorted-lists"] = {
  inputs: [
    { name: "a", label: "list1 (sorted)", type: "arr", def: "[1, 2, 4]", max: 8 },
    { name: "b", label: "list2 (sorted)", type: "arr", def: "[1, 3, 4]", max: 8 },
  ],
  code: `def mergeTwoLists(l1, l2):
    dummy = ListNode()
    tail = dummy
    while l1 and l2:
        if l1.val <= l2.val:
            tail.next = l1
            l1 = l1.next
        else:
            tail.next = l2
            l2 = l2.next
        tail = tail.next
    tail.next = l1 or l2
    return dummy.next`,
  gen(a, b) {
    const f = mkFrames();
    a = [...a].sort((x, y) => x - y);
    b = [...b].sort((x, y) => x - y);
    let i = 0, j = 0;
    const out = [];
    const A = hl => ({ t: "arr", label: "list1", v: a, hl: { ...Object.fromEntries(a.map((_, x) => [x, x < i ? "d" : undefined]).filter(([, c]) => c)), ...hl }, ptrs: i < a.length ? { [i]: "l1" } : {} });
    const B = hl => ({ t: "arr", label: "list2", v: b, hl: { ...Object.fromEntries(b.map((_, x) => [x, x < j ? "d" : undefined]).filter(([, c]) => c)), ...hl }, ptrs: j < b.length ? { [j]: "l2" } : {} });
    const O = hl => ({ t: "arr", label: "merged (spliced nodes)", v: out.length ? out : ["·"], hl });
    f.add(`A dummy head plus a tail pointer: at every step splice on whichever list's front node is smaller.`, 3, [A({}), B({}), O({})]);
    while (i < a.length && j < b.length) {
      if (a[i] <= b[j]) {
        out.push(a[i]);
        f.add(`${a[i]} ≤ ${b[j]} — take ${a[i]} from list1 and advance it.`, 7, [A({ [i]: "g" }), B({ [j]: "p" }), O({ [out.length - 1]: "g" })]);
        i++;
      } else {
        out.push(b[j]);
        f.add(`${b[j]} < ${a[i]} — take ${b[j]} from list2 and advance it.`, 10, [A({ [i]: "p" }), B({ [j]: "g" }), O({ [out.length - 1]: "g" })]);
        j++;
      }
    }
    if (i < a.length || j < b.length) {
      const rest = i < a.length ? a.slice(i) : b.slice(j);
      const which = i < a.length ? "list1" : "list2";
      const startIdx = out.length;
      out.push(...rest);
      f.add(`One list is empty — attach the remainder of ${which} ([${rest.join(", ")}]) in one splice; it's already sorted.`, 12,
        [A({}), B({}), O(Object.fromEntries(rest.map((_, x) => [startIdx + x, "y"])))]);
    }
    f.add(`Merged: [${out.join(", ")}]. Nodes are re-linked, not copied — O(n + m) time, O(1) extra space.`, 13,
      [O(Object.fromEntries(out.map((_, x) => [x, "g"])))], true);
    return f;
  },
};

// --------------------------------------------------------- Linked List Cycle
VIS["linked-list-cycle"] = {
  inputs: [],
  code: `def hasCycle(head):
    slow = fast = head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False`,
  gen() {
    const f = mkFrames();
    const vals = [3, 2, 0, -4];
    const nxt = i => (i === vals.length - 1 ? 1 : i + 1); // tail loops to index 1
    let slow = 0, fast = 0;
    const A = extra => ({
      t: "arr", label: "nodes (the tail's next loops back to index 1)", v: vals,
      hl: extra || {}, ptrs: slow === fast ? { [slow]: "S F" } : { [slow]: "S", [fast]: "F" },
    });
    f.add(`Tortoise & hare: slow steps once, fast twice. In a cycle, fast gains one node per step — it MUST lap slow.`, 2, [A()]);
    let guard = 0;
    while (guard++ < 30) {
      slow = nxt(slow);
      fast = nxt(nxt(fast));
      if (slow === fast) {
        f.add(`slow moves to node ${vals[slow]}, fast jumps two — and they're on the SAME node. That's only possible inside a cycle. Return True.`, 7,
          [A({ [slow]: "g" })], true);
        return f;
      }
      f.add(`slow → node ${vals[slow]} (one step), fast → node ${vals[fast]} (two steps). Not equal yet — fast closes the gap by 1 each round.`, 5,
        [A({ [slow]: "p", [fast]: "y" })]);
    }
    f.add(`fast reached the end — no cycle.`, 8, [A()], true);
    return f;
  },
};

// ------------------------------------------ Remove Nth Node From End of List
VIS["remove-nth-node-from-end-of-list"] = {
  inputs: [
    { name: "vals", label: "list values", type: "arr", def: "[1, 2, 3, 4, 5]", max: 8, min: 1 },
    { name: "n", label: "n (from end)", type: "int", def: "2", min: 1, max: 8 },
  ],
  code: `def removeNthFromEnd(head, n):
    dummy = ListNode(0, head)
    lead = head
    lag = dummy
    for _ in range(n):
        lead = lead.next
    while lead:
        lead = lead.next
        lag = lag.next
    lag.next = lag.next.next
    return dummy.next`,
  gen(vals, n) {
    const f = mkFrames();
    if (n > vals.length) n = vals.length;
    const m = vals.length;
    // lead index over vals (m = past end), lag index: -1 = dummy
    let lead = 0, lag = -1;
    const LL = extra => ({
      t: "ll", label: "list (lag starts at a dummy before head)",
      v: vals.map((v, i) => ({ val: v, dir: i === m - 1 ? null : "R" })),
      ptrs: { ...(lead < m ? { [lead]: "lead" } : {}), ...(lag >= 0 ? { [lag]: lead < m && lead === lag ? "lead lag" : "lag" } : {}) },
      hl: extra || {},
    });
    f.add(`Two pointers exactly n apart: when lead falls off the end, lag stands just BEFORE the node to delete — one pass, no length count.`, 3, [LL()]);
    for (let k = 0; k < n; k++) lead++;
    f.add(`Advance lead ${n} step(s) ahead — the gap between lead and lag is now exactly ${n} (lag still at the dummy).`, 5, [LL({ [Math.min(lead, m - 1)]: "p" })]);
    while (lead < m) {
      lead++;
      lag++;
      f.add(`Move both: lead ${lead >= m ? "falls off the end" : `→ node ${vals[lead]}`}, lag → node ${vals[lag]}.`, 8, [LL({ [lag]: "p" })]);
    }
    const removed = vals[lag + 1];
    f.add(`lead is past the end, so lag.next (node ${removed}) is the ${n}th from the end — bypass it: lag.next = lag.next.next.`, 9, [LL({ [lag + 1]: "r" })]);
    const after = vals.filter((_, i) => i !== lag + 1);
    f.add(`Node ${removed} removed. Result: [${after.join(" → ")}]. One pass, O(n).`, 10,
      [{ t: "ll", label: "result", v: after.map((v, i) => ({ val: v, dir: i === after.length - 1 ? null : "R" })), ptrs: {}, hl: Object.fromEntries(after.map((_, i) => [i, "g"])) }], true);
    return f;
  },
};

// ------------------------------------------------------------ Add Two Numbers
VIS["add-two-numbers"] = {
  inputs: [
    { name: "a", label: "l1 digits (reversed)", type: "arr", def: "[2, 4, 3]", max: 8, min: 1 },
    { name: "b", label: "l2 digits (reversed)", type: "arr", def: "[5, 6, 4]", max: 8, min: 1 },
  ],
  code: `def addTwoNumbers(l1, l2):
    dummy = tail = ListNode()
    carry = 0
    while l1 or l2 or carry:
        d1 = l1.val if l1 else 0
        d2 = l2.val if l2 else 0
        carry, digit = divmod(d1 + d2 + carry, 10)
        tail.next = ListNode(digit)
        tail = tail.next
        l1 = l1.next if l1 else None
        l2 = l2.next if l2 else None
    return dummy.next`,
  gen(a, b) {
    const f = mkFrames();
    a = a.map(d => Math.min(9, Math.max(0, d)));
    b = b.map(d => Math.min(9, Math.max(0, d)));
    const out = [];
    let carry = 0, i = 0;
    const A = () => ({ t: "arr", label: "l1 (least significant digit first)", v: a, hl: i < a.length ? { [i]: "p" } : {}, ptrs: i < a.length ? { [i]: "▲" } : {} });
    const B = () => ({ t: "arr", label: "l2", v: b, hl: i < b.length ? { [i]: "p" } : {}, ptrs: i < b.length ? { [i]: "▲" } : {} });
    const O = hl => ({ t: "arr", label: "sum", v: out.length ? out : ["·"], hl });
    const V = () => ({ t: "vars", entries: [["carry", carry]] });
    const num = arr => arr.slice().reverse().join("");
    f.add(`The lists store digits least-significant first — exactly the order grade-school addition wants. Walk both with a carry.`, 3, [A(), B(), O({}), V()]);
    while (i < a.length || i < b.length || carry) {
      const d1 = a[i] ?? 0, d2 = b[i] ?? 0;
      const s = d1 + d2 + carry;
      const digit = s % 10;
      const hadCarry = carry;
      carry = Math.floor(s / 10);
      out.push(digit);
      f.add(`Position ${i}: ${d1} + ${d2}${hadCarry ? ` + carry ${hadCarry}` : ""} = ${s} → write ${digit}${carry ? `, carry ${carry}` : ""}.`, 7,
        [A(), B(), O({ [out.length - 1]: carry ? "y" : "g" }), V()]);
      i++;
    }
    f.add(`${num(a)} + ${num(b)} = ${num(out)} — the sum list reads [${out.join(" → ")}]. O(max(m, n)).`, 12,
      [O(Object.fromEntries(out.map((_, x) => [x, "g"])))], true);
    return f;
  },
};

// -------------------------------------------------- Find the Duplicate Number
VIS["find-the-duplicate-number"] = {
  inputs: [{ name: "nums", label: "nums (n+1 values in [1..n])", type: "arr", def: "[1, 3, 4, 2, 2]", max: 10, min: 2 }],
  code: `def findDuplicate(nums):
    slow = fast = 0
    while True:
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break
    slow2 = 0
    while slow != slow2:
        slow = nums[slow]
        slow2 = nums[slow2]
    return slow`,
  gen(nums) {
    const f = mkFrames();
    const n = nums.length - 1;
    if (nums.some(x => x < 1 || x > n)) {
      f.add(`Input must hold ${nums.length} values in [1..${n}] (pigeonhole guarantees a duplicate). Adjust the input and re-run.`, 1,
        [{ t: "arr", label: "nums", v: nums, hl: Object.fromEntries(nums.map((x, i) => [i, x < 1 || x > n ? "r" : undefined]).filter(([, c]) => c)) }], true);
      return f;
    }
    let slow = 0, fast = 0;
    const A = () => ({ t: "arr", label: "nums (value = next index)", v: nums, hl: {}, ptrs: slow === fast ? { [slow]: "S F" } : { [slow]: "S", [fast]: "F" } });
    f.add(`Read each value as a pointer to an index: i → nums[i]. A duplicate value means two arrows into one node — a cycle. Run Floyd on it.`, 2, [A()]);
    let guard = 0;
    do {
      slow = nums[slow];
      fast = nums[nums[fast]];
      f.add(`slow → index ${slow}, fast → index ${fast}.${slow === fast ? " They meet — we're inside the cycle." : ""}`, slow === fast ? 6 : 5, [A()]);
    } while (slow !== fast && guard++ < 40);
    let slow2 = 0;
    const A2 = () => ({ t: "arr", label: "nums (phase 2)", v: nums, hl: {}, ptrs: slow === slow2 ? { [slow]: "S S2" } : { [slow]: "S", [slow2]: "S2" } });
    f.add(`Phase 2: restart a pointer at index 0. Moving both one step at a time, they meet exactly at the cycle's entrance — the duplicate.`, 8, [A2()]);
    guard = 0;
    while (slow !== slow2 && guard++ < 40) {
      slow = nums[slow];
      slow2 = nums[slow2];
      f.add(`slow → index ${slow}, slow2 → index ${slow2}.`, 10, [A2()]);
    }
    f.add(`They meet at index ${slow} — the duplicate value is ${slow}. O(n) time, O(1) space, array untouched.`, 12,
      [{ t: "arr", label: "nums", v: nums, hl: Object.fromEntries(nums.map((x, i) => [i, x === slow ? "g" : undefined]).filter(([, c]) => c)), ptrs: {} }], true);
    return f;
  },
};

// -------------------------------------------------- Maximum Depth of Binary Tree
VIS["maximum-depth-of-binary-tree"] = {
  inputs: [],
  code: `def maxDepth(root):
    if not root:
        return 0
    depth = 0
    queue = deque([root])
    while queue:
        depth += 1
        for _ in range(len(queue)):
            node = queue.popleft()
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
    return depth`,
  gen() {
    const f = mkFrames();
    const tree = [3, 9, 20, null, null, 15, 7, null, null, null, null, 8, null, null, null];
    let depth = 0;
    let queue = [0];
    const T = hl => ({ t: "tree", label: "tree", v: tree, hl });
    const Q = () => ({ t: "set", label: "queue", v: queue.map(i => tree[i]) });
    const V = () => ({ t: "vars", entries: [["depth", depth]] });
    f.add(`BFS peels the tree one level per iteration — the number of levels IS the maximum depth.`, 5, [T({}), Q(), V()]);
    while (queue.length) {
      depth++;
      const hl = Object.fromEntries(queue.map(i => [i, "p"]));
      f.add(`Level ${depth}: process ${queue.length} node(s) — ${queue.map(i => tree[i]).join(", ")}.`, 7, [T(hl), Q(), V()]);
      const next = [];
      for (const i of queue) {
        const l = 2 * i + 1, r = 2 * i + 2;
        if (l < tree.length && tree[l] !== null) next.push(l);
        if (r < tree.length && tree[r] !== null) next.push(r);
      }
      queue = next;
      if (queue.length) f.add(`Their children form the next level: ${queue.map(i => tree[i]).join(", ")}.`, 12, [T(Object.fromEntries(queue.map(i => [i, "y"]))), Q(), V()]);
    }
    f.add(`Queue empty after ${depth} levels — maximum depth is ${depth}. O(n).`, 13, [T({}), Q(), V()], true);
    return f;
  },
};

// -------------------------------------------- Binary Tree Level Order Traversal
VIS["binary-tree-level-order-traversal"] = {
  inputs: [],
  code: `def levelOrder(root):
    res = []
    if not root:
        return res
    queue = deque([root])
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.val)
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
        res.append(level)
    return res`,
  gen() {
    const f = mkFrames();
    const tree = [1, 2, 3, 4, 5, null, 7, null, null, null, null, null, null, null, null];
    let queue = [0];
    const res = [];
    const T = hl => ({ t: "tree", label: "tree", v: tree, hl });
    const R = hl => ({ t: "kv", label: "res (level → values)", entries: res.map((lv, d) => [`level ${d}`, `[${lv.join(", ")}]`]), hl });
    f.add(`BFS with a twist: snapshot the queue's size before each round, so each round consumes exactly one level.`, 5, [T({}), R()]);
    while (queue.length) {
      const level = queue.map(i => tree[i]);
      const hl = Object.fromEntries(queue.map(i => [i, "p"]));
      const next = [];
      for (const i of queue) {
        const l = 2 * i + 1, r = 2 * i + 2;
        if (l < tree.length && tree[l] !== null) next.push(l);
        if (r < tree.length && tree[r] !== null) next.push(r);
      }
      res.push(level);
      f.add(`Drain the current ${level.length} node(s) into one list: [${level.join(", ")}]. Their children queue up for the next round.`, 15,
        [T(hl), R({ [`level ${res.length - 1}`]: "g" })]);
      queue = next;
    }
    f.add(`Done: ${res.length} levels, one list each. O(n) — every node enters the queue once.`, 16, [T({}), R()], true);
    return f;
  },
};

// ------------------------------------------------- Validate Binary Search Tree
VIS["validate-binary-search-tree"] = {
  inputs: [],
  code: `def isValidBST(root):
    def dfs(node, low, high):
        if not node:
            return True
        if not (low < node.val < high):
            return False
        return (dfs(node.left, low, node.val) and
                dfs(node.right, node.val, high))
    return dfs(root, -inf, inf)`,
  gen() {
    const f = mkFrames();
    const tree = [5, 3, 8, 1, 4, 7, 9, null, null, null, null, null, null, null, null];
    const T = hl => ({ t: "tree", label: "tree", v: tree, hl });
    const fmt = x => (x === -Infinity ? "-∞" : x === Infinity ? "+∞" : x);
    f.add(`Checking only parent vs child isn't enough — every node must respect bounds inherited from ALL its ancestors. DFS carries (low, high).`, 2, [T({})]);
    const ok = { value: true };
    const done = Object.fromEntries(tree.map((v, i) => [i, v !== null ? "g" : undefined]).filter(([, c]) => c));
    const dfs = (i, low, high) => {
      if (i >= tree.length || tree[i] === null || !ok.value) return true;
      const v = tree[i];
      if (!(low < v && v < high)) {
        ok.value = false;
        f.add(`Node ${v} violates its bounds (${fmt(low)}, ${fmt(high)}) — not a BST. Return False.`, 6, [T({ [i]: "r" })], true);
        return false;
      }
      f.add(`Node ${v}: bounds (${fmt(low)}, ${fmt(high)}) hold. Left subtree must stay below ${v}, right subtree above ${v}.`, 5, [T({ [i]: "p" })]);
      return dfs(2 * i + 1, low, v) && dfs(2 * i + 2, v, high);
    };
    if (dfs(0, -Infinity, Infinity)) {
      f.add(`Every node fit inside its inherited bounds — this is a valid BST. Return True. O(n).`, 9, [T(done)], true);
    }
    return f;
  },
};

// -------------------------------------- Lowest Common Ancestor of a BST
VIS["lowest-common-ancestor-of-a-binary-search-tree"] = {
  inputs: [
    { name: "p", label: "p", type: "int", def: "0", min: -9999, max: 9999 },
    { name: "q", label: "q", type: "int", def: "4", min: -9999, max: 9999 },
  ],
  code: `def lowestCommonAncestor(root, p, q):
    node = root
    while node:
        if p.val < node.val and q.val < node.val:
            node = node.left
        elif p.val > node.val and q.val > node.val:
            node = node.right
        else:
            return node
    return None`,
  gen(p, q) {
    const f = mkFrames();
    const tree = [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5, null, null, null, null];
    const present = new Set(tree.filter(v => v !== null));
    const T = hl => ({ t: "tree", label: `BST (p = ${p}, q = ${q})`, v: tree, hl });
    const mark = {};
    tree.forEach((v, i) => { if (v === p || v === q) mark[i] = "y"; });
    if (!present.has(p) || !present.has(q)) {
      f.add(`p and q must be values in this BST: {${[...present].sort((a, b) => a - b).join(", ")}}. Adjust the inputs and re-run.`, 1, [T({})], true);
      return f;
    }
    f.add(`In a BST no searching is needed: from the root, both targets steer the same way until they split — the split point is the LCA.`, 2, [T(mark)]);
    let i = 0;
    while (i < tree.length && tree[i] !== null) {
      const v = tree[i];
      if (p < v && q < v) {
        f.add(`Both ${p} and ${q} are smaller than ${v} — the LCA lies in the left subtree.`, 5, [T({ ...mark, [i]: "p" })]);
        i = 2 * i + 1;
      } else if (p > v && q > v) {
        f.add(`Both ${p} and ${q} are larger than ${v} — the LCA lies in the right subtree.`, 7, [T({ ...mark, [i]: "p" })]);
        i = 2 * i + 2;
      } else {
        f.add(`${p} and ${q} split at ${v} (one ≤, one ≥) — node ${v} is the lowest common ancestor. O(h), no extra space.`, 9, [T({ ...mark, [i]: "g" })], true);
        return f;
      }
    }
    f.add(`Walked off the tree — p and q were not found on one path.`, 10, [T({})], true);
    return f;
  },
};

// ============================ batch 5: backtracking, DP, greedy ============================

// ------------------------------------------------------------------- Subsets
VIS["subsets"] = {
  inputs: [{ name: "nums", label: "nums (distinct)", type: "arr", def: "[1, 2, 3]", max: 4, min: 1 }],
  code: `def subsets(nums):
    res = []
    def dfs(i, cur):
        if i == len(nums):
            res.append(cur[:])
            return
        cur.append(nums[i])   # include nums[i]
        dfs(i + 1, cur)
        cur.pop()             # exclude nums[i]
        dfs(i + 1, cur)
    dfs(0, [])
    return res`,
  gen(nums) {
    const f = mkFrames();
    nums = [...new Set(nums)];
    const res = [];
    const A = i => ({ t: "arr", label: "nums", v: nums, hl: i < nums.length ? { [i]: "p" } : {} });
    const C = cur => ({ t: "set", label: "current subset", v: cur.length ? cur : ["∅"] });
    const R = hl => ({ t: "set", label: "res", v: res.map(s => `[${s.join(",")}]`), hl });
    f.add(`Every element faces the same binary choice: in or out. The decision tree's ${2 ** nums.length} leaves are exactly the power set.`, 3, [A(0), C([]), R()]);
    const dfs = (i, cur) => {
      if (i === nums.length) {
        res.push([...cur]);
        f.add(`No more decisions — record [${cur.join(", ") || "∅"}].`, 5, [A(i), C(cur), R({ [`[${cur.join(",")}]`]: "g" })]);
        return;
      }
      cur.push(nums[i]);
      f.add(`Include ${nums[i]} → current is [${cur.join(", ")}].`, 7, [A(i), C(cur), R()]);
      dfs(i + 1, cur);
      cur.pop();
      f.add(`Backtrack: exclude ${nums[i]} → current is [${cur.join(", ") || "∅"}].`, 9, [A(i), C(cur), R()]);
      dfs(i + 1, cur);
    };
    dfs(0, []);
    f.add(`All ${res.length} subsets generated — O(n · 2ⁿ).`, 12, [A(nums.length), C([]), R()], true);
    return f;
  },
};

// -------------------------------------------------------------- Permutations
VIS["permutations"] = {
  inputs: [{ name: "nums", label: "nums (distinct)", type: "arr", def: "[1, 2, 3]", max: 4, min: 1 }],
  code: `def permute(nums):
    res = []
    def dfs(cur, remaining):
        if not remaining:
            res.append(cur[:])
            return
        for n in remaining:
            dfs(cur + [n],
                [x for x in remaining if x != n])
    dfs([], nums)
    return res`,
  gen(nums) {
    const f = mkFrames();
    nums = [...new Set(nums)];
    const res = [];
    const C = (cur, rem) => [
      { t: "set", label: "chosen so far", v: cur.length ? cur : ["∅"] },
      { t: "set", label: "remaining", v: rem.length ? rem : ["∅"] },
      { t: "set", label: "res", v: res.map(p => `[${p.join(",")}]`) },
    ];
    f.add(`Fill positions left to right: each position tries every element not used yet. n choices, then n−1, then n−2…`, 3, C([], nums));
    const dfs = (cur, rem) => {
      if (!rem.length) {
        res.push([...cur]);
        f.add(`No elements left — [${cur.join(", ")}] is a complete permutation.`, 5, C(cur, rem));
        return;
      }
      for (const n of rem) {
        f.add(`Position ${cur.length + 1}: choose ${n} (from remaining [${rem.join(", ")}]).`, 8, C([...cur, n], rem.filter(x => x !== n)));
        dfs([...cur, n], rem.filter(x => x !== n));
      }
    };
    dfs([], nums);
    f.add(`All ${res.length} permutations generated — O(n · n!).`, 11, C([], []), true);
    return f;
  },
};

// ----------------------------------------------------------- Combination Sum
VIS["combination-sum"] = {
  inputs: [
    { name: "candidates", label: "candidates (distinct)", type: "arr", def: "[2, 3, 5]", max: 4, min: 1 },
    { name: "target", label: "target", type: "int", def: "8", min: 1, max: 12 },
  ],
  code: `def combinationSum(candidates, target):
    res = []
    def dfs(i, cur, remaining):
        if remaining == 0:
            res.append(cur[:])
            return
        if i == len(candidates) or remaining < 0:
            return
        cur.append(candidates[i])   # reuse candidates[i]
        dfs(i, cur, remaining - candidates[i])
        cur.pop()                   # move past candidates[i]
        dfs(i + 1, cur, remaining)
    dfs(0, [], target)
    return res`,
  gen(candidates, target) {
    const f = mkFrames();
    candidates = [...new Set(candidates.map(c => Math.max(1, c)))].sort((a, b) => a - b);
    const res = [];
    const C = (i, cur, rem) => [
      { t: "arr", label: "candidates", v: candidates, hl: i < candidates.length ? { [i]: "p" } : {} },
      { t: "set", label: "current combination", v: cur.length ? cur : ["∅"] },
      { t: "vars", entries: [["remaining", rem]] },
      { t: "set", label: "res", v: res.map(c => `[${c.join("+")}]`) },
    ];
    f.add(`At candidate i, two branches: USE it again (stay at i — reuse allowed) or MOVE past it forever. This never builds the same combination twice.`, 3, C(0, [], target));
    const dfs = (i, cur, rem) => {
      if (rem === 0) {
        res.push([...cur]);
        f.add(`Remaining hit 0 — [${cur.join(" + ")}] = ${target}. Record it!`, 5, C(i, cur, rem));
        return;
      }
      if (i === candidates.length || rem < 0) {
        f.add(rem < 0 ? `Remaining went negative (${rem}) — overshot, prune this branch.` : `Out of candidates with ${rem} still needed — dead end.`, 8, C(Math.min(i, candidates.length - 1), cur, rem));
        return;
      }
      f.add(`Use ${candidates[i]}: [${[...cur, candidates[i]].join(", ")}], remaining ${rem - candidates[i]}.`, 10, C(i, [...cur, candidates[i]], rem - candidates[i]));
      dfs(i, [...cur, candidates[i]], rem - candidates[i]);
      f.add(`Done reusing ${candidates[i]} — move past it${i + 1 < candidates.length ? ` to ${candidates[i + 1]}` : ""}.`, 12, C(i + 1, cur, rem));
      dfs(i + 1, cur, rem);
    };
    dfs(0, [], target);
    f.add(`${res.length} unique combination(s) sum to ${target}: ${res.map(c => `[${c.join("+")}]`).join(" ")}.`, 14, C(candidates.length, [], 0), true);
    return f;
  },
};

// -------------------------------------------------- Min Cost Climbing Stairs
VIS["min-cost-climbing-stairs"] = {
  inputs: [{ name: "cost", label: "cost", type: "arr", def: "[1, 100, 1, 1, 1, 100, 1, 1, 100, 1]", max: 12, min: 2 }],
  code: `def minCostClimbingStairs(cost):
    down_one, down_two = 0, 0
    for i in range(2, len(cost) + 1):
        step_one = down_one + cost[i - 1]
        step_two = down_two + cost[i - 2]
        down_one, down_two = min(step_one, step_two), down_one
    return down_one`,
  gen(cost) {
    const f = mkFrames();
    cost = cost.map(c => Math.max(0, c));
    let one = 0, two = 0;
    const B = hl => ({ t: "bars", label: "step costs", v: cost, hl });
    const V = () => ({ t: "vars", entries: [["down_one (best to i−1)", one], ["down_two (best to i−2)", two]] });
    f.add(`To stand just past step i you climbed from i−1 or i−2. Track the two best costs and roll them forward.`, 2, [B({}), V()]);
    for (let i = 2; i <= cost.length; i++) {
      const s1 = one + cost[i - 1];
      const s2 = two + cost[i - 2];
      const fromOne = s1 <= s2;
      [one, two] = [Math.min(s1, s2), one];
      f.add(`Position ${i}: via step ${i - 1} costs ${s1}, via step ${i - 2} costs ${s2} — take ${Math.min(s1, s2)} (${fromOne ? `pay ${cost[i - 1]} at step ${i - 1}` : `pay ${cost[i - 2]} at step ${i - 2}`}).`, 6,
        [B({ [i - 1]: fromOne ? "g" : "y", [i - 2]: fromOne ? "y" : "g" }), V()]);
    }
    f.add(`Cheapest way past the top: ${one}. O(n) time, two variables of space.`, 7, [B({}), V()], true);
    return f;
  },
};

// -------------------------------------------------- Maximum Product Subarray
VIS["maximum-product-subarray"] = {
  inputs: [{ name: "nums", label: "nums", type: "arr", def: "[2, 3, -2, 4]", max: 10, min: 1 }],
  code: `def maxProduct(nums):
    res = nums[0]
    curMax, curMin = 1, 1
    for n in nums:
        cand = (n, curMax * n, curMin * n)
        curMax = max(cand)
        curMin = min(cand)
        res = max(res, curMax)
    return res`,
  gen(nums) {
    const f = mkFrames();
    let res = nums[0], curMax = 1, curMin = 1;
    const A = hl => ({ t: "arr", label: "nums", v: nums, hl });
    const V = () => ({ t: "vars", entries: [["curMax", curMax], ["curMin", curMin], ["res", res]] });
    f.add(`Why track the MINIMUM too? A big negative product times a negative number becomes a big positive one — the min can flip into the max.`, 2, [A({}), V()]);
    nums.forEach((n, i) => {
      const cand = [n, curMax * n, curMin * n];
      const newMax = Math.max(...cand), newMin = Math.min(...cand);
      const flipped = n < 0;
      curMax = newMax; curMin = newMin;
      const improved = curMax > res;
      res = Math.max(res, curMax);
      f.add(`n = ${n}${flipped ? " (negative — max and min swap roles!)" : ""}: candidates {${cand.join(", ")}} → curMax = ${curMax}, curMin = ${curMin}.${improved ? " New best!" : ""}`, 7,
        [A({ [i]: improved ? "g" : flipped ? "y" : "p" }), V()]);
    });
    f.add(`Maximum product of a contiguous subarray: ${res}. One pass, O(n).`, 9, [A({}), V()], true);
    return f;
  },
};

// ----------------------------------------------------------------- Word Break
VIS["word-break"] = {
  inputs: [
    { name: "s", label: "s", type: "str", def: "neetcode", max: 14 },
    { name: "words", label: "dictionary (comma-separated)", type: "words", def: "neet, code, leet" },
  ],
  code: `def wordBreak(s, wordDict):
    dp = [False] * (len(s) + 1)
    dp[len(s)] = True
    for i in range(len(s) - 1, -1, -1):
        for w in wordDict:
            if s[i:i+len(w)] == w and dp[i + len(w)]:
                dp[i] = True
                break
    return dp[0]`,
  gen(s, words) {
    const f = mkFrames();
    const n = s.length;
    const dp = new Array(n + 1).fill(false);
    dp[n] = true;
    const S = hl => ({ t: "arr", label: "s", v: [...s], hl, ch: true });
    const D = hl => ({ t: "arr", label: "dp[i] = can s[i:] be segmented?", v: dp.map(x => (x ? "T" : "F")), hl });
    const W = () => ({ t: "set", label: "dictionary", v: words });
    f.add(`dp[i] asks: can the suffix s[i:] be segmented? The empty suffix trivially can (dp[${n}] = True). Work backwards.`, 3, [S({}), D({ [n]: "g" }), W()]);
    for (let i = n - 1; i >= 0; i--) {
      let matched = null;
      for (const w of words) {
        if (s.slice(i, i + w.length) === w && dp[i + w.length]) { matched = w; break; }
      }
      if (matched) {
        dp[i] = true;
        const hl = {};
        for (let x = i; x < i + matched.length; x++) hl[x] = "g";
        f.add(`i = ${i}: "${matched}" matches here AND dp[${i + matched.length}] is True — so dp[${i}] = True.`, 7, [S(hl), D({ [i]: "g", [i + matched.length]: "p" }), W()]);
      } else {
        f.add(`i = ${i}: no dictionary word starts here with a breakable rest — dp[${i}] = False.`, 6, [S({ [i]: "r" }), D({ [i]: "r" }), W()]);
      }
    }
    f.add(dp[0] ? `dp[0] is True — "${s}" segments into dictionary words. O(n² · k).` : `dp[0] is False — "${s}" cannot be segmented.`, 9, [S({}), D({ 0: dp[0] ? "g" : "r" }), W()], true);
    return f;
  },
};

// ------------------------------------------- Longest Increasing Subsequence
VIS["longest-increasing-subsequence"] = {
  inputs: [{ name: "nums", label: "nums", type: "arr", def: "[10, 9, 2, 5, 3, 7, 101, 18]", max: 12, min: 1 }],
  code: `def lengthOfLIS(nums):
    tails = []  # tails[k] = smallest tail of an
                # increasing subsequence of length k+1
    for n in nums:
        i = bisect_left(tails, n)
        if i == len(tails):
            tails.append(n)
        else:
            tails[i] = n
    return len(tails)`,
  gen(nums) {
    const f = mkFrames();
    const tails = [];
    const A = hl => ({ t: "arr", label: "nums", v: nums, hl });
    const T = hl => ({ t: "arr", label: "tails (always sorted)", v: tails.length ? tails : ["·"], hl });
    f.add(`tails[k] holds the SMALLEST possible tail of any increasing run of length k+1. Smaller tails leave more room to grow — binary search keeps them minimal.`, 2, [A({}), T({})]);
    nums.forEach((n, idx) => {
      let i = 0;
      while (i < tails.length && tails[i] < n) i++;
      if (i === tails.length) {
        tails.push(n);
        f.add(`${n} is bigger than every tail — it EXTENDS the longest run to length ${tails.length}.`, 7, [A({ [idx]: "g" }), T({ [i]: "g" })]);
      } else {
        const old = tails[i];
        tails[i] = n;
        f.add(`${n} can't extend, but it beats ${old} as the tail of a length-${i + 1} run — replace it (keeps future options open).`, 9, [A({ [idx]: "y" }), T({ [i]: "y" })]);
      }
    });
    f.add(`tails reached length ${tails.length} — that's the LIS length. O(n log n) with binary search.`, 10, [A({}), T(Object.fromEntries(tails.map((_, i) => [i, "g"])))], true);
    return f;
  },
};

// ---------------------------------------------------------------- Unique Paths
VIS["unique-paths"] = {
  inputs: [
    { name: "m", label: "rows (m)", type: "int", def: "3", min: 1, max: 5 },
    { name: "n", label: "cols (n)", type: "int", def: "4", min: 1, max: 6 },
  ],
  code: `def uniquePaths(m, n):
    grid = [[1] * n for _ in range(m)]
    for r in range(1, m):
        for c in range(1, n):
            grid[r][c] = (grid[r - 1][c]
                        + grid[r][c - 1])
    return grid[m - 1][n - 1]`,
  gen(m, n) {
    const f = mkFrames();
    const grid = Array.from({ length: m }, () => new Array(n).fill(1));
    const G = hl => ({ t: "grid", label: "paths to reach each cell", v: grid, hl });
    f.add(`Any cell in the first row or column has exactly 1 path (straight line). Every other cell = paths from above + paths from the left.`, 2,
      [G(Object.fromEntries([...Array(n).keys()].map(c => ["0," + c, "p"]).concat([...Array(m).keys()].map(r => [r + ",0", "p"]))))]);
    for (let r = 1; r < m; r++) {
      for (let c = 1; c < n; c++) {
        grid[r][c] = grid[r - 1][c] + grid[r][c - 1];
        f.add(`Cell (${r}, ${c}): ${grid[r - 1][c]} from above + ${grid[r][c - 1]} from the left = ${grid[r][c]}.`, 5,
          [G({ [r + "," + c]: "g", [(r - 1) + "," + c]: "p", [r + "," + (c - 1)]: "p" })]);
      }
    }
    f.add(`The robot has ${grid[m - 1][n - 1]} distinct paths to the corner. O(m·n) — and one row of dp suffices.`, 7,
      [G({ [(m - 1) + "," + (n - 1)]: "g" })], true);
    return f;
  },
};

// ------------------------------------------------------------------- Jump Game
VIS["jump-game"] = {
  inputs: [{ name: "nums", label: "nums (max jump lengths)", type: "arr", def: "[2, 3, 1, 1, 4]", max: 12, min: 1 }],
  code: `def canJump(nums):
    reach = 0
    for i, n in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + n)
        if reach >= len(nums) - 1:
            return True
    return True`,
  gen(nums) {
    const f = mkFrames();
    nums = nums.map(x => Math.max(0, x));
    let reach = 0;
    const last = nums.length - 1;
    const A = (i, extra) => {
      const hl = {};
      for (let x = 0; x <= Math.min(reach, last); x++) hl[x] = "w";
      Object.assign(hl, extra || {});
      return { t: "arr", label: "nums (outlined = reachable so far)", v: nums, hl, ptrs: { [i]: "i", ...(reach <= last && reach !== i ? { [reach]: "reach" } : {}) } };
    };
    const V = () => ({ t: "vars", entries: [["reach", reach]] });
    f.add(`Greedy: scan left to right maintaining the furthest index reachable. If the scan ever passes it, you're stuck.`, 2, [A(0), V()]);
    for (let i = 0; i < nums.length; i++) {
      if (i > reach) {
        f.add(`Index ${i} is beyond reach (${reach}) — this position can never be visited. Return False.`, 5, [A(i, { [i]: "r" }), V()], true);
        return f;
      }
      const newReach = Math.max(reach, i + nums[i]);
      const improved = newReach > reach;
      reach = newReach;
      if (reach >= last) {
        f.add(`From index ${i}, jumping ${nums[i]} reaches index ${i + nums[i]} — the last index is reachable! Return True.`, 8, [A(i, { [i]: "g", [last]: "g" }), V()], true);
        return f;
      }
      f.add(`Index ${i} (jump ≤ ${nums[i]}): reach ${improved ? `extends to ${reach}` : `stays ${reach}`}.`, 6, [A(i, { [i]: improved ? "p" : "y" }), V()]);
    }
    f.add(`Scan finished — last index reachable. Return True.`, 9, [A(last), V()], true);
    return f;
  },
};

// ----------------------------------------------------------------- Gas Station
VIS["gas-station"] = {
  inputs: [
    { name: "gas", label: "gas", type: "arr", def: "[1, 2, 3, 4, 5]", max: 10, min: 1 },
    { name: "cost", label: "cost", type: "arr", def: "[3, 4, 5, 1, 2]", max: 10, min: 1 },
  ],
  code: `def canCompleteCircuit(gas, cost):
    if sum(gas) < sum(cost):
        return -1
    tank = 0
    start = 0
    for i in range(len(gas)):
        tank += gas[i] - cost[i]
        if tank < 0:
            tank = 0
            start = i + 1
    return start`,
  gen(gas, cost) {
    const f = mkFrames();
    if (gas.length !== cost.length) {
      f.add(`gas and cost must have the same length — got ${gas.length} vs ${cost.length}.`, 1, [{ t: "vars", entries: [["error", "length mismatch"]] }], true);
      return f;
    }
    const net = gas.map((g, i) => g - cost[i]);
    const totalGas = gas.reduce((a, b) => a + b, 0), totalCost = cost.reduce((a, b) => a + b, 0);
    const N = (hl, ptrs) => ({ t: "arr", label: "net gain per station (gas − cost)", v: net, hl, ptrs });
    let tank = 0, start = 0;
    const V = () => ({ t: "vars", entries: [["tank", tank], ["start", start]] });
    if (totalGas < totalCost) {
      f.add(`Total gas ${totalGas} < total cost ${totalCost} — no starting station can work. Return -1.`, 2, [N({}, {}), V()], true);
      return f;
    }
    f.add(`Total gas ${totalGas} ≥ total cost ${totalCost}, so SOME start works. Key insight: if the tank dies at i, no station up to i can be the start — skip them all.`, 2, [N({}, { [start]: "start" }), V()]);
    for (let i = 0; i < net.length; i++) {
      tank += net[i];
      if (tank < 0) {
        f.add(`At station ${i}: tank drops to ${tank} — every start from ${start} to ${i} is doomed. Restart the candidate at ${i + 1}.`, 9, [N({ [i]: "r" }, { [start]: "start", [i]: "i" }), (tank = 0, start = i + 1, V())]);
      } else {
        f.add(`Station ${i}: net ${net[i] >= 0 ? "+" : ""}${net[i]} → tank = ${tank}.`, 7, [N({ [i]: net[i] >= 0 ? "g" : "y" }, { [start]: "start", [i]: "i" }), V()]);
      }
    }
    f.add(`Start at station ${start} — the only candidate left, and the total-sum check guarantees it completes the lap. O(n).`, 10, [N({ [start]: "g" }, { [start]: "start" }), V()], true);
    return f;
  },
};

// ------------------------------------------------------------ Partition Labels
VIS["partition-labels"] = {
  inputs: [{ name: "s", label: "s", type: "str", def: "ababcbacadefegde", max: 20 }],
  code: `def partitionLabels(s):
    last = {c: i for i, c in enumerate(s)}
    res = []
    start = end = 0
    for i, c in enumerate(s):
        end = max(end, last[c])
        if i == end:
            res.append(i - start + 1)
            start = i + 1
    return res`,
  gen(s) {
    const f = mkFrames();
    const last = {};
    [...s].forEach((c, i) => (last[c] = i));
    const res = [];
    let start = 0, end = 0;
    const S = (i, extra) => {
      const hl = {};
      for (let x = start; x <= Math.max(i, end) && x < s.length; x++) hl[x] = "w";
      Object.assign(hl, extra || {});
      return { t: "arr", label: "s (current partition outlined)", v: [...s], hl, ptrs: { ...(i < s.length ? { [i]: "i" } : {}), ...(end < s.length && end !== i ? { [end]: "end" } : {}) }, ch: true };
    };
    const L = hl => ({ t: "kv", label: "last index of each letter", entries: kvEntries(last), hl });
    const R = () => ({ t: "set", label: "partition sizes", v: res });
    f.add(`A partition can only close once every letter inside it has made its LAST appearance — so track each letter's last index.`, 2, [S(0), L(), R()]);
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      const extended = last[c] > end;
      end = Math.max(end, last[c]);
      if (i === end) {
        res.push(i - start + 1);
        const hl = {};
        for (let x = start; x <= i; x++) hl[x] = "g";
        f.add(`i = ${i}: we've reached the furthest last-index — cut here! Partition "${s.slice(start, i + 1)}" (size ${i - start + 1}).`, 8, [S(i, hl), L(), R()]);
        start = i + 1;
      } else if (extended) {
        f.add(`'${c}' last appears at ${last[c]} — the partition must stretch at least that far.`, 6, [S(i, { [i]: "p", [last[c]]: "y" }), L({ [c]: "y" }), R()]);
      }
    }
    f.add(`Partition sizes: [${res.join(", ")}] — as many parts as possible with no letter split across parts. O(n).`, 10, [S(s.length), L(), R()], true);
    return f;
  },
};

// ============================ batch 6: intervals, bits, math, heap, graphs ============================

const parseIntervals = raw => raw; // intervals problems use fixed showcase inputs

// -------------------------------------------------------------- Merge Intervals
VIS["merge-intervals"] = {
  inputs: [],
  code: `def merge(intervals):
    intervals.sort(key=lambda x: x[0])
    res = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= res[-1][1]:
            res[-1][1] = max(res[-1][1], end)
        else:
            res.append([start, end])
    return res`,
  gen() {
    const f = mkFrames();
    const intervals = [[1, 3], [2, 6], [8, 10], [15, 18]].sort((a, b) => a[0] - b[0]);
    const res = [[...intervals[0]]];
    const IV = (hlIn, hlOut) => [
      { t: "iv", label: "intervals (sorted by start)", v: intervals.map(([s, e], i) => ({ s, e, cls: hlIn?.[i] })) },
      { t: "iv", label: "merged", v: res.map(([s, e], i) => ({ s, e, cls: hlOut?.[i] ?? "g" })) },
    ];
    f.add(`Sort by start. Then each interval either overlaps the last merged one (extend it) or starts a new block.`, 3, IV({ 0: "p" }, {}));
    for (let i = 1; i < intervals.length; i++) {
      const [start, end] = intervals[i];
      const lastEnd = res[res.length - 1][1];
      if (start <= lastEnd) {
        res[res.length - 1][1] = Math.max(lastEnd, end);
        f.add(`[${start}, ${end}] starts at ${start} ≤ ${lastEnd} (last merged end) — overlap! Extend the block to end ${res[res.length - 1][1]}.`, 6,
          IV({ [i]: "g" }, { [res.length - 1]: "y" }));
      } else {
        res.push([start, end]);
        f.add(`[${start}, ${end}] starts after ${lastEnd} — a gap. Start a new merged block.`, 8, IV({ [i]: "p" }, { [res.length - 1]: "p" }));
      }
    }
    f.add(`Merged: ${res.map(([s, e]) => `[${s},${e}]`).join(" ")}. O(n log n) for the sort, one linear pass after.`, 9, IV({}, {}), true);
    return f;
  },
};

// -------------------------------------------------------------- Insert Interval
VIS["insert-interval"] = {
  inputs: [],
  code: `def insert(intervals, newInterval):
    res = []
    i, n = 0, len(intervals)
    while i < n and intervals[i][1] < newInterval[0]:
        res.append(intervals[i])
        i += 1
    while i < n and intervals[i][0] <= newInterval[1]:
        newInterval[0] = min(newInterval[0], intervals[i][0])
        newInterval[1] = max(newInterval[1], intervals[i][1])
        i += 1
    res.append(newInterval)
    while i < n:
        res.append(intervals[i])
        i += 1
    return res`,
  gen() {
    const f = mkFrames();
    const intervals = [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]];
    let newIv = [4, 8];
    const res = [];
    const IV = (hlIn, showNew) => [
      { t: "iv", label: "intervals", v: intervals.map(([s, e], i) => ({ s, e, cls: hlIn?.[i] })) },
      { t: "iv", label: "new interval", v: [{ s: newIv[0], e: newIv[1], cls: showNew ?? "y" }] },
      { t: "iv", label: "result", v: res.length ? res.map(([s, e]) => ({ s, e, cls: "g" })) : [{ s: 0, e: 0, cls: "d", label: "—" }] },
    ];
    f.add(`Three phases: copy intervals ending before the new one, absorb everything overlapping it, then copy the rest.`, 2, IV({}, "y"));
    let i = 0;
    const n = intervals.length;
    while (i < n && intervals[i][1] < newIv[0]) {
      res.push(intervals[i]);
      f.add(`[${intervals[i]}] ends at ${intervals[i][1]} < ${newIv[0]} — entirely before the new interval. Copy it through.`, 6, IV({ [i]: "p" }));
      i++;
    }
    while (i < n && intervals[i][0] <= newIv[1]) {
      newIv = [Math.min(newIv[0], intervals[i][0]), Math.max(newIv[1], intervals[i][1])];
      f.add(`[${intervals[i]}] overlaps — absorb it: the new interval grows to [${newIv[0]}, ${newIv[1]}].`, 10, IV({ [i]: "y" }));
      i++;
    }
    res.push(newIv);
    f.add(`No more overlaps — emit the merged interval [${newIv[0]}, ${newIv[1]}].`, 12, IV({}, "g"));
    while (i < n) {
      res.push(intervals[i]);
      f.add(`[${intervals[i]}] starts after ${newIv[1]} — copy the tail through unchanged.`, 14, IV({ [i]: "p" }, "g"));
      i++;
    }
    f.add(`Result: ${res.map(([s, e]) => `[${s},${e}]`).join(" ")} — sorted and non-overlapping again, in one O(n) pass.`, 15, IV({}, "g"), true);
    return f;
  },
};

// ---------------------------------------------------- Non-overlapping Intervals
VIS["non-overlapping-intervals"] = {
  inputs: [],
  code: `def eraseOverlapIntervals(intervals):
    intervals.sort(key=lambda x: x[1])
    removed = 0
    prev_end = float("-inf")
    for start, end in intervals:
        if start >= prev_end:
            prev_end = end
        else:
            removed += 1
    return removed`,
  gen() {
    const f = mkFrames();
    const intervals = [[1, 2], [1, 3], [2, 3], [3, 4]].sort((a, b) => a[1] - b[1]);
    let removed = 0, prevEnd = -Infinity;
    const state = intervals.map(() => undefined);
    const IV = extra => [
      { t: "iv", label: "intervals (sorted by END)", v: intervals.map(([s, e], i) => ({ s, e, cls: extra?.[i] ?? state[i] })) },
      { t: "vars", entries: [["kept end", prevEnd === -Infinity ? "—" : prevEnd], ["removed", removed]] },
    ];
    f.add(`Greedy classic: sort by END time. Always keeping the interval that ends earliest leaves maximal room for the rest.`, 2, IV());
    intervals.forEach(([start, end], i) => {
      if (start >= prevEnd) {
        prevEnd = end;
        state[i] = "g";
        f.add(`[${start}, ${end}] starts at ${start} ≥ last kept end — keep it. New boundary: ${end}.`, 7, IV({ [i]: "g" }));
      } else {
        removed++;
        state[i] = "r";
        f.add(`[${start}, ${end}] starts before ${prevEnd} — it collides with a kept interval. Remove it (+1).`, 9, IV({ [i]: "r" }));
      }
    });
    f.add(`Minimum removals: ${removed}. Sorting by end is what makes the greedy choice safe. O(n log n).`, 10, IV(), true);
    return f;
  },
};

// -------------------------------------------------------------- Meeting Rooms
VIS["meeting-rooms"] = {
  inputs: [],
  code: `def canAttendMeetings(intervals):
    intervals.sort(key=lambda x: x[0])
    for i in range(1, len(intervals)):
        if intervals[i][0] < intervals[i - 1][1]:
            return False
    return True`,
  gen() {
    const f = mkFrames();
    const intervals = [[0, 30], [5, 10], [15, 20]].sort((a, b) => a[0] - b[0]);
    const IV = hl => [{ t: "iv", label: "meetings (sorted by start)", v: intervals.map(([s, e], i) => ({ s, e, cls: hl?.[i] })) }];
    f.add(`Sort by start time — then a conflict can only be between NEIGHBORS: does any meeting start before the previous one ends?`, 2, IV({}));
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i][0] < intervals[i - 1][1]) {
        f.add(`[${intervals[i]}] starts at ${intervals[i][0]}, but [${intervals[i - 1]}] runs until ${intervals[i - 1][1]} — they overlap. One person can't attend both. Return False.`, 5,
          IV({ [i]: "r", [i - 1]: "r" }), true);
        return f;
      }
      f.add(`[${intervals[i]}] starts at ${intervals[i][0]} ≥ previous end ${intervals[i - 1][1]} — no conflict so far.`, 4, IV({ [i]: "g", [i - 1]: "p" }));
    }
    f.add(`No neighbor pair overlaps — all meetings attendable. Return True. O(n log n).`, 6, IV({}), true);
    return f;
  },
};

// ------------------------------------------------------------ Meeting Rooms II
VIS["meeting-rooms-ii"] = {
  inputs: [],
  code: `def minMeetingRooms(intervals):
    starts = sorted(i[0] for i in intervals)
    ends = sorted(i[1] for i in intervals)
    rooms = best = 0
    s = e = 0
    while s < len(starts):
        if starts[s] < ends[e]:
            rooms += 1
            s += 1
        else:
            rooms -= 1
            e += 1
        best = max(best, rooms)
    return best`,
  gen() {
    const f = mkFrames();
    const intervals = [[0, 30], [5, 10], [15, 20]];
    const starts = intervals.map(x => x[0]).sort((a, b) => a - b);
    const ends = intervals.map(x => x[1]).sort((a, b) => a - b);
    let rooms = 0, best = 0, s = 0, e = 0;
    const C = () => [
      { t: "iv", label: "meetings", v: intervals.map(([a, b]) => ({ s: a, e: b })) },
      { t: "arr", label: "starts (sorted)", v: starts, hl: s < starts.length ? { [s]: "p" } : {}, ptrs: s < starts.length ? { [s]: "s" } : {} },
      { t: "arr", label: "ends (sorted)", v: ends, hl: e < ends.length ? { [e]: "y" } : {}, ptrs: e < ends.length ? { [e]: "e" } : {} },
      { t: "vars", entries: [["rooms in use", rooms], ["best", best]] },
    ];
    f.add(`Forget which meeting is which — only the EVENTS matter. Sweep sorted starts and ends: a start takes a room, an end frees one.`, 2, C());
    while (s < starts.length) {
      if (starts[s] < ends[e]) {
        rooms++;
        best = Math.max(best, rooms);
        f.add(`Next event: a meeting STARTS at ${starts[s]} (before any end at ${ends[e]}) — rooms in use: ${rooms}.${rooms === best ? "" : ""}`, 8, C());
        s++;
      } else {
        rooms--;
        f.add(`Next event: a meeting ENDS at ${ends[e]} — a room frees up. Rooms in use: ${rooms}.`, 11, C());
        e++;
      }
    }
    f.add(`Peak concurrency was ${best} — that's the minimum number of rooms. O(n log n).`, 14, C(), true);
    return f;
  },
};

// -------------------------------------------------------------- Single Number
VIS["single-number"] = {
  inputs: [{ name: "nums", label: "nums (all twice, one single)", type: "arr", def: "[4, 1, 2, 1, 2]", max: 11, min: 1 }],
  code: `def singleNumber(nums):
    res = 0
    for n in nums:
        res ^= n
    return res`,
  gen(nums) {
    const f = mkFrames();
    let res = 0;
    const bits = x => (x >>> 0).toString(2).padStart(4, "0");
    const A = hl => ({ t: "arr", label: "nums", v: nums, hl });
    const V = () => ({ t: "vars", entries: [["res", res], ["res (binary)", bits(res)]] });
    f.add(`XOR's magic: n ^ n = 0 and n ^ 0 = n, and order doesn't matter. XOR everything — pairs annihilate, the single survives.`, 2, [A({}), V()]);
    nums.forEach((n, i) => {
      const before = res;
      res ^= n;
      f.add(`res = ${before} ^ ${n} → ${res}   (${bits(before)} ^ ${bits(n)} = ${bits(res)})`, 4, [A({ [i]: "p" }), V()]);
    });
    f.add(`Every pair cancelled itself out — the survivor is ${res}. O(n) time, O(1) space, no hash set needed.`, 5, [A(Object.fromEntries(nums.map((x, i) => [i, x === res ? "g" : "d"]))), V()], true);
    return f;
  },
};

// -------------------------------------------------------------- Counting Bits
VIS["counting-bits"] = {
  inputs: [{ name: "n", label: "n", type: "int", def: "8", min: 1, max: 16 }],
  code: `def countBits(n):
    dp = [0] * (n + 1)
    for i in range(1, n + 1):
        dp[i] = dp[i >> 1] + (i & 1)
    return dp`,
  gen(n) {
    const f = mkFrames();
    const dp = new Array(n + 1).fill(0);
    const D = hl => ({ t: "arr", label: "dp[i] = number of 1 bits in i", v: dp, hl });
    f.add(`Shifting i right one bit removes only its lowest bit — so bits(i) = bits(i >> 1) plus that dropped bit (i & 1). Every answer reuses an earlier one.`, 2, [D({ 0: "g" })]);
    for (let i = 1; i <= n; i++) {
      dp[i] = dp[i >> 1] + (i & 1);
      f.add(`${i} (${i.toString(2)}): dp[${i >> 1}] = ${dp[i >> 1]} plus low bit ${i & 1} → ${dp[i]}.`, 4, [D({ [i]: "g", [i >> 1]: "p" })]);
    }
    f.add(`All ${n + 1} answers in O(n) total — no per-number bit counting.`, 5, [D({})], true);
    return f;
  },
};

// -------------------------------------------------------------- Missing Number
VIS["missing-number"] = {
  inputs: [{ name: "nums", label: "nums (distinct, from 0..n)", type: "arr", def: "[3, 0, 1]", max: 10, min: 1 }],
  code: `def missingNumber(nums):
    res = len(nums)
    for i, n in enumerate(nums):
        res ^= i ^ n
    return res`,
  gen(nums) {
    const f = mkFrames();
    let res = nums.length;
    const A = hl => ({ t: "arr", label: "nums", v: nums, hl });
    const V = () => ({ t: "vars", entries: [["res", res]] });
    f.add(`XOR all indices 0..n against all values. Every number present appears twice (once as index, once as value) and cancels — only the missing one survives. Start res = n = ${nums.length}.`, 2, [A({}), V()]);
    nums.forEach((n, i) => {
      const before = res;
      res ^= i ^ n;
      f.add(`res = ${before} ^ index ${i} ^ value ${n} → ${res}.`, 4, [A({ [i]: "p" }), V()]);
    });
    f.add(`Everything paired off except ${res} — the missing number. O(n), O(1), no sum overflow concerns.`, 5, [A({}), V()], true);
    return f;
  },
};

// ------------------------------------------------------------- Reverse Integer
VIS["reverse-integer"] = {
  inputs: [{ name: "x", label: "x", type: "int", def: "123", min: -9999, max: 9999 }],
  code: `def reverse(x):
    res = 0
    sign = -1 if x < 0 else 1
    x = abs(x)
    while x:
        digit = x % 10
        x //= 10
        if res > (2**31 - 1 - digit) // 10:
            return 0
        res = res * 10 + digit
    return sign * res`,
  gen(x0) {
    const f = mkFrames();
    const sign = x0 < 0 ? -1 : 1;
    let x = Math.abs(x0), res = 0;
    const S = () => [
      { t: "vars", entries: [["x (remaining)", x], ["res (built)", res], ["sign", sign]] },
    ];
    f.add(`Pop the last digit with mod 10, push it onto the result with ×10 — checking for 32-bit overflow BEFORE each push.`, 2, S());
    while (x) {
      const digit = x % 10;
      x = Math.floor(x / 10);
      res = res * 10 + digit;
      f.add(`Pop ${digit}: remaining x = ${x}, res = res × 10 + ${digit} = ${res}. (Overflow check passes.)`, 10, S());
    }
    f.add(`Reversed: ${sign * res}. Each digit handled once → O(log₁₀ x).`, 11, S(), true);
    return f;
  },
};

// ---------------------------------------------------------------- Happy Number
VIS["happy-number"] = {
  inputs: [{ name: "n", label: "n", type: "int", def: "19", min: 1, max: 9999 }],
  code: `def isHappy(n):
    seen = set()
    while n != 1 and n not in seen:
        seen.add(n)
        n = sum(int(d) ** 2 for d in str(n))
    return n == 1`,
  gen(n) {
    const f = mkFrames();
    const seen = [];
    const S = hl => ({ t: "set", label: "seen", v: seen, hl });
    const V = () => ({ t: "vars", entries: [["n", n]] });
    f.add(`Repeatedly replace n by the sum of its squared digits. This either reaches 1 (happy) or falls into a repeating loop — a set detects the loop.`, 3, [S(), V()]);
    let guard = 0;
    while (n !== 1 && !seen.includes(n) && guard++ < 25) {
      seen.push(n);
      const digits = String(n).split("").map(Number);
      const next = digits.reduce((a, d) => a + d * d, 0);
      f.add(`${n} → ${digits.map(d => `${d}²`).join(" + ")} = ${next}.`, 5, [S({ [n]: "p" }), (n = next, V())]);
    }
    if (n === 1) {
      f.add(`Reached 1 — a happy number! Return True.`, 6, [S(), V()], true);
    } else {
      f.add(`${n} was seen before — the sequence is looping and will never reach 1. Return False.`, 6, [S({ [n]: "r" }), V()], true);
    }
    return f;
  },
};

// -------------------------------------------------------------------- Plus One
VIS["plus-one"] = {
  inputs: [{ name: "digits", label: "digits", type: "arr", def: "[9, 9, 9]", max: 10, min: 1 }],
  code: `def plusOne(digits):
    for i in range(len(digits) - 1, -1, -1):
        if digits[i] < 9:
            digits[i] += 1
            return digits
        digits[i] = 0
    return [1] + digits`,
  gen(digits) {
    const f = mkFrames();
    digits = digits.map(d => Math.min(9, Math.max(0, d)));
    const work = [...digits];
    const A = hl => ({ t: "arr", label: "digits", v: work, hl });
    f.add(`Add from the rightmost digit. A 9 becomes 0 and carries; anything else just increments and we're done.`, 2, [A({})]);
    for (let i = work.length - 1; i >= 0; i--) {
      if (work[i] < 9) {
        work[i] += 1;
        f.add(`digits[${i}] = ${work[i] - 1} < 9 — increment to ${work[i]}, no carry. Done: [${work.join(", ")}].`, 4, [A({ [i]: "g" })], true);
        return f;
      }
      work[i] = 0;
      f.add(`digits[${i}] is 9 — it wraps to 0 and the carry moves left.`, 6, [A({ [i]: "y" })]);
    }
    work.unshift(1);
    f.add(`The carry survived past the front — prepend a 1: [${work.join(", ")}].`, 7, [A({ 0: "g" })], true);
    return f;
  },
};

// ---------------------------------------------------------- Last Stone Weight
VIS["last-stone-weight"] = {
  inputs: [{ name: "stones", label: "stones", type: "arr", def: "[2, 7, 4, 1, 8, 1]", max: 10, min: 1 }],
  code: `def lastStoneWeight(stones):
    heap = [-s for s in stones]  # max-heap via negation
    heapify(heap)
    while len(heap) > 1:
        a = -heappop(heap)
        b = -heappop(heap)
        if a > b:
            heappush(heap, a - b and -(a - b))
    return -heap[0] if heap else 0`,
  gen(stones) {
    const f = mkFrames();
    let heap = stones.map(s => Math.max(1, s)).sort((a, b) => b - a);
    const H = hl => ({ t: "set", label: "max-heap (largest first)", v: heap, hl });
    f.add(`A max-heap hands us the two heaviest stones in O(log n) each round — no re-sorting.`, 3, [H()]);
    while (heap.length > 1) {
      const [a, b] = heap;
      heap = heap.slice(2);
      if (a > b) {
        heap.push(a - b);
        heap.sort((x, y) => y - x);
        f.add(`Smash ${a} vs ${b}: unequal — a stone of ${a} − ${b} = ${a - b} remains and goes back in the heap.`, 8, [H({ [a - b]: "y" })]);
      } else {
        f.add(`Smash ${a} vs ${b}: equal — both stones shatter completely.`, 7, [H()]);
      }
    }
    f.add(heap.length ? `One stone left: ${heap[0]}.` : `Nothing left — return 0.`, 9, [H(heap.length ? { [heap[0]]: "g" } : {})], true);
    return f;
  },
};

// ---------------------------------------------------------- Max Area of Island
VIS["max-area-of-island"] = {
  inputs: [],
  code: `def maxAreaOfIsland(grid):
    rows, cols = len(grid), len(grid[0])
    best = 0
    def dfs(r, c):
        if (r < 0 or r >= rows or c < 0 or c >= cols
                or grid[r][c] == 0):
            return 0
        grid[r][c] = 0  # sink it
        return (1 + dfs(r + 1, c) + dfs(r - 1, c)
                  + dfs(r, c + 1) + dfs(r, c - 1))
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == 1:
                best = max(best, dfs(r, c))
    return best`,
  gen() {
    const f = mkFrames();
    const grid = [
      [0, 1, 0, 0],
      [1, 1, 0, 1],
      [0, 1, 0, 1],
      [0, 0, 0, 1],
    ];
    const rows = grid.length, cols = grid[0].length;
    const visited = new Set();
    let best = 0;
    const G = extra => {
      const hl = {};
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          hl[r + "," + c] = grid[r][c] === 0 ? "d" : (visited.has(r + "," + c) ? "g" : "w");
      Object.assign(hl, extra || {});
      return { t: "grid", label: "grid", v: grid, hl };
    };
    const V = area => ({ t: "vars", entries: [["current area", area ?? "—"], ["best", best]] });
    f.add(`Same flood fill as Number of Islands — but each fill RETURNS its cell count, and we keep the max.`, 3, [G(), V()]);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === 1 && !visited.has(r + "," + c)) {
          let area = 0;
          const stack = [[r, c]];
          visited.add(r + "," + c);
          f.add(`New island at (${r}, ${c}) — flood-fill it and count cells.`, 13, [G({ [r + "," + c]: "p" }), V(1)]);
          while (stack.length) {
            const [i, j] = stack.pop();
            area++;
            for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const ni = i + di, nj = j + dj;
              if (ni >= 0 && ni < rows && nj >= 0 && nj < cols && grid[ni][nj] === 1 && !visited.has(ni + "," + nj)) {
                visited.add(ni + "," + nj);
                stack.push([ni, nj]);
              }
            }
          }
          const improved = area > best;
          best = Math.max(best, area);
          f.add(`Island fully explored: area ${area}.${improved ? " New best!" : ""}`, 14, [G(), V(area)]);
        }
      }
    }
    f.add(`Largest island covers ${best} cells. O(m·n) — each cell visited once.`, 15, [G(), V()], true);
    return f;
  },
};

// ----------------------------------------------------------------- Rotate Image
VIS["rotate-image"] = {
  inputs: [],
  code: `def rotate(matrix):
    n = len(matrix)
    # 1) transpose in place
    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = \\
                matrix[j][i], matrix[i][j]
    # 2) reverse every row
    for row in matrix:
        row.reverse()`,
  gen() {
    const f = mkFrames();
    const m = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
    const n = m.length;
    const G = hl => ({ t: "grid", label: "matrix", v: m, hl });
    f.add(`90° clockwise = transpose (flip over the diagonal), then mirror each row. Both steps are in place.`, 3, [G({})]);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        [m[i][j], m[j][i]] = [m[j][i], m[i][j]];
        f.add(`Transpose: swap (${i},${j}) ⇄ (${j},${i}) — ${m[j][i]} and ${m[i][j]} trade places across the diagonal.`, 6, [G({ [i + "," + j]: "p", [j + "," + i]: "p" })]);
      }
    }
    f.add(`Transpose done — rows are now the old columns. Next: reverse each row.`, 9, [G({})]);
    for (let i = 0; i < n; i++) {
      m[i].reverse();
      f.add(`Reverse row ${i} → [${m[i].join(", ")}].`, 10, [G(Object.fromEntries(m[i].map((_, j) => [i + "," + j, "y"])))]);
    }
    f.add(`Rotated 90° clockwise, in place, O(n²) time and O(1) extra space.`, 10, [G(Object.fromEntries([].concat(...m.map((row, i) => row.map((_, j) => [i + "," + j, "g"])))))], true);
    return f;
  },
};

// ---------------------------------------------------------------- Spiral Matrix
VIS["spiral-matrix"] = {
  inputs: [],
  code: `def spiralOrder(matrix):
    res = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1
    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            res.append(matrix[top][c])
        top += 1
        for r in range(top, bottom + 1):
            res.append(matrix[r][right])
        right -= 1
        if top <= bottom:
            for c in range(right, left - 1, -1):
                res.append(matrix[bottom][c])
            bottom -= 1
        if left <= right:
            for r in range(bottom, top - 1, -1):
                res.append(matrix[r][left])
            left += 1
    return res`,
  gen() {
    const f = mkFrames();
    const m = [[1, 2, 3, 4], [5, 6, 7, 8], [9, 10, 11, 12]];
    let top = 0, bottom = m.length - 1, left = 0, right = m[0].length - 1;
    const res = [];
    const taken = new Set();
    const G = fresh => {
      const hl = {};
      taken.forEach(k => (hl[k] = "d"));
      (fresh || []).forEach(k => (hl[k] = "g"));
      return { t: "grid", label: "matrix (dim = consumed)", v: m, hl };
    };
    const R = () => ({ t: "arr", label: "res", v: res.length ? res : ["·"], hl: {} });
    f.add(`Four boundaries — top, bottom, left, right — peel the matrix like an onion: sweep a side, then shrink that boundary inward.`, 5, [G(), R()]);
    while (top <= bottom && left <= right) {
      let fresh = [];
      for (let c = left; c <= right; c++) { res.push(m[top][c]); taken.add(top + "," + c); fresh.push(top + "," + c); }
      f.add(`Sweep the top row (row ${top}) left→right, then move top down.`, 7, [G(fresh), R()]);
      top++;
      fresh = [];
      for (let r = top; r <= bottom; r++) { res.push(m[r][right]); taken.add(r + "," + right); fresh.push(r + "," + right); }
      if (fresh.length) f.add(`Sweep the right column (col ${right}) top→bottom, then move right inward.`, 10, [G(fresh), R()]);
      right--;
      if (top <= bottom) {
        fresh = [];
        for (let c = right; c >= left; c--) { res.push(m[bottom][c]); taken.add(bottom + "," + c); fresh.push(bottom + "," + c); }
        f.add(`Sweep the bottom row (row ${bottom}) right→left, then move bottom up.`, 14, [G(fresh), R()]);
        bottom--;
      }
      if (left <= right) {
        fresh = [];
        for (let r = bottom; r >= top; r--) { res.push(m[r][left]); taken.add(r + "," + left); fresh.push(r + "," + left); }
        if (fresh.length) f.add(`Sweep the left column (col ${left}) bottom→top, then move left inward.`, 18, [G(fresh), R()]);
        left++;
      }
    }
    f.add(`Spiral complete: [${res.join(", ")}]. O(m·n), each cell visited exactly once.`, 20, [G(), R()], true);
    return f;
  },
};

// -------------------------------------------------------------- Course Schedule
VIS["course-schedule"] = {
  inputs: [],
  code: `def canFinish(numCourses, prerequisites):
    adj = defaultdict(list)
    indeg = [0] * numCourses
    for course, pre in prerequisites:
        adj[pre].append(course)
        indeg[course] += 1
    queue = deque(i for i in range(numCourses)
                  if indeg[i] == 0)
    taken = 0
    while queue:
        c = queue.popleft()
        taken += 1
        for nxt in adj[c]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                queue.append(nxt)
    return taken == numCourses`,
  gen() {
    const f = mkFrames();
    const numCourses = 5;
    const prereqs = [[1, 0], [2, 0], [3, 1], [3, 2], [4, 3]];
    const adj = {};
    const indeg = new Array(numCourses).fill(0);
    for (const [course, pre] of prereqs) {
      (adj[pre] = adj[pre] || []).push(course);
      indeg[course]++;
    }
    const ADJ = () => ({ t: "kv", label: "prerequisite → unlocks", entries: Object.entries(adj).map(([k, v]) => [k, `[${v.join(", ")}]`]) });
    const D = hl => ({ t: "arr", label: "indegree (prereqs still needed)", v: indeg, hl });
    let queue = indeg.map((d, i) => (d === 0 ? i : -1)).filter(i => i >= 0);
    let taken = 0;
    const Q = () => ({ t: "set", label: "queue (ready to take)", v: queue });
    const V = () => ({ t: "vars", entries: [["taken", taken], ["total", numCourses]] });
    f.add(`Kahn's topological sort: a course with indegree 0 has no unmet prerequisites — take it, then release everything it was blocking.`, 8,
      [ADJ(), D(Object.fromEntries(queue.map(i => [i, "g"]))), Q(), V()]);
    while (queue.length) {
      const c = queue.shift();
      taken++;
      const released = [];
      for (const nxt of adj[c] || []) {
        indeg[nxt]--;
        if (indeg[nxt] === 0) { queue.push(nxt); released.push(nxt); }
      }
      f.add(`Take course ${c} (${taken}/${numCourses}).${(adj[c] || []).length ? ` Its dependents lose one prerequisite${released.length ? `; course(s) ${released.join(", ")} become ready` : ""}.` : ""}`, 12,
        [ADJ(), D({ [c]: "g", ...Object.fromEntries(released.map(x => [x, "y"])) }), Q(), V()]);
    }
    f.add(taken === numCourses
      ? `All ${numCourses} courses taken — the prerequisite graph has no cycle. Return True. O(V + E).`
      : `Only ${taken}/${numCourses} taken — the rest are stuck in a prerequisite cycle. Return False.`, 17,
      [ADJ(), D({}), Q(), V()], true);
    return f;
  },
};

// ============================ batch 7: trees ============================

// helper: postorder DFS over heap-array trees
const heapKids = (tree, i) => [2 * i + 1, 2 * i + 2].map(k => (k < tree.length && tree[k] !== null ? k : -1));

// ---------------------------------------------------- Diameter of Binary Tree
VIS["diameter-of-binary-tree"] = {
  inputs: [],
  code: `def diameterOfBinaryTree(root):
    best = 0
    def height(node):
        nonlocal best
        if not node:
            return 0
        lh = height(node.left)
        rh = height(node.right)
        best = max(best, lh + rh)
        return 1 + max(lh, rh)
    height(root)
    return best`,
  gen() {
    const f = mkFrames();
    const tree = [1, 2, 3, 4, 5, null, null, null, null, null, null, null, null, null, null];
    let best = 0;
    const T = hl => ({ t: "tree", label: "tree", v: tree, hl });
    const V = () => ({ t: "vars", entries: [["best (diameter)", best]] });
    f.add(`The longest path through a node = left height + right height. Compute heights bottom-up and track the best sum along the way.`, 2, [T({}), V()]);
    const height = i => {
      if (i === -1) return 0;
      const [l, r] = heapKids(tree, i);
      const lh = height(l), rh = height(r);
      const improved = lh + rh > best;
      best = Math.max(best, lh + rh);
      f.add(`Node ${tree[i]}: left height ${lh}, right height ${rh} → path through it spans ${lh + rh} edge(s).${improved ? " New best!" : ""} Return height ${1 + Math.max(lh, rh)}.`, 9,
        [T({ [i]: improved ? "g" : "p" }), V()]);
      return 1 + Math.max(lh, rh);
    };
    height(0);
    f.add(`Diameter: ${best} edges. One postorder pass — O(n).`, 12, [T({}), V()], true);
    return f;
  },
};

// -------------------------------------------------------- Balanced Binary Tree
VIS["balanced-binary-tree"] = {
  inputs: [],
  code: `def isBalanced(root):
    def dfs(node):
        if not node:
            return 0
        lh = dfs(node.left)
        rh = dfs(node.right)
        if lh == -1 or rh == -1 or abs(lh - rh) > 1:
            return -1
        return 1 + max(lh, rh)
    return dfs(root) != -1`,
  gen() {
    const f = mkFrames();
    const tree = [3, 9, 20, null, null, 15, 7, null, null, null, null, 8, null, null, null];
    const T = hl => ({ t: "tree", label: "tree", v: tree, hl });
    f.add(`Bottom-up DFS returns each subtree's height — or −1 the instant anything is unbalanced, short-circuiting the rest.`, 2, [T({})]);
    let failed = false;
    const dfs = i => {
      if (i === -1 || failed) return 0;
      const [l, r] = heapKids(tree, i);
      const lh = dfs(l), rh = dfs(r);
      if (failed) return -1;
      if (Math.abs(lh - rh) > 1) {
        failed = true;
        f.add(`Node ${tree[i]}: heights ${lh} vs ${rh} differ by ${Math.abs(lh - rh)} > 1 — unbalanced! Bubble −1 all the way up.`, 8, [T({ [i]: "r" })], true);
        return -1;
      }
      f.add(`Node ${tree[i]}: heights ${lh} and ${rh} — balanced here. Return height ${1 + Math.max(lh, rh)}.`, 9, [T({ [i]: "g" })]);
      return 1 + Math.max(lh, rh);
    };
    if (dfs(0) !== -1) {
      f.add(`Every node balanced — return True. O(n): each node computes its height exactly once.`, 10, [T(Object.fromEntries(tree.map((v, i) => [i, v !== null ? "g" : undefined]).filter(([, c]) => c)))], true);
    }
    return f;
  },
};

// ----------------------------------------------------------------- Same Tree
VIS["same-tree"] = {
  inputs: [],
  code: `def isSameTree(p, q):
    if not p and not q:
        return True
    if not p or not q or p.val != q.val:
        return False
    return (isSameTree(p.left, q.left) and
            isSameTree(p.right, q.right))`,
  gen() {
    const f = mkFrames();
    const p = [1, 2, 3, 4, null, null, null, null, null, null, null, null, null, null, null];
    const q = [1, 2, 3, 4, null, null, null, null, null, null, null, null, null, null, null];
    const P = hl => ({ t: "tree", label: "tree p", v: p, hl });
    const Q = hl => ({ t: "tree", label: "tree q", v: q, hl });
    f.add(`Walk both trees in lockstep: the pair must agree at every position — both missing, or both present with equal values.`, 2, [P({}), Q({})]);
    let same = true;
    const dfs = i => {
      if (!same) return;
      const pv = i < p.length ? p[i] : null, qv = i < q.length ? q[i] : null;
      if (pv === null && qv === null) return;
      if (pv === null || qv === null || pv !== qv) {
        same = false;
        f.add(`Mismatch at this position: p has ${pv ?? "nothing"}, q has ${qv ?? "nothing"} — trees differ. Return False.`, 5, [P({ [i]: "r" }), Q({ [i]: "r" })], true);
        return;
      }
      f.add(`Both trees have ${pv} here — match. Recurse into both subtrees.`, 6, [P({ [i]: "g" }), Q({ [i]: "g" })]);
      dfs(2 * i + 1);
      dfs(2 * i + 2);
    };
    dfs(0);
    if (same) {
      const done = t => Object.fromEntries(t.map((v, i) => [i, v !== null ? "g" : undefined]).filter(([, c]) => c));
      f.add(`Every position matched — the trees are identical. Return True. O(n).`, 3, [P(done(p)), Q(done(q))], true);
    }
    return f;
  },
};

// ----------------------------------------------------- Subtree of Another Tree
VIS["subtree-of-another-tree"] = {
  inputs: [],
  code: `def isSubtree(root, subRoot):
    def same(a, b):
        if not a and not b:
            return True
        if not a or not b or a.val != b.val:
            return False
        return (same(a.left, b.left) and
                same(a.right, b.right))
    if not root:
        return False
    if same(root, subRoot):
        return True
    return (isSubtree(root.left, subRoot) or
            isSubtree(root.right, subRoot))`,
  gen() {
    const f = mkFrames();
    const root = [3, 4, 5, 1, 2, null, null, null, null, null, null, null, null, null, null];
    const sub = [4, 1, 2, null, null, null, null, null, null, null, null, null, null, null, null];
    const R = hl => ({ t: "tree", label: "root", v: root, hl });
    const S = hl => ({ t: "tree", label: "subRoot", v: sub, hl });
    const same = (i, j) => {
      const a = i < root.length ? root[i] : null, b = j < sub.length ? sub[j] : null;
      if (a === null && b === null) return true;
      if (a === null || b === null || a !== b) return false;
      return same(2 * i + 1, 2 * j + 1) && same(2 * i + 2, 2 * j + 2);
    };
    const subMark = Object.fromEntries(sub.map((v, i) => [i, v !== null ? "y" : undefined]).filter(([, c]) => c));
    f.add(`For every node of the main tree, ask: is the subtree rooted here IDENTICAL to subRoot? (An O(n·m) check that's plenty fast in practice.)`, 2, [R({}), S(subMark)]);
    const order = root.map((v, i) => (v !== null ? i : -1)).filter(i => i >= 0);
    for (const i of order) {
      if (root[i] !== sub[0]) {
        f.add(`Node ${root[i]} ≠ subRoot's root ${sub[0]} — can't anchor a match here, move on.`, 5, [R({ [i]: "d" }), S(subMark)]);
        continue;
      }
      if (same(i, 0)) {
        const hl = {};
        const paint = (a, b) => {
          if (b >= sub.length || sub[b] === null) return;
          hl[a] = "g";
          paint(2 * a + 1, 2 * b + 1);
          paint(2 * a + 2, 2 * b + 2);
        };
        paint(i, 0);
        f.add(`Node ${root[i]} matches, and the full same-tree check passes — subRoot appears here. Return True.`, 12, [R(hl), S(Object.fromEntries(Object.keys(subMark).map(k => [k, "g"])))], true);
        return f;
      }
      f.add(`Node ${root[i]} matches subRoot's root, but the structures diverge below — keep searching.`, 11, [R({ [i]: "y" }), S(subMark)]);
    }
    f.add(`No node anchored a full match — subRoot is not a subtree. Return False.`, 15, [R({}), S(subMark)], true);
    return f;
  },
};

// ---------------------------------------------------- Binary Tree Right Side View
VIS["binary-tree-right-side-view"] = {
  inputs: [],
  code: `def rightSideView(root):
    res = []
    queue = deque([root] if root else [])
    while queue:
        res.append(queue[-1].val)
        for _ in range(len(queue)):
            node = queue.popleft()
            if node.left:
                queue.append(node.left)
            if node.right:
                queue.append(node.right)
    return res`,
  gen() {
    const f = mkFrames();
    const tree = [1, 2, 3, null, 5, null, 4, null, null, null, null, null, null, null, null];
    let queue = [0];
    const res = [];
    const T = hl => ({ t: "tree", label: "tree", v: tree, hl });
    const R = () => ({ t: "set", label: "res (visible from the right)", v: res });
    f.add(`Looking from the right you see exactly one node per level — the RIGHTMOST. BFS each level and keep its last node.`, 3, [T({}), R()]);
    while (queue.length) {
      const lastIdx = queue[queue.length - 1];
      res.push(tree[lastIdx]);
      const hl = Object.fromEntries(queue.map(i => [i, "p"]));
      hl[lastIdx] = "g";
      f.add(`Level [${queue.map(i => tree[i]).join(", ")}]: the rightmost is ${tree[lastIdx]} — that's what the right side sees.`, 5, [T(hl), R()]);
      const next = [];
      for (const i of queue) {
        const [l, r] = heapKids(tree, i);
        if (l !== -1) next.push(l);
        if (r !== -1) next.push(r);
      }
      queue = next;
    }
    f.add(`Right side view: [${res.join(", ")}]. O(n).`, 12, [T({}), R()], true);
    return f;
  },
};

// ------------------------------------------------ Count Good Nodes in Binary Tree
VIS["count-good-nodes-in-binary-tree"] = {
  inputs: [],
  code: `def goodNodes(root):
    def dfs(node, best):
        if not node:
            return 0
        good = 1 if node.val >= best else 0
        best = max(best, node.val)
        return (good + dfs(node.left, best)
                     + dfs(node.right, best))
    return dfs(root, root.val)`,
  gen() {
    const f = mkFrames();
    const tree = [3, 1, 4, 3, null, 1, 5, null, null, null, null, null, null, null, null];
    let count = 0;
    const T = hl => ({ t: "tree", label: "tree", v: tree, hl });
    const V = () => ({ t: "vars", entries: [["good nodes", count]] });
    f.add(`A node is good if nothing GREATER sits on its path from the root. DFS just carries the running max down.`, 2, [T({}), V()]);
    const dfs = (i, best) => {
      if (i === -1) return;
      const v = tree[i];
      const good = v >= best;
      if (good) count++;
      f.add(`Node ${v}: path max so far is ${best} — ${good ? `${v} ≥ ${best}, GOOD (total ${count})` : `${v} < ${best}, not good`}. Pass max ${Math.max(best, v)} down.`, good ? 5 : 6,
        [T({ [i]: good ? "g" : "d" }), V()]);
      const [l, r] = heapKids(tree, i);
      dfs(l, Math.max(best, v));
      dfs(r, Math.max(best, v));
    };
    dfs(0, tree[0]);
    f.add(`${count} good nodes. One DFS pass — O(n).`, 9, [T({}), V()], true);
    return f;
  },
};

// ------------------------------------------------ Kth Smallest Element in a BST
VIS["kth-smallest-element-in-a-bst"] = {
  inputs: [{ name: "k", label: "k", type: "int", def: "3", min: 1, max: 5 }],
  code: `def kthSmallest(root, k):
    stack = []
    node = root
    while True:
        while node:
            stack.append(node)
            node = node.left
        node = stack.pop()
        k -= 1
        if k == 0:
            return node.val
        node = node.right`,
  gen(k) {
    const f = mkFrames();
    const tree = [5, 3, 6, 2, 4, null, null, null, null, null, null, null, null, null, null];
    const total = tree.filter(v => v !== null).length;
    if (k > total) k = total;
    const stack = [];
    const T = hl => ({ t: "tree", label: "BST", v: tree, hl });
    const S = () => ({ t: "stack", label: "stack", v: stack.map(i => tree[i]) });
    const V = left => ({ t: "vars", entries: [["k (remaining)", left]] });
    f.add(`In-order traversal visits a BST in ascending order — so just walk in-order and stop at the ${k}th visit. No sorting, no extra array.`, 2, [T({}), S(), V(k)]);
    let node = 0, left = k;
    let guard = 0;
    while (guard++ < 40) {
      while (node !== -1) {
        stack.push(node);
        f.add(`Push ${tree[node]} and dive left — smallest values live leftmost.`, 6, [T({ [node]: "p" }), S(), V(left)]);
        const [l] = heapKids(tree, node);
        node = l;
      }
      const i = stack.pop();
      left--;
      if (left === 0) {
        f.add(`Visit ${tree[i]} — that's the ${k}th smallest! Return ${tree[i]}. O(h + k).`, 11, [T({ [i]: "g" }), S(), V(left)], true);
        return f;
      }
      f.add(`Visit ${tree[i]} (${k - left} of ${k}) — not there yet, continue into its right subtree.`, 9, [T({ [i]: "y" }), S(), V(left)]);
      const [, r] = heapKids(tree, i);
      node = r;
    }
    return f;
  },
};

// ----------------------- Construct Binary Tree from Preorder and Inorder
VIS["construct-binary-tree-from-preorder-and-inorder-traversal"] = {
  inputs: [],
  code: `def buildTree(preorder, inorder):
    if not preorder:
        return None
    root = TreeNode(preorder[0])
    mid = inorder.index(preorder[0])
    root.left = buildTree(preorder[1:mid+1],
                          inorder[:mid])
    root.right = buildTree(preorder[mid+1:],
                           inorder[mid+1:])
    return root`,
  gen() {
    const f = mkFrames();
    const preorder = [3, 9, 20, 15, 7];
    const inorder = [9, 3, 15, 20, 7];
    const built = new Array(15).fill(null);
    const P = hl => ({ t: "arr", label: "preorder (root comes first)", v: preorder, hl });
    const I = hl => ({ t: "arr", label: "inorder (left | root | right)", v: inorder, hl });
    const T = hl => ({ t: "tree", label: "tree under construction", v: built, hl });
    f.add(`Preorder hands us each root in order; inorder tells us what's left vs right of that root. Recurse on the two sides.`, 4, [P({}), I({}), T({})]);
    const build = (pLo, pHi, iLo, iHi, pos) => {
      if (pLo > pHi) return;
      const rootVal = preorder[pLo];
      const mid = inorder.indexOf(rootVal);
      built[pos] = rootVal;
      const iHl = { [mid]: "g" };
      for (let x = iLo; x < mid; x++) iHl[x] = "p";
      for (let x = mid + 1; x <= iHi; x++) iHl[x] = "y";
      f.add(`preorder[${pLo}] = ${rootVal} is the next root. In inorder it sits at index ${mid}: [${inorder.slice(iLo, mid).join(",") || "∅"}] goes left, [${inorder.slice(mid + 1, iHi + 1).join(",") || "∅"}] goes right.`, 5,
        [P({ [pLo]: "g" }), I(iHl), T({ [pos]: "g" })]);
      const leftSize = mid - iLo;
      build(pLo + 1, pLo + leftSize, iLo, mid - 1, 2 * pos + 1);
      build(pLo + leftSize + 1, pHi, mid + 1, iHi, 2 * pos + 2);
    };
    build(0, preorder.length - 1, 0, inorder.length - 1, 0);
    f.add(`Tree fully reconstructed. With a value→index map for inorder, this is O(n).`, 10, [P({}), I({}), T(Object.fromEntries(built.map((v, i) => [i, v !== null ? "g" : undefined]).filter(([, c]) => c)))], true);
    return f;
  },
};

// -------------------------------------------------- Binary Tree Maximum Path Sum
VIS["binary-tree-maximum-path-sum"] = {
  inputs: [],
  code: `def maxPathSum(root):
    best = float("-inf")
    def gain(node):
        nonlocal best
        if not node:
            return 0
        lg = max(gain(node.left), 0)
        rg = max(gain(node.right), 0)
        best = max(best, node.val + lg + rg)
        return node.val + max(lg, rg)
    gain(root)
    return best`,
  gen() {
    const f = mkFrames();
    const tree = [-10, 9, 20, null, null, 15, 7, null, null, null, null, null, null, null, null];
    let best = -Infinity;
    const T = hl => ({ t: "tree", label: "tree", v: tree, hl });
    const V = () => ({ t: "vars", entries: [["best", best === -Infinity ? "-∞" : best]] });
    f.add(`Each node reports its best DOWNWARD gain (never negative — a bad subtree is simply not taken). The best full path through a node is val + left gain + right gain.`, 3, [T({}), V()]);
    const gain = i => {
      if (i === -1) return 0;
      const [l, r] = heapKids(tree, i);
      const lg = Math.max(gain(l), 0), rg = Math.max(gain(r), 0);
      const through = tree[i] + lg + rg;
      const improved = through > best;
      best = Math.max(best, through);
      f.add(`Node ${tree[i]}: gains left ${lg}, right ${rg} → path through it sums to ${through}.${improved ? " New best!" : ""} Report ${tree[i] + Math.max(lg, rg)} upward.`, 9,
        [T({ [i]: improved ? "g" : "p" }), V()]);
      return tree[i] + Math.max(lg, rg);
    };
    gain(0);
    f.add(`Maximum path sum: ${best} (here the path 15 → 20 → 7 never even touches the root). O(n).`, 12, [T({ 2: "g", 5: "g", 6: "g" }), V()], true);
    return f;
  },
};

// ------------------------------------- Serialize and Deserialize Binary Tree
VIS["serialize-and-deserialize-binary-tree"] = {
  inputs: [],
  code: `def serialize(root):
    out = []
    def dfs(node):
        if not node:
            out.append("N")
            return
        out.append(str(node.val))
        dfs(node.left)
        dfs(node.right)
    dfs(root)
    return ",".join(out)

def deserialize(data):
    vals = iter(data.split(","))
    def build():
        v = next(vals)
        if v == "N":
            return None
        node = TreeNode(int(v))
        node.left = build()
        node.right = build()
        return node
    return build()`,
  gen() {
    const f = mkFrames();
    const tree = [1, 2, 3, null, null, 4, 5, null, null, null, null, null, null, null, null];
    const out = [];
    const T = hl => ({ t: "tree", label: "tree", v: tree, hl });
    const O = hl => ({ t: "arr", label: "serialized tokens", v: out.length ? out : ["·"], hl });
    f.add(`Preorder DFS with explicit "N" for nulls captures the tree's exact shape — no indices, no math, fully reversible.`, 3, [T({}), O({})]);
    const dfs = i => {
      const v = i !== -1 && i < tree.length && tree[i] !== null ? tree[i] : null;
      if (v === null) {
        out.push("N");
        f.add(`Nothing here — emit "N" so the decoder knows this branch ends.`, 5, [T({}), O({ [out.length - 1]: "y" })]);
        return;
      }
      out.push(String(v));
      f.add(`Visit ${v} — emit "${v}", then its left subtree, then its right.`, 7, [T({ [i]: "p" }), O({ [out.length - 1]: "p" })]);
      const [l, r] = [2 * i + 1, 2 * i + 2].map(k => (k < tree.length && tree[k] !== null ? k : -1));
      dfs(l);
      dfs(r);
    };
    dfs(0);
    f.add(`Serialized: "${out.join(",")}". Now deserialize by consuming tokens in the SAME preorder.`, 11, [T({}), O({})]);
    const rebuilt = new Array(15).fill(null);
    let ptr = 0;
    const R = hl => ({ t: "tree", label: "rebuilt tree", v: rebuilt, hl });
    const build = pos => {
      const v = out[ptr++];
      if (v === "N") return;
      if (pos < rebuilt.length) rebuilt[pos] = Number(v);
      f.add(`Consume "${v}" → place node ${v}, then recursively build its left and right children.`, 19, [O({ [ptr - 1]: "g" }), R({ [pos]: "g" })]);
      build(2 * pos + 1);
      build(2 * pos + 2);
    };
    build(0);
    f.add(`Round trip complete — the rebuilt tree is identical. O(n) both ways.`, 23, [O({}), R(Object.fromEntries(rebuilt.map((v, i) => [i, v !== null ? "g" : undefined]).filter(([, c]) => c)))], true);
    return f;
  },
};

// ============================ batch 8: linked lists, binary search, sudoku ============================

// ------------------------------------------------------------------ Reorder List
VIS["reorder-list"] = {
  inputs: [{ name: "vals", label: "list values", type: "arr", def: "[1, 2, 3, 4, 5]", max: 8, min: 3 }],
  code: `def reorderList(head):
    # 1) find the middle (slow / fast)
    slow, fast = head, head
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
    # 2) reverse the second half
    second = slow.next
    slow.next = None
    prev = None
    while second:
        second.next, prev, second = \\
            prev, second, second.next
    # 3) interleave the two halves
    first = head
    while prev:
        first.next, prev.next = prev, first.next
        first, prev = prev.next, prev.next`,
  gen(vals) {
    const f = mkFrames();
    const n = vals.length;
    const LL = (arr, ptrs, hl, label) => ({ t: "ll", label, v: arr.map((v, i) => ({ val: v, dir: i === arr.length - 1 ? null : "R" })), ptrs: ptrs || {}, hl: hl || {} });
    let slow = 0, fast = 0;
    f.add(`Three classic tricks chained: find the middle, reverse the back half, then zip the halves together.`, 3, [LL(vals, { 0: "slow fast" }, {}, "list")]);
    while (fast < n - 1 && fast + 1 < n - 1 + 1 && fast + 2 <= n) {
      if (fast + 2 > n - 1 && fast + 1 > n - 1) break;
      slow++;
      fast = Math.min(fast + 2, n);
      if (fast >= n - 1 && slow > 0) { break; }
    }
    // recompute cleanly
    slow = 0; fast = 0;
    while (fast < n - 1 && fast + 1 <= n - 1) {
      slow++;
      fast += 2;
      f.add(`slow → node ${vals[slow]}, fast jumps two — when fast hits the end, slow is the middle.`, 6,
        [LL(vals, fast <= n - 1 ? { [slow]: "slow", [fast]: "fast" } : { [slow]: "slow" }, { [slow]: "p" }, "list")]);
      if (fast >= n - 1) break;
    }
    const firstHalf = vals.slice(0, slow + 1);
    const secondHalf = vals.slice(slow + 1);
    f.add(`Split after node ${vals[slow]}: first half [${firstHalf.join(", ")}], second half [${secondHalf.join(", ")}].`, 9,
      [LL(firstHalf, {}, {}, "first half"), LL(secondHalf, {}, {}, "second half")]);
    const revSecond = [...secondHalf].reverse();
    f.add(`Reverse the second half in place → [${revSecond.join(", ")}] (same pointer-flipping walk as Reverse Linked List).`, 13,
      [LL(firstHalf, {}, {}, "first half"), LL(revSecond, {}, Object.fromEntries(revSecond.map((_, i) => [i, "y"])), "second half (reversed)")]);
    const out = [];
    let i = 0, j = 0;
    while (i < firstHalf.length || j < revSecond.length) {
      if (i < firstHalf.length) out.push(firstHalf[i++]);
      if (j < revSecond.length) out.push(revSecond[j++]);
    }
    let k = 0;
    const merged = [];
    i = 0; j = 0;
    while (i < firstHalf.length || j < revSecond.length) {
      if (i < firstHalf.length) { merged.push(firstHalf[i]); i++; }
      if (j < revSecond.length) { merged.push(revSecond[j]); j++; }
      f.add(`Interleave: take one from the front, one from the (reversed) back → [${merged.join(", ")}].`, 17,
        [LL(merged, {}, { [merged.length - 1]: "g" }, "reordered")]);
      k++;
    }
    f.add(`Reordered: L0 → Ln → L1 → Ln−1 … = [${merged.join(" → ")}]. All three phases are O(n), O(1) space.`, 18,
      [LL(merged, {}, Object.fromEntries(merged.map((_, x) => [x, "g"])), "reordered")], true);
    return f;
  },
};

// -------------------------------------------- Copy List with Random Pointer
VIS["copy-list-with-random-pointer"] = {
  inputs: [],
  code: `def copyRandomList(head):
    old_to_new = {None: None}
    cur = head
    while cur:                      # pass 1: clone nodes
        old_to_new[cur] = Node(cur.val)
        cur = cur.next
    cur = head
    while cur:                      # pass 2: wire pointers
        copy = old_to_new[cur]
        copy.next = old_to_new[cur.next]
        copy.random = old_to_new[cur.random]
        cur = cur.next
    return old_to_new[head]`,
  gen() {
    const f = mkFrames();
    const vals = [7, 13, 11, 10, 1];
    const randoms = [null, 0, 4, 2, 0]; // index of random target
    const cloned = [];
    const LL = hl => ({
      t: "ll", label: "original (random targets shown below)",
      v: vals.map((v, i) => ({ val: v, dir: i === vals.length - 1 ? null : "R" })),
      ptrs: Object.fromEntries(vals.map((_, i) => [i, randoms[i] === null ? "r→∅" : `r→${vals[randoms[i]]}`])),
      hl: hl || {},
    });
    const M = hl => ({ t: "kv", label: "old_to_new", entries: cloned.map(i => [`node ${vals[i]}`, `clone ${vals[i]}'`]), hl });
    f.add(`The random pointers can jump anywhere — so first clone every node into a map, THEN wire pointers by translating old → new.`, 2, [LL(), M()]);
    for (let i = 0; i < vals.length; i++) {
      cloned.push(i);
      f.add(`Pass 1: clone node ${vals[i]} → ${vals[i]}' and record it in the map.`, 5, [LL({ [i]: "p" }), M({ [`node ${vals[i]}`]: "p" })]);
    }
    for (let i = 0; i < vals.length; i++) {
      const rnd = randoms[i] === null ? "∅" : `${vals[randoms[i]]}'`;
      const nxt = i === vals.length - 1 ? "∅" : `${vals[i + 1]}'`;
      f.add(`Pass 2: ${vals[i]}'.next = ${nxt}, ${vals[i]}'.random = ${rnd} — both read straight from the map, even forward references.`, 11,
        [LL({ [i]: "g", ...(randoms[i] !== null ? { [randoms[i]]: "y" } : {}) }), M({ [`node ${vals[i]}`]: "g" })]);
    }
    f.add(`Deep copy complete — every next and random pointer lands on a clone, never an original. Two passes, O(n) time and space.`, 13, [LL(), M()], true);
    return f;
  },
};

// ----------------------------------------------------------------- LRU Cache
VIS["lru-cache"] = {
  inputs: [],
  code: `class LRUCache:  # capacity 2 in this demo
    def __init__(self, capacity):
        self.cap = capacity
        self.cache = {}   # key -> list node
        # doubly linked list keeps recency:
        # left = least recent, right = most recent

    def get(self, key):
        if key not in self.cache:
            return -1
        self._move_to_right(key)   # O(1) unlink+relink
        return self.cache[key].val

    def put(self, key, value):
        self.cache[key] = Node(key, value)
        self._move_to_right(key)
        if len(self.cache) > self.cap:
            lru = self._leftmost()  # least recent
            del self.cache[lru.key]`,
  gen() {
    const f = mkFrames();
    const cap = 2;
    const cache = new Map(); // key -> value, insertion order = recency (left = LRU)
    const C = hl => ({ t: "kv", label: "cache (map)", entries: [...cache.entries()].map(([k, v]) => [k, v]), hl });
    const O = hl => ({ t: "arr", label: "recency (LRU → MRU)", v: cache.size ? [...cache.keys()] : ["·"], hl });
    f.add(`Two structures, one job each: a hash map finds entries in O(1); a doubly linked list keeps them in recency order so eviction is also O(1).`, 3, [C(), O()]);
    const touch = k => { const v = cache.get(k); cache.delete(k); cache.set(k, v); };
    const ops = [
      ["put", 1, 1], ["put", 2, 2], ["get", 1], ["put", 3, 3], ["get", 2], ["put", 4, 4], ["get", 1], ["get", 3], ["get", 4],
    ];
    for (const [op, key, val] of ops) {
      if (op === "put") {
        cache.set(key, val);
        touch(key);
        if (cache.size > cap) {
          const lru = cache.keys().next().value;
          f.add(`put(${key}, ${val}): insert as most-recent — over capacity! The leftmost (least recent) key ${lru} is evicted.`, 19,
            [C({ [lru]: "r", [key]: "p" }), O({ 0: "r" })]);
          cache.delete(lru);
        } else {
          f.add(`put(${key}, ${val}): store it and mark it most-recent (rightmost).`, 16, [C({ [key]: "p" }), O({ [cache.size - 1]: "p" })]);
        }
      } else {
        if (!cache.has(key)) {
          f.add(`get(${key}): not in the map — return -1.`, 10, [C(), O()]);
        } else {
          touch(key);
          f.add(`get(${key}) → ${cache.get(key)}. Accessing it moves it to most-recent — the list re-links in O(1).`, 12,
            [C({ [key]: "g" }), O({ [cache.size - 1]: "g" })]);
        }
      }
    }
    f.add(`Every get and put ran in O(1): the map for lookup, the recency list for ordering and eviction.`, 12, [C(), O()], true);
    return f;
  },
};

// --------------------------------------------------------- Merge k Sorted Lists
VIS["merge-k-sorted-lists"] = {
  inputs: [],
  code: `def mergeKLists(lists):
    heap = [(l.val, i, l)
            for i, l in enumerate(lists) if l]
    heapify(heap)
    dummy = tail = ListNode()
    while heap:
        val, i, node = heappop(heap)
        tail.next = node
        tail = tail.next
        if node.next:
            heappush(heap,
                (node.next.val, i, node.next))
    return dummy.next`,
  gen() {
    const f = mkFrames();
    const lists = [[1, 4, 5], [1, 3, 4], [2, 6]];
    const idx = lists.map(() => 0);
    const out = [];
    const L = (li, hl) => ({
      t: "arr", label: `list ${li + 1}`, v: lists[li],
      hl: { ...Object.fromEntries(lists[li].map((_, x) => [x, x < idx[li] ? "d" : undefined]).filter(([, c]) => c)), ...(hl || {}) },
      ptrs: idx[li] < lists[li].length ? { [idx[li]]: "head" } : {},
    });
    const heapView = () => lists.map((l, li) => (idx[li] < l.length ? [l[idx[li]], li] : null)).filter(Boolean).sort((a, b) => a[0] - b[0]);
    const H = hl => ({ t: "set", label: "min-heap of current heads", v: heapView().map(([v, li]) => `${v} (list ${li + 1})`), hl });
    const O = hl => ({ t: "arr", label: "merged", v: out.length ? out : ["·"], hl });
    f.add(`Only k candidates can be the next-smallest — the k list heads. Keep them in a min-heap: pop the smallest, push its successor.`, 3,
      [L(0), L(1), L(2), H(), O({})]);
    while (heapView().length) {
      const [val, li] = heapView()[0];
      idx[li]++;
      out.push(val);
      const succ = idx[li] < lists[li].length ? lists[li][idx[li]] : null;
      f.add(`Pop ${val} (list ${li + 1}'s head) — append it.${succ !== null ? ` Its successor ${succ} enters the heap.` : ` List ${li + 1} is exhausted.`}`, succ !== null ? 11 : 7,
        [L(0), L(1), L(2), H(succ !== null ? { [`${succ} (list ${li + 1})`]: "y" } : {}), O({ [out.length - 1]: "g" })]);
    }
    f.add(`Merged: [${out.join(", ")}]. Each of the n nodes cost one O(log k) heap operation → O(n log k).`, 13,
      [O(Object.fromEntries(out.map((_, x) => [x, "g"])))], true);
    return f;
  },
};

// ------------------------------------------------- Reverse Nodes in k-Group
VIS["reverse-nodes-in-k-group"] = {
  inputs: [
    { name: "vals", label: "list values", type: "arr", def: "[1, 2, 3, 4, 5]", max: 8, min: 1 },
    { name: "k", label: "k", type: "int", def: "2", min: 1, max: 4 },
  ],
  code: `def reverseKGroup(head, k):
    dummy = ListNode(0, head)
    prev_group = dummy
    while True:
        kth = prev_group          # find the k-th node
        for _ in range(k):
            kth = kth.next
            if not kth:
                return dummy.next # < k left: keep order
        nxt_group = kth.next
        prev, cur = nxt_group, prev_group.next
        while cur != nxt_group:   # reverse the group
            cur.next, prev, cur = prev, cur, cur.next
        start = prev_group.next   # stitch it back in
        prev_group.next = kth
        prev_group = start`,
  gen(vals, k) {
    const f = mkFrames();
    let arr = [...vals];
    const LL = (hl, label) => ({ t: "ll", label: label || "list", v: arr.map((v, i) => ({ val: v, dir: i === arr.length - 1 ? null : "R" })), ptrs: {}, hl: hl || {} });
    f.add(`Process the list in blocks of ${k}: count ${k} nodes ahead, reverse just that block in place, stitch it to the previous one.`, 3, [LL()]);
    let start = 0;
    while (start + k <= arr.length) {
      const hl = {};
      for (let x = start; x < start + k; x++) hl[x] = "w";
      f.add(`Group [${arr.slice(start, start + k).join(", ")}] has a full ${k} nodes — reverse it.`, 6, [LL(hl)]);
      const block = arr.slice(start, start + k).reverse();
      arr = [...arr.slice(0, start), ...block, ...arr.slice(start + k)];
      const hl2 = {};
      for (let x = start; x < start + k; x++) hl2[x] = "g";
      f.add(`Reversed in place and stitched: […${start ? " " : ""}${arr.slice(0, start).join(", ")}${start ? ", " : ""}${block.join(", ")}, …]. The block's old first node now links to the next group.`, 16, [LL(hl2)]);
      start += k;
    }
    if (start < arr.length) {
      const hl = {};
      for (let x = start; x < arr.length; x++) hl[x] = "d";
      f.add(`Only ${arr.length - start} node(s) remain — fewer than ${k}, so they keep their original order.`, 9, [LL(hl)]);
    }
    f.add(`Final list: [${arr.join(" → ")}]. Each node's pointer is rewritten once → O(n), O(1) space.`, 9,
      [LL(Object.fromEntries(arr.map((_, x) => [x, "g"])))], true);
    return f;
  },
};

// ------------------------------------------------- Time Based Key-Value Store
VIS["time-based-key-value-store"] = {
  inputs: [],
  code: `class TimeMap:
    def __init__(self):
        self.store = {}  # key -> [(timestamp, value)]

    def set(self, key, value, timestamp):
        self.store.setdefault(key, []).append(
            (timestamp, value))

    def get(self, key, timestamp):
        pairs = self.store.get(key, [])
        res = ""
        l, r = 0, len(pairs) - 1
        while l <= r:
            m = (l + r) // 2
            if pairs[m][0] <= timestamp:
                res = pairs[m][1]
                l = m + 1
            else:
                r = m - 1
        return res`,
  gen() {
    const f = mkFrames();
    const store = {};
    const S = hl => ({ t: "kv", label: "store", entries: Object.entries(store).map(([k, v]) => [k, v.map(([t, x]) => `(t${t}: ${x})`).join(" ")], []), hl });
    f.add(`Timestamps only ever increase, so each key's history is already sorted — get() is a binary search for the rightmost timestamp ≤ the query.`, 3, [S()]);
    const ops = [
      ["set", "foo", "bar", 1], ["get", "foo", 1], ["get", "foo", 3],
      ["set", "foo", "bar2", 4], ["get", "foo", 4], ["get", "foo", 5], ["get", "foo", 0],
    ];
    for (const op of ops) {
      if (op[0] === "set") {
        const [, key, value, ts] = op;
        (store[key] = store[key] || []).push([ts, value]);
        f.add(`set("${key}", "${value}", t=${ts}) — append to the key's history (stays sorted for free).`, 6, [S({ [key]: "p" })]);
      } else {
        const [, key, ts] = op;
        const pairs = store[key] || [];
        let l = 0, r = pairs.length - 1, res = "";
        while (l <= r) {
          const m = (l + r) >> 1;
          if (pairs[m][0] <= ts) { res = pairs[m][1]; l = m + 1; } else { r = m - 1; }
        }
        f.add(`get("${key}", t=${ts}): binary search the history [${pairs.map(([t]) => "t" + t).join(", ")}] for the last timestamp ≤ ${ts} → ${res ? `"${res}"` : '"" (nothing that early)'}.`, 20,
          [S({ [key]: res ? "g" : "r" })]);
      }
    }
    f.add(`set is O(1) amortized; get is O(log n) per key. No sorting ever needed.`, 20, [S()], true);
    return f;
  },
};

// ------------------------------------------------ Median of Two Sorted Arrays
VIS["median-of-two-sorted-arrays"] = {
  inputs: [
    { name: "A", label: "A (sorted)", type: "arr", def: "[1, 3, 8, 9, 15]", max: 8, min: 1 },
    { name: "B", label: "B (sorted)", type: "arr", def: "[7, 11, 18, 19, 21, 25]", max: 8, min: 1 },
  ],
  code: `def findMedianSortedArrays(A, B):
    if len(A) > len(B):
        A, B = B, A
    total = len(A) + len(B)
    half = total // 2
    l, r = 0, len(A)
    while True:
        i = (l + r) // 2   # size of A's left part
        j = half - i       # size of B's left part
        Aleft  = A[i-1] if i > 0 else -inf
        Aright = A[i]   if i < len(A) else inf
        Bleft  = B[j-1] if j > 0 else -inf
        Bright = B[j]   if j < len(B) else inf
        if Aleft <= Bright and Bleft <= Aright:
            if total % 2:
                return min(Aright, Bright)
            return (max(Aleft, Bleft) +
                    min(Aright, Bright)) / 2
        if Aleft > Bright:
            r = i - 1
        else:
            l = i + 1`,
  gen(A, B) {
    const f = mkFrames();
    A = [...A].sort((a, b) => a - b);
    B = [...B].sort((a, b) => a - b);
    if (A.length > B.length) [A, B] = [B, A];
    const total = A.length + B.length;
    const half = total >> 1;
    let l = 0, r = A.length;
    const view = (i, j, cls) => [
      { t: "arr", label: `A (left part = first ${i})`, v: A, hl: Object.fromEntries(A.map((_, x) => [x, x < i ? (cls || "p") : undefined]).filter(([, c]) => c)) },
      { t: "arr", label: `B (left part = first ${j})`, v: B, hl: Object.fromEntries(B.map((_, x) => [x, x < j ? (cls || "y") : undefined]).filter(([, c]) => c)) },
    ];
    const fmt = x => (x === -Infinity ? "-∞" : x === Infinity ? "+∞" : x);
    f.add(`The median splits the ${total} values into halves of ${half}. Binary search how many of those ${half} come from A — B's share follows automatically.`, 5, view(0, half));
    let guard = 0;
    while (guard++ < 20) {
      const i = (l + r) >> 1;
      const j = half - i;
      const Aleft = i > 0 ? A[i - 1] : -Infinity;
      const Aright = i < A.length ? A[i] : Infinity;
      const Bleft = j > 0 ? B[j - 1] : -Infinity;
      const Bright = j < B.length ? B[j] : Infinity;
      const V = { t: "vars", entries: [["Aleft", fmt(Aleft)], ["Aright", fmt(Aright)], ["Bleft", fmt(Bleft)], ["Bright", fmt(Bright)]] };
      if (Aleft <= Bright && Bleft <= Aright) {
        const ans = total % 2 ? Math.min(Aright, Bright) : (Math.max(Aleft, Bleft) + Math.min(Aright, Bright)) / 2;
        f.add(`Partition (${i} | ${j}) is valid: every left value ≤ every right value. ${total % 2 ? `Odd total → median is min of the rights: ${ans}.` : `Even total → average the middle pair: ${ans}.`}`, 16,
          [...view(i, j, "g"), V], true);
        return f;
      }
      if (Aleft > Bright) {
        f.add(`Try ${i} from A, ${j} from B: Aleft ${fmt(Aleft)} > Bright ${fmt(Bright)} — A contributes too much. Shrink A's share.`, 20, [...view(i, j), V]);
        r = i - 1;
      } else {
        f.add(`Try ${i} from A, ${j} from B: Bleft ${fmt(Bleft)} > Aright ${fmt(Aright)} — A contributes too little. Grow A's share.`, 22, [...view(i, j), V]);
        l = i + 1;
      }
    }
    return f;
  },
};

// ----------------------------------------------------------------- Valid Sudoku
VIS["valid-sudoku"] = {
  inputs: [],
  code: `def isValidSudoku(board):
    rows = defaultdict(set)
    cols = defaultdict(set)
    boxes = defaultdict(set)  # key: (r//3, c//3)
    for r in range(9):
        for c in range(9):
            v = board[r][c]
            if v == ".":
                continue
            if (v in rows[r] or v in cols[c]
                    or v in boxes[(r//3, c//3)]):
                return False
            rows[r].add(v)
            cols[c].add(v)
            boxes[(r//3, c//3)].add(v)
    return True`,
  gen() {
    const f = mkFrames();
    const board = [
      ["5","3",".",".","7",".",".",".","."],
      ["6",".",".","1","9","5",".",".","."],
      [".","9","8",".",".",".",".","6","."],
      ["8",".",".",".","6",".",".",".","3"],
      ["4",".",".","8",".","3",".",".","1"],
      ["7",".",".",".","2",".",".",".","6"],
      [".","6",".",".",".",".","2","8","."],
      [".",".",".","4","1","9",".",".","5"],
      [".",".",".",".","8",".",".","7","9"],
    ];
    const rows = Array.from({ length: 9 }, () => new Set());
    const cols = Array.from({ length: 9 }, () => new Set());
    const boxes = Array.from({ length: 9 }, () => new Set());
    const G = (r, c, cls) => {
      const hl = {};
      if (r >= 0) {
        for (let x = 0; x < 9; x++) { hl[r + "," + x] = "w"; hl[x + "," + c] = "w"; }
        const br = Math.floor(r / 3) * 3, bc = Math.floor(c / 3) * 3;
        for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) hl[(br + i) + "," + (bc + j)] = "w";
        hl[r + "," + c] = cls;
      }
      return { t: "grid", label: "board (outlined = this cell's row, column, and box)", v: board, hl };
    };
    f.add(`One scan is enough: for every filled cell, remember its digit per-row, per-column, and per-3×3-box in hash sets. A repeat in any set is a violation.`, 4, [G(-1)]);
    let step = 0;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const v = board[r][c];
        if (v === ".") continue;
        const box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
        if (rows[r].has(v) || cols[c].has(v) || boxes[box].has(v)) {
          f.add(`(${r}, ${c}) = ${v}: already seen in this ${rows[r].has(v) ? "row" : cols[c].has(v) ? "column" : "box"} — invalid board. Return False.`, 12, [G(r, c, "r")], true);
          return f;
        }
        rows[r].add(v); cols[c].add(v); boxes[box].add(v);
        step++;
        if (step % 5 === 0 || step <= 3) {
          f.add(`(${r}, ${c}) = ${v}: new to row ${r}, column ${c}, and box ${box} — record it in all three sets. (${step} cells checked)`, 13, [G(r, c, "g")]);
        }
      }
    }
    f.add(`All 30 filled cells checked with zero repeats in any row, column, or box — the board is valid. O(81) = O(1).`, 16, [G(-1)], true);
    return f;
  },
};

// ============================ batch 9: heaps and tries ============================

// -------------------------------------------- Kth Largest Element in a Stream
VIS["kth-largest-element-in-a-stream"] = {
  inputs: [],
  code: `class KthLargest:
    def __init__(self, k, nums):
        self.k = k
        self.heap = nums   # min-heap
        heapify(self.heap)
        while len(self.heap) > k:
            heappop(self.heap)

    def add(self, val):
        heappush(self.heap, val)
        if len(self.heap) > self.k:
            heappop(self.heap)
        return self.heap[0]`,
  gen() {
    const f = mkFrames();
    const k = 3;
    let heap = [4, 5, 8, 2].sort((a, b) => a - b);
    const H = hl => ({ t: "set", label: `min-heap (size ≤ ${k}, smallest first)`, v: heap, hl });
    f.add(`Keep only the k = ${k} largest values in a MIN-heap — its root (the smallest of the three) is exactly the ${k}rd largest overall.`, 5, [H()]);
    while (heap.length > k) {
      const dropped = heap[0];
      heap = heap.slice(1);
      f.add(`Initial heap too big — pop the smallest (${dropped}); it can never be top-${k}.`, 7, [H()]);
    }
    for (const val of [3, 5, 10, 9, 4]) {
      heap.push(val);
      heap.sort((a, b) => a - b);
      if (heap.length > k) {
        const dropped = heap[0];
        heap = heap.slice(1);
        f.add(`add(${val}): push it, then pop the smallest (${dropped}) to stay at size ${k}. The ${k}rd largest is now ${heap[0]}.`, 12, [H({ [heap[0]]: "g" })]);
      } else {
        f.add(`add(${val}) — heap still ≤ ${k}; the ${k}rd largest is ${heap[0]}.`, 12, [H({ [heap[0]]: "g" })]);
      }
    }
    f.add(`Every add is O(log k), and the answer is always sitting at the heap root.`, 12, [H({ [heap[0]]: "g" })], true);
    return f;
  },
};

// ------------------------------------------------- K Closest Points to Origin
VIS["k-closest-points-to-origin"] = {
  inputs: [],
  code: `def kClosest(points, k):
    heap = []  # max-heap of size k (negated dist)
    for x, y in points:
        d = x*x + y*y
        heappush(heap, (-d, x, y))
        if len(heap) > k:
            heappop(heap)  # drop the farthest kept
    return [(x, y) for _, x, y in heap]`,
  gen() {
    const f = mkFrames();
    const points = [[1, 3], [-2, 2], [5, 8], [0, 1], [2, 2]];
    const k = 2;
    let heap = []; // [d, x, y] kept sorted desc by d (front = farthest = heap root)
    const P = hl => ({ t: "arr", label: "points (x, y)", v: points.map(([x, y]) => `(${x},${y})`), hl });
    const H = hl => ({ t: "set", label: `max-heap of ${k} closest (farthest first)`, v: heap.map(([d, x, y]) => `(${x},${y}) d²=${d}`), hl });
    f.add(`Keep the ${k} best in a MAX-heap keyed on distance: the root is the worst of the kept — the one to evict when someone closer shows up.`, 2, [P({}), H()]);
    points.forEach(([x, y], i) => {
      const d = x * x + y * y;
      heap.push([d, x, y]);
      heap.sort((a, b) => b[0] - a[0]);
      if (heap.length > k) {
        const [dd, xx, yy] = heap[0];
        heap = heap.slice(1);
        f.add(`(${x},${y}): d² = ${d}. Push it, then evict the farthest kept — (${xx},${yy}) with d² = ${dd}.`, 7, [P({ [i]: d < dd ? "g" : "y" }), H()]);
      } else {
        f.add(`(${x},${y}): d² = ${d} — heap not full yet, keep it.`, 5, [P({ [i]: "p" }), H()]);
      }
    });
    f.add(`The ${k} closest points: ${heap.map(([, x, y]) => `(${x},${y})`).join(" ")}. O(n log k) — never sorts all n points.`, 8, [P({}), H(Object.fromEntries(heap.map(([d, x, y]) => [`(${x},${y}) d²=${d}`, "g"])))], true);
    return f;
  },
};

// ------------------------------------------- Kth Largest Element in an Array
VIS["kth-largest-element-in-an-array"] = {
  inputs: [
    { name: "nums", label: "nums", type: "arr", def: "[3, 2, 1, 5, 6, 4]", max: 10, min: 1 },
    { name: "k", label: "k", type: "int", def: "2", min: 1, max: 10 },
  ],
  code: `def findKthLargest(nums, k):
    target = len(nums) - k   # its index if sorted
    def quickselect(l, r):
        pivot, p = nums[r], l
        for i in range(l, r):
            if nums[i] <= pivot:
                nums[i], nums[p] = nums[p], nums[i]
                p += 1
        nums[p], nums[r] = nums[r], nums[p]
        if p < target:
            return quickselect(p + 1, r)
        if p > target:
            return quickselect(l, p - 1)
        return nums[p]
    return quickselect(0, len(nums) - 1)`,
  gen(nums, k) {
    const f = mkFrames();
    nums = [...nums];
    if (k > nums.length) k = nums.length;
    const target = nums.length - k;
    const A = (hl, ptrs, lo, hi) => {
      const full = {};
      if (lo !== undefined) for (let i = 0; i < nums.length; i++) if (i < lo || i > hi) full[i] = "d";
      Object.assign(full, hl || {});
      return { t: "arr", label: "nums (dimmed = outside current range)", v: nums, hl: full, ptrs };
    };
    f.add(`The ${k}th largest would sit at index ${target} if sorted. Quickselect partitions like quicksort but recurses into ONE side only — O(n) on average.`, 2, [A({}, { [target]: "target" })]);
    const quickselect = (l, r) => {
      const pivot = nums[r];
      let p = l;
      f.add(`Partition [${l}..${r}] around pivot ${pivot} (the last element): smaller values move to the front.`, 4, [A({ [r]: "y" }, { [target]: "target", [r]: "pivot" }, l, r)]);
      for (let i = l; i < r; i++) {
        if (nums[i] <= pivot) {
          [nums[i], nums[p]] = [nums[p], nums[i]];
          p++;
        }
      }
      [nums[p], nums[r]] = [nums[r], nums[p]];
      f.add(`Pivot ${pivot} lands at index ${p} — everything left of it is ≤, everything right is >.`, 9, [A({ [p]: "p" }, { [target]: "target", [p]: "p" }, l, r)]);
      if (p < target) {
        f.add(`${p} < target ${target} — the answer is in the RIGHT part. Recurse there and ignore the left entirely.`, 11, [A({}, { [target]: "target" }, p + 1, r)]);
        return quickselect(p + 1, r);
      }
      if (p > target) {
        f.add(`${p} > target ${target} — the answer is in the LEFT part. Recurse there.`, 13, [A({}, { [target]: "target" }, l, p - 1)]);
        return quickselect(l, p - 1);
      }
      f.add(`Pivot landed exactly on the target index — the ${k}th largest is ${nums[p]}. Average O(n): n + n/2 + n/4 + … `, 14, [A({ [p]: "g" }, { [p]: "target" }, l, r)], true);
      return nums[p];
    };
    quickselect(0, nums.length - 1);
    return f;
  },
};

// ---------------------------------------------------------------- Task Scheduler
VIS["task-scheduler"] = {
  inputs: [],
  code: `def leastInterval(tasks, n):
    counts = Counter(tasks)
    max_freq = max(counts.values())
    ties = sum(1 for c in counts.values()
               if c == max_freq)
    slots = (max_freq - 1) * (n + 1) + ties
    return max(len(tasks), slots)`,
  gen() {
    const f = mkFrames();
    const tasks = ["A", "A", "A", "B", "B", "B"];
    const n = 2;
    const counts = { A: 3, B: 3 };
    const C = hl => ({ t: "kv", label: "task counts", entries: kvEntries(counts), hl });
    const T = hl => ({ t: "arr", label: "tasks", v: tasks, hl });
    f.add(`Only the MOST FREQUENT task matters: it forces the schedule's skeleton, and everything else fills its idle gaps.`, 2, [T({}), C()]);
    f.add(`max_freq = 3 (both A and B). The most frequent task creates (3−1) = 2 gaps of width n+1 = ${n + 1}: A _ _ | A _ _ | A`, 3,
      [{ t: "arr", label: "skeleton from A", v: ["A", "·", "·", "A", "·", "·", "A"], hl: { 0: "p", 3: "p", 6: "p" } }, C({ A: "p" })]);
    f.add(`ties = 2 tasks share max_freq, so the final block holds both: slots = (3−1)·(${n}+1) + 2 = 8.`, 6,
      [{ t: "arr", label: "schedule", v: ["A", "B", "idle", "A", "B", "idle", "A", "B"], hl: { 0: "p", 1: "y", 3: "p", 4: "y", 6: "p", 7: "y", 2: "d", 5: "d" } }, C()]);
    f.add(`Answer: max(6 tasks, 8 slots) = 8 time units. If there were MORE fillers than gaps, the task count itself would win — hence the max(). O(n).`, 7,
      [{ t: "arr", label: "schedule (8 units)", v: ["A", "B", "idle", "A", "B", "idle", "A", "B"], hl: { 2: "d", 5: "d" } }], true);
    return f;
  },
};

// ---------------------------------------------------------------- Design Twitter
VIS["design-twitter"] = {
  inputs: [],
  code: `class Twitter:
    def __init__(self):
        self.time = 0
        self.tweets = defaultdict(list)   # user -> [(t, id)]
        self.follows = defaultdict(set)

    def postTweet(self, user, tid):
        self.tweets[user].append((self.time, tid))
        self.time += 1

    def follow(self, a, b):
        self.follows[a].add(b)

    def unfollow(self, a, b):
        self.follows[a].discard(b)

    def getNewsFeed(self, user):
        cand = list(self.tweets[user])
        for followee in self.follows[user]:
            cand += self.tweets[followee]
        cand.sort(reverse=True)  # a heap of list-heads in practice
        return [tid for _, tid in cand[:10]]`,
  gen() {
    const f = mkFrames();
    let time = 0;
    const tweets = {};
    const follows = {};
    const TW = hl => ({ t: "kv", label: "tweets (user → [(time, id)])", entries: Object.entries(tweets).map(([u, l]) => [`user ${u}`, l.map(([t, id]) => `(t${t}: ${id})`).join(" ")]), hl });
    const FO = hl => ({ t: "kv", label: "follows", entries: Object.entries(follows).map(([u, s]) => [`user ${u}`, `{${[...s].join(", ")}}`]), hl });
    f.add(`Per-user tweet lists stamped with a global clock, plus follow sets. A feed is just a merge of the newest tweets across followees.`, 4, [TW(), FO()]);
    const post = (u, id) => {
      (tweets[u] = tweets[u] || []).push([time++, id]);
      f.add(`postTweet(user ${u}, ${id}) — stamped with time ${time - 1}.`, 8, [TW({ [`user ${u}`]: "p" }), FO()]);
    };
    post(1, 101);
    post(2, 201);
    follows[1] = new Set([2]);
    f.add(`follow(1, 2) — user 1 now follows user 2.`, 12, [TW(), FO({ "user 1": "y" })]);
    post(2, 202);
    post(1, 102);
    const cand = [...(tweets[1] || [])];
    for (const fo of follows[1] || []) cand.push(...(tweets[fo] || []));
    cand.sort((a, b) => b[0] - a[0]);
    const feed = cand.slice(0, 10).map(([, id]) => id);
    f.add(`getNewsFeed(1): gather user 1's tweets + followee 2's tweets, take the 10 newest by timestamp → [${feed.join(", ")}].`, 22,
      [TW({ "user 1": "g", "user 2": "g" }), FO(), { t: "arr", label: "feed (newest first)", v: feed, hl: {} }]);
    f.add(`With a heap over each followee's list-head this merge is O(f log f) per feed — the same pattern as Merge k Sorted Lists.`, 21, [TW(), FO()], true);
    return f;
  },
};

// ----------------------------------------------- Find Median from Data Stream
VIS["find-median-from-data-stream"] = {
  inputs: [{ name: "nums", label: "stream", type: "arr", def: "[5, 15, 1, 3, 8]", max: 10, min: 1 }],
  code: `class MedianFinder:
    def __init__(self):
        self.small = []  # max-heap (lower half)
        self.large = []  # min-heap (upper half)

    def addNum(self, num):
        heappush(self.small, -num)
        if self.large and -self.small[0] > self.large[0]:
            heappush(self.large, -heappop(self.small))
        if len(self.small) > len(self.large) + 1:
            heappush(self.large, -heappop(self.small))
        if len(self.large) > len(self.small) + 1:
            heappush(self.small, -heappop(self.large))

    def findMedian(self):
        if len(self.small) > len(self.large):
            return -self.small[0]
        if len(self.large) > len(self.small):
            return self.large[0]
        return (-self.small[0] + self.large[0]) / 2`,
  gen(nums) {
    const f = mkFrames();
    const small = [], large = []; // small: sorted desc (front = max); large: sorted asc (front = min)
    const S = hl => ({ t: "set", label: "small = lower half (max at front)", v: small, hl });
    const L = hl => ({ t: "set", label: "large = upper half (min at front)", v: large, hl });
    const median = () => small.length > large.length ? small[0] : large.length > small.length ? large[0] : (small[0] + large[0]) / 2;
    f.add(`Split the stream into halves: a max-heap holds the lower half, a min-heap the upper. The median always lives at the two roots.`, 3, [S(), L()]);
    for (const num of nums) {
      small.push(num);
      small.sort((a, b) => b - a);
      let moved = "";
      if (large.length && small[0] > large[0]) {
        large.push(small.shift());
        large.sort((a, b) => a - b);
        moved = ` It exceeded the upper half's min, so it migrates to large.`;
      }
      if (small.length > large.length + 1) { large.push(small.shift()); large.sort((a, b) => a - b); moved += ` Rebalance: small was 2 bigger.`; }
      if (large.length > small.length + 1) { small.push(large.shift()); small.sort((a, b) => b - a); moved += ` Rebalance: large was 2 bigger.`; }
      f.add(`addNum(${num}).${moved} Median = ${median()}.`, 7, [S(small.length && (small.length >= large.length) ? { [small[0]]: "g" } : {}), L(large.length > small.length ? { [large[0]]: "g" } : (small.length === large.length && large.length ? { [large[0]]: "g" } : {}))]);
    }
    f.add(`Every add is O(log n); every median read is O(1) — just peek the roots.`, 20, [S(), L()], true);
    return f;
  },
};

// ------------------------------------------------- Implement Trie (Prefix Tree)
VIS["implement-trie-prefix-tree"] = {
  inputs: [],
  code: `class Trie:
    def __init__(self):
        self.root = {}

    def insert(self, word):
        node = self.root
        for c in word:
            node = node.setdefault(c, {})
        node["$"] = True   # end-of-word marker

    def search(self, word):
        node = self._walk(word)
        return node is not None and "$" in node

    def startsWith(self, prefix):
        return self._walk(prefix) is not None

    def _walk(self, s):
        node = self.root
        for c in s:
            if c not in node:
                return None
            node = node[c]
        return node`,
  gen() {
    const f = mkFrames();
    const nodes = []; // prefixes present; "$"-suffixed = complete word
    const T = hl => ({ t: "set", label: "trie nodes (● = end of word)", v: nodes.map(x => x.endsWith("$") ? x.slice(0, -1) + " ●" : x), hl });
    const ins = word => {
      let prefix = "";
      for (const c of word) {
        prefix += c;
        if (!nodes.includes(prefix) && !nodes.includes(prefix + "$")) nodes.push(prefix);
      }
      const i = nodes.indexOf(prefix);
      if (i >= 0) nodes[i] = prefix + "$"; else if (!nodes.includes(prefix + "$")) nodes.push(prefix + "$");
    };
    f.add(`A trie stores words one character per edge — shared prefixes share nodes, so lookups cost O(word length), never O(dictionary size).`, 3, [T()]);
    ins("apple");
    f.add(`insert("apple"): create the chain a → ap → app → appl → apple and mark the last node as a word end.`, 9, [T(Object.fromEntries(["a", "ap", "app", "appl", "apple ●"].map(x => [x, "p"])))]);
    f.add(`search("apple"): walk a-p-p-l-e — node exists AND has the end marker → True.`, 13, [T({ "apple ●": "g" })]);
    f.add(`search("app"): the node "app" exists (it's on apple's path) but has NO end marker → False. This is why the marker matters.`, 13, [T({ app: "y" })]);
    f.add(`startsWith("app"): the walk succeeds and that's all a prefix needs → True.`, 16, [T({ app: "g" })]);
    ins("app");
    f.add(`insert("app"): the chain already exists — just flip the end marker on "app".`, 9, [T({ "app ●": "p" })]);
    f.add(`search("app") now → True. Insert, search, and startsWith are all O(k) in the word's length.`, 13, [T({ "app ●": "g" })], true);
    return f;
  },
};

// --------------------------------- Design Add and Search Words Data Structure
VIS["design-add-and-search-words-data-structure"] = {
  inputs: [],
  code: `class WordDictionary:
    def __init__(self):
        self.root = {}

    def addWord(self, word):
        node = self.root
        for c in word:
            node = node.setdefault(c, {})
        node["$"] = True

    def search(self, word):
        def dfs(node, i):
            if i == len(word):
                return "$" in node
            c = word[i]
            if c == ".":
                return any(dfs(child, i + 1)
                           for k, child in node.items()
                           if k != "$")
            return c in node and dfs(node[c], i + 1)
        return dfs(self.root, 0)`,
  gen() {
    const f = mkFrames();
    const words = ["bad", "dad", "mad"];
    const nodes = [];
    for (const w of words) {
      let p = "";
      for (const c of w) { p += c; if (!nodes.includes(p)) nodes.push(p); }
    }
    const T = hl => ({ t: "set", label: "trie nodes (b/d/m branches)", v: nodes, hl });
    f.add(`A plain trie, plus one twist in search: the wildcard '.' fans out into EVERY child via DFS instead of following one edge.`, 5, [T()]);
    f.add(`addWord ×3: "bad", "dad", "mad" — three branches from the root, converging shape a-d below each.`, 9, [T(Object.fromEntries(nodes.map(n => [n, "p"])))]);
    f.add(`search("pad"): the root has no 'p' child — fail immediately. O(k) exact searches are untouched by the wildcard feature.`, 19, [T()]);
    f.add(`search("bad"): b → a → d, end marker present → True.`, 19, [T({ b: "g", ba: "g", bad: "g" })]);
    f.add(`search(".ad"): '.' tries ALL root children — DFS into b, d, and m branches simultaneously.`, 16, [T({ b: "y", d: "y", m: "y" })]);
    f.add(`Each branch continues with "ad": b→ad ✓ — one success is enough → True.`, 16, [T({ bad: "g", dad: "g", mad: "g" })]);
    f.add(`search("b.."): fixed 'b', then two wildcards walk whatever exists below → "bad" matches → True. Worst case O(26^dots · k), fine for few dots.`, 19, [T({ b: "g", ba: "g", bad: "g" })], true);
    return f;
  },
};

// --------------------------------------------------------------- Word Search II
VIS["word-search-ii"] = {
  inputs: [],
  code: `def findWords(board, words):
    trie = {}
    for w in words:            # build a trie of all words
        node = trie
        for c in w:
            node = node.setdefault(c, {})
        node["$"] = w
    res = []
    rows, cols = len(board), len(board[0])
    def dfs(r, c, node):
        ch = board[r][c]
        if ch not in node:
            return             # prune: leaves the trie
        nxt = node[ch]
        if "$" in nxt:
            res.append(nxt.pop("$"))
        board[r][c] = "#"      # mark visited
        for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                dfs(nr, nc, nxt)
        board[r][c] = ch       # unmark
    for r in range(rows):
        for c in range(cols):
            dfs(r, c, trie)
    return res`,
  gen() {
    const f = mkFrames();
    const board = [
      ["o", "a", "a", "n"],
      ["e", "t", "a", "e"],
      ["i", "h", "k", "r"],
    ];
    const words = ["oath", "pea", "eat", "rain"];
    const rows = board.length, cols = board[0].length;
    const trie = {};
    for (const w of words) {
      let node = trie;
      for (const c of w) node = node[c] = node[c] || {};
      node.$ = w;
    }
    const res = [];
    const G = path => {
      const hl = {};
      (path || []).forEach(([r, c], i) => (hl[r + "," + c] = i === (path.length - 1) ? "p" : "w"));
      return { t: "grid", label: "board", v: board, hl };
    };
    const W = hl => ({ t: "set", label: "words (trie built from these)", v: words, hl });
    const R = () => ({ t: "set", label: "found", v: res });
    f.add(`One board walk finds ALL words at once: DFS the grid while walking the words' trie in parallel — leave the trie, prune instantly.`, 7, [G([]), W(), R()]);
    const seen = new Set();
    const dfs = (r, c, node, path) => {
      const ch = board[r][c];
      if (!node[ch]) return;
      const nxt = node[ch];
      const newPath = [...path, [r, c]];
      if (nxt.$ && !seen.has(nxt.$)) {
        seen.add(nxt.$);
        res.push(nxt.$);
        const hl = {};
        newPath.forEach(([rr, cc]) => (hl[rr + "," + cc] = "g"));
        f.add(`The trie path spells a complete word — "${nxt.$}" found along this trail!`, 16, [{ t: "grid", label: "board", v: board, hl }, W({ [nxt.$]: "g" }), R()]);
      } else if (newPath.length <= 2) {
        f.add(`(${r}, ${c}) = '${ch}' continues a trie path ("${newPath.map(([rr, cc]) => board[rr][cc]).join("")}…") — keep exploring its neighbors.`, 14, [G(newPath), W(), R()]);
      }
      const mark = board[r][c];
      board[r][c] = "#";
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc] !== "#") dfs(nr, nc, nxt, newPath);
      }
      board[r][c] = mark;
    };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) dfs(r, c, trie, []);
    f.add(`Found ${res.length} word(s): ${res.join(", ")}. The trie pruned every path not leading to a word — that's the whole trick.`, 26, [G([]), W(Object.fromEntries(res.map(w => [w, "g"]))), R()], true);
    return f;
  },
};

// ============================ batch 10: backtracking ============================

// ------------------------------------------------------------------ Subsets II
VIS["subsets-ii"] = {
  inputs: [{ name: "nums", label: "nums (may repeat)", type: "arr", def: "[1, 2, 2]", max: 4, min: 1 }],
  code: `def subsetsWithDup(nums):
    nums.sort()
    res = []
    def dfs(i, cur):
        res.append(cur[:])
        for j in range(i, len(nums)):
            if j > i and nums[j] == nums[j - 1]:
                continue   # skip duplicate sibling
            cur.append(nums[j])
            dfs(j + 1, cur)
            cur.pop()
    dfs(0, [])
    return res`,
  gen(nums) {
    const f = mkFrames();
    nums = [...nums].sort((a, b) => a - b);
    const res = [];
    const A = hl => ({ t: "arr", label: "nums (sorted)", v: nums, hl });
    const C = cur => ({ t: "set", label: "current", v: cur.length ? cur : ["∅"] });
    const R = hl => ({ t: "set", label: "res", v: res.map(s => `[${s.join(",")}]`), hl });
    f.add(`Sort first so duplicates sit together. Then at each depth, equal SIBLINGS are skipped — using the second '2' where the first was declined would rebuild the same subset.`, 2, [A({}), C([]), R()]);
    const dfs = (i, cur) => {
      res.push([...cur]);
      f.add(`Record [${cur.join(", ") || "∅"}].`, 5, [A({}), C(cur), R({ [`[${cur.join(",")}]`]: "g" })]);
      for (let j = i; j < nums.length; j++) {
        if (j > i && nums[j] === nums[j - 1]) {
          f.add(`nums[${j}] = ${nums[j]} repeats its sibling — skipping avoids a duplicate subset.`, 8, [A({ [j]: "d", [j - 1]: "y" }), C(cur), R()]);
          continue;
        }
        cur.push(nums[j]);
        dfs(j + 1, cur);
        cur.pop();
      }
    };
    dfs(0, []);
    f.add(`${res.length} unique subsets — duplicates never even got generated. O(n · 2ⁿ) worst case.`, 13, [A({}), C([]), R()], true);
    return f;
  },
};

// ------------------------------------------------------------ Combination Sum II
VIS["combination-sum-ii"] = {
  inputs: [
    { name: "candidates", label: "candidates (may repeat)", type: "arr", def: "[1, 2, 2, 2, 5]", max: 6, min: 1 },
    { name: "target", label: "target", type: "int", def: "5", min: 1, max: 12 },
  ],
  code: `def combinationSum2(candidates, target):
    candidates.sort()
    res = []
    def dfs(i, cur, remaining):
        if remaining == 0:
            res.append(cur[:])
            return
        for j in range(i, len(candidates)):
            if j > i and candidates[j] == candidates[j-1]:
                continue   # skip duplicate sibling
            if candidates[j] > remaining:
                break      # sorted: rest is bigger too
            cur.append(candidates[j])
            dfs(j + 1, cur, remaining - candidates[j])
            cur.pop()
    dfs(0, [], target)
    return res`,
  gen(candidates, target) {
    const f = mkFrames();
    candidates = candidates.map(c => Math.max(1, c)).sort((a, b) => a - b);
    const res = [];
    const A = hl => ({ t: "arr", label: "candidates (sorted)", v: candidates, hl });
    const st = (cur, rem) => [{ t: "set", label: "current", v: cur.length ? cur : ["∅"] }, { t: "vars", entries: [["remaining", rem]] }, { t: "set", label: "res", v: res.map(c => `[${c.join("+")}]`) }];
    f.add(`Like Combination Sum, but each candidate is single-use (advance to j+1) and duplicate siblings are skipped after sorting.`, 2, [A({}), ...st([], target)]);
    const dfs = (i, cur, rem) => {
      if (rem === 0) {
        res.push([...cur]);
        f.add(`Remaining hit 0 — [${cur.join(" + ")}] = ${target}!`, 6, [A({}), ...st(cur, rem)]);
        return;
      }
      for (let j = i; j < candidates.length; j++) {
        if (j > i && candidates[j] === candidates[j - 1]) {
          f.add(`candidates[${j}] = ${candidates[j]} repeats its sibling at this depth — skip to avoid duplicate combinations.`, 10, [A({ [j]: "d", [j - 1]: "y" }), ...st(cur, rem)]);
          continue;
        }
        if (candidates[j] > rem) {
          f.add(`${candidates[j]} > remaining ${rem}, and the array is sorted — everything after is too big. Break.`, 12, [A({ [j]: "r" }), ...st(cur, rem)]);
          break;
        }
        f.add(`Take ${candidates[j]} → [${[...cur, candidates[j]].join(", ")}], remaining ${rem - candidates[j]}.`, 14, [A({ [j]: "p" }), ...st([...cur, candidates[j]], rem - candidates[j])]);
        cur.push(candidates[j]);
        dfs(j + 1, cur, rem - candidates[j]);
        cur.pop();
      }
    };
    dfs(0, [], target);
    f.add(`${res.length} unique combination(s): ${res.map(c => `[${c.join("+")}]`).join(" ") || "none"}.`, 17, [A({}), ...st([], 0)], true);
    return f;
  },
};

// ------------------------------------------------------------------ Word Search
VIS["word-search"] = {
  inputs: [{ name: "word", label: "word", type: "str", def: "ABCCED", max: 8 }],
  code: `def exist(board, word):
    rows, cols = len(board), len(board[0])
    def dfs(r, c, i):
        if i == len(word):
            return True
        if (r < 0 or r >= rows or c < 0 or c >= cols
                or board[r][c] != word[i]):
            return False
        board[r][c] = "#"    # mark visited
        found = (dfs(r+1, c, i+1) or dfs(r-1, c, i+1) or
                 dfs(r, c+1, i+1) or dfs(r, c-1, i+1))
        board[r][c] = word[i]  # unmark
        return found
    for r in range(rows):
        for c in range(cols):
            if dfs(r, c, 0):
                return True
    return False`,
  gen(word) {
    const f = mkFrames();
    word = word.toUpperCase();
    const board = [
      ["A", "B", "C", "E"],
      ["S", "F", "C", "S"],
      ["A", "D", "E", "E"],
    ];
    const rows = board.length, cols = board[0].length;
    const G = (path, extra) => {
      const hl = {};
      (path || []).forEach(([r, c], i) => (hl[r + "," + c] = i === path.length - 1 ? "p" : "w"));
      Object.assign(hl, extra || {});
      return { t: "grid", label: "board", v: board, hl };
    };
    const W = i => ({ t: "arr", label: "word", v: [...word], hl: Object.fromEntries([...word].map((_, x) => [x, x < i ? "g" : undefined]).filter(([, c]) => c)), ch: true });
    f.add(`DFS from every cell: follow the word one letter at a time, marking cells in-use so a path can't reuse them, un-marking on backtrack.`, 3, [G([]), W(0)]);
    let frames = 0;
    const dfs = (r, c, i, path) => {
      if (i === word.length) return true;
      if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== word[i]) return false;
      const newPath = [...path, [r, c]];
      if (frames++ < 18) {
        f.add(`(${r}, ${c}) = '${board[r][c]}' matches word[${i}] — extend the path (${i + 1}/${word.length} letters).`, 9, [G(newPath), W(i + 1)]);
      }
      const ch = board[r][c];
      board[r][c] = "#";
      const found = dfs(r + 1, c, i + 1, newPath) || dfs(r - 1, c, i + 1, newPath) || dfs(r, c + 1, i + 1, newPath) || dfs(r, c - 1, i + 1, newPath);
      board[r][c] = ch;
      if (found && i === word.length - 1) {
        const hl = {};
        newPath.forEach(([rr, cc]) => (hl[rr + "," + cc] = "g"));
        f.add(`All ${word.length} letters traced without reusing a cell — "${word}" exists! Return True.`, 4, [{ t: "grid", label: "board", v: board, hl }, W(word.length)], true);
      }
      return found;
    };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (dfs(r, c, 0, [])) return f;
      }
    }
    f.add(`No starting cell led to a full trace — "${word}" is not on the board. Return False.`, 18, [G([]), W(0)], true);
    return f;
  },
};

// -------------------------------------------------------- Palindrome Partitioning
VIS["palindrome-partitioning"] = {
  inputs: [{ name: "s", label: "s", type: "str", def: "aab", max: 6 }],
  code: `def partition(s):
    res = []
    def dfs(i, cur):
        if i == len(s):
            res.append(cur[:])
            return
        for j in range(i, len(s)):
            piece = s[i:j+1]
            if piece == piece[::-1]:
                cur.append(piece)
                dfs(j + 1, cur)
                cur.pop()
    dfs(0, [])
    return res`,
  gen(s) {
    const f = mkFrames();
    const res = [];
    const S = (i, j, cls) => {
      const hl = {};
      if (j !== undefined) for (let x = i; x <= j; x++) hl[x] = cls;
      return { t: "arr", label: "s", v: [...s], hl, ch: true };
    };
    const C = cur => ({ t: "set", label: "current pieces", v: cur.length ? cur : ["∅"] });
    const R = hl => ({ t: "set", label: "res", v: res.map(p => `[${p.join("|")}]`), hl });
    f.add(`At each position, try every prefix that is a palindrome, cut there, and recurse on the rest.`, 3, [S(0), C([]), R()]);
    const isPal = str => str === [...str].reverse().join("");
    const dfs = (i, cur) => {
      if (i === s.length) {
        res.push([...cur]);
        f.add(`Reached the end — [${cur.join(" | ")}] is a full palindromic partition!`, 5, [S(0), C(cur), R({ [`[${cur.join("|")}]`]: "g" })]);
        return;
      }
      for (let j = i; j < s.length; j++) {
        const piece = s.slice(i, j + 1);
        if (isPal(piece)) {
          f.add(`"${piece}" (s[${i}..${j}]) is a palindrome — cut here and recurse on "${s.slice(j + 1) || "ε"}".`, 10, [S(i, j, "g"), C([...cur, piece]), R()]);
          cur.push(piece);
          dfs(j + 1, cur);
          cur.pop();
        } else {
          f.add(`"${piece}" is not a palindrome — this cut is not allowed.`, 9, [S(i, j, "r"), C(cur), R()]);
        }
      }
    };
    dfs(0, []);
    f.add(`${res.length} palindromic partition(s) found.`, 14, [S(0), C([]), R()], true);
    return f;
  },
};

// ----------------------------------- Letter Combinations of a Phone Number
VIS["letter-combinations-of-a-phone-number"] = {
  inputs: [{ name: "digits", label: "digits (2-9)", type: "str", def: "23", max: 3 }],
  code: `def letterCombinations(digits):
    if not digits:
        return []
    keys = {"2": "abc", "3": "def", "4": "ghi",
            "5": "jkl", "6": "mno", "7": "pqrs",
            "8": "tuv", "9": "wxyz"}
    res = []
    def dfs(i, cur):
        if i == len(digits):
            res.append(cur)
            return
        for c in keys[digits[i]]:
            dfs(i + 1, cur + c)
    dfs(0, "")
    return res`,
  gen(digits) {
    const f = mkFrames();
    const keys = { 2: "abc", 3: "def", 4: "ghi", 5: "jkl", 6: "mno", 7: "pqrs", 8: "tuv", 9: "wxyz" };
    digits = [...digits].filter(d => keys[d]).join("");
    const res = [];
    const D = i => ({ t: "arr", label: "digits", v: [...digits], hl: i < digits.length ? { [i]: "p" } : {}, ch: true });
    const R = hl => ({ t: "set", label: "res", v: res, hl });
    if (!digits) {
      f.add(`No valid digits (2-9) — return [].`, 3, [R()], true);
      return f;
    }
    f.add(`Each digit maps to 3-4 keypad letters: ${[...digits].map(d => `${d}→"${keys[d]}"`).join(", ")}. DFS picks one letter per digit.`, 7, [D(0), R()]);
    const dfs = (i, cur) => {
      if (i === digits.length) {
        res.push(cur);
        f.add(`"${cur}" is complete — one letter chosen per digit.`, 11, [D(i), R({ [cur]: "g" })]);
        return;
      }
      for (const c of keys[digits[i]]) {
        f.add(`Digit ${digits[i]}: append '${c}' → "${cur + c}".`, 13, [D(i), R()]);
        dfs(i + 1, cur + c);
      }
    };
    dfs(0, "");
    f.add(`All ${res.length} combinations generated (${[...digits].map(d => keys[d].length).join("×")} choices).`, 15, [D(digits.length), R()], true);
    return f;
  },
};

// --------------------------------------------------------------------- N-Queens
VIS["n-queens"] = {
  inputs: [],
  code: `def solveNQueens(n):
    res = []
    cols, diag1, diag2 = set(), set(), set()
    board = [["."] * n for _ in range(n)]
    def dfs(r):
        if r == n:
            res.append(["".join(row) for row in board])
            return
        for c in range(n):
            if (c in cols or r+c in diag1
                    or r-c in diag2):
                continue    # attacked — skip
            cols.add(c); diag1.add(r+c); diag2.add(r-c)
            board[r][c] = "Q"
            dfs(r + 1)
            board[r][c] = "."
            cols.discard(c); diag1.discard(r+c); diag2.discard(r-c)
    dfs(0)
    return res`,
  gen() {
    const f = mkFrames();
    const n = 4;
    const board = Array.from({ length: n }, () => new Array(n).fill("·"));
    const cols = new Set(), d1 = new Set(), d2 = new Set();
    const res = [];
    const G = extra => {
      const hl = {};
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (board[r][c] === "Q") hl[r + "," + c] = "p";
      Object.assign(hl, extra || {});
      return { t: "grid", label: "board (4×4)", v: board, hl };
    };
    const V = () => ({ t: "vars", entries: [["solutions", res.length]] });
    f.add(`Place one queen per row. Three sets — used columns and both diagonal directions — make each safety check O(1).`, 3, [G(), V()]);
    const dfs = r => {
      if (r === n) {
        res.push(board.map(row => row.join("")));
        f.add(`All ${n} rows filled — solution #${res.length} found!`, 7, [G(Object.fromEntries([...Array(n).keys()].map(rr => {
          const cc = board[rr].indexOf("Q");
          return [rr + "," + cc, "g"];
        }))), V()]);
        return;
      }
      for (let c = 0; c < n; c++) {
        if (cols.has(c) || d1.has(r + c) || d2.has(r - c)) continue;
        cols.add(c); d1.add(r + c); d2.add(r - c);
        board[r][c] = "Q";
        f.add(`Row ${r}: column ${c} and both its diagonals are free — place a queen.`, 14, [G({ [r + "," + c]: "y" }), V()]);
        dfs(r + 1);
        board[r][c] = "·";
        cols.delete(c); d1.delete(r + c); d2.delete(r - c);
        if (r < n - 1) f.add(`Backtrack: remove the queen from (${r}, ${c}) and try the next column.`, 16, [G({ [r + "," + c]: "r" }), V()]);
      }
    };
    dfs(0);
    f.add(`${res.length} distinct solutions for n = ${n}. The diagonal sets (r+c and r−c) are the classic trick. O(n!).`, 19, [G(), V()], true);
    return f;
  },
};

// ============================ batch 11: graphs ============================

// ------------------------------------------------------------------ Clone Graph
VIS["clone-graph"] = {
  inputs: [],
  code: `def cloneGraph(node):
    old_to_new = {}
    def dfs(node):
        if node in old_to_new:
            return old_to_new[node]
        copy = Node(node.val)
        old_to_new[node] = copy
        for nei in node.neighbors:
            copy.neighbors.append(dfs(nei))
        return copy
    return dfs(node) if node else None`,
  gen() {
    const f = mkFrames();
    const adj = { 1: [2, 4], 2: [1, 3], 3: [2, 4], 4: [1, 3] };
    const cloned = [];
    const A = hl => ({ t: "kv", label: "graph (node → neighbors)", entries: Object.entries(adj).map(([k, v]) => [k, `[${v.join(", ")}]`]), hl });
    const M = hl => ({ t: "kv", label: "old_to_new", entries: cloned.map(n => [`node ${n}`, `clone ${n}'`]), hl });
    f.add(`The graph has cycles (1-2-3-4-1), so naive copying would recurse forever. The old→new map both breaks cycles and reuses clones.`, 2, [A({}), M()]);
    const dfs = n => {
      if (cloned.includes(n)) {
        f.add(`Node ${n} is already in the map — return its EXISTING clone instead of making another (this is what breaks the cycle).`, 5, [A({ [n]: "y" }), M({ [`node ${n}`]: "y" })]);
        return;
      }
      cloned.push(n);
      f.add(`First visit to node ${n}: create clone ${n}', record it, then recurse into its neighbors [${adj[n].join(", ")}].`, 7, [A({ [n]: "p" }), M({ [`node ${n}`]: "p" })]);
      for (const nei of adj[n]) dfs(nei);
    };
    dfs(1);
    f.add(`All 4 nodes cloned exactly once, with every neighbor pointer translated through the map. O(V + E).`, 11, [A({}), M(Object.fromEntries(cloned.map(n => [`node ${n}`, "g"])))], true);
    return f;
  },
};

// -------------------------------------------------- Pacific Atlantic Water Flow
VIS["pacific-atlantic-water-flow"] = {
  inputs: [],
  code: `def pacificAtlantic(heights):
    rows, cols = len(heights), len(heights[0])
    pac, atl = set(), set()
    def dfs(r, c, seen, prev):
        if (r < 0 or r >= rows or c < 0 or c >= cols
                or (r, c) in seen
                or heights[r][c] < prev):
            return
        seen.add((r, c))
        for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:
            dfs(r + dr, c + dc, seen, heights[r][c])
    for c in range(cols):
        dfs(0, c, pac, 0)          # Pacific: top edge
        dfs(rows - 1, c, atl, 0)   # Atlantic: bottom
    for r in range(rows):
        dfs(r, 0, pac, 0)          # Pacific: left edge
        dfs(r, cols - 1, atl, 0)   # Atlantic: right
    return [[r, c] for r in range(rows)
            for c in range(cols)
            if (r, c) in pac and (r, c) in atl]`,
  gen() {
    const f = mkFrames();
    const heights = [
      [1, 2, 2, 3, 5],
      [3, 2, 3, 4, 4],
      [2, 4, 5, 3, 1],
      [6, 7, 1, 4, 5],
      [5, 1, 1, 2, 4],
    ];
    const rows = heights.length, cols = heights[0].length;
    const flood = starts => {
      const seen = new Set();
      const dfs = (r, c, prev) => {
        if (r < 0 || r >= rows || c < 0 || c >= cols || seen.has(r + "," + c) || heights[r][c] < prev) return;
        seen.add(r + "," + c);
        dfs(r + 1, c, heights[r][c]); dfs(r - 1, c, heights[r][c]);
        dfs(r, c + 1, heights[r][c]); dfs(r, c - 1, heights[r][c]);
      };
      starts.forEach(([r, c]) => dfs(r, c, 0));
      return seen;
    };
    const G = (hlSet, cls, label, extra) => {
      const hl = {};
      hlSet.forEach(k => (hl[k] = cls));
      Object.assign(hl, extra || {});
      return { t: "grid", label, v: heights, hl };
    };
    f.add(`Simulating water downhill from every cell is O((mn)²). Flip it: climb UPHILL from each ocean's border — cells reached by both oceans are the answer.`, 4,
      [G(new Set(), "p", "heights")]);
    const pacStarts = [];
    for (let c = 0; c < cols; c++) pacStarts.push([0, c]);
    for (let r = 0; r < rows; r++) pacStarts.push([r, 0]);
    f.add(`Pacific touches the top and left edges — start uphill DFS from all of them.`, 14,
      [G(new Set(pacStarts.map(([r, c]) => r + "," + c)), "p", "Pacific border cells")]);
    const pac = flood(pacStarts);
    f.add(`Everything the Pacific's water can be traced back FROM (moving to equal-or-higher neighbors): ${pac.size} cells.`, 15, [G(pac, "p", "reaches the Pacific")]);
    const atlStarts = [];
    for (let c = 0; c < cols; c++) atlStarts.push([rows - 1, c]);
    for (let r = 0; r < rows; r++) atlStarts.push([r, cols - 1]);
    const atl = flood(atlStarts);
    f.add(`Same uphill flood from the Atlantic's bottom and right edges: ${atl.size} cells.`, 18, [G(atl, "y", "reaches the Atlantic")]);
    const both = new Set([...pac].filter(k => atl.has(k)));
    f.add(`The intersection — cells whose water can reach BOTH oceans: ${both.size} cells. Two floods → O(m·n).`, 20, [G(both, "g", "reaches both oceans")], true);
    return f;
  },
};

// ------------------------------------------------------------ Surrounded Regions
VIS["surrounded-regions"] = {
  inputs: [],
  code: `def solve(board):
    rows, cols = len(board), len(board[0])
    def dfs(r, c):   # protect border-connected O's
        if (r < 0 or r >= rows or c < 0 or c >= cols
                or board[r][c] != "O"):
            return
        board[r][c] = "S"   # safe
        dfs(r+1, c); dfs(r-1, c)
        dfs(r, c+1); dfs(r, c-1)
    for r in range(rows):
        dfs(r, 0); dfs(r, cols - 1)
    for c in range(cols):
        dfs(0, c); dfs(rows - 1, c)
    for r in range(rows):
        for c in range(cols):
            if board[r][c] == "O":
                board[r][c] = "X"   # captured
            elif board[r][c] == "S":
                board[r][c] = "O"   # restored`,
  gen() {
    const f = mkFrames();
    const board = [
      ["X", "X", "X", "X"],
      ["X", "O", "O", "X"],
      ["X", "X", "O", "X"],
      ["X", "O", "X", "X"],
    ];
    const rows = board.length, cols = board[0].length;
    const G = extra => {
      const hl = {};
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (board[r][c] === "O") hl[r + "," + c] = "y";
        if (board[r][c] === "S") hl[r + "," + c] = "g";
      }
      Object.assign(hl, extra || {});
      return { t: "grid", label: "board (yellow = O, green = safe)", v: board.map(row => row.map(x => (x === "S" ? "O" : x))), hl };
    };
    f.add(`Think in reverse: an 'O' region survives ONLY if it touches the border. Protect those first; everything else gets captured.`, 3, [G()]);
    const dfs = (r, c) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== "O") return;
      board[r][c] = "S";
      f.add(`(${r}, ${c}) connects to the border — mark it safe.`, 7, [G({ [r + "," + c]: "g" })]);
      dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
    };
    for (let r = 0; r < rows; r++) { dfs(r, 0); dfs(r, cols - 1); }
    for (let c = 0; c < cols; c++) { dfs(0, c); dfs(rows - 1, c); }
    f.add(`Border pass done. Every remaining 'O' is fully enclosed — flip them to 'X', restore the safe cells to 'O'.`, 14, [G()]);
    const flipped = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (board[r][c] === "O") { board[r][c] = "X"; flipped.push(r + "," + c); }
      else if (board[r][c] === "S") board[r][c] = "O";
    }
    f.add(`Captured ${flipped.length} enclosed cell(s); the border-connected region at the bottom survived. O(m·n).`, 19,
      [{ t: "grid", label: "result", v: board, hl: { ...Object.fromEntries(flipped.map(k => [k, "r"])), ...Object.fromEntries([].concat(...board.map((row, r) => row.map((x, c) => (x === "O" ? [r + "," + c, "g"] : null)).filter(Boolean)))) } }], true);
    return f;
  },
};

// ------------------------------------------------------------- Walls and Gates
VIS["walls-and-gates"] = {
  inputs: [],
  code: `def wallsAndGates(rooms):
    rows, cols = len(rooms), len(rooms[0])
    queue = deque()
    for r in range(rows):
        for c in range(cols):
            if rooms[r][c] == 0:       # gates
                queue.append((r, c))
    dist = 0
    while queue:
        dist += 1
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for dr, dc in [(1,0),(-1,0),(0,1),(0,-1)]:
                nr, nc = r + dr, c + dc
                if (0 <= nr < rows and 0 <= nc < cols
                        and rooms[nr][nc] == INF):
                    rooms[nr][nc] = dist
                    queue.append((nr, nc))`,
  gen() {
    const f = mkFrames();
    const INF = "∞";
    const rooms = [
      [INF, -1, 0, INF],
      [INF, INF, INF, -1],
      [INF, -1, INF, -1],
      [0, -1, INF, INF],
    ];
    const rows = rooms.length, cols = rooms[0].length;
    const G = extra => {
      const hl = {};
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (rooms[r][c] === -1) hl[r + "," + c] = "d";
        else if (rooms[r][c] === 0) hl[r + "," + c] = "p";
      }
      Object.assign(hl, extra || {});
      return { t: "grid", label: "rooms (dim = wall, blue = gate)", v: rooms.map(row => row.map(x => (x === -1 ? "▦" : x))), hl };
    };
    let queue = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (rooms[r][c] === 0) queue.push([r, c]);
    f.add(`One BFS from ALL gates at once (multi-source): the first wave to reach a room is, by BFS's nature, the nearest gate's.`, 7, [G()]);
    let dist = 0;
    while (queue.length) {
      dist++;
      const next = [];
      const filled = [];
      for (const [r, c] of queue) {
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && rooms[nr][nc] === INF) {
            rooms[nr][nc] = dist;
            next.push([nr, nc]);
            filled.push(nr + "," + nc);
          }
        }
      }
      if (filled.length) {
        f.add(`Wave ${dist}: ${filled.length} room(s) get distance ${dist} — their nearest gate is ${dist} step(s) away.`, 17,
          [G(Object.fromEntries(filled.map(k => [k, "g"])))]);
      }
      queue = next;
    }
    f.add(`Every reachable room is filled with its distance to the nearest gate — one pass, O(m·n).`, 18, [G()], true);
    return f;
  },
};

// ---------------------------------------------------------- Course Schedule II
VIS["course-schedule-ii"] = {
  inputs: [],
  code: `def findOrder(numCourses, prerequisites):
    adj = defaultdict(list)
    indeg = [0] * numCourses
    for course, pre in prerequisites:
        adj[pre].append(course)
        indeg[course] += 1
    queue = deque(i for i in range(numCourses)
                  if indeg[i] == 0)
    order = []
    while queue:
        c = queue.popleft()
        order.append(c)
        for nxt in adj[c]:
            indeg[nxt] -= 1
            if indeg[nxt] == 0:
                queue.append(nxt)
    return order if len(order) == numCourses else []`,
  gen() {
    const f = mkFrames();
    const numCourses = 4;
    const prereqs = [[1, 0], [2, 0], [3, 1], [3, 2]];
    const adj = {};
    const indeg = new Array(numCourses).fill(0);
    for (const [course, pre] of prereqs) {
      (adj[pre] = adj[pre] || []).push(course);
      indeg[course]++;
    }
    const order = [];
    let queue = indeg.map((d, i) => (d === 0 ? i : -1)).filter(i => i >= 0);
    const C = () => [
      { t: "kv", label: "prerequisite → unlocks", entries: Object.entries(adj).map(([k, v]) => [k, `[${v.join(", ")}]`]) },
      { t: "arr", label: "indegree", v: indeg, hl: Object.fromEntries(indeg.map((d, i) => [i, d === 0 && !order.includes(i) ? "g" : undefined]).filter(([, c]) => c)) },
      { t: "arr", label: "order", v: order.length ? order : ["·"], hl: {} },
    ];
    f.add(`Same as Course Schedule, but this time the ORDER of taking courses IS the answer — record each course as its indegree hits 0.`, 7, C());
    while (queue.length) {
      const c = queue.shift();
      order.push(c);
      const released = [];
      for (const nxt of adj[c] || []) {
        indeg[nxt]--;
        if (indeg[nxt] === 0) { queue.push(nxt); released.push(nxt); }
      }
      f.add(`Take course ${c} → order so far [${order.join(", ")}].${released.length ? ` Course(s) ${released.join(", ")} now have no unmet prerequisites.` : ""}`, 12, C());
    }
    f.add(order.length === numCourses
      ? `Valid order: [${order.join(", ")}] — a topological sort of the prerequisite DAG. O(V + E).`
      : `Only ${order.length}/${numCourses} scheduled — a cycle blocks the rest. Return [].`, 17, C(), true);
    return f;
  },
};

// ------------------------------------------------------- Redundant Connection
VIS["redundant-connection"] = {
  inputs: [],
  code: `def findRedundantConnection(edges):
    parent = list(range(len(edges) + 1))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # compress
            x = parent[x]
        return x
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb:
            return [a, b]  # already connected!
        parent[ra] = rb
    return []`,
  gen() {
    const f = mkFrames();
    const edges = [[1, 2], [2, 3], [3, 4], [1, 4], [1, 5]];
    const parent = [...Array(edges.length + 2).keys()];
    const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const E = hl => ({ t: "arr", label: "edges (in given order)", v: edges.map(([a, b]) => `${a}-${b}`), hl });
    const P = hl => ({ t: "arr", label: "parent (Union-Find, index = node)", v: parent.slice(1), hl });
    f.add(`A tree plus one extra edge — Union-Find processes edges in order; the first edge whose endpoints are ALREADY connected closes the cycle.`, 2, [E({}), P({})]);
    for (let i = 0; i < edges.length; i++) {
      const [a, b] = edges[i];
      const ra = find(a), rb = find(b);
      if (ra === rb) {
        f.add(`Edge ${a}-${b}: find(${a}) = find(${b}) = ${ra} — they're already in the same component, so this edge creates the cycle. Return [${a}, ${b}].`, 11,
          [E({ [i]: "r" }), P({ [ra - 1]: "r" })], true);
        return f;
      }
      parent[ra] = rb;
      f.add(`Edge ${a}-${b}: roots ${ra} and ${rb} differ — union them (parent[${ra}] = ${rb}).`, 12, [E({ [i]: "g" }), P({ [ra - 1]: "y" })]);
    }
    f.add(`No cycle found.`, 13, [E({}), P({})], true);
    return f;
  },
};

// --------------------------- Number of Connected Components in an Undirected Graph
VIS["number-of-connected-components-in-an-undirected-graph"] = {
  inputs: [],
  code: `def countComponents(n, edges):
    parent = list(range(n))
    count = n
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb
            count -= 1
    return count`,
  gen() {
    const f = mkFrames();
    const n = 5;
    const edges = [[0, 1], [1, 2], [3, 4]];
    const parent = [...Array(n).keys()];
    let count = n;
    const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const E = hl => ({ t: "arr", label: "edges", v: edges.map(([a, b]) => `${a}-${b}`), hl });
    const P = hl => ({ t: "arr", label: "parent (index = node)", v: parent, hl });
    const V = () => ({ t: "vars", entries: [["components", count]] });
    f.add(`Start with ${n} isolated nodes = ${n} components. Every union that actually merges two different roots reduces the count by one.`, 3, [E({}), P({}), V()]);
    edges.forEach(([a, b], i) => {
      const ra = find(a), rb = find(b);
      if (ra !== rb) {
        parent[ra] = rb;
        count--;
        f.add(`Edge ${a}-${b}: different roots (${ra} vs ${rb}) — merge them. Components: ${count}.`, 12, [E({ [i]: "g" }), P({ [ra]: "y" }), V()]);
      } else {
        f.add(`Edge ${a}-${b}: same root ${ra} — already connected, count unchanged.`, 10, [E({ [i]: "d" }), P({}), V()]);
      }
    });
    f.add(`${count} connected components remain: {0,1,2} and {3,4}. O(E · α(n)) — effectively linear.`, 14, [E({}), P({}), V()], true);
    return f;
  },
};

// ------------------------------------------------------------ Graph Valid Tree
VIS["graph-valid-tree"] = {
  inputs: [],
  code: `def validTree(n, edges):
    if len(edges) != n - 1:
        return False       # a tree has exactly n-1 edges
    parent = list(range(n))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x
    for a, b in edges:
        ra, rb = find(a), find(b)
        if ra == rb:
            return False   # cycle
        parent[ra] = rb
    return True  # n-1 edges + acyclic = connected tree`,
  gen() {
    const f = mkFrames();
    const n = 5;
    const edges = [[0, 1], [0, 2], [0, 3], [1, 4]];
    const parent = [...Array(n).keys()];
    const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const E = hl => ({ t: "arr", label: "edges", v: edges.map(([a, b]) => `${a}-${b}`), hl });
    const P = hl => ({ t: "arr", label: "parent (index = node)", v: parent, hl });
    f.add(`A tree needs BOTH: exactly n−1 edges (here ${edges.length} = ${n}−1 ✓) and no cycle. Given the count, acyclic also forces connected.`, 2, [E({}), P({})]);
    for (let i = 0; i < edges.length; i++) {
      const [a, b] = edges[i];
      const ra = find(a), rb = find(b);
      if (ra === rb) {
        f.add(`Edge ${a}-${b} joins two already-connected nodes — a cycle. Not a tree.`, 13, [E({ [i]: "r" }), P({})], true);
        return f;
      }
      parent[ra] = rb;
      f.add(`Edge ${a}-${b}: distinct roots, union them.`, 14, [E({ [i]: "g" }), P({ [ra]: "y" })]);
    }
    f.add(`${edges.length} unions, zero cycles — with exactly n−1 edges that guarantees one connected component: a valid tree. Return True.`, 15, [E({}), P({})], true);
    return f;
  },
};

// ------------------------------------------------------------------ Word Ladder
VIS["word-ladder"] = {
  inputs: [],
  code: `def ladderLength(beginWord, endWord, wordList):
    words = set(wordList)
    if endWord not in words:
        return 0
    queue = deque([beginWord])
    steps = 1
    while queue:
        for _ in range(len(queue)):
            w = queue.popleft()
            if w == endWord:
                return steps
            for i in range(len(w)):
                for c in "abcdefghijklmnopqrstuvwxyz":
                    nxt = w[:i] + c + w[i+1:]
                    if nxt in words:
                        words.remove(nxt)
                        queue.append(nxt)
        steps += 1
    return 0`,
  gen() {
    const f = mkFrames();
    const beginWord = "hit", endWord = "cog";
    const words = new Set(["hot", "dot", "dog", "lot", "log", "cog"]);
    const W = hl => ({ t: "set", label: "unvisited words", v: [...words], hl });
    let queue = [beginWord];
    let steps = 1;
    const Q = hl => ({ t: "set", label: `BFS frontier (step ${steps})`, v: queue, hl });
    const V = () => ({ t: "vars", entries: [["steps", steps], ["target", endWord]] });
    f.add(`Words are graph nodes; an edge = one letter of difference. BFS finds the SHORTEST chain — each frontier is one transformation deeper.`, 5, [Q({ [beginWord]: "p" }), W(), V()]);
    let guard = 0;
    while (queue.length && guard++ < 10) {
      if (queue.includes(endWord)) {
        f.add(`"${endWord}" is in the frontier — reached in ${steps} steps: the shortest ladder has ${steps} words. Return ${steps}.`, 11, [Q({ [endWord]: "g" }), W(), V()], true);
        return f;
      }
      const next = [];
      const found = [];
      for (const w of queue) {
        for (let i = 0; i < w.length; i++) {
          for (let ci = 0; ci < 26; ci++) {
            const nxt = w.slice(0, i) + String.fromCharCode(97 + ci) + w.slice(i + 1);
            if (words.has(nxt)) {
              words.delete(nxt);
              next.push(nxt);
              found.push(nxt);
            }
          }
        }
      }
      f.add(`Frontier [${queue.join(", ")}] expands: one-letter neighbors still unvisited are [${found.join(", ") || "none"}]. Each is removed from the pool (first visit = shortest).`, 17,
        [Q(Object.fromEntries(queue.map(w => [w, "p"]))), W(Object.fromEntries(found.map(w => [w, "y"]))), V()]);
      queue = next;
      steps++;
    }
    f.add(`Frontier emptied before reaching "${endWord}" — no ladder exists. Return 0.`, 20, [Q({}), W(), V()], true);
    return f;
  },
};
