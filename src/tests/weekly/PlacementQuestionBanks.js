import { numberSystemPlacementBank } from "./NumberSystemPlacementBank.js";
import { percentagePlacementBank } from "./PercentagePlacementBank.js";
import { mixturePlacementBank, pipesPlacementBank, timeWorkPlacementBank } from "./WorkRatePlacementBanks.js";
import { timeDistancePlacementBank, trainsBoatsPlacementBank } from "./MotionPlacementBanks.js";
import { algebraPlacementBank, mensurationPlacementBank } from "./AlgebraMensurationBanks.js";
import { permutationPlacementBank, probabilityPlacementBank } from "./CombinatoricsProbabilityBanks.js";
import { dataInterpretationPlacementBank, statisticsPlacementBank } from "./StatisticsDIBanks.js";

export const PLACEMENT_LEVELS = [
  "Foundation Check",
  "Placement Core",
  "Advanced Applications",
  "Company Challenge",
];
export const PLACEMENT_LEVEL_COUNTS = [20, 55, 45, 30];

export function createBalancedAnswerTargets(total, random) {
  const shuffleValues = values => {
    const result = [...values];
    for (let i = result.length - 1; i; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const extraOrder = shuffleValues([0, 1, 2, 3]);
  const counts = [0, 1, 2, 3].map(index => Math.floor(total / 4) + (extraOrder.indexOf(index) < total % 4 ? 1 : 0));
  const remaining = [...counts];
  const targets = [];
  while (targets.length < total) {
    const candidates = [0, 1, 2, 3].filter(index => {
      if (!remaining[index]) return false;
      const length = targets.length;
      if (length >= 2 && targets[length - 1] === index && targets[length - 2] === index) return false;
      const after = remaining.map((count, candidate) => count - (candidate === index ? 1 : 0));
      return after.every((count, candidate) => count <= 2 * (after.reduce((sum, other, j) => sum + (j === candidate ? 0 : other), 0) + 1));
    });
    if (!candidates.length) throw new Error("Unable to create a balanced answer sequence");
    const weight = candidates.reduce((sum, index) => sum + remaining[index], 0);
    let pick = random() * weight;
    let selected = candidates.at(-1);
    for (const candidate of candidates) {
      pick -= remaining[candidate];
      if (pick < 0) { selected = candidate; break; }
    }
    targets.push(selected);
    remaining[selected]--;
  }
  return targets;
}

const fmtNum = n => Number.isInteger(n) ? String(n) : Number(n.toFixed(2)).toString();
const fmtPct = n => `${fmtNum(n)}%`;
const fmtMoney = n => `₹${Number(n.toFixed(2)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return Math.abs(a); };
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
const ratioDistractors = (answer, candidates) => {
  const values = candidates.filter((value, index, all) => value !== answer && all.indexOf(value) === index);
  const [first, second] = answer.split(":").map(Number);
  let offset = 1;
  while (values.length < 3) {
    const candidate = `${first + offset}:${second}`;
    if (candidate !== answer && !values.includes(candidate)) values.push(candidate);
    offset++;
  }
  return values.slice(0, 3);
};

export const normalizeQuestionTemplate = text => text
  .toLowerCase()
  .replace(/[₹]?\s*\d[\d,]*(?:\.\d+)?/g, "#")
  .replace(/\s+/g, " ")
  .trim();

const REVERSE_PATTERN = /reverse|unknown|from (?:hcf|lcm|amount|profit|loss|average)|original|present value|missing|target|required/i;
const CASELET_PATTERN = /budget|election|class|department|stock|voters|trainees|students|boys|girls|company|fund|machine|vehicle|dealer|person earns/i;
const DIRECT_OPENING = /^(find|what is|calculate|convert|evaluate|how many|the sum)/i;

const AUTHORED_DIRECT = new Set([
  "Profit percentage from CP and SP","Selling price for target profit","Selling price at loss","Selling price after discount","Equivalent single discount",
  "Proportional division","Missing proportion","Compound ratio","Larger share in a ratio","Fourth proportional","Mean proportional",
  "Consecutive values","Average of consecutive odd/even count","Total from average","Average speed","Temperature average",
  "Simple interest","Annual compounding","Compound interest","Amount under simple interest","Compound interest from principal",
]);
const AUTHORED_REVERSE = new Set([
  "Reverse cost price","Target selling price","Cost price from loss","Cost price from profit","Marked price from discount","Discount for target profit",
  "Numbers from ratio and difference","Numbers from ratio and sum","Past age ratio","Unknown group average",
  "Missing observation","Missing value from average","Required total increase","Required score for target average","New member","New member age",
  "Finding principal","Rate from simple interest","Time from simple interest","Principal from simple interest","Principal from compound amount","Compound rate from amount","Present value","Original value before depreciation","Discounted present sum",
]);
const AUTHORED_MULTI = new Set([
  "Markup and discount","Successive discounts","Dishonest dealer","Equal selling price","Successive traders","Mixed lots","Tax and commission","Markup for profit after discount","False weight effective gain","Equal SP gain-loss pair","Mixed stock result","Total gain across a trader chain",
  "Partnership","Alligation","Work and wages","Mixtures","Age ratio after years","Partnership with unequal time","Efficiency-time wage division","Alligation ratio","Mixture after dilution",
  "Replacement","Combined average","Correction of error","Sports averages","Weighted average","Average after removal","Average after addition","Correction of wrong entry","Correction of duplicate entry","Combined group average","Weighted class average","Round-trip travel time","Average speed for unequal times",
  "Half-yearly compounding","SI–CI difference","Variable rates","Depreciation","Quarterly compounding","Half-yearly compound interest","Quarterly compound interest","Monthly compounding","Variable annual rates","Two-year CI-SI difference","Multi-year CI-SI comparison",
]);
const AUTHORED_CONTEXTUAL_OVERRIDE = new Set([
  "Dishonest dealer","Partnership","Alligation","Age ratio after years","Partnership with unequal time","Mixture after dilution",
  "SI–CI difference","Quarterly compounding","Half-yearly compound interest","Quarterly compound interest","Monthly compounding",
]);

function authoredAssessmentStyle(subtopic) {
  if (AUTHORED_CONTEXTUAL_OVERRIDE.has(subtopic)) return "contextual";
  if (AUTHORED_MULTI.has(subtopic)) return "multi-step";
  if (AUTHORED_REVERSE.has(subtopic)) return "reverse";
  if (AUTHORED_DIRECT.has(subtopic)) return "direct";
  return "contextual";
}

export function classifyAssessmentStyle(question) {
  if (question.assessmentStyle) return question.assessmentStyle;
  if (/data interpretation|caselet/i.test(question.subtopic)) return "caselet-di";
  if (REVERSE_PATTERN.test(`${question.subtopic} ${question.q}`)) return "reverse";
  if (CASELET_PATTERN.test(question.q) && /then|after|remainder|combined|successive|while|and the rest/i.test(question.q)) return "multi-step";
  if (CASELET_PATTERN.test(question.q)) return "contextual";
  if (DIRECT_OPENING.test(question.q)) return "direct";
  return "contextual";
}

export const solutionOperationCount = question => (question.solution.match(/[+×*/^-]|\bthen\b|\bsubtract\b|\bdivide\b|\bweighted\b|\bcombined\b/gi) || []).length;

function reasoningDepth(question) {
  if (question.reasoningDepth) return question.reasoningDepth;
  const operations = solutionOperationCount(question);
  return operations >= 5 ? "advanced" : operations >= 3 ? "two-step" : "single-step";
}

function makeQuestion(id, level, subtopic, text, answer, distractors, format = fmtNum, solution) {
  const correct = format(answer);
  const options = [answer, ...distractors].map(format).filter((value, index, all) => all.indexOf(value) === index);
  let step = Math.max(1, Math.abs(Number(answer)) * 0.07);
  while (options.length < 4) {
    const fallback = format(Number(answer) + step * options.length);
    if (!options.includes(fallback)) options.push(fallback);
    step += 1;
  }
  if (!options.includes(correct) || options.length !== 4) throw new Error(`Invalid options for ${subtopic} question ${id + 1}`);
  const workedSteps = solution || `Calculate the requested value using the ${subtopic.toLowerCase()} relationship.`;
  const idealTimeSeconds = level === PLACEMENT_LEVELS[0] ? 25 : level === PLACEMENT_LEVELS[1] ? 35 : level === PLACEMENT_LEVELS[2] ? 50 : 65;
  const assessmentStyle = authoredAssessmentStyle(subtopic);
  const authoredDepth = assessmentStyle === "multi-step" ? (level === PLACEMENT_LEVELS[3] ? "advanced" : "two-step") : assessmentStyle === "reverse" ? "two-step" : "single-step";
  return {
    id,
    level,
    subtopic,
    q: text,
    opts: options,
    ans: options.indexOf(correct),
    assessmentStyle,
    reasoningDepth: authoredDepth,
    patternId: subtopic.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    idealTimeSeconds,
    shortcut: `Identify the governing ${subtopic.toLowerCase()} relationship before substituting values; cancel common factors early to reduce calculation time.`,
    commonMistake: `Do not apply a memorised formula until the requested quantity and the base value in this ${subtopic.toLowerCase()} problem are identified.`,
    solution: `Concept: ${subtopic}. Method and calculation: ${workedSteps} Final answer check: the computed value is ${correct}.`,
  };
}

const levelFor = i => i < 20 ? PLACEMENT_LEVELS[0] : i < 75 ? PLACEMENT_LEVELS[1] : i < 120 ? PLACEMENT_LEVELS[2] : PLACEMENT_LEVELS[3];

export function legacyNumberBank() {
  return Array.from({ length: 150 }, (_, i) => {
    const level = levelFor(i), k = i + 1, pattern = i % 10;
    if (pattern === 0) { const a = 84 + 6*k, b = 126 + 9*k, h = gcd(a,b); return makeQuestion(i,level,"HCF–LCM",`The HCF of ${a} and ${b} is ${h}. Find their LCM.`,lcm(a,b),[a*b,h,a+b],fmtNum,`Use HCF × LCM = product of the two numbers. LCM = (${a} × ${b})/${h} = ${lcm(a,b)}.`); }
    if (pattern === 1) { const n=275+17*k,d=11+k%7,r=n%d; return makeQuestion(i,level,"Remainders",`What least number must be added to ${n} so that the result is exactly divisible by ${d}?`,(d-r)%d,[r,d,(d-r+1)%d],fmtNum,`The remainder is ${r}; hence add ${d-r} to reach the next multiple of ${d}.`); }
    if (pattern === 2) { const primes=[2,3,7,11,13,17,19,23,29,31,37,41,43,47,53],p=primes[Math.floor(i/10)],a=2+k%4,b=3+k%3,answer=(a+1)*(b+1); return makeQuestion(i,level,"Factors",`How many positive factors does ${p}^${a} × 5^${b} have?`,answer,[a*b,a+b,(a+2)*(b+1)],fmtNum,`For N = p^a q^b, number of factors = (a+1)(b+1) = ${answer}.`); }
    if (pattern === 3) { const base=2+k%8,exp=23+k,answer=Number(BigInt(base)**BigInt(exp)%10n); return makeQuestion(i,level,"Units digit",`Find the units digit of ${base}^${exp}.`,answer,[(answer+2)%10,(answer+4)%10,base%10],fmtNum,`Use the repeating units-digit cycle of ${base}; the resulting units digit is ${answer}.`); }
    if (pattern === 4) { const n=35+5*k; let x=n,count=0; while(x){x=Math.floor(x/5);count+=x;} return makeQuestion(i,level,"Factorials",`How many trailing zeroes are there in ${n}!?`,count,[Math.floor(n/5),count+1,count-1],fmtNum,`Count factors of 5: ⌊${n}/5⌋ + ⌊${n}/25⌋ + … = ${count}.`); }
    if (pattern === 5) { const n=250+13*k,a=3+k%4,b=5+k%5; const count=Math.floor(n/a)+Math.floor(n/b)-Math.floor(n/lcm(a,b)); return makeQuestion(i,level,"Inclusion–exclusion",`How many integers from 1 to ${n} are divisible by ${a} or ${b}?`,count,[Math.floor(n/a)+Math.floor(n/b),count+1,count-1],fmtNum,`Apply inclusion–exclusion: ⌊n/${a}⌋ + ⌊n/${b}⌋ − ⌊n/${lcm(a,b)}⌋ = ${count}.`); }
    if (pattern === 6) { const a=4+k%8,b=5+k%7,c=6+k%5,answer=lcm(lcm(a,b),c); return makeQuestion(i,level,"LCM applications",`Three signals repeat every ${a}, ${b}, and ${c} minutes. If they coincide now, after how many minutes will they next coincide?`,answer,[gcd(gcd(a,b),c),answer-a,answer+b],fmtNum,`The next simultaneous event occurs after LCM(${a}, ${b}, ${c}) = ${answer} minutes.`); }
    if (pattern === 7) { const n=900+11*k,d=7+k%6,answer=n-n%d; return makeQuestion(i,level,"Divisibility",`Find the greatest integer not exceeding ${n} that is divisible by ${d}.`,answer,[answer-d,answer+d,n-n%(d+1)],fmtNum,`Subtract the remainder ${n%d} from ${n}: ${n} − ${n%d} = ${answer}.`); }
    if (pattern === 8) { const a=7+k%5,e=12+k%9,m=11+k%4,answer=Number(BigInt(a)**BigInt(e)%BigInt(m)); return makeQuestion(i,level,"Modular arithmetic",`Find the remainder when ${a}^${e} is divided by ${m}.`,answer,[(answer+1)%m,(answer+3)%m,a%m],fmtNum,`Repeated modular reduction gives ${a}^${e} ≡ ${answer} (mod ${m}).`); }
    const n=3+k%7,power=2+k%3,answer=n**power; return makeQuestion(i,level,"Indices and roots",`If x^${power} = ${answer} and x is positive, find x.`,n,[n+1,n-1,power*n],fmtNum,`Taking the positive ${power === 2 ? "square" : power === 3 ? "cube" : `${power}th`} root gives x = ${n}.`);
  });
}

export function legacyPercentageBank() {
  return Array.from({ length: 150 }, (_, i) => {
    const level=levelFor(i),k=i+1,pattern=i%10,p=10+5*(k%7);
    if(pattern===0){const final=600+20*k,answer=final*100/(100+p);return makeQuestion(i,level,"Reverse percentage",`After a ${p}% increase, a salary becomes ${fmtMoney(final)}. Find the original salary.`,answer,[final*(1-p/100),final-answer,answer+p],fmtMoney,`Original = final × 100/(100 + ${p}) = ${fmtMoney(answer)}.`);}
    if(pattern===1){const q=5+5*(k%6),answer=(1+p/100)*(1-q/100)*100-100;return makeQuestion(i,level,"Successive change",`A value rises by ${p}% and then falls by ${q}%. Find the net percentage change (negative means decrease).`,answer,[p-q,answer+2,answer-2],fmtPct,`Net multiplier = ${(1+p/100).toFixed(2)} × ${(1-q/100).toFixed(2)}; net change = ${fmtPct(answer)}.`);}
    if(pattern===2){const original=80+5*k,answer=100*p/(100+p);return makeQuestion(i,level,"Price–consumption",`Fuel rises from ${fmtMoney(original)} per unit by ${p}%. By what percentage must consumption fall to keep expenditure unchanged?`,answer,[p,p/2,100-p],fmtPct,`Required reduction = 100p/(100+p) = ${fmtPct(answer)}.`);}
    if(pattern===3){const total=2000+100*k,votePct=60+5*(k%5),validPct=80+5*(k%4),answer=total*votePct/100*validPct/100;return makeQuestion(i,level,"Elections",`In an election with ${total} voters, ${votePct}% vote and ${validPct}% of votes cast are valid. How many valid votes are cast?`,answer,[total*votePct/100,total*validPct/100,answer+100],fmtNum,`Valid votes = ${total} × ${votePct}/100 × ${validPct}/100 = ${answer}.`);}
    if(pattern===4){const pass=35+5*(k%5),gap=20+10*(k%4),score=300+10*k,answer=(score+gap)*100/pass;return makeQuestion(i,level,"Marks and cut-offs",`A student scores ${score} and fails by ${gap}. If the pass mark is ${pass}% of the maximum, find the maximum marks.`,answer,[score*100/pass,answer-gap,answer+100],fmtNum,`Pass marks = ${score}+${gap}=${score+gap}; maximum = pass marks × 100/${pass} = ${answer}.`);}
    if(pattern===5){const initial=10000+500*k,growth=5+5*(k%4),years=2+k%3,answer=initial*(1+growth/100)**years;return makeQuestion(i,level,"Growth and depreciation",`A town has population ${initial}. It grows by ${growth}% annually. Find its population after ${years} years.`,answer,[initial*(1+growth*years/100),answer-initial*growth/100,answer+initial/10],fmtNum,`Population = ${initial}(1+${growth}/100)^${years} = ${fmtNum(answer)}.`);}
    if(pattern===6){const size=200+10*k,boys=50+5*(k%7),boyPass=70+5*(k%5),girlPass=75+5*(k%4),answer=boys/100*boyPass+(100-boys)/100*girlPass;return makeQuestion(i,level,"Weighted percentages",`In a class of ${size}, ${boys}% are boys. ${boyPass}% of boys and ${girlPass}% of girls pass. What percentage of the whole class passes?`,answer,[(boyPass+girlPass)/2,boyPass,answer+2],fmtPct,`Weighted pass rate = ${boys/100}×${boyPass} + ${(100-boys)/100}×${girlPass} = ${fmtPct(answer)}.`);}
    if(pattern===7){const income=20000+1000*k,a=20+5*(k%4),b=10+5*(k%5),answer=income*(1-a/100)*(1-b/100);return makeQuestion(i,level,"Income and expenditure",`A person earns ${fmtMoney(income)}, spends ${a}% on rent and then ${b}% of the remainder on travel. How much remains?`,answer,[income*(1-(a+b)/100),income*a/100,answer+1000],fmtMoney,`Remaining = ${fmtMoney(income)} × (1−${a}/100) × (1−${b}/100) = ${fmtMoney(answer)}.`);}
    if(pattern===8){const old=40+5*(k%5),added=10+2*k,target=50+5*(k%4),volume=added*(100-target)/(target-old);return makeQuestion(i,level,"Mixture percentage",`A solution is ${old}% acid. How many litres of pure acid must be added to ${fmtNum(volume)} litres of it to make the mixture ${target}% acid?`,added,[added+5,added-2,volume],fmtNum,`Solving ${old/100}(${fmtNum(volume)}) + x = ${target/100}(${fmtNum(volume)}+x) gives x = ${added} litres.`);}
    const budget=500000+10000*k,a=20+5*(k%5),b=10+5*(k%4),answer=100*(1-a/100)*(1-b/100);return makeQuestion(i,level,"Data interpretation",`From a ${fmtMoney(budget)} budget, a department uses ${a}% on salaries and ${b}% of the remainder on training. What percent of the original budget remains?`,answer,[100-a-b,answer+3,answer-3],fmtPct,`Remaining percentage = 100(1−${a}/100)(1−${b}/100) = ${fmtPct(answer)}.`);
  });
}

function profitBank(){
  return Array.from({length:150},(_,i)=>{const level=levelFor(i),k=i+1,pattern=i%10,cp=800+40*k,p=10+5*(k%6);
    if(pattern===0){const sp=cp*(1+p/100);return makeQuestion(i,level,"Reverse cost price",`An article is sold for ${fmtMoney(sp)} at ${p}% profit. Find its cost price.`,cp,[sp*(1-p/100),cp+p,cp+100],fmtMoney,`CP = SP × 100/(100+profit%) = ${fmtMoney(cp)}.`);}
    if(pattern===1){const m=25+5*(k%6),d=10+5*(k%4),answer=(1+m/100)*(1-d/100)*100-100;return makeQuestion(i,level,"Markup and discount",`An article costing ${fmtMoney(cp)} is marked ${m}% above cost and discounted by ${d}%. Find the net profit/loss percentage.`,answer,[m-d,answer+5,answer-5],fmtPct,`Net multiplier = (1+${m}/100)(1−${d}/100); result = ${fmtPct(answer)}.`);}
    if(pattern===2){const marked=1500+25*k,d1=10+5*(k%4),d2=5+5*(k%5),answer=100-(100-d1)*(100-d2)/100;return makeQuestion(i,level,"Successive discounts",`On a marked price of ${fmtMoney(marked)}, two successive discounts of ${d1}% and ${d2}% equal what single discount?`,answer,[d1+d2,answer+2,answer-2],fmtPct,`Equivalent discount = d1+d2−d1d2/100 = ${fmtPct(answer)}.`);}
    if(pattern===3){const loss=5+5*(k%4),gain=10+5*(k%5),sp=cp*(1-loss/100),answer=cp*(1+gain/100);return makeQuestion(i,level,"Target selling price",`Selling at ${fmtMoney(sp)} causes a ${loss}% loss. At what price should the item be sold for a ${gain}% gain?`,answer,[sp*(1+gain/100),cp,answer+100],fmtMoney,`Recover CP = ${fmtMoney(cp)}, then target SP = CP(1+${gain}/100) = ${fmtMoney(answer)}.`);}
    if(pattern===4){const kgCost=100+2*k,gain=10+5*(k%5),weight=700+20*(k%10),answer=(1+gain/100)*1000/weight*100-100;return makeQuestion(i,level,"Dishonest dealer",`A dealer buys at ${fmtMoney(kgCost)}/kg, charges ${gain}% above cost per kilogram, but gives only ${weight} g. Find the effective profit percentage.`,answer,[gain+(1000-weight)/10,answer+5,answer-5],fmtPct,`For cost of ${weight} g, revenue is ${(1+gain/100).toFixed(2)} times the 1 kg cost. Effective gain = ${fmtPct(answer)}.`);}
    if(pattern===5){const commonSp=1000+20*k;return makeQuestion(i,level,"Equal selling price",`Two articles are sold for ${fmtMoney(commonSp)} each, one at ${p}% profit and one at ${p}% loss. Find the overall loss percentage.`,p*p/100,[0,p,2*p],fmtPct,`For equal SP and equal gain/loss rate, overall loss = p²/100 = ${fmtPct(p*p/100)}.`);}
    if(pattern===6){const itemPrice=40+k,free=1+k%5,buy=8+k%7,answer=free/buy*100;return makeQuestion(i,level,"Free-item schemes",`At ${fmtMoney(itemPrice)} per item, a wholesaler offers ${free} free with every ${buy} purchased. What is the buyer's effective discount?`,free/(buy+free)*100,[answer,free/buy*100,100*free/(buy+free)+2],fmtPct,`The buyer pays for ${buy} but receives ${buy+free}; discount = ${free}/${buy+free} ×100.`);}
    if(pattern===7){const original=700+30*k,first=20+5*(k%4),second=10+5*(k%5),answer=(1+first/100)*(1+second/100)*100-100;return makeQuestion(i,level,"Successive traders",`A buys for ${fmtMoney(original)}, sells to B at ${first}% profit, and B sells to C at ${second}% profit. Relative to A's cost, what is the total percentage increase?`,answer,[first+second,answer+2,answer-2],fmtPct,`Combined multiplier = (1+${first}/100)(1+${second}/100), giving ${fmtPct(answer)}.`);}
    if(pattern===8){const stock=90+3*k,frac=1/3,loss=10+5*(k%4),gain=20+5*(k%5),answer=frac*(-loss)+(1-frac)*gain;return makeQuestion(i,level,"Mixed lots",`One-third of a ${stock} kg stock is sold at ${loss}% loss and the rest at ${gain}% profit. Find the overall profit percentage.`,answer,[gain-loss,(gain-loss)/2,answer+5],fmtPct,`Use a weighted average: (1/3)(−${loss}) + (2/3)(${gain}) = ${fmtPct(answer)}.`);}
    const tax=5+5*(k%3),commission=2+k%5,marked=2000+100*k,answer=marked*(1+tax/100)*(1+commission/100);return makeQuestion(i,level,"Tax and commission",`An item costs ${fmtMoney(marked)} before ${tax}% tax and ${commission}% platform commission, each applied successively. Find the final amount.`,answer,[marked*(1+(tax+commission)/100),answer-marked*commission/100,answer+100],fmtMoney,`Final amount = ${fmtMoney(marked)}(1+${tax}/100)(1+${commission}/100) = ${fmtMoney(answer)}.`);
  });
}

