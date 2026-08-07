import { buildLogicalBank } from "./LogicalQuestionFactory.js";

const nameSets=["Aarav,Bina,Charu,Dev,Esha,Farhan","Gita,Harsh,Ira,Jatin,Kabir,Leela","Manav,Naina,Om,Pari,Rohan,Sana","Tarun,Uma,Varun,Wamiqa,Yash,Zara","Adil,Bhavya,Chetan,Diya,Eshan,Falak","Gauri,Hemant,Ishita,Jay,Kriti,Lalit"].map(x=>x.split(","));
const rotate=(a,n)=>[...a.slice(n%a.length),...a.slice(0,n%a.length)];
const seatingPatterns=Array.from({length:25},(_,p)=>v=>{
 const base=nameSets[v-1],order=rotate(base,(p+2*v)%6),family=p%5,target=(p+v)%6; let prompt,correct,explanation;
 if(family<3){
  const clues=[`${order[2]} sits second to the right of ${order[0]}`,`${order[1]} sits between ${order[0]} and ${order[2]}`,`${order[4]} sits second to the right of ${order[2]}`,`${order[3]} sits between ${order[2]} and ${order[4]}`,`${order[5]} sits immediately right of ${order[4]}`,`${order[0]} occupies the extreme-left seat`];
  if(family===0){correct=order[target];prompt=`Six candidates sit in one row facing north for Panel ${v}. ${clues.slice().sort((a,b)=>(a.charCodeAt(0)+p)%7-(b.charCodeAt(0)+p)%7).join("; ")}. Who occupies seat ${target+1} from the left?`;explanation=`Fix ${order[0]} at the left end and apply the second-right and between clues. The unique left-to-right order is ${order.join(" – ")}; seat ${target+1} contains ${correct}.`;}
  else if(family===1){const who=order[target],neighbor=target<5?order[target+1]:order[target-1];correct=neighbor;prompt=`Six candidates sit in one row facing north for Panel ${v}. ${clues.join("; ")}. Who sits immediately ${target<5?"right":"left"} of ${who}?`;explanation=`The constraints force ${order.join(" – ")}. The requested immediate neighbour of ${who} is ${correct}.`;}
  else {const who=order[target],fromRight=6-target;correct=String(fromRight);prompt=`Six candidates sit in one row facing north for Panel ${v}. ${clues.reverse().join("; ")}. What is ${who}'s position from the right?`;explanation=`The unique order is ${order.join(" – ")}. ${who} is ${target+1} from the left, hence ${correct} from the right.`;}
 } else {
  const clockwise=order,clues=[`${clockwise[1]} sits immediately clockwise of ${clockwise[0]}`,`${clockwise[3]} sits second clockwise of ${clockwise[1]}`,`${clockwise[2]} sits between ${clockwise[1]} and ${clockwise[3]}`,`${clockwise[5]} sits immediately anticlockwise of ${clockwise[0]}`,`${clockwise[4]} sits between ${clockwise[3]} and ${clockwise[5]}`];
  const who=clockwise[target];
  if(family===3){correct=clockwise[(target+1)%6];prompt=`Six analysts sit around a circular table facing the centre in Meeting ${v}. ${clues.join("; ")}. Who sits immediately clockwise of ${who}?`;explanation=`Anchor ${clockwise[0]} anywhere and follow clockwise relations. The circular order is ${clockwise.join(" → ")}; ${correct} is immediately clockwise of ${who}.`;}
  else {correct=clockwise[(target+3)%6];prompt=`Six analysts sit around a circular table facing the centre in Meeting ${v}. ${clues.slice().reverse().join("; ")}. Who sits opposite ${who}?`;explanation=`The unique clockwise order, up to rotation, is ${clockwise.join(" → ")}. In a six-seat circle, the opposite seat is three positions away, occupied by ${correct}.`;}
 }
 const distractors=rotate(base.filter(x=>x!==correct),(p+v)%5).slice(0,3);
 if(/^\d+$/.test(correct)){const numeric=rotate(["1","2","3","4","5","6"].filter(option=>option!==correct),(p+v)%5).slice(0,3);distractors.splice(0,3,...numeric);}
 return {subtopic:`Seating model ${p+1}`,prompt,correct,distractors,explanation,assessmentStyle:"multi-step",shortcut:"Fix an absolute anchor first, draw numbered slots, and translate every left/right clue from the seated person's facing direction.",commonMistake:"For people facing the centre, clockwise is to their left; do not use the observer's left/right without checking orientation."};
});

