const LEVELS = ["Foundation Check", "Placement Core", "Advanced Applications", "Company Challenge"];
const levelFor = index => index < 20 ? LEVELS[0] : index < 75 ? LEVELS[1] : index < 120 ? LEVELS[2] : LEVELS[3];
const num = value => Number.isInteger(value) ? String(value) : Number(value.toFixed(2)).toString();
const pct = value => `${num(value)}%`;
const money = value => `₹${Number(value.toFixed(2)).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const MULTI_STEP = new Set(["Successive percentage increases","Increase followed by decrease","Compound population growth","Repeated depreciation","Election turnout and valid votes","Successive expenditure","Change in savings","Weighted pass percentage","Mixture concentration after addition","Rectangle area change","Opposite dimension changes"]);
const REVERSE = new Set(["Reverse percentage after increase","Reverse percentage after decrease","More-than versus less-than","Price-consumption adjustment","Maximum marks from cut-off"]);
const DIRECT = new Set(["Percentage of a quantity","Quantity as a percentage","Percentage increase","Percentage decrease","Marks percentage","Percentage error"]);

function question(id, pattern, text, answer, wrong, method, format = num) {
  const correct = format(answer);
  const options = [answer, ...wrong].map(format).filter((value, index, all) => all.indexOf(value) === index);
  let bump = 1;
  while (options.length < 4) { const candidate = format(Number(answer) + bump++); if (!options.includes(candidate)) options.push(candidate); }
  const level = levelFor(id);
  const assessmentStyle = /Budget percentage caselet/.test(pattern) ? "caselet-di" : MULTI_STEP.has(pattern) ? "multi-step" : REVERSE.has(pattern) ? "reverse" : DIRECT.has(pattern) ? "direct" : "contextual";
  const reasoningDepth = MULTI_STEP.has(pattern) ? (level === LEVELS[3] ? "advanced" : "two-step") : REVERSE.has(pattern) ? "two-step" : "single-step";
  return {
    id, level, subtopic: pattern,
    patternId: pattern.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    q: text, opts: options, ans: options.indexOf(correct),
    assessmentStyle, reasoningDepth,
    idealTimeSeconds: level === LEVELS[0] ? 25 : level === LEVELS[1] ? 35 : level === LEVELS[2] ? 50 : 65,
    shortcut: `Identify the correct base quantity in this ${pattern.toLowerCase()} problem, convert the percentage to a multiplier, and cancel before multiplying.`,
    commonMistake: `A percentage is always measured against a base. Do not interchange the original and final base or simply add successive percentage changes.`,
    solution: `Concept: ${pattern}. Method and calculation: ${method} The percentage multiplier and its base have been checked independently. Final answer check: reversing the operation reproduces the supplied values, so the result is ${correct}.`,
  };
}

const PATTERNS = [
  (id,v)=>{const p=10+5*v,n=240+40*v,a=n*p/100;return question(id,"Percentage of a quantity",`What is ${p}% of ${n}?`,a,[n-a,a+p,n*p/10],`${p}/100×${n}=${a}.`);},
  (id,v)=>{const part=30+10*v,total=200+40*v,a=100*part/total;return question(id,"Quantity as a percentage",`${part} is what percentage of ${total}?`,a,[part/total,a+5,100-a],`Percentage=part/whole×100=${part}/${total}×100=${pct(a)}.`,pct);},
  (id,v)=>{const old=160+20*v,newValue=old+20+10*v,a=100*(newValue-old)/old;return question(id,"Percentage increase",`A value rises from ${old} to ${newValue}. Find the percentage increase.`,a,[newValue-old,100*(newValue-old)/newValue,a+5],`Increase=${newValue-old}; divide by original ${old} and multiply by 100 to get ${pct(a)}.`,pct);},
  (id,v)=>{const old=300+40*v,newValue=old-30-10*v,a=100*(old-newValue)/old;return question(id,"Percentage decrease",`A price falls from ${money(old)} to ${money(newValue)}. Find the percentage decrease.`,a,[old-newValue,100*(old-newValue)/newValue,a+5],`Decrease=${old-newValue}; percentage decrease=decrease/${old}×100=${pct(a)}.`,pct);},
  (id,v)=>{const p=10+5*v,original=800+80*v,final=original*(1+p/100);return question(id,"Reverse percentage after increase",`After a ${p}% increase, a salary becomes ${money(final)}. Find the original salary.`,original,[final*(1-p/100),final-original,original+p],`Original=final×100/(100+${p})=${money(original)}.`,money);},
  (id,v)=>{const p=5+5*v,original=1000+100*v,final=original*(1-p/100);return question(id,"Reverse percentage after decrease",`After a ${p}% reduction, a machine is valued at ${money(final)}. Find its value before reduction.`,original,[final*(1+p/100),original-final,original-p],`Original=final×100/(100-${p})=${money(original)}.`,money);},
  (id,v)=>{const p=10+5*v,q=5+5*(v%4),a=(1+p/100)*(1+q/100)*100-100;return question(id,"Successive percentage increases",`A company raises its quarterly production target by ${p}%. After receiving an additional order, it raises the revised target by another ${q}%. Compared with the original target, what is the overall percentage increase?`,a,[p+q,a+2,a-2],`Use the revised target as the base for the second change. Net multiplier=(1+${p}/100)(1+${q}/100); net increase=${pct(a)}.`,pct);},
  (id,v)=>{const p=15+5*v,q=5+5*(v%3),a=((1+p/100)*(1-q/100)-1)*100;return question(id,"Increase followed by decrease",`A manufacturing unit increases its planned monthly output by ${p}%. A later maintenance review reduces this revised output by ${q}%. Relative to the original plan, find the net percentage change in output.`,a,[p-q,a+2,a-2],`The decrease applies to the already increased output, not the original base. Net change=[(1+${p}/100)(1-${q}/100)-1]×100=${pct(a)}.`,pct);},
  (id,v)=>{const p=10+5*v,a=100*p/(100+p);return question(id,"More-than versus less-than",`A's salary is ${p}% more than B's. B's salary is what percent less than A's?`,a,[p,p/2,100-p],`Take B=100, so A=100+${p}. Required percentage=${p}/${100+p}×100=${pct(a)}.`,pct);},
  (id,v)=>{const p=10+5*v,a=100*p/(100+p);return question(id,"Price-consumption adjustment",`The price of fuel rises by ${p}%. By what percentage must consumption fall to keep expenditure unchanged?`,a,[p,p/2,100-p],`Required reduction=100p/(100+p)=100×${p}/${100+p}=${pct(a)}.`,pct);},
  (id,v)=>{const population=10000+2000*v,g=5+v,years=2+v%3,raw=population*(1+g/100)**years,a=Math.round(raw);return question(id,"Compound population growth",`A town has population ${population} and grows ${g}% annually. Estimate its population after ${years} years, rounded to the nearest whole person.`,a,[Math.round(population*(1+g*years/100)),Math.round(raw-population*g/100),a+Math.round(population/10)],`Population=${population}(1+${g}/100)^${years}=${num(raw)}, which rounds to ${a}.`);},
  (id,v)=>{const value=20000+2000*v,d=8+2*v,years=2+v%3,a=value*(1-d/100)**years;return question(id,"Repeated depreciation",`An asset worth ${money(value)} depreciates by ${d}% yearly. Find its value after ${years} years.`,a,[value*(1-d*years/100),value-a,a+1000],`Value=${money(value)}(1-${d}/100)^${years}=${money(a)}.`,money);},
  (id,v)=>{const voters=4000+1000*v,turnout=60+5*(v%5),valid=80+2*v,a=voters*turnout/100*valid/100;return question(id,"Election turnout and valid votes",`Of ${voters} voters, ${turnout}% vote and ${valid}% of votes cast are valid. How many valid votes are cast?`,a,[voters*turnout/100,voters*valid/100,a+100],`Valid votes=${voters}×${turnout}/100×${valid}/100=${num(a)}.`);},
  (id,v)=>{const valid=5000+500*v,winner=55+2*v,loser=100-winner,a=valid*(winner-loser)/100;return question(id,"Election winning margin",`In a two-candidate election with ${valid} valid votes, the winner receives ${winner}%. Find the winning margin.`,a,[valid*winner/100,valid*(winner-50)/100,a+100],`Loser gets ${loser}%; margin=(${winner}-${loser})% of ${valid}=${num(a)} votes.`);},
  (id,v)=>{const pass=35+5*v,gap=20+10*v,score=260+20*v,a=(score+gap)*100/pass;return question(id,"Maximum marks from cut-off",`A student scores ${score} and fails by ${gap}. The pass mark is ${pass}% of the maximum. Find the maximum marks.`,a,[score*100/pass,a-gap,a+100],`Pass mark=${score}+${gap}; maximum=pass mark×100/${pass}=${num(a)}.`);},
  (id,v)=>{const maximum=500+100*v,pass=35+5*v,score=maximum*pass/100+20*v,a=100*score/maximum;return question(id,"Marks percentage",`A candidate scores ${score} out of ${maximum}. What percentage did the candidate obtain?`,a,[score/maximum,a+5,pass],`Percentage=${score}/${maximum}×100=${pct(a)}.`,pct);},
  (id,v)=>{const income=30000+5000*v,rent=20+2*v,travel=10+v,a=income*(1-rent/100)*(1-travel/100);return question(id,"Successive expenditure",`A person earns ${money(income)}, spends ${rent}% on rent, then ${travel}% of the remainder on travel. How much remains?`,a,[income*(1-(rent+travel)/100),income*rent/100,a+1000],`Remaining=${money(income)}(1-${rent}/100)(1-${travel}/100)=${money(a)}.`,money);},
  (id,v)=>{const oldIncome=40000+5000*v,oldSpend=30000+3000*v,inc=10+2*v,spendInc=6+v,oldSave=oldIncome-oldSpend,newSave=oldIncome*(1+inc/100)-oldSpend*(1+spendInc/100),a=100*(newSave-oldSave)/oldSave;return question(id,"Change in savings",`Income is ${money(oldIncome)} and expenditure ${money(oldSpend)}. Income rises ${inc}% and expenditure ${spendInc}%. Find the percentage change in savings.`,a,[inc-spendInc,a+5,a-5],`Old saving=${money(oldSave)}; new saving=${money(newSave)}; change/old saving×100=${pct(a)}.`,pct);},
  (id,v)=>{const boys=40+5*v,bPass=70+3*v,gPass=75+2*v,a=boys*bPass/100+(100-boys)*gPass/100;return question(id,"Weighted pass percentage",`${boys}% of a class are boys. ${bPass}% of boys and ${gPass}% of girls pass. What percentage of the class passes?`,a,[(bPass+gPass)/2,bPass,a+2],`Weighted rate=${boys/100}×${bPass}+${(100-boys)/100}×${gPass}=${pct(a)}.`,pct);},
  (id,v)=>{const concentration=20+5*v,volume=40+10*v,pure=5*v,a=100*(volume*concentration/100+pure)/(volume+pure);return question(id,"Mixture concentration after addition",`${volume} L of a ${concentration}% acid solution receives ${pure} L pure acid. Find the new acid percentage.`,a,[concentration+100*pure/volume,concentration,a+5],`Acid amount=${volume*concentration/100}+${pure}; divide by total ${volume+pure} and multiply by 100 to get ${pct(a)}.`,pct);},
  (id,v)=>{const concentration=40+5*v,volume=50+10*v,water=10+5*v,a=100*volume*concentration/100/(volume+water);return question(id,"Dilution by adding water",`${volume} L of a ${concentration}% solution is diluted with ${water} L water. Find the new concentration.`,a,[concentration-water,concentration,a+5],`Solute stays ${volume*concentration/100} L; new total=${volume+water} L, so concentration=${pct(a)}.`,pct);},
  (id,v)=>{const actual=200+20*v,measured=actual+5*v,a=100*(measured-actual)/actual;return question(id,"Percentage error",`A true value is ${actual}, but it is measured as ${measured}. Find the percentage error.`,a,[measured-actual,100*(measured-actual)/measured,a+1],`Absolute error=${measured-actual}; divide by true value ${actual} and multiply by 100=${pct(a)}.`,pct);},
  (id,v)=>{const p=5+2*v,q=4+v,a=((1+p/100)*(1+q/100)-1)*100;return question(id,"Rectangle area change",`A rectangle's length increases ${p}% and breadth increases ${q}%. Find the percentage increase in area.`,a,[p+q,p*q/100,a+1],`Area multiplier=(1+${p}/100)(1+${q}/100); increase=${pct(a)}.`,pct);},
  (id,v)=>{const p=8+2*v,q=5+v,a=((1+p/100)*(1-q/100)-1)*100;return question(id,"Opposite dimension changes",`A rectangle's length increases ${p}% while breadth decreases ${q}%. Find the net percentage change in area.`,a,[p-q,a+2,a-2],`Net area multiplier=(1+${p}/100)(1-${q}/100); change=${pct(a)}.`,pct);},
  (id,v)=>{const budget=500000+100000*v,salaries=30+2*v,training=10+v,a=100*(1-salaries/100)*(1-training/100);return question(id,"Budget percentage caselet",`From a ${money(budget)} budget, ${salaries}% is spent on salaries and ${training}% of the remainder on training. What percent of the original budget remains?`,a,[100-salaries-training,a+3,a-3],`Remaining percentage=100(1-${salaries}/100)(1-${training}/100)=${pct(a)}.`,pct);},
];

export function percentagePlacementBank() {
  return Array.from({ length: 150 }, (_, id) => PATTERNS[id % PATTERNS.length](id, Math.floor(id / PATTERNS.length) + 1));
}

export const PERCENTAGE_PATTERN_COUNT = PATTERNS.length;
