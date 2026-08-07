import { buildLogicalBank } from "./LogicalQuestionFactory.js";

const sets=["Aarav,Bina,Charu,Dev,Esha","Farhan,Gita,Harsh,Ira,Jatin","Kabir,Leela,Manav,Naina,Om","Pari,Rohan,Sana,Tarun,Uma","Varun,Wamiqa,Yash,Zara,Adil","Bhavya,Chetan,Diya,Eshan,Falak"].map(s=>s.split(","));
const cases=[
 ["Maternal uncle",([a,b,c])=>`${a} is the brother of ${b}. ${b} is the mother of ${c}. How is ${a} related to ${c}?`,"Maternal uncle"],
 ["Paternal aunt",([a,b,c])=>`${a} is the sister of ${b}. ${b} is the father of ${c}. How is ${a} related to ${c}?`,"Paternal aunt"],
 ["Grandfather",([a,b,c])=>`${a} is the father of ${b}, who is the mother of ${c}. How is ${a} related to ${c}?`,"Maternal grandfather"],
 ["Grandmother",([a,b,c])=>`${a} is the mother of ${b}, who is the father of ${c}. How is ${a} related to ${c}?`,"Paternal grandmother"],
 ["Brother-in-law",([a,b,c])=>`${a} is the brother of ${b}. ${b} is married to ${c}. How is ${a} related to ${c}?`,"Brother-in-law"],
 ["Sister-in-law",([a,b,c])=>`${a} is the sister of ${b}. ${b} is married to ${c}. How is ${a} related to ${c}?`,"Sister-in-law"],
 ["Niece",([a,b,c])=>`${a} is the daughter of ${b}. ${b} is the brother of ${c}. How is ${a} related to ${c}?`,"Niece"],
 ["Nephew",([a,b,c])=>`${a} is the son of ${b}. ${b} is the sister of ${c}. How is ${a} related to ${c}?`,"Nephew"],
 ["Cousin female",([a,b,c,d])=>`${a} is the daughter of ${b}. ${b} and ${c} are sisters. ${c} is the mother of ${d}. How is ${a} related to ${d}?`,"Female cousin"],
 ["Cousin male",([a,b,c,d])=>`${a} is the son of ${b}. ${b} and ${c} are brothers. ${c} is the father of ${d}. How is ${a} related to ${d}?`,"Male cousin"],
 ["Great-grandmother",([a,b,c,d])=>`${a} is the mother of ${b}; ${b} is the father of ${c}; ${c} is the mother of ${d}. How is ${a} related to ${d}?`,"Great-grandmother"],
 ["Great-grandson",([a,b,c,d])=>`${a} is the son of ${b}; ${b} is the daughter of ${c}; ${c} is the son of ${d}. How is ${a} related to ${d}?`,"Great-grandson"],
 ["Only daughter",([a,b,c])=>`${a}, a woman, says: “${b} is the only son of my mother.” ${b} is the father of ${c}. How is ${a} related to ${c}?`,"Paternal aunt"],
 ["Photo relation",([a,b,c])=>`${a}, a man, points to ${b} and says, “She is the daughter of my only son, ${c}.” How is ${b} related to ${a}?`,"Granddaughter"],
 ["Son's wife",([a,b,c])=>`${a} is married to ${b}. ${b} is the only son of ${c}. How is ${a} related to ${c}?`,"Daughter-in-law"],
 ["Wife's father",([a,b,c])=>`${a} is the father of ${b}. ${b} is married to ${c}. How is ${a} related to ${c}?`,"Father-in-law"],
 ["Brother's son",([a,b,c])=>`${a} is a man. ${b} is ${a}'s brother and ${c} is ${b}'s son. How is ${c} related to ${a}?`,"Nephew"],
 ["Mother's sister",([a,b,c])=>`${a} is ${b}'s mother. ${c} is ${a}'s sister. How is ${c} related to ${b}?`,"Maternal aunt"],
 ["Father's brother",([a,b,c])=>`${a} is ${b}'s father. ${c} is ${a}'s brother. How is ${c} related to ${b}?`,"Paternal uncle"],
 ["Generation count",([a,b,c,d,e])=>`${a} is the mother of ${b}; ${b} is the father of ${c}; ${c} is the mother of ${d}; ${d} is the father of ${e}. How many generations below ${a} is ${e}?`,"Four generations"],
 ["Coded relation 1",([a,b,c])=>`In a code, X + Y means X is Y's mother and X × Y means X is Y's brother. What is ${a}'s relation to ${c} in ${a} × ${b} + ${c}?`,"Maternal uncle"],
 ["Coded relation 2",([a,b,c])=>`In a code, X − Y means X is Y's daughter and X ÷ Y means X is Y's father. What is ${a}'s relation to ${c} in ${a} − ${b} ÷ ${c}?`,"Sister"],
 ["Mixed family",([a,b,c,d])=>`${a} and ${b} are married. ${c} is ${a}'s sister. ${d} is the daughter of ${c}. How is ${d} related to ${b}?`,"Niece"],
 ["Single parent chain",([a,b,c,d])=>`${a} is the only daughter of ${b}. ${c} is ${a}'s only child and is male. ${d} is ${c}'s daughter. How is ${d} related to ${b}?`,"Great-granddaughter"],
 ["Count females",([a,b,c,d,e])=>`${a} is married to ${b}. Their children are son ${c} and daughter ${d}. ${c} is married to ${e}, a woman. How many females are explicitly identified?`,"Three"],
];
const all=["Maternal uncle","Paternal aunt","Maternal grandfather","Paternal grandmother","Brother-in-law","Sister-in-law","Niece","Nephew","Female cousin","Male cousin","Great-grandmother","Great-grandson","Granddaughter","Daughter-in-law","Father-in-law","Maternal aunt","Paternal uncle","Four generations","Sister","Great-granddaughter","Three"];
const patterns=cases.map(([subtopic,prompt,correct],i)=>v=>({subtopic,prompt:prompt(sets[v-1]),correct,distractors:Array.from(new Set([all[(i+3)%all.length],all[(i+7)%all.length],all[(i+11)%all.length]])).filter(x=>x!==correct).slice(0,3),explanation:`Draw generations on horizontal levels and connect spouses laterally. Following the stated parent/sibling links places the target in the ${correct.toLowerCase()} position.`,assessmentStyle:"multi-step",shortcut:"Mark gender beside each person, place generations on separate rows, and answer only after reversing the viewpoint if required.",commonMistake:"The question asks the first named person's relation to the second; reversing that order changes the answer."}));
export const bloodRelationsLogicalBank=()=>buildLogicalBank(patterns);
