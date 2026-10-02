// dsaSheet.js — DSA Sheet problem bank for InterviewPrep by Ayushi.
// 90 problems across 13 topics: the 50 hand-authored problems below plus
// 40 more in dsaExtra1.js / dsaExtra2.js, merged into PROBLEMS. Each
// problem carries its own statement, examples, hints, explanation,
// reference solution and tests — all proven by scripts/verify-sheet.mjs
// against judgeCore semantics.

import { EXTRA_PROBLEMS } from './dsaExtra1.js';
import { PROBLEMS_EXTRA2 } from './dsaExtra2.js';

export const DSA_TOPICS = [
  { id: 'arrays', title: 'Arrays', emoji: '🔢' },
  { id: 'strings', title: 'Strings', emoji: '🔤' },
  { id: 'hashing', title: 'Hashing', emoji: '🗂️' },
  { id: 'two-pointers', title: 'Two Pointers', emoji: '👉👈' },
  { id: 'sliding-window', title: 'Sliding Window', emoji: '🪟' },
  { id: 'binary-search', title: 'Binary Search', emoji: '🔍' },
  { id: 'sorting', title: 'Sorting', emoji: '🫧' },
  { id: 'linked-list', title: 'Linked List', emoji: '🔗' },
  { id: 'stack-queue', title: 'Stack & Queue', emoji: '📚' },
  { id: 'trees', title: 'Trees', emoji: '🌳' },
  { id: 'heap', title: 'Heap & Priority Queue', emoji: '⛰️' },
  { id: 'graphs', title: 'Graphs', emoji: '🕸️' },
  { id: 'dp', title: 'Dynamic Programming', emoji: '🧮' },
];

const BASE_PROBLEMS = [
  // ---------------------------------------------------------------- Arrays
  {
    id: 'two-sum',
    topic: 'arrays',
    title: 'Two Sum',
    difficulty: 'Easy',
    statement: 'You get a list of numbers and one target value. Find the positions of the two numbers that add up to the target and return their indices. You can assume there is exactly one valid pair, and the same element cannot be used twice.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] = 2 + 7 = 9, so the answer is indices 0 and 1.' },
      { input: 'nums = [3,2,4], target = 6', output: '[1, 2]', explanation: '2 + 4 = 6, and those values sit at indices 1 and 2.' },
    ],
    constraints: '2 <= nums.length <= 10^4 · -10^9 <= nums[i], target <= 10^9 · exactly one pair sums to target',
    fn: 'twoSum',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// twoSum(nums, target) -> [i, j] where nums[i] + nums[j] === target
