import { useState, useEffect, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// GUARANTEED BALANCED SHUFFLE ENGINE — Aptitude Series 1
// 90 Q · A=23 B=22 C=23 D=22 · section-wise Q shuffle · option shuffle · run ≤ 2
// Seed = attemptId (unique per attempt, not only student name)
// ═══════════════════════════════════════════════════════════════════════════════

const ANS_TEMPLATE = [0,2,1,3,0,2,1,3,2,0,3,1,0,2,3,1,2,0,1,3,0,2,1,3,0,2,1,3,2,0,3,1,0,2,3,1,2,0,1,3,0,2,1,3,0,2,1,3,2,0,3,1,0,2,3,1,2,0,1,3,0,2,1,3,0,2,1,3,2,0,3,1,0,2,3,1,2,0,1,3,0,2,1,3,0,2,1,3,2,0];
const TARGET_DIST = {0:23,1:22,2:23,3:22};

function mulberry32(seed) {
  let s = seed & 0xFFFFFFFF;
  return function() {
    s = (s + 0x6D2B79F5) & 0xFFFFFFFF;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) & 0xFFFFFFFF;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function strToSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  return Math.abs(h) || 99991;
}
function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function breakRuns(questions, targetDist) {
  const qs = questions.map(q => ({ ...q, opts: [...q.opts] }));
  const dist = {0:0,1:0,2:0,3:0};
  qs.forEach(q => dist[q.ans]++);

  for (let pass = 0; pass < 30; pass++) {
    let changed = false;
    for (let i = 2; i < qs.length; i++) {
      if (qs[i].ans === qs[i-1].ans && qs[i].ans === qs[i-2].ans) {
        const bad = qs[i].ans;
        const candidates = [0,1,2,3]
          .filter(n => n !== bad)
          .sort((a,b) => (dist[a]-targetDist[a]) - (dist[b]-targetDist[b]));
        for (const n of candidates) {
          const okFwd = i >= qs.length-1 || n !== qs[i+1].ans;
          const okBk  = !(i >= 2 && qs[i-1].ans === n && qs[i-2].ans === n);
          if (okFwd && okBk) {
            [qs[i].opts[bad], qs[i].opts[n]] = [qs[i].opts[n], qs[i].opts[bad]];
            dist[bad]--; dist[n]++;
            qs[i].ans = n; changed = true; break;
          }
        }
      }
    }
    if (!changed) break;
  }
  return qs;
}

function applyShuffles(questions, seedKey) {
  const bySection = {};
  questions.forEach(q => { if (!bySection[q.cat]) bySection[q.cat] = []; bySection[q.cat].push(q); });
  const sectionOrder = [...new Set(questions.map(q => q.cat))];
  let ordered = [];
  sectionOrder.forEach(cat => {
    const rng = mulberry32(strToSeed(seedKey + cat + "qorder"));
    ordered = ordered.concat(seededShuffle(bySection[cat], rng));
  });

  const tmplRng = mulberry32(strToSeed(seedKey + "tmpl"));
  const slots = seededShuffle([...Array(ANS_TEMPLATE.length).keys()], tmplRng);
  const targets = slots.map(i => ANS_TEMPLATE[i]);

  const result = ordered.map((q, i) => {
    const tgt = targets[i], cur = q.ans;
    const opts = [...q.opts];
    [opts[cur], opts[tgt]] = [opts[tgt], opts[cur]];
    return { ...q, opts, ans: tgt };
  });

  return breakRuns(result, TARGET_DIST);
}

function makeAttemptId() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AS1-${t}-${r}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION BANK — Mock Test Aptitude Series 1 (90 Q · Aptitude Only)
// Source distribution aims near-balanced; engine enforces A23 B22 C23 D22
// ═══════════════════════════════════════════════════════════════════════════════

const questions = [
  // ══ 1. DIVISIBILITY (10) ═══════════════════════════════════════════════════
  {id:1,  cat:"Div", q:"Find the value of x if 72x4 is divisible by 9.",
   opts:["2","5","6","8"], ans:1},
  {id:2,  cat:"Div", q:"Which of the following numbers is divisible by 11?",
   opts:["2178","2187","2196","2205"], ans:0},
  {id:3,  cat:"Div", q:"How many 3-digit numbers are divisible by both 6 and 8?",
   opts:["36","37","38","40"], ans:1},
  {id:4,  cat:"Div", q:"What is the smallest 4-digit number divisible by 12, 15 and 20?",
   opts:["1008","1020","1040","1080"], ans:1},
  {id:5,  cat:"Div", q:"Which of the following numbers is divisible by 8?",
   opts:["1234","1240","1246","1252"], ans:1},
  {id:6,  cat:"Div", q:"A number is divisible by both 3 and 5. Which of the following is always true?",
   opts:["It is divisible by 8","It is divisible by 15","It is divisible by 6","It is divisible by 9"], ans:1},
  {id:7,  cat:"Div", q:"What is the largest 3-digit number divisible by 7?",
   opts:["987","994","998","999"], ans:1},
  {id:8,  cat:"Div", q:"How many integers from 1 to 200 are divisible by 2 or 5?",
   opts:["110","115","120","125"], ans:2},
  {id:9,  cat:"Div", q:"If 381x is divisible by 9, what is the digit x?",
   opts:["3","6","0","9"], ans:1},
  {id:10, cat:"Div", q:"A number when divided by 357 leaves remainder 51. The number is always divisible by:",
   opts:["17","19","21","51"], ans:0},

  // ══ 2. NUMBER SYSTEM (15) ══════════════════════════════════════════════════
  {id:11, cat:"NumSys", q:"Find the unit digit of 7^85.",
   opts:["7","9","3","1"], ans:0},
  {id:12, cat:"NumSys", q:"When a number is divided by 12, the remainder is 7. What is the remainder when twice the number is divided by 12?",
   opts:["2","4","5","7"], ans:0},
  {id:13, cat:"NumSys", q:"How many numbers from 1 to 100 are divisible by 3 or 5?",
   opts:["47","48","49","50"], ans:0},
  {id:14, cat:"NumSys", q:"The sum of the first 20 odd natural numbers is:",
   opts:["380","400","420","440"], ans:1},
  {id:15, cat:"NumSys", q:"Which of the following is an irrational number?",
   opts:["√4","√9","√2","22/7"], ans:2},
  {id:16, cat:"NumSys", q:"What is the place value of 7 in the number 570832?",
   opts:["7","70","7000","70000"], ans:3},
  {id:17, cat:"NumSys", q:"The product of two consecutive integers is always:",
   opts:["Odd","Even","Prime","A perfect square"], ans:1},
  {id:18, cat:"NumSys", q:"What is the remainder when (2^10 + 2^9) is divided by 2^8?",
   opts:["0","1","2","4"], ans:0},
  {id:19, cat:"NumSys", q:"How many prime numbers are there between 1 and 20?",
   opts:["6","7","8","9"], ans:2},
  {id:20, cat:"NumSys", q:"If n is an odd integer, then n² − 1 is always divisible by:",
   opts:["2","4","6","8"], ans:3},
  {id:21, cat:"NumSys", q:"Find the unit digit of 3^27 × 7^27.",
   opts:["1","3","7","9"], ans:0},
  {id:22, cat:"NumSys", q:"Which natural number is neither prime nor composite?",
   opts:["0","1","2","9"], ans:1},
  {id:23, cat:"NumSys", q:"Express the recurring decimal 0.252525... as a fraction.",
   opts:["25/99","25/100","25/90","24/99"], ans:0},
  {id:24, cat:"NumSys", q:"What is the remainder when 9^25 + 7 is divided by 8?",
   opts:["0","1","2","7"], ans:0},
  {id:25, cat:"NumSys", q:"How many whole numbers lie strictly between 17 and 42?",
   opts:["23","24","25","26"], ans:1},

  // ══ 3. FACTORS & PRIME FACTORS (12) ════════════════════════════════════════
  {id:26, cat:"Factors", q:"Find the number of factors of 360.",
   opts:["18","20","24","30"], ans:2},
  {id:27, cat:"Factors", q:"What least number should be multiplied by 180 to make it a perfect square?",
   opts:["2","3","5","10"], ans:2},
  {id:28, cat:"Factors", q:"How many prime numbers are there between 50 and 100?",
   opts:["8","9","10","11"], ans:2},
  {id:29, cat:"Factors", q:"Find the number of even factors of 84.",
   opts:["6","8","10","12"], ans:1},
  {id:30, cat:"Factors", q:"What is the smallest prime factor of 143?",
   opts:["7","11","13","17"], ans:1},
  {id:31, cat:"Factors", q:"If N = 2⁴ × 3² × 5, how many odd factors does N have?",
   opts:["4","5","6","8"], ans:2},
  {id:32, cat:"Factors", q:"How many perfect squares are there between 1 and 50 (inclusive)?",
   opts:["6","7","8","9"], ans:1},
  {id:33, cat:"Factors", q:"If a number has exactly 3 positive factors, then the number must be:",
   opts:["A prime","Square of a prime","A cube of a prime","An even composite"], ans:1},
  {id:34, cat:"Factors", q:"Find the number of factors of 720.",
   opts:["24","28","30","36"], ans:2},
  {id:35, cat:"Factors", q:"What least number should divide 2940 so that the quotient is a perfect square?",
   opts:["10","14","15","21"], ans:2},
  {id:36, cat:"Factors", q:"How many composite numbers are there between 20 and 30?",
   opts:["5","6","7","8"], ans:2},
  {id:37, cat:"Factors", q:"Find the number of factors of 2⁵ × 3³ × 5².",
   opts:["60","72","84","96"], ans:1},

  // ══ 4. LCM & HCF (15) ══════════════════════════════════════════════════════
  {id:38, cat:"LCMHCF", q:"Two numbers have HCF 12 and LCM 180. If one number is 36, find the other.",
   opts:["48","60","72","84"], ans:1},
  {id:39, cat:"LCMHCF", q:"Three bells ring at intervals of 12, 15 and 20 minutes. After how many minutes will they ring together again?",
   opts:["60 minutes","45 minutes","90 minutes","120 minutes"], ans:0},
  {id:40, cat:"LCMHCF", q:"Find the least number which leaves remainder 3 when divided by 5, 6, 8 and 12.",
   opts:["120","123","125","127"], ans:1},
  {id:41, cat:"LCMHCF", q:"Find the HCF of 144 and 180.",
   opts:["24","36","48","72"], ans:1},
  {id:42, cat:"LCMHCF", q:"Find the LCM of 16, 24 and 36.",
   opts:["144","288","72","96"], ans:0},
  {id:43, cat:"LCMHCF", q:"The LCM of two numbers is 336 and their HCF is 4. If one number is 28, find the other.",
   opts:["42","48","56","64"], ans:1},
  {id:44, cat:"LCMHCF", q:"Find the HCF of the fractions 2/3, 4/5 and 6/7.",
   opts:["2/105","2/3","4/105","1/105"], ans:0},
  {id:45, cat:"LCMHCF", q:"Find the LCM of the fractions 2/3, 4/9 and 5/6.",
   opts:["20/3","10/3","20/9","5/3"], ans:0},
  {id:46, cat:"LCMHCF", q:"Find the greatest number which divides 1356 and 1860 leaving remainder 12 in each case.",
   opts:["168","156","144","180"], ans:0},
  {id:47, cat:"LCMHCF", q:"Three traffic lights change every 40, 60 and 72 seconds. After how long will they change together again?",
   opts:["5 minutes","6 minutes","7 minutes","8 minutes"], ans:1},
  {id:48, cat:"LCMHCF", q:"The product of two numbers is 2160 and their HCF is 12. Find their LCM.",
   opts:["160","180","200","240"], ans:1},
  {id:49, cat:"LCMHCF", q:"Find the least number which is exactly divisible by 12, 15, 20 and 54.",
   opts:["540","560","580","600"], ans:0},
  {id:50, cat:"LCMHCF", q:"Two numbers are in the ratio 3:5 and their HCF is 15. Find their LCM.",
   opts:["150","225","300","375"], ans:1},
  {id:51, cat:"LCMHCF", q:"What is the remainder when the LCM of 16 and 24 is divided by their HCF?",
   opts:["0","1","2","4"], ans:0},
  {id:52, cat:"LCMHCF", q:"Find the HCF of 2³×3²×5 and 2²×3×5².",
   opts:["30","60","90","120"], ans:1},

  // ══ 5. PERCENTAGES (15) ════════════════════════════════════════════════════
  {id:53, cat:"Pct", q:"A number is increased by 20% and then decreased by 20%. What is the net change?",
   opts:["No change","4% decrease","4% increase","2% decrease"], ans:1},
  {id:54, cat:"Pct", q:"A student scored 72 marks out of 90. What is the percentage?",
   opts:["75%","80%","85%","90%"], ans:1},
  {id:55, cat:"Pct", q:"The price of an article increased from ₹800 to ₹920. Find the percentage increase.",
   opts:["12%","15%","18%","20%"], ans:1},
  {id:56, cat:"Pct", q:"35% of a number exceeds 25% of the same number by 80. Find the number.",
   opts:["600","700","800","900"], ans:2},
  {id:57, cat:"Pct", q:"The population of a town is 10,000. It increases by 10% every year. What is the population after 2 years?",
   opts:["12,000","12,100","12,200","11,000"], ans:1},
  {id:58, cat:"Pct", q:"A is 20% more than B. By what percent is B less than A?",
   opts:["16.67%","20%","25%","15%"], ans:0},
  {id:59, cat:"Pct", q:"Two successive discounts of 20% and 10% are equivalent to a single discount of:",
   opts:["28%","30%","32%","25%"], ans:0},
  {id:60, cat:"Pct", q:"Express 3/8 as a percentage.",
   opts:["35%","37.5%","38%","40%"], ans:1},
  {id:61, cat:"Pct", q:"A salary is increased by 15% and then again by 10%. Find the net percentage increase.",
   opts:["25%","26.5%","27%","28%"], ans:1},
  {id:62, cat:"Pct", q:"If the price of rice is reduced by 20%, a person can buy 5 kg more for ₹400. What was the original price per kg?",
   opts:["₹16","₹20","₹25","₹18"], ans:1},
  {id:63, cat:"Pct", q:"In an exam, 30% fail in English, 40% fail in Maths and 10% fail in both. What percent pass in both subjects?",
   opts:["40%","50%","60%","70%"], ans:0},
  {id:64, cat:"Pct", q:"A machine worth ₹50,000 depreciates by 10% every year. What is its value after 2 years?",
   opts:["₹40,000","₹40,500","₹45,000","₹41,000"], ans:1},
  {id:65, cat:"Pct", q:"x% of y is equal to y% of:",
   opts:["x","y","100","xy/100"], ans:0},
  {id:66, cat:"Pct", q:"A student needs 40% marks to pass. He scores 210 and fails by 30 marks. Find the maximum marks.",
   opts:["500","600","700","750"], ans:1},
  {id:67, cat:"Pct", q:"A number is first increased by 10% and then by 20%. By what percent should it now be decreased to restore the original value?",
   opts:["20%","24.24%","25%","30%"], ans:1},

  // ══ 6. PROFIT & LOSS (13) ══════════════════════════════════════════════════
  {id:68, cat:"PnL", q:"A shopkeeper sells 15 items at the cost price of 12 items. Find his profit percentage.",
   opts:["20%","25%","30%","15%"], ans:1},
  {id:69, cat:"PnL", q:"An article is marked 40% above cost price and sold at 10% discount. Find the profit percentage.",
   opts:["26%","30%","24%","28%"], ans:0},
  {id:70, cat:"PnL", q:"A man sells two items at ₹600 each — one at 20% profit and the other at 20% loss. Find the overall result.",
   opts:["No profit no loss","4% loss","4% profit","2% loss"], ans:1},
  {id:71, cat:"PnL", q:"An article costs ₹800 and is sold for ₹920. Find the profit percentage.",
   opts:["12%","15%","18%","20%"], ans:1},
  {id:72, cat:"PnL", q:"By selling an article for ₹540, a shopkeeper incurs a loss of 10%. Find its cost price.",
   opts:["₹580","₹600","₹620","₹540"], ans:1},
  {id:73, cat:"PnL", q:"A dishonest dealer claims to sell at cost price but uses a weight of 900 g for 1 kg. Find his profit percentage.",
   opts:["10%","11.11%","12%","9%"], ans:1},
  {id:74, cat:"PnL", q:"An article marked at ₹2000 is sold after successive discounts of 10% and 20%. Find the selling price.",
   opts:["₹1440","₹1400","₹1600","₹1500"], ans:0},
  {id:75, cat:"PnL", q:"By selling an article for ₹240, a person gains 20%. At what selling price will he gain 30%?",
   opts:["₹250","₹260","₹270","₹280"], ans:1},
  {id:76, cat:"PnL", q:"A sells an article to B at 20% profit. B sells it to C at 25% profit. If C paid ₹750, find A's cost price.",
   opts:["₹500","₹550","₹600","₹450"], ans:0},
  {id:77, cat:"PnL", q:"An article is marked at ₹800. After a discount of 15%, the seller still makes 20% profit. Find the cost price.",
   opts:["₹566.67","₹550","₹600","₹580"], ans:0},
  {id:78, cat:"PnL", q:"A fruit seller buys bananas at 12 for ₹10 and sells them at 10 for ₹12. Find his profit percentage.",
   opts:["40%","44%","48%","50%"], ans:1},
  {id:79, cat:"PnL", q:"An article is sold at 10% loss. If it had been sold for ₹60 more, there would have been 5% profit. Find the cost price.",
   opts:["₹350","₹400","₹450","₹500"], ans:1},
  {id:80, cat:"PnL", q:"A shopkeeper allows 10% discount on marked price and still gains 20%. If no discount is given, what is his profit percentage?",
   opts:["30%","33.33%","35%","40%"], ans:1},

  // ══ 7. SI & CI (10) ════════════════════════════════════════════════════════
  {id:81, cat:"SICI", q:"Find the simple interest on ₹8000 at 12% per annum for 2 years.",
   opts:["₹1800","₹1920","₹2000","₹1600"], ans:1},
  {id:82, cat:"SICI", q:"The difference between SI and CI on a sum for 2 years at 10% per annum is ₹50. Find the principal.",
   opts:["₹4000","₹5000","₹6000","₹8000"], ans:1},
  {id:83, cat:"SICI", q:"A sum becomes ₹12,100 in 2 years at 10% compound interest (annual). Find the principal.",
   opts:["₹10,000","₹11,000","₹9,000","₹10,500"], ans:0},
  {id:84, cat:"SICI", q:"The simple interest on a sum for 3 years at 5% per annum is ₹600. Find the principal.",
   opts:["₹3500","₹4000","₹4500","₹5000"], ans:1},
  {id:85, cat:"SICI", q:"Find the compound interest on ₹5000 for 2 years at 10% per annum (compounded annually).",
   opts:["₹1000","₹1050","₹1100","₹1200"], ans:1},
  {id:86, cat:"SICI", q:"At what rate of simple interest will ₹8000 become ₹9200 in 3 years?",
   opts:["4%","5%","6%","8%"], ans:1},
  {id:87, cat:"SICI", q:"In how many years will a sum of money double itself at 10% per annum simple interest?",
   opts:["8 years","10 years","12 years","15 years"], ans:1},
  {id:88, cat:"SICI", q:"Find the difference between CI and SI on ₹10,000 for 2 years at 5% per annum.",
   opts:["₹20","₹25","₹30","₹50"], ans:1},
  {id:89, cat:"SICI", q:"A sum at compound interest doubles in 4 years. In how many years will it become 8 times at the same rate?",
   opts:["8 years","10 years","12 years","16 years"], ans:2},
  {id:90, cat:"SICI", q:"The SI on a sum for 2 years at 10% per annum is ₹800. Find the CI on the same sum for the same period at the same rate.",
   opts:["₹820","₹840","₹860","₹880"], ans:1},
];

const SECS = [
  { key:"Div",     label:"Divisibility Test",           emoji:"➗", color:"#4f46e5", count:10 },
  { key:"NumSys",  label:"Number System",               emoji:"🔢", color:"#d97706", count:15 },
  { key:"Factors", label:"Factors & Prime Factors",     emoji:"🧩", color:"#059669", count:12 },
  { key:"LCMHCF",  label:"LCM & HCF",                   emoji:"🔗", color:"#0891b2", count:15 },
  { key:"Pct",     label:"Percentages",                 emoji:"📊", color:"#db2777", count:15 },
  { key:"PnL",     label:"Profit & Loss",               emoji:"💰", color:"#ea580c", count:13 },
  { key:"SICI",    label:"Simple & Compound Interest",  emoji:"📈", color:"#7c3aed", count:10 },
];

const COURSES = ["B.Tech / B.E.", "BCA", "MCA"];
const COURSE_YEARS = {
  "B.Tech / B.E.": ["1st Year","2nd Year","3rd Year","4th Year"],
  "BCA":           ["1st Year","2nd Year","3rd Year"],
  "MCA":           ["1st Year","2nd Year"],
};

const T = {
  bg:"#f1f5f9", card:"#ffffff", border:"#e2e8f0", border2:"#cbd5e1",
  accent:"#4f46e5", accentL:"#eef2ff", text:"#0f172a", sub:"#475569", muted:"#94a3b8",
  green:"#059669", greenL:"#ecfdf5", red:"#dc2626", redL:"#fef2f2", yellow:"#d97706",
  shadow:"0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
  shadow2:"0 2px 8px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.08)",
};
const bodyFont = "'Segoe UI','Inter',system-ui,sans-serif";
const monoFont = "'Fira Code','Courier New',monospace";
const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

function ReportCard({ student, attemptId, answers, shuffled, onClose }) {
  const score = shuffled.reduce((s,q,i)=>s+(answers[i]===q.ans?1:0),0);
  const pct = Math.round(score/90*100);
  const grade = pct>=80?"A":pct>=65?"B":pct>=50?"C":pct>=35?"D":"F";
  const gColor = pct>=80?"#059669":pct>=65?"#4f46e5":pct>=50?"#d97706":pct>=35?"#ea580c":"#dc2626";
  const remark = pct>=80?"Outstanding":pct>=65?"Good":pct>=50?"Average":pct>=35?"Below Average":"Needs Improvement";
  const date = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  const secScores = SECS.map(sec=>{
    const qs = shuffled.filter(q=>q.cat===sec.key);
    const c = qs.filter(q=>answers[shuffled.indexOf(q)]===q.ans).length;
    return {...sec,c,t:qs.length,pct:qs.length?Math.round(c/qs.length*100):0};
  });
  const dl = ()=>{
    const h = `<!DOCTYPE html><html><head><title>Report Card – ${student.name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#fff;color:#0f172a;padding:36px;font-size:14px}.hdr{text-align:center;padding-bottom:20px;margin-bottom:24px;border-bottom:2px solid #4f46e5}.org{font-size:11px;font-weight:700;color:#4f46e5;letter-spacing:3px;margin-bottom:8px}h1{font-size:24px;font-weight:800;margin-bottom:4px}.dt{font-size:12px;color:#64748b}.ir{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:24px}.ib{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px}.il{font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}.iv{font-size:14px;font-weight:700}.sr{display:flex;justify-content:center;gap:48px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px}.sb{text-align:center}.big{font-size:52px;font-weight:900;line-height:1}.sm{font-size:13px;color:#64748b;margin-top:4px}table{width:100%;border-collapse:collapse;margin-bottom:24px}th{background:#0f172a;color:#fff;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px}td{padding:9px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}tr:nth-child(even) td{background:#f8fafc}.bar{background:#e2e8f0;border-radius:4px;height:5px;width:80px;display:inline-block;vertical-align:middle;margin-left:8px}.bi{height:100%;border-radius:4px}.ftr{text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}.st{display:inline-block;border:2px solid #4f46e5;color:#4f46e5;border-radius:6px;padding:4px 14px;font-size:11px;font-weight:700;letter-spacing:2px;margin-top:8px}.aid{font-size:11px;color:#64748b;margin-top:6px;font-family:monospace}</style></head><body>
    <div class="hdr"><div class="org">The Entangle · Elite 100 Club</div><h1>Mock Test — Aptitude Series 1</h1><div class="dt">Placement Aptitude Assessment · ${date}</div><div class="aid">Attempt ID: ${attemptId}</div></div>
    <div class="ir"><div class="ib"><div class="il">Student</div><div class="iv">${student.name}</div></div><div class="ib"><div class="il">College</div><div class="iv">${student.college}</div></div><div class="ib"><div class="il">Course</div><div class="iv">${student.course}</div></div><div class="ib"><div class="il">Year</div><div class="iv">${student.year}</div></div></div>
    <div class="sr"><div class="sb"><div class="big">${score}<span style="font-size:22px;color:#64748b">/90</span></div><div class="sm">Total Score</div></div><div class="sb"><div class="big" style="color:${gColor}">${grade}</div><div class="sm">Grade</div></div><div class="sb"><div class="big" style="color:${gColor}">${pct}%</div><div class="sm" style="color:${gColor};font-weight:700">${remark}</div></div></div>
    <table><tr><th>Section</th><th>Score</th><th>Total</th><th>%</th><th>Performance</th></tr>${secScores.map(s=>`<tr><td><strong>${s.emoji} ${s.label}</strong></td><td><strong>${s.c}</strong></td><td>${s.t}</td><td style="font-weight:700;color:${s.pct>=60?"#059669":s.pct>=40?"#d97706":"#dc2626"}">${s.pct}%</td><td><div class="bar"><div class="bi" style="width:${s.pct}%;background:${s.pct>=60?"#059669":s.pct>=40?"#d97706":"#dc2626"}"></div></div></td></tr>`).join("")}<tr style="background:#f0fdf4"><td><strong>TOTAL</strong></td><td><strong>${score}</strong></td><td><strong>90</strong></td><td style="font-weight:800;color:${gColor}">${pct}%</td><td><div class="bar"><div class="bi" style="width:${pct}%;background:${gColor}"></div></div></td></tr></table>
    <div class="ftr"><p>Score & topic-wise breakdown only · Answer key not disclosed</p><p>Auto-generated by The Entangle · Elite 100 Club · Indore</p><div class="st">ELITE 100 CLUB</div></div></body></html>`;
    const blob = new Blob([h],{type:"text/html"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ReportCard_AptitudeSeries1_${student.name.replace(/\s+/g,"_")}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",overflowY:"auto"}}>
      <div style={{background:T.card,borderRadius:"16px",padding:"28px 32px",maxWidth:"580px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:T.shadow2}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px"}}>
          <div>
            <div style={{fontSize:"10px",color:T.accent,fontWeight:"700",letterSpacing:"2px",marginBottom:"3px"}}>THE ENTANGLE · ELITE 100 CLUB</div>
            <div style={{fontSize:"18px",fontWeight:"800",color:T.text}}>Aptitude Series 1 — Report Card</div>
            <div style={{fontSize:"11px",color:T.muted,fontFamily:monoFont,marginTop:"4px"}}>Attempt: {attemptId}</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.sub,padding:"6px 12px",borderRadius:"7px",fontFamily:bodyFont,cursor:"pointer",fontSize:"13px"}}>✕</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"8px",marginBottom:"18px"}}>
          {[["Student",student.name],["College",student.college],["Course",student.course],["Year",student.year]].map(([l,v])=>(
            <div key={l} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"8px",padding:"10px 12px"}}>
              <div style={{fontSize:"10px",color:T.muted,fontWeight:"700",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"2px"}}>{l}</div>
              <div style={{fontSize:"12px",fontWeight:"700",color:T.text}}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{background:T.accentL,border:"1px solid #c7d2fe",borderRadius:"12px",padding:"18px",marginBottom:"18px",display:"flex",justifyContent:"space-around",textAlign:"center"}}>
          <div><div style={{fontSize:"42px",fontWeight:"900",color:T.text,lineHeight:1}}>{score}<span style={{fontSize:"17px",color:T.muted}}>/90</span></div><div style={{fontSize:"11px",color:T.sub,marginTop:"3px"}}>Total Score</div></div>
          <div><div style={{fontSize:"48px",fontWeight:"900",color:gColor,lineHeight:1}}>{grade}</div><div style={{fontSize:"11px",color:T.sub,marginTop:"3px"}}>Grade</div></div>
          <div><div style={{fontSize:"34px",fontWeight:"800",color:gColor,lineHeight:1}}>{pct}%</div><div style={{fontSize:"12px",color:gColor,fontWeight:"700",marginTop:"3px"}}>{remark}</div></div>
        </div>
        <div style={{marginBottom:"20px"}}>
          {secScores.map(s=>(
            <div key={s.key} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"7px",padding:"8px 12px",background:T.bg,borderRadius:"8px",border:`1px solid ${T.border}`}}>
              <span style={{fontSize:"14px"}}>{s.emoji}</span><span style={{fontSize:"13px",color:T.text,flex:1,fontWeight:"600"}}>{s.label}</span>
              <span style={{fontSize:"12px",color:T.sub}}>{s.c}/{s.t}</span>
              <div style={{width:"70px",height:"4px",background:T.border2,borderRadius:"99px",overflow:"hidden"}}><div style={{width:`${s.pct}%`,height:"100%",background:s.pct>=60?T.green:s.pct>=40?T.yellow:T.red,borderRadius:"99px"}}/></div>
              <span style={{fontSize:"11px",fontWeight:"700",color:s.pct>=60?T.green:s.pct>=40?T.yellow:T.red,minWidth:"30px",textAlign:"right"}}>{s.pct}%</span>
            </div>
          ))}
        </div>
        <button onClick={dl} style={{width:"100%",background:T.accent,color:"#fff",border:"none",padding:"13px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"15px",fontWeight:"700",cursor:"pointer"}}>⬇️ Download Report Card</button>
        <div style={{fontSize:"11px",color:T.muted,textAlign:"center",marginTop:"7px"}}>Score & topic-wise only · Answer key not included</div>
      </div>
    </div>
  );
}

export default function MockTest() {
  const [phase,setPhase] = useState("onboard");
  const [student,setStudent] = useState({name:"",college:"",course:"",year:""});
  const [attemptId,setAttemptId] = useState("");
  const [errors,setErrors] = useState({});
  const [current,setCurrent] = useState(0);
  const [selected,setSelected] = useState(null);
  const [answers,setAnswers] = useState({});
  const [timeLeft,setTimeLeft] = useState(120*60);
  const [visible,setVisible] = useState(true);
  const [showMap,setShowMap] = useState(false);
  const [showCard,setShowCard] = useState(false);
  const timerRef = useRef(null);

  const shuffled = useMemo(
    () => (attemptId ? applyShuffles(questions, attemptId) : questions),
    [attemptId]
  );

  useEffect(()=>{
    if (phase === "test") {
      timerRef.current = setInterval(()=>setTimeLeft(t=>{
        if (t <= 1) { clearInterval(timerRef.current); setPhase("result"); return 0; }
        return t - 1;
      }), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const validate = () => {
    const e = {};
    if (!student.name.trim()) e.name = "Name is required";
    if (!student.college.trim()) e.college = "College name is required";
    if (!student.course) e.course = "Please select your course";
    if (!student.year) e.year = "Please select your year";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const startTest = () => {
    if (!validate()) return;
    setAttemptId(makeAttemptId());
    setCurrent(0);
    setSelected(null);
    setAnswers({});
    setTimeLeft(120 * 60);
    setPhase("test");
  };

  const tr = cb => { setVisible(false); setTimeout(()=>{ setVisible(true); cb(); }, 150); };

  const next = () => {
    if (selected === null) return;
    setAnswers(a => ({...a, [current]: selected}));
    setSelected(null);
    tr(() => {
      if (current + 1 >= shuffled.length) {
        clearInterval(timerRef.current);
        setPhase("result");
      } else setCurrent(c => c + 1);
    });
  };

  const skip = () => {
    setSelected(null);
    tr(() => {
      if (current + 1 >= shuffled.length) {
        clearInterval(timerRef.current);
        setPhase("result");
      } else setCurrent(c => c + 1);
    });
  };

  const jumpTo = i => { setSelected(answers[i] ?? null); tr(() => setCurrent(i)); setShowMap(false); };

  const score = shuffled.reduce((s,q,i)=>s+(answers[i]===q.ans?1:0),0);
  const tp = Math.round(score/90*100);
  const grade = tp>=80?"A":tp>=65?"B":tp>=50?"C":tp>=35?"D":"F";
  const gc = tp>=80?T.green:tp>=65?T.accent:tp>=50?T.yellow:tp>=35?"#ea580c":T.red;
  const rmk = tp>=80?"Outstanding":tp>=65?"Good Job":tp>=50?"Average":tp>=35?"Below Average":"Needs Improvement";

  const q = shuffled[current];
  const si = SECS.find(s => s.key === q?.cat);
  const ss = q ? shuffled.findIndex(qq => qq.cat === q.cat) : 0;
  const answered = Object.keys(answers).length;
  const tqs = shuffled.length;

  const card = {background:T.card,borderRadius:"16px",padding:"36px 40px",maxWidth:"680px",width:"100%",boxShadow:T.shadow2};
  const inp = err => ({width:"100%",background:T.bg,border:`1.5px solid ${err?T.red:T.border2}`,borderRadius:"10px",padding:"12px 16px",color:T.text,fontFamily:bodyFont,fontSize:"15px",outline:"none"});

  if (phase === "onboard") return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
      <div style={card}>
        <div style={{textAlign:"center",marginBottom:"28px"}}>
          <div style={{fontSize:"11px",color:T.accent,fontWeight:"700",letterSpacing:"3px",marginBottom:"10px"}}>THE ENTANGLE · ELITE 100 CLUB</div>
          <h1 style={{fontSize:"26px",fontWeight:"800",color:T.text,margin:"0 0 8px"}}>Mock Test — Aptitude Series 1</h1>
          <p style={{color:T.sub,fontSize:"15px",margin:0}}>Placement Aptitude Assessment · 90 Questions · 120 Minutes</p>
        </div>

        <div style={{background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:"12px",padding:"16px 18px",marginBottom:"12px"}}>
          <div style={{fontSize:"12px",fontWeight:"700",color:T.accent,marginBottom:"8px"}}>APTITUDE ONLY · 7 SECTIONS</div>
          <div style={{fontSize:"13px",color:T.text,lineHeight:1.7}}>
            Divisibility (10) · Number System (15) · Factors (12) · LCM-HCF (15)<br/>
            Percentages (15) · Profit & Loss (13) · SI & CI (10)
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}}>
          {[["⏱","120 Minutes"],["📋","90 Questions"],["🎯","Medium → Hard"]].map(([icon,label])=>(
            <div key={label} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"12px",textAlign:"center",fontSize:"13px",color:T.sub,fontWeight:"600"}}>
              {icon} {label}
            </div>
          ))}
        </div>

        <div style={{background:"#fefce8",border:"1px solid #fde68a",borderRadius:"10px",padding:"12px 16px",marginBottom:"24px"}}>
          <div style={{fontSize:"12px",color:"#92400e",fontWeight:"600"}}>🔀 Unique attempt ID · Section shuffle · Option shuffle · No answer key after submit</div>
        </div>

        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"6px"}}>Full Name *</label>
          <input style={inp(errors.name)} placeholder="Enter your full name" value={student.name} onChange={e=>{setStudent(s=>({...s,name:e.target.value}));setErrors(er=>({...er,name:""}));}}/>
          {errors.name && <div style={{fontSize:"12px",color:T.red,marginTop:"4px"}}>⚠ {errors.name}</div>}
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"6px"}}>College / Institute *</label>
          <input style={inp(errors.college)} placeholder="Enter your college name" value={student.college} onChange={e=>{setStudent(s=>({...s,college:e.target.value}));setErrors(er=>({...er,college:""}));}}/>
          {errors.college && <div style={{fontSize:"12px",color:T.red,marginTop:"4px"}}>⚠ {errors.college}</div>}
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"8px"}}>Course *</label>
          <div style={{display:"flex",gap:"8px"}}>
            {COURSES.map(c=>(
              <button key={c} onClick={()=>{setStudent(s=>({...s,course:c,year:""}));setErrors(er=>({...er,course:"",year:""}));}}
                style={{flex:1,padding:"11px 10px",borderRadius:"9px",border:`1.5px solid ${student.course===c?T.accent:T.border2}`,background:student.course===c?T.accentL:T.bg,color:student.course===c?T.accent:T.sub,fontFamily:bodyFont,fontSize:"13px",fontWeight:student.course===c?"700":"400",cursor:"pointer",textAlign:"center"}}>
                {student.course===c?"✓ ":""}{c}
              </button>
            ))}
          </div>
          {errors.course && <div style={{fontSize:"12px",color:T.red,marginTop:"4px"}}>⚠ {errors.course}</div>}
        </div>
        <div style={{marginBottom:"28px"}}>
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"8px"}}>Year of Study * {!student.course && <span style={{color:T.muted,fontWeight:"400"}}>(select course first)</span>}</label>
          {student.course ? (
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {COURSE_YEARS[student.course].map(y=>(
                <button key={y} onClick={()=>{setStudent(s=>({...s,year:y}));setErrors(er=>({...er,year:""}));}}
                  style={{padding:"11px 18px",borderRadius:"9px",border:`1.5px solid ${student.year===y?T.accent:T.border2}`,background:student.year===y?T.accentL:T.bg,color:student.year===y?T.accent:T.sub,fontFamily:bodyFont,fontSize:"14px",fontWeight:student.year===y?"700":"400",cursor:"pointer"}}>
                  {student.year===y?"✓ ":""}{y}
                </button>
              ))}
            </div>
          ) : (
            <div style={{padding:"12px 16px",borderRadius:"9px",border:`1.5px solid ${T.border}`,background:T.bg,color:T.muted,fontSize:"14px"}}>— Select a course above to see year options</div>
          )}
          {errors.year && <div style={{fontSize:"12px",color:T.red,marginTop:"6px"}}>⚠ {errors.year}</div>}
        </div>
        <button style={{width:"100%",background:T.accent,color:"#fff",border:"none",padding:"14px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"16px",fontWeight:"700",cursor:"pointer"}} onClick={startTest}>
          Start Aptitude Series 1 →
        </button>
        <div style={{fontSize:"12px",color:T.muted,textAlign:"center",marginTop:"8px"}}>Single attempt · Retake disabled after submit</div>
      </div>
    </div>
  );

  if (phase === "result") return (
    <>
      {showCard && <ReportCard student={student} attemptId={attemptId} answers={answers} shuffled={shuffled} onClose={()=>setShowCard(false)}/>}
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
        <div style={{...card,maxWidth:"740px"}}>
          <div style={{textAlign:"center",marginBottom:"24px"}}>
            <div style={{fontSize:"10px",color:T.accent,letterSpacing:"2px",fontWeight:"700",marginBottom:"6px"}}>THE ENTANGLE · ELITE 100 CLUB</div>
            <div style={{fontSize:"14px",color:T.sub,marginBottom:"2px"}}><strong style={{color:T.text}}>{student.name}</strong> · {student.college}</div>
            <div style={{fontSize:"12px",color:T.muted,marginBottom:"8px"}}>{student.course} · {student.year}</div>
            <div style={{fontSize:"11px",fontFamily:monoFont,color:T.muted,marginBottom:"10px"}}>Attempt ID: {attemptId}</div>
            <h2 style={{fontSize:"22px",fontWeight:"800",color:gc,margin:"0 0 8px"}}>{rmk}</h2>
            <div style={{fontSize:"54px",fontWeight:"900",lineHeight:1,color:T.text,letterSpacing:"-2px"}}>{score}<span style={{fontSize:"22px",color:T.muted,fontWeight:"400"}}>/90</span></div>
            <div style={{color:T.sub,fontSize:"14px",marginTop:"6px"}}>Percentage: {tp}%</div>
            <div style={{display:"inline-block",background:gc+"18",border:`1.5px solid ${gc}44`,borderRadius:"8px",padding:"4px 20px",marginTop:"10px",fontSize:"22px",fontWeight:"900",color:gc}}>Grade: {grade}</div>
            <div style={{height:"6px",background:T.border,borderRadius:"99px",margin:"16px 0 0",overflow:"hidden"}}><div style={{height:"100%",width:`${tp}%`,background:`linear-gradient(90deg,${gc},${T.accent})`,borderRadius:"99px"}}/></div>
          </div>

          <div style={{fontSize:"12px",color:T.sub,fontWeight:"700",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px"}}>Topic-wise Score</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"20px"}}>
            {SECS.map(sec=>{
              const ql = shuffled.filter(q=>q.cat===sec.key);
              const c = ql.filter(q=>answers[shuffled.indexOf(q)]===q.ans).length;
              const t = ql.length;
              const p = t ? Math.round(c/t*100) : 0;
              return (
                <div key={sec.key} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"12px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px"}}>
                    <span style={{fontSize:"14px"}}>{sec.emoji}</span>
                    <span style={{fontSize:"12px",fontWeight:"700",color:sec.color}}>{sec.label}</span>
                  </div>
                  <div style={{fontSize:"22px",fontWeight:"800",color:T.text}}>{c}<span style={{color:T.muted,fontSize:"12px"}}>/{t}</span></div>
                  <div style={{height:"3px",background:T.border2,borderRadius:"99px",marginTop:"8px",overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,background:sec.color,borderRadius:"99px"}}/></div>
                  <div style={{fontSize:"11px",color:T.muted,marginTop:"4px"}}>{p}%</div>
                </div>
              );
            })}
          </div>

          <div style={{background:"#f8fafc",border:`1px solid ${T.border}`,borderRadius:"10px",padding:"14px 16px",marginBottom:"20px",fontSize:"13px",color:T.sub,lineHeight:1.6}}>
            Answer key is not shown for this assessment. Use your topic-wise scores to identify weak areas and practice further.
          </div>

          <button onClick={()=>setShowCard(true)} style={{width:"100%",background:T.accent,color:"#fff",border:"none",padding:"13px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"15px",fontWeight:"700",cursor:"pointer",marginBottom:"10px"}}>
            📄 Download Report Card
          </button>
          <button disabled style={{width:"100%",background:T.border,color:T.muted,border:"none",padding:"13px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"14px",fontWeight:"600",cursor:"not-allowed"}}>
            ↺ Retake Disabled
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
      {showMap && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>setShowMap(false)}>
          <div style={{background:T.card,borderRadius:"14px",padding:"24px",maxWidth:"560px",width:"100%",maxHeight:"80vh",overflowY:"auto",boxShadow:T.shadow2}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
              <span style={{fontWeight:"700",fontSize:"15px",color:T.text}}>🗺 Question Map</span>
              <button style={{background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:"18px"}} onClick={()=>setShowMap(false)}>✕</button>
            </div>
            {SECS.map(sec=>{
              const si2 = shuffled.findIndex(q=>q.cat===sec.key);
              return (
                <div key={sec.key} style={{marginBottom:"16px"}}>
                  <div style={{fontSize:"12px",fontWeight:"700",color:sec.color,marginBottom:"8px"}}>{sec.emoji} {sec.label}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                    {Array.from({length:sec.count},(_,j)=>{
                      const idx = si2 + j;
                      const done = answers[idx] !== undefined;
                      const isCurr = idx === current;
                      return (
                        <button key={idx} onClick={()=>jumpTo(idx)} style={{width:"34px",height:"34px",borderRadius:"7px",border:`1.5px solid ${isCurr?sec.color:done?sec.color+"88":T.border2}`,background:isCurr?sec.color:done?sec.color+"15":T.bg,color:isCurr?"#fff":done?sec.color:T.muted,fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:bodyFont}}>
                          {idx+1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{...card,opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(6px)",transition:"all 0.15s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
          <div>
            <div style={{fontSize:"11px",fontWeight:"700",color:T.accent,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"2px"}}>Aptitude Series 1</div>
            <div style={{fontSize:"13px",color:T.muted}}>{student.name} · Q <strong style={{color:T.text}}>{current+1}</strong> of {tqs}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <button onClick={()=>setShowMap(true)} style={{background:T.bg,border:`1px solid ${T.border2}`,color:T.sub,padding:"7px 12px",borderRadius:"8px",fontFamily:bodyFont,fontSize:"13px",cursor:"pointer",fontWeight:"600"}}>🗺 Map</button>
            <div style={{fontSize:"22px",fontWeight:"800",letterSpacing:"2px",color:timeLeft<300?T.red:timeLeft<900?T.yellow:T.text,fontFamily:monoFont}}>{fmt(timeLeft)}</div>
          </div>
        </div>

        <div style={{marginBottom:"8px"}}>
          <div style={{height:"6px",background:T.border,borderRadius:"99px",overflow:"hidden"}}><div style={{height:"100%",width:`${((current+1)/tqs)*100}%`,background:T.accent,borderRadius:"99px",transition:"width 0.3s ease"}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"5px"}}>
            <span style={{fontSize:"11px",color:T.muted}}>{si?.emoji} {si?.label} · Q{current-ss+1}/{si?.count}</span>
            <span style={{fontSize:"11px",color:T.muted}}>{answered} answered · {tqs-answered} left</span>
          </div>
        </div>

        <div style={{height:"1px",background:T.border,margin:"16px 0 20px"}}/>

        <div style={{marginBottom:"24px"}}>
          <div style={{fontSize:"13px",fontWeight:"600",color:T.muted,marginBottom:"10px"}}>Question {current+1}</div>
          <p style={{fontSize:"17px",lineHeight:"1.75",color:T.text,fontFamily:bodyFont,margin:0,fontWeight:"500",whiteSpace:"pre-line"}}>{q.q}</p>
        </div>

        <div style={{marginBottom:"20px"}}>
          {q.opts.map((opt,i)=>{
            const isSel = selected === i;
            return (
              <button key={i} onClick={()=>setSelected(i)}
                style={{display:"block",width:"100%",textAlign:"left",padding:"15px 20px",marginBottom:"10px",borderRadius:"10px",
                  border:`1.5px solid ${isSel?T.accent:T.border2}`,
                  background:isSel?T.accentL:T.bg,
                  color:isSel?T.accent:T.text,
                  cursor:"pointer",fontSize:"16px",fontFamily:bodyFont,
                  fontWeight:isSel?"600":"400",transition:"all 0.15s",lineHeight:"1.5"}}>
                <span style={{fontWeight:"700",marginRight:"12px",color:isSel?T.accent:T.muted,fontSize:"14px"}}>{String.fromCharCode(65+i)}.</span>
                {opt}
              </button>
            );
          })}
        </div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"4px"}}>
          <button onClick={skip} style={{background:T.bg,color:T.sub,border:`1.5px solid ${T.border2}`,padding:"12px 20px",borderRadius:"9px",fontFamily:bodyFont,fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>Skip →</button>
          <button onClick={next} disabled={selected===null}
            style={{background:selected===null?T.border:T.accent,color:selected===null?T.muted:"#fff",border:"none",padding:"12px 28px",borderRadius:"9px",fontFamily:bodyFont,fontSize:"15px",fontWeight:"700",cursor:selected===null?"not-allowed":"pointer",transition:"all 0.15s"}}>
            {current+1===tqs?"Submit Test →":"Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