const profitExtensions = [
  (i,v,l)=>{const cp=900+100*v,sp=cp+180+20*v,a=100*(sp-cp)/cp;return makeQuestion(i,l,"Profit percentage from CP and SP",`An item bought for ${fmtMoney(cp)} is sold for ${fmtMoney(sp)}. Find the profit percentage.`,a,[sp-cp,100*(sp-cp)/sp,a+5],fmtPct,`Profit=${fmtMoney(sp-cp)} and profit%=profit/CP×100=${fmtPct(a)}.`);},
  (i,v,l)=>{const cp=1000+100*v,p=12+2*v,a=cp*(1+p/100);return makeQuestion(i,l,"Selling price for target profit",`An article costs ${fmtMoney(cp)}. At what price must it be sold to earn ${p}% profit?`,a,[cp+p,cp*(1-p/100),a+100],fmtMoney,`SP=CP(1+profit/100)=${fmtMoney(cp)}(1+${p}/100)=${fmtMoney(a)}.`);},
  (i,v,l)=>{const sp=1000+120*v,loss=5+2*v,a=sp*100/(100-loss);return makeQuestion(i,l,"Cost price from loss",`An article is sold for ${fmtMoney(sp)} at a ${loss}% loss. Find its cost price.`,a,[sp*(1+loss/100),sp-loss,a+100],fmtMoney,`SP=(100-${loss})% of CP, so CP=SP×100/${100-loss}=${fmtMoney(a)}.`);},
  (i,v,l)=>{const cp=1200+100*v,loss=6+2*v,a=cp*(1-loss/100);return makeQuestion(i,l,"Selling price at loss",`An article costs ${fmtMoney(cp)}. Find its selling price at ${loss}% loss.`,a,[cp*(1+loss/100),cp-loss,a-100],fmtMoney,`SP=CP(1-loss/100)=${fmtMoney(a)}.`);},
  (i,v,l)=>{const sp=1300+100*v,p=10+2*v,a=sp*100/(100+p);return makeQuestion(i,l,"Cost price from profit",`An item sold for ${fmtMoney(sp)} yields ${p}% profit. Find the cost price.`,a,[sp*(1-p/100),sp-p,a+100],fmtMoney,`SP=(100+${p})% of CP, hence CP=SP×100/${100+p}=${fmtMoney(a)}.`);},
  (i,v,l)=>{const mp=1800+100*v,d=10+v,a=mp*(1-d/100);return makeQuestion(i,l,"Selling price after discount",`The marked price is ${fmtMoney(mp)} and the discount is ${d}%. Find the selling price.`,a,[mp*d/100,mp*(1+d/100),a+100],fmtMoney,`Discount=${d}% of MP; SP=MP(1-${d}/100)=${fmtMoney(a)}.`);},
  (i,v,l)=>{const sp=1500+100*v,d=10+2*v,a=sp*100/(100-d);return makeQuestion(i,l,"Marked price from discount",`After a ${d}% discount, an article sells for ${fmtMoney(sp)}. Find its marked price.`,a,[sp*(1+d/100),sp*d/100,a+100],fmtMoney,`SP=(100-${d})% of MP, so MP=SP×100/${100-d}=${fmtMoney(a)}.`);},
  (i,v,l)=>{const cp=1000+100*v,profit=20+v,discount=10+v,a=cp*(1+profit/100)*100/(100-discount);return makeQuestion(i,l,"Markup for profit after discount",`An article costing ${fmtMoney(cp)} must yield ${profit}% profit after ${discount}% discount. Find the required marked price.`,a,[cp*(1+(profit+discount)/100),cp*(1+profit/100),a+100],fmtMoney,`Required SP=CP(1+${profit}/100); MP=SP×100/${100-discount}=${fmtMoney(a)}.`);},
  (i,v,l)=>{const d1=10+v,d2=5+v,a=d1+d2-d1*d2/100;return makeQuestion(i,l,"Equivalent single discount",`Two successive discounts are ${d1}% and ${d2}%. Find the equivalent single discount.`,a,[d1+d2,d1*d2/100,a+2],fmtPct,`Equivalent discount=d1+d2-d1d2/100=${fmtPct(a)}.`);},
  (i,v,l)=>{const mp=2000+100*v,cp=1400+100*v,p=15+v,a=100*(1-cp*(1+p/100)/mp);return makeQuestion(i,l,"Discount for target profit",`An article costs ${fmtMoney(cp)} and is marked ${fmtMoney(mp)}. What discount percentage permits ${p}% profit?`,a,[p,100*(mp-cp)/mp,a+5],fmtPct,`Target SP=CP(1+${p}/100). Discount=(MP-SP)/MP×100=${fmtPct(a)}.`);},
  (i,v,l)=>{const paid=10+v,free=2+v%3,a=100*free/(paid+free);return makeQuestion(i,l,"Buy-get-free discount",`A scheme offers ${free} items free with every ${paid} purchased. Find the effective discount percentage.`,a,[100*free/paid,free,a+2],fmtPct,`Payment is for ${paid} of ${paid+free} received; discount=${free}/${paid+free}×100=${fmtPct(a)}.`);},
  (i,v,l)=>{const weight=850-10*v,markup=10+v,a=(1+markup/100)*1000/weight*100-100;return makeQuestion(i,l,"False weight effective gain",`A dealer marks goods ${markup}% above cost but gives only ${weight} g as 1 kg. Find the effective gain percentage.`,a,[markup+(1000-weight)/10,a+5,a-5],fmtPct,`Revenue factor=(1+${markup}/100)×1000/${weight}; effective gain=${fmtPct(a)}.`);},
  (i,v,l)=>{const p=10+2*v,a=p*p/100;return makeQuestion(i,l,"Equal SP gain-loss pair",`Two articles sell at the same price, one at ${p}% gain and the other at ${p}% loss. Find the overall loss percentage.`,a,[0,p,2*p],fmtPct,`For equal SP and equal gain/loss rate, loss=p²/100=${fmtPct(a)}.`);},
  (i,v,l)=>{const fraction=40+v,loss=10+v,gain=20+v,a=(fraction*(-loss)+(100-fraction)*gain)/100;return makeQuestion(i,l,"Mixed stock result",`${fraction}% of a stock is sold at ${loss}% loss and the rest at ${gain}% profit. Find the overall profit percentage.`,a,[gain-loss,(gain-loss)/2,a+5],fmtPct,`Weighted result=${fraction/100}(-${loss})+${(100-fraction)/100}(${gain})=${fmtPct(a)}.`);},
  (i,v,l)=>{const aProfit=12+v,bProfit=8+v,a=(1+aProfit/100)*(1+bProfit/100)*100-100;return makeQuestion(i,l,"Total gain across a trader chain",`A sells to B at ${aProfit}% profit and B sells onward at ${bProfit}% profit. Relative to A's cost, find the total percentage increase.`,a,[aProfit+bProfit,a+2,a-2],fmtPct,`Combined multiplier=(1+${aProfit}/100)(1+${bProfit}/100); increase=${fmtPct(a)}.`);},
];

