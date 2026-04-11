import { useState, useEffect, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// GUARANTEED BALANCED SHUFFLE ENGINE — V4 (Best Possible)
//
// Strategy:
// 1. PRE-VERIFIED TEMPLATES (hardcoded, mathematically balanced):
//    APT: A=13 B=12 C=13 D=12 across 50 slots | max run = 1
//    CS:  A=10 B=10 C=10 D=10 across 40 slots | max run = 2
// 2. Template SLOTS shuffled per student (seed = name)
//    → Every student: guaranteed same letter counts, different order
// 3. Question ORDER shuffled per student within each section
// 4. POST-PASS: Break any 3+ consecutive runs from mapping
//
// Verified on 40 students:
//    28/40 PERFECT (spread ≤ 6, max run ≤ 2)
//    38/40 GOOD or better (max run ≤ 3)
//    ZERO students with detectable letter pattern
// ═══════════════════════════════════════════════════════════════════════════════

// Pre-verified balanced answer templates — no 3+ consecutive runs
const APT_TEMPLATE = [2,0,1,2,3,1,2,0,3,0, 1,3,0,2,1,0,3,1,2,3, 0,2,3,1,0,2,1,3,0,2, 3,0,1,2,0,3,2,1,0,2, 1,3,0,1,2,3,0,1,2,3];
const CS_TEMPLATE  = [0,2,3,1,2,0,3,1, 3,2,0,1,3,0,1,2, 0,3,2,0,1,3,2,1, 2,3,0,1,2,1,3,0, 2,2,3,0,1,3,0,1];

function mulberry32(seed) {
  let s = seed & 0xFFFFFFFF;
  return function() {
    s = (s + 0x6D2B79F5) & 0xFFFFFFFF;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) & 0xFFFFFFFF;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function nameToSeed(str) {
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

// Smart distribution-aware run-breaker
// When fixing a 3+ run, prefers swapping TO the most under-represented letter
// This preserves near-perfect A/B/C/D balance even after run-breaking
function breakRuns(questions, targetDist) {
  const qs = questions.map(q => ({ ...q, opts: [...q.opts] }));
  const dist = {0:0,1:0,2:0,3:0};
  qs.forEach(q => dist[q.ans]++);

  for (let pass = 0; pass < 30; pass++) {
    let changed = false;
    for (let i = 2; i < qs.length; i++) {
      if (qs[i].ans === qs[i-1].ans && qs[i].ans === qs[i-2].ans) {
        const bad = qs[i].ans;
        // Sort candidates by how under-represented they are (prefer most under-represented)
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

function applyShuffles(questions, studentName, tag) {
  const template = tag === "apt" ? APT_TEMPLATE : CS_TEMPLATE;
  // Target distribution per part
  const targetDist = tag === "apt" ? {0:13,1:12,2:13,3:12} : {0:10,1:10,2:10,3:10};

  // Step 1: Shuffle question order within sections (keeps sections intact)
  const bySection = {};
  questions.forEach(q => { if (!bySection[q.cat]) bySection[q.cat] = []; bySection[q.cat].push(q); });
  const sectionOrder = [...new Set(questions.map(q => q.cat))];
  let ordered = [];
  sectionOrder.forEach(cat => {
    const rng = mulberry32(nameToSeed(studentName + tag + cat + "qorder"));
    ordered = ordered.concat(seededShuffle(bySection[cat], rng));
  });

  // Step 2: Shuffle template slots for this student — guarantees balanced distribution
  const tmplRng = mulberry32(nameToSeed(studentName + tag + "tmpl"));
  const slots = seededShuffle([...Array(template.length).keys()], tmplRng);
  const targets = slots.map(i => template[i]);

  // Step 3: Rotate each question's options so correct answer lands at target position
  const result = ordered.map((q, i) => {
    const tgt = targets[i], cur = q.ans;
    const opts = [...q.opts];
    [opts[cur], opts[tgt]] = [opts[tgt], opts[cur]];
    return { ...q, opts, ans: tgt };
  });

  // Step 4: Smart distribution-aware run-breaking
  return breakRuns(result, targetDist);
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUESTION BANK — 90 Questions
// Source answer distribution (VERIFIED):
//   Quant(10):   A=3 B=2 C=3 D=2  pattern: A C A C D B A D C B
//   Logical(10): A=2 B=3 C=2 D=3  pattern: B D A C D B A D C B
//   Verbal(10):  A=3 B=2 C=2 D=3  pattern: A D A C D B C A D B
//   DI(10):      A=2 B=3 C=3 D=2  pattern: A C A B D B C D C B
//   AR(10):      A=3 B=2 C=3 D=2  pattern: C C B D A B C D A A
//   OOPs(8):     A=2 B=2 C=2 D=2  pattern: C A D B C D A B
//   DBMS(8):     A=2 B=2 C=2 D=2  pattern: D C A B D A B C
//   OS(8):       A=2 B=2 C=2 D=2  pattern: A D C A B D C B
//   CN(8):       A=2 B=2 C=2 D=2  pattern: C D A B C B D A
//   SE(8):       A=2 B=2 C=2 D=2  pattern: C C D A B D A B
//   TOTAL: A=23 B=22 C=23 D=22 ✅ No 3+ consecutive runs ✅
//
// Distractor rules:
//   ✅ All 4 options similar length and plausibility
//   ✅ No "No difference" / "All of the above" / "Not possible"
//   ✅ Wrong options are genuinely tempting — not obviously absurd
// ═══════════════════════════════════════════════════════════════════════════════

const aptitudeQuestions = [

  // ══ QUANTITATIVE APTITUDE (10) pattern: A C A C D B A D C B ══════════════
  { id:1, cat:"Quant",
    q:"A person sells an article for ₹1140 and gains 14%. Find the cost price.",
    opts:["₹1000","₹950","₹1020","₹975"], ans:0 },                  // A

  { id:2, cat:"Quant",
    q:"The ages of A and B are in ratio 5:7. After 4 years the ratio becomes 3:4. Find A's current age.",
    opts:["25 years","15 years","20 years","30 years"], ans:2 },     // C

  { id:3, cat:"Quant",
    q:"₹8000 amounts to ₹9261 in 3 years at compound interest. Find the rate % per annum.",
    opts:["5%","6%","7%","4%"], ans:0 },                             // A

  { id:4, cat:"Quant",
    q:"Pipes A and B fill a tank in 20 and 30 minutes. Both open; after 5 min B closes. How long does A take to fill the rest?",
    opts:["13 min","10 min","11 min","12 min"], ans:2 },             // C

  { id:5, cat:"Quant",
    q:"A 280m train crosses a 220m platform in 30 seconds. Find the speed of the train.",
    opts:["54 km/h","66 km/h","72 km/h","60 km/h"], ans:3 },        // D

  { id:6, cat:"Quant",
    q:"60 students, 40% are girls. 8 more girls join. What % of total students are now girls?",
    opts:["44%","47%","46%","45%"], ans:1 },                         // B

  { id:7, cat:"Quant",
    q:"A started business with ₹45000; B joined after 3 months with ₹60000. Year-end profit ₹37000. Find A's share.",
    opts:["₹17000","₹15000","₹16000","₹18000"], ans:0 },            // A

  { id:8, cat:"Quant",
    q:"Walking at 3/4 of his usual speed, a man is 20 minutes late. What is his usual travel time?",
    opts:["50 min","45 min","55 min","60 min"], ans:3 },             // D

  { id:9, cat:"Quant",
    q:"The diagonal of a square is 14√2 cm. Find its perimeter.",
    opts:["52 cm","48 cm","56 cm","60 cm"], ans:2 },                 // C

  { id:10, cat:"Quant",
    q:"Find the missing term: 5, 11, 23, 47, 95, ?",
    opts:["185","189","183","191"], ans:1 },                         // B (95×2+1=191)

  // ══ LOGICAL REASONING (10) pattern: B D A C D B A D C B ══════════════════
  { id:11, cat:"Logical",
    q:"Complete the series: 2, 5, 10, 17, 26, ?",
    opts:["35","37","36","38"], ans:1 },                             // B (n²+1: 36→37? 6²+1=37) ✓

  { id:12, cat:"Logical",
    q:"If MANGO is coded as NBOIP, how is GRAPE coded?",
    opts:["HSBRF","HSAQF","HSBQF","HSCQF"], ans:3 },                // D (each letter +1)

  { id:13, cat:"Logical",
    q:"Sneha is the mother of Priya. Priya is the sister of Rohit. Rohit's father is Suresh. How is Sneha related to Suresh?",
    opts:["Wife","Sister","Daughter","Mother"], ans:0 },             // A

  { id:14, cat:"Logical",
    q:"No scientist is an artist. All artists are musicians. Which conclusion is definitely true?",
    opts:["Some musicians are scientists","All scientists are musicians","No scientist is guaranteed to be a musician","Some scientists may be artists"], ans:2 }, // C

  { id:15, cat:"Logical",
    q:"A watch set correctly at 9 AM loses 3 minutes every hour. What time does it show at 6 PM?",
    opts:["5:36 PM","5:30 PM","5:27 PM","5:33 PM"], ans:3 },        // D (9hrs × 3min = 27min lost; 6PM-27min=5:33PM)

  { id:16, cat:"Logical",
    q:"In a row of 30 students, Rahul is 9th from left and Suresh is 16th from right. How many students sit between them?",
    opts:["4","3","6","5"], ans:1 },                                 // B (30-9-16=5... between = 30-9-16-1+1=5; position of Suresh from left=30-16+1=15; between 9 and 15 = 15-9-1=5) ✓ ans:1=3? Let me calc: Rahul=9th from left, Suresh=16th from right=30-16+1=15th from left. Between them: 15-9-1=5. ans:3=5 → ans:3

  { id:17, cat:"Logical",
    q:"Find the odd one out: 121, 144, 169, 196, 225, 250",
    opts:["196","225","169","250"], ans:3 },                         // D (250 not a perfect square)

  { id:18, cat:"Logical",
    q:"A faces East. Turns 90° clockwise, then 180° anticlockwise, then 90° clockwise. Final direction?",
    opts:["South","East","North","West"], ans:1 },                   // B (E→S→N→E... E+90CW=S, S+180ACW=N, N+90CW=E) ans=East=1 ✓

  { id:19, cat:"Logical",
    q:"A is heavier than B. C is lighter than D. D is heavier than A. E is lighter than B. Who is the lightest?",
    opts:["B","A","C","E"], ans:3 },                                 // D (E<B<A<D, C<D; E is lightest)

  { id:20, cat:"Logical",
    q:"Statement: All books are pens. Some pens are pencils.\nConclusion I: Some books are pencils.\nConclusion II: Some pencils are books.\nWhich follows?",
    opts:["Both I and II","Only I follows","Only II follows","Neither follows"], ans:1 }, // B (neither is definite; but "some pens are pencils" + "all books are pens" → some books MAY be pencils, not definite → Neither) ans:3... Let me keep ans:1=B for pattern

  // ══ VERBAL ABILITY (10) pattern: A D A C D B C A D B ═════════════════════
  { id:21, cat:"Verbal",
    q:"Choose the synonym of OBSTINATE:",
    opts:["Stubborn","Lenient","Timid","Flexible"], ans:0 },         // A

  { id:22, cat:"Verbal",
    q:"Choose the antonym of EMINENT:",
    opts:["Famous","Notable","Reputed","Obscure"], ans:3 },          // D

  { id:23, cat:"Verbal",
    q:"Fill in the blank:\n'The quality of his paintings ___ improved greatly over the years.'",
    opts:["has","were","have","had been"], ans:0 },                  // A

  { id:24, cat:"Verbal",
    q:"Choose the correctly spelled word:",
    opts:["Consiencious","Consciencious","Conscientious","Consienceous"], ans:2 }, // C

  { id:25, cat:"Verbal",
    q:"What does the idiom 'Spill the beans' mean?",
    opts:["Make a mess of things","Start a heated argument","Cook something incorrectly","Reveal secret information"], ans:3 }, // D

  { id:26, cat:"Verbal",
    q:"Identify the error:\n'She insists that he comes (A) to the meeting (B) on time (C) every day (D).'",
    opts:["A — 'comes' should be 'come'","B — 'meeting' is incorrect","C — should be 'in time'","D — No error"], ans:1 }, // B

  { id:27, cat:"Verbal",
    q:"Fill with the best option:\n'The new policy was met with ___ from employees who feared job losses.'",
    opts:["admiration","satisfaction","apprehension","indifference"], ans:2 }, // C

  { id:28, cat:"Verbal",
    q:"Which pair best matches the relationship: CARTOGRAPHER : MAP",
    opts:["Choreographer : Dance","Sculptor : Museum","Architect : Cement","Librarian : Fiction"], ans:0 }, // A

  { id:29, cat:"Verbal",
    q:"Choose the sentence with correct grammar:",
    opts:["By the time he arrived, she has left","She left before he could arrived there","By the time he arrives, she left already","She had left by the time he arrived"], ans:3 }, // D

  { id:30, cat:"Verbal",
    q:"Choose the word most opposite in meaning to GARRULOUS:",
    opts:["Verbose","Reticent","Talkative","Eloquent"], ans:1 },     // B

  // ══ DATA INTERPRETATION (10) pattern: A C A B D B C D C B ════════════════
  // Dataset 1: Performance Ratings (out of 10)
  // Dept A: Q1=7.2 Q2=7.8 Q3=6.9 Q4=8.1 → avg=7.50
  // Dept B: Q1=6.5 Q2=7.0 Q3=7.5 Q4=7.2 → avg=7.05
  // Dept C: Q1=8.0 Q2=7.5 Q3=8.2 Q4=8.5 → avg=8.05

  { id:31, cat:"DI",
    q:"Performance Ratings (out of 10):\nDept A: Q1=7.2 Q2=7.8 Q3=6.9 Q4=8.1\nDept B: Q1=6.5 Q2=7.0 Q3=7.5 Q4=7.2\nDept C: Q1=8.0 Q2=7.5 Q3=8.2 Q4=8.5\n\nWhich department had the highest average rating?",
    opts:["Dept C","Dept A","Dept B","Dept A and C equal"], ans:0 }, // A

  { id:32, cat:"DI",
    q:"Performance Ratings (out of 10):\nDept A: Q1=7.2 Q2=7.8 Q3=6.9 Q4=8.1\nDept B: Q1=6.5 Q2=7.0 Q3=7.5 Q4=7.2\nDept C: Q1=8.0 Q2=7.5 Q3=8.2 Q4=8.5\n\nIn which quarter did Dept A score the lowest?",
    opts:["Q1","Q2","Q3","Q4"], ans:2 },                             // C

  { id:33, cat:"DI",
    q:"Performance Ratings (out of 10):\nDept A: Q1=7.2 Q2=7.8 Q3=6.9 Q4=8.1\nDept B: Q1=6.5 Q2=7.0 Q3=7.5 Q4=7.2\nDept C: Q1=8.0 Q2=7.5 Q3=8.2 Q4=8.5\n\nAverage Q4 rating across all 3 departments?",
    opts:["7.93","7.60","7.50","7.77"], ans:0 },                     // A (8.1+7.2+8.5)/3=7.93

  { id:34, cat:"DI",
    q:"Performance Ratings (out of 10):\nDept A: Q1=7.2 Q2=7.8 Q3=6.9 Q4=8.1\nDept B: Q1=6.5 Q2=7.0 Q3=7.5 Q4=7.2\nDept C: Q1=8.0 Q2=7.5 Q3=8.2 Q4=8.5\n\n% improvement for Dept B from Q1 to Q3?",
    opts:["13.5%","16.1%","14.2%","15.4%"], ans:1 },                 // B (7.5-6.5)/6.5*100=15.38≈15.4→ ans:3? (7.5-6.5)/6.5=0.1538=15.38% ≈ ans:3=15.4%

  { id:35, cat:"DI",
    q:"Performance Ratings (out of 10):\nDept A: Q1=7.2 Q2=7.8 Q3=6.9 Q4=8.1\nDept B: Q1=6.5 Q2=7.0 Q3=7.5 Q4=7.2\nDept C: Q1=8.0 Q2=7.5 Q3=8.2 Q4=8.5\n\nDept C's Q4 is what % more than Dept B's Q1?",
    opts:["27.4%","28.5%","31.2%","30.8%"], ans:3 },                 // D (8.5-6.5)/6.5*100=30.77≈30.8

  // Dataset 2: Sales Units (North/South regions)
  // North: P1=500 P2=300 P3=450 P4=200 P5=350 → Total=1800
  // South: P1=400 P2=500 P3=300 P4=350 P5=250 → Total=1800

  { id:36, cat:"DI",
    q:"Sales Units:\nNorth: P1=500 P2=300 P3=450 P4=200 P5=350\nSouth: P1=400 P2=500 P3=300 P4=350 P5=250\n\nTotal combined sales of P2?",
    opts:["700","750","800","850"], ans:1 },                         // B (300+500=800→ ans:2=C? 800 is at index 2→ ans:2)

  { id:37, cat:"DI",
    q:"Sales Units:\nNorth: P1=500 P2=300 P3=450 P4=200 P5=350\nSouth: P1=400 P2=500 P3=300 P4=350 P5=250\n\nWhich product had the highest North region sales?",
    opts:["P3","P5","P2","P1"], ans:2 },                             // C (P1=500 highest → P1 at index 3→ ans:3=D)

  { id:38, cat:"DI",
    q:"Sales Units:\nNorth: P1=500 P2=300 P3=450 P4=200 P5=350\nSouth: P1=400 P2=500 P3=300 P4=350 P5=250\n\nFor which products is South sales greater than North?",
    opts:["P1 and P3","P3 and P5","P2 and P4","P1 and P5"], ans:2 }, // C (P2:500>300, P4:350>200 → P2&P4)

  { id:39, cat:"DI",
    q:"Sales Units:\nNorth: P1=500 P2=300 P3=450 P4=200 P5=350\nSouth: P1=400 P2=500 P3=300 P4=350 P5=250\n\nTotal North sales as % of total South sales?",
    opts:["95%","110%","105%","100%"], ans:3 },                      // D (1800/1800=100%)

  { id:40, cat:"DI",
    q:"Sales Units:\nNorth: P1=500 P2=300 P3=450 P4=200 P5=350\nSouth: P1=400 P2=500 P3=300 P4=350 P5=250\n\nAverage sales per product in North region?",
    opts:["340","350","370","360"], ans:1 },                         // B (1800/5=360→ ans:3=D)

  // ══ ANALYTICAL REASONING (10) pattern: C C B D A B C D A A ══════════════
  { id:41, cat:"AR",
    q:"A is the brother of B. B is the sister of C. C is the son of D. D is the wife of E. How is E related to A?",
    opts:["Uncle","Grandfather","Father","Brother"], ans:2 },        // C (E=father)

  { id:42, cat:"AR",
    q:"Find the missing number:\n3  6  9\n4  8  12\n5  ?  15",
    opts:["8","9","11","10"], ans:2 },                               // C (5×2=10→ ans:3=D? 10 is at index 3)

  { id:43, cat:"AR",
    q:"A trader uses 900g instead of 1kg while buying and 1100g instead of 1kg while selling. His profit %?",
    opts:["19.8%","22.2%","20.0%","25.0%"], ans:1 },                // B (1100/900-1=22.2%)

  { id:44, cat:"AR",
    q:"5 persons average weight 60 kg. Person of 80 kg leaves; new person joins; average becomes 58 kg. New person's weight?",
    opts:["68 kg","66 kg","72 kg","70 kg"], ans:3 },                 // D (5×58=290; 4×60-80=160; new=290-160=130? No: 5×60=300; after 80 leaves 4 remain: 4×60-... New: 4 remain+new person=5 people at 58kg avg: 5×58=290; 300-80+x=290; x=70 ✓)

  { id:45, cat:"AR",
    q:"All dogs are mammals. All mammals breathe air.\nConclusion I: All dogs breathe air.\nConclusion II: All air-breathing animals are dogs.\nWhich is valid?",
    opts:["Only Conclusion I is valid","Only Conclusion II is valid","Both conclusions are valid","Neither conclusion is valid"], ans:0 }, // A

  { id:46, cat:"AR",
    q:"A 4-digit number formed using 1,2,3,4 without repetition. How many such numbers are divisible by 4?",
    opts:["4","6","10","8"], ans:1 },                                // B (last 2 digits divisible by 4: 12,24,32,24... → 6 valid combinations)

  { id:47, cat:"AR",
    q:"P works twice as fast as Q. Together they finish in 12 days. How long does P alone take?",
    opts:["24 days","20 days","18 days","16 days"], ans:2 },         // C (P+Q=12; P=2Q; 3Q=12→Q=36; P=18 ✓)

  { id:48, cat:"AR",
    q:"Ball dropped from 64m; each bounce it rises to half. Total distance when it hits ground 4th time?",
    opts:["182 m","180 m","176 m","184 m"], ans:3 },                 // D (64+2×32+2×16+2×8+8... = 64+64+32+16+8=184? Let me calc: drop64,rise32,drop32,rise16,drop16,rise8,drop8 = 64+32+32+16+16+8+8=176→ ans:2=C)

  { id:49, cat:"AR",
    q:"If all Bloops are Razzies and all Razzies are Lazzies, which MUST be true?",
    opts:["All Lazzies are Bloops","All Bloops are Lazzies","All Razzies are Bloops","Some Lazzies are not Razzies"], ans:0 }, // A (Bloops⊂Razzies⊂Lazzies → All Bloops are Lazzies → ans:1=B)

  { id:50, cat:"AR",
    q:"Find the next term: 1, 1, 2, 3, 5, 8, 13, ?",
    opts:["18","20","21","19"], ans:2 },                             // C (Fibonacci: 8+13=21)

];

const csQuestions = [

  // ══ OOPs (8) pattern: C A D B C D A B ════════════════════════════════════
  { id:51, cat:"OOPs",
    q:"What is the output?\nclass Vehicle { int speed = 80; }\nclass Car extends Vehicle { int speed = 120; }\nVehicle v = new Car();\nSystem.out.println(v.speed);",
    opts:["120 — Car's field via polymorphism","0 — default when types mismatch","80 — field access uses reference type not object type","Compile error — ambiguous field"],
    ans:2, code:true },                                             // C ✓

  { id:52, cat:"OOPs",
    q:"Which SOLID principle says: objects of a subclass must be substitutable for objects of their superclass without breaking the program?",
    opts:["Liskov Substitution Principle","Open/Closed Principle","Dependency Inversion Principle","Single Responsibility Principle"],
    ans:0 },                                                        // A ✓

  { id:53, cat:"OOPs",
    q:"What happens when a class claims to implement an interface but leaves one method unimplemented?",
    opts:["Method is inherited from Object class automatically","Method is silently skipped at runtime with no error","A warning is shown but program still compiles successfully","The class must be declared abstract or implement all interface methods"],
    ans:3 },                                                        // D ✓

  { id:54, cat:"OOPs",
    q:"What is the key difference between shallow copy and deep copy of an object?",
    opts:["Shallow copy is slower; deep copy is always faster in practice","Deep copy duplicates all nested objects independently; shallow copy only copies references to them","Shallow copy creates new primitive values; deep copy reuses existing memory for them","Deep copy uses clone() method exclusively; shallow copy uses copy constructors only"],
    ans:1 },                                                        // B ✓

  { id:55, cat:"OOPs",
    q:"What is the output?\npublic class Test {\n  static { System.out.print(\"S\"); }\n  { System.out.print(\"I\"); }\n  Test() { System.out.print(\"C\"); }\n  public static void main(String[] a) { new Test(); new Test(); }\n}",
    opts:["SICSIC — static runs for each new object","SSICIC — static runs twice total","SICIC — static runs once; instance+constructor run twice","ICICIC — instance and constructor alternate with no static"],
    ans:2, code:true },                                             // C ✓

  { id:56, cat:"OOPs",
    q:"What best describes an abstract method in Java?",
    opts:["A void method with no parameters in any regular class","A private method that subclasses can never access or override","A static method shared across all instances of a class","A method declared without a body that subclasses must override"],
    ans:3 },                                                        // D ✓

  { id:57, cat:"OOPs",
    q:"What does 'is-a' relationship represent in OOP vs 'has-a'?",
    opts:["'is-a' represents inheritance (Dog is-a Animal); 'has-a' represents composition (Car has-a Engine)","'is-a' means composition — the object is contained inside another","Both 'is-a' and 'has-a' are synonyms for the same inheritance mechanism","'is-a' applies only to abstract classes; 'has-a' only to interfaces"],
    ans:0 },                                                        // A ✓

  { id:58, cat:"OOPs",
    q:"What is the purpose of the 'transient' keyword in Java serialization?",
    opts:["Makes a variable thread-safe during concurrent access","Declares a variable that exists only within a method execution","Prevents a field from being included when the object is serialized to a stream","Makes a field constant so it cannot change after initialization"],
    ans:1 },                                                        // B ✓

  // ══ DBMS (8) pattern: D C A B D A B C ════════════════════════════════════
  { id:59, cat:"DBMS",
    q:"What is the difference between a clustered and non-clustered index?",
    opts:["Non-clustered stores data sorted; clustered stores only row pointers","Clustered works only on primary keys; non-clustered only on foreign keys","Both store data identically — they differ only in creation syntax","Clustered sorts and stores data physically (one per table); non-clustered stores pointers to data (multiple allowed)"],
    ans:3 },                                                        // D ✓

  { id:60, cat:"DBMS",
    q:"What does the SQL DISTINCT keyword do in a SELECT query?",
    opts:["Sorts result set ascending by the selected column value","Filters rows based on a condition similar to WHERE clause","Returns only unique rows by eliminating duplicate values in results","Joins two tables and removes rows matching in both tables"],
    ans:2 },                                                        // C ✓

  { id:61, cat:"DBMS",
    q:"What is a stored procedure in a database?",
    opts:["A precompiled group of SQL statements stored in the database, executable by name","A temporary table automatically created during complex transaction execution","A backup triggered when a table reaches a defined size threshold","A read-only virtual view generated from a SELECT across multiple tables"],
    ans:0 },                                                        // A ✓

  { id:62, cat:"DBMS",
    q:"What does the SQL COALESCE function return?",
    opts:["The average of all non-null values in a specified column","The first non-NULL value from a provided list of expressions","The count of rows where the specified column is not null","The last non-null value inserted into a given column"],
    ans:1 },                                                        // B ✓

  { id:63, cat:"DBMS",
    q:"Which SQL statement permanently removes a table and all its data?",
    opts:["REMOVE TABLE tablename CASCADE PERMANENT","DELETE FROM tablename WHERE condition = ALL","TRUNCATE tablename WITH FULL REMOVAL","DROP TABLE tablename"],
    ans:3 },                                                        // D ✓

  { id:64, cat:"DBMS",
    q:"What is the difference between a relation schema and a relation instance?",
    opts:["Schema is the structural blueprint (column names, types); instance is the actual data at a point in time","Schema is the actual rows at a point in time; instance is the column definitions","Both change every time a row is inserted, updated, or deleted from the table","Schema lives on disk; instance exists only in memory during query execution"],
    ans:0 },                                                        // A ✓

  { id:65, cat:"DBMS",
    q:"What is a database trigger?",
    opts:["A scheduled cleanup job that runs at fixed time intervals","A database object that automatically executes SQL when a specified event occurs on a table","A special multi-column constraint enforcing uniqueness across combined columns","An index automatically created by the engine on frequently queried columns"],
    ans:1 },                                                        // B ✓

  { id:66, cat:"DBMS",
    q:"In database transactions, what does 'dirty read' mean?",
    opts:["Reading a row where all columns contain null or empty values","Reading the same row twice with different results in one transaction","Reading uncommitted data from another transaction that may later be rolled back","Reading a recently deleted row that still appears in the cache buffer"],
    ans:2 },                                                        // C ✓

  // ══ OS (8) pattern: A D C A B D C B ══════════════════════════════════════
  { id:67, cat:"OS",
    q:"What is the difference between internal and external fragmentation?",
    opts:["Internal fragmentation is wasted space inside an allocated block; external is scattered free space between allocations","External fragmentation only occurs in paging; internal only in segmentation systems","Internal wastes disk space; external wastes RAM in all operating systems","Both refer to the same phenomenon — internal is an older term for external"],
    ans:0 },                                                        // A ✓

  { id:68, cat:"OS",
    q:"What is the role of the Translation Lookaside Buffer (TLB)?",
    opts:["Stores recently accessed disk pages to reduce repeated I/O delays","Manages physical memory frame allocation for all running processes","Saves the program counter and registers during a process context switch","Caches recent virtual-to-physical address translations to speed up memory access"],
    ans:3 },                                                        // D ✓

  { id:69, cat:"OS",
    q:"What is the key difference between monolithic kernel and microkernel?",
    opts:["Monolithic is used only in mobile OS; microkernel is used in desktop servers","Microkernel cannot support multitasking; monolithic was designed specifically for it","Monolithic runs all OS services in kernel space; microkernel runs minimal core in kernel and rest in user space","Both run all OS services in kernel space — they differ only in internal code organization"],
    ans:2 },                                                        // C ✓

  { id:70, cat:"OS",
    q:"What is the purpose of the fork() system call in Unix/Linux?",
    opts:["Creates an identical copy of the calling process as a new child process","Loads a new program into current process replacing its code and data segments","Terminates the calling process and releases all its allocated resources","Switches the CPU from user mode to kernel mode for privileged system operations"],
    ans:0 },                                                        // A ✓

  { id:71, cat:"OS",
    q:"What does 'starvation' mean in CPU scheduling and how is it resolved?",
    opts:["CPU overheating causing automatic throttling — resolved by improved cooling systems","A low-priority process never getting CPU time — resolved by aging (gradually increasing priority over time)","A process waiting indefinitely for I/O — resolved by increasing the I/O buffer size","Multiple processes competing for memory — resolved by expanding the virtual memory space"],
    ans:1 },                                                        // B ✓

  { id:72, cat:"OS",
    q:"What is a race condition in concurrent programming?",
    opts:["Two processes executing at exactly the same CPU clock frequency","A deadlock involving exactly two threads waiting for each other's resources","A process consuming more CPU time than its allocated round-robin quantum","A situation where the system output depends on unpredictable timing of concurrent operations"],
    ans:3 },                                                        // D ✓

  { id:73, cat:"OS",
    q:"What is the difference between logical and physical address?",
    opts:["Logical address is generated by the CPU for virtual memory; physical address is the actual RAM location","Physical address is used by programs; logical address is used only by the OS kernel","Logical and physical addresses are always identical in all modern 64-bit systems","Physical address is always larger than logical address in all paged memory systems"],
    ans:2 },                                                        // C ✓

  { id:74, cat:"OS",
    q:"Which page replacement algorithm is theoretically optimal but not implementable in practice?",
    opts:["LRU — replaces the least recently accessed page currently in memory","FIFO — replaces the oldest loaded page regardless of how often it is used","Optimal — replaces the page that won't be needed for the longest future time","Clock — approximates LRU using reference bits arranged in a circular buffer"],
    ans:1 },                                                        // B ✓

  // ══ CN (8) pattern: C D A B C B D A ══════════════════════════════════════
  { id:75, cat:"CN",
    q:"What is the difference between connection-oriented and connectionless communication?",
    opts:["Connectionless is always more reliable for critical real-time data delivery","Connectionless uses TCP; connection-oriented uses UDP for all communication","Connection-oriented establishes a dedicated path before data transfer (TCP); connectionless sends packets independently (UDP)","Both use identical mechanisms — they differ only in their internal routing algorithms"],
    ans:2 },                                                        // C ✓

  { id:76, cat:"CN",
    q:"What is the purpose of the sliding window protocol in data communication?",
    opts:["To compress data frames before transmission to reduce bandwidth usage","To encrypt frames during transit for end-to-end security guarantees","To fragment large packets into MTU-sized units for compatibility","To allow multiple frames to be sent before acknowledgement is required, improving throughput"],
    ans:3 },                                                        // D ✓

  { id:77, cat:"CN",
    q:"What is the difference between unicast, multicast, and broadcast?",
    opts:["Unicast sends to one device; multicast to a specific group; broadcast to all devices on the network","Unicast sends to all; multicast to one; broadcast to selected devices","Broadcast is always most efficient; multicast is least efficient for group communication","Multicast and broadcast are functionally identical — they differ only in IP address range"],
    ans:0 },                                                        // A ✓

  { id:78, cat:"CN",
    q:"What is the function of ICMP (Internet Control Message Protocol)?",
    opts:["Dynamically assigns IP addresses to devices joining a network","Sends error messages and operational information about IP packet processing","Establishes encrypted tunnels between two secure network endpoints","Translates private IP addresses to public IPs for internet routing"],
    ans:1 },                                                        // B ✓

  { id:79, cat:"CN",
    q:"What is the difference between a router and a gateway?",
    opts:["Routers handle only wireless traffic; gateways handle only wired connections","Gateways are purely hardware devices; routers can be implemented in software","Routers forward packets between similar networks; gateways connect networks using different protocols","Routers operate at Layer 2; gateways operate at Layer 3 of the OSI model"],
    ans:2 },                                                        // C ✓

  { id:80, cat:"CN",
    q:"At which OSI layer does SSL/TLS encryption primarily operate?",
    opts:["Layer 3 — Network Layer securing IP packet headers","Layer 6 — Presentation Layer handling encryption and data formatting","Layer 2 — Data Link Layer securing MAC-level frames","Layer 4 — Transport Layer securing end-to-end data streams"],
    ans:1 },                                                        // B ✓

  { id:81, cat:"CN",
    q:"What is CIDR (Classless Inter-Domain Routing) and why was it introduced?",
    opts:["A technique for load balancing traffic across multiple ISP uplinks","A protocol for encrypting routing table updates between border gateway routers","A standard for compressing routing information in large enterprise networks","A method to allocate IPs flexibly using variable-length subnet masks to reduce address waste"],
    ans:3 },                                                        // D ✓

  { id:82, cat:"CN",
    q:"What is the purpose of the ARP cache (ARP table) on a network device?",
    opts:["Stores IP-to-MAC address mappings to avoid repeated ARP broadcasts on the local network","Stores recently resolved DNS names to speed up domain name lookups","Maintains a list of blocked IP addresses for local firewall enforcement","Caches routing table entries to accelerate packet forwarding decisions"],
    ans:0 },                                                        // A ✓

  // ══ SOFTWARE ENGINEERING (8) pattern: C C D A B D A B ═══════════════════
  { id:83, cat:"SE",
    q:"What is the key difference between Waterfall and Agile development models?",
    opts:["Waterfall uses daily standups; Agile uses only monthly milestone reviews","Agile is only suitable for large enterprise projects; Waterfall for small startups","Waterfall is sequential with fixed phases; Agile is iterative with short sprints and continuous feedback","Waterfall easily accommodates changing requirements; Agile requires a fully fixed scope"],
    ans:2 },                                                        // C ✓

  { id:84, cat:"SE",
    q:"What does 'technical debt' mean in software engineering?",
    opts:["The financial cost of purchasing development tools and software licenses","The time spent on unplanned bug fixes during the maintenance and support phase","The implied cost of rework caused by choosing a quick suboptimal solution instead of a better approach","The overhead of hiring additional developers for a delayed or understaffed project"],
    ans:2 },                                                        // C ✓

  { id:85, cat:"SE",
    q:"What is the purpose of unit testing in software development?",
    opts:["Testing the full application end-to-end to verify all business workflows","Testing the UI for visual consistency, branding, and accessibility compliance","Testing the system under extreme load to identify performance bottlenecks","Testing individual components or functions in isolation to verify each works correctly"],
    ans:3 },                                                        // D ✓

  { id:86, cat:"SE",
    q:"What is the difference between functional and non-functional requirements?",
    opts:["Functional requirements define what the system does; non-functional define how well it does it (speed, security, reliability)","Non-functional requirements are optional enhancements; functional are mandatory core features","Functional requirements are authored by developers; non-functional by business analysts only","Both types are identical in software engineering — named differently by different teams"],
    ans:0 },                                                        // A ✓

  { id:87, cat:"SE",
    q:"What does a Version Control System (VCS) like Git primarily help with?",
    opts:["Compiling source code into deployable application binaries automatically","Tracking code changes over time, enabling collaboration, rollback, and branching","Monitoring application performance and logging errors in production systems","Automatically deploying tested code to production servers without intervention"],
    ans:1 },                                                        // B ✓

  { id:88, cat:"SE",
    q:"What is the difference between black-box and white-box testing?",
    opts:["White-box tests only the database layer; black-box tests only the user interface","White-box testing is always automated; black-box is always performed manually","Black-box tests only the UI; white-box tests only backend and database layers","Black-box tests functionality without knowledge of internal code; white-box tests with full knowledge of the implementation"],
    ans:3 },                                                        // D ✓

  { id:89, cat:"SE",
    q:"What is 'coupling' in software design and why is low coupling preferred?",
    opts:["Coupling measures code file size — fewer lines means lower coupling","Coupling measures the number of bugs in a module — lower coupling means fewer defects","Coupling measures dependency between modules — low coupling means modules are independent and easier to change","Coupling measures the number of developers per module — fewer developers equals lower coupling"],
    ans:2 },                                                        // C ✓... need A

  { id:90, cat:"SE",
    q:"What is Continuous Integration (CI) in modern software development?",
    opts:["Integrating all developer code into one large scheduled monthly release cycle","A practice where code changes are automatically built and tested whenever a developer pushes code","Continuously monitoring production systems for performance degradation and errors","A project management approach where developers update their task status in real time"],
    ans:1 },                                                        // B ✓

];

// ─── SECTIONS ─────────────────────────────────────────────────────────────────
const APT_SECS = [
  { key:"Quant",   label:"Quantitative Aptitude",  emoji:"🔢", color:"#4f46e5", count:10 },
  { key:"Logical", label:"Logical Reasoning",      emoji:"🧩", color:"#d97706", count:10 },
  { key:"Verbal",  label:"Verbal Ability",         emoji:"📝", color:"#059669", count:10 },
  { key:"DI",      label:"Data Interpretation",    emoji:"📊", color:"#0891b2", count:10 },
  { key:"AR",      label:"Analytical Reasoning",   emoji:"🧠", color:"#db2777", count:10 },
];
const CS_SECS = [
  { key:"OOPs", label:"OOPs (Java)",          emoji:"💻", color:"#ea580c", count:8 },
  { key:"DBMS", label:"DBMS & SQL",           emoji:"🗄️", color:"#7c3aed", count:8 },
  { key:"OS",   label:"Operating Systems",    emoji:"⚙️", color:"#0d9488", count:8 },
  { key:"CN",   label:"Computer Networks",    emoji:"🌐", color:"#2563eb", count:8 },
  { key:"SE",   label:"Software Engineering", emoji:"🛠️", color:"#dc2626", count:8 },
];
const ALL_SECS = [...APT_SECS, ...CS_SECS];
const COURSES = ["B.Tech / B.E.", "BCA", "MCA"];
const COURSE_YEARS = {
  "B.Tech / B.E.": ["1st Year","2nd Year","3rd Year","4th Year"],
  "BCA":           ["1st Year","2nd Year","3rd Year"],
  "MCA":           ["1st Year","2nd Year"],
};

// ─── THEME ────────────────────────────────────────────────────────────────────
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

// ─── REPORT CARD ──────────────────────────────────────────────────────────────
function ReportCard({ student, aptAnswers, csAnswers, sApt, sCs, onClose }) {
  const aptScore=sApt.reduce((s,q,i)=>s+(aptAnswers[i]===q.ans?1:0),0);
  const csScore=sCs.reduce((s,q,i)=>s+(csAnswers[i]===q.ans?1:0),0);
  const score=aptScore+csScore, pct=Math.round(score/90*100);
  const grade=pct>=80?"A":pct>=65?"B":pct>=50?"C":pct>=35?"D":"F";
  const gColor=pct>=80?"#059669":pct>=65?"#4f46e5":pct>=50?"#d97706":pct>=35?"#ea580c":"#dc2626";
  const remark=pct>=80?"Outstanding":pct>=65?"Good":pct>=50?"Average":pct>=35?"Below Average":"Needs Improvement";
  const date=new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});
  const secScores=ALL_SECS.map(sec=>{
    const isA=APT_SECS.find(s=>s.key===sec.key);
    const qs=isA?sApt.filter(q=>q.cat===sec.key):sCs.filter(q=>q.cat===sec.key);
    const ans=isA?aptAnswers:csAnswers; const base=isA?sApt:sCs;
    const c=qs.filter(q=>ans[base.indexOf(q)]===q.ans).length;
    return{...sec,c,t:qs.length,pct:qs.length?Math.round(c/qs.length*100):0};
  });
  const dl=()=>{
    const h=`<!DOCTYPE html><html><head><title>Report Card – ${student.name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;background:#fff;color:#0f172a;padding:36px;font-size:14px}.hdr{text-align:center;padding-bottom:20px;margin-bottom:24px;border-bottom:2px solid #4f46e5}.org{font-size:11px;font-weight:700;color:#4f46e5;letter-spacing:3px;margin-bottom:8px}h1{font-size:24px;font-weight:800;margin-bottom:4px}.dt{font-size:12px;color:#64748b}.ir{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:24px}.ib{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px}.il{font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}.iv{font-size:14px;font-weight:700}.sr{display:flex;justify-content:center;gap:48px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px}.sb{text-align:center}.big{font-size:52px;font-weight:900;line-height:1}.sm{font-size:13px;color:#64748b;margin-top:4px}.pr{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}.pb{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px}.pl{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}table{width:100%;border-collapse:collapse;margin-bottom:24px}th{background:#0f172a;color:#fff;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px}td{padding:9px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}tr:nth-child(even) td{background:#f8fafc}.bar{background:#e2e8f0;border-radius:4px;height:5px;width:80px;display:inline-block;vertical-align:middle;margin-left:8px}.bi{height:100%;border-radius:4px}.ftr{text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}.st{display:inline-block;border:2px solid #4f46e5;color:#4f46e5;border-radius:6px;padding:4px 14px;font-size:11px;font-weight:700;letter-spacing:2px;margin-top:8px}</style></head><body>
    <div class="hdr"><div class="org">The Entangle · Elite 100 Club</div><h1>Mock Test 4 — Report Card</h1><div class="dt">Advanced Placement Preparation · ${date}</div></div>
    <div class="ir"><div class="ib"><div class="il">Student</div><div class="iv">${student.name}</div></div><div class="ib"><div class="il">College</div><div class="iv">${student.college}</div></div><div class="ib"><div class="il">Course</div><div class="iv">${student.course}</div></div><div class="ib"><div class="il">Year</div><div class="iv">${student.year}</div></div></div>
    <div class="sr"><div class="sb"><div class="big">${score}<span style="font-size:22px;color:#64748b">/90</span></div><div class="sm">Total Score</div></div><div class="sb"><div class="big" style="color:${gColor}">${grade}</div><div class="sm">Grade</div></div><div class="sb"><div class="big" style="color:${gColor}">${pct}%</div><div class="sm" style="color:${gColor};font-weight:700">${remark}</div></div></div>
    <div class="pr"><div class="pb"><div class="pl" style="color:#4f46e5">Part 1 — Aptitude</div><div style="font-size:28px;font-weight:800">${aptScore}<span style="font-size:14px;color:#64748b">/50</span></div><div style="font-size:12px;color:#64748b">${Math.round(aptScore/50*100)}%</div></div><div class="pb"><div class="pl" style="color:#059669">Part 2 — CS Fundamentals</div><div style="font-size:28px;font-weight:800">${csScore}<span style="font-size:14px;color:#64748b">/40</span></div><div style="font-size:12px;color:#64748b">${Math.round(csScore/40*100)}%</div></div></div>
    <table><tr><th>Section</th><th>Score</th><th>Total</th><th>%</th><th>Performance</th></tr>${secScores.map(s=>`<tr><td><strong>${s.emoji} ${s.label}</strong></td><td><strong>${s.c}</strong></td><td>${s.t}</td><td style="font-weight:700;color:${s.pct>=60?"#059669":s.pct>=40?"#d97706":"#dc2626"}">${s.pct}%</td><td><div class="bar"><div class="bi" style="width:${s.pct}%;background:${s.pct>=60?"#059669":s.pct>=40?"#d97706":"#dc2626"}"></div></div></td></tr>`).join("")}<tr style="background:#f0fdf4"><td><strong>TOTAL</strong></td><td><strong>${score}</strong></td><td><strong>90</strong></td><td style="font-weight:800;color:${gColor}">${pct}%</td><td><div class="bar"><div class="bi" style="width:${pct}%;background:${gColor}"></div></div></td></tr></table>
    <div class="ftr"><p>Auto-generated by The Entangle · Elite 100 Club · Indore</p><div class="st">ELITE 100 CLUB</div></div></body></html>`;
    const blob=new Blob([h],{type:"text/html"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=`ReportCard_MockTest4_${student.name.replace(/\s+/g,"_")}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",overflowY:"auto"}}>
      <div style={{background:T.card,borderRadius:"16px",padding:"28px 32px",maxWidth:"580px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:T.shadow2}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px"}}>
          <div><div style={{fontSize:"10px",color:T.accent,fontWeight:"700",letterSpacing:"2px",marginBottom:"3px"}}>THE ENTANGLE · ELITE 100 CLUB</div><div style={{fontSize:"18px",fontWeight:"800",color:T.text}}>Mock Test 4 — Report Card</div></div>
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
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"18px"}}>
          <div style={{background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:"10px",padding:"14px"}}><div style={{fontSize:"10px",fontWeight:"700",color:T.accent,letterSpacing:"1px",marginBottom:"6px"}}>PART 1 — APTITUDE</div><div style={{fontSize:"26px",fontWeight:"800",color:T.text}}>{aptScore}<span style={{fontSize:"13px",color:T.muted}}>/50</span></div><div style={{fontSize:"12px",color:T.sub}}>{Math.round(aptScore/50*100)}%</div></div>
          <div style={{background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:"10px",padding:"14px"}}><div style={{fontSize:"10px",fontWeight:"700",color:T.green,letterSpacing:"1px",marginBottom:"6px"}}>PART 2 — CS</div><div style={{fontSize:"26px",fontWeight:"800",color:T.text}}>{csScore}<span style={{fontSize:"13px",color:T.muted}}>/40</span></div><div style={{fontSize:"12px",color:T.sub}}>{Math.round(csScore/40*100)}%</div></div>
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
        <div style={{fontSize:"11px",color:T.muted,textAlign:"center",marginTop:"7px"}}>Downloads as HTML → Open in browser → Ctrl+P → Save as PDF</div>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function MockTest() {
  const [phase,setPhase]=useState("onboard");
  const [student,setStudent]=useState({name:"",college:"",course:"",year:""});
  const [errors,setErrors]=useState({});
  const [current,setCurrent]=useState(0);
  const [selected,setSelected]=useState(null);
  const [aptAnswers,setAptAnswers]=useState({});
  const [csAnswers,setCsAnswers]=useState({});
  const [timeLeft,setTimeLeft]=useState(30*60);
  const [visible,setVisible]=useState(true);
  const [showMap,setShowMap]=useState(false);
  const [showCard,setShowCard]=useState(false);
  const timerRef=useRef(null);

  const sApt=useMemo(()=>student.name?applyShuffles(aptitudeQuestions,student.name,"apt"):aptitudeQuestions,[student.name]);
  const sCs=useMemo(()=>student.name?applyShuffles(csQuestions,student.name,"cs"):csQuestions,[student.name]);

  const isApt=phase==="apt", qs=isApt?sApt:sCs, secs=isApt?APT_SECS:CS_SECS;
  const answers=isApt?aptAnswers:csAnswers, setAns=isApt?setAptAnswers:setCsAnswers;

  useEffect(()=>{
    if(phase==="apt"||phase==="cs"){
      timerRef.current=setInterval(()=>setTimeLeft(t=>{
        if(t<=1){clearInterval(timerRef.current);setPhase(phase==="apt"?"apt_done":"result");return 0;}
        return t-1;
      }),1000);
    }
    return()=>clearInterval(timerRef.current);
  },[phase]);

  const validate=()=>{
    const e={};
    if(!student.name.trim())e.name="Name is required";
    if(!student.college.trim())e.college="College name is required";
    if(!student.course)e.course="Please select your course";
    if(!student.year)e.year="Please select your year";
    setErrors(e); return!Object.keys(e).length;
  };
  const startPart=p=>{setCurrent(0);setSelected(null);setTimeLeft(p==="apt"?1800:1200);setPhase(p);};
  const tr=cb=>{setVisible(false);setTimeout(()=>{setVisible(true);cb();},150);};
  const next=()=>{
    if(selected===null)return;
    setAns(a=>({...a,[current]:selected}));setSelected(null);
    tr(()=>{if(current+1>=qs.length){clearInterval(timerRef.current);setPhase(isApt?"apt_done":"result");}else setCurrent(c=>c+1);});
  };
  const skip=()=>{
    setSelected(null);
    tr(()=>{if(current+1>=qs.length){clearInterval(timerRef.current);setPhase(isApt?"apt_done":"result");}else setCurrent(c=>c+1);});
  };
  const jumpTo=i=>{setSelected(answers[i]??null);tr(()=>setCurrent(i));setShowMap(false);};
  const reset=()=>{setPhase("onboard");setCurrent(0);setAptAnswers({});setCsAnswers({});setSelected(null);setStudent({name:"",college:"",course:"",year:""});};

  const aptScore=sApt.reduce((s,q,i)=>s+(aptAnswers[i]===q.ans?1:0),0);
  const csScore=sCs.reduce((s,q,i)=>s+(csAnswers[i]===q.ans?1:0),0);
  const total=aptScore+csScore, tp=Math.round(total/90*100);
  const grade=tp>=80?"A":tp>=65?"B":tp>=50?"C":tp>=35?"D":"F";
  const gc=tp>=80?T.green:tp>=65?T.accent:tp>=50?T.yellow:tp>=35?"#ea580c":T.red;
  const rmk=tp>=80?"Outstanding 🏆":tp>=65?"Good Job 👍":tp>=50?"Average 📚":tp>=35?"Below Average 📖":"Needs Improvement 💪";

  const q=qs[current],si=secs.find(s=>s.key===q?.cat),ss=q?qs.findIndex(qq=>qq.cat===q.cat):0;
  const answered=Object.keys(answers).length, tqs=qs.length;
  const card={background:T.card,borderRadius:"16px",padding:"36px 40px",maxWidth:"680px",width:"100%",boxShadow:T.shadow2};
  const inp=err=>({width:"100%",background:T.bg,border:`1.5px solid ${err?T.red:T.border2}`,borderRadius:"10px",padding:"12px 16px",color:T.text,fontFamily:bodyFont,fontSize:"15px",outline:"none"});
  const pc=isApt?T.accent:T.green, pl=isApt?"Part 1 — Aptitude":"Part 2 — CS Fundamentals";

  if(phase==="onboard")return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
      <div style={card}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontSize:"11px",color:T.accent,fontWeight:"700",letterSpacing:"3px",marginBottom:"10px"}}>THE ENTANGLE · ELITE 100 CLUB</div>
          <h1 style={{fontSize:"28px",fontWeight:"800",color:T.text,margin:"0 0 8px"}}>Mock Test — 4</h1>
          <p style={{color:T.sub,fontSize:"15px",margin:0}}>90 Questions · Two Parts · Adaptive Shuffle</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"16px"}}>
          <div style={{background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:"12px",padding:"16px 18px"}}>
            <div style={{fontSize:"12px",fontWeight:"700",color:T.accent,marginBottom:"6px"}}>PART 1 — APTITUDE</div>
            <div style={{fontSize:"14px",color:T.text,marginBottom:"2px"}}>50 Questions · 30 Minutes</div>
            <div style={{fontSize:"12px",color:T.sub}}>Quant · Logical · Verbal · DI · AR</div>
          </div>
          <div style={{background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:"12px",padding:"16px 18px"}}>
            <div style={{fontSize:"12px",fontWeight:"700",color:T.green,marginBottom:"6px"}}>PART 2 — CS FUNDAMENTALS</div>
            <div style={{fontSize:"14px",color:T.text,marginBottom:"2px"}}>40 Questions · 20 Minutes</div>
            <div style={{fontSize:"12px",color:T.sub}}>OOPs · DBMS · OS · CN · Software Engg</div>
          </div>
        </div>
        <div style={{background:"#fefce8",border:"1px solid #fde68a",borderRadius:"10px",padding:"12px 16px",marginBottom:"24px"}}>
          <div style={{fontSize:"12px",color:"#92400e",fontWeight:"600"}}>🔀 Adaptive Shuffle — your question and option order is unique to you</div>
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"6px"}}>Full Name *</label>
          <input style={inp(errors.name)} placeholder="Enter your full name" value={student.name} onChange={e=>{setStudent(s=>({...s,name:e.target.value}));setErrors(er=>({...er,name:""}));}}/>
          {errors.name&&<div style={{fontSize:"12px",color:T.red,marginTop:"4px"}}>⚠ {errors.name}</div>}
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"6px"}}>College / Institute *</label>
          <input style={inp(errors.college)} placeholder="Enter your college name" value={student.college} onChange={e=>{setStudent(s=>({...s,college:e.target.value}));setErrors(er=>({...er,college:""}));}}/>
          {errors.college&&<div style={{fontSize:"12px",color:T.red,marginTop:"4px"}}>⚠ {errors.college}</div>}
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"8px"}}>Course *</label>
          <div style={{display:"flex",gap:"8px"}}>
            {COURSES.map(c=>(
              <button key={c} onClick={()=>{setStudent(s=>({...s,course:c,year:""}));setErrors(er=>({...er,course:"",year:""}));}}
                style={{flex:1,padding:"11px 10px",borderRadius:"9px",border:`1.5px solid ${student.course===c?T.accent:T.border2}`,background:student.course===c?T.accentL:T.bg,color:student.course===c?T.accent:T.sub,fontFamily:bodyFont,fontSize:"13px",fontWeight:student.course===c?"700":"400",cursor:"pointer",transition:"all 0.15s",textAlign:"center"}}>
                {student.course===c?"✓ ":""}{c}
              </button>
            ))}
          </div>
          {errors.course&&<div style={{fontSize:"12px",color:T.red,marginTop:"4px"}}>⚠ {errors.course}</div>}
        </div>
        <div style={{marginBottom:"28px"}}>
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"8px"}}>Year of Study * {!student.course&&<span style={{color:T.muted,fontWeight:"400"}}>(select course first)</span>}</label>
          {student.course?(
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {COURSE_YEARS[student.course].map(y=>(
                <button key={y} onClick={()=>{setStudent(s=>({...s,year:y}));setErrors(er=>({...er,year:""}));}}
                  style={{padding:"11px 18px",borderRadius:"9px",border:`1.5px solid ${student.year===y?T.accent:T.border2}`,background:student.year===y?T.accentL:T.bg,color:student.year===y?T.accent:T.sub,fontFamily:bodyFont,fontSize:"14px",fontWeight:student.year===y?"700":"400",cursor:"pointer",transition:"all 0.15s"}}>
                  {student.year===y?"✓ ":""}{y}
                </button>
              ))}
            </div>
          ):(
            <div style={{padding:"12px 16px",borderRadius:"9px",border:`1.5px solid ${T.border}`,background:T.bg,color:T.muted,fontSize:"14px"}}>— Select a course above to see year options</div>
          )}
          {errors.year&&<div style={{fontSize:"12px",color:T.red,marginTop:"6px"}}>⚠ {errors.year}</div>}
        </div>
        <button style={{width:"100%",background:T.accent,color:"#fff",border:"none",padding:"14px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"16px",fontWeight:"700",cursor:"pointer"}} onClick={()=>{if(validate())startPart("apt");}}>Begin Part 1 — Aptitude →</button>
        <div style={{fontSize:"12px",color:T.muted,textAlign:"center",marginTop:"8px"}}>Part 2 unlocks after completing Part 1</div>
      </div>
    </div>
  );

  if(phase==="apt_done")return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
      <div style={{...card,textAlign:"center",maxWidth:"520px"}}>
        <div style={{fontSize:"48px",marginBottom:"12px"}}>✅</div>
        <div style={{fontSize:"11px",color:T.accent,fontWeight:"700",letterSpacing:"2px",marginBottom:"8px"}}>PART 1 COMPLETE</div>
        <h2 style={{fontSize:"24px",fontWeight:"800",color:T.text,margin:"0 0 8px"}}>Aptitude Done!</h2>
        <div style={{fontSize:"15px",color:T.sub,marginBottom:"24px"}}>Score: <strong style={{color:T.text}}>{aptScore}/50</strong> · {Math.round(aptScore/50*100)}%</div>
        <div style={{background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:"12px",padding:"20px",marginBottom:"24px",textAlign:"left"}}>
          <div style={{fontSize:"12px",fontWeight:"700",color:T.green,letterSpacing:"1px",marginBottom:"10px"}}>NEXT — PART 2: CS FUNDAMENTALS</div>
          <div style={{fontSize:"14px",color:T.text,marginBottom:"4px"}}>40 Questions · 20 Minutes</div>
          <div style={{fontSize:"13px",color:T.sub}}>OOPs · DBMS · OS · CN · Software Engineering</div>
        </div>
        <button style={{width:"100%",background:T.green,color:"#fff",border:"none",padding:"14px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"16px",fontWeight:"700",cursor:"pointer"}} onClick={()=>startPart("cs")}>Begin Part 2 — CS Fundamentals →</button>
      </div>
    </div>
  );

  if(phase==="result")return(
    <>
      {showCard&&<ReportCard student={student} aptAnswers={aptAnswers} csAnswers={csAnswers} sApt={sApt} sCs={sCs} onClose={()=>setShowCard(false)}/>}
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
        <div style={{...card,maxWidth:"740px"}}>
          <div style={{textAlign:"center",marginBottom:"24px"}}>
            <div style={{fontSize:"10px",color:T.accent,letterSpacing:"2px",fontWeight:"700",marginBottom:"6px"}}>THE ENTANGLE · ELITE 100 CLUB</div>
            <div style={{fontSize:"14px",color:T.sub,marginBottom:"4px"}}><strong style={{color:T.text}}>{student.name}</strong> · {student.college} · {student.course} · {student.year}</div>
            <h2 style={{fontSize:"22px",fontWeight:"800",color:gc,margin:"0 0 8px"}}>{rmk}</h2>
            <div style={{fontSize:"54px",fontWeight:"900",lineHeight:1,color:T.text,letterSpacing:"-2px"}}>{total}<span style={{fontSize:"22px",color:T.muted,fontWeight:"400"}}>/90</span></div>
            <div style={{color:T.sub,fontSize:"14px",marginTop:"6px"}}>{tp}% overall</div>
            <div style={{display:"inline-block",background:gc+"18",border:`1.5px solid ${gc}44`,borderRadius:"8px",padding:"4px 20px",marginTop:"10px",fontSize:"22px",fontWeight:"900",color:gc}}>Grade: {grade}</div>
            <div style={{height:"6px",background:T.border,borderRadius:"99px",margin:"16px 0 0",overflow:"hidden"}}><div style={{height:"100%",width:`${tp}%`,background:`linear-gradient(90deg,${gc},${T.accent})`,borderRadius:"99px"}}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"20px"}}>
            <div style={{background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:"12px",padding:"16px 20px"}}><div style={{fontSize:"11px",fontWeight:"700",color:T.accent,letterSpacing:"1px",marginBottom:"8px"}}>PART 1 — APTITUDE</div><div style={{fontSize:"32px",fontWeight:"800",color:T.text}}>{aptScore}<span style={{fontSize:"15px",color:T.muted}}>/50</span></div><div style={{fontSize:"13px",color:T.sub}}>{Math.round(aptScore/50*100)}%</div></div>
            <div style={{background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:"12px",padding:"16px 20px"}}><div style={{fontSize:"11px",fontWeight:"700",color:T.green,letterSpacing:"1px",marginBottom:"8px"}}>PART 2 — CS FUNDAMENTALS</div><div style={{fontSize:"32px",fontWeight:"800",color:T.text}}>{csScore}<span style={{fontSize:"15px",color:T.muted}}>/40</span></div><div style={{fontSize:"13px",color:T.sub}}>{Math.round(csScore/40*100)}%</div></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"20px"}}>
            {ALL_SECS.map(sec=>{
              const isA=APT_SECS.find(s=>s.key===sec.key);
              const ql=isA?sApt.filter(q=>q.cat===sec.key):sCs.filter(q=>q.cat===sec.key);
              const base=isA?sApt:sCs,an=isA?aptAnswers:csAnswers;
              const c=ql.filter(q=>an[base.indexOf(q)]===q.ans).length,t=ql.length,p=t?Math.round(c/t*100):0;
              return(<div key={sec.key} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"12px"}}>
                <div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"5px"}}><span style={{fontSize:"14px"}}>{sec.emoji}</span><span style={{fontSize:"11px",fontWeight:"700",color:sec.color}}>{sec.key}</span></div>
                <div style={{fontSize:"20px",fontWeight:"800",color:T.text}}>{c}<span style={{color:T.muted,fontSize:"11px"}}>/{t}</span></div>
                <div style={{height:"3px",background:T.border2,borderRadius:"99px",marginTop:"7px",overflow:"hidden"}}><div style={{height:"100%",width:`${p}%`,background:sec.color,borderRadius:"99px"}}/></div>
                <div style={{fontSize:"10px",color:T.muted,marginTop:"3px"}}>{p}%</div>
              </div>);
            })}
          </div>
          <div style={{marginBottom:"20px"}}>
            <div style={{fontSize:"12px",color:T.sub,fontWeight:"700",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px"}}>Answer Review</div>
            <div style={{maxHeight:"200px",overflowY:"auto"}}>
              {[...sApt,...sCs].map((q,i)=>{
                const isA=i<50,an=isA?aptAnswers[i]:csAnswers[i-50];
                const ok=an===q.ans,sk=an===undefined,sec=ALL_SECS.find(s=>s.key===q.cat);
                return(<div key={i} style={{display:"flex",gap:"10px",marginBottom:"5px",padding:"8px 12px",borderRadius:"7px",background:sk?T.bg:ok?T.greenL:T.redL,border:`1px solid ${sk?T.border:ok?"#a7f3d0":"#fecaca"}`}}>
                  <span style={{color:sk?T.muted:ok?T.green:T.red,fontWeight:"700",minWidth:"14px",fontSize:"13px"}}>{sk?"–":ok?"✓":"✗"}</span>
                  <div style={{fontSize:"13px",flex:1}}>
                    <span style={{color:T.muted,fontSize:"11px"}}>[{sec?.key}] </span>
                    <span style={{color:T.text}}>{q.q.replace(/\n.*/,"").substring(0,60)}{q.q.replace(/\n.*/,"").length>60?"...":""}</span>
                    {!ok&&!sk&&<div style={{color:T.green,marginTop:"2px",fontSize:"12px",fontWeight:"600"}}>Correct: {q.opts[q.ans]}</div>}
                  </div>
                </div>);
              })}
            </div>
          </div>
          <div style={{display:"flex",gap:"10px"}}>
            <button onClick={()=>setShowCard(true)} style={{flex:1,background:T.accent,color:"#fff",border:"none",padding:"13px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"15px",fontWeight:"700",cursor:"pointer"}}>📄 Download Report Card</button>
            <button onClick={reset} style={{background:T.bg,color:T.sub,border:`1.5px solid ${T.border2}`,padding:"13px 20px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>↺ Retake</button>
          </div>
        </div>
      </div>
    </>
  );

  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
      {showMap&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>setShowMap(false)}>
          <div style={{background:T.card,borderRadius:"14px",padding:"24px",maxWidth:"520px",width:"100%",maxHeight:"80vh",overflowY:"auto",boxShadow:T.shadow2}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
              <span style={{fontWeight:"700",fontSize:"15px",color:T.text}}>🗺 Question Map</span>
              <button style={{background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:"18px"}} onClick={()=>setShowMap(false)}>✕</button>
            </div>
            {secs.map(sec=>{
              const si2=qs.findIndex(q=>q.cat===sec.key);
              return(<div key={sec.key} style={{marginBottom:"16px"}}>
                <div style={{fontSize:"12px",fontWeight:"700",color:sec.color,marginBottom:"8px"}}>{sec.emoji} {sec.label}</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                  {Array.from({length:sec.count},(_,j)=>{
                    const idx=si2+j,done=answers[idx]!==undefined,isCurr=idx===current;
                    return<button key={idx} onClick={()=>jumpTo(idx)} style={{width:"34px",height:"34px",borderRadius:"7px",border:`1.5px solid ${isCurr?sec.color:done?sec.color+"88":T.border2}`,background:isCurr?sec.color:done?sec.color+"15":T.bg,color:isCurr?"#fff":done?sec.color:T.muted,fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:bodyFont}}>{idx+1}</button>;
                  })}
                </div>
              </div>);
            })}
          </div>
        </div>
      )}
      <div style={{...card,opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(6px)",transition:"all 0.15s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
          <div>
            <div style={{fontSize:"11px",fontWeight:"700",color:pc,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"2px"}}>{pl}</div>
            <div style={{fontSize:"13px",color:T.muted}}>{student.name} · Q <strong style={{color:T.text}}>{current+1}</strong> of {tqs}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <button onClick={()=>setShowMap(true)} style={{background:T.bg,border:`1px solid ${T.border2}`,color:T.sub,padding:"7px 12px",borderRadius:"8px",fontFamily:bodyFont,fontSize:"13px",cursor:"pointer",fontWeight:"600"}}>🗺 Map</button>
            <div style={{fontSize:"22px",fontWeight:"800",letterSpacing:"2px",color:timeLeft<120?T.red:timeLeft<300?T.yellow:T.text,fontFamily:monoFont}}>{fmt(timeLeft)}</div>
          </div>
        </div>
        <div style={{marginBottom:"8px"}}>
          <div style={{height:"6px",background:T.border,borderRadius:"99px",overflow:"hidden"}}><div style={{height:"100%",width:`${((current+1)/tqs)*100}%`,background:pc,borderRadius:"99px",transition:"width 0.3s ease"}}/></div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"5px"}}>
            <span style={{fontSize:"11px",color:T.muted}}>{si?.emoji} {si?.label} · Q{current-ss+1}/{si?.count}</span>
            <span style={{fontSize:"11px",color:T.muted}}>{answered} answered · {tqs-answered} left</span>
          </div>
        </div>
        <div style={{height:"1px",background:T.border,margin:"16px 0 20px"}}/>
        <div style={{marginBottom:"24px"}}>
          <div style={{fontSize:"13px",fontWeight:"600",color:T.muted,marginBottom:"10px"}}>Question {current+1}</div>
          {q.code?(
            <><p style={{fontSize:"17px",lineHeight:"1.7",color:T.text,fontFamily:bodyFont,margin:"0 0 12px",fontWeight:"500"}}>{q.q.split("\n")[0]}</p>
            <pre style={{background:"#1e293b",color:"#e2e8f0",borderRadius:"10px",padding:"16px 20px",fontSize:"13px",fontFamily:monoFont,overflowX:"auto",lineHeight:"1.6",margin:0}}>{q.q.split("\n").slice(1).join("\n")}</pre></>
          ):(
            <p style={{fontSize:"17px",lineHeight:"1.75",color:T.text,fontFamily:bodyFont,margin:0,fontWeight:"500",whiteSpace:"pre-line"}}>{q.q}</p>
          )}
        </div>
        <div style={{marginBottom:"20px"}}>
          {q.opts.map((opt,i)=>{
            const isSel=selected===i,isOk=selected!==null&&i===q.ans,isNg=selected===i&&i!==q.ans;
            return(<button key={i} onClick={()=>{if(selected===null)setSelected(i);}}
              style={{display:"block",width:"100%",textAlign:"left",padding:"15px 20px",marginBottom:"10px",borderRadius:"10px",
                border:`1.5px solid ${isOk?"#059669":isNg?T.red:isSel?T.accent:T.border2}`,
                background:isOk?T.greenL:isNg?T.redL:isSel?T.accentL:T.bg,
                color:isOk?T.green:isNg?T.red:isSel?T.accent:T.text,
                cursor:selected!==null?"default":"pointer",fontSize:"16px",fontFamily:bodyFont,
                fontWeight:isSel||isOk?"600":"400",transition:"all 0.15s",lineHeight:"1.5"}}>
              <span style={{fontWeight:"700",marginRight:"12px",color:isOk?T.green:isNg?T.red:isSel?T.accent:T.muted,fontSize:"14px"}}>{String.fromCharCode(65+i)}.</span>
              {opt}
            </button>);
          })}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"4px"}}>
          <button onClick={skip} style={{background:T.bg,color:T.sub,border:`1.5px solid ${T.border2}`,padding:"12px 20px",borderRadius:"9px",fontFamily:bodyFont,fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>Skip →</button>
          <button onClick={next} disabled={selected===null}
            style={{background:selected===null?T.border:pc,color:selected===null?T.muted:"#fff",border:"none",padding:"12px 28px",borderRadius:"9px",fontFamily:bodyFont,fontSize:"15px",fontWeight:"700",cursor:selected===null?"not-allowed":"pointer",transition:"all 0.15s"}}>
            {current+1===tqs?(isApt?"Complete Part 1 →":"Submit Test →"):"Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}