const projectSets=["Audit,Build,Cloud,Design,Enable,Finance","Growth,Helpdesk,Insights,Journey,Kernel,Launch","Mobile,Network,Ops,Platform,Quality,Risk","Sales,Testing,Upgrade,Vision,Web,Xray","Yield,ZeroTrust,API,Billing,CRM,Data","Edge,Fraud,Gateway,HR,Identity,Java"].map(x=>x.split(","));
const puzzlePatterns=Array.from({length:25},(_,p)=>v=>{
 const items=rotate(projectSets[v-1],(p+v)%6),slots=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],family=p%5,target=(p+2*v)%6;
 const clues=[`${items[0]} is scheduled on Monday`,`${items[2]} is two days after ${items[0]}`,`${items[1]} is scheduled between ${items[0]} and ${items[2]}`,`${items[4]} is two days after ${items[2]}`,`${items[3]} is immediately before ${items[4]}`,`${items[5]} is after ${items[4]}`];
 let prompt,correct,explanation;
 if(family===0){correct=slots[target];prompt=`Six project demos—${items.join(", ")}—are scheduled from Monday to Saturday, one per day, in Sprint ${v}. ${clues.join("; ")}. On which day is ${items[target]} scheduled?`;explanation=`Placing the fixed Monday item and applying every gap gives ${items.map((x,i)=>`${slots[i]}=${x}`).join(", ")}. Therefore ${items[target]} is on ${correct}.`;}
 else if(family===1){correct=items[target];prompt=`Six project demos—${items.join(", ")}—are scheduled from Monday to Saturday, one per day, in Sprint ${v}. ${clues.slice().reverse().join("; ")}. Which project is scheduled on ${slots[target]}?`;explanation=`The only schedule satisfying all before/after gaps is ${items.map((x,i)=>`${slots[i]}=${x}`).join(", ")}; ${correct} occupies ${slots[target]}.`;}
 else if(family===2){correct=items[3];prompt=`Six project demos—${items.join(", ")}—are scheduled from Monday to Saturday, one per day, in Sprint ${v}. ${clues.join("; ")}. Which project is immediately before ${items[4]}?`;explanation=`The reconstructed schedule is ${items.join(" → ")}; ${correct} immediately precedes ${items[4]}.`;}
 else if(family===3){correct=items[3];prompt=`Six project demos—${items.join(", ")}—are scheduled from Monday to Saturday, one per day, in Sprint ${v}. ${clues.join("; ")}. Which project is scheduled exactly midway between ${items[2]} and ${items[4]}?`;explanation=`${items[2]} is Wednesday and ${items[4]} is Friday, so Thursday is midway and contains ${correct}.`;}
 else {correct=`${items[1]} and ${items[3]}`;prompt=`Six project demos—${items.join(", ")}—are scheduled from Monday to Saturday, one per day, in Sprint ${v}. ${clues.join("; ")}. Which pair is scheduled on an even-numbered weekday position (Tuesday and Thursday)?`;explanation=`The complete schedule is ${items.join(" → ")}; positions 2 and 4 contain ${items[1]} and ${items[3]}.`;}
 const pool=[...items,...slots,`${items[0]} and ${items[2]}`,`${items[2]} and ${items[4]}`,`${items[3]} and ${items[5]}`].filter(x=>x!==correct);
 return {subtopic:`Analytical schedule ${p+1}`,prompt,correct,distractors:pool.slice((p+v)%5,(p+v)%5+3),explanation,assessmentStyle:"multi-step",shortcut:"Create a six-slot grid, place fixed days first, then apply exact gaps before general before/after clues.",commonMistake:"‘Two days after’ means a difference of two slot numbers, with one day between; it does not mean two intervening days."};
});

export const seatingArrangementsLogicalBank=()=>buildLogicalBank(seatingPatterns);
export const analyticalPuzzlesLogicalBank=()=>buildLogicalBank(puzzlePatterns);
