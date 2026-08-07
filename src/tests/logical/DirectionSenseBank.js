import { buildLogicalBank } from "./LogicalQuestionFactory.js";

const vectors={north:[0,1],south:[0,-1],east:[1,0],west:[-1,0]};
const routes=[
 [["north",3],["east",4]],[["east",8],["north",6]],[["south",5],["west",12]],[["west",15],["north",8]],[["north",10],["east",9],["south",10]],
 [["east",14],["west",6],["north",15]],[["north",12],["south",5],["east",24]],[["west",9],["north",12],["east",9]],[["south",16],["east",12],["north",16]],[["east",20],["north",21],["west",20]],
 [["north",9],["east",12],["south",6]],[["west",18],["south",24],["east",10]],[["east",7],["north",24],["west",7]],[["south",20],["west",15],["north",8]],[["north",28],["east",21],["south",12]],
 [["east",30],["west",18],["south",16]],[["north",18],["west",24],["south",8]],[["south",27],["east",36],["north",12]],[["west",40],["north",30],["east",16]],[["east",25],["south",60],["west",18]],
 [["north",7],["east",24],["south",7]],[["south",11],["west",60],["north",11]],[["west",12],["north",35],["east",12]],[["east",45],["north",28],["west",24]],[["south",32],["east",24],["north",14]],
];
const direction=(x,y)=>y===0?(x>0?"East":"West"):x===0?(y>0?"North":"South"):`${y>0?"North":"South"}-${x>0?"East":"West"}`;
const patterns=routes.map((route,index)=>v=>{
 const scale=1+(v-1)%3, legs=route.map(([d,n])=>[d,n*scale]);
 const [x,y]=legs.reduce(([x0,y0],[d,n])=>[x0+vectors[d][0]*n,y0+vectors[d][1]*n],[0,0]);
 const distance=Math.sqrt(x*x+y*y), askDirection=index%3===2;
 const prompt=`On Campus Map ${v}, a candidate starts from Gate P, walks ${legs.map(([d,n])=>`${n} m ${d}`).join(", then ")}. ${askDirection?"In which direction is the candidate from Gate P":"What is the shortest distance from the candidate's final position to Gate P"}?`;
 const correct=askDirection?direction(x,y):`${Number.isInteger(distance)?distance:distance.toFixed(2)} m`;
 const distractors=askDirection?[direction(-x,y),direction(x,-y),direction(-x,-y)]:[`${Math.abs(x)+Math.abs(y)} m`,`${Math.max(Math.abs(x),Math.abs(y))} m`,`${Math.abs(x-y)} m`];
 return {subtopic:`Route vector ${index+1}`,prompt,correct,distractors,explanation:`Taking east as +x and north as +y, the net displacement is (${x}, ${y}). ${askDirection?`Its signs place it toward ${correct}.`:`Pythagoras gives √(${x}² + ${y}²) = ${correct}.`}`,assessmentStyle:"multi-step",shortcut:"Cancel opposite movements first; use the remaining horizontal and vertical components to determine direction or apply Pythagoras.",commonMistake:"Do not add the total path length when the question asks for displacement or shortest distance."};
});
export const directionSenseLogicalBank=()=>buildLogicalBank(patterns);