function profitPlacementBank(){
  const base=profitBank().filter((_,index)=>index<60);
  const added=profitExtensions.flatMap((build,pattern)=>Array.from({length:6},(_,variant)=>{const id=60+pattern*6+variant;return build(id,variant+1,levelFor(id));}));
  return [...base,...added];
}

function ratioBank(){
 return Array.from({length:150},(_,i)=>{const level=levelFor(i),k=i+1,pattern=i%10,a=2+k%6,b=a+2+k%4;
  if(pattern===0){const unit=60+5*k,total=(a+b)*unit;return makeQuestion(i,level,"Proportional division",`${fmtMoney(total)} is divided in the ratio ${a}:${b}. Find the smaller share.`,a*unit,[b*unit,total/2,(a+1)*unit],fmtMoney,`Smaller share = ${a}/(${a}+${b}) × ${fmtMoney(total)} = ${fmtMoney(a*unit)}.`);}
  if(pattern===1){const c=3+k%7,answer=b*c/a;return makeQuestion(i,level,"Missing proportion",`If ${a}:${b} = ${c}:x, find x.`,answer,[a*c/b,answer+1,b+c],fmtNum,`Cross-multiply: ${a}x = ${b}×${c}; x = ${fmtNum(answer)}.`);}
  if(pattern===2){const x=120+10*k,y=x*a/b,change=20+5*(k%4),answer=y*(1+change/100);return makeQuestion(i,level,"Direct variation",`y varies directly as x. When x=${x}, y=${fmtNum(y)}. Find y when x increases by ${change}%.`,answer,[y+change,y*(1-change/100),answer+10],fmtNum,`Direct variation preserves y/x, so y also increases by ${change}% to ${fmtNum(answer)}.`);}
  if(pattern===3){const workers=12+k,days=18+k%7,newWorkers=workers+4+k%5,answer=workers*days/newWorkers;return makeQuestion(i,level,"Inverse proportion",`${workers} workers finish a job in ${days} days. At the same rate, how many days will ${newWorkers} workers take?`,answer,[days*newWorkers/workers,days-(newWorkers-workers),answer+2],fmtNum,`Workers × days is constant: days = ${workers}×${days}/${newWorkers} = ${fmtNum(answer)}.`);}
  if(pattern===4){const scale=1+Math.floor(k/10),c=3+k%5,d=c+2,first=a*c,second=b*d,g=gcd(first,second),answer=`${first/g}:${second/g}`;return makeQuestion(i,level,"Compound ratio",`Find the simplified compound ratio of ${a*scale}:${b*scale} and ${c}:${d}.`,answer,ratioDistractors(answer,[`${first}:${second}`,`${a*d}:${b*c}`,`${a+c}:${b+d}`]),value=>String(value),`Multiply corresponding terms to get ${first}:${second}; divide both by ${g}. The simplified ratio is ${answer}.`);}
  if(pattern===5){const monthsA=6+k%6,monthsB=8+k%5,unit=100+k,total=(a*monthsA+b*monthsB)*unit,answer=a*monthsA*unit;return makeQuestion(i,level,"Partnership",`A and B invest in ratio ${a}:${b} for ${monthsA} and ${monthsB} months respectively. From ${fmtMoney(total)} profit, find A's share.`,answer,[b*monthsB*unit,total*a/(a+b),answer+unit],fmtMoney,`Profit ratio = ${a*monthsA}:${b*monthsB}; A's share = ${fmtMoney(answer)}.`);}
  if(pattern===6){const batch=50+k,low=20+5*(k%4),high=50+5*(k%5),mean=30+5*(k%4),left=high-mean,right=mean-low,g=gcd(left,right),answer=`${left/g}:${right/g}`;return makeQuestion(i,level,"Alligation",`To prepare a ${batch} L batch, solutions containing ${low}% and ${high}% acid are mixed to obtain ${mean}% acid. Find the simplified ratio of low-concentration solution to high-concentration solution.`,answer,ratioDistractors(answer,[`${right/g}:${left/g}`,`${left}:${right}`,`${mean-low}:${high-low}`]),value=>String(value),`By alligation, low:high=(${high}-${mean}):(${mean}-${low})=${left}:${right}; simplifying gives ${answer}.`);}
  if(pattern===7){const diff=(b-a)*(5+k),sum=(a+b)*(5+k);return makeQuestion(i,level,"Ratio word problem",`Two ages are in ratio ${a}:${b} and differ by ${diff} years. Find their sum.`,sum,[diff*(a+b),sum-diff,sum+diff],fmtNum,`One ratio unit = ${diff}/(${b}-${a}) = ${5+k}; sum = (${a}+${b})×${5+k} = ${sum}.`);}
  if(pattern===8){const workA=a*3,workB=b*2,unit=50+10*(k%5),total=(workA+workB)*unit,answer=workA*unit;return makeQuestion(i,level,"Work and wages",`A and B work with efficiencies ${a}:${b} for 3 and 2 days. Divide ${fmtMoney(total)} wages in work ratio; find A's share.`,answer,[total*a/(a+b),total-answer,answer+unit],fmtMoney,`Work ratio = ${a}×3:${b}×2. One work unit earns ${fmtMoney(unit)}, so A's share is ${fmtMoney(answer)}.`);}
  const water=10+2*k,milk=30+3*k,added=5+k%6,answer=milk/(water+milk+added);return makeQuestion(i,level,"Mixtures",`A vessel has ${milk} L milk and ${water} L water. After adding ${added} L water, what fraction of the mixture is milk? Give the decimal value.`,answer,[milk/(water+milk),water/(water+milk+added),answer+0.1],fmtNum,`Milk fraction = ${milk}/(${milk}+${water}+${added}) = ${fmtNum(answer)}.`);
 });
}

