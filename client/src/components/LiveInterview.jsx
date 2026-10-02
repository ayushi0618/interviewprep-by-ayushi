import { useEffect, useMemo, useRef, useState } from 'react';
import { TOPICS } from '../content/topics';
import { speak, stopSpeaking, hasRecognition, createRecognizer } from '../lib/speech';
import { scoreAnswer, VERDICT_STYLES } from '../lib/scoring';

const SESSION_KEY = 'ip_live_sessions';
const TOTAL_MAINS = 5;
const SCRIPTED_FOLLOWUPS = [
  'Can you give me a concrete example of that?',
  'What happens if that breaks, or the input is not what you expected?',
  'How would you explain that to a teammate in one line?',
];

// Last-resort ladder used only if the /api/interview call itself fails
// (e.g. opening the built site without the Express server). Mirrors the
// scripted logic in server.js so the room always works.
function localNext({ topic, stage, mainIndex, followUpsOnCurrent }) {
  const bank = TOPICS.find((t) => t.slug === topic)?.questions || [];
  const item = bank[mainIndex];
  if (stage === 'start') {
    return { type: 'question', text: "Let's begin. Tell me about yourself — your background, your stack, and what you're preparing for.", scoreRef: null, nextState: { stage: 'intro', mainIndex: 0, followUpsOnCurrent: 0 }, aiUsed: false };
  }
  if (stage === 'intro') {
    return { type: 'question', text: item.question, scoreRef: item, nextState: { stage: 'main', mainIndex: 0, followUpsOnCurrent: 0 }, aiUsed: false };
  }
  if (followUpsOnCurrent < 2) {
    return { type: 'followup', text: SCRIPTED_FOLLOWUPS[(mainIndex + followUpsOnCurrent) % SCRIPTED_FOLLOWUPS.length], scoreRef: null, nextState: { stage, mainIndex, followUpsOnCurrent: followUpsOnCurrent + 1 }, aiUsed: false };
  }
  const nextIdx = mainIndex + 1;
  if (nextIdx >= Math.min(TOTAL_MAINS, bank.length)) {
    return { type: 'closing', text: "That brings us to the end. Thank you — that was a solid round. Your scorecard is ready.", done: true, scoreRef: null, nextState: { stage: 'done', mainIndex, followUpsOnCurrent: 0 }, aiUsed: false };
  }
  const next = bank[nextIdx];
  return { type: 'question', text: next.question, scoreRef: next, nextState: { stage: 'main', mainIndex: nextIdx, followUpsOnCurrent: 0 }, aiUsed: false };
}

async function askBrain(payload) {
  try {
    const res = await fetch('/api/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('bad status');
    return await res.json();
  } catch {
    return localNext(payload);
  }
}

function loadSessions() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)) || []; } catch { return []; }
}

