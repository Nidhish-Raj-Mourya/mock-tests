import { buildLogicalBank } from "./LogicalQuestionFactory.js";

const answers={I:"Statement I alone is sufficient",II:"Statement II alone is sufficient",either:"Either statement alone is sufficient",together:"Both statements together are sufficient",none:"Even both statements together are insufficient"};
const distractors=key=>Object.entries(answers).filter(([k])=>k!==key).slice(0,3).map(([,value])=>value);
const cases=[
 ["Exact value",v=>`What is the value of x? I. x + ${v+7} = ${2*v+19}. II. 2x = ${2*v+24}.`,"either","Each equation independently gives x = v + 12."],
 ["Two-variable value",v=>`What is x? I. x + y = ${20+v}. II. y = ${7+v}.`,"together","Neither statement fixes x alone; substitution gives x = 13."],
 ["Positive square root",v=>`What is x? I. x² = ${(v+4)**2}. II. x is positive.`,"together","The square equation gives two signs; positivity selects x = v + 4."],
 ["Parity",v=>`Is integer n even? I. n is divisible by ${2*(v+1)}. II. n is divisible by ${2*v+1}.`,"I","Divisibility by an even integer forces n to be even; Statement II does not."],
 ["Comparison",v=>`Is a greater than b? I. a-b = ${v+1}. II. a+b = ${20+v}.`,"I","A positive difference alone proves a>b."],
 ["Ratio total",v=>`How many analysts are in a team? I. Analysts and testers are in the ratio 3:2. II. The team has ${25+5*v} analysts and testers in all.`,"together","The ratio needs a total and the total needs a split; together analysts are three-fifths of the team."],
 ["Average count",v=>`How many values are in a set? I. Their average is ${10+v}. II. Their sum is ${(10+v)*(6+v)}.`,"together","Count equals sum divided by average; neither statement alone fixes it."],
 ["Rectangle area",v=>`What is the area of a rectangle? I. Its length is ${v+8} cm. II. Its perimeter is ${4*v+28} cm.`,"together","Length and perimeter together give breadth and hence area."],
 ["Circle radius",v=>`What is the radius of a circle? I. Its diameter is ${2*v+12} cm. II. Its circumference is ${2*(v+6)}π cm.`,"either","Either diameter or circumference independently determines radius v+6."],
 ["Age",v=>`What is Riya's present age? I. In ${v} years she will be ${24+2*v}. II. ${v} years ago she was ${24} years old.`,"either","Each time-shift independently yields the same present age."],
 ["Profit percentage",v=>`What is the profit percentage? I. Cost price is ₹${500+50*v}. II. Selling price exceeds cost price by ₹${100+10*v}.`,"together","Profit percentage needs both the base cost and profit amount."],
 ["Speed",v=>`What was the train's speed? I. It covered ${120+10*v} km. II. The journey took ${2+v/2} hours.`,"together","Speed requires both distance and time."],
 ["Day identification",v=>`On which day was Interview ${v}? I. It was after Monday but before Thursday. II. It was not Tuesday.`,"together","Statement I leaves Tuesday or Wednesday; Statement II selects Wednesday."],
 ["Order",v=>`Who ranked higher, A or B, in Round ${v}? I. A ranked above C. II. C ranked above B.`,"together","Only the combined transitive chain A>C>B answers the comparison."],
 ["Family relation",v=>`Is P the maternal uncle of Q in Family ${v}? I. P is the brother of R. II. R is Q's mother.`,"together","Brother plus mother establishes maternal uncle; either relation alone is incomplete."],
 ["Direction",v=>`Is Office A east of Office B in Map ${v}? I. A is north-east of C. II. C is south-east of B.`,"together","Adding the two displacement relations cancels north/south and leaves A east of B."],
 ["Unique code",v=>`What is the code for DELTA in Codebook ${v}? I. Each letter is replaced by its alphabet position. II. Codes are written left to right.`,"together","The mapping and order convention are both required for the exact code."],
 ["Prime status",v=>`Is integer n prime? I. n is odd. II. ${v+2}<n<${v+12}.`,"none","Oddness and a broad interval can still admit both prime and composite values."],
 ["Triangle type",v=>`Is the triangle right-angled? I. Its sides are in the ratio 3:4:5. II. Its perimeter is ${24+12*v} cm.`,"I","A 3:4:5 ratio alone guarantees a right triangle; scale is irrelevant."],
 ["Percentage base",v=>`What is ${20+v}% of N? I. N=${200+10*v}. II. ${50}% of N=${100+5*v}.`,"either","Each statement independently determines N and therefore the requested percentage."],
 ["Meeting attendance",v=>`Did more than 30 people attend Session ${v}? I. Attendance was a multiple of 8. II. Attendance was between 28 and 35.`,"together","The only multiple of 8 in the interval is 32, so the answer is yes."],
 ["Largest number",v=>`Which is larger, x or y? I. x/y=${(v+2)/(v+1)}. II. y is positive.`,"together","A ratio above 1 implies x>y only after the sign of y is known."],
 ["Remainder",v=>`What is the remainder when n is divided by 6? I. n leaves remainder ${v%2} when divided by 2. II. n leaves remainder ${v%3} when divided by 3.`,"together","Compatible residues modulo 2 and 3 uniquely determine a residue modulo 6."],
 ["Median",v=>`What is the median of five distinct integers? I. Their ordered middle value is ${10+v}. II. Their mean is ${12+v}.`,"I","For five ordered observations, the stated middle value alone is the median."],
 ["Committee choice",v=>`Was K selected for Committee ${v}? I. Exactly two of J, K and L were selected. II. J was not selected.`,"together","If exactly two are selected and J is excluded, K and L must be selected."],
];

const patterns=cases.map(([subtopic,prompt,key,explanation])=>v=>({subtopic,prompt:prompt(v),correct:answers[key],distractors:distractors(key),explanation,assessmentStyle:"multi-step",shortcut:"Test Statement I and Statement II independently before combining them; never compute more than sufficiency requires.",commonMistake:"Do not combine the statements before checking whether either one is independently sufficient."}));
export const dataSufficiencyLogicalBank=()=>buildLogicalBank(patterns);
