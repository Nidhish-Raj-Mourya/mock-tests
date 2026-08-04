import { useState, useEffect, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// GUARANTEED BALANCED SHUFFLE ENGINE — Aptitude Series 2
// 60 Q · A=15 B=15 C=15 D=15 · section-wise Q shuffle · option shuffle · run ≤ 2
// Seed = attemptId (unique per attempt)
// ═══════════════════════════════════════════════════════════════════════════════

const ANS_TEMPLATE = [0,2,1,3,0,2,1,3,2,0,3,1,0,2,3,1,0,2,1,3,0,2,1,3,2,0,3,1,0,2,3,1,0,2,1,3,0,2,1,3,2,0,3,1,0,2,3,1,0,2,1,3,0,2,1,3,2,0,3,1];
const TARGET_DIST = {0:15,1:15,2:15,3:15};

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
  return `AS2-${t}-${r}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION BANK — Mock Test Aptitude Series 2 (60 Q)
// Focus: Percentages · Profit & Loss · SI & CI | Medium → Medium-Hard
// Distinct from Series 1
// ═══════════════════════════════════════════════════════════════════════════════

const TOTAL = 60;
const DURATION_SEC = 90 * 60;

const questions = [
  // ══ 1. PERCENTAGES (22) ════════════════════════════════════════════════════
  {id:1,  cat:"Pct", q:"A number is first increased by 30% and then decreased by 30%. What is the net change?",
   opts:["No change","9% decrease","9% increase","3% decrease"], ans:1},
  {id:2,  cat:"Pct", q:"If A's salary is 25% more than B's salary, then B's salary is what percent less than A's?",
   opts:["20%","25%","30%","16.67%"], ans:0},
  {id:3,  cat:"Pct", q:"The population of a town is 8000. It increases by 5% in one year and decreases by 5% in the next. Find the population after 2 years.",
   opts:["8000","7980","8020","7920"], ans:1},
  {id:4,  cat:"Pct", q:"If the price of sugar rises by 25%, by what percent must a household reduce consumption so that expenditure remains the same?",
   opts:["20%","25%","30%","16.67%"], ans:0},
  {id:5,  cat:"Pct", q:"x is 40% of y, and y is 60% of z. What percent of z is x?",
   opts:["20%","24%","30%","36%"], ans:1},
  {id:6,  cat:"Pct", q:"A student scores 150 marks and fails by 30 marks. If the passing percentage is 40%, find the maximum marks.",
   opts:["400","450","500","480"], ans:1},
  {id:7,  cat:"Pct", q:"A mixture contains 40% water. If 20 litres of water is added, water becomes 50% of the mixture. Find the original quantity of the mixture.",
   opts:["80 litres","100 litres","120 litres","90 litres"], ans:1},
  {id:8,  cat:"Pct", q:"The incomes of A and B are in the ratio 5:4 and their expenditures are in the ratio 4:3. If each saves ₹1000, find A's income.",
   opts:["₹4000","₹5000","₹6000","₹4500"], ans:1},
  {id:9,  cat:"Pct", q:"A value is successively changed by +10%, +20% and −10%. Find the net percentage change.",
   opts:["18.8% increase","20% increase","18% increase","21% increase"], ans:0},
  {id:10, cat:"Pct", q:"Due to a 20% increase in the price of a commodity, consumption falls by 20%. What is the net effect on expenditure?",
   opts:["No change","4% decrease","4% increase","8% decrease"], ans:1},
  {id:11, cat:"Pct", q:"If 60% of (A − B) = 40% of (A + B), find the ratio A:B.",
   opts:["3:2","4:1","5:1","2:1"], ans:2},
  {id:12, cat:"Pct", q:"A person gets 10% of salary as DA. Then gets 20% of (salary + DA) as HRA. If DA is ₹1500, find HRA.",
   opts:["₹3000","₹3300","₹3600","₹3200"], ans:1},
  {id:13, cat:"Pct", q:"In a class, 60% are boys and 40% are girls. 20% of boys and 30% of girls fail. What percent of the class passes?",
   opts:["74%","76%","78%","80%"], ans:1},
  {id:14, cat:"Pct", q:"When the first number is increased by 20%, it becomes equal to the second number decreased by 20%. If their sum is 500, find the larger number.",
   opts:["250","280","300","320"], ans:2},
  {id:15, cat:"Pct", q:"A machine worth ₹62,500 depreciates at 20% per annum. What is its value after 2 years?",
   opts:["₹40,000","₹42,000","₹45,000","₹38,000"], ans:0},
  {id:16, cat:"Pct", q:"A man spends 30% of income on rent and 20% of the remaining on food. If he still has ₹2800, find his income.",
   opts:["₹4500","₹5000","₹5500","₹6000"], ans:1},
  {id:17, cat:"Pct", q:"If the numerator of a fraction is increased by 20% and the denominator is decreased by 20%, the fraction becomes 9/16. Find the original fraction.",
   opts:["3/8","2/5","3/5","5/8"], ans:0},
  {id:18, cat:"Pct", q:"The average weight of boys in a class is 60 kg and of girls is 50 kg. If the class average is 54 kg, what percent of students are boys?",
   opts:["30%","40%","50%","60%"], ans:1},
  {id:19, cat:"Pct", q:"Income up to ₹2,50,000 is tax-free and above that tax is 20%. If tax paid is ₹15,000, find the gross income.",
   opts:["₹3,00,000","₹3,25,000","₹3,50,000","₹2,75,000"], ans:1},
  {id:20, cat:"Pct", q:"Three successive discounts of 10%, 20% and 25% are equivalent to a single discount of:",
   opts:["45%","46%","48%","50%"], ans:1},
  {id:21, cat:"Pct", q:"In an election, 40% of voters voted. The winner got 60% of the votes cast. If there were 15,000 voters on the list, how many votes did the winner get?",
   opts:["3000","3600","4000","4500"], ans:1},
  {id:22, cat:"Pct", q:"A's salary is increased by 20% and then decreased by 20%. B's salary is first decreased by 20% and then increased by 20%. Whose salary is higher finally, if both started equal?",
   opts:["A's","B's","Both equal","Cannot say"], ans:2},

  // ══ 2. PROFIT & LOSS (20) ══════════════════════════════════════════════════
  {id:23, cat:"PnL", q:"An article is marked 50% above cost price and sold at a 20% discount. Find the profit percentage.",
   opts:["20%","25%","30%","15%"], ans:0},
  {id:24, cat:"PnL", q:"A man sells two articles at ₹990 each — one at 10% profit and the other at 10% loss. Find the overall result.",
   opts:["No profit no loss","1% loss","1% profit","2% loss"], ans:1},
  {id:25, cat:"PnL", q:"A shopkeeper sells 20 items at the cost price of 16 items. Find his profit percentage.",
   opts:["20%","25%","30%","16.67%"], ans:1},
  {id:26, cat:"PnL", q:"A dishonest dealer sells goods at 10% above cost price and uses a weight of 800 g instead of 1 kg. Find his overall profit percentage.",
   opts:["30%","35%","37.5%","40%"], ans:2},
  {id:27, cat:"PnL", q:"After allowing a discount of 15%, a shopkeeper still makes a profit of 10%. If no discount is given, what is his profit percentage?",
   opts:["25%","29.41%","30%","32.5%"], ans:1},
  {id:28, cat:"PnL", q:"A sells an article to B at 20% profit. B sells it to C at 25% loss. If C paid ₹900, find A's cost price.",
   opts:["₹900","₹1000","₹1100","₹1200"], ans:1},
  {id:29, cat:"PnL", q:"By selling an article for ₹440, a person loses 12%. At what selling price should he sell to gain 12%?",
   opts:["₹540","₹560","₹580","₹500"], ans:1},
  {id:30, cat:"PnL", q:"A fruit seller buys oranges at 3 for ₹2 and sells them at 2 for ₹3. Find his profit percentage.",
   opts:["100%","125%","150%","75%"], ans:1},
  {id:31, cat:"PnL", q:"An article is sold after two successive discounts of 20% and 10% for ₹720. Find its marked price.",
   opts:["₹900","₹1000","₹1100","₹800"], ans:1},
  {id:32, cat:"PnL", q:"The profit earned by selling an article at 25% profit is ₹150 less than the profit earned by selling it at 40% profit. Find the cost price.",
   opts:["₹800","₹1000","₹1200","₹900"], ans:1},
  {id:33, cat:"PnL", q:"A milkman mixes 20% water (free) in milk and sells the mixture at cost price. Find his profit percentage.",
   opts:["20%","25%","30%","16.67%"], ans:1},
  {id:34, cat:"PnL", q:"A trader buys rice at ₹40/kg. He sells 1/3 of it at 20% loss and the remaining at 40% profit. Find his overall profit percentage.",
   opts:["10%","15%","20%","25%"], ans:2},
  {id:35, cat:"PnL", q:"By selling 33 metres of cloth, a merchant gains an amount equal to the selling price of 11 metres. Find his profit percentage.",
   opts:["33.33%","50%","25%","40%"], ans:1},
  {id:36, cat:"PnL", q:"A shopkeeper marks goods 25% above cost price and allows successive discounts of 10% and 5% on the marked price. Find his net profit percentage.",
   opts:["6.875%","7.5%","8%","5%"], ans:0},
  {id:37, cat:"PnL", q:"If the selling price of 12 articles is equal to the cost price of 15 articles, find the profit percentage.",
   opts:["20%","25%","30%","15%"], ans:1},
  {id:38, cat:"PnL", q:"A trader allows a discount of ₹20 on a marked price of ₹500 and still gains 20%. Find the cost price.",
   opts:["₹380","₹400","₹420","₹450"], ans:1},
  {id:39, cat:"PnL", q:"An article sold for ₹960 gives 20% profit. If it is sold for ₹720, what is the loss percentage?",
   opts:["8%","10%","12%","15%"], ans:1},
  {id:40, cat:"PnL", q:"The marked price of a watch is ₹1200. After two successive equal discounts, it is sold for ₹768. Find each discount percentage.",
   opts:["15%","20%","25%","18%"], ans:1},
  {id:41, cat:"PnL", q:"A man sells a horse at 10% loss. Had he sold it for ₹90 more, he would have gained 8%. Find the cost price of the horse.",
   opts:["₹450","₹500","₹550","₹600"], ans:1},
  {id:42, cat:"PnL", q:"A dealer buys 1000 kg of wheat. He sells 20% of it at 10% profit and the remaining at 20% profit. Find his overall profit percentage.",
   opts:["16%","18%","20%","15%"], ans:1},

  // ══ 3. SI & CI (18) ════════════════════════════════════════════════════════
  {id:43, cat:"SICI", q:"Find the simple interest on ₹7500 at 8% per annum for 3 years.",
   opts:["₹1600","₹1800","₹2000","₹1500"], ans:1},
  {id:44, cat:"SICI", q:"The difference between CI and SI on a sum for 2 years at 10% per annum is ₹40. Find the principal.",
   opts:["₹3000","₹4000","₹5000","₹6000"], ans:1},
  {id:45, cat:"SICI", q:"A sum doubles itself in 5 years at simple interest. Find the rate of interest per annum.",
   opts:["15%","20%","25%","10%"], ans:1},
  {id:46, cat:"SICI", q:"Find the compound interest on ₹8000 for 2 years at 5% per annum (compounded annually).",
   opts:["₹800","₹820","₹840","₹850"], ans:1},
  {id:47, cat:"SICI", q:"A sum becomes ₹13,310 in 3 years at 10% compound interest per annum. Find the principal.",
   opts:["₹9,000","₹10,000","₹11,000","₹12,000"], ans:1},
  {id:48, cat:"SICI", q:"In what time will ₹8000 amount to ₹9261 at 5% per annum compound interest?",
   opts:["2 years","3 years","4 years","5 years"], ans:1},
  {id:49, cat:"SICI", q:"At what rate of simple interest will the interest on a sum for 4 years be equal to 2/5 of the principal?",
   opts:["8%","10%","12%","15%"], ans:1},
  {id:50, cat:"SICI", q:"A invests ₹5000 at 10% CI and B invests ₹5000 at 10% SI, both for 2 years. Find the difference in their interests.",
   opts:["₹40","₹50","₹60","₹100"], ans:1},
  {id:51, cat:"SICI", q:"Find the compound interest on ₹8000 for 1 year at 10% per annum compounded half-yearly.",
   opts:["₹800","₹820","₹840","₹850"], ans:1},
  {id:52, cat:"SICI", q:"In how many years will ₹1200 become ₹1800 at 10% per annum simple interest?",
   opts:["4 years","5 years","6 years","8 years"], ans:1},
  {id:53, cat:"SICI", q:"A sum at compound interest becomes 4 times in 4 years. In how many years will it become 16 times at the same rate?",
   opts:["6 years","8 years","12 years","16 years"], ans:1},
  {id:54, cat:"SICI", q:"What is the effective rate of interest for 2 years at 10% per annum compound interest?",
   opts:["20%","21%","22%","19%"], ans:1},
  {id:55, cat:"SICI", q:"The simple interest on a sum for 3 years is ₹240 more than the interest for 2 years at 8% per annum. Find the principal.",
   opts:["₹2500","₹3000","₹3500","₹4000"], ans:1},
  {id:56, cat:"SICI", q:"The difference between CI and SI on a certain sum for 3 years at 10% per annum is ₹310. Find the principal.",
   opts:["₹8,000","₹10,000","₹12,000","₹15,000"], ans:1},
  {id:57, cat:"SICI", q:"The CI on a certain sum for 2 years is ₹410 and the SI on the same sum for the same period is ₹400. Find the rate of interest.",
   opts:["4%","5%","6%","8%"], ans:1},
  {id:58, cat:"SICI", q:"A sum invested at compound interest amounts to ₹4840 in 2 years and ₹5324 in 3 years. Find the rate of interest.",
   opts:["8%","10%","12%","15%"], ans:1},
  {id:59, cat:"SICI", q:"Find the present worth of ₹9261 due in 3 years at 5% per annum compound interest.",
   opts:["₹7000","₹8000","₹8500","₹9000"], ans:1},
  {id:60, cat:"SICI", q:"A man borrows ₹2100 and agrees to pay it back in 2 equal annual instalments at 10% compound interest. Find each instalment.",
   opts:["₹1100","₹1210","₹1200","₹1155"], ans:1},
];

const SECS = [
  { key:"Pct",  label:"Percentages",                emoji:"📊", color:"#db2777", count:22 },
  { key:"PnL",  label:"Profit & Loss",              emoji:"💰", color:"#ea580c", count:20 },
  { key:"SICI", label:"Simple & Compound Interest", emoji:"📈", color:"#7c3aed", count:18 },
];

const COURSES = ["B.Tech / B.E.", "BCA", "MCA"];
const COURSE_YEARS = {
  "B.Tech / B.E.": ["1st Year","2nd Year","3rd Year","4th Year"],
  "BCA":           ["1st Year","2nd Year","3rd Year"],
  "MCA":           ["1st Year","2nd Year"],
};

const T = {
  bg:"#f1f5f9", card:"#ffffff", border:"#e2e8f0", border2:"#cbd5e1",
  accent:"#c2410c", accentL:"#fff7ed", text:"#0f172a", sub:"#475569", muted:"#94a3b8",
  green:"#059669", greenL:"#ecfdf5", red:"#dc2626", redL:"#fef2f2", yellow:"#d97706",
  shadow:"0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
  shadow2:"0 2px 8px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.08)",
};
const bodyFont = "'Segoe UI','Inter',system-ui,sans-serif";
const monoFont = "'Fira Code','Courier New',monospace";
const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

function ReportCard({ student, attemptId, answers, shuffled, onClose }) {
  const score = shuffled.reduce((s,q,i)=>s+(answers[i]===q.ans?1:0),0);
  const pct = Math.round(score/TOTAL*100);
  const grade = pct>=80?"A":pct>=65?"B":pct>=50?"C":pct>=35?"D":"F";
  const gColor = pct>=80?"#059669":pct>=65?"#c2410c":pct>=50?"#d97706":pct>=35?"#ea580c":"#dc2626";
  const remark = pct>=80?"Outstanding":pct>=65?"Good":pct>=50?"Average":pct>=35?"Below Average":"Needs Improvement";
  const date = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  const secScores = SECS.map(sec=>{
    const qs = shuffled.filter(q=>q.cat===sec.key);
    const c = qs.filter(q=>answers[shuffled.indexOf(q)]===q.ans).length;
    return {...sec,c,t:qs.length,pct:qs.length?Math.round(c/qs.length*100):0};
  });
  const dl = ()=>{
    const h = `<!DOCTYPE html><html><head><title>Report Card – ${student.name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#fff;color:#0f172a;padding:36px;font-size:14px}.hdr{text-align:center;padding-bottom:20px;margin-bottom:24px;border-bottom:2px solid #c2410c}.org{font-size:11px;font-weight:700;color:#c2410c;letter-spacing:3px;margin-bottom:8px}h1{font-size:24px;font-weight:800;margin-bottom:4px}.dt{font-size:12px;color:#64748b}.ir{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:24px}.ib{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px}.il{font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}.iv{font-size:14px;font-weight:700}.sr{display:flex;justify-content:center;gap:48px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px}.sb{text-align:center}.big{font-size:52px;font-weight:900;line-height:1}.sm{font-size:13px;color:#64748b;margin-top:4px}table{width:100%;border-collapse:collapse;margin-bottom:24px}th{background:#0f172a;color:#fff;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px}td{padding:9px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}tr:nth-child(even) td{background:#f8fafc}.bar{background:#e2e8f0;border-radius:4px;height:5px;width:80px;display:inline-block;vertical-align:middle;margin-left:8px}.bi{height:100%;border-radius:4px}.ftr{text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}.st{display:inline-block;border:2px solid #c2410c;color:#c2410c;border-radius:6px;padding:4px 14px;font-size:11px;font-weight:700;letter-spacing:2px;margin-top:8px}.aid{font-size:11px;color:#64748b;margin-top:6px;font-family:monospace}</style></head><body>
    <div class="hdr"><div class="org">The Entangle · Elite 100 Club</div><h1>Mock Test — Aptitude Series 2</h1><div class="dt">Percentages · Profit & Loss · SI-CI · ${date}</div><div class="aid">Attempt ID: ${attemptId}</div></div>
    <div class="ir"><div class="ib"><div class="il">Student</div><div class="iv">${student.name}</div></div><div class="ib"><div class="il">College</div><div class="iv">${student.college}</div></div><div class="ib"><div class="il">Course</div><div class="iv">${student.course}</div></div><div class="ib"><div class="il">Year</div><div class="iv">${student.year}</div></div></div>
    <div class="sr"><div class="sb"><div class="big">${score}<span style="font-size:22px;color:#64748b">/${TOTAL}</span></div><div class="sm">Total Score</div></div><div class="sb"><div class="big" style="color:${gColor}">${grade}</div><div class="sm">Grade</div></div><div class="sb"><div class="big" style="color:${gColor}">${pct}%</div><div class="sm" style="color:${gColor};font-weight:700">${remark}</div></div></div>
    <table><tr><th>Section</th><th>Score</th><th>Total</th><th>%</th><th>Performance</th></tr>${secScores.map(s=>`<tr><td><strong>${s.emoji} ${s.label}</strong></td><td><strong>${s.c}</strong></td><td>${s.t}</td><td style="font-weight:700;color:${s.pct>=60?"#059669":s.pct>=40?"#d97706":"#dc2626"}">${s.pct}%</td><td><div class="bar"><div class="bi" style="width:${s.pct}%;background:${s.pct>=60?"#059669":s.pct>=40?"#d97706":"#dc2626"}"></div></div></td></tr>`).join("")}<tr style="background:#fff7ed"><td><strong>TOTAL</strong></td><td><strong>${score}</strong></td><td><strong>${TOTAL}</strong></td><td style="font-weight:800;color:${gColor}">${pct}%</td><td><div class="bar"><div class="bi" style="width:${pct}%;background:${gColor}"></div></div></td></tr></table>
    <div class="ftr"><p>Score & topic-wise breakdown only · Answer key not disclosed</p><p>Auto-generated by The Entangle · Elite 100 Club · Indore</p><div class="st">ELITE 100 CLUB</div></div></body></html>`;
    const blob = new Blob([h],{type:"text/html"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ReportCard_AptitudeSeries2_${student.name.replace(/\s+/g,"_")}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",overflowY:"auto"}}>
      <div style={{background:T.card,borderRadius:"16px",padding:"28px 32px",maxWidth:"580px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:T.shadow2}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px"}}>
          <div>
            <div style={{fontSize:"10px",color:T.accent,fontWeight:"700",letterSpacing:"2px",marginBottom:"3px"}}>THE ENTANGLE · ELITE 100 CLUB</div>
            <div style={{fontSize:"18px",fontWeight:"800",color:T.text}}>Aptitude Series 2 — Report Card</div>
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
        <div style={{background:T.accentL,border:"1px solid #fed7aa",borderRadius:"12px",padding:"18px",marginBottom:"18px",display:"flex",justifyContent:"space-around",textAlign:"center"}}>
          <div><div style={{fontSize:"42px",fontWeight:"900",color:T.text,lineHeight:1}}>{score}<span style={{fontSize:"17px",color:T.muted}}>/{TOTAL}</span></div><div style={{fontSize:"11px",color:T.sub,marginTop:"3px"}}>Total Score</div></div>
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
  const [timeLeft,setTimeLeft] = useState(DURATION_SEC);
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
    setTimeLeft(DURATION_SEC);
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
  const tp = Math.round(score/TOTAL*100);
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
          <h1 style={{fontSize:"26px",fontWeight:"800",color:T.text,margin:"0 0 8px"}}>Mock Test — Aptitude Series 2</h1>
          <p style={{color:T.sub,fontSize:"15px",margin:0}}>Commercial Maths Deep Dive · 60 Questions · 90 Minutes</p>
        </div>

        <div style={{background:T.accentL,border:"1px solid #fed7aa",borderRadius:"12px",padding:"16px 18px",marginBottom:"12px"}}>
          <div style={{fontSize:"12px",fontWeight:"700",color:T.accent,marginBottom:"8px"}}>PART 2 · MEDIUM → MEDIUM-HARD</div>
          <div style={{fontSize:"13px",color:T.text,lineHeight:1.7}}>
            Percentages (22) · Profit & Loss (20) · Simple & Compound Interest (18)
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}}>
          {[["⏱","90 Minutes"],["📋","60 Questions"],["🎯","Medium → Hard"]].map(([icon,label])=>(
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
          Start Aptitude Series 2 →
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
            <div style={{fontSize:"54px",fontWeight:"900",lineHeight:1,color:T.text,letterSpacing:"-2px"}}>{score}<span style={{fontSize:"22px",color:T.muted,fontWeight:"400"}}>/{TOTAL}</span></div>
            <div style={{color:T.sub,fontSize:"14px",marginTop:"6px"}}>Percentage: {tp}%</div>
            <div style={{display:"inline-block",background:gc+"18",border:`1.5px solid ${gc}44`,borderRadius:"8px",padding:"4px 20px",marginTop:"10px",fontSize:"22px",fontWeight:"900",color:gc}}>Grade: {grade}</div>
            <div style={{height:"6px",background:T.border,borderRadius:"99px",margin:"16px 0 0",overflow:"hidden"}}><div style={{height:"100%",width:`${tp}%`,background:`linear-gradient(90deg,${gc},${T.accent})`,borderRadius:"99px"}}/></div>
          </div>

          <div style={{fontSize:"12px",color:T.sub,fontWeight:"700",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px"}}>Topic-wise Score</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr",gap:"8px",marginBottom:"20px"}}>
            {SECS.map(sec=>{
              const ql = shuffled.filter(q=>q.cat===sec.key);
              const c = ql.filter(q=>answers[shuffled.indexOf(q)]===q.ans).length;
              const t = ql.length;
              const p = t ? Math.round(c/t*100) : 0;
              return (
                <div key={sec.key} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"14px 16px",display:"flex",alignItems:"center",gap:"14px"}}>
                  <span style={{fontSize:"22px"}}>{sec.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:"13px",fontWeight:"700",color:sec.color,marginBottom:"4px"}}>{sec.label}</div>
                    <div style={{height:"4px",background:T.border2,borderRadius:"99px",overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,background:sec.color,borderRadius:"99px"}}/></div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:"22px",fontWeight:"800",color:T.text}}>{c}<span style={{color:T.muted,fontSize:"12px"}}>/{t}</span></div>
                    <div style={{fontSize:"11px",color:T.muted}}>{p}%</div>
                  </div>
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
            <div style={{fontSize:"11px",fontWeight:"700",color:T.accent,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"2px"}}>Aptitude Series 2</div>
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
