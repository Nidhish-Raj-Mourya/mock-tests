export const LEVELS = [
  "Foundation Check",
  "Placement Core",
  "Advanced Applications",
  "Company Challenge",
];

export const levelForQuestion = id => id < 20
  ? LEVELS[0]
  : id < 75
    ? LEVELS[1]
    : id < 120
      ? LEVELS[2]
      : LEVELS[3];

export const numberLabel = value => Number.isInteger(Number(value))
  ? String(Number(value))
  : Number(Number(value).toFixed(2)).toString();
export const percentLabel = value => `${numberLabel(value)}%`;
export const moneyLabel = value => `Rs ${Number(Number(value).toFixed(2)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
export const hoursLabel = value => `${numberLabel(value)} hours`;
export const daysLabel = value => `${numberLabel(value)} days`;
export const litresLabel = value => `${numberLabel(value)} litres`;
export const kmphLabel = value => `${numberLabel(value)} km/h`;
export const kilometresLabel = value => `${numberLabel(value)} km`;
export const minutesLabel = value => `${numberLabel(value)} minutes`;

const defaultIdealTime = level => level === LEVELS[0] ? 25 : level === LEVELS[1] ? 35 : level === LEVELS[2] ? 50 : 65;

function uniqueOptions(answer, distractors, format) {
  const correct = format(answer);
  const options = [answer, ...distractors].map(format).filter((value, index, all) => all.indexOf(value) === index);
  let bump = Math.max(1, Math.abs(Number(answer) || 1) * 0.08);
  while (options.length < 4) {
    const fallback = format(Number(answer) + bump * options.length);
    if (!options.includes(fallback)) options.push(fallback);
    bump += 1;
  }
  if (!options.includes(correct)) throw new Error(`Correct option missing for answer ${correct}`);
  return { options: options.slice(0, 4), correct };
}

export function createPlacementQuestion({
  id,
  level,
  subtopic,
  prompt,
  answer,
  distractors,
  format = numberLabel,
  solution,
  assessmentStyle = "contextual",
  reasoningDepth,
  shortcut,
  commonMistake,
  idealTimeSeconds,
}) {
  const appliedStyles = new Set(["contextual", "multi-step", "caselet-di"]);
  const detailedPrompt = appliedStyles.has(assessmentStyle) && prompt.trim().split(/\s+/).length < 14
    ? `${prompt} Use every stated measurement and report the requested result in the indicated unit.`
    : prompt;
  const { options, correct } = uniqueOptions(answer, distractors, format);
  const depth = reasoningDepth || (assessmentStyle === "multi-step" ? "two-step" : assessmentStyle === "reverse" ? "two-step" : "single-step");
  const sequenceCheck = assessmentStyle === "multi-step"
    ? " Sequence check: compute the first quantity, then add or subtract the next contribution before the final division or comparison."
    : "";
  const completeSolution = `Concept: ${subtopic}. Method: ${solution}${sequenceCheck} Verification: substituting the result into the stated conditions gives ${correct}, so all quantities remain consistent. Final answer: ${correct}.`;
  return {
    id,
    level,
    subtopic,
    q: detailedPrompt,
    opts: options,
    ans: options.indexOf(correct),
    assessmentStyle,
    reasoningDepth: depth,
    patternId: subtopic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    idealTimeSeconds: idealTimeSeconds || defaultIdealTime(level),
    shortcut: shortcut || `Translate the ${subtopic.toLowerCase()} information into rates or proportions first; cancel common factors before multiplying.`,
    commonMistake: commonMistake || `Keep the requested quantity, its unit and its reference base separate while solving this ${subtopic.toLowerCase()} question.`,
    solution: completeSolution,
  };
}

export function buildPlacementBank(patterns) {
  if (patterns.length !== 25) throw new Error(`A placement bank requires exactly 25 patterns; received ${patterns.length}`);
  const questions = [];
  for (let variant = 1; variant <= 6; variant++) {
    for (let pattern = 0; pattern < patterns.length; pattern++) {
      const id = (variant - 1) * patterns.length + pattern;
      questions.push(createPlacementQuestion({
        id,
        level: levelForQuestion(id),
        ...patterns[pattern](variant, levelForQuestion(id), id),
      }));
    }
  }
  return questions;
}

export const gcdValue = (a, b) => {
  while (b) [a, b] = [b, a % b];
  return Math.abs(a);
};

export const lcmValue = (a, b) => Math.abs(a * b) / gcdValue(a, b);