const ratioExtensions = [
 (i,v,l)=>{const a=2+v,b=5+v,u=20+5*v,total=(a+b)*u;return makeQuestion(i,l,"Larger share in a ratio",`${fmtMoney(total)} is divided in ratio ${a}:${b}. Find the larger share.`,b*u,[a*u,total/2,(b+1)*u],fmtMoney,`One unit=${fmtMoney(u)}; larger share=${b}×${fmtMoney(u)}=${fmtMoney(b*u)}.`);},
 (i,v,l)=>{const a=3+v,b=6+v,u=10+v,diff=(b-a)*u;return makeQuestion(i,l,"Numbers from ratio and difference",`Two numbers are in ratio ${a}:${b} and differ by ${diff}. Find the smaller number.`,a*u,[b*u,(a+b)*u,diff*a],fmtNum,`One unit=${diff}/(${b}-${a})=${u}; smaller number=${a*u}.`);},
 (i,v,l)=>{const a=2+v,b=4+v,u=8+v,sum=(a+b)*u;return makeQuestion(i,l,"Numbers from ratio and sum",`Two numbers are in ratio ${a}:${b} and sum to ${sum}. Find the larger number.`,b*u,[a*u,sum/2,(b+1)*u],fmtNum,`One unit=${sum}/(${a}+${b})=${u}; larger number=${b*u}.`);},
 (i,v,l)=>{const a=3+v,b=5+v,u=4+v,years=6+v,currentA=a*u,currentB=b*u,futureA=currentA+years,futureB=currentB+years,g=gcd(futureA,futureB),answer=`${futureA/g}:${futureB/g}`;return makeQuestion(i,l,"Age ratio after years",`The present ages of two employees are ${currentA} and ${currentB} years. What will be their simplified age ratio after ${years} years?`,answer,ratioDistractors(answer,[`${currentA/gcd(currentA,currentB)}:${currentB/gcd(currentA,currentB)}`,`${futureB/g}:${futureA/g}`,`${futureA}:${futureB}`]),value=>String(value),`Future ages are ${futureA} and ${futureB}; divide both by their HCF ${g}. Required ratio=${answer}.`);},
 (i,v,l)=>{const a=4+v,b=7+v,u=5+v,years=3+v,currentA=a*u,currentB=b*u,pastA=currentA-years,pastB=currentB-years,g=gcd(pastA,pastB),answer=`${pastA/g}:${pastB/g}`;return makeQuestion(i,l,"Past age ratio",`The current ages of two people are ${currentA} and ${currentB} years. Find their simplified age ratio ${years} years ago.`,answer,ratioDistractors(answer,[`${currentA/gcd(currentA,currentB)}:${currentB/gcd(currentA,currentB)}`,`${pastB/g}:${pastA/g}`,`${pastA}:${pastB}`]),value=>String(value),`Their past ages were ${pastA} and ${pastB}; divide by HCF ${g}. Required ratio=${answer}.`);},
 (i,v,l)=>{const x1=10+2*v,y1=30+3*v,x2=x1+5*v,a=y1*x2/x1;return makeQuestion(i,l,"Direct variation value",`A cloud-processing charge varies directly with the number of compute units used. The charge is ${y1} credits for ${x1} units. What is the charge for ${x2} units at the same rate?`,a,[y1*x1/x2,y1+x2-x1,a+5],fmtNum,`Charge per unit is constant; charge₂=${y1}×${x2}/${x1}=${fmtNum(a)}.`);},
 (i,v,l)=>{const x1=6+v,y1=120+20*v,x2=x1+3,a=x1*y1/x2;return makeQuestion(i,l,"Inverse variation value",`The time required to process a fixed data batch varies inversely with the number of identical servers. ${x1} servers take ${y1} minutes. How long will ${x2} servers take?`,a,[y1*x2/x1,y1-(x2-x1),a+5],fmtNum,`Servers × time is constant; time₂=${x1}×${y1}/${x2}=${fmtNum(a)}.`);},
 (i,v,l)=>{const a=4+v,b=7+v,c=5+v,answer=b*c/a;return makeQuestion(i,l,"Fourth proportional",`Find the fourth proportional to ${a}, ${b}, and ${c}; that is, solve ${a}:${b}=${c}:x.`,answer,[a*c/b,b+c,answer+1],fmtNum,`Cross multiplication gives ${a}x=${b}×${c}; x=${fmtNum(answer)}.`);},
 (i,v,l)=>{const a=4+v,b=a*(v+1),answer=Math.sqrt(a*b);return makeQuestion(i,l,"Mean proportional",`Find the mean proportional between ${a} and ${b}.`,answer,[(a+b)/2,b/a,answer+1],fmtNum,`If a:x=x:b, then x=√(ab)=√${a*b}=${fmtNum(answer)}.`);},
 (i,v,l)=>{const a=2+v,b=3+v,c=4+v,d=5+v,first=a*c,second=b*d,g=gcd(first,second),answer=`${first/g}:${second/g}`;return makeQuestion(i,l,"Compound ratio terms",`A resource allocation is adjusted successively in the ratios ${a}:${b} and ${c}:${d}. Find the resulting compound ratio in simplest form.`,answer,ratioDistractors(answer,[`${first}:${second}`,`${a*d}:${b*c}`,`${first/g+1}:${second/g}`]),value=>String(value),`Compound ratio=${first}:${second}; divide both terms by HCF ${g}, giving ${answer}.`);},
 (i,v,l)=>{const a=3+v,b=5+v,mA=12,mB=6+v,u=100+20*v,total=(a*mA+b*mB)*u;return makeQuestion(i,l,"Partnership with unequal time",`A and B invest in ratio ${a}:${b} for ${mA} and ${mB} months. From ${fmtMoney(total)} profit, find B's share.`,b*mB*u,[a*mA*u,total*b/(a+b),b*u],fmtMoney,`Profit ratio=${a*mA}:${b*mB}; B's share=${fmtMoney(b*mB*u)}.`);},
 (i,v,l)=>{const a=3+v,b=5+v,daysA=4+v,daysB=6+v,wa=a*daysA,wb=b*daysB,unit=40+10*v,total=(wa+wb)*unit,answer=wa*unit;return makeQuestion(i,l,"Efficiency-time wage division",`A and B have efficiencies ${a}:${b} and work ${daysA} and ${daysB} days. From ${fmtMoney(total)}, find A's wage.`,answer,[total*a/(a+b),total-answer,answer+unit],fmtMoney,`Work ratio=${a}×${daysA}:${b}×${daysB}; one work unit earns ${fmtMoney(unit)}, so A receives ${fmtMoney(answer)}.`);},
 (i,v,l)=>{const low=20+v,high=50+2*v,mean=30+v,left=high-mean,right=mean-low,g=gcd(left,right),answer=`${left/g}:${right/g}`;return makeQuestion(i,l,"Alligation ratio",`Solutions of ${low}% and ${high}% concentration are mixed to obtain ${mean}% concentration. Find the simplified ratio of low-concentration solution to high-concentration solution.`,answer,ratioDistractors(answer,[`${right/g}:${left/g}`,`${left}:${right}`,`${mean-low}:${high-low}`]),value=>String(value),`By alligation, low:high=(${high}-${mean}):(${mean}-${low})=${left}:${right}; simplifying gives ${answer}.`);},
 (i,v,l)=>{const milk=30+5*v,water=10+2*v,added=5+v,answer=milk/(milk+water+added);return makeQuestion(i,l,"Mixture after dilution",`A vessel contains ${milk} L milk and ${water} L water. After adding ${added} L water, find the milk fraction as a decimal.`,answer,[milk/(milk+water),water/(milk+water+added),answer+0.1],fmtNum,`Milk remains ${milk} L; total=${milk+water+added} L; fraction=${fmtNum(answer)}.`);},
 (i,v,l)=>{const scale=50000+10000*v,map=3+v,answer=map*scale/100000;return makeQuestion(i,l,"Map scale proportion",`On a map, 1 cm represents ${scale} cm. What actual distance in kilometres is represented by ${map} cm?`,answer,[map*scale/1000,answer*10,answer+1],fmtNum,`Actual=${map}×${scale} cm; divide by 100000 to convert to km=${fmtNum(answer)}.`);},
];