export default function LiveInterview({ initialTopic, onReadTopic }) {
  const [phase, setPhase] = useState('setup'); // setup | live | done
  const [topicSel, setTopicSel] = useState(initialTopic || 'javascript');
  const [useCamera, setUseCamera] = useState(true);
  const [useMic, setUseMic] = useState(true);
  const [voiceOn, setVoiceOn] = useState(true);
  const [mediaMode, setMediaMode] = useState('av'); // av | audio | text
  const [mediaNote, setMediaNote] = useState('');
  const [entries, setEntries] = useState([]); // {from, text, scoreRef?}
  const [answer, setAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [aiUsed, setAiUsed] = useState(false);
  const [pastSessions] = useState(loadSessions);

  const stateRef = useRef({ stage: 'start', mainIndex: 0, followUpsOnCurrent: 0 });
  const streamRef = useRef(null);
  const recRef = useRef(null);
  const videoRef = useRef(null);
  const bottomRef = useRef(null);
  const startedAtRef = useRef(null);

  const sttAvailable = useMemo(() => hasRecognition(), []);
  const topic = TOPICS.find((t) => t.slug === topicSel);

  useEffect(() => { if (initialTopic) setTopicSel(initialTopic); }, [initialTopic]);

  // Elapsed timer while live
  useEffect(() => {
    if (phase !== 'live') return undefined;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // Keep the transcript scrolled to the latest message
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [entries, thinking]);

  useEffect(() => () => { stopSpeaking(); streamRef.current?.getTracks().forEach((t) => t.stop()); }, []);

  const attachStream = () => {
    if (videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  };

  async function start() {
    stopSpeaking();
    setEntries([]); setAnswer(''); setElapsed(0);
    stateRef.current = { stage: 'start', mainIndex: 0, followUpsOnCurrent: 0 };
    let mode = 'text';
    if (useCamera || useMic) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: useCamera, audio: useMic });
        streamRef.current = stream;
        mode = useCamera ? 'av' : 'audio';
      } catch {
        setMediaNote('Camera/mic permission was not granted — no problem, continuing in text + voice-answer mode. Nothing is recorded or uploaded either way.');
        mode = 'text';
      }
    }
    setMediaMode(mode);
    startedAtRef.current = Date.now();
    setPhase('live');
    setThinking(true);
    const res = await askBrain({ topic: topicSel, ...stateRef.current, lastAnswer: '', history: [] });
    stateRef.current = res.nextState;
    setAiUsed(!!res.aiUsed);
    setEntries([{ from: 'interviewer', text: res.text, scoreRef: res.scoreRef || null }]);
    setThinking(false);
    if (voiceOn) speak(res.text);
    setTimeout(attachStream, 60);
  }

  function toggleListening() {
    if (listening) {
      recRef.current?.rec.stop();
      setListening(false);
      return;
    }
    const r = createRecognizer({ onInterim: (text) => setAnswer(text) });
    if (!r) return;
    recRef.current = r;
    r.rec.onend = () => setListening(false);
    r.rec.onerror = () => setListening(false);
    try { r.rec.start(); setListening(true); } catch { /* already running */ }
  }

  async function submit() {
    const text = answer.trim();
    if (!text || thinking) return;
    if (listening) toggleListening();
    stopSpeaking();
    const newEntries = [...entries, { from: 'candidate', text }];
    setEntries(newEntries);
    setAnswer('');
    setThinking(true);
    const res = await askBrain({
      topic: topicSel,
      ...stateRef.current,
      lastAnswer: text,
      history: newEntries.map((e) => ({ from: e.from, text: e.text })),
    });
    stateRef.current = res.nextState;
    if (res.aiUsed) setAiUsed(true);
    const additions = [];
    if (res.feedback) additions.push({ from: 'feedback', text: res.feedback });
    additions.push({ from: 'interviewer', text: res.text, scoreRef: res.scoreRef || null });
    setEntries([...newEntries, ...additions]);
    setThinking(false);
    if (voiceOn && res.text) speak(res.text);
    if (res.done) finish([...newEntries, ...additions]);
  }

  // Pair each scored question with the candidate's next answer and grade it.
  function grade(transcript) {
    const rows = [];
    transcript.forEach((e, i) => {
      if (e.from === 'interviewer' && e.scoreRef) {
        const ans = transcript.slice(i + 1).find((x) => x.from === 'candidate');
        rows.push({ question: e.scoreRef.question, modelAnswer: e.scoreRef.answer, transcript: ans?.text || '', ...scoreAnswer(ans?.text || '', e.scoreRef) });
      }
    });
    return rows;
  }

  function finish(transcript) {
    stopSpeaking();
    const rows = grade(transcript);
    const known = rows.filter((r) => r.verdict === 'Knew it').length;
    const session = {
      date: new Date().toISOString(), topic: topicSel,
      score: rows.length ? Math.round((known / rows.length) * 100) : 0,
      rows: rows.map((r) => ({ question: r.question, verdict: r.verdict })),
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify([session, ...loadSessions()].slice(0, 10)));
    } catch { /* storage full/blocked — results still show on screen */ }
    setPhase('done');
  }

  const endEarly = () => finish(entries);
  const rows = phase === 'done' ? grade(entries) : [];
  const knownCount = rows.filter((r) => r.verdict === 'Knew it').length;
  const scorePct = rows.length ? Math.round((knownCount / rows.length) * 100) : 0;
  const mmss = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {phase === 'setup' && (
        <div className="bg-white rounded-2xl shadow-card border border-brand-100 p-6 md:p-8">
          <h2 className="text-2xl font-extrabold text-brand-900">🎥 Live AI Interview room</h2>
          <p className="text-slate-600 mt-2 leading-relaxed">
            A mock interview that feels real: the interviewer <strong>speaks each question aloud</strong>, you answer
            by voice or typing, it follows up on your answers, and you get a scored report at the end.
          </p>
          <div className="callout note mt-5">
            <div className="callout-title">🔒 Your privacy</div>
            <p>Your camera and mic are used only to show you a live preview and hear your answers.
              <strong> Nothing is recorded, uploaded, or stored</strong> — the preview never leaves your browser,
              and interview sessions save only a text summary on this device.</p>
          </div>

          <label className="block mt-6 text-sm font-bold text-slate-700">Interview topic</label>
          <select value={topicSel} onChange={(e) => setTopicSel(e.target.value)}
            className="mt-2 w-full rounded-xl border border-brand-200 px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-brand-400">
            {TOPICS.filter((t) => t.questions.length >= 5).map((t) => (
              <option key={t.slug} value={t.slug}>{t.emoji} {t.title} ({t.questions.length} questions)</option>
            ))}
          </select>

          <div className="grid sm:grid-cols-3 gap-3 mt-5">
            <label className="flex items-center gap-2.5 bg-[#fbfdfc] border border-brand-100 rounded-xl px-4 py-3 cursor-pointer">
              <input type="checkbox" checked={useCamera} onChange={(e) => setUseCamera(e.target.checked)} className="w-4 h-4 accent-brand-600" />
              <span className="text-sm font-semibold">📷 Camera preview</span>
            </label>
            <label className="flex items-center gap-2.5 bg-[#fbfdfc] border border-brand-100 rounded-xl px-4 py-3 cursor-pointer">
              <input type="checkbox" checked={useMic} onChange={(e) => setUseMic(e.target.checked)} className="w-4 h-4 accent-brand-600" />
              <span className="text-sm font-semibold">🎙️ Microphone</span>
            </label>
            <label className="flex items-center gap-2.5 bg-[#fbfdfc] border border-brand-100 rounded-xl px-4 py-3 cursor-pointer">
              <input type="checkbox" checked={voiceOn} onChange={(e) => setVoiceOn(e.target.checked)} className="w-4 h-4 accent-brand-600" />
              <span className="text-sm font-semibold">🔊 Interviewer voice</span>
            </label>
          </div>
          {!sttAvailable && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-4">
              This browser doesn’t support voice answers (SpeechRecognition) — Chrome or Edge work best.
              You can still type every answer; the interview runs exactly the same.
            </p>
          )}
          {mediaNote && <p className="text-sm text-slate-600 mt-3">{mediaNote}</p>}

          <button onClick={start} className="mt-6 w-full bg-brand-600 hover:bg-brand-500 text-white font-bold py-3.5 rounded-xl shadow-card transition">
            Start interview — {topic?.title}
          </button>
          <p className="text-xs text-slate-400 mt-3 text-center">
            Flow: intro → {TOTAL_MAINS} technical questions with follow-ups → scored report.
            With a Gemini API key the interviewer improvises; without one it runs a built-in question ladder — either way it fully works.
          </p>

          {pastSessions.length > 0 && (
            <div className="mt-7">
              <h3 className="font-bold text-slate-800">Past live sessions</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {pastSessions.slice(0, 4).map((s, i) => (
                  <li key={i} className="flex justify-between bg-[#fbfdfc] border border-brand-100 rounded-lg px-3 py-2">
                    <span>{TOPICS.find((t) => t.slug === s.topic)?.title || s.topic} · {new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <strong className="text-brand-700">{s.score}%</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {phase === 'live' && (
        <div className="grid lg:grid-cols-[300px_1fr] gap-4 items-start">
          {/* Self view + status */}
          <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-card lg:sticky lg:top-24">
            {mediaMode === 'av' ? (
              <video ref={videoRef} autoPlay muted playsInline className="w-full aspect-[4/3] object-cover bg-slate-800" />
            ) : (
              <div className="w-full aspect-[4/3] grid place-items-center text-slate-300 text-sm px-4 text-center">
                {mediaMode === 'audio' ? '🎙️ Audio-only mode — mic is live, no camera preview.' : '⌨️ Text mode — type your answers below.'}
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3 text-white">
              <span className="font-mono font-bold">⏱ {mmss}</span>
              <span className="text-xs bg-white/15 px-2 py-1 rounded-md font-semibold">{aiUsed ? '🤖 AI interviewer (Gemini)' : '🎚️ Scripted interviewer'}</span>
            </div>
            {mediaMode === 'av' && <p className="px-4 pb-3 text-[0.7rem] text-slate-400 -mt-1">Preview only — nothing is recorded or uploaded.</p>}
          </div>

          {/* Conversation */}
          <div className="bg-white rounded-2xl shadow-card border border-brand-100 flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-brand-100 flex items-center justify-between">
              <p className="font-extrabold text-brand-900">🎤 {topic?.title} interview</p>
              <button onClick={endEarly} className="text-sm font-bold text-red-600 hover:text-red-500">End interview</button>
            </div>

            <div className="px-5 py-4 space-y-3 overflow-y-auto nice-scroll max-h-[46vh]">
              {entries.map((e, i) => (
                <div key={i} className={`flex ${e.from === 'candidate' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-[0.95rem] leading-relaxed shadow-sm ${
                    e.from === 'candidate' ? 'bg-brand-600 text-white rounded-br-md'
                    : e.from === 'feedback' ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-bl-md'
                    : 'bg-[#f2f7f4] border border-brand-100 text-slate-800 rounded-bl-md'}`}>
                    <p className={`text-[0.65rem] font-extrabold tracking-widest mb-1 ${e.from === 'candidate' ? 'text-brand-100' : 'text-brand-500'}`}>
                      {e.from === 'candidate' ? 'YOU' : e.from === 'feedback' ? 'QUICK FEEDBACK' : 'INTERVIEWER'}
                    </p>
                    {e.text}
                  </div>
                </div>
              ))}
              {thinking && <p className="text-sm text-slate-400 italic">Interviewer is thinking…</p>}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-brand-100 p-4 bg-[#fbfdfc]">
              <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3}
                placeholder={sttAvailable ? 'Speak with the mic button, or type your answer here…' : 'Type your answer here…'}
                className="w-full rounded-xl border border-brand-200 px-4 py-3 text-[0.95rem] outline-none focus:ring-2 focus:ring-brand-400 resize-none" />
              <div className="flex gap-2 mt-3">
                {sttAvailable && (
                  <button onClick={toggleListening}
                    className={`px-4 py-2.5 rounded-xl font-bold text-sm shadow-card transition ${listening ? 'bg-red-500 text-white animate-pulse' : 'bg-white border border-brand-200 text-brand-800'}`}>
                    {listening ? '⏹ Stop mic' : '🎙️ Answer by voice'}
                  </button>
                )}
                <button onClick={submit} disabled={!answer.trim() || thinking}
                  className="flex-1 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl shadow-card transition">
                  Submit answer →
                </button>
                <button onClick={() => setVoiceOn((v) => { if (v) stopSpeaking(); return !v; })}
                  className="px-3 py-2.5 rounded-xl bg-white border border-brand-200 text-sm" title="Toggle interviewer voice">
                  {voiceOn ? '🔊' : '🔇'}
                </button>
              </div>
              {listening && <p className="text-xs text-red-500 font-semibold mt-2">Listening… speak now, your words appear above.</p>}
            </div>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="bg-white rounded-2xl shadow-card border border-brand-100 p-6 md:p-8">
          <h2 className="text-2xl font-extrabold text-brand-900">Interview report 📋</h2>
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="bg-brand-700 text-white rounded-2xl px-6 py-4">
              <p className="text-3xl font-extrabold">{scorePct}%</p>
              <p className="text-brand-100 text-xs font-bold">questions nailed</p>
            </div>
            <p className="text-slate-600 text-sm max-w-md leading-relaxed">
              {scorePct >= 70 ? 'Strong round — keep this level and polish the shaky ones.'
                : scorePct >= 40 ? 'A workable base. The report below shows exactly what to revise.'
                : 'Every expert started here — revise the topics below and run it again tomorrow.'}
            </p>
          </div>

          <div className="space-y-3 mt-6">
            {rows.map((r, i) => (
              <div key={i} className="border border-brand-100 rounded-xl overflow-hidden">
                <div className="flex flex-wrap items-center gap-2 px-4 py-3 bg-[#fbfdfc]">
                  <span className="font-bold text-slate-800 text-sm flex-1">{i + 1}. {r.question}</span>
                  <span className={`px-2.5 py-1 rounded-lg border text-xs font-extrabold ${VERDICT_STYLES[r.verdict]}`}>{r.verdict}</span>
                </div>
                <div className="px-4 py-3 text-sm space-y-2">
                  <p className="text-slate-600"><strong className="text-slate-800">You said:</strong> {r.transcript || <em>(no answer)</em>}</p>
                  {r.missedKeywords.length > 0 && (
                    <p className="text-slate-500">Try adding next time: {r.missedKeywords.slice(0, 5).map((k) => <code key={k} className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded mx-0.5 font-mono text-[0.8em]">{k}</code>)}</p>
                  )}
                  <details>
                    <summary className="cursor-pointer font-semibold text-brand-700 text-[0.85rem]">Model answer</summary>
                    <p className="mt-1.5 text-slate-700 leading-relaxed">{r.modelAnswer}</p>
                  </details>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-7">
            <button onClick={() => onReadTopic(topicSel)} className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-5 py-3 rounded-xl shadow-card">
              📖 Revise {topic?.title} notes
            </button>
            <button onClick={() => setPhase('setup')} className="bg-white border border-brand-200 font-bold px-5 py-3 rounded-xl text-brand-800">
              ↻ New interview
            </button>
          </div>

          <details className="mt-6">
            <summary className="cursor-pointer font-semibold text-slate-600 text-sm">Full transcript</summary>
            <div className="mt-3 space-y-2 text-sm">
              {entries.filter((e) => e.from !== 'feedback').map((e, i) => (
                <p key={i}><strong>{e.from === 'candidate' ? 'You' : 'Interviewer'}:</strong> {e.text}</p>
              ))}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
