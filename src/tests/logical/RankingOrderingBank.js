import { buildLogicalBank } from "./LogicalQuestionFactory.js";

const names=["Aarav","Bina","Charu","Dev","Esha","Farhan","Gita","Harsh"];
const patterns=Array.from({length:25},(_,p)=>v=>{
 const family=p%5, band=Math.floor(p/5), person=names[(p+v)%names.length];
 let prompt,correct,explanation;
 if(family===0){const total=42+4*band+v,top=7+band+v; correct=String(total-top+1); prompt=`In the merit list for Assessment ${v}, ${person} is ${top}${top===1?"st":top===2?"nd":top===3?"rd":"th"} from the top among ${total} candidates. What is ${person}'s rank from the bottom?`; explanation=`Bottom rank = total − top rank + 1 = ${total} − ${top} + 1 = ${correct}.`;}
 else if(family===1){const top=8+band+v,bottom=13+2*band+v; correct=String(top+bottom-1); prompt=`In Interview Queue ${v}, ${person} is ${top}th from the front and ${bottom}th from the rear. How many candidates are in the queue?`; explanation=`The candidate is counted in both ranks, so total = ${top} + ${bottom} − 1 = ${correct}.`;}
 else if(family===2){const first=5+band+v,second=19+2*band+v; correct=String(second-first-1); prompt=`In a descending score list for Round ${v}, ${person} is ranked ${first}th and another candidate is ranked ${second}th. How many candidates are strictly between them?`; explanation=`Candidates between two ranks = ${second} − ${first} − 1 = ${correct}.`;}
 else if(family===3){const a=6+band+v,b=17+2*band+v; correct=String(b); prompt=`In Coding Contest ${v}, ${person} is ${a}th from the top and swaps position with the candidate ranked ${b}th. What is ${person}'s new rank from the top?`; explanation=`After an exchange, each candidate occupies the other's original position; therefore ${person}'s new rank is ${correct}.`;}
 else {const people=names.slice(0,5),shift=(v+band)%5,rot=[...people.slice(shift),...people.slice(0,shift)]; correct=rot[2]; prompt=`Five trainees are ordered by score in Batch ${v}. ${rot[0]} scored above ${rot[1]}; ${rot[1]} above ${rot[2]}; ${rot[2]} above ${rot[3]}; and ${rot[3]} above ${rot[4]}. Who is exactly third?`; explanation=`The forced descending chain is ${rot.join(" > ")}; the middle, third-ranked trainee is ${correct}.`;}
 const numeric=!Number.isNaN(Number(correct));
 const distractors=numeric?[String(Number(correct)+1),String(Math.max(1,Number(correct)-1)),String(Number(correct)+2)]:names.filter(n=>n!==correct).slice((v-1)%3,(v-1)%3+3);
 return {subtopic:`Ranking pattern ${p+1}`,prompt,correct,distractors,explanation,assessmentStyle:family===4?"multi-step":"contextual",shortcut:"Translate every position into a numbered slot; remember total = top rank + bottom rank − 1.",commonMistake:"Do not forget the −1 correction when the same person is counted from both ends, or when counting people strictly between ranks."};
});
export const rankingOrderingLogicalBank=()=>buildLogicalBank(patterns);
