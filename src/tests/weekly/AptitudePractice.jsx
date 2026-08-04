import { useEffect, useMemo, useState } from "react";
import { PLACEMENT_BUILDERS, PLACEMENT_LEVELS, PLACEMENT_LEVEL_COUNTS, auditPlacementBanks, createBalancedAnswerTargets } from "./PlacementQuestionBanks";

const LEVELS = PLACEMENT_LEVELS;

function gcd(a, b) { while (b) [a, b] = [b, a % b]; return Math.abs(a); }
function lcm(a, b) { return Math.abs(a * b) / gcd(a, b); }
function money(n) { return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`; }
function num(n) { return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2))); }
function pct(n) { return `${num(n)}%`; }

function choices(correct, values, format = num) {
  const seen = [];
  [correct, ...values].forEach(v => {
    const label = format(v);
    if (!seen.includes(label)) seen.push(label);
  });
  let bump = Math.max(1, Math.abs(Number(correct)) * 0.1);
  while (seen.length < 4) {
    const label = format(Number(correct) + bump * seen.length);
    if (!seen.includes(label)) seen.push(label);
    bump += 1;
  }
  return { opts: seen.slice(0, 4), ans: 0 };
}

function q(id, level, text, correct, wrong, format = num, explanation = "") {
  return { id, level, q: text, ...choices(correct, wrong, format), explanation };
}

function numberSystem() {
  return Array.from({ length: 120 }, (_, i) => {
    const level = LEVELS[Math.floor(i / 30)], k = i % 30 + 1;
    if (level === "Beginner") {
      const a = 24 + k * 3, b = 8 + (k % 7);
      if (k % 3 === 1) return q(i, level, `Find the remainder when ${a} is divided by ${b}.`, a % b, [(a % b + 1) % b, b - 1, Math.floor(a / b)]);
      if (k % 3 === 2) { const x = 12 + k, y = 18 + k; const c = gcd(x, y); return q(i, level, `Find the HCF of ${x} and ${y}.`, c, [c + 1, Math.max(1, c - 1), lcm(x, y)]); }
      const n = 20 + k; return q(i, level, `What is the smallest number that must be added to ${n} to make it divisible by 7?`, (7 - n % 7) % 7, [n % 7, 7, ((7 - n % 7) % 7) + 1]);
    }
    if (level === "Intermediate") {
      const a = 8 + k, b = 12 + 2 * k;
      if (k % 3 === 1) { const c = lcm(a, b); return q(i, level, `Find the LCM of ${a} and ${b}.`, c, [gcd(a, b), c + a, c - gcd(a, b)]); }
      if (k % 3 === 2) { const n = 100 + 7 * k; const c = Math.floor(n / 9) * 9; return q(i, level, `Find the greatest multiple of 9 not exceeding ${n}.`, c, [c + 9, c - 9, n - n % 8]); }
      const base = 3 + k % 5, exp = 5 + k % 4, d = base ** exp % 10; return q(i, level, `Find the units digit of ${base}^${exp}.`, d, [(d + 2) % 10, (d + 4) % 10, base]);
    }
    if (level === "Advanced") {
      const a = 60 + 2 * k, b = 84 + 3 * k;
      if (k % 3 === 1) { const h = gcd(a, b), c = Math.floor(a / h) * Math.floor(b / h); return q(i, level, `Divide ${a} and ${b} by their HCF, then find the product of the resulting numbers.`, c, [c + 1, Math.floor(c / 2), h]); }
      if (k % 3 === 2) { const n = 5 + k % 8, c = n * (n + 1) / 2; return q(i, level, `How many factors does 2^${n} × 3^${n - 1} have?`, (n + 1) * n, [c, n * n, (n + 2) * n]); }
      const n = 1000 + 13 * k, c = n - (n % 11); return q(i, level, `Find the greatest integer not exceeding ${n} that is divisible by 11.`, c, [c - 11, c + 11, n - n % 9]);
    }
    const n = 12 + k;
    if (k % 3 === 1) { const c = Math.floor(n / 2) + Math.floor(n / 3) - Math.floor(n / 6); return q(i, level, `How many integers from 1 to ${n} are divisible by 2 or 3?`, c, [c - 1, c + 1, Math.floor(n / 6)]); }
    if (k % 3 === 2) { const a = 7 + k % 6, e = 8 + k % 5, c = a ** e % 13; return q(i, level, `Find the remainder when ${a}^${e} is divided by 13.`, c, [(c + 1) % 13, (c + 3) % 13, a % 13]); }
    const a = 18 + k, b = 24 + k, c = lcm(a, b); return q(i, level, `Two bells ring every ${a} and ${b} seconds. If they ring together now, after how many seconds will they next ring together?`, c, [gcd(a, b), c - a, c + b]);
  });
}

function percentages() {
  return Array.from({ length: 120 }, (_, i) => {
    const level = LEVELS[Math.floor(i / 30)], k = i % 30 + 1, p = 5 * (2 + k % 7), base = 200 + 20 * k;
    if (level === "Beginner") { const c = base * p / 100; return q(i, level, `What is ${p}% of ${base}?`, c, [base - c, c + p, c - p]); }
    if (level === "Intermediate") {
      if (k % 2) { const c = 100 * p / (100 + p); return q(i, level, `A's salary is ${p}% more than B's. B's salary is what percent less than A's?`, c, [p, 100 - p, p / 2], pct); }
      const c = 100 * p / (100 + p); return q(i, level, `A commodity's price rises by ${p}%. By what percent must consumption fall to keep expenditure unchanged?`, c, [p, p / 2, 100 - p], pct);
    }
    if (level === "Advanced") { const p2 = 10 + 5 * (k % 5), c = (1 + p / 100) * (1 - p2 / 100) * 100 - 100; return q(i, level, `A value is increased by ${p}% and then decreased by ${p2}%. Find the net percentage change (positive means increase).`, c, [p - p2, c + 2, c - 2], pct); }
    const pass = 35 + 5 * (k % 6), failedBy = 10 * (2 + k % 5), score = pass * 10 - failedBy, c = (score + failedBy) * 100 / pass;
    return q(i, level, `A student scores ${score} marks and fails by ${failedBy} marks. If the pass mark is ${pass}% of the maximum, find the maximum marks.`, c, [c - 100, c + 100, score * 100 / pass]);
  });
}

