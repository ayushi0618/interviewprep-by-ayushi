// verify-sheet.mjs — proves every reference solution in the DSA Sheet
// passes every authored test using the exact judge semantics the browser
// uses (client/src/lib/judgeCore.js). Run from the repo root:
//   node scripts/verify-sheet.mjs
// Exits non-zero on any failure so it can gate deploys.
import { PROBLEMS, DSA_TOPICS } from '../client/src/data/dsaSheet.js';
import {
  computeGot,
  deepEqual,
  applyNormalize,
  deepClone,
  JUDGE_FRAME_SOURCE,
} from '../client/src/lib/judgeCore.js';

let totalTests = 0;
let passedTests = 0;
const failures = [];

function format(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// --- Prove JUDGE_FRAME_SOURCE parses and its computeGot behaves ----------
// judge.js embeds this exact string into the sandboxed iframe, so we
// evaluate the very same source here and run the computeGot path once.
try {
  const frame = new Function(
    `${JUDGE_FRAME_SOURCE}\n; return { computeGot, deepEqual, applyNormalize, deepClone };`,
  )();
  if (typeof frame.computeGot !== 'function') {
    throw new Error('frame computeGot is not a function');
  }
  const demoGot = frame.computeGot('plain', (a, b) => a + b, [2, 3]);
  if (demoGot !== 5) throw new Error(`frame plain demo expected 5, got ${format(demoGot)}`);
  const demoList = frame.computeGot(
    'linkedlist',
    (head) => head,
    [[7, 8, 9]],
  );
  if (!frame.deepEqual(demoList, [7, 8, 9])) {
    throw new Error(`frame linkedlist demo expected [7,8,9], got ${format(demoList)}`);
  }
  console.log('JUDGE_FRAME_SOURCE: parsed OK, computeGot path verified (plain + linkedlist).');
} catch (err) {
  failures.push(`JUDGE_FRAME_SOURCE failed to evaluate: ${err.message}`);
  console.error(`FAIL frame-source: ${err.message}`);
}

// --- Per-problem verification --------------------------------------------
for (const problem of PROBLEMS) {
  const { id, fn, kind, normalize, solutionCode, starterCode } = problem;
  const tests = [
    ...(problem.visibleTests || []).map((t, i) => ({ ...t, label: `visible[${i}]` })),
    ...(problem.hiddenTests || []).map((t, i) => ({ ...t, label: `hidden[${i}]` })),
  ];

  // Starter code must parse and define the learner-facing function.
  try {
    const starterFn = new Function(`${starterCode}\n; return ${fn};`)();
    if (typeof starterFn !== 'function') {
      failures.push(`${id}: starterCode does not define function ${fn}`);
      console.error(`FAIL ${id}: starterCode does not define function ${fn}`);
    }
  } catch (err) {
    failures.push(`${id}: starterCode syntax error: ${err.message}`);
    console.error(`FAIL ${id}: starterCode syntax error: ${err.message}`);
  }

  // Build the reference implementation exactly once per problem.
  let solutionFn;
  try {
    solutionFn = new Function(`${solutionCode}\n; return ${fn};`)();
    if (typeof solutionFn !== 'function') throw new Error(`did not produce a function`);
  } catch (err) {
    for (const t of tests) {
      totalTests++;
      failures.push(`${id} ${t.label}: solutionCode failed to build: ${err.message}`);
      console.error(`FAIL ${id} ${t.label}: solutionCode failed to build: ${err.message}`);
    }
    continue;
  }

  tests.forEach((test, idx) => {
    totalTests++;
    let got;
    try {
      got = computeGot(kind, solutionFn, test.args);
    } catch (err) {
      failures.push(`${id} test ${idx} (${test.label}): threw ${err.message} | expected ${format(test.expected)}`);
      console.error(`FAIL ${id} test ${idx} (${test.label}): threw ${err.message} | expected ${format(test.expected)}`);
      return;
    }
    const normalizedGot = applyNormalize(got, normalize);
    const normalizedExpected = applyNormalize(deepClone(test.expected), normalize);
    if (deepEqual(normalizedGot, normalizedExpected)) {
      passedTests++;
    } else {
      failures.push(
        `${id} test ${idx} (${test.label}): expected ${format(normalizedExpected)} vs got ${format(normalizedGot)}`,
      );
      console.error(
        `FAIL ${id} test ${idx} (${test.label}): expected ${format(normalizedExpected)} vs got ${format(normalizedGot)}`,
      );
    }
  });
}

// --- Per-topic problem counts --------------------------------------------
console.log('\nProblems per topic:');
const counts = new Map();
for (const p of PROBLEMS) counts.set(p.topic, (counts.get(p.topic) || 0) + 1);
for (const topic of DSA_TOPICS) {
  console.log(`  ${topic.id}: ${counts.get(topic.id) || 0}`);
  counts.delete(topic.id);
}
for (const [topicId, n] of counts) {
  console.log(`  ${topicId} (unknown topic): ${n}`);
  failures.push(`unknown topic id referenced by ${n} problem(s): ${topicId}`);
}

// --- Final tally -----------------------------------------------------------
console.log(`\n${passedTests}/${totalTests} tests passed across ${PROBLEMS.length} problems`);
if (failures.length > 0) {
  console.error(`\n${failures.length} failure(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('All DSA Sheet tests passed.');