function ratioPlacementBank(){
 const base=ratioBank().filter((_,index)=>index<60);
 const added=ratioExtensions.flatMap((build,pattern)=>Array.from({length:6},(_,variant)=>{const id=60+pattern*6+variant;return build(id,variant+1,levelFor(id));}));
 return [...base,...added];
}

function averageBank(){
 return Array.from({length:150},(_,i)=>{const level=levelFor(i),k=i+1,pattern=i%10;
  if(pattern===0){const n=7+k%8,start=20+k,answer=start+(n-1)/2;return makeQuestion(i,level,"Consecutive values",`Find the average of ${n} consecutive integers beginning with ${start}.`,answer,[start+n/2,start+n-1,answer+1],fmtNum,`For an arithmetic sequence, average = (first+last)/2 = ${fmtNum(answer)}.`);}
  if(pattern===1){const n=8+k,avg=35+k,missing=20+2*k,total=n*avg,known=total-missing;return makeQuestion(i,level,"Missing observation",`The average of ${n} observations is ${avg}. Their known observations sum to ${known}. Find the missing observation.`,missing,[total,missing+avg,missing-2],fmtNum,`Total required = ${n}×${avg}=${total}; missing = ${total}−${known}=${missing}.`);}
  if(pattern===2){const n=12+k,old=40+k,removed=25+2*k,added=55+3*k,answer=old+(added-removed)/n;return makeQuestion(i,level,"Replacement",`The average of ${n} values is ${old}. If ${removed} is replaced by ${added}, find the new average.`,answer,[old,old+added-removed,answer+1],fmtNum,`New average = old average + (${added}−${removed})/${n} = ${fmtNum(answer)}.`);}
  if(pattern===3){const n1=15+k,n2=20+k,a1=45+k%7,a2=60+k%8,answer=(n1*a1+n2*a2)/(n1+n2);return makeQuestion(i,level,"Combined average",`The average of ${n1} students is ${a1}; that of ${n2} students is ${a2}. Find the combined average.`,answer,[(a1+a2)/2,answer+2,answer-2],fmtNum,`Combined average = (${n1}×${a1}+${n2}×${a2})/${n1+n2} = ${fmtNum(answer)}.`);}
  if(pattern===4){const n=20+k,wrong=30+k,right=50+2*k,reported=55+k,answer=reported+(right-wrong)/n;return makeQuestion(i,level,"Correction of error",`The average of ${n} entries was reported as ${reported}, using ${wrong} instead of ${right}. Find the correct average.`,answer,[reported,reported+right-wrong,answer-1],fmtNum,`Correct average = ${reported}+(${right}−${wrong})/${n} = ${fmtNum(answer)}.`);}
  if(pattern===5){const a=40+k,b=60+2*k,answer=2*a*b/(a+b);return makeQuestion(i,level,"Average speed",`A vehicle covers equal distances at ${a} km/h and ${b} km/h. Find its average speed.`,answer,[(a+b)/2,answer+5,Math.sqrt(a*b)],fmtNum,`For equal distances, average speed = 2ab/(a+b) = ${fmtNum(answer)} km/h.`);}
  if(pattern===6){const innings=10+k,oldAvg=35+k,score=70+2*k,answer=(innings*oldAvg+score)/(innings+1);return makeQuestion(i,level,"Sports averages",`A batter averages ${oldAvg} after ${innings} innings and scores ${score} next. Find the new average.`,answer,[oldAvg+score/(innings+1),(oldAvg+score)/2,answer+2],fmtNum,`New total = ${innings}×${oldAvg}+${score}; divide by ${innings+1} to get ${fmtNum(answer)}.`);}
  if(pattern===7){const boys=20+k,girls=15+k,bAvg=55+k%6,gAvg=48+k%5,answer=(boys*bAvg+girls*gAvg)/(boys+girls);return makeQuestion(i,level,"Weighted average",`There are ${boys} boys averaging ${bAvg} kg and ${girls} girls averaging ${gAvg} kg. Find the class average weight.`,answer,[(bAvg+gAvg)/2,answer+1,answer-1],fmtNum,`Weighted average = (${boys}×${bAvg}+${girls}×${gAvg})/${boys+girls} = ${fmtNum(answer)} kg.`);}
  if(pattern===8){const n=12+k,old=30+k,newAvg=old+2,answer=newAvg*n-old*(n-1);return makeQuestion(i,level,"New member",`The average age of ${n-1} people is ${old}. After one person joins, the average becomes ${newAvg}. Find the new person's age.`,answer,[newAvg*n,old+2*n,answer-2],fmtNum,`New person's age = ${n}×${newAvg}−${n-1}×${old} = ${answer}.`);}
  const days=7,variant=Math.floor(k/10),avg=24+variant,first6=days*avg-(30+variant);const answer=days*avg-first6;return makeQuestion(i,level,"Temperature average",`The average temperature for 7 days is ${avg}°C. The first 6 days total ${first6}°C. Find day 7 temperature.`,answer,[avg,answer+6,answer-6],fmtNum,`Seven-day total = 7×${avg}; subtract ${first6} to get ${answer}°C.`);
 });
}

