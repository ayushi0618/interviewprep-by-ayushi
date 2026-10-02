// Browser speech helpers for the Live Interview room.
// TTS: speechSynthesis (interviewer voice). STT: SpeechRecognition where the
// browser offers it (Chrome/Edge). Everything degrades gracefully — callers
// always keep a text box available.

export function pickVoice() {
  const voices = window.speechSynthesis?.getVoices() || [];
  return (
    voices.find((v) => v.lang === 'en-IN') ||
    voices.find((v) => v.lang?.startsWith('en') && /female|zira|aria|samantha/i.test(v.name)) ||
    voices.find((v) => v.lang?.startsWith('en')) ||
    voices[0] ||
    null
  );
}

export function speak(text, { rate = 1.02 } = {}) {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window) || !text) return resolve();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*_`#>]/g, ''));
    const v = pickVoice();
    if (v) u.voice = v;
    u.rate = rate;
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };
    u.onend = finish;
    u.onerror = finish;
    setTimeout(finish, Math.max(4000, text.length * 110)); // never hang on a silent synth
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
}

export const hasRecognition = () =>
  typeof window !== 'undefined' && !!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

// Creates a single-answer recognizer: streams interim text to onInterim,
// resolves final text (or null if nothing usable was heard).
export function createRecognizer({ onInterim } = {}) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = 'en-IN';
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let finalText = '';
  rec.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i += 1) {
      const chunk = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += chunk;
      else interim += chunk;
    }
    onInterim?.(finalText + interim);
  };
  return { rec, getFinal: () => finalText.trim() };
}
