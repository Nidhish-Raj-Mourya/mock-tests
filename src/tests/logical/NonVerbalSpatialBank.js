import { buildLogicalBank } from "./LogicalQuestionFactory.js";

const symbols = ["circle", "triangle", "square", "star", "pentagon", "diamond"];
const arrows = ["up", "right", "down", "left"];
const completeDistractors=(correct,candidates)=>{
 const result=[...new Set(candidates)].filter(option=>option!==correct);
 if(/^\d+$/.test(correct)){for(const delta of [1,-1,2,-2,3]){const option=String(Math.max(0,+correct+delta));if(result.length<3&&option!==correct&&!result.includes(option))result.push(option);}}
 else for(const option of [...symbols,...arrows])if(result.length<3&&option!==correct&&!result.includes(option))result.push(option);
 return result.slice(0,3);
};

const patterns = Array.from({ length: 25 }, (_, p) => v => {
  const family = p % 5;
  const band = Math.floor(p / 5);
  let prompt, correct, distractors, explanation;

  if (family === 0) {
    const n = 4 + 10 * band + v;
    const metric = band % 4;
    if (metric === 0) {
      correct = "8";
      prompt = `A solid cube is painted on all six outer faces and cut into ${n} equal parts along each edge. How many small cubes have exactly three painted faces?`;
      explanation = "Only the eight original corner cubes touch three painted faces.";
      distractors = [String(8 * (n - 2)), String(12 * (n - 2)), String(6 * (n - 2) ** 2)];
    } else if (metric === 1) {
      correct = String(12 * (n - 2));
      prompt = `A solid cube is painted on all six outer faces and cut into ${n} equal parts along each edge. How many small cubes have exactly two painted faces?`;
      explanation = `Each of 12 edges contributes ${n - 2} non-corner cubes, giving ${correct}.`;
      distractors = ["8", String(6 * (n - 2) ** 2), String((n - 2) ** 3)];
    } else if (metric === 2) {
      correct = String(6 * (n - 2) ** 2);
      prompt = `A solid cube is painted on all six outer faces and cut into ${n} equal parts along each edge. How many small cubes have exactly one painted face?`;
      explanation = `Each of six faces has an interior grid of (${n}−2)² cubes, giving ${correct}.`;
      distractors = [String(12 * (n - 2)), String((n - 2) ** 3), String(n ** 3 - (n - 2) ** 3)];
    } else {
      correct = String((n - 2) ** 3);
      prompt = `A solid cube is painted on all six outer faces and cut into ${n} equal parts along each edge. How many small cubes have no painted face?`;
      explanation = `Removing one painted layer from every face leaves an internal cube of side ${n - 2}, hence ${correct}.`;
      distractors = [String(6 * (n - 2) ** 2), String(n ** 3), String(12 * (n - 2))];
    }
  } else if (family === 1) {
    const folds = 2 + band;
    const holes = v + 6 * band;
    correct = String(holes * 2 ** folds);
    prompt = `A rectangular sheet is folded in half ${folds} times, each fold creating equal layers. ${holes} hole${holes > 1 ? "s are" : " is"} punched through all layers away from every crease. How many holes appear when the sheet is fully unfolded?`;
    explanation = `Each half-fold doubles the layers. ${folds} folds create 2^${folds} layers, so ${holes} punch position(s) produce ${correct} holes.`;
    distractors = [String(holes * folds), String(holes * 2 ** (folds - 1)), String(holes * (folds + 1))];
  } else if (family === 2) {
    const labels = Array.from({ length: 6 }, (_, i) => `${String.fromCharCode(65 + ((i + band) % 6))}${v}`);
    const [a, b, c, d, e, f] = labels;
    const pairs = [[a, f], [b, d], [c, e]];
    const pair = pairs[band % 3];
    correct = pair[1];
    prompt = `A cube net has four faces in a row ${b}–${c}–${d}–${e}, with ${a} directly above ${c} and ${f} directly below ${c}. After folding the net, which face is opposite ${pair[0]}?`;
    explanation = `In this cross net, the opposite pairs are ${a}/${f}, ${b}/${d}, and ${c}/${e}; therefore ${correct} is opposite ${pair[0]}.`;
    distractors = labels.filter(x => x !== pair[0] && x !== correct).slice(0, 3);
  } else if (family === 3) {
    const start = (band + v) % 4;
    const turn = 1 + ((band + v) % 3);
    const steps = 3 + 10 * band + v;
    const end = (start + turn * steps) % 4;
    correct = arrows[end];
    prompt = `An arrow initially points ${arrows[start]}. It is rotated ${turn === 1 ? "90° clockwise" : turn === 2 ? "180°" : "90° anticlockwise"} a total of ${steps} times. Which direction does it finally point?`;
    explanation = `Represent the four orientations cyclically. Moving ${turn} quarter-turn unit(s) ${steps} times from ${arrows[start]} ends at ${correct}.`;
    distractors = arrows.filter(x => x !== correct).slice(0, 3);
  } else {
    const start = (band + v - 1) % symbols.length;
    const jump = 1 + band;
    const sequence = Array.from({ length: 5 }, (_, i) => symbols[(start + i * jump) % symbols.length]);
    correct = symbols[(start + 5 * jump) % symbols.length];
    prompt = `A figure series follows this order: ${sequence.join(" → ")} → ?. Each figure advances by the same number of positions in the cycle circle, triangle, square, star, pentagon, diamond. Which figure comes next?`;
    explanation = `Each step advances ${jump} position(s) in the stated six-shape cycle; continuing once after ${sequence.at(-1)} gives ${correct}.`;
    distractors = symbols.filter(x => x !== correct).slice((v - 1) % 3, (v - 1) % 3 + 3);
  }

  return {
    subtopic: `Spatial pattern ${p + 1}`,
    prompt, correct, distractors:completeDistractors(correct,distractors), explanation,
    assessmentStyle: "multi-step",
    shortcut: "Convert the figure into a stable representation—face pairs, quarter-turn indices, layers, or a shape cycle—before comparing options.",
    commonMistake: "Track orientation and layers after every operation; do not reason from the final-looking figure alone.",
  };
});

export const nonVerbalSpatialLogicalBank = () => buildLogicalBank(patterns);