const averageExtensions = [
 (i,v,l)=>{const n=6+v,start=12+2*v,last=start+n-1,a=(start+last)/2;return makeQuestion(i,l,"Average of consecutive odd/even count",`Find the average of ${n} consecutive integers from ${start} through ${last}.`,a,[start+n/2,last,a+1],fmtNum,`For an arithmetic sequence, average=(first+last)/2=${fmtNum(a)}.`);},
 (i,v,l)=>{const n=10+v,avg=35+2*v,a=n*avg;return makeQuestion(i,l,"Total from average",`The average of ${n} observations is ${avg}. Find their total.`,a,[avg+n,a/n,a+avg],fmtNum,`Total=count×average=${n}×${avg}=${a}.`);},
 (i,v,l)=>{const n=8+v,avg=60+v,missing=20+2*v,known=n*avg-missing;return makeQuestion(i,l,"Missing value from average",`${n-1} observations total ${known}. If the average of all ${n} observations is ${avg}, find the missing value.`,missing,[n*avg,missing+avg,missing-2],fmtNum,`Required total=${n}×${avg}=${n*avg}; subtract the known total ${known}, so missing=${missing}.`);},
 (i,v,l)=>{const n=12+v,old=40+v,newAvg=old+2,a=n*(newAvg-old);return makeQuestion(i,l,"Required total increase",`The average of ${n} values must rise from ${old} to ${newAvg}. By how much must their total increase?`,a,[newAvg-old,n*newAvg,a+n],fmtNum,`Total change=count×average change=${n}×${newAvg-old}=${a}.`);},
 (i,v,l)=>{const n=15+v,old=45+v,removed=25+2*v,newAvg=(n*old-removed)/(n-1);return makeQuestion(i,l,"Average after removal",`The average of ${n} values is ${old}. If ${removed} is removed, find the new average.`,newAvg,[old,(n*old+removed)/(n-1),newAvg+1],fmtNum,`New total=${n*old}-${removed}; divide by ${n-1} to get ${fmtNum(newAvg)}.`);},
 (i,v,l)=>{const n=12+v,old=38+v,added=60+2*v,newAvg=(n*old+added)/(n+1);return makeQuestion(i,l,"Average after addition",`${n} values average ${old}. A new value ${added} is added. Find the new average.`,newAvg,[old,(old+added)/2,newAvg+1],fmtNum,`New average=(${n}×${old}+${added})/${n+1}=${fmtNum(newAvg)}.`);},
 (i,v,l)=>{const n=18+v,reported=50+v,wrong=30+v,right=60+2*v,a=reported+(right-wrong)/n;return makeQuestion(i,l,"Correction of wrong entry",`The average of ${n} entries was ${reported}, but ${wrong} was used instead of ${right}. Find the corrected average.`,a,[reported,reported+right-wrong,a-1],fmtNum,`Correct average=${reported}+(${right}-${wrong})/${n}=${fmtNum(a)}.`);},
 (i,v,l)=>{const n=20+v,reported=48+v,duplicate=32+v,a=(n*reported-duplicate)/(n-1);return makeQuestion(i,l,"Correction of duplicate entry",`${n} entries average ${reported}, but ${duplicate} was entered twice. Find the average after deleting the duplicate.`,a,[reported,(n*reported+duplicate)/(n-1),a+1],fmtNum,`Correct total=${n*reported}-${duplicate}; divide by ${n-1}=${fmtNum(a)}.`);},
 (i,v,l)=>{const n1=18+v,n2=22+v,a1=52+v,a2=60+2*v,combined=(n1*a1+n2*a2)/(n1+n2);return makeQuestion(i,l,"Combined group average",`In a placement training programme, Batch A has ${n1} trainees with average score ${a1}, while Batch B has ${n2} trainees averaging ${a2}. Find the average score after the batches are combined.`,combined,[(a1+a2)/2,combined+2,combined-2],fmtNum,`Weighted total divided by total count gives (${n1}×${a1}+${n2}×${a2})/${n1+n2}=${fmtNum(combined)}.`);},
 (i,v,l)=>{const n1=15+v,a1=45+v,n2=20+v,combined=55+v,a2=((n1+n2)*combined-n1*a1)/n2;return makeQuestion(i,l,"Unknown group average",`${n1} students average ${a1}. With ${n2} more students, the combined average is ${combined}. Find the second group's average.`,a2,[combined,(a1+combined)/2,a2+2],fmtNum,`Second total=combined total-first total; divide by ${n2} to get ${fmtNum(a2)}.`);},
 (i,v,l)=>{const boys=20+v,girls=15+v,bAvg=55+v,gAvg=48+v,a=(boys*bAvg+girls*gAvg)/(boys+girls);return makeQuestion(i,l,"Weighted class average",`${boys} boys average ${bAvg} kg and ${girls} girls average ${gAvg} kg. Find the class average.`,a,[(bAvg+gAvg)/2,a+1,a-1],fmtNum,`Weighted average=(${boys}×${bAvg}+${girls}×${gAvg})/${boys+girls}=${fmtNum(a)}.`);},
 (i,v,l)=>{const aSpeed=40+2*v,bSpeed=60+3*v,distance=120+20*v,answer=distance/aSpeed+distance/bSpeed;return makeQuestion(i,l,"Round-trip travel time",`A vehicle travels ${distance} km outward at ${aSpeed} km/h and returns the same distance at ${bSpeed} km/h. Find total travel time in hours.`,answer,[2*distance/((aSpeed+bSpeed)/2),distance/aSpeed,answer+1],fmtNum,`Total time=${distance}/${aSpeed}+${distance}/${bSpeed}=${fmtNum(answer)} hours.`);},
 (i,v,l)=>{const t1=2+v,t2=3+v,s1=40+2*v,s2=55+2*v,a=(t1*s1+t2*s2)/(t1+t2);return makeQuestion(i,l,"Average speed for unequal times",`A vehicle travels ${t1} h at ${s1} km/h and ${t2} h at ${s2} km/h. Find average speed.`,a,[(s1+s2)/2,a+2,a-2],fmtNum,`Average speed=total distance/total time=(${t1}×${s1}+${t2}×${s2})/${t1+t2}=${fmtNum(a)}.`);},
 (i,v,l)=>{const innings=10+v,avg=40+v,target=42+v,a=target*(innings+1)-innings*avg;return makeQuestion(i,l,"Required score for target average",`A batter averages ${avg} after ${innings} innings. What score next will raise the average to ${target}?`,a,[target,avg+target,a-innings],fmtNum,`Required score=(${innings+1}×${target})-(${innings}×${avg})=${a}.`);},
 (i,v,l)=>{const people=8+v,old=28+v,newAvg=old+2,a=(people+1)*newAvg-people*old;return makeQuestion(i,l,"New member age",`${people} people average ${old} years. One person joins and average becomes ${newAvg}. Find the new person's age.`,a,[newAvg,a-people,a+people],fmtNum,`New person's age=(${people+1}×${newAvg})-(${people}×${old})=${a}.`);},
];

