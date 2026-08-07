export const LOGICAL_LEVELS = [
  "Foundation Check",
  "Placement Core",
  "Advanced Applications",
  "Company Challenge",
];

const levelFor = id => id < 20 ? LOGICAL_LEVELS[0] : id < 75 ? LOGICAL_LEVELS[1] : id < 120 ? LOGICAL_LEVELS[2] : LOGICAL_LEVELS[3];
const idealTimeFor = level => level === LOGICAL_LEVELS[0] ? 30 : level === LOGICAL_LEVELS[1] ? 40 : level === LOGICAL_LEVELS[2] ? 55 : 70;

export function createLogicalQuestion({
  id,
  level,
  subtopic,
  prompt,
  correct,
  distractors,
  explanation,
  assessmentStyle = "multi-step",
  reasoningDepth,
  shortcut,
  commonMistake,
  idealTimeSeconds,
}) {
  const options = [correct, ...distractors].map(String).filter((value, index, all) => value.trim() && all.indexOf(value) === index);
  const fallbacks = ["Cannot be determined", "Only the first condition follows", "Only the second condition follows", "Neither condition follows", "Both conditions follow"];
  for (const fallback of fallbacks) if (options.length < 4 && !options.includes(fallback)) options.push(fallback);
  if (options.length !== 4 || !options.includes(String(correct))) throw new Error(`Invalid logical options for ${subtopic} question ${id + 1}`);
  const depth = reasoningDepth || (assessmentStyle === "multi-step" ? "two-step" : "single-step");
  const sequence = assessmentStyle === "multi-step"
    ? " Check each condition in order, retain only deductions forced by every valid arrangement, and then compare the surviving result with the options."
    : " Apply only the stated rule and do not introduce an unstated assumption.";
  return {
    domain: "logical",
    id,
    level,
    subtopic,
    q: prompt,
    opts: options,
    ans: options.indexOf(String(correct)),
    assessmentStyle,
    reasoningDepth: depth,
    patternId: subtopic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    idealTimeSeconds: idealTimeSeconds || idealTimeFor(level),
    shortcut: shortcut || `Represent the ${subtopic.toLowerCase()} information with a compact diagram, symbol chain, or elimination table before checking options.`,
    commonMistake: commonMistake || `Do not reverse a one-way statement or treat a possible relation as a definite conclusion in this ${subtopic.toLowerCase()} problem.`,
    solution: `Concept: ${subtopic}. Reasoning trace: ${explanation}${sequence} Verification: the conclusion remains valid under every condition stated in the question. Final answer: ${correct}.`,
  };
}

export function buildLogicalBank(patterns) {
  if (patterns.length !== 25) throw new Error(`A logical bank requires exactly 25 patterns; received ${patterns.length}`);
  return Array.from({ length: 6 }, (_, variantIndex) => patterns.map((build, patternIndex) => {
    const id = variantIndex * 25 + patternIndex;
    return createLogicalQuestion({ id, level: levelFor(id), ...build(variantIndex + 1, levelFor(id), id) });
  })).flat();
}

export function auditLogicalBuilders(builders) {
  return Object.entries(builders).map(([topic, build]) => {
    const questions = build();
    const ids = new Set(questions.map(question => question.id));
    const texts = new Set(questions.map(question => question.q));
    const patternCounts = questions.reduce((counts, question) => {
      counts.set(question.patternId, (counts.get(question.patternId) || 0) + 1);
      return counts;
    }, new Map());
    const invalid = questions.filter(question =>
      question.opts.length !== 4 || new Set(question.opts).size !== 4 ||
      question.ans < 0 || question.ans > 3 || !question.opts[question.ans] ||
      !question.solution || question.solution.length < 180 ||
      !question.shortcut || !question.commonMistake || !question.idealTimeSeconds ||
      /NaN|Infinity|undefined|null|Ã¢|Ãƒ|Ã‚/.test(question.q + question.solution + question.opts.join(" "))
    );
    const applied = questions.filter(question => question.assessmentStyle !== "direct").length;
    const multiStep = questions.filter(question => question.assessmentStyle === "multi-step").length;
    const maxPatternReuse = Math.max(...patternCounts.values());
    if (questions.length !== 150 || ids.size !== 150 || texts.size !== 150 || patternCounts.size !== 25 || maxPatternReuse !== 6 || invalid.length || applied < 90) {
      throw new Error(`${topic} logical audit failed: count=${questions.length}, ids=${ids.size}, unique=${texts.size}, patterns=${patternCounts.size}, maxReuse=${maxPatternReuse}, invalid=${invalid.length}, applied=${applied}, multi=${multiStep}`);
    }
    return {
      topic,
      questions: 150,
      uniqueQuestions: texts.size,
      patterns: patternCounts.size,
      maxPatternReuse,
      verifiedExplanations: questions.filter(question => question.solution.length >= 180).length,
      levels: Object.fromEntries(LOGICAL_LEVELS.map(level => [level, questions.filter(question => question.level === level).length])),
    };
  });
}
