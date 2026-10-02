// dsaExtra1.js — Extra DSA Sheet problem bank for InterviewPrep by Ayushi.
// 20 hand-authored problems. Coordinator merges these into the main sheet.
// Tests are proven by a throwaway checker against judgeCore semantics.

export const EXTRA_PROBLEMS = [
  // ---------------------------------------------------------------- Arrays
  {
    id: 'majority-element',
    topic: 'arrays',
    title: 'Majority Element',
    difficulty: 'Easy',
    statement: 'Given a list of numbers, find the value that shows up more than half of the time. A majority value is guaranteed to exist, so you do not need to handle the case where there is none.',
    examples: [
      { input: 'nums = [3,2,3]', output: '3', explanation: 'The value 3 appears twice out of three entries.' },
      { input: 'nums = [2,2,1,1,1,2,2]', output: '2', explanation: 'The value 2 appears four times out of seven entries.' },
    ],
    constraints: '1 <= nums.length <= 5 * 10^4 · -10^9 <= nums[i] <= 10^9 · a majority element always exists',
    fn: 'majorityElement',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// majorityElement(nums) -> value that appears more than n/2 times
function majorityElement(nums) {
  // TODO: keep a candidate and a balance that cancels out other values
}`,
    hints: [
      'If you pair up different values and throw both away, what kind of value can possibly survive?',
      'Keep one candidate and a counter. Raise the counter for matching values, lower it for others, and replace the candidate when the counter hits zero.',
    ],
    explanation: 'A majority value appears more often than all other values combined, so canceling pairs of different values can never remove every copy of it. We keep a candidate and a balance: matching values increase the balance, different values decrease it, and when the balance reaches zero the next value becomes the new candidate. The candidate left at the end must be the majority value.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function majorityElement(nums) {
  let candidate = null;
  let balance = 0;
  for (const n of nums) {
    if (balance === 0) {
      candidate = n;
      balance = 1;
    } else if (n === candidate) {
      balance++;
    } else {
      balance--;
    }
  }
  return candidate;
}`,
    visibleTests: [
      { args: [[3, 2, 3]], expected: 3 },
      { args: [[2, 2, 1, 1, 1, 2, 2]], expected: 2 },
    ],
    hiddenTests: [
      { args: [[1]], expected: 1 },
      { args: [[6, 5, 5]], expected: 5 },
      { args: [[1, 1, 2, 2, 2, 1, 1]], expected: 1 },
      { args: [[8, 8, 8, 9, 9]], expected: 8 },
    ],
  },
  {
    id: 'rotate',
    topic: 'arrays',
    title: 'Rotate Array',
    difficulty: 'Medium',
    statement: 'Given an array and a step count k, shift every element k places to the right, with elements that fall off the end wrapping around to the front. Rearrange the given array itself and return it when you are done.',
    examples: [
      { input: 'nums = [1,2,3,4,5,6,7], k = 3', output: '[5, 6, 7, 1, 2, 3, 4]', explanation: 'The last three values wrap around to the front in the same order.' },
      { input: 'nums = [-1,-100,3,99], k = 2', output: '[3, 99, -1, -100]', explanation: 'The last two values move to the front.' },
    ],
    constraints: '1 <= nums.length <= 10^5 · -2^31 <= nums[i] <= 2^31 - 1 · 0 <= k <= 10^5',
    fn: 'rotate',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// rotate(nums, k) -> rotates nums right by k steps in place and must return nums
function rotate(nums, k) {
  // TODO: reduce k, then use reversals to bring the tail to the front, then return nums
}`,
    hints: [
      'Rotating by the full length changes nothing. What should you do with a k that is larger than the array?',
      'Reverse the whole array, then reverse the first k values and the remaining values separately.',
    ],
    explanation: 'Only k modulo the length matters, because full turns restore the original order. Reversing the whole array brings the last k values to the front but in reverse order, so we reverse that front block to fix its order and then reverse the rest of the array to restore the order of the remaining values. Three reversals achieve the rotation in place, and we return the array as required.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function rotate(nums, k) {
  const n = nums.length;
  if (n === 0) return nums;
  k = k % n;
  const reverse = (left, right) => {
    while (left < right) {
      [nums[left], nums[right]] = [nums[right], nums[left]];
      left++;
      right--;
    }
  };
  reverse(0, n - 1);
  reverse(0, k - 1);
  reverse(k, n - 1);
  return nums;
}`,
    visibleTests: [
      { args: [[1, 2, 3, 4, 5, 6, 7], 3], expected: [5, 6, 7, 1, 2, 3, 4] },
      { args: [[-1, -100, 3, 99], 2], expected: [3, 99, -1, -100] },
    ],
    hiddenTests: [
      { args: [[1, 2], 3], expected: [2, 1] },
      { args: [[1], 5], expected: [1] },
      { args: [[1, 2, 3], 0], expected: [1, 2, 3] },
      { args: [[1, 2, 3, 4], 4], expected: [1, 2, 3, 4] },
    ],
  },
  // ---------------------------------------------------------------- Strings
  {
    id: 'longest-palindromic-substring',
    topic: 'strings',
    title: 'Longest Palindromic Substring',
    difficulty: 'Medium',
    statement: 'Given a string, find the longest contiguous part that reads the same forwards and backwards and return that part. The test cases are crafted so the longest such part is unique.',
    examples: [
      { input: 's = "cbbd"', output: '"bb"', explanation: 'The middle pair forms the longest palindromic part.' },
      { input: 's = "banana"', output: '"anana"', explanation: 'The stretch starting at index 1 reads the same in both directions.' },
    ],
    constraints: '1 <= s.length <= 1000 · s contains lowercase English letters and digits',
    fn: 'longestPalindrome',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// longestPalindrome(s) -> longest palindromic substring of s
function longestPalindrome(s) {
  // TODO: grow outward from every possible center and remember the best span
}`,
    hints: [
      'A palindrome grows symmetrically around its center. How many centers does a string of length n have if you count the gaps between characters?',
      'Try every center, both on a character and between two characters, expand while the ends match, and keep the longest span found.',
    ],
    explanation: 'Every palindrome has a center, either on one character for odd lengths or between two characters for even lengths. We try each center and expand outward while the mirrored characters match, which traces the largest palindrome for that center. Keeping the best span across all centers gives the overall answer, and uniqueness in the tests means ties never need a tie-break rule.',
    complexity: 'Time O(n^2) · Space O(1)',
    solutionCode: `function longestPalindrome(s) {
  if (s.length === 0) return '';
  let bestStart = 0;
  let bestLen = 1;
  const expand = (left, right) => {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      if (right - left + 1 > bestLen) {
        bestStart = left;
        bestLen = right - left + 1;
      }
      left--;
      right++;
    }
  };
  for (let i = 0; i < s.length; i++) {
    expand(i, i);
    expand(i, i + 1);
  }
  return s.slice(bestStart, bestStart + bestLen);
}`,
    visibleTests: [
      { args: ['cbbd'], expected: 'bb' },
      { args: ['banana'], expected: 'anana' },
    ],
    hiddenTests: [
      { args: ['abba'], expected: 'abba' },
      { args: ['aaaa'], expected: 'aaaa' },
      { args: ['xyzzy'], expected: 'yzzy' },
      { args: ['noon'], expected: 'noon' },
    ],
  },
  {
    id: 'palindromic-substrings',
    topic: 'strings',
    title: 'Palindromic Substrings',
    difficulty: 'Medium',
    statement: 'Given a string, count how many of its contiguous parts read the same forwards and backwards. Parts that sit at different positions count separately even when their text is identical.',
    examples: [
      { input: 's = "abc"', output: '3', explanation: 'Only the three single characters qualify.' },
      { input: 's = "aaa"', output: '6', explanation: 'Three single letters, two copies of the length-2 block, and the whole string.' },
    ],
    constraints: '1 <= s.length <= 1000 · s contains lowercase English letters',
    fn: 'countSubstrings',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// countSubstrings(s) -> number of palindromic substrings in s
function countSubstrings(s) {
  // TODO: expand from every center and count each palindrome you meet
}`,
    hints: [
      'Instead of checking every substring from scratch, can you grow palindromes outward from their centers?',
      'For each center, expand while the ends match and add one to the count for every successful step.',
    ],
    explanation: 'Each palindromic substring has a center, on a character or between two characters. Expanding outward from a center visits exactly the palindromes for that center, one per successful expansion step. Summing the successful steps over all odd and even centers counts every palindromic substring exactly once, because position is part of the identity of a substring.',
    complexity: 'Time O(n^2) · Space O(1)',
    solutionCode: `function countSubstrings(s) {
  let count = 0;
  const expand = (left, right) => {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      count++;
      left--;
      right++;
    }
  };
  for (let i = 0; i < s.length; i++) {
    expand(i, i);
    expand(i, i + 1);
  }
  return count;
}`,
    visibleTests: [
      { args: ['abc'], expected: 3 },
      { args: ['aaa'], expected: 6 },
    ],
    hiddenTests: [
      { args: ['aaaa'], expected: 10 },
      { args: ['abba'], expected: 6 },
      { args: ['x'], expected: 1 },
      { args: ['abca'], expected: 4 },
    ],
  },
  {
    id: 'string-compression',
    topic: 'strings',
    title: 'String Compression',
    difficulty: 'Medium',
    statement: 'You are given an array of single characters. Compress it in place by replacing each run of the same character with the character followed by the run length when the length is greater than one. A length of ten or more takes one slot per digit. Return the new length of the compressed array.',
    examples: [
      { input: 'chars = ["a","a","b","b","c","c","c"]', output: '6, chars = ["a","2","b","2","c","3"]', explanation: 'Each run becomes the letter plus its count.' },
      { input: 'chars = ["a"]', output: '1, chars = ["a"]', explanation: 'A single character with no repeat stays as it is.' },
    ],
    constraints: '1 <= chars.length <= 2000 · chars[i] is a lowercase letter, an uppercase letter, a digit, or a symbol',
    fn: 'compress',
    kind: 'kprefix',
    normalize: 'none',
    starterCode: `// compress(chars) -> mutates chars into compressed form, returns new length
function compress(chars) {
  // TODO: walk runs with a read pointer and write the compressed form at a write pointer
}`,
    hints: [
      'Read the array one run at a time. What do you write for a run of length one compared with a longer run?',
      'Use a write pointer that never passes the read pointer. Write the character, then the digits of the count when the count is above one.',
    ],
    explanation: 'We scan the array run by run with a read pointer while a write pointer records the compressed output, which is never longer than the input. For each run we write the character once, and if the run length is greater than one we write each digit of the count as its own slot, which handles lengths of ten or more naturally. The write pointer at the end is exactly the new length.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function compress(chars) {
  let write = 0;
  let read = 0;
  while (read < chars.length) {
    const ch = chars[read];
    let count = 0;
    while (read < chars.length && chars[read] === ch) {
      read++;
      count++;
    }
    chars[write] = ch;
    write++;
    if (count > 1) {
      for (const digit of String(count)) {
        chars[write] = digit;
        write++;
      }
    }
  }
  return write;
}`,
    visibleTests: [
      { args: [['a', 'a', 'b', 'b', 'c', 'c', 'c']], expected: { k: 6, prefix: ['a', '2', 'b', '2', 'c', '3'] } },
      { args: [['a']], expected: { k: 1, prefix: ['a'] } },
    ],
    hiddenTests: [
      { args: [['a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'a', 'b']], expected: { k: 4, prefix: ['a', '1', '2', 'b'] } },
      { args: [['a', 'b', 'b']], expected: { k: 3, prefix: ['a', 'b', '2'] } },
      { args: [['a', 'a', 'a', 'b', 'b', 'a', 'a']], expected: { k: 6, prefix: ['a', '3', 'b', '2', 'a', '2'] } },
      { args: [['x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x']], expected: { k: 3, prefix: ['x', '1', '0'] } },
    ],
  },
  // ---------------------------------------------------------------- Hashing
  {
    id: 'longest-consecutive-sequence',
    topic: 'hashing',
    title: 'Longest Consecutive Sequence',
    difficulty: 'Medium',
    statement: 'Given an unsorted list of numbers, find the length of the longest run of values that are consecutive integers, ignoring their positions in the list. Return just the length of that run.',
    examples: [
      { input: 'nums = [100,4,200,1,3,2]', output: '4', explanation: 'The values 1, 2, 3 and 4 form a run of length four.' },
      { input: 'nums = [0,3,7,2,5,8,4,6,0,1]', output: '9', explanation: 'Every value from 0 through 8 is present, giving a run of nine.' },
    ],
    constraints: '0 <= nums.length <= 10^5 · -10^9 <= nums[i] <= 10^9',
    fn: 'longestConsecutive',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// longestConsecutive(nums) -> length of the longest run of consecutive values
function longestConsecutive(nums) {
  // TODO: store values for fast lookup, then only measure runs from their start
}`,
    hints: [
      'Sorting would work but is slower than needed. If all values sat in a set, how would you measure one run?',
      'Only start counting at a value whose predecessor is missing, then walk upward while successors exist.',
    ],
    explanation: 'We place all values in a set for constant-time membership checks. A value begins a run exactly when the value one below it is absent, so we only start walking upward from such starts and count how far successors continue. Every number is visited a bounded number of times across all walks, which keeps the total work linear without sorting.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function longestConsecutive(nums) {
  const set = new Set(nums);
  let best = 0;
  for (const n of set) {
    if (!set.has(n - 1)) {
      let cur = n;
      let len = 1;
      while (set.has(cur + 1)) {
        cur++;
        len++;
      }
      if (len > best) best = len;
    }
  }
  return best;
}`,
    visibleTests: [
      { args: [[100, 4, 200, 1, 3, 2]], expected: 4 },
      { args: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9 },
    ],
    hiddenTests: [
      { args: [[]], expected: 0 },
      { args: [[1, 2, 0, 1]], expected: 3 },
      { args: [[9, 1, 4, 7, 3, -1, 0, 5, 8, -1, 6]], expected: 7 },
      { args: [[5]], expected: 1 },
    ],
  },
  {
    id: 'valid-sudoku',
    topic: 'hashing',
    title: 'Valid Sudoku',
    difficulty: 'Medium',
    statement: 'Given a 9 by 9 board where each cell holds a digit from 1 to 9 or a dot for empty, decide whether the filled cells follow the Sudoku rules: no digit repeats within any row, any column, or any of the nine 3 by 3 boxes. The board does not need to be solvable.',
    examples: [
      { input: 'board = [["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]', output: 'true', explanation: 'No row, column, or box repeats a digit.' },
      { input: 'board = [["8","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]', output: 'false', explanation: 'The top-left box now holds two copies of the digit 8.' },
    ],
    constraints: 'board.length == 9 · board[i].length == 9 · board[i][j] is a digit 1-9 or a dot',
    fn: 'isValidSudoku',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// isValidSudoku(board) -> true if no row, column, or 3x3 box repeats a digit
function isValidSudoku(board) {
  // TODO: track digits seen per row, column, and box while scanning the board
}`,
    hints: [
      'For a cell at row r and column c, which box index does it belong to, and how can you compute it from r and c?',
      'Keep one set per row, column, and box. A digit that is already in any of its three sets makes the board invalid.',
    ],
    explanation: 'We scan every cell once and skip empty cells. For a filled cell we check the set for its row, the set for its column, and the set for its 3 by 3 box, where the box index comes from dividing the row and column by three. If the digit already appears in any of those sets the board breaks a rule; otherwise we add the digit to all three sets and continue.',
    complexity: 'Time O(1) · Space O(1)',
    solutionCode: `function isValidSudoku(board) {
  const rows = Array.from({ length: 9 }, () => new Set());
  const cols = Array.from({ length: 9 }, () => new Set());
  const boxes = Array.from({ length: 9 }, () => new Set());
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c];
      if (val === '.') continue;
      const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);
      if (rows[r].has(val) || cols[c].has(val) || boxes[b].has(val)) return false;
      rows[r].add(val);
      cols[c].add(val);
      boxes[b].add(val);
    }
  }
  return true;
}`,
    visibleTests: [
      { args: [[['5', '3', '.', '.', '7', '.', '.', '.', '.'], ['6', '.', '.', '1', '9', '5', '.', '.', '.'], ['.', '9', '8', '.', '.', '.', '.', '6', '.'], ['8', '.', '.', '.', '6', '.', '.', '.', '3'], ['4', '.', '.', '8', '.', '3', '.', '.', '1'], ['7', '.', '.', '.', '2', '.', '.', '.', '6'], ['.', '6', '.', '.', '.', '.', '2', '8', '.'], ['.', '.', '.', '4', '1', '9', '.', '.', '5'], ['.', '.', '.', '.', '8', '.', '.', '7', '9']]], expected: true },
      { args: [[['8', '3', '.', '.', '7', '.', '.', '.', '.'], ['6', '.', '.', '1', '9', '5', '.', '.', '.'], ['.', '9', '8', '.', '.', '.', '.', '6', '.'], ['8', '.', '.', '.', '6', '.', '.', '.', '3'], ['4', '.', '.', '8', '.', '3', '.', '.', '1'], ['7', '.', '.', '.', '2', '.', '.', '.', '6'], ['.', '6', '.', '.', '.', '.', '2', '8', '.'], ['.', '.', '.', '4', '1', '9', '.', '.', '5'], ['.', '.', '.', '.', '8', '.', '.', '7', '9']]], expected: false },
    ],
    hiddenTests: [
      { args: [[['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.']]], expected: true },
      { args: [[['5', '3', '.', '.', '7', '.', '.', '.', '.'], ['6', '.', '.', '1', '9', '5', '.', '.', '.'], ['.', '9', '8', '.', '.', '.', '.', '6', '.'], ['8', '.', '.', '.', '6', '.', '.', '.', '3'], ['4', '.', '.', '8', '.', '3', '.', '.', '1'], ['7', '.', '.', '.', '2', '.', '.', '.', '6'], ['.', '6', '.', '.', '.', '.', '2', '8', '.'], ['.', '.', '.', '4', '1', '9', '.', '.', '5'], ['5', '.', '.', '.', '8', '.', '.', '7', '9']]], expected: false },
      { args: [[['5', '5', '.', '.', '7', '.', '.', '.', '.'], ['6', '.', '.', '1', '9', '5', '.', '.', '.'], ['.', '9', '8', '.', '.', '.', '.', '6', '.'], ['8', '.', '.', '.', '6', '.', '.', '.', '3'], ['4', '.', '.', '8', '.', '3', '.', '.', '1'], ['7', '.', '.', '.', '2', '.', '.', '.', '6'], ['.', '6', '.', '.', '.', '.', '2', '8', '.'], ['.', '.', '.', '4', '1', '9', '.', '.', '5'], ['.', '.', '.', '.', '8', '.', '.', '7', '9']]], expected: false },
      { args: [[['1', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.'], ['.', '.', '.', '.', '.', '.', '.', '.', '.']]], expected: true },
    ],
  },
  {
    id: 'isomorphic-strings',
    topic: 'hashing',
    title: 'Isomorphic Strings',
    difficulty: 'Easy',
    statement: 'Two equal-length strings are isomorphic if the characters of the first can be renamed to produce the second, with every occurrence of a character always renamed the same way and no two different characters renamed to the same character. Return true when the strings are isomorphic.',
    examples: [
      { input: 's = "egg", t = "add"', output: 'true', explanation: 'Rename e to a and g to d, consistently everywhere.' },
      { input: 's = "foo", t = "bar"', output: 'false', explanation: 'The letter o would need to become both a and r.' },
    ],
    constraints: '1 <= s.length == t.length <= 5 * 10^4 · s and t contain printable ASCII characters',
    fn: 'isIsomorphic',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// isIsomorphic(s, t) -> true if characters of s can be renamed one-to-one into t
function isIsomorphic(s, t) {
  // TODO: record the renaming in both directions and reject any conflict
}`,
    hints: [
      'One mapping is not enough: a renaming can look fine forward yet collide backward. What two records do you need?',
      'Keep a map from first-string characters to second-string characters and another map in reverse. Any disagreement in either means false.',
    ],
    explanation: 'We walk both strings together and maintain the renaming in both directions. If a character of the first string was already renamed, its partner must match the current character of the second string, and if a character of the second string was already claimed by another character, that is also a conflict. When no conflict appears after a full pass, the renaming is consistent and one-to-one.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function isIsomorphic(s, t) {
  if (s.length !== t.length) return false;
  const forward = new Map();
  const backward = new Map();
  for (let i = 0; i < s.length; i++) {
    const a = s[i];
    const b = t[i];
    if (forward.has(a) && forward.get(a) !== b) return false;
    if (backward.has(b) && backward.get(b) !== a) return false;
    forward.set(a, b);
    backward.set(b, a);
  }
  return true;
}`,
    visibleTests: [
      { args: ['egg', 'add'], expected: true },
      { args: ['foo', 'bar'], expected: false },
    ],
    hiddenTests: [
      { args: ['paper', 'title'], expected: true },
      { args: ['badc', 'baba'], expected: false },
      { args: ['ab', 'aa'], expected: false },
      { args: ['aba', 'xyx'], expected: true },
    ],
  },
  // ---------------------------------------------------------------- Two Pointers
  {
    id: 'trapping-rain-water',
    topic: 'two-pointers',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    statement: 'Each number is the height of a bar of width one in an elevation map. After rain, water settles in the dips between bars. Compute how many units of water the map can hold in total.',
    examples: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: 'The dips between the taller bars hold six units in total.' },
      { input: 'height = [4,2,0,3,2,5]', output: '9', explanation: 'The basin in the middle fills up to the lower rim on its sides.' },
    ],
    constraints: '0 <= height.length <= 2 * 10^4 · 0 <= height[i] <= 10^5',
    fn: 'trap',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// trap(height) -> total units of rain water the elevation map can hold
function trap(height) {
  // TODO: move two pointers inward, tracking the tallest wall seen on each side
}`,
    hints: [
      'The water above a position depends on the tallest bar on its left and the tallest bar on its right. Which of the two actually limits it?',
      'Keep pointers at both ends with the best wall seen from each side. Always process the side with the smaller wall.',
    ],
    explanation: 'We keep a pointer at each end plus the tallest bar seen so far from the left and from the right. The side with the smaller wall is the limiting side, so the water above the next position on that side is fully determined by its own side wall, and we add the positive difference before moving that pointer inward. Each position is settled exactly once, when the smaller of its two surrounding walls is known.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function trap(height) {
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;
  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) leftMax = height[left];
      else water += leftMax - height[left];
      left++;
    } else {
      if (height[right] >= rightMax) rightMax = height[right];
      else water += rightMax - height[right];
      right--;
    }
  }
  return water;
}`,
    visibleTests: [
      { args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]], expected: 6 },
      { args: [[4, 2, 0, 3, 2, 5]], expected: 9 },
    ],
    hiddenTests: [
      { args: [[3, 0, 3]], expected: 3 },
      { args: [[1, 0, 1]], expected: 1 },
      { args: [[5, 4, 3, 2, 1]], expected: 0 },
      { args: [[]], expected: 0 },
    ],
  },
  {
    id: 'two-sum-ii',
    topic: 'two-pointers',
    title: 'Two Sum II — Sorted Input',
    difficulty: 'Medium',
    statement: 'The array is sorted in non-decreasing order. Find two numbers that add up to the target and return their positions using 1-based indexing, so the first element is position 1. Exactly one pair works, and the same element cannot be used twice.',
    examples: [
      { input: 'numbers = [2,7,11,15], target = 9', output: '[1, 2]', explanation: 'The values 2 and 7 sit at positions 1 and 2 in 1-based counting.' },
      { input: 'numbers = [2,3,4], target = 6', output: '[1, 3]', explanation: 'The values 2 and 4 are the first and third entries.' },
    ],
    constraints: '2 <= numbers.length <= 3 * 10^4 · -1000 <= numbers[i], target <= 1000 · numbers is sorted non-decreasing · exactly one pair sums to target',
    fn: 'twoSumII',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// twoSumII(numbers, target) -> [i, j] 1-based positions of the pair summing to target
function twoSumII(numbers, target) {
  // TODO: start pointers at both ends and move the one that fixes the sum
}`,
    hints: [
      'Because the input is sorted, the smallest plus the largest sum tells you a lot. If it is too small, which pointer should move?',
      'Keep left and right pointers. Shrink from the left when the sum is too small and from the right when it is too large, then add one to each index.',
    ],
    explanation: 'Sorting lets two pointers do the whole job. We start with the smallest and largest values: if their sum is too small we must raise it by moving the left pointer up, and if it is too large we lower it by moving the right pointer down. Each step discards one candidate that cannot be part of the answer, so the unique pair is found in one pass, and we convert to 1-based positions at the end.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function twoSumII(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left + 1, right + 1];
    if (sum < target) left++;
    else right--;
  }
  return [];
}`,
    visibleTests: [
      { args: [[2, 7, 11, 15], 9], expected: [1, 2] },
      { args: [[2, 3, 4], 6], expected: [1, 3] },
    ],
    hiddenTests: [
      { args: [[-1, 0], -1], expected: [1, 2] },
      { args: [[5, 25, 75], 100], expected: [2, 3] },
      { args: [[1, 2, 3, 4, 4, 9, 56, 90], 8], expected: [4, 5] },
    ],
  },
  // ---------------------------------------------------------------- Sliding Window
  {
    id: 'longest-repeating-character-replacement',
    topic: 'sliding-window',
    title: 'Longest Repeating Character Replacement',
    difficulty: 'Medium',
    statement: 'Given a string of uppercase letters and a budget k, you may change at most k characters inside a chosen stretch so that the whole stretch becomes one repeated letter. Return the length of the longest stretch you can fully unify this way.',
    examples: [
      { input: 's = "ABAB", k = 2', output: '4', explanation: 'Change the two differing letters to match and the whole string becomes uniform.' },
      { input: 's = "AABABBA", k = 1', output: '4', explanation: 'A stretch of four can be unified with a single change.' },
    ],
    constraints: '1 <= s.length <= 10^5 · s contains uppercase English letters · 0 <= k <= s.length',
    fn: 'characterReplacement',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// characterReplacement(s, k) -> longest substring unifiable by changing at most k chars
function characterReplacement(s, k) {
  // TODO: slide a window and check whether the non-majority chars fit the budget
}`,
    hints: [
      'Inside a window, the cheapest letter to unify on is the most frequent one. How many changes does a window need in terms of its size and that frequency?',
      'Grow the window and track letter counts. When size minus the top frequency passes k, shrink from the left.',
    ],
    explanation: 'For any window, the cheapest target letter is the most frequent one inside it, and the number of changes needed is the window size minus that frequency. We grow a window over the string and keep letter counts plus the highest frequency seen. Whenever the needed changes exceed k we shrink from the left until the window is affordable again, and the largest affordable window length is the answer.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function characterReplacement(s, k) {
  const counts = new Map();
  let left = 0;
  let maxFreq = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    counts.set(ch, (counts.get(ch) || 0) + 1);
    maxFreq = Math.max(maxFreq, counts.get(ch));
    while ((right - left + 1) - maxFreq > k) {
      counts.set(s[left], counts.get(s[left]) - 1);
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
    visibleTests: [
      { args: ['ABAB', 2], expected: 4 },
      { args: ['AABABBA', 1], expected: 4 },
    ],
    hiddenTests: [
      { args: ['AAAA', 0], expected: 4 },
      { args: ['ABCDE', 0], expected: 1 },
      { args: ['BAAA', 1], expected: 4 },
      { args: ['ABBB', 2], expected: 4 },
    ],
  },
  {
    id: 'permutation-in-string',
    topic: 'sliding-window',
    title: 'Permutation in String',
    difficulty: 'Medium',
    statement: 'Given two strings s1 and s2, return true if some contiguous part of s2 is a rearrangement of s1, using exactly the same characters with the same counts. Return false when no part of s2 qualifies.',
    examples: [
      { input: 's1 = "ab", s2 = "eidbaooo"', output: 'true', explanation: 'The part "ba" inside s2 is a rearrangement of "ab".' },
      { input: 's1 = "ab", s2 = "eidboaoo"', output: 'false', explanation: 'No length-2 part of s2 holds one a and one b.' },
    ],
    constraints: '1 <= s1.length, s2.length <= 10^4 · s1 and s2 contain lowercase English letters',
    fn: 'checkInclusion',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// checkInclusion(s1, s2) -> true if some substring of s2 is a permutation of s1
function checkInclusion(s1, s2) {
  // TODO: slide a window of length s1 over s2 and compare character counts
}`,
    hints: [
      'Any matching part must have the same length as s1. What changes when that fixed-size window slides by one character?',
      'Count the letters of s1 once. Slide a same-length window over s2, updating counts, and check for an exact match at each step.',
    ],
    explanation: 'A rearrangement of s1 has the same length and the same letter counts, so we only need to inspect windows of s2 with that fixed length. We count the letters of s1, then slide the window across s2 while maintaining the window counts: one character leaves and one enters at each step. If the window counts ever equal the target counts exactly, a matching part exists.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function checkInclusion(s1, s2) {
  if (s1.length > s2.length) return false;
  const need = new Array(26).fill(0);
  const window = new Array(26).fill(0);
  const code = (ch) => ch.charCodeAt(0) - 97;
  for (const ch of s1) need[code(ch)]++;
  for (let i = 0; i < s2.length; i++) {
    window[code(s2[i])]++;
    if (i >= s1.length) window[code(s2[i - s1.length])]--;
    if (i >= s1.length - 1) {
      let ok = true;
      for (let j = 0; j < 26; j++) {
        if (need[j] !== window[j]) { ok = false; break; }
      }
      if (ok) return true;
    }
  }
  return false;
}`,
    visibleTests: [
      { args: ['ab', 'eidbaooo'], expected: true },
      { args: ['ab', 'eidboaoo'], expected: false },
    ],
    hiddenTests: [
      { args: ['a', 'a'], expected: true },
      { args: ['adc', 'dcda'], expected: true },
      { args: ['ab', 'a'], expected: false },
      { args: ['abc', 'ccccbbbbaaaa'], expected: false },
    ],
  },
  // ---------------------------------------------------------------- Binary Search
  {
    id: 'find-min-rotated',
    topic: 'binary-search',
    title: 'Find Minimum in Rotated Sorted Array',
    difficulty: 'Medium',
    statement: 'An array of distinct values was sorted in increasing order and then rotated at some unknown point, so a suffix moved to the front. Given the rotated array, find and return its smallest value.',
    examples: [
      { input: 'nums = [3,4,5,1,2]', output: '1', explanation: 'The original sorted array began at the value 1.' },
      { input: 'nums = [4,5,6,7,0,1,2]', output: '0', explanation: 'The smallest value sits where the rotation wrapped around.' },
    ],
    constraints: '1 <= nums.length <= 5000 · -5000 <= nums[i] <= 5000 · all values are distinct · nums is a rotation of a sorted array',
    fn: 'findMin',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// findMin(nums) -> smallest value in a rotated sorted array of distinct values
function findMin(nums) {
  // TODO: compare the middle value with the right end to decide which half holds the dip
}`,
    hints: [
      'The minimum is the one place where the increasing order breaks. Which half must contain that break, given the middle and right values?',
      'If the middle value is larger than the right value, the break is to the right; otherwise the minimum is at the middle or to its left.',
    ],
    explanation: 'We compare the middle value with the value at the right end. If the middle is larger, the rotation break and therefore the minimum must lie in the right half. Otherwise the right half is properly sorted and the minimum is the middle value or something to its left. Halving the range this way converges on the single dip in the array, which is the minimum.',
    complexity: 'Time O(log n) · Space O(1)',
    solutionCode: `function findMin(nums) {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] > nums[right]) left = mid + 1;
    else right = mid;
  }
  return nums[left];
}`,
    visibleTests: [
      { args: [[3, 4, 5, 1, 2]], expected: 1 },
      { args: [[4, 5, 6, 7, 0, 1, 2]], expected: 0 },
    ],
    hiddenTests: [
      { args: [[1, 2, 3]], expected: 1 },
      { args: [[5]], expected: 5 },
      { args: [[2, 1]], expected: 1 },
      { args: [[11, 13, 15, 17]], expected: 11 },
    ],
  },
  {
    id: 'koko-eating-bananas',
    topic: 'binary-search',
    title: 'Koko Eating Bananas',
    difficulty: 'Medium',
    statement: 'There are piles of bananas, and a guard returns in h hours. Each hour, one pile is chosen and up to k bananas are eaten from it; a smaller pile still takes the whole hour. Find the smallest whole-number eating speed k that finishes every pile within h hours.',
    examples: [
      { input: 'piles = [3,6,7,11], h = 8', output: '4', explanation: 'At speed 4 the piles take 1, 2, 2 and 3 hours, which fits in 8.' },
      { input: 'piles = [30,11,23,4,20], h = 5', output: '30', explanation: 'With only five hours for five piles, each pile must finish in one hour.' },
    ],
    constraints: '1 <= piles.length <= 10^4 · piles.length <= h <= 10^9 · 1 <= piles[i] <= 10^9',
    fn: 'minEatingSpeed',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// minEatingSpeed(piles, h) -> smallest integer speed that finishes all piles in h hours
function minEatingSpeed(piles, h) {
  // TODO: binary search the speed, testing each candidate against the hour budget
}`,
    hints: [
      'If a speed works, every faster speed also works. What shape does that give the search space?',
      'Binary search speeds between 1 and the largest pile. For a candidate, hours per pile are the pile size divided by the speed, rounded up.',
    ],
    explanation: 'Feasibility is monotone in the speed: once a speed finishes within h hours, any faster speed does too. So we binary search the boundary between failing and working speeds. For a candidate speed, the hours a pile needs are its size divided by the speed rounded up, and summing those hours tells us whether the candidate works. The first working speed is the answer.',
    complexity: 'Time O(n log m) · Space O(1)',
    solutionCode: `function minEatingSpeed(piles, h) {
  let left = 1;
  let right = Math.max(...piles);
  const hoursNeeded = (speed) => {
    let total = 0;
    for (const p of piles) total += Math.ceil(p / speed);
    return total;
  };
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (hoursNeeded(mid) <= h) right = mid;
    else left = mid + 1;
  }
  return left;
}`,
    visibleTests: [
      { args: [[3, 6, 7, 11], 8], expected: 4 },
      { args: [[30, 11, 23, 4, 20], 5], expected: 30 },
    ],
    hiddenTests: [
      { args: [[30, 11, 23, 4, 20], 6], expected: 23 },
      { args: [[1, 1, 1, 1], 4], expected: 1 },
      { args: [[1000000000], 2], expected: 500000000 },
      { args: [[312884470], 312884469], expected: 2 },
    ],
  },
  {
    id: 'search-2d-matrix',
    topic: 'binary-search',
    title: 'Search a 2D Matrix',
    difficulty: 'Medium',
    statement: 'A matrix is sorted so that each row increases left to right and the first value of every row is greater than the last value of the row above it. Return true if the target value is present in the matrix, and false otherwise.',
    examples: [
      { input: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3', output: 'true', explanation: 'The value 3 sits in the first row.' },
      { input: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13', output: 'false', explanation: 'No cell holds the value 13.' },
    ],
    constraints: '0 <= matrix.length <= 100 · 0 <= matrix[i].length <= 100 · -10^4 <= matrix[i][j], target <= 10^4',
    fn: 'searchMatrix',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// searchMatrix(matrix, target) -> true if target exists in the sorted matrix
function searchMatrix(matrix, target) {
  // TODO: treat the matrix as one long sorted list and binary search it
}`,
    hints: [
      'The sorting rules make the rows join into a single increasing sequence. How do you turn a flat index into a row and column?',
      'Binary search over rows times columns positions. Row is the flat index divided by the column count, column is the remainder.',
    ],
    explanation: 'Because each row starts after the previous row ends, reading the matrix row by row yields one fully sorted sequence. We can binary search that virtual sequence without building it: a flat index converts to a row by integer division by the column count and to a column by the remainder. Standard binary search on those positions finds the target or proves it absent.',
    complexity: 'Time O(log(m * n)) · Space O(1)',
    solutionCode: `function searchMatrix(matrix, target) {
  if (!matrix || matrix.length === 0 || matrix[0].length === 0) return false;
  const rows = matrix.length;
  const cols = matrix[0].length;
  let left = 0;
  let right = rows * cols - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const val = matrix[Math.floor(mid / cols)][mid % cols];
    if (val === target) return true;
    if (val < target) left = mid + 1;
    else right = mid - 1;
  }
  return false;
}`,
    visibleTests: [
      { args: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 3], expected: true },
      { args: [[[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], 13], expected: false },
    ],
    hiddenTests: [
      { args: [[[1]], 1], expected: true },
      { args: [[[1]], 2], expected: false },
      { args: [[], 5], expected: false },
      { args: [[[1, 3]], 3], expected: true },
    ],
  },
  // ---------------------------------------------------------------- Sorting
  {
    id: 'merge-sorted-array',
    topic: 'sorting',
    title: 'Merge Sorted Array',
    difficulty: 'Easy',
    statement: 'The first array nums1 holds m sorted values followed by n empty zero slots, and the second array nums2 holds n sorted values. Merge nums2 into nums1 so the whole first array becomes sorted, doing the work inside nums1, and return nums1 when finished.',
    examples: [
      { input: 'nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3', output: '[1, 2, 2, 3, 5, 6]', explanation: 'The two sorted runs interleave into one sorted array.' },
      { input: 'nums1 = [1], m = 1, nums2 = [], n = 0', output: '[1]', explanation: 'There is nothing to merge in.' },
    ],
    constraints: '0 <= m, n <= 200 · 1 <= m + n <= 200 · -10^9 <= nums1[i], nums2[i] <= 10^9 · both value runs are sorted non-decreasing',
    fn: 'mergeSorted',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// mergeSorted(nums1, m, nums2, n) -> merges nums2 into nums1 in place and must return nums1
function mergeSorted(nums1, m, nums2, n) {
  // TODO: fill nums1 from the back using the largest remaining value of each run, then return nums1
}`,
    hints: [
      'The empty slots sit at the back of nums1. What order of filling avoids overwriting values you still need?',
      'Keep a read pointer at the end of each real run and a write pointer at the very back. Place the larger remaining value and step that pointer down.',
    ],
    explanation: 'The spare slots at the back of nums1 are free space, so filling from the back never overwrites a value that is still needed. We keep pointers at the largest unplaced value of each run and repeatedly copy the larger one into the back slot, stepping the pointers down. When one run is exhausted the leftovers of the other are already in place or copied down, and we return nums1 as required.',
    complexity: 'Time O(m + n) · Space O(1)',
    solutionCode: `function mergeSorted(nums1, m, nums2, n) {
  let i = m - 1;
  let j = n - 1;
  let write = m + n - 1;
  while (j >= 0) {
    if (i >= 0 && nums1[i] > nums2[j]) {
      nums1[write] = nums1[i];
      i--;
    } else {
      nums1[write] = nums2[j];
      j--;
    }
    write--;
  }
  return nums1;
}`,
    visibleTests: [
      { args: [[1, 2, 3, 0, 0, 0], 3, [2, 5, 6], 3], expected: [1, 2, 2, 3, 5, 6] },
      { args: [[1], 1, [], 0], expected: [1] },
    ],
    hiddenTests: [
      { args: [[0], 0, [1], 1], expected: [1] },
      { args: [[4, 5, 6, 0, 0, 0], 3, [1, 2, 3], 3], expected: [1, 2, 3, 4, 5, 6] },
      { args: [[1, 2, 4, 5, 0, 0], 4, [3, 6], 2], expected: [1, 2, 3, 4, 5, 6] },
    ],
  },
  // ---------------------------------------------------------------- Stack & Queue
  {
    id: 'generate-parentheses',
    topic: 'stack-queue',
    title: 'Generate Parentheses',
    difficulty: 'Medium',
    statement: 'Given n pairs of parentheses, generate every combination that is correctly balanced and properly nested, and return all of them as a list of strings. The order of the list does not matter.',
    examples: [
      { input: 'n = 3', output: '["((()))","(()())","(())()","()(())","()()()"]', explanation: 'These five strings are all the valid arrangements of three pairs.' },
      { input: 'n = 1', output: '["()"]', explanation: 'One pair has only the trivial arrangement.' },
    ],
    constraints: '0 <= n <= 8',
    fn: 'generateParenthesis',
    kind: 'plain',
    normalize: 'sortArray',
    starterCode: `// generateParenthesis(n) -> all valid combinations of n pairs of parentheses
function generateParenthesis(n) {
  // TODO: build strings character by character without ever breaking the balance
}`,
    hints: [
      'While building, two counts matter: how many opening brackets you may still place and whether a closing bracket is safe. When is a closing bracket safe?',
      'Recurse with the current string plus open and close counts. Add an opener while opens remain, and a closer only when it cannot overtake the opens.',
    ],
    explanation: 'We build each string one character at a time. An opening bracket may be placed while we still have pairs left to open, and a closing bracket may be placed only when it would not exceed the number of opens already placed, which keeps every prefix valid. When the string reaches length 2n it is a complete valid combination, and exploring both choices at each step enumerates all of them exactly once.',
    complexity: 'Time O(4^n / sqrt(n)) · Space O(n)',
    solutionCode: `function generateParenthesis(n) {
  const res = [];
  const build = (cur, open, close) => {
    if (cur.length === 2 * n) {
      res.push(cur);
      return;
    }
    if (open < n) build(cur + '(', open + 1, close);
    if (close < open) build(cur + ')', open, close + 1);
  };
  build('', 0, 0);
  return res;
}`,
    visibleTests: [
      { args: [3], expected: ['((()))', '(()())', '(())()', '()(())', '()()()'] },
      { args: [1], expected: ['()'] },
    ],
    hiddenTests: [
      { args: [2], expected: ['(())', '()()'] },
      { args: [0], expected: [''] },
      { args: [4], expected: ['(((())))', '((()()))', '((())())', '((()))()', '(()(()))', '(()()())', '(()())()', '(())(())', '(())()()', '()((()))', '()(()())', '()(())()', '()()(())', '()()()()'] },
    ],
  },
  {
    id: 'decode-string',
    topic: 'stack-queue',
    title: 'Decode String',
    difficulty: 'Medium',
    statement: 'A message is encoded with a pattern where a number followed by a bracketed part means that part repeats that many times, and patterns can nest inside each other. Decode the message and return the fully expanded string.',
    examples: [
      { input: 's = "3[a]2[bc]"', output: '"aaabcbc"', explanation: 'The letter a repeats three times and the part bc repeats twice.' },
      { input: 's = "3[a2[c]]"', output: '"accaccacc"', explanation: 'The inner part expands to acc first, then the whole block repeats three times.' },
    ],
    constraints: '1 <= s.length <= 30 · s contains lowercase letters, digits, and square brackets · numbers are positive and below 300',
    fn: 'decodeString',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// decodeString(s) -> fully decoded string for the repeat-bracket encoding
function decodeString(s) {
  // TODO: use stacks to remember repeat counts and text built before each bracket
}`,
    hints: [
      'Numbers can have several digits, so build them as you scan. What do you need to save when an opening bracket appears?',
      'On an opening bracket, push the current text and count. On a closing bracket, pop them and repeat the inner text.',
    ],
    explanation: 'We scan the string while accumulating digits into a repeat count and letters into the current text. When an opening bracket appears, we push the text built so far and the repeat count onto stacks and start a fresh inner text. When a closing bracket appears, we pop the saved text and count, repeat the inner text that many times, and append it to the saved text. Nesting works because each bracket pair restores exactly the context it saved.',
    complexity: 'Time O(n * k) · Space O(n)',
    solutionCode: `function decodeString(s) {
  const textStack = [];
  const countStack = [];
  let cur = '';
  let num = 0;
  for (const ch of s) {
    if (ch >= '0' && ch <= '9') {
      num = num * 10 + Number(ch);
    } else if (ch === '[') {
      textStack.push(cur);
      countStack.push(num);
      cur = '';
      num = 0;
    } else if (ch === ']') {
      const repeat = countStack.pop();
      const prev = textStack.pop();
      cur = prev + cur.repeat(repeat);
    } else {
      cur += ch;
    }
  }
  return cur;
}`,
    visibleTests: [
      { args: ['3[a]2[bc]'], expected: 'aaabcbc' },
      { args: ['3[a2[c]]'], expected: 'accaccacc' },
    ],
    hiddenTests: [
      { args: ['2[abc]3[cd]ef'], expected: 'abcabccdcdcdef' },
      { args: ['abc'], expected: 'abc' },
      { args: ['10[a]'], expected: 'aaaaaaaaaa' },
      { args: ['2[a2[b]]'], expected: 'abbabb' },
    ],
  },
  {
    id: 'asteroid-collision',
    topic: 'stack-queue',
    title: 'Asteroid Collision',
    difficulty: 'Medium',
    statement: 'Each number is an asteroid: its sign gives the direction it moves, right for positive and left for negative, and its absolute value is its size. All asteroids move at the same speed. When two collide, the smaller one explodes, and equal sizes destroy each other. Return the state of the asteroids after all collisions, in order.',
    examples: [
      { input: 'asteroids = [5,10,-5]', output: '[5, 10]', explanation: 'The left-moving asteroid meets the 10 and explodes, leaving the first two.' },
      { input: 'asteroids = [8,-8]', output: '[]', explanation: 'Equal sizes moving toward each other destroy each other.' },
    ],
    constraints: '0 <= asteroids.length <= 10^4 · -1000 <= asteroids[i] <= 1000 · asteroids[i] is never 0',
    fn: 'asteroidCollision',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// asteroidCollision(asteroids) -> surviving asteroids after all collisions
function asteroidCollision(asteroids) {
  // TODO: keep survivors on a stack and resolve head-on meetings with the top
}`,
    hints: [
      'A collision can only happen between a right-moving survivor and a left-moving newcomer. What sizes decide who survives?',
      'Use a stack. While the top moves right and the new asteroid moves left, compare sizes: smaller newcomer dies, smaller top pops, equal sizes both die.',
    ],
    explanation: 'Asteroids moving in the same direction never meet, and a left-mover behind a right-mover pair moves apart, so collisions only occur between a right-moving survivor on the stack and a new left-moving asteroid. We resolve those meetings by size: a smaller newcomer explodes, a smaller stack top explodes and the comparison continues with the next survivor, and equal sizes destroy both. Anything that survives all comparisons joins the stack.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function asteroidCollision(asteroids) {
  const stack = [];
  for (const ast of asteroids) {
    let alive = true;
    while (alive && ast < 0 && stack.length > 0 && stack[stack.length - 1] > 0) {
      const top = stack[stack.length - 1];
      if (top < -ast) {
        stack.pop();
      } else if (top === -ast) {
        stack.pop();
        alive = false;
      } else {
        alive = false;
      }
    }
    if (alive) stack.push(ast);
  }
  return stack;
}`,
    visibleTests: [
      { args: [[5, 10, -5]], expected: [5, 10] },
      { args: [[8, -8]], expected: [] },
    ],
    hiddenTests: [
      { args: [[10, 2, -5]], expected: [10] },
      { args: [[-2, -1, 1, 2]], expected: [-2, -1, 1, 2] },
      { args: [[5, -5, 5]], expected: [5] },
      { args: [[1, -2, -2, -2]], expected: [-2, -2, -2] },
    ],
  },
  {
    id: 'car-fleet',
    topic: 'stack-queue',
    title: 'Car Fleet',
    difficulty: 'Medium',
    statement: 'Cars drive toward a target at given starting positions and speeds, on a one-lane road where no car can pass another. A faster car that catches up joins the slower car ahead and they continue together as one fleet at the slower speed. Return how many fleets arrive at the target.',
    examples: [
      { input: 'target = 12, position = [10,8,0,5,3], speed = [2,4,1,1,3]', output: '3', explanation: 'Three groups form: the pair near the target, the middle car, and the group from the back.' },
      { input: 'target = 10, position = [3], speed = [3]', output: '1', explanation: 'A single car is a single fleet.' },
    ],
    constraints: '0 <= position.length == speed.length <= 10^5 · 0 < target <= 10^6 · 0 <= position[i] < target · 0 < speed[i] <= 10^6 · positions are distinct',
    fn: 'carFleet',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// carFleet(target, position, speed) -> number of fleets that reach the target
function carFleet(target, position, speed) {
  // TODO: order cars by starting position and compare arrival times
}`,
    hints: [
      'A car can only be delayed by the car directly ahead of it. If you process cars from closest to the target backward, what arrival time matters?',
      'Sort cars by position descending and compute each arrival time. A car forms a new fleet only when its time beats the fleet time ahead of it.',
    ],
    explanation: 'We sort the cars by starting position from nearest the target to farthest. For each car we compute the time it would need if the road were empty. Processing in that order, a car joins the fleet ahead whenever its free time is not greater than the arrival time of that fleet, because it catches up before the target; otherwise it starts a new fleet with its own time. Counting the new fleets gives the answer.',
    complexity: 'Time O(n log n) · Space O(n)',
    solutionCode: `function carFleet(target, position, speed) {
  const cars = position.map((pos, i) => [pos, (target - pos) / speed[i]]);
  cars.sort((a, b) => b[0] - a[0]);
  let fleets = 0;
  let fleetTime = 0;
  for (const [, time] of cars) {
    if (time > fleetTime) {
      fleets++;
      fleetTime = time;
    }
  }
  return fleets;
}`,
    visibleTests: [
      { args: [12, [10, 8, 0, 5, 3], [2, 4, 1, 1, 3]], expected: 3 },
      { args: [10, [3], [3]], expected: 1 },
    ],
    hiddenTests: [
      { args: [12, [10, 8], [2, 4]], expected: 1 },
      { args: [10, [8, 9], [1, 1]], expected: 2 },
      { args: [100, [0, 2, 4], [4, 2, 1]], expected: 1 },
      { args: [10, [], []], expected: 0 },
    ],
  },
];

export default EXTRA_PROBLEMS;