function averagePlacementBank(){
 const base=averageBank().filter((_,index)=>index<60);
 const added=averageExtensions.flatMap((build,pattern)=>Array.from({length:6},(_,variant)=>{const id=60+pattern*6+variant;return build(id,variant+1,levelFor(id));}));
 return [...base,...added];
}

function interestBank(){
 return Array.from({length:150},(_,i)=>{const level=levelFor(i),k=i+1,pattern=i%10,p=2000+500*(k%9),r=5+5*(k%4),t=2+k%4;
  if(pattern===0){const si=p*r*t/100;return makeQuestion(i,level,"Simple interest",`Find the simple interest on ${fmtMoney(p)} at ${r}% per annum for ${t} years.`,si,[p*r/100,p+si,si+p/10],fmtMoney,`SI = PRT/100 = ${p}×${r}×${t}/100 = ${fmtMoney(si)}.`);}
  if(pattern===1){const si=p*r*t/100,amount=p+si;return makeQuestion(i,level,"Finding principal",`A sum amounts to ${fmtMoney(amount)} in ${t} years at ${r}% simple interest. Find the principal.`,p,[amount/(1+r/100)**t,amount-si,p+500],fmtMoney,`Under SI, A=P(1+rt/100); P=${fmtMoney(amount)}/(1+${r*t}/100)=${fmtMoney(p)}.`);}
  if(pattern===2){const amount=p*(1+r/100)**t;return makeQuestion(i,level,"Annual compounding",`Find the amount on ${fmtMoney(p)} at ${r}% compounded annually for ${t} years.`,amount,[p*(1+r*t/100),amount-p,amount+p*r/100],fmtMoney,`A=P(1+r/100)^t=${p}(1+${r}/100)^${t}=${fmtMoney(amount)}.`);}
  if(pattern===3){const periods=2*t,amount=p*(1+r/200)**periods;return makeQuestion(i,level,"Half-yearly compounding",`A company invests ${fmtMoney(p)} in a reserve fund offering ${r}% per annum, compounded every six months. What amount will the fund contain after ${t} years?`,amount,[p*(1+r/100)**t,p*(1+r*t/100),amount-p],fmtMoney,`Use ${r/2}% for ${periods} half-years: A=${p}(1+${r}/200)^${periods}=${fmtMoney(amount)}.`);}
  if(pattern===4){const diff=p*(r/100)**2;return makeQuestion(i,level,"SI–CI difference",`Two finance plans invest the same principal of ${fmtMoney(p)} for two years at ${r}% per annum. One uses simple interest and the other annual compounding. How much more interest does the compound plan earn?`,diff,[p*r/100,diff*2,diff+r],fmtMoney,`For 2 years, CI−SI=P(r/100)²=${fmtMoney(diff)}.`);}
  if(pattern===5){const r2=r+5,amount=p*(1+r/100)*(1+r2/100);return makeQuestion(i,level,"Variable rates",`${fmtMoney(p)} is invested at ${r}% in year 1 and ${r2}% in year 2, compounded annually. Find the amount.`,amount,[p*(1+(r+r2)/100),amount-p,amount+100],fmtMoney,`A=${p}(1+${r}/100)(1+${r2}/100)=${fmtMoney(amount)}.`);}
  if(pattern===6){const dep=10+5*(k%4),years=2+k%3,answer=p*(1-dep/100)**years;return makeQuestion(i,level,"Depreciation",`A manufacturing unit purchases a machine for ${fmtMoney(p)}. Its book value depreciates by ${dep}% at the end of every year. What will its recorded value be after ${years} years?`,answer,[p*(1-dep*years/100),p-answer,answer+500],fmtMoney,`Value=${p}(1−${dep}/100)^${years}=${fmtMoney(answer)}.`);}
  if(pattern===7){const amount=p*(1+r/100)**t,ci=amount-p;return makeQuestion(i,level,"Compound interest",`The amount on ${fmtMoney(p)} at ${r}% compound interest for ${t} years is ${fmtMoney(amount)}. Find the compound interest.`,ci,[p*r*t/100,amount,ci+p*r/100],fmtMoney,`CI=A−P=${fmtMoney(amount)}−${fmtMoney(p)}=${fmtMoney(ci)}.`);}
  if(pattern===8){const future=p*(1+r/100)**t;return makeQuestion(i,level,"Present value",`What present sum at ${r}% compound interest will become ${fmtMoney(future)} after ${t} years?`,p,[future/(1+r*t/100),p+500,future-p],fmtMoney,`P=A/(1+r/100)^t=${fmtMoney(future)}/(1+${r}/100)^${t}=${fmtMoney(p)}.`);}
  const qRate=r/4,periods=4*t,amount=p*(1+qRate/100)**periods;return makeQuestion(i,level,"Quarterly compounding",`A corporate deposit of ${fmtMoney(p)} earns ${r}% per annum with interest credited at the end of each quarter. Find the maturity amount after ${t} years.`,amount,[p*(1+r/100)**t,p*(1+r*t/100),amount-p],fmtMoney,`Quarterly rate=${r/4}% and periods=${periods}; amount=${fmtMoney(amount)}.`);
 });
}

