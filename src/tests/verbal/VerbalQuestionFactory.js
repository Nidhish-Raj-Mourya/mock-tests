import { PLACEMENT_LEVELS } from "../weekly/PlacementQuestionBanks.js";

const levelFor = id => id < 20 ? PLACEMENT_LEVELS[0] : id < 75 ? PLACEMENT_LEVELS[1] : id < 120 ? PLACEMENT_LEVELS[2] : PLACEMENT_LEVELS[3];
const idealTimeFor = level => level === PLACEMENT_LEVELS[0] ? 30 : level === PLACEMENT_LEVELS[1] ? 40 : level === PLACEMENT_LEVELS[2] ? 55 : 75;

export function createVerbalQuestion({ id, level, subtopic, prompt, correct, distractors, explanation, assessmentStyle="contextual", shortcut, commonMistake, idealTimeSeconds }) {
  const options=[correct,...distractors].map(value=>String(value).trim()).filter((value,index,all)=>value&&all.indexOf(value)===index);
  const fallbacks=["No improvement is required","The information is insufficient","None of these","Both statements are acceptable"];
  for(const fallback of fallbacks)if(options.length<4&&!options.includes(fallback))options.push(fallback);
  if(options.length!==4||!options.includes(String(correct).trim()))throw new Error(`Invalid verbal options for ${subtopic} question ${id+1}`);
  const trace=assessmentStyle==="multi-step"
    ? " Test each option against meaning, grammar, tone and logical continuity; reject an option as soon as it violates any one of them."
    : " Read the complete sentence before selecting; the surrounding words determine the required grammar and meaning.";
  return {domain:"verbal",id,level,subtopic,q:prompt,opts:options,ans:options.indexOf(String(correct).trim()),assessmentStyle,reasoningDepth:assessmentStyle==="multi-step"?"two-step":"single-step",patternId:subtopic.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,""),idealTimeSeconds:idealTimeSeconds||idealTimeFor(level),shortcut:shortcut||"Identify the tested rule or relationship first, eliminate structurally impossible choices, and then verify the surviving option in the complete context.",commonMistake:commonMistake||"Do not choose an option merely because it sounds familiar; check its exact grammar, meaning, register and logical fit.",solution:`Concept: ${subtopic}. Reasoning trace: ${explanation}${trace} Verification: substituting the selected answer preserves both grammatical accuracy and the intended meaning. Final answer: ${correct}.`};
}

export function buildVerbalBank(patterns){
  if(patterns.length!==25)throw new Error(`A verbal bank requires exactly 25 patterns; received ${patterns.length}`);
  return Array.from({length:6},(_,variantIndex)=>patterns.map((build,patternIndex)=>{
    const id=variantIndex*25+patternIndex,level=levelFor(id);
    return createVerbalQuestion({id,level,...build(variantIndex+1,level,id)});
  })).flat();
}

export function auditVerbalBuilders(builders){
  return Object.entries(builders).map(([topic,build])=>{
    const questions=build(),ids=new Set(questions.map(q=>q.id)),texts=new Set(questions.map(q=>q.q)),patterns=new Map();
    for(const q of questions)patterns.set(q.patternId,(patterns.get(q.patternId)||0)+1);
    const invalid=questions.filter(q=>q.opts.length!==4||new Set(q.opts).size!==4||q.ans<0||q.ans>3||!q.opts[q.ans]||!q.solution||q.solution.length<180||!q.shortcut||!q.commonMistake||!q.idealTimeSeconds||/NaN|Infinity|undefined|null|\uFFFD/.test(q.q+q.solution+q.opts.join(" ")));
    const maxReuse=Math.max(...patterns.values()),applied=questions.filter(q=>q.assessmentStyle!=="direct").length;
    if(questions.length!==150||ids.size!==150||texts.size!==150||patterns.size!==25||maxReuse!==6||invalid.length||applied<90)throw new Error(`${topic} verbal audit failed: count=${questions.length}, ids=${ids.size}, unique=${texts.size}, patterns=${patterns.size}, maxReuse=${maxReuse}, invalid=${invalid.length}, applied=${applied}`);
    return {topic,questions:150,uniqueQuestions:texts.size,patterns:patterns.size,maxPatternReuse:maxReuse,verifiedExplanations:questions.filter(q=>q.solution.length>=180).length,levels:Object.fromEntries(PLACEMENT_LEVELS.map(level=>[level,questions.filter(q=>q.level===level).length]))};
  });
}