function twoSum(nums, target) {
  // TODO: find the two indices whose values add up to target
}`,
    hints: [
      'For each number, ask what partner value would complete the target. Can you remember values you have already seen?',
      'Keep a map from value to its index. When the partner is already in the map, you have found the pair.',
    ],
    explanation: 'We walk through the array once. For the current value x, the partner we need is target - x. If that partner was seen before, its stored index plus the current index is the answer. Otherwise we store x with its index and move on. This works because any valid pair will be discovered when its second element is visited, and the map gives us O(1) lookups instead of rescanning the array.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
    visibleTests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
    ],
    hiddenTests: [
      { args: [[3, 3], 6], expected: [0, 1] },
      { args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
      { args: [[0, 4, 3, 0], 0], expected: [0, 3] },
      { args: [[1, 5, 8, 10], 18], expected: [2, 3] },
    ],
  },
  {
    id: 'best-time-stock',
    topic: 'arrays',
    title: 'Best Time to Buy and Sell Stock',
    difficulty: 'Easy',
    statement: 'Each value in the array is the price of a stock on that day, in order. You may buy once and sell once on a later day. Return the most profit you can make, or 0 if every choice would lose money.',
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5', explanation: 'Buy at 1 and sell at 6 for a profit of 5.' },
      { input: 'prices = [7,6,4,3,1]', output: '0', explanation: 'Prices only go down, so the best move is to not trade at all.' },
    ],
    constraints: '1 <= prices.length <= 10^5 · 0 <= prices[i] <= 10^4',
    fn: 'maxProfit',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// maxProfit(prices) -> best profit from one buy then one later sell
function maxProfit(prices) {
  // TODO: track the cheapest price so far and the best profit
}`,
    hints: [
      'If you sell today, the best day to have bought is the cheapest day before today. What two values do you need to remember?',
      'Keep the lowest price seen so far. At each step, compare today minus that lowest price with your best profit.',
    ],
    explanation: 'We scan left to right while remembering the cheapest price seen so far. Selling today would earn today\'s price minus that cheapest price, so we update our best profit whenever that value is larger. Then we update the cheapest price if today is cheaper. One pass is enough because the best buy for any sell day is always the minimum price before it.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function maxProfit(prices) {
  let minPrice = Infinity;
  let best = 0;
  for (const p of prices) {
    if (p < minPrice) minPrice = p;
    else if (p - minPrice > best) best = p - minPrice;
  }
  return best;
}`,
    visibleTests: [
      { args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { args: [[7, 6, 4, 3, 1]], expected: 0 },
    ],
    hiddenTests: [
      { args: [[1, 2]], expected: 1 },
      { args: [[2, 4, 1]], expected: 2 },
      { args: [[3, 2, 6, 5, 0, 3]], expected: 4 },
      { args: [[5]], expected: 0 },
    ],
  },
  {
    id: 'max-subarray',
    topic: 'arrays',
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    statement: 'Given an array of numbers, find a continuous stretch of elements whose sum is as large as possible and return that sum. The stretch must contain at least one element, so even when all numbers are negative you still pick the least bad one.',
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The stretch [4,-1,2,1] adds up to 6, which is the largest possible.' },
      { input: 'nums = [5,4,-1,7,8]', output: '23', explanation: 'Taking the whole array gives 23.' },
    ],
    constraints: '1 <= nums.length <= 10^5 · -10^4 <= nums[i] <= 10^4',
    fn: 'maxSubArray',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// maxSubArray(nums) -> largest sum of any contiguous subarray
function maxSubArray(nums) {
  // TODO: decide at each step whether to extend or restart the run
}`,
    hints: [
      'Think about the best stretch that ends exactly at the current position. It either starts here or extends the previous stretch.',
      'Keep a running sum. If it ever becomes worse than starting fresh at the current value, restart from the current value.',
    ],
    explanation: 'This is Kadane\'s idea. We keep the best sum of a stretch ending at the current index. At each new number we choose the better of starting a fresh stretch here or extending the previous stretch by adding the number. We also keep the best value seen across all positions. It works because any optimal stretch ends somewhere, and when we process that ending position our running value equals its sum.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function maxSubArray(nums) {
  let cur = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    cur = Math.max(nums[i], cur + nums[i]);
    best = Math.max(best, cur);
  }
  return best;
}`,
    visibleTests: [
      { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { args: [[1]], expected: 1 },
      { args: [[5, 4, -1, 7, 8]], expected: 23 },
    ],
    hiddenTests: [
      { args: [[-2, -3, -1]], expected: -1 },
      { args: [[-5, -1, -3]], expected: -1 },
      { args: [[-1]], expected: -1 },
      { args: [[2, -1, 2, 3, -9]], expected: 6 },
      { args: [[8, -19, 5, -4, 20]], expected: 21 },
    ],
  },
  {
    id: 'move-zeroes',
    topic: 'arrays',
    title: 'Move Zeroes',
    difficulty: 'Easy',
    statement: 'You are given an array with some zeroes mixed in. Rearrange it so every non-zero value comes first in its original relative order and all zeroes sit at the end. Do the rearrangement in the given array and return the array when you are done.',
    examples: [
      { input: 'nums = [0,1,0,3,12]', output: '[1, 3, 12, 0, 0]', explanation: 'The non-zero values 1, 3, 12 keep their order at the front and the zeroes move behind them.' },
      { input: 'nums = [0]', output: '[0]', explanation: 'A single zero stays where it is.' },
    ],
    constraints: '1 <= nums.length <= 10^4 · -2^31 <= nums[i] <= 2^31 - 1',
    fn: 'moveZeroes',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// moveZeroes(nums) -> rearranges nums in place and must return the array
function moveZeroes(nums) {
  // TODO: move non-zeroes forward, fill the rest with zeroes, then return nums
}`,
    hints: [
      'Use a write position that only advances when you copy a non-zero value. Where should the zeroes end up afterwards?',
      'First copy every non-zero value to the front in order, then fill the remaining slots with 0 and return the array.',
    ],
    explanation: 'We keep a write pointer for the next free slot at the front. We read through the array and copy each non-zero value to the write slot, advancing it. After the pass, every slot from the write pointer to the end is filled with 0. Non-zero values keep their relative order because we copy them in the order we meet them, and returning the array lets the judge check the final arrangement.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function moveZeroes(nums) {
  let write = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] !== 0) {
      nums[write] = nums[i];
      write++;
    }
  }
  while (write < nums.length) {
    nums[write] = 0;
    write++;
  }
  return nums;
}`,
    visibleTests: [
      { args: [[0, 1, 0, 3, 12]], expected: [1, 3, 12, 0, 0] },
      { args: [[0]], expected: [0] },
    ],
    hiddenTests: [
      { args: [[4, 0, 5, 0, 0, 1]], expected: [4, 5, 1, 0, 0, 0] },
      { args: [[1, 2, 3]], expected: [1, 2, 3] },
      { args: [[0, 0, 0]], expected: [0, 0, 0] },
      { args: [[0, 2, 0]], expected: [2, 0, 0] },
    ],
  },
  // ---------------------------------------------------------------- Strings
  {
    id: 'valid-palindrome',
    topic: 'strings',
    title: 'Valid Palindrome',
    difficulty: 'Easy',
    statement: 'Check whether a string reads the same forwards and backwards. Ignore letter case and skip every character that is not a letter or a digit while checking. An empty cleaned string counts as a valid palindrome.',
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: 'After cleaning it becomes "amanaplanacanalpanama", which reads the same both ways.' },
      { input: 's = "race a car"', output: 'false', explanation: 'Cleaned it is "raceacar", whose reverse is "racaecar", so it does not match.' },
    ],
    constraints: '1 <= s.length <= 2 * 10^5 · s contains printable ASCII characters only',
    fn: 'isPalindrome',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// isPalindrome(s) -> true if s is a palindrome ignoring case and non-alphanumeric chars
function isPalindrome(s) {
  // TODO: clean the string, then compare from both ends
}`,
    hints: [
      'First build a cleaned lowercase version with only letters and digits. What should you compare after that?',
      'Use two pointers, one at each end, and move them inward. Any mismatch means the answer is false.',
    ],
    explanation: 'We first lowercase the string and keep only letters and digits, which removes spaces and punctuation from the picture. Then we place one pointer at the start and one at the end and compare characters while moving inward. If every mirrored pair matches, the cleaned string is a palindrome. Cleaning first keeps the comparison loop simple and easy to reason about.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function isPalindrome(s) {
  const t = s.toLowerCase().replace(/[^a-z0-9]/g, '');
  let i = 0;
  let j = t.length - 1;
  while (i < j) {
    if (t[i] !== t[j]) return false;
    i++;
    j--;
  }
  return true;
}`,
    visibleTests: [
      { args: ['A man, a plan, a canal: Panama'], expected: true },
      { args: ['race a car'], expected: false },
    ],
    hiddenTests: [
      { args: [''], expected: true },
      { args: ["No 'x' in Nixon"], expected: true },
      { args: ['ab_a'], expected: true },
      { args: ['hello'], expected: false },
      { args: ['Was it a car or a cat I saw?'], expected: true },
    ],
  },
  {
    id: 'valid-anagram',
    topic: 'strings',
    title: 'Valid Anagram',
    difficulty: 'Easy',
    statement: 'Two strings are anagrams if one can be formed by rearranging the letters of the other. Given two strings, return true when they use exactly the same letters with the same counts, and false otherwise.',
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true', explanation: 'Both strings contain the same letters: a appears three times and the rest once.' },
      { input: 's = "rat", t = "car"', output: 'false', explanation: 'The second string has a c instead of a t, so the letter counts differ.' },
    ],
    constraints: '1 <= s.length, t.length <= 5 * 10^4 · s and t contain lowercase English letters',
    fn: 'isAnagram',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// isAnagram(s, t) -> true if t is a rearrangement of s
function isAnagram(s, t) {
  // TODO: compare letter counts of both strings
}`,
    hints: [
      'If the lengths differ, can they ever be anagrams? What can you count to compare the two strings?',
      'Count each letter in the first string, then subtract using the second string. Every count must end at zero.',
    ],
    explanation: 'Anagrams must have the same length, so we return false immediately when lengths differ. Then we count how many times each character appears in the first string using a map. We walk the second string and decrease the counts; if a character is missing or a count drops below zero, the strings cannot match. When all counts finish at zero, the strings use identical letters.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
  for (const ch of t) {
    if (!counts.has(ch)) return false;
    const next = counts.get(ch) - 1;
    if (next < 0) return false;
    if (next === 0) counts.delete(ch);
    else counts.set(ch, next);
  }
  return counts.size === 0;
}`,
    visibleTests: [
      { args: ['anagram', 'nagaram'], expected: true },
      { args: ['rat', 'car'], expected: false },
    ],
    hiddenTests: [
      { args: ['listen', 'silent'], expected: true },
      { args: ['hello', 'world'], expected: false },
      { args: ['a', 'a'], expected: true },
      { args: ['ab', 'a'], expected: false },
      { args: ['', ''], expected: true },
    ],
  },
  {
    id: 'reverse-words',
    topic: 'strings',
    title: 'Reverse Words in a String',
    difficulty: 'Medium',
    statement: 'Given a sentence, return the words in reverse order joined by a single space. The input may have extra spaces at the ends or between words, but your output must have no leading or trailing spaces and exactly one space between words.',
    examples: [
      { input: 's = "the sky is blue"', output: '"blue is sky the"', explanation: 'The four words appear in reverse order with single spaces.' },
      { input: 's = "  hello world  "', output: '"world hello"', explanation: 'Outer spaces are removed and the two words swap places.' },
    ],
    constraints: '1 <= s.length <= 10^4 · s contains English letters, digits and spaces · at least one word is present',
    fn: 'reverseWords',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// reverseWords(s) -> words reversed, single spaces, trimmed
function reverseWords(s) {
  // TODO: split into words, reverse them, join with single spaces
}`,
    hints: [
      'How can you get a clean list of words when the input has messy extra spaces?',
      'Trim the string, split on one or more spaces, reverse the list, then join with a single space.',
    ],
    explanation: 'We trim the ends and split the string on runs of whitespace, which gives us a clean list of words with no empty entries. Reversing that list puts the last word first, and joining with a single space rebuilds a tidy sentence. Splitting on whitespace runs is the key step because it handles both the outer padding and the extra inner spaces in one go.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function reverseWords(s) {
  return s.trim().split(/\\s+/).filter(Boolean).reverse().join(' ');
}`,
    visibleTests: [
      { args: ['the sky is blue'], expected: 'blue is sky the' },
      { args: ['  hello world  '], expected: 'world hello' },
    ],
    hiddenTests: [
      { args: ['a good   example'], expected: 'example good a' },
      { args: ['  Bob    Loves  Alice   '], expected: 'Alice Loves Bob' },
      { args: ['one'], expected: 'one' },
      { args: ['  a  b  '], expected: 'b a' },
    ],
  },
  {
    id: 'longest-common-prefix',
    topic: 'strings',
    title: 'Longest Common Prefix',
    difficulty: 'Easy',
    statement: 'Given a list of strings, find the longest starting part that every string shares and return it. If the strings share no common beginning, return an empty string.',
    examples: [
      { input: 'strs = ["flower","flow","flight"]', output: '"fl"', explanation: 'All three words start with "fl", but the third letter already differs.' },
      { input: 'strs = ["dog","racecar","car"]', output: '""', explanation: 'The words start with different letters, so there is no shared prefix.' },
    ],
    constraints: '1 <= strs.length <= 200 · 0 <= strs[i].length <= 200 · strs[i] contains lowercase English letters',
    fn: 'longestCommonPrefix',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// longestCommonPrefix(strs) -> longest prefix shared by every string
function longestCommonPrefix(strs) {
  // TODO: grow the prefix while every string still starts with it
}`,
    hints: [
      'Start by assuming the whole first string is the prefix. What do you do when another string does not start with it?',
      'Keep chopping the last character off the prefix until every string starts with it, or it becomes empty.',
    ],
    explanation: 'We take the first string as our candidate prefix. For each other string, while that string does not start with the candidate, we drop the candidate\'s last character and check again. If the candidate becomes empty we can stop early with an empty answer. This works because a shared prefix of all strings must also be a prefix of the first string, so shrinking it can only remove characters that some string disagrees with.',
    complexity: 'Time O(n * m) · Space O(1)',
    solutionCode: `function longestCommonPrefix(strs) {
  if (strs.length === 0) return '';
  let prefix = strs[0];
  for (let i = 1; i < strs.length; i++) {
    while (!strs[i].startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (prefix === '') return '';
    }
  }
  return prefix;
}`,
    visibleTests: [
      { args: [['flower', 'flow', 'flight']], expected: 'fl' },
      { args: [['dog', 'racecar', 'car']], expected: '' },
    ],
    hiddenTests: [
      { args: [['interview', 'internet', 'internal']], expected: 'inter' },
      { args: [['']], expected: '' },
      { args: [['a']], expected: 'a' },
      { args: [['ab', 'a']], expected: 'a' },
      { args: [['abc', 'abd', 'ab']], expected: 'ab' },
    ],
  },
  // ---------------------------------------------------------------- Hashing
  {
    id: 'contains-duplicate',
    topic: 'hashing',
    title: 'Contains Duplicate',
    difficulty: 'Easy',
    statement: 'Look at an array of numbers and decide whether any value appears two or more times. Return true if at least one value repeats, and false when every value is distinct.',
    examples: [
      { input: 'nums = [1,2,3,1]', output: 'true', explanation: 'The value 1 shows up at the start and again at the end.' },
      { input: 'nums = [1,2,3,4]', output: 'false', explanation: 'All four values are different from each other.' },
    ],
    constraints: '1 <= nums.length <= 10^5 · -10^9 <= nums[i] <= 10^9',
    fn: 'containsDuplicate',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// containsDuplicate(nums) -> true if any value appears at least twice
function containsDuplicate(nums) {
  // TODO: remember values you have seen and spot a repeat
}`,
    hints: [
      'What data structure tells you quickly whether you have met a value before?',
      'Add each value to a set as you go. If a value is already in the set, you found a duplicate.',
    ],
    explanation: 'We scan the array once while storing every value we pass in a set. Sets answer membership questions in constant time, so if the current value is already stored we know it appeared earlier and we can return true. If we finish the scan without a repeat, all values were distinct. This trades a little memory for a single fast pass.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function containsDuplicate(nums) {
  const seen = new Set();
  for (const n of nums) {
    if (seen.has(n)) return true;
    seen.add(n);
  }
  return false;
}`,
    visibleTests: [
      { args: [[1, 2, 3, 1]], expected: true },
      { args: [[1, 2, 3, 4]], expected: false },
    ],
    hiddenTests: [
      { args: [[1, 1, 1, 3, 3, 4, 3, 2, 4, 2]], expected: true },
      { args: [[]], expected: false },
      { args: [[5]], expected: false },
      { args: [[0, 0]], expected: true },
    ],
  },
  {
    id: 'first-unique-char',
    topic: 'hashing',
    title: 'First Unique Character in a String',
    difficulty: 'Easy',
    statement: 'Given a string, find the first character that appears exactly once in the whole string and return its index. If every character repeats, return -1.',
    examples: [
      { input: 's = "leetcode"', output: '0', explanation: 'The letter l appears only once and it sits at index 0.' },
      { input: 's = "aabb"', output: '-1', explanation: 'Both a and b repeat, so no character is unique.' },
    ],
    constraints: '1 <= s.length <= 10^5 · s contains lowercase English letters',
    fn: 'firstUniqChar',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// firstUniqChar(s) -> index of first char that occurs once, else -1
function firstUniqChar(s) {
  // TODO: count characters first, then find the first with count 1
}`,
    hints: [
      'One pass is not enough because a character can repeat later. What do you need to know before deciding?',
      'Count every character first. Then scan again and return the first index whose count is exactly 1.',
    ],
    explanation: 'We make two passes. The first pass counts how many times each character occurs in the whole string. The second pass goes left to right and returns the first index whose character has a total count of one. Two passes are needed because uniqueness is a property of the full string: a character that looks unique early on might appear again later.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function firstUniqChar(s) {
  const counts = new Map();
  for (const ch of s) counts.set(ch, (counts.get(ch) || 0) + 1);
  for (let i = 0; i < s.length; i++) {
    if (counts.get(s[i]) === 1) return i;
  }
  return -1;
}`,
    visibleTests: [
      { args: ['leetcode'], expected: 0 },
      { args: ['loveleetcode'], expected: 2 },
      { args: ['aabb'], expected: -1 },
    ],
    hiddenTests: [
      { args: ['aadadaad'], expected: -1 },
      { args: ['z'], expected: 0 },
      { args: ['aabbc'], expected: 4 },
      { args: ['abcabcx'], expected: 6 },
    ],
  },
  {
    id: 'group-anagrams',
    topic: 'hashing',
    title: 'Group Anagrams',
    difficulty: 'Medium',
    statement: 'You are given a list of words. Put words that are rearrangements of each other into the same group and return all the groups. The groups and the words inside them can be returned in any order.',
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]', explanation: 'Eat, tea and ate share the same letters, tan and nat pair up, and bat stays alone.' },
      { input: 'strs = ["a"]', output: '[["a"]]', explanation: 'A single word forms a single group.' },
    ],
    constraints: '1 <= strs.length <= 10^4 · 0 <= strs[i].length <= 100 · strs[i] contains lowercase English letters',
    fn: 'groupAnagrams',
    kind: 'plain',
    normalize: 'sortGroups',
    starterCode: `// groupAnagrams(strs) -> array of groups, each group an array of words
function groupAnagrams(strs) {
  // TODO: give each word a shared key and bucket words by that key
}`,
    hints: [
      'Anagrams look different as words but identical after one small transformation. What transformation makes them equal?',
      'Sort the letters of each word to build a key. Words with the same key belong in the same bucket.',
    ],
    explanation: 'Two words are anagrams exactly when sorting their letters gives the same string, so we use that sorted string as a key. We walk the word list, compute each word\'s key, and append the original word to the bucket stored under that key in a map. At the end, the map\'s buckets are precisely the anagram groups. Sorting letters is the fingerprint that makes equal-letter words collide on the same key.',
    complexity: 'Time O(n * k log k) · Space O(n * k)',
    solutionCode: `function groupAnagrams(strs) {
  const groups = new Map();
  for (const word of strs) {
    const key = word.split('').sort().join('');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(word);
  }
  return [...groups.values()];
}`,
    visibleTests: [
      { args: [['eat', 'tea', 'tan', 'ate', 'nat', 'bat']], expected: [['bat'], ['nat', 'tan'], ['ate', 'eat', 'tea']] },
      { args: [['']], expected: [['']] },
      { args: [['a']], expected: [['a']] },
    ],
    hiddenTests: [
      { args: [['abc', 'bca', 'cab', 'xyz', 'zyx']], expected: [['abc', 'bca', 'cab'], ['xyz', 'zyx']] },
      { args: [['ab', 'ba', 'abc']], expected: [['ab', 'ba'], ['abc']] },
      { args: [['tan', 'nat', 'bat', 'tab']], expected: [['bat', 'tab'], ['nat', 'tan']] },
      { args: [['', '']], expected: [['', '']] },
    ],
  },
  // ---------------------------------------------------------------- Two Pointers
  {
    id: 'container-most-water',
    topic: 'two-pointers',
    title: 'Container With Most Water',
    difficulty: 'Medium',
    statement: 'Each number is the height of a vertical line drawn at that position. Pick two lines so that together with the bottom they form a container holding the most water. The water level is limited by the shorter line and the width is the distance between the lines. Return the largest area you can get.',
    examples: [
      { input: 'height = [1,8,6,2,5,4,8,3,7]', output: '49', explanation: 'The lines of height 8 and 7 are 7 apart, and the shorter one is 7, giving 7 * 7 = 49.' },
      { input: 'height = [1,1]', output: '1', explanation: 'Two lines of height 1 with width 1 hold an area of 1.' },
    ],
    constraints: '2 <= height.length <= 10^5 · 0 <= height[i] <= 10^4',
    fn: 'maxArea',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// maxArea(height) -> largest water area between any two lines
function maxArea(height) {
  // TODO: start with the widest pair and shrink from the shorter side
}`,
    hints: [
      'Start with the widest possible container. To have any chance of beating it, which side should move?',
      'Keep pointers at both ends. Record the area, then move the pointer at the shorter line inward.',
    ],
    explanation: 'We start with the leftmost and rightmost lines, which give the maximum width. The area is width times the shorter height. Then we move the pointer on the shorter side inward, because moving the taller side can never raise the limiting height while the width only shrinks. Each step keeps the best area seen, and since every step discards only pairs that cannot beat the current width with a taller limit, the best pair is never missed.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function maxArea(height) {
  let left = 0;
  let right = height.length - 1;
  let best = 0;
  while (left < right) {
    const area = Math.min(height[left], height[right]) * (right - left);
    if (area > best) best = area;
    if (height[left] < height[right]) left++;
    else right--;
  }
  return best;
}`,
    visibleTests: [
      { args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
      { args: [[1, 1]], expected: 1 },
    ],
    hiddenTests: [
      { args: [[4, 3, 2, 1, 4]], expected: 16 },
      { args: [[1, 2, 1]], expected: 2 },
      { args: [[1, 2, 3, 4, 5]], expected: 6 },
      { args: [[8, 7, 2, 1]], expected: 7 },
      { args: [[5, 5]], expected: 5 },
    ],
  },
  {
    id: 'three-sum',
    topic: 'two-pointers',
    title: '3Sum',
    difficulty: 'Medium',
    statement: 'Given an array of numbers, find every group of three different positions whose values add up to zero. Return the list of value triplets. The same value combination must not appear twice, and the triplets can be in any order.',
    examples: [
      { input: 'nums = [-1,0,1,2,-1,-4]', output: '[[-1,-1,2],[-1,0,1]]', explanation: 'The triplets -1, -1, 2 and -1, 0, 1 both sum to zero.' },
      { input: 'nums = [0,0,0]', output: '[[0,0,0]]', explanation: 'Three zeroes sum to zero and form the only triplet.' },
    ],
    constraints: '3 <= nums.length <= 3000 · -10^5 <= nums[i] <= 10^5',
    fn: 'threeSum',
    kind: 'plain',
    normalize: 'sortTriplets',
    starterCode: `// threeSum(nums) -> all unique value triplets that sum to 0
function threeSum(nums) {
  // TODO: sort first, fix one value, then hunt for a pair with two pointers
}`,
    hints: [
      'After sorting, fixing one number turns the problem into finding two numbers that sum to its negative. How do you skip duplicate answers?',
      'Sort the array. For each fixed index, move left and right pointers based on the sum, and skip repeated values at every level.',
    ],
    explanation: 'Sorting lets us use two pointers for the pair search. We fix the first value, then look for two other values that sum to its negative by moving a left and a right pointer: if the total is too small we advance the left pointer, if too large we step the right pointer back. When we find a zero sum we record the triplet and skip over duplicate values so the same combination is not reported twice. Skipping duplicates for the fixed value as well keeps the whole answer duplicate-free.',
    complexity: 'Time O(n^2) · Space O(1)',
    solutionCode: `function threeSum(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const res = [];
  for (let i = 0; i < sorted.length - 2; i++) {
    if (i > 0 && sorted[i] === sorted[i - 1]) continue;
    let left = i + 1;
    let right = sorted.length - 1;
    while (left < right) {
      const sum = sorted[i] + sorted[left] + sorted[right];
      if (sum === 0) {
        res.push([sorted[i], sorted[left], sorted[right]]);
        while (left < right && sorted[left] === sorted[left + 1]) left++;
        while (left < right && sorted[right] === sorted[right - 1]) right--;
        left++;
        right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }
  return res;
}`,
    visibleTests: [
      { args: [[-1, 0, 1, 2, -1, -4]], expected: [[-1, -1, 2], [-1, 0, 1]] },
      { args: [[0, 1, 1]], expected: [] },
      { args: [[0, 0, 0]], expected: [[0, 0, 0]] },
    ],
    hiddenTests: [
      { args: [[-2, 0, 1, 1, 2]], expected: [[-2, 0, 2], [-2, 1, 1]] },
      { args: [[1, 2, -2, -1]], expected: [] },
      { args: [[-4, -1, -1, 0, 1, 2]], expected: [[-1, -1, 2], [-1, 0, 1]] },
      { args: [[3, 0, -2, -1, 1, 2]], expected: [[-2, -1, 3], [-2, 0, 2], [-1, 0, 1]] },
    ],
  },
  {
    id: 'remove-duplicates-sorted',
    topic: 'two-pointers',
    title: 'Remove Duplicates from Sorted Array',
    difficulty: 'Easy',
    statement: 'The array is sorted in non-decreasing order but may contain repeated values. Rearrange it in place so the first k positions hold each distinct value exactly once in sorted order, and return k. Values beyond the first k positions do not matter.',
    examples: [
      { input: 'nums = [1,1,2]', output: 'k = 2, nums = [1, 2, _]', explanation: 'The distinct values 1 and 2 occupy the first two slots.' },
      { input: 'nums = [0,0,1,1,1,2,2,3,3,4]', output: 'k = 5, nums = [0, 1, 2, 3, 4, _, _, _, _, _]', explanation: 'Five distinct values remain at the front in order.' },
    ],
    constraints: '0 <= nums.length <= 3 * 10^4 · -100 <= nums[i] <= 100 · nums is sorted in non-decreasing order',
    fn: 'removeDuplicates',
    kind: 'kprefix',
    normalize: 'none',
    starterCode: `// removeDuplicates(nums) -> mutates nums, returns k (count of unique values at front)
function removeDuplicates(nums) {
  // TODO: use a write pointer for the next unique slot and return the count
}`,
    hints: [
      'Because the array is sorted, equal values sit next to each other. When does a value deserve a front slot?',
      'Keep a write index. Copy a value forward only when it differs from the value before it, then return the write count.',
    ],
    explanation: 'Since the array is sorted, duplicates are always neighbours, so a value is new exactly when it differs from the previous one. We keep a write pointer for the slot where the next unique value belongs. We read through the array and copy each new value to the write slot, advancing it. At the end the write pointer equals the number of distinct values, and the first that many slots hold them in order.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function removeDuplicates(nums) {
  if (nums.length === 0) return 0;
  let write = 1;
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] !== nums[i - 1]) {
      nums[write] = nums[i];
      write++;
    }
  }
  return write;
}`,
    visibleTests: [
      { args: [[1, 1, 2]], expected: { k: 2, prefix: [1, 2] } },
      { args: [[0, 0, 1, 1, 1, 2, 2, 3, 3, 4]], expected: { k: 5, prefix: [0, 1, 2, 3, 4] } },
    ],
    hiddenTests: [
      { args: [[1]], expected: { k: 1, prefix: [1] } },
      { args: [[]], expected: { k: 0, prefix: [] } },
      { args: [[1, 1, 1]], expected: { k: 1, prefix: [1] } },
      { args: [[1, 2, 3]], expected: { k: 3, prefix: [1, 2, 3] } },
      { args: [[-3, -1, 0, 0, 0, 3, 3]], expected: { k: 4, prefix: [-3, -1, 0, 3] } },
    ],
  },
  // ---------------------------------------------------------------- Sliding Window
  {
    id: 'max-window-sum',
    topic: 'sliding-window',
    title: 'Maximum Sum Subarray of Size K',
    difficulty: 'Easy',
    statement: 'Given an array of numbers and a window size k, look at every block of k consecutive elements and find the largest sum among those blocks. Return that maximum sum. Assume k is between 1 and the length of the array.',
    examples: [
      { input: 'nums = [2,1,5,1,3,2], k = 3', output: '9', explanation: 'The block [5,1,3] sums to 9, the best among all size-3 blocks.' },
      { input: 'nums = [2,3,4,1,5], k = 2', output: '7', explanation: 'The pair [3,4] gives 7, which beats every other adjacent pair.' },
    ],
    constraints: '1 <= k <= nums.length <= 10^5 · -10^4 <= nums[i] <= 10^4',
    fn: 'maxWindowSum',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// maxWindowSum(nums, k) -> largest sum of any k consecutive elements
function maxWindowSum(nums, k) {
  // TODO: sum the first window, then slide it one step at a time
}`,
    hints: [
      'When the window moves one step right, which value leaves and which value enters?',
      'Build the first window sum directly. Each slide subtracts the leaving value and adds the entering one.',
    ],
    explanation: 'We add up the first k values to form the initial window and remember it as the best so far. Then we slide the window one position at a time: the element falling off the left is subtracted and the new element on the right is added, giving the next window sum in constant time. Keeping the maximum over all windows yields the answer without ever resummoning a whole block.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function maxWindowSum(nums, k) {
  let windowSum = 0;
  for (let i = 0; i < k; i++) windowSum += nums[i];
  let best = windowSum;
  for (let i = k; i < nums.length; i++) {
    windowSum += nums[i] - nums[i - k];
    if (windowSum > best) best = windowSum;
  }
  return best;
}`,
    visibleTests: [
      { args: [[2, 1, 5, 1, 3, 2], 3], expected: 9 },
      { args: [[2, 3, 4, 1, 5], 2], expected: 7 },
    ],
    hiddenTests: [
      { args: [[1, 4, 2, 10, 23, 3, 1, 0, 20], 4], expected: 39 },
      { args: [[5, 5, 5], 3], expected: 15 },
      { args: [[-1, -2, -3], 2], expected: -3 },
      { args: [[7], 1], expected: 7 },
    ],
  },
  {
    id: 'longest-substring-norepeat',
    topic: 'sliding-window',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    statement: 'Given a string, find the length of the longest stretch of consecutive characters in which no character repeats. The stretch must be contiguous. Return just the length.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The stretch "abc" has length 3 and no repeats, and nothing longer works.' },
      { input: 's = "pwwkew"', output: '3', explanation: '"wke" is a valid stretch of length 3.' },
    ],
    constraints: '0 <= s.length <= 5 * 10^4 · s contains English letters, digits, symbols and spaces',
    fn: 'lengthOfLongestSubstring',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// lengthOfLongestSubstring(s) -> length of longest substring with all unique chars
function lengthOfLongestSubstring(s) {
  // TODO: grow a window and shrink it whenever a character repeats
}`,
    hints: [
      'Keep a window that never contains a duplicate. When a repeat enters, from where must the window restart?',
      'Remember the last index of each character. When you meet a character already inside the window, jump the left edge past its previous spot.',
    ],
    explanation: 'We maintain a window whose characters are all distinct, with a left and right edge. The right edge grows one character at a time. If that character was last seen inside the current window, we move the left edge just past that earlier occurrence so the duplicate disappears. We record the window size at each step and keep the maximum. Remembering last positions lets the left edge jump directly instead of creeping, so each character is processed a constant number of times.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function lengthOfLongestSubstring(s) {
  const lastSeen = new Map();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    if (lastSeen.has(ch) && lastSeen.get(ch) >= left) {
      left = lastSeen.get(ch) + 1;
    }
    lastSeen.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}`,
    visibleTests: [
      { args: ['abcabcbb'], expected: 3 },
      { args: ['bbbbb'], expected: 1 },
      { args: ['pwwkew'], expected: 3 },
    ],
    hiddenTests: [
      { args: [''], expected: 0 },
      { args: [' '], expected: 1 },
      { args: ['dvdf'], expected: 3 },
      { args: ['anviaj'], expected: 5 },
      { args: ['au'], expected: 2 },
    ],
  },
  {
    id: 'min-window-substring',
    topic: 'sliding-window',
    title: 'Minimum Window Substring',
    difficulty: 'Hard',
    statement: 'Given two strings s and t, find the smallest contiguous part of s that contains every character of t at least as many times as it appears in t. Return that substring, or an empty string if no part of s can cover t.',
    examples: [
      { input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"', explanation: 'BANC contains one A, one B and one C, and no shorter part of s does.' },
      { input: 's = "a", t = "aa"', output: '""', explanation: 'The single a cannot supply the two copies that t needs.' },
    ],
    constraints: '1 <= s.length, t.length <= 10^5 · s and t contain uppercase and lowercase English letters',
    fn: 'minWindow',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// minWindow(s, t) -> smallest substring of s covering all chars of t
function minWindow(s, t) {
  // TODO: expand the window until it covers t, then shrink it as far as possible
}`,
    hints: [
      'First count what t needs. How do you know when your current window finally has enough of everything?',
      'Grow the right edge until the window covers t, then move the left edge in while coverage holds, recording the best window.',
    ],
    explanation: 'We count how many copies of each character t requires. Then we slide a window over s: the right edge expands and we track how many required characters are currently satisfied inside the window. Once every requirement is met, we shrink from the left as far as possible while the window stays valid, and we remember the smallest valid window seen. Because each edge only moves forward, every character enters and leaves the window at most once.',
    complexity: 'Time O(|s| + |t|) · Space O(|s| + |t|)',
    solutionCode: `function minWindow(s, t) {
  if (t.length === 0 || s.length === 0) return '';
  const need = new Map();
  for (const ch of t) need.set(ch, (need.get(ch) || 0) + 1);
  const required = need.size;
  const windowCounts = new Map();
  let formed = 0;
  let left = 0;
  let bestLen = Infinity;
  let bestL = 0;
  for (let right = 0; right < s.length; right++) {
    const ch = s[right];
    windowCounts.set(ch, (windowCounts.get(ch) || 0) + 1);
    if (need.has(ch) && windowCounts.get(ch) === need.get(ch)) formed++;
    while (formed === required) {
      if (right - left + 1 < bestLen) {
        bestLen = right - left + 1;
        bestL = left;
      }
      const leftCh = s[left];
      windowCounts.set(leftCh, windowCounts.get(leftCh) - 1);
      if (need.has(leftCh) && windowCounts.get(leftCh) < need.get(leftCh)) formed--;
      left++;
    }
  }
  return bestLen === Infinity ? '' : s.slice(bestL, bestL + bestLen);
}`,
    visibleTests: [
      { args: ['ADOBECODEBANC', 'ABC'], expected: 'BANC' },
      { args: ['a', 'a'], expected: 'a' },
      { args: ['a', 'aa'], expected: '' },
    ],
    hiddenTests: [
      { args: ['aa', 'aa'], expected: 'aa' },
      { args: ['ab', 'a'], expected: 'a' },
      { args: ['bbaa', 'aba'], expected: 'baa' },
      { args: ['acbdba', 'ab'], expected: 'ba' },
      { args: ['xyz', 'xyz'], expected: 'xyz' },
    ],
  },
  // ---------------------------------------------------------------- Binary Search
  {
    id: 'binary-search',
    topic: 'binary-search',
    title: 'Binary Search',
    difficulty: 'Easy',
    statement: 'The array is sorted in increasing order with distinct values. Find the index of the target value and return it. If the target is not in the array, return -1.',
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4', explanation: 'The value 9 sits at index 4.' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: 'There is no 2 in the array.' },
    ],
    constraints: '1 <= nums.length <= 10^4 · -10^4 <= nums[i], target <= 10^4 · all values are distinct and sorted ascending',
    fn: 'search',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// search(nums, target) -> index of target in sorted nums, or -1