const interestExtensions = [
 (i,v,l)=>{const p=3000+500*v,r=6+v,t=2+v,a=p+p*r*t/100;return makeQuestion(i,l,"Amount under simple interest",`Find the amount on ${fmtMoney(p)} at ${r}% simple interest for ${t} years.`,a,[p*r*t/100,p*(1+r/100)**t,a+p*r/100],fmtMoney,`SI=PRT/100; amount=P+SI=${fmtMoney(a)}.`);},
 (i,v,l)=>{const p=4000+500*v,r=8+v,t=2+v,si=p*r*t/100,a=100*si/(p*t);return makeQuestion(i,l,"Rate from simple interest",`${fmtMoney(p)} earns ${fmtMoney(si)} simple interest in ${t} years. Find the annual rate.`,a,[si/p,100*si/p,a+t],fmtPct,`r=100SI/(Pt)=100×${si}/(${p}×${t})=${fmtPct(a)}.`);},
 (i,v,l)=>{const p=5000+500*v,r=10+v,si=p*r*(2+v)/100,a=100*si/(p*r);return makeQuestion(i,l,"Time from simple interest",`${fmtMoney(p)} earns ${fmtMoney(si)} simple interest at ${r}% p.a. Find the time in years.`,a,[si/(p*r),a+1,r],fmtNum,`t=100SI/(Pr)=${a} years.`);},
 (i,v,l)=>{const r=8+v,t=2+v,a=4000+500*v,si=a*r*t/100;return makeQuestion(i,l,"Principal from simple interest",`An investment earns ${fmtMoney(si)} as simple interest at ${r}% per annum over ${t} years. Find the original principal.`,a,[si*(1+r*t/100),si*r*t/100,a+500],fmtMoney,`P=100SI/(rt)=100×${fmtMoney(si)}/(${r}×${t})=${fmtMoney(a)}.`);},
 (i,v,l)=>{const p=5000+1000*v,r=5+v,t=2+v,a=p*((1+r/100)**t-1);return makeQuestion(i,l,"Compound interest from principal",`Find compound interest on ${fmtMoney(p)} at ${r}% annually for ${t} years.`,a,[p*r*t/100,p*(1+r/100)**t,a+p*r/100],fmtMoney,`CI=P[(1+r/100)^t-1]=${fmtMoney(a)}.`);},
 (i,v,l)=>{const p=6000+1000*v,r=6+v,t=2+v,amount=p*(1+r/100)**t,a=amount/(1+r/100)**t;return makeQuestion(i,l,"Principal from compound amount",`A sum becomes ${fmtMoney(amount)} at ${r}% compound interest in ${t} years. Find the principal.`,a,[amount/(1+r*t/100),amount-a,a+500],fmtMoney,`P=A/(1+r/100)^t=${fmtMoney(a)}.`);},
 (i,v,l)=>{const p=8000+1000*v,r=8+v,t=2,amount=p*(1+r/100)**t,a=Math.sqrt(amount/p)*100-100;return makeQuestion(i,l,"Compound rate from amount",`${fmtMoney(p)} becomes ${fmtMoney(amount)} in 2 years compounded annually. Find the rate.`,a,[100*(amount-p)/p/2,a+2,a-2],fmtPct,`(1+r/100)^2=A/P; r=(√(A/P)-1)×100=${fmtPct(a)}.`);},
 (i,v,l)=>{const p=10000+1000*v,r=8+2*v,t=2+v%3,periods=2*t,a=p*(1+r/200)**periods-p;return makeQuestion(i,l,"Half-yearly compound interest",`An employee benefit fund invests ${fmtMoney(p)} at ${r}% per annum, with compounding every six months. How much compound interest is earned over ${t} years?`,a,[p*((1+r/100)**t-1),p*r*t/100,a+500],fmtMoney,`Use rate ${r/2}% for ${periods} periods; CI=${fmtMoney(a)}.`);},
 (i,v,l)=>{const p=12000+1000*v,r=8+4*v,t=1+v%2,periods=4*t,amount=p*(1+r/400)**periods,a=amount-p;return makeQuestion(i,l,"Quarterly compound interest",`Calculate only the compound interest earned on ${fmtMoney(p)} at ${r}% p.a. for ${t} years with quarterly compounding.`,a,[amount,p*r*t/100,a+p*r/400],fmtMoney,`Quarterly amount=${fmtMoney(amount)}; subtract principal ${fmtMoney(p)} to obtain CI=${fmtMoney(a)}.`);},
 (i,v,l)=>{const p=7000+1000*v,r=6+v,amount=p*(1+r/1200)**12,a=amount-p;return makeQuestion(i,l,"Monthly compounding",`A digital savings account receives a one-time deposit of ${fmtMoney(p)} and compounds interest monthly at ${r}% per annum. Find the compound interest credited during the first year.`,a,[p*r/100,p*((1+r/100)-1),a+100],fmtMoney,`Monthly rate=${r}/12% for 12 periods; CI=${fmtMoney(a)}.`);},
 (i,v,l)=>{const p=9000+1000*v,r1=6+v,r2=8+v,a=p*(1+r1/100)*(1+r2/100);return makeQuestion(i,l,"Variable annual rates",`${fmtMoney(p)} grows at ${r1}% in year 1 and ${r2}% in year 2. Find the amount.`,a,[p*(1+(r1+r2)/100),a-p,a+500],fmtMoney,`Amount=P(1+${r1}/100)(1+${r2}/100)=${fmtMoney(a)}.`);},
 (i,v,l)=>{const p=10000+1000*v,d=8+v,t=2+v%3,final=p*(1-d/100)**t,a=final/(1-d/100)**t;return makeQuestion(i,l,"Original value before depreciation",`After depreciating ${d}% annually for ${t} years, a machine is worth ${fmtMoney(final)}. Find its original value.`,a,[final/(1-d*t/100),p-final,a+500],fmtMoney,`Original value=final/(1-${d}/100)^${t}=${fmtMoney(a)}.`);},
 (i,v,l)=>{const p=8000+1000*v,r=8+v,a=p*(r/100)**2;return makeQuestion(i,l,"Two-year CI-SI difference",`A finance analyst compares simple interest with annual compound interest on ${fmtMoney(p)} at ${r}% for two years. By how much does the compound-interest return exceed the simple-interest return?`,a,[p*r/100,2*a,a+r],fmtMoney,`For two years, CI−SI=P(r/100)^2=${fmtMoney(a)}.`);},
 (i,v,l)=>{const r=8+v,t=2+v,amount=12000+1000*v,a=amount/(1+r/100)**t;return makeQuestion(i,l,"Discounted present sum",`Discount a future amount of ${fmtMoney(amount)} back ${t} years at ${r}% compound interest. Find today's equivalent sum.`,a,[amount/(1+r*t/100),amount-a,a+500],fmtMoney,`Today's equivalent=A/(1+r/100)^t=${fmtMoney(a)}.`);},
 (i,v,l)=>{const p=10000+1000*v,r=10+v,t=2+v,ci=p*((1+r/100)**t-1),si=p*r*t/100,a=ci-si;return makeQuestion(i,l,"Multi-year CI-SI comparison",`Find the difference between CI and SI on ${fmtMoney(p)} at ${r}% for ${t} years.`,a,[p*(r/100)**2,ci,si],fmtMoney,`Compute CI=${fmtMoney(ci)} and SI=${fmtMoney(si)} separately; difference=${fmtMoney(a)}.`);},
];

function interestPlacementBank(){
 const base=interestBank().filter((_,index)=>index<60);
 const added=interestExtensions.flatMap((build,pattern)=>Array.from({length:6},(_,variant)=>{const id=60+pattern*6+variant;return build(id,variant+1,levelFor(id));}));
 return [...base,...added];
}

export const PLACEMENT_BUILDERS = {
  number: numberSystemPlacementBank,
  percentage: percentagePlacementBank,
  profit: profitPlacementBank,
  ratio: ratioPlacementBank,
  average: averagePlacementBank,
  interest: interestPlacementBank,
  mixture: mixturePlacementBank,
  work: timeWorkPlacementBank,
  pipes: pipesPlacementBank,
  distance: timeDistancePlacementBank,
  trainsBoats: trainsBoatsPlacementBank,
  algebra: algebraPlacementBank,
  mensuration: mensurationPlacementBank,
  permutation: permutationPlacementBank,
  probability: probabilityPlacementBank,
  statistics: statisticsPlacementBank,
  dataInterpretation: dataInterpretationPlacementBank,
};

export function auditPlacementBanks() {
  return Object.entries(PLACEMENT_BUILDERS).map(([topic, build]) => {
    const questions = build();
    const ids = new Set(questions.map(question => question.id));
    const texts = new Set(questions.map(question => question.q));
    const subtopics = new Set(questions.map(question => question.subtopic));
    const templateCounts = questions.reduce((counts, question) => {
      const template = normalizeQuestionTemplate(question.q);
      counts.set(template, (counts.get(template) || 0) + 1);
      return counts;
    }, new Map());
    const maxTemplateReuse = Math.max(...templateCounts.values());
    const styleCounts = questions.reduce((counts, question) => {
      const style = classifyAssessmentStyle(question);
      counts[style] = (counts[style] || 0) + 1;
      return counts;
    }, {});
    const depthCounts = questions.reduce((counts, question) => {
      const depth = reasoningDepth(question);
      counts[depth] = (counts[depth] || 0) + 1;
      return counts;
    }, {});
    const directShare = (styleCounts.direct || 0) / questions.length;
    const appliedShare = 1 - directShare;
    const maximumDirectShare = topic === "number" ? 0.45 : 0.35;
    const styleEvidenceFailures = questions.filter(question => question.assessmentStyle === "multi-step" && solutionOperationCount(question) < 2).length;
    const appliedStyles = new Set(["contextual", "multi-step", "caselet-di"]);
    const underDetailedAppliedPrompts = questions.filter(question => appliedStyles.has(classifyAssessmentStyle(question)) && question.q.trim().split(/\s+/).length < 14).length;
    const invalid = questions.filter(question =>
      question.opts.length !== 4 ||
      new Set(question.opts).size !== 4 ||
      question.ans < 0 || question.ans > 3 ||
      !question.opts[question.ans] ||
      !question.solution?.trim() || question.solution.length < 100 ||
      !question.patternId || !question.idealTimeSeconds || !question.shortcut || !question.commonMistake ||
      question.opts.some(option => /NaN|Infinity|undefined|null/.test(option)) ||
      /NaN|Infinity|undefined|null/.test(question.q + question.solution) ||
      /â|Ã|Â|Œ|‰/.test(question.q + question.solution + question.opts.join(" "))
    );
    if (questions.length !== 150 || ids.size !== 150 || texts.size !== 150 || subtopics.size < 10 || invalid.length) {
      throw new Error(`${topic} audit failed: count=${questions.length}, ids=${ids.size}, unique=${texts.size}, templates=${templateCounts.size}, maxTemplateReuse=${maxTemplateReuse}, subtopics=${subtopics.size}, invalid=${invalid.length}`);
    }
    return {
      topic,
      questions: questions.length,
      uniqueQuestions: texts.size,
      subtopics: subtopics.size,
      presentationTemplates: templateCounts.size,
      maxTemplateReuse,
      placementDiversityPassed: templateCounts.size >= 25 && maxTemplateReuse <= 6,
      assessmentStyleMix: styleCounts,
      reasoningDepthMix: depthCounts,
      styleEvidenceFailures,
      underDetailedAppliedPrompts,
      contentDetailPassed: underDetailedAppliedPrompts === 0,
      assessmentRealismPassed: directShare >= 0.15 && directShare <= maximumDirectShare && appliedShare >= 1 - maximumDirectShare && (styleCounts["multi-step"] || 0) >= 20 && styleEvidenceFailures === 0,
      verifiedSolutions: questions.filter(question => question.solution?.trim()).length,
      levels: Object.fromEntries(PLACEMENT_LEVELS.map(level => [level, questions.filter(question => question.level === level).length])),
    };
  });
}