function profitLoss() {
  return Array.from({ length: 120 }, (_, i) => {
    const level = LEVELS[Math.floor(i / 30)], k = i % 30 + 1, cp = 400 + 40 * k, p = 5 * (2 + k % 7);
    if (level === "Beginner") { const sp = cp * (1 + p / 100); return q(i, level, `An article costs ${money(cp)} and is sold at ${p}% profit. Find its selling price.`, sp, [cp + p, cp * (1 - p / 100), sp + 40], money); }
    if (level === "Intermediate") { const mark = 20 + 5 * (k % 6), disc = 5 + 5 * (k % 4), c = (1 + mark / 100) * (1 - disc / 100) * 100 - 100; return q(i, level, `An article is marked ${mark}% above cost and sold at ${disc}% discount. Find the profit percentage.`, c, [mark - disc, c + 5, c - 5], pct); }
    if (level === "Advanced") { const loss = 5 + 5 * (k % 5), sp = cp * (1 - loss / 100), gain = 10 + 5 * (k % 4), c = sp * (1 + gain / 100) / (1 - loss / 100); return q(i, level, `An article sold for ${money(sp)} incurs ${loss}% loss. At what price should it be sold to earn ${gain}% profit?`, c, [cp, sp * (1 + gain / 100), c + 100], money); }
    const mark = 25 + 5 * (k % 6), d1 = 10 + 5 * (k % 3), d2 = 5 + 5 * (k % 4), c = (1 + mark / 100) * (1 - d1 / 100) * (1 - d2 / 100) * 100 - 100;
    return q(i, level, `A dealer marks goods ${mark}% above cost and gives successive discounts of ${d1}% and ${d2}%. Find the net profit/loss percentage (negative means loss).`, c, [mark - d1 - d2, c + 3, c - 3], pct);
  });
}

