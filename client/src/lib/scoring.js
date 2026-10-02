// Simple, explainable rubric shared by Practice mode and the Live room.
// An answer scores on two things a fresher can actually control:
//   length  — did you say enough to judge (interviews punish one-liners), and
//   coverage — did you hit the ideas the model answer contains (keywords).
export function scoreAnswer(transcript, item) {
  const text = (transcript || '').trim();
  const words = text ? text.split(/\s+/).length : 0;
  const keywords = item?.keywords || [];
  const lower = ` ${text.toLowerCase()} `;
  const hit = keywords.filter((k) => lower.includes(k.toLowerCase()));
  const missed = keywords.filter((k) => !hit.includes(k));
  const coverage = keywords.length ? hit.length / keywords.length : 0;

  let verdict;
  if (coverage >= 0.5 && words >= 18) verdict = 'Knew it';
  else if (coverage >= 0.25 || words >= 25) verdict = 'Shaky';
  else verdict = 'Missed';
  if (words < 8) verdict = 'Missed'; // silence or near-silence can't pass

  return { verdict, words, coverage, hitKeywords: hit, missedKeywords: missed };
}

export const VERDICT_STYLES = {
  'Knew it': 'bg-brand-100 text-brand-800 border-brand-300',
  Shaky: 'bg-amber-100 text-amber-800 border-amber-300',
  Missed: 'bg-red-100 text-red-700 border-red-300',
};

// Live Interview grading: a friendlier band (Strong / Good / Needs work)
// over the same two signals — keyword coverage against the model answer,
// and whether the answer was long enough to judge. Returns everything the
// report card renders: band, 0–100 score, hit/missed keywords, word count.
export function scoreInterviewAnswer(transcript, item, { skipped = false, hintUsed = false } = {}) {
  const { words, coverage, hitKeywords, missedKeywords } = scoreAnswer(transcript, item);
  const score = skipped ? 0 : Math.round(coverage * 70 + Math.min(words / 40, 1) * 30);
  let band;
  if (skipped || words < 8) band = 'Needs work';
  else if (score >= 65 && words >= 12) band = 'Strong';
  else if (score >= 38) band = 'Good';
  else band = 'Needs work';
  return { band, score, words, coverage, hitKeywords, missedKeywords, hintUsed, skipped };
}

export const BAND_STYLES = {
  Strong: 'bg-brand-100 text-brand-800 border-brand-300',
  Good: 'bg-amber-100 text-amber-800 border-amber-300',
  'Needs work': 'bg-red-100 text-red-700 border-red-300',
};
