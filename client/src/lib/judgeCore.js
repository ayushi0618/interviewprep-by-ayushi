// judgeCore.js — the DSA judge's shared brain: pure helpers + test runner
// semantics used IDENTICALLY in two places:
//   • scripts/verify-sheet.mjs (Node) — proves every reference solution
//     passes every authored test before the data ships.
//   • components' browser judge (lib/judge.js) — embeds JUDGE_FRAME_SOURCE
//     into the sandboxed iframe that runs learner code.
//
// IMPORTANT: every helper below is a standalone function declaration that
// only references the other helpers by name. That is what lets judge.js
// stringify them (fn.toString()) into the iframe with semantics that can
// never drift from what verify-sheet tested. No imports, no closures over
// module state — keep it that way.

export function deepClone(value) {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(deepClone);
  const out = {};
  for (const k of Object.keys(value)) out[k] = deepClone(value[k]);
  return out;
}

export function deepEqual(a, b) {
  if (typeof a === 'number' && typeof b === 'number') {
    return a === b || (Number.isNaN(a) && Number.isNaN(b));
  }
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (const k of ka) {
    if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
    if (!deepEqual(a[k], b[k])) return false;
  }
  return true;
}

// Normalizers make "same answer, different order" fair where the problem
// allows any order. Applied to BOTH the learner's answer and the expected
// value before comparing.
export function applyNormalize(value, mode) {
  if (!mode || mode === 'none' || value === null || typeof value !== 'object') return value;
  if (mode === 'sortArray' && Array.isArray(value)) {
    return [...value].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
  }
  if (mode === 'sortGroups' && Array.isArray(value)) {
    // e.g. grouped anagrams: sort inside each group, then sort the groups.
    return value
      .map((g) => (Array.isArray(g) ? [...g].sort() : g))
      .sort((x, y) => {
        const sx = Array.isArray(x) ? x.join('') : String(x);
        const sy = Array.isArray(y) ? y.join('') : String(y);
        return sx < sy ? -1 : sx > sy ? 1 : 0;
      });
  }
  if (mode === 'sortTriplets' && Array.isArray(value)) {
    // e.g. 3Sum: sort inside each triplet, then sort the triplet list.
    return value
      .map((t) => (Array.isArray(t) ? [...t].sort((a, b) => a - b) : t))
      .sort((x, y) => {
        if (!Array.isArray(x) || !Array.isArray(y)) return 0;
        for (let i = 0; i < Math.min(x.length, y.length); i++) {
          if (x[i] !== y[i]) return x[i] - y[i];
        }
        return x.length - y.length;
      });
  }
  return value;
}

// --- linked lists -----------------------------------------------------------
// Node shape: { val, next }. Tests author plain arrays; the harness builds
// real nodes so learners genuinely reverse/merge pointers.
export function buildList(arr, pos) {
  if (!arr || arr.length === 0) return null;
  const nodes = arr.map((v) => ({ val: v, next: null }));
  for (let i = 0; i < nodes.length - 1; i++) nodes[i].next = nodes[i + 1];
  if (typeof pos === 'number' && pos >= 0 && pos < nodes.length) {
    nodes[nodes.length - 1].next = nodes[pos]; // cycle tail (hasCycle tests)
  }
  return nodes[0];
}

export function listToArray(head) {
  const out = [];
  let cur = head;
  let guard = 0;
  while (cur && guard < 100000) {
    out.push(cur.val);
    cur = cur.next;
    guard++;
  }
  return out;
}

// --- binary trees -------------------------------------------------------------
// Level-order arrays (LeetCode style): [3, 9, 20, null, null, 15, 7].
export function buildTree(arr) {
  if (!arr || arr.length === 0 || arr[0] === null || arr[0] === undefined) return null;
  const root = { val: arr[0], left: null, right: null };
  const queue = [root];
  let i = 1;
  while (queue.length > 0 && i < arr.length) {
    const node = queue.shift();
    const leftVal = arr[i++];
    if (leftVal !== null && leftVal !== undefined) {
      node.left = { val: leftVal, left: null, right: null };
      queue.push(node.left);
    }
    if (i < arr.length) {
      const rightVal = arr[i++];
      if (rightVal !== null && rightVal !== undefined) {
        node.right = { val: rightVal, left: null, right: null };
        queue.push(node.right);
      }
    }
  }
  return root;
}

export function treeToArray(root) {
  if (!root) return [];
  const out = [];
  const queue = [root];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === null) {
      out.push(null);
    } else {
      out.push(node.val);
      queue.push(node.left);
      queue.push(node.right);
    }
  }
  while (out.length > 0 && out[out.length - 1] === null) out.pop();
  return out;
}

// Run ONE test and shape the learner's return value into a plain value
// that deepEqual can compare against the authored `expected`.
//   kind 'plain'       → fn(...args), compare the return value
//   kind 'linkedlist'  → array args are built into real {val,next} lists
//                        (ALL of them — e.g. merge two lists gets two
//                        heads), array out
//   kind 'cycle'       → args = [array, pos]; returns boolean
//   kind 'tree-value'  → args[0] is a level-order array → tree in, raw value out
//   kind 'tree-return' → tree in, tree out (serialized back to level-order)
//   kind 'kprefix'     → fn mutates args[0] and returns k; compare
//                        { k, prefix: mutatedArgs[0].slice(0, k) }
export function computeGot(kind, fn, rawArgs) {
  const args = deepClone(rawArgs || []);
  if (kind === 'linkedlist') {
    // Every array argument becomes a real linked list, so textbook code
    // (list1.val, list2.next, …) just works; the returned head is
    // serialized back to a plain array for comparison.
    const listArgs = args.map((a) => (Array.isArray(a) ? buildList(a) : a));
    const result = fn(...listArgs);
    return listToArray(result);
  }
  if (kind === 'cycle') {
    const head = buildList(args[0], args[1]);
    return fn(head);
  }
  if (kind === 'tree-value') {
    const root = buildTree(args[0]);
    return fn(root, ...args.slice(1));
  }
  if (kind === 'tree-return') {
    const root = buildTree(args[0]);
    return treeToArray(fn(root, ...args.slice(1)));
  }
  if (kind === 'kprefix') {
    const arr = args[0];
    const k = fn(arr, ...args.slice(1));
    return { k, prefix: arr.slice(0, k) };
  }
  return fn(...args);
}

// Everything the iframe needs, as source text. judge.js inlines this into
// the runner srcDoc; verify-sheet.mjs evaluates the very same string in
// Node — one semantics, two homes, zero drift.
export const JUDGE_FRAME_SOURCE = [
  deepClone, deepEqual, applyNormalize,
  buildList, listToArray, buildTree, treeToArray, computeGot,
].map((f) => f.toString()).join('\n\n');
