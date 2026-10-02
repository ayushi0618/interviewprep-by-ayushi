// dsaExtra2.js — DSA Sheet extension bank 2 for InterviewPrep by Ayushi.
// 20 hand-authored problems (linked list, trees, graphs, DP, heap).
// Tests are proven by a throwaway checker against judgeCore semantics.

export const PROBLEMS_EXTRA2 = [
  // ---------------------------------------------------------------- Linked List
  {
    id: 'remove-nth-from-end',
    topic: 'linked-list',
    title: 'Remove Nth Node From End',
    difficulty: 'Medium',
    statement: 'You are given the head of a singly linked list and a number n. Remove the node that sits n places from the end of the list and return the head of the shortened list. The head you get is a real list node that looks like { val, next }, so work with pointers and return the new head.',
    examples: [
      { input: 'head = [1,2,3,4,5], n = 2', output: '[1, 2, 3, 5]', explanation: 'Counting from the end, the second node holds 4, so 4 is taken out and the chain closes over the gap.' },
      { input: 'head = [1], n = 1', output: '[]', explanation: 'The only node is also the first from the end, so removing it leaves an empty list.' },
    ],
    constraints: '1 <= number of nodes <= 30 · 1 <= val <= 100 · 1 <= n <= number of nodes',
    fn: 'removeNthFromEnd',
    kind: 'linkedlist',
    normalize: 'none',
    starterCode: `// removeNthFromEnd(head, n) -> head after deleting the nth node from the end; nodes look like { val, next }
function removeNthFromEnd(head, n) {
  // TODO: lead one pointer n steps ahead, then move both until the lead reaches the end
}`,
    hints: [
      'If two walkers keep a fixed gap of n nodes between them, where does the slower one stop when the faster one reaches the tail?',
      'Put a dummy node before the head. Move fast n steps ahead of slow, then advance both together. When fast is at the last node, slow sits just before the node to delete.',
    ],
    explanation: 'We add a dummy node in front of the head so that deleting the real head needs no special case. A fast pointer is moved n steps ahead of a slow pointer, creating a gap of exactly n nodes. Both pointers then advance together until fast reaches the last node; at that moment slow is parked right before the node that is n places from the end, so we bypass that node by pointing slow.next past it. Returning the dummy next pointer gives the possibly new head.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function removeNthFromEnd(head, n) {
  const dummy = { val: 0, next: head };
  let fast = dummy;
  let slow = dummy;
  for (let i = 0; i < n; i++) fast = fast.next;
  while (fast.next) {
    fast = fast.next;
    slow = slow.next;
  }
  slow.next = slow.next.next;
  return dummy.next;
}`,
    visibleTests: [
      { args: [[1, 2, 3, 4, 5], 2], expected: [1, 2, 3, 5] },
      { args: [[1], 1], expected: [] },
    ],
    hiddenTests: [
      { args: [[1, 2], 1], expected: [1] },
      { args: [[1, 2], 2], expected: [2] },
      { args: [[1, 2, 3], 3], expected: [2, 3] },
      { args: [[5, 6, 7, 8], 4], expected: [6, 7, 8] },
    ],
  },
  {
    id: 'add-two-numbers',
    topic: 'linked-list',
    title: 'Add Two Numbers',
    difficulty: 'Medium',
    statement: 'Two non-empty linked lists each store one non-negative number, but the digits are kept in reverse order, so the head holds the ones digit. Add the two numbers and return the sum as a linked list in the same reverse digit order. Both inputs arrive as real list heads whose nodes look like { val, next }.',
    examples: [
      { input: 'l1 = [2,4,3], l2 = [5,6,4]', output: '[7, 0, 8]', explanation: 'The lists stand for 342 and 465. Their sum is 807, which written in reverse digit order is 7, 0, 8.' },
      { input: 'l1 = [0], l2 = [0]', output: '[0]', explanation: 'Zero plus zero is zero, so the answer is a single node holding 0.' },
    ],
    constraints: '1 <= nodes in each list <= 100 · 0 <= val <= 9 · the numbers have no leading zeroes except zero itself',
    fn: 'addTwoNumbers',
    kind: 'linkedlist',
    normalize: 'none',
    starterCode: `// addTwoNumbers(l1, l2) -> head of the sum list in reverse digit order; nodes look like { val, next }
function addTwoNumbers(l1, l2) {
  // TODO: add digit by digit from the heads, carrying any overflow to the next node
}`,
    hints: [
      'Because the ones digits are at the heads, you can add in the same direction you walk. What extra value has to travel from one position to the next?',
      'Keep a carry. At each step add the two current digits plus the carry, write down the remainder modulo 10 as a new node, and carry the tens part forward.',
    ],
    explanation: 'Reverse order is convenient because addition starts at the ones place, which is exactly where both heads are. We walk the two lists together, and at each position we add the two digits plus any carry from the previous position. The ones digit of that total becomes a new node appended to the answer, and the tens digit becomes the carry for the next step. We keep going while either list still has digits or a carry remains, which handles numbers of different lengths and a final overflow digit.',
    complexity: 'Time O(n + m) · Space O(n + m)',
    solutionCode: `function addTwoNumbers(l1, l2) {
  const dummy = { val: 0, next: null };
  let tail = dummy;
  let carry = 0;
  let a = l1;
  let b = l2;
  while (a || b || carry) {
    const sum = (a ? a.val : 0) + (b ? b.val : 0) + carry;
    carry = Math.floor(sum / 10);
    tail.next = { val: sum % 10, next: null };
    tail = tail.next;
    if (a) a = a.next;
    if (b) b = b.next;
  }
  return dummy.next;
}`,
    visibleTests: [
      { args: [[2, 4, 3], [5, 6, 4]], expected: [7, 0, 8] },
      { args: [[0], [0]], expected: [0] },
    ],
    hiddenTests: [
      { args: [[9, 9, 9, 9, 9, 9, 9], [9, 9, 9, 9]], expected: [8, 9, 9, 9, 0, 0, 0, 1] },
      { args: [[1, 8], [0]], expected: [1, 8] },
      { args: [[5], [5]], expected: [0, 1] },
      { args: [[9, 9], [1]], expected: [0, 0, 1] },
    ],
  },
  {
    id: 'reorder-list',
    topic: 'linked-list',
    title: 'Reorder List',
    difficulty: 'Medium',
    statement: 'You are given the head of a singly linked list. Rearrange the nodes so they alternate between taking from the front and from the back: first node, last node, second node, second last node, and so on. Rearrange the nodes themselves and return the head of the reordered list. Nodes look like { val, next }.',
    examples: [
      { input: 'head = [1,2,3,4]', output: '[1, 4, 2, 3]', explanation: 'Front and back alternate: 1 from the start, 4 from the end, then 2, then 3 in the middle.' },
      { input: 'head = [1,2,3,4,5]', output: '[1, 5, 2, 4, 3]', explanation: 'The pairs close in from both ends and the middle value 3 lands last.' },
    ],
    constraints: '1 <= number of nodes <= 5 * 10^4 · 1 <= val <= 1000',
    fn: 'reorderList',
    kind: 'linkedlist',
    normalize: 'none',
    starterCode: `// reorderList(head) -> head after alternating front and back nodes; nodes look like { val, next }
function reorderList(head) {
  // TODO: split the list in the middle, reverse the back half, then weave the halves together
}`,
    hints: [
      'Weaving becomes easy once the back half is in reverse order. How do you find the middle and flip the back half in place?',
      'Use slow and fast pointers to stop at the middle, reverse the second half, then interleave one node from the first half with one node from the reversed half.',
    ],
    explanation: 'The target order pulls one node from the front half and then one node from the back half read backwards, so we prepare those two sequences first. Slow and fast pointers locate the middle, the list is cut there, and the second half is reversed in place so it now runs from the original tail inward. Then we weave the two halves: take a node from the first half, splice in a node from the reversed half, and repeat until the reversed half is used up. Cutting the list at the middle first guarantees the weave ends cleanly for both even and odd lengths.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function reorderList(head) {
  if (!head || !head.next) return head;
  let slow = head;
  let fast = head;
  while (fast.next && fast.next.next) {
    slow = slow.next;
    fast = fast.next.next;
  }
  let second = slow.next;
  slow.next = null;
  let prev = null;
  while (second) {
    const nxt = second.next;
    second.next = prev;
    prev = second;
    second = nxt;
  }
  let first = head;
  second = prev;
  while (second) {
    const t1 = first.next;
    const t2 = second.next;
    first.next = second;
    second.next = t1;
    first = t1;
    second = t2;
  }
  return head;
}`,
    visibleTests: [
      { args: [[1, 2, 3, 4]], expected: [1, 4, 2, 3] },
      { args: [[1, 2, 3, 4, 5]], expected: [1, 5, 2, 4, 3] },
    ],
    hiddenTests: [
      { args: [[1]], expected: [1] },
      { args: [[1, 2]], expected: [1, 2] },
      { args: [[1, 2, 3]], expected: [1, 3, 2] },
      { args: [[1, 2, 3, 4, 5, 6]], expected: [1, 6, 2, 5, 3, 4] },
    ],
  },
  {
    id: 'linked-list-cycle-ii',
    topic: 'linked-list',
    title: 'Linked List Cycle II',
    difficulty: 'Medium',
    statement: 'A linked list is described by its values plus a position pos: the tail links back to the node at index pos, and pos of -1 means the tail links nowhere. If the list contains a cycle, return the value stored at the node where the cycle begins. If there is no cycle, return -1. You receive the head as a real list node that looks like { val, next }.',
    examples: [
      { input: 'head = [3,2,0,-4], pos = 1', output: '2', explanation: 'The tail links back to the node at index 1, and that node holds the value 2.' },
      { input: 'head = [1], pos = -1', output: '-1', explanation: 'The single node points to nothing, so there is no cycle and the answer is -1.' },
    ],
    constraints: '0 <= number of nodes <= 10^4 · -10^5 <= val <= 10^5 · pos is -1 or a valid index',
    fn: 'detectCycle',
    kind: 'cycle',
    normalize: 'none',
    starterCode: `// detectCycle(head) -> value of the node where the cycle starts, or -1; nodes look like { val, next }
function detectCycle(head) {
  // TODO: find a meeting point inside the cycle first, then locate the entry node
}`,
    hints: [
      'A slow and a fast walker will meet inside any cycle. Once they meet, what second walk reveals the exact entry point?',
      'After the meeting, restart one pointer at the head and move both pointers one step at a time. They collide exactly at the first node of the cycle, so return its value.',
    ],
    explanation: 'First we run a slow pointer and a fast pointer through the list. If fast reaches the end there is no cycle and we return -1. If the two pointers meet, a cycle exists, and the meeting point is guaranteed to be inside it. A classic distance argument then shows that the cycle entry is the same number of steps from the head as it is from the meeting point when walking one step at a time. So we restart one pointer at the head, advance both pointers together, and where they meet again is the entry node, whose value we return.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function detectCycle(head) {
  if (!head) return -1;
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow.next;
    fast = fast.next.next;
    if (slow === fast) {
      let p = head;
      while (p !== slow) {
        p = p.next;
        slow = slow.next;
      }
      return p.val;
    }
  }
  return -1;
}`,
    visibleTests: [
      { args: [[3, 2, 0, -4], 1], expected: 2 },
      { args: [[1, 2], 0], expected: 1 },
    ],
    hiddenTests: [
      { args: [[1], -1], expected: -1 },
      { args: [[1, 2, 3, 4], 2], expected: 3 },
      { args: [[5, 6, 7], -1], expected: -1 },
      { args: [[10, 20, 30], 0], expected: 10 },
    ],
  },
  // ---------------------------------------------------------------- Trees
  {
    id: 'kth-smallest-bst',
    topic: 'trees',
    title: 'Kth Smallest Element in a BST',
    difficulty: 'Medium',
    statement: 'Given the root of a binary search tree and a number k, return the value of the kth smallest node, counting from 1. In a binary search tree every value in the left subtree is smaller than the node and every value in the right subtree is larger. The root is described as a level-order array where null marks a missing node, and nodes look like { val, left, right }.',
    examples: [
      { input: 'root = [3,1,4,null,2], k = 1', output: '1', explanation: 'The values in sorted order are 1, 2, 3, 4, so the first smallest is 1.' },
      { input: 'root = [5,3,6,2,4,null,null,1], k = 3', output: '3', explanation: 'Sorted order is 1, 2, 3, 4, 5, 6, and the third value is 3.' },
    ],
    constraints: '1 <= number of nodes <= 10^4 · 0 <= val <= 10^4 · 1 <= k <= number of nodes',
    fn: 'kthSmallest',
    kind: 'tree-value',
    normalize: 'none',
    starterCode: `// kthSmallest(root, k) -> kth smallest value in the BST (1-indexed); nodes look like { val, left, right }
