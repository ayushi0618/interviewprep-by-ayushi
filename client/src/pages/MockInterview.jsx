import { useState } from 'react';
import PracticeMode from '../components/PracticeMode';
import LiveInterview from '../components/LiveInterview';

// The mock-interview hub: flash-card Practice mode, and the Live AI
// interview room (camera/mic, spoken questions, scored report).
export default function MockInterview({ practiceTopic, liveTopic, onReadTopic }) {
  const [tab, setTab] = useState(practiceTopic ? 'practice' : 'live');

  const tabCls = (active) =>
    `flex-1 py-3 rounded-xl font-bold text-sm md:text-base transition shadow-card ${
      active ? 'bg-brand-600 text-white' : 'bg-white text-brand-800 border border-brand-200 hover:bg-brand-50'
    }`;

  return (
    <div>
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <h1 className="text-3xl font-extrabold text-brand-900">Mock Interview 🎤</h1>
        <p className="text-slate-600 mt-1">Two ways to rehearse: quick-fire flashcards, or a full live interview on camera.</p>
        <div className="flex gap-2 mt-5">
          <button className={tabCls(tab === 'live')} onClick={() => setTab('live')}>🎥 Live AI Interview</button>
          <button className={tabCls(tab === 'practice')} onClick={() => setTab('practice')}>🎴 Practice Mode</button>
        </div>
      </div>
      {tab === 'live'
        ? <LiveInterview initialTopic={liveTopic || practiceTopic} onReadTopic={onReadTopic} />
        : <PracticeMode initialTopic={practiceTopic} onReadTopic={onReadTopic} />}
    </div>
  );
}