function ratioProportion() {
  return Array.from({ length: 120 }, (_, i) => {
    const level = LEVELS[Math.floor(i / 30)], k = i % 30 + 1, a = 2 + k % 7, b = a + 2 + k % 4;
    if (level === "Beginner") { const unit = 10 * (2 + k % 5), total = (a + b) * unit; return q(i, level, `${money(total)} is divided in the ratio ${a}:${b}. Find the larger share.`, b * unit, [a * unit, total / 2, (b + 1) * unit], money); }
    if (level === "Intermediate") { const c = 3 + k % 8, x = b * c / a; return q(i, level, `If ${a}:${b} = ${c}:x, find x.`, x, [a * c / b, x + 1, b + c]); }
    if (level === "Advanced") { const sum = (a + b) * (20 + k), diff = (b - a) * (20 + k); return q(i, level, `Two numbers are in the ratio ${a}:${b}. Their difference is ${diff}. Find their sum.`, sum, [diff * (a + b), sum - diff, sum + diff]); }
    const c = 2 + k % 5, d = c + 3, unit = 5 + k, total = (a * c + b * d) * unit, answer = a * c * unit;
    return q(i, level, `A and B invest in the ratio ${a}:${b}. A invests for ${c} months and B for ${d} months. From a profit of ${money(total)}, find A's share.`, answer, [b * d * unit, total * a / (a + b), answer + unit * a], money);
  });
}

function averages() {
  return Array.from({ length: 120 }, (_, i) => {
    const level = LEVELS[Math.floor(i / 30)], k = i % 30 + 1;
    if (level === "Beginner") { const start = 5 + k, n = 4 + k % 5, c = start + (n - 1) / 2; return q(i, level, `Find the average of ${n} consecutive integers starting from ${start}.`, c, [start + n / 2, start + n - 1, c + 1]); }
    if (level === "Intermediate") { const n = 10 + k, old = 30 + k, removed = 20 + 2 * k, added = 50 + k, c = (n * old - removed + added) / n; return q(i, level, `The average of ${n} values is ${old}. If ${removed} is replaced by ${added}, find the new average.`, c, [old, c + 1, c - 1]); }
    if (level === "Advanced") { const n1 = 10 + k, n2 = 15 + k, a1 = 40 + k % 8, a2 = 55 + k % 7, c = (n1 * a1 + n2 * a2) / (n1 + n2); return q(i, level, `The average of ${n1} students is ${a1} and that of ${n2} students is ${a2}. Find the combined average.`, c, [(a1 + a2) / 2, c + 2, c - 2]); }
    const n = 12 + k, avg = 45 + k, wrong = 30 + k, right = 50 + 2 * k, c = avg + (right - wrong) / n;
    return q(i, level, `The average of ${n} observations was calculated as ${avg}, but ${wrong} was used instead of ${right}. Find the correct average.`, c, [avg, c + 1, avg + right - wrong]);
  });
}

function interest() {
  return Array.from({ length: 120 }, (_, i) => {
    const level = LEVELS[Math.floor(i / 30)], k = i % 30 + 1, principal = 1000 * (2 + k % 9), rate = 5 * (1 + k % 4), years = 2 + k % 4;
    if (level === "Beginner") { const c = principal * rate * years / 100; return q(i, level, `Find the simple interest on ${money(principal)} at ${rate}% per annum for ${years} years.`, c, [principal * rate / 100, c + principal / 10, principal + c], money); }
    if (level === "Intermediate") { const c = principal * (1 + rate / 100) ** years; return q(i, level, `Find the amount on ${money(principal)} at ${rate}% compound interest per annum for ${years} years.`, c, [principal * (1 + rate * years / 100), c - principal, c + principal * rate / 100], money); }
    if (level === "Advanced") { const c = principal * ((1 + rate / 100) ** 2 - 1 - 2 * rate / 100); return q(i, level, `Find the difference between compound and simple interest on ${money(principal)} at ${rate}% per annum for 2 years.`, c, [principal * rate / 100, c * 2, c + rate], money); }
    const halfRate = rate / 2, periods = years * 2, c = principal * (1 + halfRate / 100) ** periods;
    return q(i, level, `Find the amount on ${money(principal)} at ${rate}% per annum for ${years} years, compounded half-yearly.`, c, [principal * (1 + rate / 100) ** years, principal * (1 + rate * years / 100), c - principal], money);
  });
}