function kthSmallest(root, k) {
  // TODO: walk the tree in sorted order and count nodes until you reach k
}`,
    hints: [
      'Which traversal visits a binary search tree in sorted order, and how does that turn the question into simple counting?',
      'An inorder walk goes left, node, right, which is exactly ascending order in a BST. Count each visited node and return the value when the count reaches k.',
    ],
    explanation: 'The inorder traversal of a binary search tree visits values in ascending order, because everything in the left subtree is smaller than the node and everything in the right subtree is larger. So the kth node visited by an inorder walk is the kth smallest value. We run the walk iteratively with an explicit stack, counting nodes as they are visited, and stop as soon as the count reaches k, which avoids collecting or sorting the whole tree.',
    complexity: 'Time O(n) · Space O(h)',
    solutionCode: `function kthSmallest(root, k) {
  const stack = [];
  let curr = root;
  let count = 0;
  while (curr || stack.length) {
    while (curr) {
      stack.push(curr);
      curr = curr.left;
    }
    curr = stack.pop();
    count++;
    if (count === k) return curr.val;
    curr = curr.right;
  }
  return -1;
}`,
    visibleTests: [
      { args: [[3, 1, 4, null, 2], 1], expected: 1 },
      { args: [[5, 3, 6, 2, 4, null, null, 1], 3], expected: 3 },
    ],
    hiddenTests: [
      { args: [[1], 1], expected: 1 },
      { args: [[2, 1, 3], 2], expected: 2 },
      { args: [[4, 2, 6, 1, 3, 5, 7], 4], expected: 4 },
      { args: [[5, 3, 6, 2, 4, null, null, 1], 5], expected: 5 },
    ],
  },
  {
    id: 'balanced-binary-tree',
    topic: 'trees',
    title: 'Balanced Binary Tree',
    difficulty: 'Easy',
    statement: 'Given the root of a binary tree, decide whether it is height-balanced. A tree is balanced when, at every single node, the heights of the left and right subtrees differ by at most 1. Return true when the whole tree satisfies this and false otherwise. The root is described as a level-order array where null marks a missing node, and nodes look like { val, left, right }.',
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: 'true', explanation: 'At each node the two sides are close in height, so the tree is balanced.' },
      { input: 'root = [1,2,2,3,3,null,null,4,4]', output: 'false', explanation: 'At the root the left side is three levels deep while the right side is only one, a gap larger than 1.' },
    ],
    constraints: '0 <= number of nodes <= 5000 · -10^4 <= val <= 10^4',
    fn: 'isBalanced',
    kind: 'tree-value',
    normalize: 'none',
    starterCode: `// isBalanced(root) -> true if every node has subtree heights differing by at most 1; nodes look like { val, left, right }
