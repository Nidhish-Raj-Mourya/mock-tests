import { buildLogicalBank } from "./LogicalQuestionFactory.js";

const words=["CAMPUS","LOGIC","REASON","CAREER","APTITUDE","PLACEMENT","MODULE","SYSTEM","CODING","ANALYST","PROJECT","NETWORK","DIGITAL","OFFICE","MARKET","DESIGN","QUALITY","PROCESS","SKILLS","TRAINING","REPORT","CLIENT","SCREEN","RESULT","MATRIX","VECTOR","PUZZLE","SERIES","NUMBER","LETTER","CIPHER"];
const shift=(word,k)=>[...word].map(ch=>String.fromCharCode(65+(ch.charCodeAt(0)-65+k+26)%26)).join("");
const mirror=word=>[...word].map(ch=>String.fromCharCode(90-(ch.charCodeAt(0)-65))).join("");
const codingPatterns=Array.from({length:25},(_,p)=>v=>{
 const family=p%5,k=1+((p+v)%5),word=words[(p+2*v)%words.length],sample=words[(p+2*v+7)%words.length];
 let rule,encoded,correct,explanation;
 if(family===0){encoded=shift(sample,k);correct=shift(word,k);rule=`each letter is shifted ${k} places forward`;explanation=`Apply a +${k} alphabet shift to every letter of ${word}, wrapping after Z, to obtain ${correct}.`;}
 else if(family===1){encoded=mirror(sample);correct=mirror(word);rule="each letter is replaced by its opposite (A↔Z, B↔Y, ...)";explanation=`Mirror positions total 27: each position p becomes 27−p, giving ${correct}.`;}
 else if(family===2){const score=w=>[...w].reduce((s,ch)=>s+ch.charCodeAt(0)-64,0);encoded=String(score(sample));correct=String(score(word));rule="a word is coded as the sum of its letter positions";explanation=`Add the alphabet positions of ${word}; their total is ${correct}.`;}
 else if(family===3){encoded=shift([...sample].reverse().join(""),k);correct=shift([...word].reverse().join(""),k);rule=`the word is reversed and then every letter is shifted ${k} places forward`;explanation=`Reverse ${word}, then apply +${k} to each letter; this produces ${correct}.`;}
 else {const rearrange=w=>[...w].filter((_,i)=>i%2===0).join("")+[...w].filter((_,i)=>i%2===1).join("");encoded=rearrange(sample);correct=rearrange(word);rule="letters in odd positions are written first, followed by letters in even positions";explanation=`Reading positions 1,3,5,... and then 2,4,6,... in ${word} yields ${correct}.`;}
 const prompt=`In Codebook ${v}, ${sample} is written as ${encoded}. If ${rule}, how will ${word} be written?`;
 const distractors=typeof correct==="string"&&/^\d+$/.test(correct)?[String(+correct+v),String(Math.max(1,+correct-v)),String(+correct+2*v)]:[shift(word,k+1),[...correct].reverse().join(""),shift(word,Math.max(1,k-1))];
 return {subtopic:`Coding rule ${p+1}`,prompt,correct,distractors,explanation,assessmentStyle:"multi-step",shortcut:"Infer one consistent letter-by-letter or position-by-position operation from the example before applying it to the target word.",commonMistake:"Do not switch between zero-based and one-based alphabet positions, and preserve the order of operations in combined codes."};
});

const seriesPatterns=Array.from({length:25},(_,p)=>v=>{
 const family=p%5,seed=2+v+7*p,length=5; let seq=[],correct,rule;
 if(family===0){const d=3+v+Math.floor(p/5);seq=Array.from({length},(_,i)=>seed+i*d);correct=seed+length*d;rule=`a constant difference of ${d}`;}
 else if(family===1){const r=2+(p%2);seq=Array.from({length},(_,i)=>seed*r**i);correct=seed*r**length;rule=`each term is multiplied by ${r}`;}
 else if(family===2){seq=[seed];for(let i=1;i<=length;i++)seq.push(seq.at(-1)+(v+i));correct=seq.pop();rule=`successive additions ${v+1}, ${v+2}, ${v+3}, ...`;}
 else if(family===3){const offset=v+Math.floor(p/5);seq=Array.from({length},(_,i)=>(i+2)**2+offset);correct=(length+2)**2+offset;rule=`successive squares from 2² with a fixed +${offset}`;}
 else {const band=Math.floor(p/5),start=(p*5+v)%26,steps=[2+band,3+band,2+band,3+band,2+band];seq=[start];for(let i=0;i<4;i++)seq.push((seq.at(-1)+steps[i])%26);correct=String.fromCharCode(65+(seq.at(-1)+steps[4])%26);seq=seq.map(n=>String.fromCharCode(65+n));rule=`alternating alphabet jumps of +${2+band} and +${3+band}`;}
 const numeric=typeof correct==="number", distractors=numeric?[String(correct+v),String(correct-v),String(correct+(family+2))]:[String.fromCharCode(correct.charCodeAt(0)+1),String.fromCharCode(correct.charCodeAt(0)-1),String.fromCharCode(correct.charCodeAt(0)+2)];
 return {subtopic:`Series rule ${p+1}`,prompt:`Find the next term in Series ${v}: ${seq.join(", ")}, ?`,correct:String(correct),distractors,explanation:`The governing pattern is ${rule}; continuing it once gives ${correct}.`,assessmentStyle:"multi-step",shortcut:"Write first differences, ratios, or alternating-position subsequences before testing a more complex rule.",commonMistake:"Do not fit a rule to only the last two terms; verify it across every displayed transition."};
});

export const codingDecodingLogicalBank=()=>buildLogicalBank(codingPatterns);
export const numberLetterSeriesLogicalBank=()=>buildLogicalBank(seriesPatterns);