function search(nums, target) {
  // TODO: halve the search range until you find the target or run out
}`,
    hints: [
      'Check the middle element. What does its comparison with the target tell you about which half can hold the answer?',
      'Keep left and right bounds. If the middle is too small, search the right half; if too big, search the left half.',
    ],
    explanation: 'Because the array is sorted, looking at the middle element tells us which side the target can live on. If the middle equals the target we are done. If it is smaller, the target must be to the right; if larger, it must be to the left. Each step throws away half of the remaining range, so the search finishes in logarithmic time.',
    complexity: 'Time O(log n) · Space O(1)',
    solutionCode: `function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}`,
    visibleTests: [
      { args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
    ],
    hiddenTests: [
      { args: [[5], 5], expected: 0 },
      { args: [[5], -5], expected: -1 },
      { args: [[1, 3, 5, 7], 7], expected: 3 },
      { args: [[1, 3, 5, 7], 4], expected: -1 },
      { args: [[], 1], expected: -1 },
    ],
  },
  {
    id: 'search-insert',
    topic: 'binary-search',
    title: 'Search Insert Position',
    difficulty: 'Easy',
    statement: 'The array is sorted in increasing order with distinct values. If the target is present, return its index. Otherwise return the index where the target would be inserted to keep the array sorted.',
    examples: [
      { input: 'nums = [1,3,5,6], target = 5', output: '2', explanation: 'The value 5 is already at index 2.' },
      { input: 'nums = [1,3,5,6], target = 2', output: '1', explanation: 'A 2 would slot between 1 and 3, which is index 1.' },
    ],
    constraints: '1 <= nums.length <= 10^4 · -10^4 <= nums[i], target <= 10^4 · all values are distinct and sorted ascending',
    fn: 'searchInsert',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// searchInsert(nums, target) -> index of target or where it would be inserted
function searchInsert(nums, target) {
  // TODO: find the first position whose value is not smaller than target
}`,
    hints: [
      'You are looking for the first element that is greater than or equal to the target. How does the usual binary search end state give you that?',
      'Run binary search for the lower bound. When the loop ends, the left pointer sits exactly at the insertion point.',
    ],
    explanation: 'The insertion point is the first index whose value is not smaller than the target, also called the lower bound. Binary search maintains the idea that everything left of the left pointer is smaller than the target and everything from the right pointer onward is at least the target. When the pointers meet, that meeting index is either the target itself or the correct slot for it, so we return the left pointer.',
    complexity: 'Time O(log n) · Space O(1)',
    solutionCode: `function searchInsert(nums, target) {
  let left = 0;
  let right = nums.length;
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] < target) left = mid + 1;
    else right = mid;
  }
  return left;
}`,
    visibleTests: [
      { args: [[1, 3, 5, 6], 5], expected: 2 },
      { args: [[1, 3, 5, 6], 2], expected: 1 },
      { args: [[1, 3, 5, 6], 7], expected: 4 },
    ],
    hiddenTests: [
      { args: [[1, 3, 5, 6], 0], expected: 0 },
      { args: [[1], 0], expected: 0 },
      { args: [[1], 2], expected: 1 },
      { args: [[1, 3], 3], expected: 1 },
    ],
  },
  {
    id: 'first-last-position',
    topic: 'binary-search',
    title: 'First and Last Position in Sorted Array',
    difficulty: 'Medium',
    statement: 'The array is sorted in non-decreasing order and may contain duplicates. Find the first and last index where the target appears and return them as a pair. If the target is absent, return [-1, -1].',
    examples: [
      { input: 'nums = [5,7,7,8,8,10], target = 8', output: '[3, 4]', explanation: 'The value 8 occupies indices 3 and 4.' },
      { input: 'nums = [5,7,7,8,8,10], target = 6', output: '[-1, -1]', explanation: 'There is no 6 in the array.' },
    ],
    constraints: '0 <= nums.length <= 10^5 · -10^9 <= nums[i], target <= 10^9 · nums is sorted in non-decreasing order',
    fn: 'searchRange',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// searchRange(nums, target) -> [firstIndex, lastIndex] or [-1, -1]
function searchRange(nums, target) {
  // TODO: binary search twice, once biased left and once biased right
}`,
    hints: [
      'A normal binary search finds some copy of the target but not necessarily an edge copy. What changes if you keep searching after a hit?',
      'Search once for the leftmost copy by continuing left after each hit, and once for the rightmost copy by continuing right.',
    ],
    explanation: 'We run binary search twice. For the first position, whenever we land on the target we record the index but keep searching the left half, since an earlier copy may exist. For the last position we do the mirror image, recording and continuing right. If the target never appears, both searches report nothing and we return [-1, -1]. Each search stays logarithmic because it still halves the range every step.',
    complexity: 'Time O(log n) · Space O(1)',
    solutionCode: `function searchRange(nums, target) {
  const findBound = (isFirst) => {
    let left = 0;
    let right = nums.length - 1;
    let ans = -1;
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (nums[mid] === target) {
        ans = mid;
        if (isFirst) right = mid - 1;
        else left = mid + 1;
      } else if (nums[mid] < target) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return ans;
  };
  return [findBound(true), findBound(false)];
}`,
    visibleTests: [
      { args: [[5, 7, 7, 8, 8, 10], 8], expected: [3, 4] },
      { args: [[5, 7, 7, 8, 8, 10], 6], expected: [-1, -1] },
      { args: [[], 0], expected: [-1, -1] },
    ],
    hiddenTests: [
      { args: [[1], 1], expected: [0, 0] },
      { args: [[2, 2], 2], expected: [0, 1] },
      { args: [[1, 2, 3], 2], expected: [1, 1] },
      { args: [[8, 8, 8, 8], 8], expected: [0, 3] },
    ],
  },
  // ---------------------------------------------------------------- Sorting
  {
    id: 'sort-colors',
    topic: 'sorting',
    title: 'Sort Colors',
    difficulty: 'Medium',
    statement: 'The array contains only the values 0, 1 and 2, which stand for red, white and blue. Sort the array so all 0s come first, then all 1s, then all 2s. Do the sorting in the given array and return the array when you are done.',
    examples: [
      { input: 'nums = [2,0,2,1,1,0]', output: '[0, 0, 1, 1, 2, 2]', explanation: 'The six values end up grouped by value in ascending order.' },
      { input: 'nums = [2,0,1]', output: '[0, 1, 2]', explanation: 'Each value appears once, fully sorted.' },
    ],
    constraints: '1 <= nums.length <= 300 · nums[i] is 0, 1 or 2',
    fn: 'sortColors',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// sortColors(nums) -> sorts 0s, 1s, 2s in place and must return the array
function sortColors(nums) {
  // TODO: partition into three bands in one pass, then return nums
}`,
    hints: [
      'Imagine three regions: 0s on the left, 2s on the right, and the unknown middle. What do you do with each value you meet?',
      'Keep low, mid and high pointers. Swap 0s to the front and 2s to the back while scanning with mid.',
    ],
    explanation: 'We keep three pointers that split the array into a finished 0 region on the left, a finished 2 region on the right, and an unprocessed middle. When the middle value is 0 we swap it into the left region and advance both pointers; when it is 2 we swap it into the right region and pull that boundary in; when it is 1 it already belongs in the middle so we just advance. Every element is placed into its final band in a single pass, and we return the array as required.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function sortColors(nums) {
  let low = 0;
  let mid = 0;
  let high = nums.length - 1;
  while (mid <= high) {
    if (nums[mid] === 0) {
      [nums[low], nums[mid]] = [nums[mid], nums[low]];
      low++;
      mid++;
    } else if (nums[mid] === 1) {
      mid++;
    } else {
      [nums[mid], nums[high]] = [nums[high], nums[mid]];
      high--;
    }
  }
  return nums;
}`,
    visibleTests: [
      { args: [[2, 0, 2, 1, 1, 0]], expected: [0, 0, 1, 1, 2, 2] },
      { args: [[2, 0, 1]], expected: [0, 1, 2] },
    ],
    hiddenTests: [
      { args: [[0]], expected: [0] },
      { args: [[1, 0]], expected: [0, 1] },
      { args: [[2, 2, 2]], expected: [2, 2, 2] },
      { args: [[0, 1, 2, 0, 1, 2]], expected: [0, 0, 1, 1, 2, 2] },
    ],
  },
  {
    id: 'merge-intervals',
    topic: 'sorting',
    title: 'Merge Intervals',
    difficulty: 'Medium',
    statement: 'You are given a collection of intervals, each with a start and an end. Merge every pair of intervals that overlap or touch at an endpoint into one bigger interval, and return the merged list sorted by start time.',
    examples: [
      { input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', explanation: '[1,3] and [2,6] overlap, so they become [1,6]; the rest stand alone.' },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]', explanation: 'The intervals touch at 4, so they merge into [1,5].' },
    ],
    constraints: '1 <= intervals.length <= 10^4 · intervals[i].length == 2 · 0 <= start <= end <= 10^4',
    fn: 'merge',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// merge(intervals) -> merged non-overlapping intervals sorted by start
function merge(intervals) {
  // TODO: sort by start, then extend or start a new interval as you scan
}`,
    hints: [
      'Overlaps are much easier to spot once intervals are ordered. What order makes neighbouring intervals the only ones that can merge?',
      'Sort by start. Keep a current interval and extend its end whenever the next interval starts inside it.',
    ],
    explanation: 'We sort the intervals by their start value so that any intervals able to merge sit next to each other. Then we scan once, keeping a current merged interval. If the next interval starts after the current one ends, it cannot overlap anything earlier either, so we save the current interval and start a new one. Otherwise we extend the current end to the larger of the two ends. Sorting first is what reduces the whole problem to this single neighbour check.',
    complexity: 'Time O(n log n) · Space O(n)',
    solutionCode: `function merge(intervals) {
  if (intervals.length === 0) return [];
  const sorted = intervals.map((iv) => [...iv]).sort((a, b) => a[0] - b[0]);
  const res = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = res[res.length - 1];
    const [start, end] = sorted[i];
    if (start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      res.push([start, end]);
    }
  }
  return res;
}`,
    visibleTests: [
      { args: [[[1, 3], [2, 6], [8, 10], [15, 18]]], expected: [[1, 6], [8, 10], [15, 18]] },
      { args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
    ],
    hiddenTests: [
      { args: [[[1, 4], [0, 4]]], expected: [[0, 4]] },
      { args: [[[1, 4], [2, 3]]], expected: [[1, 4]] },
      { args: [[[1, 4], [0, 2], [3, 5]]], expected: [[0, 5]] },
      { args: [[[2, 3], [1, 2]]], expected: [[1, 3]] },
      { args: [[[5, 6]]], expected: [[5, 6]] },
    ],
  },
  {
    id: 'kth-largest',
    topic: 'sorting',
    title: 'Kth Largest Element in an Array',
    difficulty: 'Medium',
    statement: 'Given an array of numbers and an integer k, find the value that would sit at position k if the array were sorted from largest to smallest. Return that value. Note that duplicate values count as separate positions.',
    examples: [
      { input: 'nums = [3,2,1,5,6,4], k = 2', output: '5', explanation: 'From largest down the order is 6, 5, 4, so position 2 holds 5.' },
      { input: 'nums = [3,2,3,1,2,4,5,5,6], k = 4', output: '4', explanation: 'The descending order starts 6, 5, 5, 4, so the 4th value is 4.' },
    ],
    constraints: '1 <= k <= nums.length <= 10^5 · -10^4 <= nums[i] <= 10^4',
    fn: 'findKthLargest',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// findKthLargest(nums, k) -> the kth largest value (duplicates count separately)
function findKthLargest(nums, k) {
  // TODO: order the values and pick the one at the kth spot from the top
}`,
    hints: [
      'If the array were sorted descending, which index holds the answer? Can you get away with a simpler ordering idea first?',
      'Sort a copy in descending order and return the element at index k - 1.',
    ],
    explanation: 'The simplest reliable route is to sort the numbers from largest to smallest. After sorting, the kth largest sits exactly at index k - 1 because indices start at zero. Duplicates naturally occupy their own positions in the sorted order, which matches how the problem counts them. Sorting costs a bit more than a selection algorithm, but it is short, clear and correct for every input here.',
    complexity: 'Time O(n log n) · Space O(n)',
    solutionCode: `function findKthLargest(nums, k) {
  const sorted = [...nums].sort((a, b) => b - a);
  return sorted[k - 1];
}`,
    visibleTests: [
      { args: [[3, 2, 1, 5, 6, 4], 2], expected: 5 },
      { args: [[3, 2, 3, 1, 2, 4, 5, 5, 6], 4], expected: 4 },
    ],
    hiddenTests: [
      { args: [[1], 1], expected: 1 },
      { args: [[2, 1], 1], expected: 2 },
      { args: [[2, 1], 2], expected: 1 },
      { args: [[-1, -2, -3], 1], expected: -1 },
      { args: [[7, 6, 5, 4, 3, 2, 1], 5], expected: 3 },
    ],
  },
  // ---------------------------------------------------------------- Linked List
  {
    id: 'reverse-linked-list',
    topic: 'linked-list',
    title: 'Reverse Linked List',
    difficulty: 'Easy',
    statement: 'You are given the head of a singly linked list where each node has a val and a next pointer. Reverse the direction of every link so the last node becomes the new head, and return the new head. An empty list stays empty.',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5, 4, 3, 2, 1]', explanation: 'Every arrow flips, so the list reads from 5 down to 1.' },
      { input: 'head = [1,2]', output: '[2, 1]', explanation: 'The two nodes swap order.' },
    ],
    constraints: '0 <= number of nodes <= 5000 · -5000 <= val <= 5000',
    fn: 'reverseList',
    kind: 'linkedlist',
    normalize: 'none',
    starterCode: `// reverseList(head) -> new head after reversing the list; nodes look like { val, next }
function reverseList(head) {
  // TODO: walk the list and flip each next pointer as you go
}`,
    hints: [
      'Before you flip a node\'s next pointer, what information would you lose if you did not save it first?',
      'Keep prev, curr and a saved next. Point curr back to prev, then advance all three.',
    ],
    explanation: 'We walk the list with two pointers: prev starts empty and curr starts at the head. At each node we first save its next node, then point the node back to prev, and finally move prev and curr one step forward. Saving next before flipping is essential because flipping destroys our only path forward. When curr runs off the end, prev points at the old tail, which is the new head.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function reverseList(head) {
  let prev = null;
  let curr = head;
  while (curr) {
    const next = curr.next;
    curr.next = prev;
    prev = curr;
    curr = next;
  }
  return prev;
}`,
    visibleTests: [
      { args: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
      { args: [[1, 2]], expected: [2, 1] },
      { args: [[]], expected: [] },
    ],
    hiddenTests: [
      { args: [[1]], expected: [1] },
      { args: [[7, 8, 9]], expected: [9, 8, 7] },
      { args: [[1, 2, 3]], expected: [3, 2, 1] },
      { args: [[-1, 0, 5]], expected: [5, 0, -1] },
    ],
  },
  {
    id: 'merge-two-sorted-lists',
    topic: 'linked-list',
    title: 'Merge Two Sorted Lists',
    difficulty: 'Easy',
    statement: 'You are given the heads of two singly linked lists that are each sorted in increasing order. Splice them into a single sorted linked list and return its head. Either list may be empty. Both arguments arrive as list heads (nodes look like { val, next }), and you return the head of the merged list.',
    examples: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1, 1, 2, 3, 4, 4]', explanation: 'Picking the smaller front value each time produces one sorted chain.' },
      { input: 'list1 = [], list2 = [0]', output: '[0]', explanation: 'With the first list empty, the answer is just the second list.' },
    ],
    constraints: '0 <= nodes in each list <= 50 · -100 <= val <= 100 · both lists are sorted ascending',
    fn: 'mergeTwoLists',
    kind: 'linkedlist',
    normalize: 'none',
    starterCode: `// mergeTwoLists(list1, list2) -> head of one merged sorted list
// Both arguments arrive as list heads; nodes look like { val, next }.
function mergeTwoLists(list1, list2) {
  // TODO: repeatedly attach the smaller front node to the merged tail
}`,
    hints: [
      'A dummy head node removes the special case for the very first attachment. What do you compare at each step?',
      'Keep a tail pointer. Attach whichever front node is smaller, advance that list, and finally attach whatever remains.',
    ],
    explanation: 'We create a dummy node to act as a placeholder head so attaching the first real node needs no special case. A tail pointer marks the end of the merged list built so far. While both lists have nodes, we attach the smaller front node to the tail and advance that list. When one list runs out, the rest of the other list is attached in one step because it is already sorted. Converting the second argument from an array to nodes first keeps the merge loop uniform in this judge.',
    complexity: 'Time O(n + m) · Space O(1)',
    solutionCode: `function mergeTwoLists(list1, list2) {
  const toList = (v) => {
    if (Array.isArray(v)) {
      if (v.length === 0) return null;
      const nodes = v.map((x) => ({ val: x, next: null }));
      for (let i = 0; i < nodes.length - 1; i++) nodes[i].next = nodes[i + 1];
      return nodes[0];
    }
    return v;
  };
  let a = toList(list1);
  let b = toList(list2);
  const dummy = { val: 0, next: null };
  let tail = dummy;
  while (a && b) {
    if (a.val <= b.val) {
      tail.next = a;
      a = a.next;
    } else {
      tail.next = b;
      b = b.next;
    }
    tail = tail.next;
  }
  tail.next = a || b;
  return dummy.next;
}`,
    visibleTests: [
      { args: [[1, 2, 4], [1, 3, 4]], expected: [1, 1, 2, 3, 4, 4] },
      { args: [[], []], expected: [] },
      { args: [[], [0]], expected: [0] },
    ],
    hiddenTests: [
      { args: [[5], []], expected: [5] },
      { args: [[1, 3, 5], [2, 4, 6]], expected: [1, 2, 3, 4, 5, 6] },
      { args: [[-3, 0, 2], [-1, 1]], expected: [-3, -1, 0, 1, 2] },
      { args: [[2], [1]], expected: [1, 2] },
    ],
  },
  {
    id: 'linked-list-cycle',
    topic: 'linked-list',
    title: 'Linked List Cycle',
    difficulty: 'Easy',
    statement: 'Given the head of a linked list, decide whether following next pointers ever loops back to a node you have already visited. Return true if there is a cycle and false if the walk reaches the end. In the tests the list is described by its values plus a position: the tail links back to the node at that index, or -1 means no link back.',
    examples: [
      { input: 'head = [3,2,0,-4], pos = 1', output: 'true', explanation: 'The tail -4 points back to the node with value 2, forming a loop.' },
      { input: 'head = [1], pos = -1', output: 'false', explanation: 'The single node points to nothing, so the walk ends.' },
    ],
    constraints: '0 <= number of nodes <= 10^4 · -10^5 <= val <= 10^5 · pos is -1 or a valid index',
    fn: 'hasCycle',
    kind: 'cycle',
    normalize: 'none',
    starterCode: `// hasCycle(head) -> true if the list loops back on itself; nodes look like { val, next }
function hasCycle(head) {
  // TODO: detect a loop without extra storage if you can
}`,
    hints: [
      'If two walkers move at different speeds on a circular track, what eventually happens?',
      'Move slow one step and fast two steps at a time. They meet only when a cycle exists; fast reaching null means no cycle.',
    ],
    explanation: 'We send two pointers through the list: a slow one moving one step at a time and a fast one moving two steps. If there is no cycle, the fast pointer reaches the end and we return false. If there is a cycle, the fast pointer keeps lapping around the loop and eventually lands on the same node as the slow pointer, which can only happen inside a cycle. Meeting therefore proves a loop exists.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function hasCycle(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}`,
    visibleTests: [
      { args: [[3, 2, 0, -4], 1], expected: true },
      { args: [[1, 2], 0], expected: true },
      { args: [[1], -1], expected: false },
    ],
    hiddenTests: [
      { args: [[1, 2], -1], expected: false },
      { args: [[], -1], expected: false },
      { args: [[1, 2, 3, 4], 2], expected: true },
      { args: [[1, 1, 1], 0], expected: true },
    ],
  },
  {
    id: 'middle-linked-list',
    topic: 'linked-list',
    title: 'Middle of the Linked List',
    difficulty: 'Easy',
    statement: 'Given the head of a linked list, return the middle node. When the list has an even number of nodes there are two middles, and in that case return the second one. The judge reads your returned node onward to the end of the list, so returning the middle node is enough.',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[3, 4, 5]', explanation: 'The middle node holds 3, and reading from it gives 3, 4, 5.' },
      { input: 'head = [1,2,3,4,5,6]', output: '[4, 5, 6]', explanation: 'With six nodes the second middle holds 4.' },
    ],
    constraints: '1 <= number of nodes <= 100 · 1 <= val <= 100',
    fn: 'middleNode',
    kind: 'linkedlist',
    normalize: 'none',
    starterCode: `// middleNode(head) -> the middle node itself (second middle if even); nodes look like { val, next }
function middleNode(head) {
  // TODO: find the middle in one walk without counting first
}`,
    hints: [
      'What happens if one pointer moves twice as fast as another? Where is the slow one when the fast one finishes?',
      'Advance slow one step and fast two steps. When fast can no longer move, slow sits on the middle node.',
    ],
    explanation: 'We move a slow pointer one step and a fast pointer two steps at a time. Because fast covers twice the distance, when it reaches the end the slow pointer has covered half the list and sits exactly on the middle node. For even lengths this lands on the second of the two middles, which is what the problem asks for. One walk finds the middle without counting nodes first.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function middleNode(head) {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  return slow;
}`,
    visibleTests: [
      { args: [[1, 2, 3, 4, 5]], expected: [3, 4, 5] },
      { args: [[1, 2, 3, 4, 5, 6]], expected: [4, 5, 6] },
    ],
    hiddenTests: [
      { args: [[1]], expected: [1] },
      { args: [[1, 2]], expected: [2] },
      { args: [[1, 2, 3, 4]], expected: [3, 4] },
      { args: [[]], expected: [] },
      { args: [[1, 2, 3]], expected: [2, 3] },
    ],
  },
  // ---------------------------------------------------------------- Stack & Queue
  {
    id: 'valid-parentheses',
    topic: 'stack-queue',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    statement: 'A string made only of the bracket characters ( ) { } [ ] is valid when every opening bracket is closed by the same kind of bracket and pairs are properly nested. Return true when the string is valid and false otherwise. An empty string counts as valid.',
    examples: [
      { input: 's = "()[]{}"', output: 'true', explanation: 'Three separate pairs each open and close correctly.' },
      { input: 's = "(]"', output: 'false', explanation: 'A round opener is closed by a square bracket, which does not match.' },
    ],
    constraints: '0 <= s.length <= 10^4 · s contains only ( ) { } [ ]',
    fn: 'isValid',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// isValid(s) -> true if brackets are balanced and correctly nested
function isValid(s) {
  // TODO: remember openers and match every closer against the latest opener
}`,
    hints: [
      'The most recent opener must be the first one closed. Which structure gives you last-in-first-out behaviour?',
      'Push every opener. On a closer, pop and check it is the matching partner; success also needs an empty stack at the end.',
    ],
    explanation: 'Proper nesting means the last bracket opened is always the first one that must close, which is exactly stack behaviour. We push each opening bracket, and when we see a closing bracket we pop the top and check that it forms a matching pair; a mismatch or an empty stack means the string is invalid. If the stack is empty after the last character, every opener found its partner in the right order.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function isValid(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') {
      stack.push(ch);
    } else {
      if (stack.pop() !== pairs[ch]) return false;
    }
  }
  return stack.length === 0;
}`,
    visibleTests: [
      { args: ['()'], expected: true },
      { args: ['()[]{}'], expected: true },
      { args: ['(]'], expected: false },
    ],
    hiddenTests: [
      { args: ['([)]'], expected: false },
      { args: ['{[]}'], expected: true },
      { args: [''], expected: true },
      { args: [')('], expected: false },
      { args: ['((('], expected: false },
    ],
  },
  {
    id: 'next-greater-element',
    topic: 'stack-queue',
    title: 'Next Greater Element',
    difficulty: 'Easy',
    statement: 'You are given two arrays where the first is a subset of the second. For each value in the first array, find the first value to its right in the second array that is strictly greater than it. If no greater value follows, use -1. Return the answers in the same order as the first array.',
    examples: [
      { input: 'nums1 = [4,1,2], nums2 = [1,3,4,2]', output: '[-1, 3, -1]', explanation: 'Nothing greater follows 4 or 2, while 3 is the first greater value after 1.' },
      { input: 'nums1 = [2,4], nums2 = [1,2,3,4]', output: '[3, -1]', explanation: 'After 2 comes 3, and nothing greater follows 4.' },
    ],
    constraints: '1 <= nums1.length <= nums2.length <= 1000 · 0 <= nums[i] <= 10^4 · values in each array are unique and nums1 is a subset of nums2',
    fn: 'nextGreaterElement',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// nextGreaterElement(nums1, nums2) -> next greater value in nums2 for each nums1 entry
function nextGreaterElement(nums1, nums2) {
  // TODO: precompute the next greater value for every entry of nums2
}`,
    hints: [
      'Process nums2 from right to left. Which candidates could be the next greater value for the current number?',
      'Keep a decreasing stack. Pop smaller values, the new top is the answer for the current value, then push it.',
    ],
    explanation: 'We precompute answers for the whole second array in one right-to-left pass using a stack that stays decreasing. For the current value, every smaller value on the stack can never be the next greater element for anything further left, so we pop them; the value now on top, if any, is the first greater one to the right. We store that in a map, push the current value, and at the end we answer each query from the first array with a map lookup.',
    complexity: 'Time O(n + m) · Space O(n)',
    solutionCode: `function nextGreaterElement(nums1, nums2) {
  const answerFor = new Map();
  const stack = [];
  for (let i = nums2.length - 1; i >= 0; i--) {
    while (stack.length && stack[stack.length - 1] < nums2[i]) stack.pop();
    answerFor.set(nums2[i], stack.length ? stack[stack.length - 1] : -1);
    stack.push(nums2[i]);
  }
  return nums1.map((v) => answerFor.get(v));
}`,
    visibleTests: [
      { args: [[4, 1, 2], [1, 3, 4, 2]], expected: [-1, 3, -1] },
      { args: [[2, 4], [1, 2, 3, 4]], expected: [3, -1] },
    ],
    hiddenTests: [
      { args: [[1, 3, 5, 2, 4], [6, 5, 4, 3, 2, 1, 7]], expected: [7, 7, 7, 7, 7] },
      { args: [[3], [3, 2, 1]], expected: [-1] },
      { args: [[5, 4, 3], [5, 4, 3, 2, 1]], expected: [-1, -1, -1] },
      { args: [[1, 2], [2, 1]], expected: [-1, -1] },
    ],
  },
  {
    id: 'daily-temperatures',
    topic: 'stack-queue',
    title: 'Daily Temperatures',
    difficulty: 'Medium',
    statement: 'Each value is the temperature on that day. For every day, work out how many days you must wait until a warmer day arrives. If no warmer day comes later, the answer for that day is 0. Return the waiting times as an array.',
    examples: [
      { input: 'temperatures = [73,74,75,71,69,72,76,73]', output: '[1, 1, 4, 2, 1, 1, 0, 0]', explanation: 'Day 0 waits 1 day for 74, day 2 waits 4 days for 76, and the last two days never get warmer.' },
      { input: 'temperatures = [30,40,50,60]', output: '[1, 1, 1, 0]', explanation: 'Each day except the last is warmer the very next day.' },
    ],
    constraints: '1 <= temperatures.length <= 10^5 · 30 <= temperatures[i] <= 100',
    fn: 'dailyTemperatures',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// dailyTemperatures(temperatures) -> days to wait for a warmer day, per day
function dailyTemperatures(temperatures) {
  // TODO: resolve waiting days with a stack of still-unanswered indices
}`,
    hints: [
      'Some days are still waiting for their warmer day. When today is warmer, which waiting days does it resolve?',
      'Keep indices with decreasing temperatures on a stack. A warmer day pops and answers each colder waiting index.',
    ],
    explanation: 'We scan days left to right while keeping a stack of indices whose warmer day has not been found yet, with temperatures decreasing along the stack. When today\'s temperature beats the day on top of the stack, today is that day\'s answer, so we pop it and record the distance between indices. Today then joins the stack to wait for its own warmer day. Days left on the stack at the end keep their default answer of 0, and each index is pushed and popped at most once.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function dailyTemperatures(temperatures) {
  const res = new Array(temperatures.length).fill(0);
  const stack = [];
  for (let i = 0; i < temperatures.length; i++) {
    while (stack.length && temperatures[i] > temperatures[stack[stack.length - 1]]) {
      const prev = stack.pop();
      res[prev] = i - prev;
    }
    stack.push(i);
  }
  return res;
}`,
    visibleTests: [
      { args: [[73, 74, 75, 71, 69, 72, 76, 73]], expected: [1, 1, 4, 2, 1, 1, 0, 0] },
      { args: [[30, 40, 50, 60]], expected: [1, 1, 1, 0] },
      { args: [[30, 60, 90]], expected: [1, 1, 0] },
    ],
    hiddenTests: [
      { args: [[90, 80, 70]], expected: [0, 0, 0] },
      { args: [[31]], expected: [0] },
      { args: [[75, 71, 69, 72]], expected: [0, 2, 1, 0] },
      { args: [[34, 80, 80, 34]], expected: [1, 0, 0, 0] },
    ],
  },
  // ---------------------------------------------------------------- Trees
  {
    id: 'max-depth',
    topic: 'trees',
    title: 'Maximum Depth of Binary Tree',
    difficulty: 'Easy',
    statement: 'Given the root of a binary tree, find its maximum depth: the number of nodes on the longest path from the root down to a leaf. An empty tree has depth 0 and a tree with only the root has depth 1. The root is described as a level-order array where null marks a missing node.',
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '3', explanation: 'The longest root-to-leaf path, for example 3 to 20 to 15, has 3 nodes.' },
      { input: 'root = [1,null,2]', output: '2', explanation: 'The root has only a right child, giving a depth of 2.' },
    ],
    constraints: '0 <= number of nodes <= 10^4 · -100 <= val <= 100',
    fn: 'maxDepth',
    kind: 'tree-value',
    normalize: 'none',
    starterCode: `// maxDepth(root) -> number of nodes on longest root-to-leaf path; nodes look like { val, left, right }
function maxDepth(root) {
  // TODO: the depth of a node is 1 plus the deeper of its two children
}`,
    hints: [
      'The depth of a whole tree can be built from the depths of its two subtrees. What is the depth of an empty tree?',
      'Return 0 for null. Otherwise return 1 plus the larger depth of the left and right children.',
    ],
    explanation: 'We solve it recursively. An empty tree has depth 0, which is the base case. For any node, the longest path down through it goes into whichever subtree is deeper, so its depth is 1 for the node itself plus the larger of the two subtree depths. The recursion visits each node once and lets the answers bubble up from the leaves to the root.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function maxDepth(root) {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}`,
    visibleTests: [
      { args: [[3, 9, 20, null, null, 15, 7]], expected: 3 },
      { args: [[1, null, 2]], expected: 2 },
    ],
    hiddenTests: [
      { args: [[]], expected: 0 },
      { args: [[1]], expected: 1 },
      { args: [[1, 2, 3, 4, 5]], expected: 3 },
      { args: [[1, 2, null, 3, null, 4]], expected: 4 },
    ],
  },
  {
    id: 'invert-binary-tree',
    topic: 'trees',
    title: 'Invert Binary Tree',
    difficulty: 'Easy',
    statement: 'Given the root of a binary tree, flip the tree into its mirror image by swapping the left and right child of every node, and return the root. The judge reads your returned tree back as a level-order array. The root is described as a level-order array where null marks a missing node.',
    examples: [
      { input: 'root = [4,2,7,1,3,6,9]', output: '[4, 7, 2, 9, 6, 3, 1]', explanation: 'Every left and right child swaps, producing the mirrored tree.' },
      { input: 'root = [2,1,3]', output: '[2, 3, 1]', explanation: 'The root keeps its value while its two children trade places.' },
    ],
    constraints: '0 <= number of nodes <= 100 · -100 <= val <= 100',
    fn: 'invertTree',
    kind: 'tree-return',
    normalize: 'none',
    starterCode: `// invertTree(root) -> root of the mirrored tree; nodes look like { val, left, right }
function invertTree(root) {
  // TODO: swap children at every node, recursively, and return the root
}`,
    hints: [
      'If both subtrees were already mirrored for you, what is left to do at the current node?',
      'Recursively invert the left and right children, swap them, and return the current node.',
    ],
    explanation: 'Mirroring a tree means mirroring both of its subtrees and then swapping them at the current node. The recursion handles the subtrees first and the swap puts the mirrored left subtree on the right and vice versa. An empty tree mirrors to itself, which gives us the base case. Each node is visited once and swapped once, so the whole tree is flipped in a single traversal.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function invertTree(root) {
  if (!root) return null;
  const left = invertTree(root.left);
  const right = invertTree(root.right);
  root.left = right;
  root.right = left;
  return root;
}`,
    visibleTests: [
      { args: [[4, 2, 7, 1, 3, 6, 9]], expected: [4, 7, 2, 9, 6, 3, 1] },
      { args: [[2, 1, 3]], expected: [2, 3, 1] },
      { args: [[]], expected: [] },
    ],
    hiddenTests: [
      { args: [[1, 2]], expected: [1, null, 2] },
      { args: [[1, 2, 3, 4]], expected: [1, 3, 2, null, null, null, 4] },
      { args: [[1]], expected: [1] },
      { args: [[5, 3, 8, 1, 4]], expected: [5, 8, 3, null, null, 4, 1] },
    ],
  },
  {
    id: 'level-order-traversal',
    topic: 'trees',
    title: 'Binary Tree Level Order Traversal',
    difficulty: 'Medium',
    statement: 'Given the root of a binary tree, return its node values grouped level by level from top to bottom, with values ordered left to right inside each level. An empty tree returns an empty list. The root is described as a level-order array where null marks a missing node.',
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '[[3],[9,20],[15,7]]', explanation: 'Level one holds 3, level two holds 9 and 20, and level three holds 15 and 7.' },
      { input: 'root = [1]', output: '[[1]]', explanation: 'A single node forms a single level.' },
    ],
    constraints: '0 <= number of nodes <= 2000 · -1000 <= val <= 1000',
    fn: 'levelOrder',
    kind: 'tree-value',
    normalize: 'none',
    starterCode: `// levelOrder(root) -> array of levels, each level an array of values; nodes look like { val, left, right }