function isBalanced(root) {
  // TODO: compute subtree heights bottom-up and flag any node whose sides differ too much
}`,
    hints: [
      'Checking heights separately at every node repeats work. Can one bottom-up pass return both the height and a failure signal?',
      'Let a helper return the height of a subtree, or -1 to signal that something below is already unbalanced. Compare the two child results at each node.',
    ],
    explanation: 'We compute heights from the leaves upward. The helper returns the height of the subtree it is given, but if either child reports -1, or if the two child heights differ by more than 1 at the current node, the helper returns -1 to signal failure. That signal propagates straight to the root without extra checking, so a single post-order pass both measures every height and verifies the balance condition at every node. The tree is balanced exactly when the root call does not return -1.',
    complexity: 'Time O(n) · Space O(h)',
    solutionCode: `function isBalanced(root) {
  function height(node) {
    if (!node) return 0;
    const left = height(node.left);
    if (left === -1) return -1;
    const right = height(node.right);
    if (right === -1) return -1;
    if (Math.abs(left - right) > 1) return -1;
    return 1 + Math.max(left, right);
  }
  return height(root) !== -1;
}`,
    visibleTests: [
      { args: [[3, 9, 20, null, null, 15, 7]], expected: true },
      { args: [[1, 2, 2, 3, 3, null, null, 4, 4]], expected: false },
    ],
    hiddenTests: [
      { args: [[]], expected: true },
      { args: [[1]], expected: true },
      { args: [[1, 2]], expected: true },
      { args: [[1, 2, null, 3]], expected: false },
    ],
  },
  {
    id: 'binary-tree-right-side-view',
    topic: 'trees',
    title: 'Binary Tree Right Side View',
    difficulty: 'Medium',
    statement: 'Imagine standing to the right of a binary tree and looking at it from that side. Return the values you would see, listed from the top of the tree to the bottom. In other words, for each depth take the rightmost node at that depth. The root is described as a level-order array where null marks a missing node, and nodes look like { val, left, right }.',
    examples: [
      { input: 'root = [1,2,3,null,5,null,4]', output: '[1, 3, 4]', explanation: 'Level by level the rightmost values are 1 at the top, then 3, then 4 at the deepest level.' },
      { input: 'root = [1,null,3]', output: '[1, 3]', explanation: 'The root is seen first, and its only child on the right is seen below it.' },
    ],
    constraints: '0 <= number of nodes <= 100 · -100 <= val <= 100',
    fn: 'rightSideView',
    kind: 'tree-value',
    normalize: 'none',
    starterCode: `// rightSideView(root) -> rightmost value at each depth, top to bottom; nodes look like { val, left, right }