const BUILDERS = { number: numberSystem, percentage: percentages, profit: profitLoss, ratio: ratioProportion, average: averages, interest };
Object.assign(BUILDERS, PLACEMENT_BUILDERS);
auditPlacementBanks();

function hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h >>> 0; }
function rng(seed) {
  return () => {
    seed = Math.imul(seed ^ seed >>> 15, 1 | seed) + 0x6d2b79f5 | 0;
    return ((seed ^ seed >>> 14) >>> 0) / 4294967296;
  };
}
function shuffle(list, random) { const a = [...list]; for (let i = a.length - 1; i; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function prepare(source, seed) {
  const random = rng(hash(seed));
  const ordered = LEVELS.flatMap(level => shuffle(source.filter(x => x.level === level), random));
  const targets = createBalancedAnswerTargets(ordered.length, random);
  return ordered.map((item, i) => {
    const opts = [...item.opts], target = targets[i];
    [opts[0], opts[target]] = [opts[target], opts[0]];
    const assessmentInstruction = item.assessmentStyle === "multi-step"
      ? "Use every stated change in sequence. Keep intermediate values unrounded unless the question says otherwise."
      : item.assessmentStyle === "reverse"
        ? "The final condition is known. Work backwards carefully and verify by substituting the result."
        : item.assessmentStyle === "caselet-di"
          ? "Treat the figures as one caselet. Select only the values relevant to the requested result."
          : item.assessmentStyle === "contextual"
            ? "Translate the situation into its mathematical relationship before calculating."
            : "This is an accuracy-and-speed item. Apply the governing concept directly.";
    return { ...item, opts, ans: target, assessmentInstruction };
  });
}

export default function AptitudePractice({ topic, day, kind, color = "#4f46e5" }) {
  const [started, setStarted] = useState(false), [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}), [selected, setSelected] = useState(null);
  const [done, setDone] = useState(false), [attempt] = useState(() => `${kind}-${Date.now()}-${Math.random()}`);
  const [timings, setTimings] = useState({}), [paused, setPaused] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [marked, setMarked] = useState({});
  const questions = useMemo(() => prepare(BUILDERS[kind](), attempt), [attempt, kind]);
  const item = questions[current];
  const score = questions.filter((x, i) => answers[i] === x.ans).length;
  const elapsed = timings[current] || 0;
  const remaining = Math.max(0, 30 - elapsed);
  const answeredTimes = Object.keys(answers).map(index => timings[index] || 0);
  const averageTime = answeredTimes.length ? Math.round(answeredTimes.reduce((sum, value) => sum + value, 0) / answeredTimes.length) : 0;
  const withinTarget = answeredTimes.filter(value => value <= 30).length;

  useEffect(() => {
    if (!started || done || paused || showMap || selected !== null) return undefined;
    const timer = window.setInterval(() => setTimings(values => ({ ...values, [current]: (values[current] || 0) + 1 })), 1000);
    return () => window.clearInterval(timer);
  }, [current, done, paused, selected, showMap, started]);

  const choose = index => { if (selected !== null) return; setSelected(index); setAnswers(a => ({ ...a, [current]: index })); };
  const toggleReview = () => setMarked(values => ({ ...values, [current]: !values[current] }));
  const jumpTo = index => { setCurrent(index); setSelected(answers[index] ?? null); setPaused(false); setShowMap(false); };
  const next = () => { if (current === questions.length - 1) setDone(true); else jumpTo(current + 1); };
  const shell = { width: "100%", minHeight: "100vh", background: "#f1f5f9", fontFamily: "Inter, Segoe UI, sans-serif", padding: "clamp(76px, 9vw, 110px) clamp(14px, 3vw, 28px) 36px", color: "#0f172a" };
  const card = { width: "min(100%, 880px)", margin: "0 auto", background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "clamp(20px, 4vw, 38px)", boxShadow: "0 12px 35px rgba(15,23,42,.08)" };

  if (!started) return <div style={shell}><div style={card}>
    <div style={{ color, fontWeight: 800, letterSpacing: 2, fontSize: 12 }}>{day.toUpperCase()} APTITUDE SERIES</div>
    <h1 style={{ fontSize: "clamp(34px, 7vw, 58px)", lineHeight: 1.08, letterSpacing: "-0.04em", margin: "12px 0 14px" }}>{topic}</h1>
    <p style={{ color: "#64748b", lineHeight: 1.6, fontSize: "clamp(15px, 2vw, 18px)", maxWidth: 680, margin: "0 auto" }}>150 verified, placement-focused questions covering the complete curriculum for this topic—from essential concepts to company-style applications.</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10, margin: "26px 0" }}>{LEVELS.map((x, i) => <div key={x} style={{ background: "#f8fafc", padding: "14px 10px", borderRadius: 10, textAlign: "center", border: "1px solid #e2e8f0" }}><b style={{ color }}>{i + 1}</b><div style={{ fontSize: 12, lineHeight: 1.45, marginTop: 5 }}>{x}<br /><strong>{PLACEMENT_LEVEL_COUNTS[i]} questions</strong></div></div>)}</div>
    <p style={{ fontSize: 13, lineHeight: 1.5, color: "#64748b", marginBottom: 14 }}>Every answer is formula-generated and audited. Solutions appear immediately after selection. A/B/C/D positions are balanced and reshuffled for every attempt.</p>
    <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "11px 14px", color: "#1e40af", fontSize: 13, lineHeight: 1.5, marginBottom: 16 }}><strong>Timed practice:</strong> 30-second target per question. Pause whenever needed; paused time is not counted. Overtime is allowed and recorded.</div>
    <button onClick={() => setStarted(true)} style={{ width: "100%", background: color, color: "white", border: 0, padding: 14, borderRadius: 10, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>Start {day}'s Practice →</button>
  </div></div>;

  if (done) return <div style={shell}><div style={{ ...card, textAlign: "center" }}><div style={{ fontSize: 52 }}>✓</div><h1>{topic} Complete</h1><div style={{ fontSize: 50, fontWeight: 900, color }}>{score}<span style={{ fontSize: 22, color: "#94a3b8" }}>/{questions.length}</span></div><p style={{ color: "#64748b" }}>{Math.round(score / questions.length * 100)}% correct</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10, margin: "22px 0" }}><div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}><strong style={{ fontSize: 24, color }}>{averageTime}s</strong><div style={{ fontSize: 12, color: "#64748b" }}>Average per question</div></div><div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}><strong style={{ fontSize: 24, color }}>{withinTarget}/{answeredTimes.length}</strong><div style={{ fontSize: 12, color: "#64748b" }}>Within 30-second target</div></div><div style={{ background: "#f8fafc", borderRadius: 10, padding: 14 }}><strong style={{ fontSize: 24, color }}>{answeredTimes.reduce((sum, value) => sum + value, 0)}s</strong><div style={{ fontSize: 12, color: "#64748b" }}>Total active solving time</div></div></div><button onClick={() => location.reload()} style={{ background: color, color: "white", border: 0, padding: "12px 28px", borderRadius: 9, fontWeight: 700, cursor: "pointer" }}>Return to series</button></div></div>;

  const levelIndex = current < 20 ? 0 : current < 75 ? 1 : current < 120 ? 2 : 3;
  return <div style={shell}><div style={card}>
    {showMap && <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,.55)", padding: 18, display: "grid", placeItems: "center" }} onClick={() => setShowMap(false)}><div style={{ width: "min(100%,760px)", maxHeight: "86vh", overflowY: "auto", background: "#fff", borderRadius: 16, padding: "clamp(18px,3vw,28px)", boxShadow: "0 24px 70px rgba(15,23,42,.25)" }} onClick={event => event.stopPropagation()}><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 16 }}><div><h2 style={{ margin: 0, fontSize: 22 }}>Question Navigator</h2><div style={{ color: "#64748b", fontSize: 13 }}>{Object.keys(answers).length} answered · {Object.values(marked).filter(Boolean).length} marked · {questions.length - Object.keys(answers).length} unanswered</div></div><button onClick={() => setShowMap(false)} style={{ border: 0, background: "#f1f5f9", width: 36, height: 36, borderRadius: 8, cursor: "pointer", fontWeight: 900 }}>✕</button></div><div style={{ display: "flex", gap: 14, flexWrap: "wrap", color: "#64748b", fontSize: 12, marginBottom: 18 }}><span>● <b style={{ color }}>Current</b></span><span>● <b style={{ color: "#059669" }}>Answered</b></span><span>◆ <b style={{ color: "#7c3aed" }}>Marked</b></span><span>○ Unanswered</span></div>{LEVELS.map((level, levelIdx) => { const start = [0,20,75,120][levelIdx], count = PLACEMENT_LEVEL_COUNTS[levelIdx]; return <div key={level} style={{ marginBottom: 20 }}><div style={{ fontWeight: 800, color: "#334155", fontSize: 13, marginBottom: 9 }}>{level} · Q{start + 1}–{start + count}</div><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(40px,1fr))", gap: 7 }}>{Array.from({ length: count }, (_, offset) => { const index = start + offset, isCurrent = index === current, answered = answers[index] !== undefined, isMarked = marked[index]; return <button key={index} onClick={() => jumpTo(index)} style={{ minWidth: 40, height: 38, borderRadius: isMarked ? "50% 50% 8px 8px" : 8, border: `1.5px solid ${isCurrent ? color : isMarked ? "#7c3aed" : answered ? "#10b981" : "#cbd5e1"}`, background: isCurrent ? color : isMarked ? "#f5f3ff" : answered ? "#ecfdf5" : "#f8fafc", color: isCurrent ? "#fff" : isMarked ? "#6d28d9" : answered ? "#047857" : "#64748b", fontWeight: 800, cursor: "pointer" }}>{index + 1}</button>; })}</div></div>; })}</div></div>}
    <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}><div><b style={{ color }}>{day} · {topic}</b><div style={{ color: "#64748b", fontSize: 13 }}>{LEVELS[levelIndex]} · Question {current + 1} of {questions.length}</div></div><div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><button onClick={toggleReview} style={{ border: `1px solid ${marked[current] ? "#7c3aed" : "#cbd5e1"}`, background: marked[current] ? "#f5f3ff" : "#fff", color: marked[current] ? "#6d28d9" : "#475569", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>{marked[current] ? "◆ Marked" : "◇ Review"}</button><button onClick={() => setShowMap(true)} style={{ border: "1px solid #cbd5e1", background: "#fff", color: "#475569", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: "pointer" }}>▦ Navigator</button><div style={{ minWidth: 82, textAlign: "center", borderRadius: 9, padding: "7px 10px", background: paused ? "#fef3c7" : elapsed > 30 ? "#fef2f2" : remaining <= 10 ? "#fff7ed" : "#eff6ff", color: paused ? "#92400e" : elapsed > 30 ? "#dc2626" : remaining <= 10 ? "#c2410c" : "#1d4ed8", fontWeight: 900 }}>{paused ? "Paused" : elapsed > 30 ? `+${elapsed - 30}s` : `${remaining}s`}</div><button onClick={() => setPaused(value => !value)} disabled={selected !== null} style={{ border: "1px solid #cbd5e1", background: "#fff", color: "#475569", borderRadius: 8, padding: "8px 12px", fontWeight: 700, cursor: selected !== null ? "not-allowed" : "pointer", opacity: selected !== null ? .55 : 1 }}>{paused ? "▶ Resume" : "Ⅱ Pause"}</button></div></div>
    <div style={{ height: 7, background: "#e2e8f0", borderRadius: 9, margin: "18px 0 28px" }}><div style={{ width: `${(current + 1) / questions.length * 100}%`, height: "100%", background: color, borderRadius: 9 }} /></div>
    <div style={{ display: "inline-flex", background: `${color}12`, color, border: `1px solid ${color}35`, borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 800 }}>{item.subtopic}</div>
    <div style={{ marginTop: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 9, padding: "10px 12px", color: "#475569", fontSize: 12, lineHeight: 1.5 }}><strong style={{ color: "#334155" }}>Assessment instruction:</strong> {item.assessmentInstruction}</div>
    <h2 style={{ fontSize: "clamp(17px, 2.2vw, 20px)", lineHeight: 1.55, minHeight: 58, marginTop: 12 }}>{item.q}</h2>
    <div style={{ margin: "20px 0" }}>{item.opts.map((opt, i) => { const correct = selected !== null && i === item.ans, wrong = selected === i && i !== item.ans; return <button key={i} onClick={() => choose(i)} style={{ display: "block", width: "100%", textAlign: "left", margin: "9px 0", padding: "14px 16px", borderRadius: 10, border: `1.5px solid ${correct ? "#10b981" : wrong ? "#ef4444" : "#cbd5e1"}`, background: correct ? "#ecfdf5" : wrong ? "#fef2f2" : "#f8fafc", cursor: selected === null ? "pointer" : "default", fontSize: 16 }}><b style={{ marginRight: 12 }}>{String.fromCharCode(65 + i)}.</b>{opt}</button>; })}</div>
    {selected !== null && <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderLeft: `4px solid ${selected === item.ans ? "#10b981" : "#ef4444"}`, borderRadius: 9, padding: "12px 14px", margin: "-4px 0 18px", color: "#334155", fontSize: 14, lineHeight: 1.55 }}><div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 5 }}><strong>Verified solution</strong><strong style={{ color: elapsed <= item.idealTimeSeconds ? "#059669" : "#dc2626" }}>Your time: {elapsed}s · Ideal: {item.idealTimeSeconds}s</strong></div><div>{item.solution}</div><div style={{ marginTop: 10, paddingTop: 9, borderTop: "1px solid #e2e8f0" }}><strong>Speed approach:</strong> {item.shortcut}</div><div style={{ marginTop: 6, color: "#9a3412" }}><strong>Common mistake:</strong> {item.commonMistake}</div></div>}
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}><button disabled={current === 0} onClick={() => jumpTo(current - 1)} style={{ background: "#fff", color: current === 0 ? "#94a3b8" : "#475569", border: "1px solid #cbd5e1", padding: "11px 18px", borderRadius: 9, fontWeight: 700, cursor: current === 0 ? "not-allowed" : "pointer" }}>← Previous</button><span style={{ color: selected === null ? "#94a3b8" : selected === item.ans ? "#059669" : "#dc2626", fontWeight: 700 }}>{selected === null ? "Unanswered · You may skip" : selected === item.ans ? "Correct!" : `Correct answer: ${String.fromCharCode(65 + item.ans)}`}</span><button onClick={next} style={{ background: color, color: "white", border: 0, padding: "12px 24px", borderRadius: 9, fontWeight: 700, cursor: "pointer" }}>{current === questions.length - 1 ? "Finish Test" : selected === null ? "Skip / Next →" : "Next →"}</button></div>
  </div></div>;
}