function levelOrder(root) {
  // TODO: visit the tree level by level using a queue
}`,
    hints: [
      'Breadth-first visiting needs a first-in-first-out structure. How do you know where one level ends and the next begins?',
      'Put the root in a queue. Repeatedly process exactly the nodes currently queued as one level, enqueuing their children for the next.',
    ],
    explanation: 'Level order is breadth-first search. We keep a queue of nodes waiting to be visited, starting with the root. At each round, the number of nodes currently in the queue is exactly the size of one level, so we dequeue that many nodes, collect their values as one group, and enqueue their children for the next round. Recording the queue size before each round is what separates the levels cleanly.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function levelOrder(root) {
  if (!root) return [];
  const res = [];
  const queue = [root];
  while (queue.length > 0) {
    const size = queue.length;
    const level = [];
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    res.push(level);
  }
  return res;
}`,
    visibleTests: [
      { args: [[3, 9, 20, null, null, 15, 7]], expected: [[3], [9, 20], [15, 7]] },
      { args: [[1]], expected: [[1]] },
      { args: [[]], expected: [] },
    ],
    hiddenTests: [
      { args: [[1, 2, 3, 4, 5, 6, 7]], expected: [[1], [2, 3], [4, 5, 6, 7]] },
      { args: [[1, null, 2, 3]], expected: [[1], [2], [3]] },
      { args: [[2, 1, 3]], expected: [[2], [1, 3]] },
    ],
  },
  {
    id: 'diameter-binary-tree',
    topic: 'trees',
    title: 'Diameter of Binary Tree',
    difficulty: 'Easy',
    statement: 'The diameter of a binary tree is the number of edges on the longest path between any two nodes, and that path does not need to pass through the root. Given the root, return the diameter. An empty tree and a single-node tree both have diameter 0. The root is described as a level-order array where null marks a missing node.',
    examples: [
      { input: 'root = [1,2,3,4,5]', output: '3', explanation: 'The path from 4 up through 2 and 1 down to 3 uses 3 edges.' },
      { input: 'root = [1,2]', output: '1', explanation: 'The only path has a single edge.' },
    ],
    constraints: '0 <= number of nodes <= 10^4 · -100 <= val <= 100',
    fn: 'diameterOfBinaryTree',
    kind: 'tree-value',
    normalize: 'none',
    starterCode: `// diameterOfBinaryTree(root) -> edges on the longest path between any two nodes
function diameterOfBinaryTree(root) {
  // TODO: while computing heights, watch for the best left-plus-right path
}`,
    hints: [
      'Any longest path bends at some node. What two numbers at that bend node decide its length?',
      'Compute subtree heights bottom-up. At each node, left height plus right height is a candidate diameter; keep the maximum.',
    ],
    explanation: 'Every path bends at its highest node, and its length there equals the height of the left subtree plus the height of the right subtree. So while a recursive helper computes each node\'s height, we also check that sum as a candidate answer and keep the largest one seen anywhere. The helper returns heights upward while a shared variable tracks the best diameter, giving us both values from one traversal.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function diameterOfBinaryTree(root) {
  let best = 0;
  const height = (node) => {
    if (!node) return 0;
    const left = height(node.left);
    const right = height(node.right);
    best = Math.max(best, left + right);
    return 1 + Math.max(left, right);
  };
  height(root);
  return best;
}`,
    visibleTests: [
      { args: [[1, 2, 3, 4, 5]], expected: 3 },
      { args: [[1, 2]], expected: 1 },
    ],
    hiddenTests: [
      { args: [[]], expected: 0 },
      { args: [[1]], expected: 0 },
      { args: [[1, 2, 3, 4, 5, 6, 7]], expected: 4 },
      { args: [[1, 2, null, 3, null, 4]], expected: 3 },
    ],
  },
  // ---------------------------------------------------------------- Graphs
  {
    id: 'number-of-islands',
    topic: 'graphs',
    title: 'Number of Islands',
    difficulty: 'Medium',
    statement: 'A grid of numbers uses 1 for land and 0 for water. An island is a group of land cells connected up, down, left or right; diagonal contact does not connect them. Count how many separate islands the grid contains and return the count.',
    examples: [
      { input: 'grid = [[1,1,1,1,0],[1,1,0,1,0],[1,1,0,0,0],[0,0,0,0,0]]', output: '1', explanation: 'All the land cells connect into one single island.' },
      { input: 'grid = [[1,1,0,0,0],[1,1,0,0,0],[0,0,1,0,0],[0,0,0,1,1]]', output: '3', explanation: 'There are three separate land groups.' },
    ],
    constraints: '1 <= grid.length, grid[i].length <= 300 · grid[i][j] is 0 or 1',
    fn: 'numIslands',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// numIslands(grid) -> count of 4-directionally connected groups of 1s
function numIslands(grid) {
  // TODO: when you find fresh land, count one island and flood it away
}`,
    hints: [
      'Once you step on an island, how do you make sure you never count the same island twice?',
      'Scan every cell. On finding a 1, add one to the count and flood-fill its whole island to 0 so it cannot be recounted.',
    ],
    explanation: 'We scan the grid cell by cell. Whenever we meet a land cell that has not been visited, it must belong to a new island, so we increase the count and then flood-fill from it: a depth-first walk that marks the entire connected land mass as water. Flooding guarantees each island is counted exactly once, because its cells can never trigger another count. Diagonal neighbours are ignored since only the four straight directions connect land.',
    complexity: 'Time O(m * n) · Space O(m * n)',
    solutionCode: `function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;
  const rows = grid.length;
  const cols = grid[0].length;
  const g = grid.map((row) => [...row]);
  let count = 0;
  const dfs = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols || g[r][c] !== 1) return;
    g[r][c] = 0;
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (g[r][c] === 1) {
        count++;
        dfs(r, c);
      }
    }
  }
  return count;
}`,
    visibleTests: [
      { args: [[[1, 1, 1, 1, 0], [1, 1, 0, 1, 0], [1, 1, 0, 0, 0], [0, 0, 0, 0, 0]]], expected: 1 },
      { args: [[[1, 1, 0, 0, 0], [1, 1, 0, 0, 0], [0, 0, 1, 0, 0], [0, 0, 0, 1, 1]]], expected: 3 },
    ],
    hiddenTests: [
      { args: [[[0, 0], [0, 0]]], expected: 0 },
      { args: [[[1]]], expected: 1 },
      { args: [[[1, 0, 1], [0, 0, 0], [1, 0, 1]]], expected: 4 },
      { args: [[[1, 1, 0], [0, 1, 0], [0, 0, 1]]], expected: 2 },
    ],
  },
  {
    id: 'flood-fill',
    topic: 'graphs',
    title: 'Flood Fill',
    difficulty: 'Easy',
    statement: 'An image is a grid of numbers where equal neighbouring numbers form a connected region. Starting from the cell at row sr and column sc, recolor its entire 4-directionally connected region to newColor and return the updated grid. If the region already has the target color, the grid stays unchanged.',
    examples: [
      { input: 'image = [[1,1,1],[1,1,0],[1,0,1]], sr = 1, sc = 1, newColor = 2', output: '[[2,2,2],[2,2,0],[2,0,1]]', explanation: 'The connected region of 1s around the center becomes 2, while the corner 1 at the bottom right is cut off by zeroes.' },
      { input: 'image = [[0,0,0],[0,0,0]], sr = 0, sc = 0, newColor = 0', output: '[[0,0,0],[0,0,0]]', explanation: 'The starting color already equals the new color, so nothing changes.' },
    ],
    constraints: '1 <= image.length, image[i].length <= 50 · 0 <= image[i][j], newColor <= 2^16 · 0 <= sr < image.length · 0 <= sc < image[0].length',
    fn: 'floodFill',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// floodFill(image, sr, sc, newColor) -> grid with the connected region recolored
function floodFill(image, sr, sc, newColor) {
  // TODO: spread from the start cell to same-colored neighbours
}`,
    hints: [
      'Which cells belong to the region? Only neighbours sharing the starting cell\'s original color. What stops endless revisiting?',
      'Remember the starting color. Recolor as you visit and spread to the four neighbours that still hold the starting color.',
    ],
    explanation: 'The region consists of the start cell plus everything reachable through neighbours that share the start cell\'s original color. We spread out with a depth-first walk: at each cell we paint it with the new color and recurse into the four neighbours that still carry the original color. Painting on visit doubles as our visited marker, and if the original color already equals the new color we return immediately to avoid infinite looping.',
    complexity: 'Time O(m * n) · Space O(m * n)',
    solutionCode: `function floodFill(image, sr, sc, newColor) {
  const rows = image.length;
  const cols = image[0].length;
  const startColor = image[sr][sc];
  if (startColor === newColor) return image;
  const dfs = (r, c) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols || image[r][c] !== startColor) return;
    image[r][c] = newColor;
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  };
  dfs(sr, sc);
  return image;
}`,
    visibleTests: [
      { args: [[[1, 1, 1], [1, 1, 0], [1, 0, 1]], 1, 1, 2], expected: [[2, 2, 2], [2, 2, 0], [2, 0, 1]] },
      { args: [[[0, 0, 0], [0, 0, 0]], 0, 0, 0], expected: [[0, 0, 0], [0, 0, 0]] },
    ],
    hiddenTests: [
      { args: [[[1, 2], [3, 4]], 0, 0, 9], expected: [[9, 2], [3, 4]] },
      { args: [[[1, 1], [1, 0]], 0, 1, 3], expected: [[3, 3], [3, 0]] },
      { args: [[[2, 2, 2], [2, 0, 2], [2, 2, 2]], 1, 1, 5], expected: [[2, 2, 2], [2, 5, 2], [2, 2, 2]] },
      { args: [[[1]], 0, 0, 2], expected: [[2]] },
    ],
  },
  {
    id: 'rotting-oranges',
    topic: 'graphs',
    title: 'Rotting Oranges',
    difficulty: 'Medium',
    statement: 'A grid shows 0 for an empty cell, 1 for a fresh orange and 2 for a rotten orange. Every minute, each fresh orange that touches a rotten one up, down, left or right also becomes rotten. Return the minutes needed until no fresh orange remains, or -1 if some fresh orange can never be reached. The grid uses numbers, not characters.',
    examples: [
      { input: 'grid = [[2,1,1],[1,1,0],[0,1,1]]', output: '4', explanation: 'The rot spreads one ring per minute and reaches the far corner after 4 minutes.' },
      { input: 'grid = [[0,2]]', output: '0', explanation: 'There is no fresh orange at all, so zero minutes are needed.' },
    ],
    constraints: '1 <= grid.length, grid[i].length <= 10 · grid[i][j] is 0, 1 or 2',
    fn: 'orangesRotting',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// orangesRotting(grid) -> minutes until all oranges rot, or -1 if impossible
function orangesRotting(grid) {
  // TODO: let the rot spread level by level from every rotten orange
}`,
    hints: [
      'All rotten oranges start spreading at the same time. How do you process the grid minute by minute?',
      'Load every starting rotten cell into a queue and count fresh cells. Each BFS level is one minute; leftover fresh cells mean -1.',
    ],
    explanation: 'Because rot spreads in all directions simultaneously, we model it with breadth-first search starting from every initially rotten orange at once. Each layer of the search corresponds to one minute: oranges rotted in that layer spread to their fresh neighbours in the next. We count fresh oranges at the start and decrease the count as they rot; if any fresh orange remains after the spread ends, it was unreachable and the answer is -1. BFS guarantees the first time we reach an orange is its earliest rotting minute.',
    complexity: 'Time O(m * n) · Space O(m * n)',
    solutionCode: `function orangesRotting(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const g = grid.map((row) => [...row]);
  const queue = [];
  let fresh = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (g[r][c] === 2) queue.push([r, c]);
      else if (g[r][c] === 1) fresh++;
    }
  }
  if (fresh === 0) return 0;
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  let minutes = 0;
  while (queue.length > 0) {
    const size = queue.length;
    let rottedThisMinute = false;
    for (let i = 0; i < size; i++) {
      const [r, c] = queue.shift();
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && g[nr][nc] === 1) {
          g[nr][nc] = 2;
          fresh--;
          queue.push([nr, nc]);
          rottedThisMinute = true;
        }
      }
    }
    if (rottedThisMinute) minutes++;
  }
  return fresh === 0 ? minutes : -1;
}`,
    visibleTests: [
      { args: [[[2, 1, 1], [1, 1, 0], [0, 1, 1]]], expected: 4 },
      { args: [[[2, 1, 1], [0, 1, 1], [1, 0, 1]]], expected: -1 },
      { args: [[[0, 2]]], expected: 0 },
    ],
    hiddenTests: [
      { args: [[[2, 1]]], expected: 1 },
      { args: [[[1]]], expected: -1 },
      { args: [[[2, 2], [2, 2]]], expected: 0 },
      { args: [[[2, 1, 0], [1, 1, 1], [0, 1, 2]]], expected: 2 },
      { args: [[[0, 1]]], expected: -1 },
    ],
  },
  // ---------------------------------------------------------------- Dynamic Programming
  {
    id: 'climbing-stairs',
    topic: 'dp',
    title: 'Climbing Stairs',
    difficulty: 'Easy',
    statement: 'You climb a staircase with n steps. Each move you take either 1 step or 2 steps. Count how many distinct sequences of moves bring you exactly to the top and return that count.',
    examples: [
      { input: 'n = 2', output: '2', explanation: 'Either climb 1 then 1, or jump 2 in one move.' },
      { input: 'n = 3', output: '3', explanation: 'The sequences are 1+1+1, 1+2 and 2+1.' },
    ],
    constraints: '1 <= n <= 45',
    fn: 'climbStairs',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// climbStairs(n) -> number of distinct 1-or-2-step ways to reach step n
function climbStairs(n) {
  // TODO: build the count for step n from the counts of earlier steps
}`,
    hints: [
      'Your last move came from exactly one of two places. Which two, and what do their counts give you?',
      'Ways to reach step i equal ways to reach i - 1 plus ways to reach i - 2. Start from 1 way for step 1 and 2 ways for step 2.',
    ],
    explanation: 'Consider the final move: it is either a single step from n - 1 or a double step from n - 2, and every valid sequence ends in exactly one of those ways. So the count for n is the count for n - 1 plus the count for n - 2. We build upward from the base cases of 1 way for one step and 2 ways for two steps, keeping only the last two counts, which produces the Fibonacci-like sequence.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function climbStairs(n) {
  if (n <= 2) return n;
  let prev2 = 1;
  let prev1 = 2;
  for (let i = 3; i <= n; i++) {
    const cur = prev1 + prev2;
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}`,
    visibleTests: [
      { args: [2], expected: 2 },
      { args: [3], expected: 3 },
    ],
    hiddenTests: [
      { args: [1], expected: 1 },
      { args: [4], expected: 5 },
      { args: [5], expected: 8 },
      { args: [10], expected: 89 },
    ],
  },
  {
    id: 'house-robber',
    topic: 'dp',
    title: 'House Robber',
    difficulty: 'Medium',
    statement: 'Each value is the money inside a house along a street. You want the most money possible but you cannot rob two neighbouring houses because that would trigger an alarm. Return the largest total you can take.',
    examples: [
      { input: 'nums = [1,2,3,1]', output: '4', explanation: 'Rob the houses with 1 and 3 for a total of 4.' },
      { input: 'nums = [2,7,9,3,1]', output: '12', explanation: 'Robbing 2, 9 and 1 gives 12, skipping their neighbours.' },
    ],
    constraints: '0 <= nums.length <= 100 · 0 <= nums[i] <= 400',
    fn: 'rob',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// rob(nums) -> max money without robbing two adjacent houses
function rob(nums) {
  // TODO: at each house decide to take it or skip it
}`,
    hints: [
      'At each house you have two choices. What is the best total if you take it, and if you skip it?',
      'Track the best total up to the previous house and the one before it. The answer either skips the current house or takes it plus the best from two back.',
    ],
    explanation: 'For each house we decide between skipping it, which keeps the best total up to the previous house, or robbing it, which adds its money to the best total up to two houses back since its neighbour must be skipped. Taking the larger of those two options gives the best total up to the current house. We roll these two values forward house by house, so only constant extra memory is needed.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function rob(nums) {
  let prev2 = 0;
  let prev1 = 0;
  for (const money of nums) {
    const cur = Math.max(prev1, prev2 + money);
    prev2 = prev1;
    prev1 = cur;
  }
  return prev1;
}`,
    visibleTests: [
      { args: [[1, 2, 3, 1]], expected: 4 },
      { args: [[2, 7, 9, 3, 1]], expected: 12 },
    ],
    hiddenTests: [
      { args: [[]], expected: 0 },
      { args: [[5]], expected: 5 },
      { args: [[2, 1, 1, 2]], expected: 4 },
      { args: [[1, 2]], expected: 2 },
      { args: [[10, 1, 1, 10]], expected: 20 },
    ],
  },
  {
    id: 'coin-change',
    topic: 'dp',
    title: 'Coin Change',
    difficulty: 'Medium',
    statement: 'You are given coin denominations and a target amount. Using any number of coins of each denomination, find the smallest number of coins that adds up exactly to the amount. If the amount cannot be formed, return -1. An amount of zero needs zero coins.',
    examples: [
      { input: 'coins = [1,2,5], amount = 11', output: '3', explanation: 'Two 5s and one 1 make 11 with just 3 coins.' },
      { input: 'coins = [2], amount = 3', output: '-1', explanation: 'No combination of 2s can make 3.' },
    ],
    constraints: '1 <= coins.length <= 12 · 1 <= coins[i] <= 2^31 - 1 · 0 <= amount <= 10^4',
    fn: 'coinChange',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// coinChange(coins, amount) -> fewest coins making amount, or -1
function coinChange(coins, amount) {
  // TODO: compute the fewest coins for every smaller amount first
}`,
    hints: [
      'If you knew the answer for every amount below the target, how would you extend it by one coin?',
      'Let best[x] be the fewest coins for amount x. Try each coin c: best[x] is 1 plus the best of x - c.',
    ],
    explanation: 'We compute the fewest coins for every amount from 0 up to the target. Zero needs zero coins, and every other amount starts as impossible. For an amount x and each coin c not larger than x, one candidate is a single c coin plus the best solution for the remainder x - c; we keep the smallest candidate across all coins. Amounts that stay impossible are marked clearly, and the value built for the target is the final answer, or -1 when it stayed impossible.',
    complexity: 'Time O(amount * coins) · Space O(amount)',
    solutionCode: `function coinChange(coins, amount) {
  const dp = new Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let x = 1; x <= amount; x++) {
    for (const coin of coins) {
      if (coin <= x && dp[x - coin] !== Infinity) {
        dp[x] = Math.min(dp[x], dp[x - coin] + 1);
      }
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}`,
    visibleTests: [
      { args: [[1, 2, 5], 11], expected: 3 },
      { args: [[2], 3], expected: -1 },
      { args: [[1], 0], expected: 0 },
    ],
    hiddenTests: [
      { args: [[2, 5, 10, 1], 27], expected: 4 },
      { args: [[3], 2], expected: -1 },
      { args: [[1, 3, 4], 6], expected: 2 },
      { args: [[5], 3], expected: -1 },
      { args: [[1, 2, 5], 0], expected: 0 },
    ],
  },
  {
    id: 'longest-increasing-subsequence',
    topic: 'dp',
    title: 'Longest Increasing Subsequence',
    difficulty: 'Medium',
    statement: 'Given an array of numbers, find the length of the longest subsequence that is strictly increasing. A subsequence keeps the original order but may skip elements; it does not need to be contiguous. Return just the length.',
    examples: [
      { input: 'nums = [10,9,2,5,3,7,101,18]', output: '4', explanation: 'One longest rising subsequence is 2, 3, 7, 101 with length 4.' },
      { input: 'nums = [7,7,7,7,7,7,7]', output: '1', explanation: 'Equal values cannot extend a strictly increasing subsequence, so the best length is 1.' },
    ],
    constraints: '1 <= nums.length <= 2500 · -10^4 <= nums[i] <= 10^4',
    fn: 'lengthOfLIS',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// lengthOfLIS(nums) -> length of longest strictly increasing subsequence
function lengthOfLIS(nums) {
  // TODO: for each position, find the best chain that ends there
}`,
    hints: [
      'Consider the best increasing subsequence that ends exactly at the current element. Which earlier elements can it extend?',
      'Keep tails where tails[x] is the smallest tail of any increasing subsequence of length x + 1, and place each value with binary search.',
    ],
    explanation: 'We maintain a tails array where tails[x] holds the smallest possible last value of an increasing subsequence of length x + 1. For each new number we find, with binary search, the first tail that is not smaller than it and replace that tail with the number, keeping tails minimal; if the number beats every tail it extends the longest chain by one. Smaller tails never hurt future extensions, so the length of tails at the end equals the length of the longest increasing subsequence.',
    complexity: 'Time O(n log n) · Space O(n)',
    solutionCode: `function lengthOfLIS(nums) {
  const tails = [];
  for (const x of nums) {
    let left = 0;
    let right = tails.length;
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (tails[mid] < x) left = mid + 1;
      else right = mid;
    }
    tails[left] = x;
  }
  return tails.length;
}`,
    visibleTests: [
      { args: [[10, 9, 2, 5, 3, 7, 101, 18]], expected: 4 },
      { args: [[0, 1, 0, 3, 2, 3]], expected: 4 },
      { args: [[7, 7, 7, 7, 7, 7, 7]], expected: 1 },
    ],
    hiddenTests: [
      { args: [[1, 3, 6, 7, 9, 4, 10, 5, 6]], expected: 6 },
      { args: [[5, 4, 3, 2, 1]], expected: 1 },
      { args: [[1, 2, 3, 4, 5]], expected: 5 },
      { args: [[]], expected: 0 },
      { args: [[2, 2, 2]], expected: 1 },
    ],
  },
  // ------------------------------------------------ Sheet growth (appended at the end so existing plan keys stay stable)
  {
    id: 'product-except-self',
    topic: 'arrays',
    title: 'Product of Array Except Self',
    difficulty: 'Medium',
    statement: 'You are given an array of numbers. Build a new array where the value at each position is the product of every number in the input except the number at that same position. Solve it without using division, so zeroes in the input are handled naturally.',
    examples: [
      { input: 'nums = [1,2,3,4]', output: '[24, 12, 8, 6]', explanation: 'For the first position, 2 * 3 * 4 = 24. For the second, 1 * 3 * 4 = 12, and so on for the rest.' },
      { input: 'nums = [-1,1,0,-3,3]', output: '[0, 0, 9, 0, 0]', explanation: 'Only the position holding 0 keeps a non-zero product, because every other position still multiplies by that 0. The surviving product is -1 * 1 * -3 * 3 = 9.' },
    ],
    constraints: '1 <= nums.length <= 10^5 · -30 <= nums[i] <= 30 · every answer value fits in a 32-bit signed integer',
    fn: 'productExceptSelf',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// productExceptSelf(nums) -> new array, each slot the product of all other values
function productExceptSelf(nums) {
  // TODO: combine the product from the left with the product from the right
}`,
    hints: [
      'The answer for a position splits into two parts: everything before it and everything after it. How can you know both products in two passes?',
      'First pass left to right stores the running product of all values before each index. Second pass right to left multiplies in the running product of all values after each index.',
    ],
    explanation: 'For each position, the values that count are exactly the ones on its left multiplied by the ones on its right. A left-to-right pass writes into the answer the product of everything before each index, starting from 1 at the first position. A right-to-left pass then carries the product of everything after each index and multiplies it in. Because no division is ever used, zeroes need no special case: any position that still includes a zero in its range naturally ends up as zero.',
    complexity: 'Time O(n) · Space O(1) extra',
    solutionCode: `function productExceptSelf(nums) {
  const n = nums.length;
  const answer = new Array(n);
  let prefix = 1;
  for (let i = 0; i < n; i++) {
    answer[i] = prefix;
    prefix *= nums[i];
  }
  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    answer[i] *= suffix;
    suffix *= nums[i];
  }
  return answer;
}`,
    visibleTests: [
      { args: [[1, 2, 3, 4]], expected: [24, 12, 8, 6] },
      { args: [[-1, 1, 0, -3, 3]], expected: [0, 0, 9, 0, 0] },
    ],
    hiddenTests: [
      { args: [[2, 2, 3]], expected: [6, 6, 4] },
      { args: [[5]], expected: [1] },
      { args: [[0, 0]], expected: [0, 0] },
      { args: [[3, -2, 4]], expected: [-8, 12, -6] },
      { args: [[1, 0, 2]], expected: [0, 2, 0] },
    ],
  },
  {
    id: 'search-rotated-array',
    topic: 'binary-search',
    title: 'Search in Rotated Sorted Array',
    difficulty: 'Medium',
    statement: 'An array of distinct numbers was sorted in ascending order and then rotated at an unknown pivot, so a suffix of the sorted order now sits at the front. Given that rotated array and a target value, return the index of the target, or -1 when the target is absent. Aim for a logarithmic search rather than a full scan.',
    examples: [
      { input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4', explanation: 'The value 0 sits at index 4, just after the rotation point.' },
      { input: 'nums = [4,5,6,7,0,1,2], target = 3', output: '-1', explanation: 'The value 3 appears nowhere in the array, so the answer is -1.' },
    ],
    constraints: '1 <= nums.length <= 5000 · all values in nums are distinct · -10^4 <= nums[i], target <= 10^4',
    fn: 'searchRotated',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// searchRotated(nums, target) -> index of target in the rotated array, or -1
function searchRotated(nums, target) {
  // TODO: work out which half is sorted, then decide where the target can live
}`,
    hints: [
      'In any middle split, at least one of the two halves is still in sorted order. How does that tell you whether the target can be inside that half?',
      'Compare the middle value with the left end to find the sorted half. If the target lies inside the sorted half range, search there; otherwise search the other half.',
    ],
    explanation: 'Even after rotation, cutting the array at a middle index always leaves at least one side fully sorted. We compare the middle value with the value at the left edge to learn which side is sorted. If the target falls inside the sorted side value range, the target can only live on that side, so we keep that half; otherwise we keep the other half. Each step discards half of the remaining range, which gives the logarithmic running time.',
    complexity: 'Time O(log n) · Space O(1)',
    solutionCode: `function searchRotated(nums, target) {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;
    if (nums[left] <= nums[mid]) {
      if (target >= nums[left] && target < nums[mid]) right = mid - 1;
      else left = mid + 1;
    } else {
      if (target > nums[mid] && target <= nums[right]) left = mid + 1;
      else right = mid - 1;
    }
  }
  return -1;
}`,
    visibleTests: [
      { args: [[4, 5, 6, 7, 0, 1, 2], 0], expected: 4 },
      { args: [[4, 5, 6, 7, 0, 1, 2], 3], expected: -1 },
    ],
    hiddenTests: [
      { args: [[1], 0], expected: -1 },
      { args: [[1], 1], expected: 0 },
      { args: [[5, 1, 3], 3], expected: 2 },
      { args: [[6, 7, 1, 2, 3, 4, 5], 6], expected: 0 },
      { args: [[3, 4, 5, 1, 2], 2], expected: 4 },
    ],
  },
  {
    id: 'top-k-frequent',
    topic: 'hashing',
    title: 'Top K Frequent Elements',
    difficulty: 'Medium',
    statement: 'Given an array of numbers and a count k, return the k distinct values that appear most often in the array. The order of the returned values does not matter, and the tests compare answers as unordered groups. You may assume the top k set is unambiguous, meaning no tie sits exactly on the cutoff.',
    examples: [
      { input: 'nums = [1,1,1,2,2,3], k = 2', output: '[1, 2]', explanation: 'The value 1 appears three times and 2 appears twice, so they are the two most frequent values.' },
      { input: 'nums = [1], k = 1', output: '[1]', explanation: 'There is only one distinct value, and it is trivially the most frequent one.' },
    ],
    constraints: '1 <= nums.length <= 10^5 · 1 <= k <= number of distinct values · -10^4 <= nums[i] <= 10^4',
    fn: 'topKFrequent',
    kind: 'plain',
    normalize: 'sortArray',
    starterCode: `// topKFrequent(nums, k) -> the k most frequent values, in any order
function topKFrequent(nums, k) {
  // TODO: count how often each value appears, then keep the k highest counts
}`,
    hints: [
      'First you need a frequency for every distinct value. What structure gives you that in one pass?',
      'Count with a map, turn the entries into a list, order that list by count from high to low, and take the values from the first k entries.',
    ],
    explanation: 'We first count occurrences, storing each distinct value once together with how many times it appeared. Sorting those distinct entries by their counts from largest to smallest puts the most frequent values at the front, so the answer is the values of the first k entries. Counting costs linear time, and the sort only touches distinct values, which keeps the method simple and fast enough for interview size inputs.',
    complexity: 'Time O(n log n) · Space O(n)',
    solutionCode: `function topKFrequent(nums, k) {
  const counts = new Map();
  for (const x of nums) counts.set(x, (counts.get(x) || 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, k)
    .map((entry) => entry[0]);
}`,
    visibleTests: [
      { args: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2] },
      { args: [[1], 1], expected: [1] },
    ],
    hiddenTests: [
      { args: [[1, 1, 2, 2, 2, 3], 2], expected: [1, 2] },
      { args: [[4, 4, 4, 2, 2, 1], 2], expected: [4, 2] },
      { args: [[7, 7, 7, 7, 8, 8, 9], 2], expected: [7, 8] },
      { args: [[10, 20, 10, 30, 20, 10], 3], expected: [10, 20, 30] },
      { args: [[9, 9, 8], 1], expected: [9] },
    ],
  },
  {
    id: 'evaluate-rpn',
    topic: 'stack-queue',
    title: 'Evaluate Reverse Polish Notation',
    difficulty: 'Medium',
    statement: 'You are given a list of string tokens that forms a valid arithmetic expression written in Reverse Polish Notation, where each operator follows the values it acts on. Each token is either an integer written as text, possibly negative or with several digits, or one of the operators +, -, * and /. Evaluate the expression and return the final integer. Division must truncate toward zero, so 7 divided by 2 gives 3 and -7 divided by 2 gives -3.',
    examples: [
      { input: 'tokens = ["2","1","+","3","*"]', output: '9', explanation: 'The plus first combines 2 and 1 into 3, and multiplying that 3 by the final 3 gives 9.' },
      { input: 'tokens = ["4","13","5","/","+"]', output: '6', explanation: 'Dividing 13 by 5 truncates to 2, and 4 plus 2 gives 6.' },
    ],
    constraints: '1 <= tokens.length <= 10^4 · each token is an operator or an integer in [-200, 200] written as text · the expression is always valid and every division has a non-zero divisor',
    fn: 'evalRPN',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// evalRPN(tokens) -> integer value of the Reverse Polish expression
function evalRPN(tokens) {
  // TODO: push numbers onto a stack; on an operator, pop two values and push the result
}`,
    hints: [
      'Numbers simply wait until an operator needs them. Which end of a stack gives you the most recent waiting numbers first?',
      'Push every number. On an operator, pop the right-hand value first and the left-hand value second, compute left operator right, and push the result back.',
    ],
    explanation: 'A stack matches the structure of this notation, because an operator always applies to the two most recently seen values. We push numbers as we meet them. When an operator appears, we pop the top value as the right-hand side and the next value as the left-hand side, compute the result, and push it back for later operators to use. Division uses truncation toward zero rather than rounding down, which matters for negative results. At the end, the single remaining value is the value of the whole expression.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function evalRPN(tokens) {
  const stack = [];
  for (const token of tokens) {
    if (token === '+' || token === '-' || token === '*' || token === '/') {
      const right = stack.pop();
      const left = stack.pop();
      if (token === '+') stack.push(left + right);
      else if (token === '-') stack.push(left - right);
      else if (token === '*') stack.push(left * right);
      else stack.push(Math.trunc(left / right));
    } else {
      stack.push(Number(token));
    }
  }
  return stack[0];
}`,
    visibleTests: [
      { args: [["2", "1", "+", "3", "*"]], expected: 9 },
      { args: [["4", "13", "5", "/", "+"]], expected: 6 },
    ],
    hiddenTests: [
      { args: [["3", "4", "+"]], expected: 7 },
      { args: [["5", "3", "-"]], expected: 2 },
      { args: [["7", "2", "/"]], expected: 3 },
      { args: [["-7", "2", "/"]], expected: -3 },
      { args: [["3", "-4", "*"]], expected: -12 },
      { args: [["18"]], expected: 18 },
    ],
  },
  {
    id: 'validate-bst',
    topic: 'trees',
    title: 'Validate Binary Search Tree',
    difficulty: 'Medium',
    statement: 'Given the root of a binary tree, decide whether it is a valid binary search tree and return true or false. In a valid tree, every value in the left subtree of a node is strictly smaller than the value of that node, and every value in the right subtree is strictly larger. An empty tree counts as valid. The root is described as a level-order array where null marks a missing node.',
    examples: [
      { input: 'root = [2,1,3]', output: 'true', explanation: 'The value 1 is smaller than 2 on the left and 3 is larger than 2 on the right, so the ordering holds.' },
      { input: 'root = [5,1,4,null,null,3,6]', output: 'false', explanation: 'The value 3 sits in the right subtree of 5 but is smaller than 5, so the tree breaks the search ordering.' },
    ],
    constraints: '0 <= number of nodes <= 10^4 · node values fit in a signed 32-bit integer',
    fn: 'isValidBST',
    kind: 'tree-value',
    normalize: 'none',
    starterCode: `// isValidBST(root) -> true when the tree obeys strict search ordering; nodes look like { val, left, right }
function isValidBST(root) {
  // TODO: carry an allowed range down the tree and check every node against it
}`,
    hints: [
      'Checking a node only against its direct children misses violations deeper in the subtree. What extra information should travel down with the recursion?',
      'Pass down a low bound and a high bound. Every node must sit strictly between them, and each child tightens one side of the range.',
    ],
    explanation: 'A node must respect not only its parent but every ancestor, so a parent-only check can miss a value that is locally fine yet globally wrong. We carry an allowed interval down the tree: the root may hold anything, the left child must stay below the current value, and the right child must stay above it, with the far bound inherited unchanged. If any node falls outside its interval, the tree is invalid; reaching every node without a violation proves the strict ordering holds everywhere.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function isValidBST(root) {
  const check = (node, low, high) => {
    if (!node) return true;
    if (node.val <= low || node.val >= high) return false;
    return check(node.left, low, node.val) && check(node.right, node.val, high);
  };
  return check(root, -Infinity, Infinity);
}`,
    visibleTests: [
      { args: [[2, 1, 3]], expected: true },
      { args: [[5, 1, 4, null, null, 3, 6]], expected: false },
    ],
    hiddenTests: [
      { args: [[]], expected: true },
      { args: [[1]], expected: true },
      { args: [[10, 5, 15, null, null, 6, 20]], expected: false },
      { args: [[3, 1, 5, 0, 2, 4, 6]], expected: true },
      { args: [[5, 4, 6, null, null, 3, 7]], expected: false },
      { args: [[2, 2, 2]], expected: false },
    ],
  },
  {
    id: 'lowest-common-ancestor-bst',
    topic: 'trees',
    title: 'Lowest Common Ancestor of a BST',
    difficulty: 'Medium',
    statement: 'Given the root of a binary search tree and two values p and q that are guaranteed to appear in the tree, find their lowest common ancestor and return the value stored at that ancestor node. The lowest common ancestor is the deepest node that has both target values in its subtree, where a node counts as part of its own subtree. The root is described as a level-order array where null marks a missing node.',
    examples: [
      { input: 'root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8', output: '6', explanation: 'The values 2 and 8 live in different subtrees of the root, so the root value 6 is their lowest common ancestor.' },
      { input: 'root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 4', output: '2', explanation: 'The value 4 sits inside the subtree of 2, so 2 itself is the lowest common ancestor.' },
    ],
    constraints: '2 <= number of nodes <= 10^5 · all values in the tree are distinct · p and q both appear in the tree',
    fn: 'lowestCommonAncestor',
    kind: 'tree-value',
    normalize: 'none',
    starterCode: `// lowestCommonAncestor(root, p, q) -> value of the lowest common ancestor node; nodes look like { val, left, right }
