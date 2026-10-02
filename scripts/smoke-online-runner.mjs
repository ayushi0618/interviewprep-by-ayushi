// smoke-online-runner.mjs — node smoke test for client/src/lib/onlineRunner.js.
//
//   node scripts/smoke-online-runner.mjs           request-shape checks only
//   node scripts/smoke-online-runner.mjs --live    + real runs of every
//                                                  language's starter
//                                                  snippet on the public
//                                                  runner (needs internet)
import { ONLINE_LANGUAGES, buildRequest, executeOnline, onlineErrorMessage } from '../client/src/lib/onlineRunner.js';

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? '✓' : '✗'} ${name}${extra ? ` — ${extra}` : ''}`);
  if (!cond) failures += 1;
};

for (const lang of ONLINE_LANGUAGES) {
  const r = buildRequest(lang, 'SOURCE', 'INPUT');
  check(`${lang.id}: request compiler`, r.compiler === lang.compiler);
  check(`${lang.id}: request code/stdin`, r.code === 'SOURCE' && r.stdin === 'INPUT' && r.save === false);
  check(`${lang.id}: starter template non-empty`, lang.snippets.length >= 1 && lang.snippets[0].code.length > 40);
}
check('error messages are friendly', onlineErrorMessage(new Error('rate-limit')).includes('rate limit'));

if (process.argv.includes('--live')) {
  const EXPECT = { python: '[0, 1]', java: '[0, 1]', cpp: '0 1', c: 'Answer: 6', typescript: '[ 0, 1 ]', go: '[0 1]', rust: '[0, 1]' };
  for (const lang of ONLINE_LANGUAGES) {
    try {
      const r = await executeOnline(lang, lang.snippets[0].code, '', { timeoutMs: 60000 });
      check(`live ${lang.id}`, r.code === 0 && r.stdout.includes(EXPECT[lang.id]),
        `exit=${r.code} stdout=${JSON.stringify(r.stdout.slice(0, 60))} err=${JSON.stringify((r.stderr || r.compileOutput || '').slice(0, 90))}`);
    } catch (e) {
      check(`live ${lang.id}`, false, `threw ${e.message}`);
    }
  }
  // stdin actually reaches the program (python greeter snippet)
  const py = ONLINE_LANGUAGES[0];
  try {
    const r = await executeOnline(py, py.snippets[1].code, 'Ayushi\n21', { timeoutMs: 60000 });
    check('live python stdin', r.code === 0 && r.stdout.includes('turn 22'), JSON.stringify(r.stdout.slice(0, 60)));
  } catch (e) {
    check('live python stdin', false, `threw ${e.message}`);
  }
}

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