function rightSideView(root) {
  // TODO: visit the tree level by level and keep the last value of each level
}`,
    hints: [
      'From the right side you see exactly one node per depth. If you process the tree one depth at a time, which node of each group is visible?',
      'Do a breadth-first walk. For each level, record the value of the final node in that level before moving down to the next one.',
    ],
    explanation: 'The view from the right contains exactly the last node of each depth when nodes are read left to right. A breadth-first walk naturally groups nodes by depth: we note how many nodes are queued for the current level, process exactly that many, and keep the value of the last one processed as the visible node for the level. Children are queued left before right, so the last node handled in each group is the rightmost node at that depth.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function rightSideView(root) {
  if (!root) return [];
  const res = [];
  const queue = [root];
  while (queue.length) {
    const size = queue.length;
    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      if (i === size - 1) res.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }
  return res;
}`,
    visibleTests: [
      { args: [[1, 2, 3, null, 5, null, 4]], expected: [1, 3, 4] },
      { args: [[1, null, 3]], expected: [1, 3] },
    ],
    hiddenTests: [
      { args: [[]], expected: [] },
      { args: [[1]], expected: [1] },
      { args: [[1, 2, 3, 4]], expected: [1, 3, 4] },
      { args: [[3, 9, 20, null, null, 15, 7]], expected: [3, 20, 7] },
    ],
  },
  {
    id: 'binary-tree-max-path-sum',
    topic: 'trees',
    title: 'Binary Tree Maximum Path Sum',
    difficulty: 'Hard',
    statement: 'A path in a binary tree is a sequence of connected nodes where each step moves between a parent and a child, and no node is used twice. The path may start and end at any nodes and must contain at least one node. Return the largest possible sum of values along any such path. The root is described as a level-order array where null marks a missing node, and nodes look like { val, left, right }.',
    examples: [
      { input: 'root = [1,2,3]', output: '6', explanation: 'The best route goes 2 up through 1 and down to 3, giving 2 + 1 + 3 = 6.' },
      { input: 'root = [-10,9,20,null,null,15,7]', output: '42', explanation: 'The best route stays in the right subtree: 15 up through 20 and down to 7, giving 15 + 20 + 7 = 42.' },
    ],
    constraints: '1 <= number of nodes <= 3 * 10^4 · -1000 <= val <= 1000',
    fn: 'maxPathSum',
    kind: 'tree-value',
    normalize: 'none',
    starterCode: `// maxPathSum(root) -> largest sum over any parent-child path; nodes look like { val, left, right }
function maxPathSum(root) {
  // TODO: for each node combine the best downward gains from both children
}`,
    hints: [
      'Every path has a highest node where it may turn from one side to the other. If you knew the best downward gain from each child, what could you compute at that turning node?',
      'A helper returns the best downward sum starting at a node, ignoring any negative child gain. At each node also try node plus both child gains as a complete path and track the best seen.',
    ],
    explanation: 'Any path has one highest node where it either goes straight down one side or turns from the left side to the right side. For each node we compute the best sum of a path that starts at that node and goes only downward: the node value plus the better of the two child gains, where a negative child gain is treated as zero because we would rather stop than drag the sum down. While computing this, we also test the turning candidate, the node value plus both child gains, and remember the largest candidate seen anywhere. A post-order recursion supplies the child gains before the parent needs them.',
    complexity: 'Time O(n) · Space O(h)',
    solutionCode: `function maxPathSum(root) {
  let best = -Infinity;
  function gain(node) {
    if (!node) return 0;
    const left = Math.max(0, gain(node.left));
    const right = Math.max(0, gain(node.right));
    best = Math.max(best, node.val + left + right);
    return node.val + Math.max(left, right);
  }
  gain(root);
  return best;
}`,
    visibleTests: [
      { args: [[1, 2, 3]], expected: 6 },
      { args: [[-10, 9, 20, null, null, 15, 7]], expected: 42 },
    ],
    hiddenTests: [
      { args: [[-3]], expected: -3 },
      { args: [[2, -1]], expected: 2 },
      { args: [[-2, -1, -3]], expected: -1 },
      { args: [[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1]], expected: 48 },
    ],
  },
  // ---------------------------------------------------------------- Graphs
  {
    id: 'clone-graph',
    topic: 'graphs',
    title: 'Clone Graph',
    difficulty: 'Medium',
    statement: 'An undirected graph with nodes labelled 1 to n is given as an adjacency list: the entry at position i lists the labels of the neighbours of node i + 1. Build a deep copy of the graph and return its adjacency list in the same order. A deep copy means brand new lists, so changing the copy later must not affect the original. An empty graph, given as an empty list, returns an empty list.',
    examples: [
      { input: 'adj = [[2,4],[1,3],[2,4],[1,3]]', output: '[[2, 4], [1, 3], [2, 4], [1, 3]]', explanation: 'Four nodes form a ring, and the copy lists the same neighbours for every node in the same order.' },
      { input: 'adj = [[]]', output: '[[]]', explanation: 'A single node with no neighbours copies to a single empty neighbour list.' },
    ],
    constraints: '0 <= n <= 100 · the graph is undirected and connected unless empty · no self loops or repeated edges',
    fn: 'cloneGraph',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// cloneGraph(adj) -> deep copy of the adjacency list in the same order
function cloneGraph(adj) {
  // TODO: build fresh neighbour lists that share no storage with the input
}`,
    hints: [
      'With the graph already flattened into neighbour lists, what does a deep copy need to duplicate so that nothing is shared with the original?',
      'Create a new outer list and, for every node, a new inner list holding the same neighbour labels in the same order.',
    ],
    explanation: 'The adjacency list already captures the whole graph: node order plus, for each node, its neighbour labels in order. Cloning the graph therefore means producing a new outer list whose inner lists are also new, while copying the labels across unchanged. Because numbers themselves are copied by value, duplicating each inner list is enough to make the result fully independent of the input. The empty graph and a node with no neighbours fall out naturally as empty lists.',
    complexity: 'Time O(V + E) · Space O(V + E)',
    solutionCode: `function cloneGraph(adj) {
  if (!adj) return [];
  return adj.map((neighbors) => neighbors.slice());
}`,
    visibleTests: [
      { args: [[[2, 4], [1, 3], [2, 4], [1, 3]]], expected: [[2, 4], [1, 3], [2, 4], [1, 3]] },
      { args: [[[]]], expected: [[]] },
    ],
    hiddenTests: [
      { args: [[]], expected: [] },
      { args: [[[2], [1]]], expected: [[2], [1]] },
      { args: [[[2, 3], [1, 3], [1, 2]]], expected: [[2, 3], [1, 3], [1, 2]] },
      { args: [[[2], [1, 3], [2]]], expected: [[2], [1, 3], [2]] },
    ],
  },
  {
    id: 'pacific-atlantic-water-flow',
    topic: 'graphs',
    title: 'Pacific Atlantic Water Flow',
    difficulty: 'Medium',
    statement: 'You are given a grid of land heights. Rain on a cell can flow to a neighbouring cell up, down, left or right when that neighbour is the same height or lower. The Pacific Ocean touches the top and left edges of the grid, and the Atlantic Ocean touches the bottom and right edges. Return every cell, as a [row, col] pair, from which rain can reach both oceans. List the pairs in row-major order, meaning sorted first by row and then by column, so the answer is unique.',
    examples: [
      { input: 'heights = [[1,2,2,3,5],[3,2,3,4,4],[2,4,5,3,1],[6,7,1,4,5],[5,1,1,2,4]]', output: '[[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]]', explanation: 'These seven cells each have a downhill route to the Pacific side and a downhill route to the Atlantic side.' },
      { input: 'heights = [[1]]', output: '[[0, 0]]', explanation: 'The only cell touches all four edges, so it reaches both oceans at once.' },
    ],
    constraints: '1 <= rows, cols <= 200 · 0 <= heights[row][col] <= 10^5',
    fn: 'pacificAtlantic',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// pacificAtlantic(heights) -> [row, col] pairs reaching both oceans, in row-major order
function pacificAtlantic(heights) {
  // TODO: work backwards from each ocean and mark the cells that can climb to it
}`,
    hints: [
      'Checking every cell separately repeats work. What changes if you start at the ocean edges and walk inland instead?',
      'From the Pacific edges, flood to neighbours that are equal or higher, and do the same from the Atlantic edges. Cells marked by both floods are the answer.',
    ],
    explanation: 'Instead of testing each cell against both oceans, we reverse the direction. Starting from all Pacific edge cells we spread inland, always moving to a neighbour whose height is equal or greater, which marks exactly the cells whose rain can flow down to the Pacific. We repeat the same spread from the Atlantic edges. A cell can reach both oceans precisely when both spreads marked it. Collecting the doubly marked cells by scanning rows top to bottom and columns left to right produces the required row-major order.',
    complexity: 'Time O(m * n) · Space O(m * n)',
    solutionCode: `function pacificAtlantic(heights) {
  if (!heights || heights.length === 0) return [];
  const rows = heights.length;
  const cols = heights[0].length;
  const pac = Array.from({ length: rows }, () => Array(cols).fill(false));
  const atl = Array.from({ length: rows }, () => Array(cols).fill(false));
  function dfs(r, c, visited, prev) {
    if (r < 0 || c < 0 || r >= rows || c >= cols) return;
    if (visited[r][c]) return;
    if (heights[r][c] < prev) return;
    visited[r][c] = true;
    dfs(r + 1, c, visited, heights[r][c]);
    dfs(r - 1, c, visited, heights[r][c]);
    dfs(r, c + 1, visited, heights[r][c]);
    dfs(r, c - 1, visited, heights[r][c]);
  }
  for (let c = 0; c < cols; c++) {
    dfs(0, c, pac, -Infinity);
    dfs(rows - 1, c, atl, -Infinity);
  }
  for (let r = 0; r < rows; r++) {
    dfs(r, 0, pac, -Infinity);
    dfs(r, cols - 1, atl, -Infinity);
  }
  const res = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (pac[r][c] && atl[r][c]) res.push([r, c]);
    }
  }
  return res;
}`,
    visibleTests: [
      { args: [[[1, 2, 2, 3, 5], [3, 2, 3, 4, 4], [2, 4, 5, 3, 1], [6, 7, 1, 4, 5], [5, 1, 1, 2, 4]]], expected: [[0, 4], [1, 3], [1, 4], [2, 2], [3, 0], [3, 1], [4, 0]] },
      { args: [[[1]]], expected: [[0, 0]] },
    ],
    hiddenTests: [
      { args: [[[1, 2], [2, 1]]], expected: [[0, 1], [1, 0]] },
      { args: [[[2, 1], [1, 2]]], expected: [[0, 0], [0, 1], [1, 0], [1, 1]] },
      { args: [[[10]]], expected: [[0, 0]] },
      { args: [[[1, 1], [1, 1]]], expected: [[0, 0], [0, 1], [1, 0], [1, 1]] },
    ],
  },
  {
    id: 'course-schedule',
    topic: 'graphs',
    title: 'Course Schedule',
    difficulty: 'Medium',
    statement: 'There are numCourses courses labelled 0 to numCourses - 1. You are given prerequisite pairs where a pair [a, b] means course b must be finished before course a can be taken. Decide whether it is possible to finish every course by following these rules, returning true when an ordering exists and false when the requirements trap you in a circle.',
    examples: [
      { input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true', explanation: 'Course 0 comes first and course 1 after it, so both can be finished.' },
      { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false', explanation: 'Each course waits on the other, so neither can ever be started.' },
    ],
    constraints: '1 <= numCourses <= 2000 · 0 <= prerequisites.length <= 5000 · each pair is [a, b] with b required before a',
    fn: 'canFinish',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// canFinish(numCourses, prerequisites) -> true if all courses can be ordered without a cycle
function canFinish(numCourses, prerequisites) {
  // TODO: model the requirements as a graph and look for a circular dependency
}`,
    hints: [
      'Think of each requirement as an arrow from the earlier course to the later one. What structure makes an ordering impossible?',
      'Repeatedly take courses whose requirements are all satisfied. If you can take every course this way there is no cycle; getting stuck means a cycle remains.',
    ],
    explanation: 'We turn each pair [a, b] into an arrow from b to a, meaning b unlocks a, and count for every course how many requirements it still waits on. Courses waiting on nothing can be taken immediately, so we place them in a queue. Taking a course lowers the waiting count of everything it unlocks, and any course whose count reaches zero joins the queue. If this process eventually takes all numCourses courses, a valid order exists. If the queue empties early, the leftover courses depend on each other in a cycle and finishing is impossible.',
    complexity: 'Time O(V + E) · Space O(V + E)',
    solutionCode: `function canFinish(numCourses, prerequisites) {
  const graph = Array.from({ length: numCourses }, () => []);
  const indeg = Array(numCourses).fill(0);
  for (const pair of prerequisites) {
    const a = pair[0];
    const b = pair[1];
    graph[b].push(a);
    indeg[a]++;
  }
  const queue = [];
  for (let i = 0; i < numCourses; i++) if (indeg[i] === 0) queue.push(i);
  let taken = 0;
  while (queue.length) {
    const course = queue.shift();
    taken++;
    for (const nxt of graph[course]) {
      indeg[nxt]--;
      if (indeg[nxt] === 0) queue.push(nxt);
    }
  }
  return taken === numCourses;
}`,
    visibleTests: [
      { args: [2, [[1, 0]]], expected: true },
      { args: [2, [[1, 0], [0, 1]]], expected: false },
    ],
    hiddenTests: [
      { args: [1, []], expected: true },
      { args: [3, [[0, 1], [0, 2], [1, 2]]], expected: true },
      { args: [4, [[0, 1], [1, 2], [2, 0]]], expected: false },
      { args: [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], expected: true },
    ],
  },
  {
    id: 'word-search',
    topic: 'graphs',
    title: 'Word Search',
    difficulty: 'Medium',
    statement: 'You are given a board of single letters as an array of rows, and a word. The word is found when its letters can be traced through neighbouring cells up, down, left or right, in order, without stepping on the same cell twice in one attempt. Return true if the word can be traced somewhere on the board and false otherwise.',
    examples: [
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: 'true', explanation: 'The letters can be followed across the top row and then down through the board, each step moving to a neighbour.' },
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"', output: 'false', explanation: 'After reaching B there is no neighbouring fresh cell with the next needed letter, and every other start fails as well.' },
    ],
    constraints: '1 <= rows, cols <= 6 · 1 <= word.length <= 15 · board cells and the word use English letters',
    fn: 'exist',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// exist(board, word) -> true if the word can be traced through neighbours without reusing a cell
function exist(board, word) {
  // TODO: try starting at each cell and extend the path letter by letter
}`,
    hints: [
      'From a cell that matches the next letter, where can the path go, and how do you stop it from stepping on itself?',
      'Search depth-first from every cell. Mark the current cell as used while exploring its four neighbours, then restore it when backing out.',
    ],
    explanation: 'We try every cell as the start of the word. A depth-first search extends the path one letter at a time: the current cell must match the next needed letter, then we explore all four neighbours for the rest of the word. To stop the path from reusing a cell we temporarily overwrite the current cell with a marker before recursing and restore the original letter afterwards, so other starting points still see the full board. If any search consumes the whole word the answer is true; if every start runs out of moves the answer is false.',
    complexity: 'Time O(m * n * 4^L) · Space O(L)',
    solutionCode: `function exist(board, word) {
  if (!board || board.length === 0) return false;
  const rows = board.length;
  const cols = board[0].length;
  function dfs(r, c, idx) {
    if (idx === word.length) return true;
    if (r < 0 || c < 0 || r >= rows || c >= cols) return false;
    if (board[r][c] !== word[idx]) return false;
    const saved = board[r][c];
    board[r][c] = '#';
    const found = dfs(r + 1, c, idx + 1) || dfs(r - 1, c, idx + 1) || dfs(r, c + 1, idx + 1) || dfs(r, c - 1, idx + 1);
    board[r][c] = saved;
    return found;
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (dfs(r, c, 0)) return true;
    }
  }
  return false;
}`,
    visibleTests: [
      { args: [[['A', 'B', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']], 'ABCCED'], expected: true },
      { args: [[['A', 'B', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']], 'ABCB'], expected: false },
    ],
    hiddenTests: [
      { args: [[['A', 'B', 'C', 'E'], ['S', 'F', 'C', 'S'], ['A', 'D', 'E', 'E']], 'SEE'], expected: true },
      { args: [[['a']], 'a'], expected: true },
      { args: [[['a']], 'b'], expected: false },
      { args: [[['a', 'b'], ['c', 'd']], 'abcd'], expected: false },
    ],
  },
  // ---------------------------------------------------------------- Dynamic Programming
  {
    id: 'house-robber-ii',
    topic: 'dp',
    title: 'House Robber II',
    difficulty: 'Medium',
    statement: 'Houses stand in a circle, so the first house and the last house are neighbours as well as every side-by-side pair. Each house holds some money. You want the largest total you can take without ever robbing two neighbouring houses, since that would set off an alarm. Return that largest total.',
    examples: [
      { input: 'nums = [2,3,2]', output: '3', explanation: 'The middle house alone gives 3. The two houses holding 2 are neighbours through the circle, so they cannot both be taken.' },
      { input: 'nums = [1,2,3,1]', output: '4', explanation: 'Taking the houses with 1 and 3 gives 4, and no two taken houses are neighbours around the circle.' },
    ],
    constraints: '0 <= nums.length <= 100 · 0 <= nums[i] <= 1000',
    fn: 'robII',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// robII(nums) -> max money around a circle without robbing two neighbours
function robII(nums) {
  // TODO: the circle forces a choice about the first house; handle each case as a straight street
}`,
    hints: [
      'In a circle the first and last houses clash, so at most one of them can be taken. What simpler problem do you get once you fix which of them is left out?',
      'Solve the street version twice: once skipping the last house and once skipping the first house. The better of the two answers is the circular answer.',
    ],
    explanation: 'The only difference from a straight street is the extra clash between the first and last house. Since both can never be taken together, every valid plan either leaves out the last house or leaves out the first house. Each of those two situations is the ordinary street problem on a shorter line, where we walk along keeping the best total up to the previous house and the best total when taking the current house. Running that linear pass on both ranges and taking the larger result covers all valid circular plans.',
    complexity: 'Time O(n) · Space O(n)',
    solutionCode: `function robII(nums) {
  if (!nums || nums.length === 0) return 0;
  if (nums.length === 1) return nums[0];
  function robLinear(arr) {
    let prev2 = 0;
    let prev1 = 0;
    for (const v of arr) {
      const cur = Math.max(prev1, prev2 + v);
      prev2 = prev1;
      prev1 = cur;
    }
    return prev1;
  }
  return Math.max(robLinear(nums.slice(0, -1)), robLinear(nums.slice(1)));
}`,
    visibleTests: [
      { args: [[2, 3, 2]], expected: 3 },
      { args: [[1, 2, 3, 1]], expected: 4 },
    ],
    hiddenTests: [
      { args: [[]], expected: 0 },
      { args: [[1]], expected: 1 },
      { args: [[1, 2]], expected: 2 },
      { args: [[2, 1, 1, 2]], expected: 3 },
    ],
  },
  {
    id: 'partition-equal-subset-sum',
    topic: 'dp',
    title: 'Partition Equal Subset Sum',
    difficulty: 'Medium',
    statement: 'Given a list of positive numbers, decide whether the list can be split into two groups so that the sum of each group is exactly the same. Every number must land in one of the two groups. Return true when such a split exists and false when it does not.',
    examples: [
      { input: 'nums = [1,5,11,5]', output: 'true', explanation: 'The groups 1, 5, 5 and 11 both add up to 11.' },
      { input: 'nums = [1,2,3,5]', output: 'false', explanation: 'The total is 11, which is odd, so two equal whole-number sums are impossible.' },
    ],
    constraints: '1 <= nums.length <= 200 · 1 <= nums[i] <= 100',
    fn: 'canPartition',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// canPartition(nums) -> true if nums splits into two groups with equal sums
function canPartition(nums) {
  // TODO: turn the split question into reaching exactly half of the total
}`,
    hints: [
      'If the two groups have equal sums, what must each group add up to compared with the total of the whole list?',
      'When the total is even, track which sums can be built from the numbers seen so far. The answer is true exactly when half the total is reachable.',
    ],
    explanation: 'Equal groups mean each group sums to half of the overall total, so the total must be even and the question becomes whether some subcollection of the numbers adds up to exactly that half. We track reachable sums with a boolean table: zero is always reachable, and each number can either be left out or added to a previously reachable sum to reach a new one. Updating the table backwards for each number ensures every number is used at most once. If the half target is marked reachable at the end, the remaining numbers automatically form the other group with the same sum.',
    complexity: 'Time O(n * sum) · Space O(sum)',
    solutionCode: `function canPartition(nums) {
  const total = nums.reduce((s, x) => s + x, 0);
  if (total % 2 !== 0) return false;
  const target = total / 2;
  const dp = Array(target + 1).fill(false);
  dp[0] = true;
  for (const x of nums) {
    for (let s = target; s >= x; s--) {
      if (dp[s - x]) dp[s] = true;
    }
  }
  return dp[target];
}`,
    visibleTests: [
      { args: [[1, 5, 11, 5]], expected: true },
      { args: [[1, 2, 3, 5]], expected: false },
    ],
    hiddenTests: [
      { args: [[1, 1, 2, 2]], expected: true },
      { args: [[2, 2, 3, 5]], expected: false },
      { args: [[3, 3, 3, 4, 5]], expected: true },
      { args: [[2]], expected: false },
    ],
  },
  {
    id: 'edit-distance',
    topic: 'dp',
    title: 'Edit Distance',
    difficulty: 'Medium',
    statement: 'Given two words, find the smallest number of single-character operations needed to turn the first word into the second. One operation can insert a character, delete a character, or replace one character with another, and each operation costs 1. Return that smallest count.',
    examples: [
      { input: 'word1 = "horse", word2 = "ros"', output: '3', explanation: 'Replace h with r, delete r, then delete e: three operations turn horse into ros.' },
      { input: 'word1 = "intention", word2 = "execution"', output: '5', explanation: 'Five well-chosen inserts, deletes and replacements are enough, and no shorter sequence works.' },
    ],
    constraints: '0 <= word1.length, word2.length <= 500 · both words contain lowercase English letters',
    fn: 'minDistance',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// minDistance(word1, word2) -> fewest insert/delete/replace operations turning word1 into word2
function minDistance(word1, word2) {
  // TODO: compare prefixes of both words and build up the cheapest cost for each pair
}`,
    hints: [
      'Think about the cost of turning a prefix of the first word into a prefix of the second. What are your options for the final character of each prefix?',
      'For prefixes ending in the same character the cost is inherited from the shorter prefixes. Otherwise take the cheapest of insert, delete or replace, each applied to a smaller prefix problem, plus 1.',
    ],
    explanation: 'We fill a table where the entry for a pair of prefixes stores the cheapest cost of converting one prefix into the other. Turning an empty prefix into a prefix of the second word costs one insert per character, and the reverse costs one delete per character, which seeds the first row and column. For two prefixes whose last characters match, no operation is needed for those characters and the cost comes from the prefixes without them. When the last characters differ, we consider deleting from the first word, inserting into it, or replacing the character, each costing one plus the cost of the matching smaller prefix pair, and keep the cheapest. The bottom-right entry answers the full words.',
    complexity: 'Time O(m * n) · Space O(m * n)',
    solutionCode: `function minDistance(word1, word2) {
  const m = word1.length;
  const n = word2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (word1[i - 1] === word2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}`,
    visibleTests: [
      { args: ['horse', 'ros'], expected: 3 },
      { args: ['intention', 'execution'], expected: 5 },
    ],
    hiddenTests: [
      { args: ['', ''], expected: 0 },
      { args: ['a', ''], expected: 1 },
      { args: ['', 'abc'], expected: 3 },
      { args: ['kitten', 'sitting'], expected: 3 },
    ],
  },
  {
    id: 'coin-change-ii',
    topic: 'dp',
    title: 'Coin Change II',
    difficulty: 'Medium',
    statement: 'You are given an amount and a list of coin denominations, with unlimited coins of each kind. Count how many different combinations of coins add up exactly to the amount. Swapping the order of the same coins does not create a new combination. An amount of zero counts as one combination, namely using no coins at all.',
    examples: [
      { input: 'amount = 5, coins = [1,2,5]', output: '4', explanation: 'The combinations are 5, 2+2+1, 2+1+1+1 and 1+1+1+1+1.' },
      { input: 'amount = 3, coins = [2]', output: '0', explanation: 'Coins of 2 alone can never add up to 3.' },
    ],
    constraints: '0 <= amount <= 5000 · 1 <= coins.length <= 300 · 1 <= coins[i] <= 5000 · all denominations are distinct',
    fn: 'change',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// change(amount, coins) -> number of coin combinations (order does not matter) summing to amount
function change(amount, coins) {
  // TODO: count combinations coin by coin so the same set in another order is not double-counted
}`,
    hints: [
      'Counting arrangements coin position by coin position would treat 1+2 and 2+1 as different. How can you force one fixed order of consideration?',
      'Keep a table of ways for each amount. For each coin in turn, add its contributions to every amount it can extend. Amount zero starts with one way.',
    ],
    explanation: 'We keep a table where each entry counts the combinations that form that amount using the coins processed so far. Zero amount starts at one, representing the empty selection. Processing one coin at a time, we extend every already counted combination by adding that coin, sweeping amounts upward so the same coin may be reused within its own round. Because coins are introduced in a fixed outer order, a combination is only ever assembled by taking coins in that order, so rearrangements are never double-counted. After the last coin, the entry for the target amount holds the total number of combinations.',
    complexity: 'Time O(amount * coins) · Space O(amount)',
    solutionCode: `function change(amount, coins) {
  const dp = Array(amount + 1).fill(0);
  dp[0] = 1;
  for (const coin of coins) {
    for (let x = coin; x <= amount; x++) {
      dp[x] += dp[x - coin];
    }
  }
  return dp[amount];
}`,
    visibleTests: [
      { args: [5, [1, 2, 5]], expected: 4 },
      { args: [3, [2]], expected: 0 },
    ],
    hiddenTests: [
      { args: [0, [1, 2]], expected: 1 },
      { args: [10, [2, 5, 3, 6]], expected: 5 },
      { args: [4, [1, 2, 3]], expected: 4 },
      { args: [1, [1, 2]], expected: 1 },
    ],
  },
  {
    id: 'target-sum',
    topic: 'dp',
    title: 'Target Sum',
    difficulty: 'Medium',
    statement: 'You are given a list of numbers and a target. Every number must be given either a plus sign or a minus sign, and the signed numbers are then added together. Count how many assignments of signs make the total exactly equal to the target and return that count.',
    examples: [
      { input: 'nums = [1,1,1,1,1], target = 3', output: '5', explanation: 'Five different choices of which single number carries the minus sign each give a total of 3.' },
      { input: 'nums = [1], target = 1', output: '1', explanation: 'The only number must take a plus sign, which is one valid assignment.' },
    ],
    constraints: '1 <= nums.length <= 20 · 0 <= nums[i] <= 1000 · -1000 <= target <= 1000',
    fn: 'findTargetSumWays',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// findTargetSumWays(nums, target) -> number of + and - assignments whose total equals target
function findTargetSumWays(nums, target) {
  // TODO: track how many assignments produce each running total as you decide each sign
}`,
    hints: [
      'After deciding signs for some numbers, many assignments share the same running total. What information is worth keeping for each total?',
      'Keep a map from running total to the number of assignments that reach it. Each new number branches every total into a plus version and a minus version.',
    ],
    explanation: 'We process the numbers one at a time and maintain, for every running total that can occur, how many sign assignments produce it. Initially only the total zero exists with one assignment. For each new number, every existing total splits into two: one where the number is added and one where it is subtracted, and counts for totals that coincide are added together. Numbers equal to zero simply double the counts, which the map handles naturally. After the last number, the count stored at the target is the number of valid assignments.',
    complexity: 'Time O(n * sum) · Space O(sum)',
    solutionCode: `function findTargetSumWays(nums, target) {
  let dp = new Map();
  dp.set(0, 1);
  for (const x of nums) {
    const next = new Map();
    for (const entry of dp) {
      const sum = entry[0];
      const ways = entry[1];
      next.set(sum + x, (next.get(sum + x) || 0) + ways);
      next.set(sum - x, (next.get(sum - x) || 0) + ways);
    }
    dp = next;
  }
  return dp.get(target) || 0;
}`,
    visibleTests: [
      { args: [[1, 1, 1, 1, 1], 3], expected: 5 },
      { args: [[1], 1], expected: 1 },
    ],
    hiddenTests: [
      { args: [[1], 2], expected: 0 },
      { args: [[1, 2, 1], 0], expected: 2 },
      { args: [[0, 0, 0], 0], expected: 8 },
      { args: [[2, 1], 1], expected: 1 },
    ],
  },
  // ---------------------------------------------------------------- Heap
  {
    id: 'last-stone-weight',
    topic: 'heap',
    title: 'Last Stone Weight',
    difficulty: 'Easy',
    statement: 'You have a pile of stones with given weights. Again and again, take the two heaviest stones and smash them together. If they weigh the same, both are destroyed. If one is heavier, it survives with its weight reduced by the lighter stone weight, and the lighter stone is destroyed. Keep smashing until at most one stone remains, then return the weight of the last stone, or 0 when nothing is left.',
    examples: [
      { input: 'stones = [2,7,4,1,8,1]', output: '1', explanation: 'Repeatedly smashing the two heaviest stones grinds the pile down until a single stone of weight 1 remains.' },
      { input: 'stones = [1]', output: '1', explanation: 'With only one stone there is nothing to smash, so its weight is the answer.' },
    ],
    constraints: '0 <= stones.length <= 30 · 1 <= stones[i] <= 1000',
    fn: 'lastStoneWeight',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// lastStoneWeight(stones) -> weight of the final stone, or 0 if none remain
function lastStoneWeight(stones) {
  // TODO: you always need the two heaviest stones; keep them easy to reach
}`,
    hints: [
      'Every round needs the two largest weights right away, and survivors go back into the pile. Which structure hands you the maximum in a snap?',
      'Use a max-heap. Repeatedly pull the two largest stones, and when they differ push the difference back in, until one or no stones remain.',
    ],
    explanation: 'A max-heap always exposes the heaviest stone at the top, which is exactly what each smash needs. We load all stones into the heap, then repeatedly extract the two largest values. Equal values cancel out and nothing returns to the heap, while unequal values put a single survivor back with the difference of the two weights. Because every extraction and insertion costs logarithmic time, the whole process stays fast, and when the loop ends the heap holds either the final stone weight or nothing, which we report as 0.',
    complexity: 'Time O(n log n) · Space O(n)',
    solutionCode: `function lastStoneWeight(stones) {
  const heap = [];
  function push(v) {
    heap.push(v);
    let i = heap.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (heap[p] >= heap[i]) break;
      const t = heap[p];
      heap[p] = heap[i];
      heap[i] = t;
      i = p;
    }
  }
  function pop() {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      while (true) {
        let l = 2 * i + 1;
        let r = 2 * i + 2;
        let largest = i;
        if (l < heap.length && heap[l] > heap[largest]) largest = l;
        if (r < heap.length && heap[r] > heap[largest]) largest = r;
        if (largest === i) break;
        const t = heap[i];
        heap[i] = heap[largest];
        heap[largest] = t;
        i = largest;
      }
    }
    return top;
  }
  for (const s of stones) push(s);
  while (heap.length > 1) {
    const y = pop();
    const x = pop();
    if (y !== x) push(y - x);
  }
  return heap.length ? heap[0] : 0;
}`,
    visibleTests: [
      { args: [[2, 7, 4, 1, 8, 1]], expected: 1 },
      { args: [[1]], expected: 1 },
    ],
    hiddenTests: [
      { args: [[]], expected: 0 },
      { args: [[3, 7, 2]], expected: 2 },
      { args: [[5, 5]], expected: 0 },
      { args: [[9, 3, 2, 10]], expected: 0 },
    ],
  },
  {
    id: 'task-scheduler',
    topic: 'heap',
    title: 'Task Scheduler',
    difficulty: 'Medium',
    statement: 'You are given a list of tasks, each named by a single letter, and a cooling number n. The processor handles one task per interval and must wait n intervals before running another task with the same letter again, although other tasks or idle intervals may fill the gap. Return the smallest number of intervals needed to finish every task, counting any idle intervals you are forced to include.',
    examples: [
      { input: 'tasks = ["A","A","A","B","B","B"], n = 2', output: '8', explanation: 'One best schedule is A, B, idle, A, B, idle, A, B, which takes 8 intervals.' },
      { input: 'tasks = ["A","A","A","B","B","B"], n = 0', output: '6', explanation: 'With no cooling wait, the six tasks run back to back in 6 intervals.' },
    ],
    constraints: '1 <= tasks.length <= 10^4 · each task is a single uppercase letter · 0 <= n <= 100',
    fn: 'leastInterval',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// leastInterval(tasks, n) -> fewest intervals (including idle) to run all tasks with cooling n
function leastInterval(tasks, n) {
  // TODO: the most frequent task dictates the schedule; work out the gaps it creates
}`,
    hints: [
      'Focus on the letter that appears most often. How many forced gaps does it create, and what can fill them?',
      'If the highest frequency is f, it forms f - 1 blocks of size n + 1 plus a final partial block. Compare that length with simply running all tasks.',
    ],
    explanation: 'The most frequent letter drives the schedule because its copies must be spread furthest apart. If it appears f times, the first f - 1 copies each open a block of n + 1 intervals: the task itself plus n slots that other tasks or idle time must fill. Any other letter that also appears f times contributes one task to the final partial block. So the schedule needs at least (f - 1) * (n + 1) plus the number of most-frequent letters intervals. When there are enough other tasks to fill every gap, no idle time is needed and the answer is just the total task count, so we take the larger of the two values.',
    complexity: 'Time O(n) · Space O(1)',
    solutionCode: `function leastInterval(tasks, n) {
  if (!tasks || tasks.length === 0) return 0;
  const counts = new Map();
  for (const t of tasks) counts.set(t, (counts.get(t) || 0) + 1);
  let maxFreq = 0;
  for (const v of counts.values()) maxFreq = Math.max(maxFreq, v);
  let maxCount = 0;
  for (const v of counts.values()) if (v === maxFreq) maxCount++;
  const slots = (maxFreq - 1) * (n + 1) + maxCount;
  return Math.max(slots, tasks.length);
}`,
    visibleTests: [
      { args: [['A', 'A', 'A', 'B', 'B', 'B'], 2], expected: 8 },
      { args: [['A', 'A', 'A', 'B', 'B', 'B'], 0], expected: 6 },
    ],
    hiddenTests: [
      { args: [['A', 'A', 'A', 'A'], 2], expected: 10 },
      { args: [['A', 'B', 'C'], 2], expected: 3 },
      { args: [['A', 'A', 'B', 'B'], 2], expected: 5 },
      { args: [[], 2], expected: 0 },
    ],
  },
  {
    id: 'k-closest-points',
    topic: 'heap',
    title: 'K Closest Points to Origin',
    difficulty: 'Medium',
    statement: 'You are given points on a plane, each as [x, y], and a number k. Return the k points closest to the origin [0, 0], where closeness is measured by straight-line distance. The result must be ordered by distance ascending, and when two points are equally far away the one with the smaller x comes first, with smaller y breaking any remaining tie, so the expected answer is unique.',
    examples: [
      { input: 'points = [[1,3],[-2,2]], k = 1', output: '[[-2, 2]]', explanation: 'The point [-2, 2] is at distance about 2.83 while [1, 3] is about 3.16, so [-2, 2] is the single closest.' },
      { input: 'points = [[3,3],[5,-1],[-2,4]], k = 2', output: '[[3, 3], [-2, 4]]', explanation: 'Distances grow from [3, 3] to [-2, 4] to [5, -1], so the first two in that order are returned.' },
    ],
    constraints: '1 <= k <= points.length <= 10^4 · -10^4 <= x, y <= 10^4',
    fn: 'kClosest',
    kind: 'plain',
    normalize: 'none',
    starterCode: `// kClosest(points, k) -> k closest points ordered by distance, then smaller x, then smaller y
function kClosest(points, k) {
  // TODO: keep only the k best points seen so far and order them at the end
}`,
    hints: [
      'Keeping every point sorted wastes effort. Can you hold just k candidates and quickly drop the worst of them?',
      'Keep a max-heap of size k ordered by distance, then x, then y, where the worst candidate sits on top. Replace it whenever a better point arrives, then sort the survivors ascending.',
    ],
    explanation: 'We keep only the k best points found so far inside a max-heap whose top is the worst survivor, judged first by distance and then by larger x and larger y so ties evict the correct point. Each new point enters the heap, and whenever the heap grows beyond k we remove its top, which is always the least deserving candidate. Comparing squared distances avoids square roots while preserving the order. After all points are processed, the heap holds exactly the k closest points, and a final ascending sort by distance, then x, then y produces the required order.',
    complexity: 'Time O(n log k) · Space O(k)',
    solutionCode: `function kClosest(points, k) {
  function cmp(a, b) {
    const da = a[0] * a[0] + a[1] * a[1];
    const db = b[0] * b[0] + b[1] * b[1];
    if (da !== db) return da - db;
    if (a[0] !== b[0]) return a[0] - b[0];
    return a[1] - b[1];
  }
  const heap = [];
  function push(p) {
    heap.push(p);
    let i = heap.length - 1;
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (cmp(heap[i], heap[parent]) <= 0) break;
      const t = heap[i];
      heap[i] = heap[parent];
      heap[parent] = t;
      i = parent;
    }
  }
  function pop() {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      while (true) {
        let left = 2 * i + 1;
        let right = 2 * i + 2;
        let worst = i;
        if (left < heap.length && cmp(heap[left], heap[worst]) > 0) worst = left;
        if (right < heap.length && cmp(heap[right], heap[worst]) > 0) worst = right;
        if (worst === i) break;
        const t = heap[i];
        heap[i] = heap[worst];
        heap[worst] = t;
        i = worst;
      }
    }
    return top;
  }
  for (const p of points) {
    push(p);
    if (heap.length > k) pop();
  }
  return heap.slice().sort(cmp);
}`,
    visibleTests: [
      { args: [[[1, 3], [-2, 2]], 1], expected: [[-2, 2]] },
      { args: [[[3, 3], [5, -1], [-2, 4]], 2], expected: [[3, 3], [-2, 4]] },
    ],
    hiddenTests: [
      { args: [[[1, 1], [-1, -1], [1, -1], [-1, 1]], 2], expected: [[-1, -1], [-1, 1]] },
      { args: [[[0, 0], [1, 1], [2, 2]], 2], expected: [[0, 0], [1, 1]] },
      { args: [[[1, 0], [0, 1], [2, 0]], 2], expected: [[0, 1], [1, 0]] },
      { args: [[[5, 5]], 1], expected: [[5, 5]] },
    ],
  },
];

export default PROBLEMS_EXTRA2;