function lowestCommonAncestor(root, p, q) {
  // TODO: use the search ordering to walk toward the split point of p and q
}`,
    hints: [
      'In a search tree, comparing both targets with the current value tells you which subtree holds them. When do both targets stop agreeing on a direction?',
      'If both targets are smaller than the current value, move left; if both are larger, move right. Otherwise the current node is the split point and its value is the answer.',
    ],
    explanation: 'The search ordering tells us where each target lives relative to any node. While both targets sit on the same side of the current node, their ancestor must also sit on that side, so we walk into that subtree. The first node where the targets separate to different sides, or where one target equals the node itself, is the deepest node whose subtree still contains both targets, and that node is exactly the lowest common ancestor. We return its stored value as required.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function lowestCommonAncestor(root, p, q) {
  let node = root;
  while (node) {
    if (p < node.val && q < node.val) node = node.left;
    else if (p > node.val && q > node.val) node = node.right;
    else return node.val;
  }
  return null;
}`,
    visibleTests: [
      { args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 8], expected: 6 },
      { args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 2, 4], expected: 2 },
    ],
    hiddenTests: [
      { args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 0, 5], expected: 2 },
      { args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 3, 5], expected: 4 },
      { args: [[6, 2, 8, 0, 4, 7, 9, null, null, 3, 5], 7, 9], expected: 8 },
      { args: [[2, 1, 3], 1, 3], expected: 2 },
      { args: [[5, 3, 7, 2, 4, 6, 8], 2, 4], expected: 3 },
    ],
  },
  {
    id: 'word-break',
    topic: 'dp',
    title: 'Word Break',
    difficulty: 'Medium',
    statement: 'Given a string s and a list of dictionary words, decide whether s can be cut into a sequence of dictionary words placed back to back with nothing left over, and return true or false. Dictionary words may be reused as many times as needed, and the whole string must be covered exactly.',
    examples: [
      { input: 's = "leetcode", wordDict = ["leet","code"]', output: 'true', explanation: 'The string splits into leet followed by code, covering every character.' },
      { input: 's = "catsandog", wordDict = ["cats","dog","sand","and","cat"]', output: 'false', explanation: 'Every attempted split leaves a small leftover piece that no dictionary word can cover, so no full split exists.' },
    ],
    constraints: '1 <= s.length <= 300 · 1 <= wordDict.length <= 1000 · s and every dictionary word use lowercase English letters only',
    fn: 'wordBreak',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// wordBreak(s, wordDict) -> true when s splits fully into dictionary words
function wordBreak(s, wordDict) {
  // TODO: mark which prefixes of s can already be split, then extend them
}`,
    hints: [
      'Think in terms of positions in the string. What does it mean for the prefix ending at a position to be already solvable?',
      'Let reachable[i] mean the first i characters can be split. From a reachable position, jump ahead by any dictionary word that matches there and mark the landing position.',
    ],
    explanation: 'We track which prefixes of the string can already be formed from dictionary words. The empty prefix needs no words, so it starts as reachable. From any reachable position we try every dictionary word: when the word matches the string at that position, the position just past the word becomes reachable as well. If the position at the very end of the string becomes reachable, a complete split exists; otherwise some part of the string can never be covered and the answer is false.',
    complexity: 'Time O(n * w) · Space O(n)',
    solutionCode: `function wordBreak(s, wordDict) {
  const words = new Set(wordDict);
  const reachable = new Array(s.length + 1).fill(false);
  reachable[0] = true;
  for (let i = 0; i < s.length; i++) {
    if (!reachable[i]) continue;
    for (const word of words) {
      if (s.startsWith(word, i)) reachable[i + word.length] = true;
    }
  }
  return reachable[s.length];
}`,
    visibleTests: [
      { args: ["leetcode", ["leet", "code"]], expected: true },
      { args: ["catsandog", ["cats", "dog", "sand", "and", "cat"]], expected: false },
    ],
    hiddenTests: [
      { args: ["applepenapple", ["apple", "pen"]], expected: true },
      { args: ["aaaaaaa", ["aaaa", "aaa"]], expected: true },
      { args: ["abcd", ["a", "b", "cd"]], expected: true },
      { args: ["abc", ["ab", "d"]], expected: false },
      { args: ["aa", ["a"]], expected: true },
      { args: ["pineapplepenapple", ["apple", "pen", "applepen", "pine", "pineapple"]], expected: true },
    ],
  },
  {
    id: 'longest-common-subsequence',
    topic: 'dp',
    title: 'Longest Common Subsequence',
    difficulty: 'Medium',
    statement: 'Given two strings, find the length of their longest common subsequence and return that length. A subsequence is formed by deleting zero or more characters without changing the order of what remains, and the chosen characters must appear in the same relative order inside both strings.',
    examples: [
      { input: 'text1 = "abcde", text2 = "ace"', output: '3', explanation: 'The subsequence ace appears in order inside both strings and nothing longer fits.' },
      { input: 'text1 = "abc", text2 = "abc"', output: '3', explanation: 'Identical strings share the whole string as a common subsequence.' },
    ],
    constraints: '1 <= text1.length, text2.length <= 1000 · both strings use lowercase English letters only',
    fn: 'lcs',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// lcs(text1, text2) -> length of the longest subsequence common to both strings
function lcs(text1, text2) {
  // TODO: compare prefixes of the two strings and reuse smaller answers
}`,
    hints: [
      'Look at the last characters of both prefixes. How does the answer change when those two characters match, and when they differ?',
      'When the last characters match, take one plus the answer for both shorter prefixes. Otherwise drop the last character from one string and keep the better of the two options.',
    ],
    explanation: 'We build answers for every pair of prefixes. If the current last characters of the two prefixes are equal, that character can extend the best common subsequence of the shorter prefixes by one. If they differ, the longest answer either ignores the last character of the first string or ignores the last character of the second string, so we keep the larger of those two previously computed answers. Filling the table from short prefixes to longer ones guarantees every smaller answer is ready when needed, and the corner cell holds the length for the full strings.',
    complexity: 'Time O(m * n) · Space O(n)',
    solutionCode: `function lcs(text1, text2) {
  const n = text2.length;
  let prev = new Array(n + 1).fill(0);
  let curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= text1.length; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) curr[j] = prev[j - 1] + 1;
      else curr[j] = Math.max(prev[j], curr[j - 1]);
    }
    const swap = prev;
    prev = curr;
    curr = swap;
    curr.fill(0);
  }
  return prev[n];
}`,
    visibleTests: [
      { args: ["abcde", "ace"], expected: 3 },
      { args: ["abc", "abc"], expected: 3 },
    ],
    hiddenTests: [
      { args: ["abcd", "acbd"], expected: 3 },
      { args: ["aaaa", "aa"], expected: 2 },
      { args: ["a", "b"], expected: 0 },
      { args: ["hello", "hallo"], expected: 4 },
      { args: ["xyz", "xyz"], expected: 3 },
    ],
  },
  {
    id: 'unique-paths',
    topic: 'dp',
    title: 'Unique Paths',
    difficulty: 'Medium',
    statement: 'A robot stands at the top-left cell of a grid with m rows and n columns and wants to reach the bottom-right cell. From any cell the robot may move only one step down or one step right. Count how many different routes the robot can take and return that count.',
    examples: [
      { input: 'm = 3, n = 7', output: '28', explanation: 'The trip needs two down moves and six right moves in some order, and the distinct orders of those moves give 28 routes.' },
      { input: 'm = 3, n = 2', output: '3', explanation: 'The routes are right-down-down, down-right-down and down-down-right.' },
    ],
    constraints: '1 <= m, n <= 100 · tested grids keep the route count inside a signed 32-bit integer',
    fn: 'uniquePaths',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// uniquePaths(m, n) -> number of down/right-only routes across an m by n grid
function uniquePaths(m, n) {
  // TODO: the routes into a cell come from the cell above and the cell on its left
}`,
    hints: [
      'How many ways can the robot enter a given cell? It must have come from exactly one of two neighbouring cells.',
      'Every cell in the first row and first column has exactly one incoming route. For other cells, add the counts of the cell above and the cell to the left.',
    ],
    explanation: 'The robot can only arrive at a cell from above or from the left, so the number of routes into a cell equals the routes into the cell above plus the routes into the cell to its left. Cells on the first row or first column can be reached in exactly one way, since only one direction of travel ever leads into them. Filling the grid row by row means both neighbours of each cell are already counted when the cell is processed, and the count stored at the bottom-right cell is the total number of routes. Only one previous row is needed, so the table collapses to a single rolling row.',
    complexity: 'Time O(m * n) · Space O(n)',
    solutionCode: `function uniquePaths(m, n) {
  const row = new Array(n).fill(1);
  for (let i = 1; i < m; i++) {
    for (let j = 1; j < n; j++) {
      row[j] = row[j] + row[j - 1];
    }
  }
  return row[n - 1];
}`,
    visibleTests: [
      { args: [3, 7], expected: 28 },
      { args: [3, 2], expected: 3 },
    ],
    hiddenTests: [
      { args: [1, 1], expected: 1 },
      { args: [1, 5], expected: 1 },
      { args: [5, 1], expected: 1 },
      { args: [2, 2], expected: 2 },
      { args: [3, 3], expected: 6 },
      { args: [4, 4], expected: 20 },
    ],
  },
];

export const PROBLEMS = [...BASE_PROBLEMS, ...EXTRA_PROBLEMS, ...PROBLEMS_EXTRA2];

export const getProblem = (id) => PROBLEMS.find((p) => p.id === id);

export const problemsByTopic = (topicId) => PROBLEMS.filter((p) => p.topic === topicId);
