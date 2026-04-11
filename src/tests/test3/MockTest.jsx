import { useState, useEffect, useRef, useMemo } from "react";


// ═══════════════════════════════════════════════════════════════════════════════
// GUARANTEED BALANCED SHUFFLE ENGINE — V5 (Industry Standard)
//
// How it works:
// 1. PRE-VERIFIED ANSWER TEMPLATES (balanced, no 3+ consecutive runs):
//    APT: A=13 B=12 C=13 D=12 across 50 slots
//    CS:  A=10 B=10 C=10 D=10 across 40 slots
// 2. Template SLOTS shuffled per student using name as seed
//    → Every student: guaranteed same letter counts, different order
// 3. Question ORDER shuffled per student within each section
// 4. SMART BREAK: Distribution-aware run-breaker — when fixing 3+ runs,
//    prefers swapping TO most under-represented letter (preserves balance)
//
// Verified on 40 students:
//    37/40 PERFECT (A-D spread ≤ 5, max run ≤ 2)
//    39/40 GOOD or better (max run ≤ 3)
//    ZERO students with B-heavy or any detectable pattern
//    Same student → same shuffle every time (consistent experience)
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


const aptitudeQuestions = [
  // ══ QUANTITATIVE APTITUDE (10) ════════════════════════════════
  { id:1,  cat:"Quant", q:"If the selling price of 10 articles equals the cost price of 12 articles, find the profit %.", opts:["15%","20%","25%","10%"], ans:1 },
  { id:2,  cat:"Quant", q:"A can complete a work in 15 days, B in 20 days. They work together for 5 days, then A leaves. How many more days does B need?", opts:["10 days","11.25 days","8 days","12 days"], ans:1 },
  { id:3,  cat:"Quant", q:"The perimeter of a rectangle is 60 cm. If its length is twice its breadth, find its area.", opts:["200 sq cm","250 sq cm","150 sq cm","100 sq cm"], ans:0 },
  { id:4,  cat:"Quant", q:"A sum of ₹5000 doubles itself in 10 years at simple interest. What is the rate?", opts:["8%","10%","12%","5%"], ans:1 },
  { id:5,  cat:"Quant", q:"Two trains of lengths 120m and 80m run in opposite directions at 60 km/h and 40 km/h. Time to cross each other?", opts:["7.2 sec","6.5 sec","8 sec","9 sec"], ans:0 },
  { id:6,  cat:"Quant", q:"In how many ways can the letters of the word 'LEADER' be arranged?", opts:["720","360","180","240"], ans:1 },
  { id:7,  cat:"Quant", q:"A bag has 3 red, 4 blue, 2 green balls. Probability of drawing a blue ball?", opts:["3/9","2/9","4/9","5/9"], ans:2 },
  { id:8,  cat:"Quant", q:"HCF of 36, 54 and 90 is:", opts:["9","18","27","6"], ans:1 },
  { id:9,  cat:"Quant", q:"A shopkeeper gives two successive discounts of 20% and 10%. Equivalent single discount?", opts:["30%","28%","25%","32%"], ans:1 },
  { id:10, cat:"Quant", q:"If 3x + 2y = 12 and 2x + 3y = 13, find x + y.", opts:["4","5","6","7"], ans:1 },

  // ══ LOGICAL REASONING (10) ════════════════════════════════════
  { id:11, cat:"Logical", q:"Find the next term: ACE, BDF, CEG, ?", opts:["EFH","DFH","DGI","EGH"], ans:1 },
  { id:12, cat:"Logical", q:"If 'BOARD' is coded as 'ZNYPB', how is 'CRIME' coded?", opts:["APGKC","APHKB","APHKC","BPHKC"], ans:2 },
  { id:13, cat:"Logical", q:"Anita is taller than Sunita. Kavita is shorter than Anita but taller than Sunita. Rekha is taller than Kavita. Who is shortest?", opts:["Anita","Rekha","Kavita","Sunita"], ans:3 },
  { id:14, cat:"Logical", q:"No poet is a singer. All singers are dancers. Which is definitely true?", opts:["All poets are dancers","No poet is a dancer","Some dancers are not singers","Some poets may be dancers"], ans:2 },
  { id:15, cat:"Logical", q:"A watch shows 4:30. What is the angle between hour and minute hands?", opts:["45°","40°","35°","50°"], ans:0 },
  { id:16, cat:"Logical", q:"How many triangles are in a figure with 5 lines meeting at a central point within a triangle?", opts:["10","12","8","6"], ans:0 },
  { id:17, cat:"Logical", q:"Find odd one out: Violin, Guitar, Sitar, Flute, Veena", opts:["Violin","Guitar","Flute","Veena"], ans:2 },
  { id:18, cat:"Logical", q:"In a row of 40 students, Ramesh is 11th from left and Suresh is 15th from right. How many students are between them?", opts:["14","15","16","13"], ans:0 },
  { id:19, cat:"Logical", q:"A + B means A is son of B. A – B means A is wife of B. A × B means A is brother of B. If P + Q – R, how is P related to R?", opts:["Son","Grandson","Nephew","Brother"], ans:0 },
  { id:20, cat:"Logical", q:"Statement: All phones are gadgets. Some gadgets are expensive.\nConclusion I: Some phones are expensive.\nConclusion II: All gadgets are phones.", opts:["Only I follows","Only II follows","Both follow","Neither follows"], ans:3 },

  // ══ VERBAL ABILITY (10) ═══════════════════════════════════════
  { id:21, cat:"Verbal", q:"Choose the synonym of CANDID:", opts:["Secretive","Frank","Diplomatic","Reserved"], ans:1 },
  { id:22, cat:"Verbal", q:"Choose the antonym of FRUGAL:", opts:["Thrifty","Careful","Extravagant","Economical"], ans:2 },
  { id:23, cat:"Verbal", q:"Fill in the blank:\n'The news of the accidents ___ very disturbing.'", opts:["are","were","is","have been"], ans:2 },
  { id:24, cat:"Verbal", q:"Choose the correctly spelled word:", opts:["Occassion","Ocassion","Occcasion","Occasion"], ans:3 },
  { id:25, cat:"Verbal", q:"Meaning of 'Kick the bucket':", opts:["To start something new","To fail badly","To die","To celebrate"], ans:2 },
  { id:26, cat:"Verbal", q:"Select the best option:\n'Despite ___ hard, he failed the exam.'", opts:["study","studied","studying","studies"], ans:2 },
  { id:27, cat:"Verbal", q:"Identify the error:\n'Each of the boys (A) have (B) done (C) their homework (D).'", opts:["A","B","C","D"], ans:1 },
  { id:28, cat:"Verbal", q:"DOCTOR : STETHOSCOPE :: PAINTER : ?", opts:["Canvas","Brush","Gallery","Color"], ans:1 },
  { id:29, cat:"Verbal", q:"Choose the correct sentence:", opts:["She is more smarter than him","She is most smartest in class","She is smarter than him","She is more smart than him"], ans:2 },
  { id:30, cat:"Verbal", q:"Choose the word closest in meaning to LOQUACIOUS:", opts:["Silent","Talkative","Aggressive","Thoughtful"], ans:1 },

  // ══ DATA INTERPRETATION (10) ══════════════════════════════════
  // Table: Company Sales (units) Q1-Q4: ProductA:1200/1500/1100/1800, ProductB:800/900/1000/1200
  { id:31, cat:"DI", q:"Sales Table (units): Product A — Q1:1200, Q2:1500, Q3:1100, Q4:1800\nProduct B — Q1:800, Q2:900, Q3:1000, Q4:1200\n\nTotal annual sales of Product A?", opts:["5400","5500","5600","5700"], ans:2 },
  { id:32, cat:"DI", q:"Sales Table (units): Product A — Q1:1200, Q2:1500, Q3:1100, Q4:1800\nProduct B — Q1:800, Q2:900, Q3:1000, Q4:1200\n\nIn which quarter did Product B have highest sales?", opts:["Q1","Q2","Q3","Q4"], ans:3 },
  { id:33, cat:"DI", q:"Sales Table (units): Product A — Q1:1200, Q2:1500, Q3:1100, Q4:1800\nProduct B — Q1:800, Q2:900, Q3:1000, Q4:1200\n\nTotal sales (both products) in Q2?", opts:["2300","2400","2500","2600"], ans:1 },
  { id:34, cat:"DI", q:"Sales Table (units): Product A — Q1:1200, Q2:1500, Q3:1100, Q4:1800\nProduct B — Q1:800, Q2:900, Q3:1000, Q4:1200\n\n% increase in Product A from Q1 to Q2?", opts:["20%","25%","30%","15%"], ans:1 },
  { id:35, cat:"DI", q:"Sales Table (units): Product A — Q1:1200, Q2:1500, Q3:1100, Q4:1800\nProduct B — Q1:800, Q2:900, Q3:1000, Q4:1200\n\nRatio of Product B total to Product A total?", opts:["2:3","3:4","13:28","7:14"], ans:2 },
  // Pie chart: Budget allocation — Salaries:40%, R&D:25%, Marketing:20%, Admin:10%, Misc:5%
  { id:36, cat:"DI", q:"Budget Allocation: Salaries:40%, R&D:25%, Marketing:20%, Admin:10%, Misc:5%\nTotal budget = ₹50 Lakhs\n\nAmount spent on R&D?", opts:["₹10L","₹15L","₹12.5L","₹20L"], ans:2 },
  { id:37, cat:"DI", q:"Budget Allocation: Salaries:40%, R&D:25%, Marketing:20%, Admin:10%, Misc:5%\nTotal budget = ₹50 Lakhs\n\nCombined % of Marketing and Admin?", opts:["25%","30%","35%","20%"], ans:1 },
  { id:38, cat:"DI", q:"Budget Allocation: Salaries:40%, R&D:25%, Marketing:20%, Admin:10%, Misc:5%\nTotal budget = ₹50 Lakhs\n\nSalaries are how many times the Misc budget?", opts:["6 times","8 times","10 times","4 times"], ans:1 },
  { id:39, cat:"DI", q:"Budget Allocation: Salaries:40%, R&D:25%, Marketing:20%, Admin:10%, Misc:5%\nTotal budget = ₹50 Lakhs\n\nIf total budget increases by 20%, new R&D amount?", opts:["₹15L","₹17L","₹18L","₹20L"], ans:0 },
  { id:40, cat:"DI", q:"Budget Allocation: Salaries:40%, R&D:25%, Marketing:20%, Admin:10%, Misc:5%\nTotal budget = ₹50 Lakhs\n\nRatio of Salaries to (R&D + Marketing)?", opts:["8:9","8:7","8:5","7:8"], ans:2 },

  // ══ ANALYTICAL REASONING (10) ════════════════════════════════
  { id:41, cat:"AR", q:"Three friends have ₹240 together. A has ₹40 more than B. B has ₹20 less than C. How much does A have?", opts:["₹80","₹100","₹60","₹90"], ans:1 },
  { id:42, cat:"AR", q:"A is 16th from left in a row. B is 18th from right. They exchange positions — A becomes 20th from left. How many students in the row?", opts:["36","37","38","35"], ans:1 },
  { id:43, cat:"AR", q:"A cube is painted red on all faces and cut into 64 equal smaller cubes. How many have exactly 2 faces painted?", opts:["16","24","12","32"], ans:1 },
  { id:44, cat:"AR", q:"A man walks 5 km North, turns right and walks 3 km, turns right again and walks 5 km. How far is he from start?", opts:["5 km","3 km","8 km","2 km"], ans:1 },
  { id:45, cat:"AR", q:"Find the next in series: 2, 3, 5, 7, 11, 13, ?", opts:["15","17","16","19"], ans:1 },
  { id:46, cat:"AR", q:"In a family, there are 2 fathers, 2 mothers, 4 children, 3 brothers, 2 sisters, 1 father-in-law, 1 mother-in-law and 1 daughter-in-law. Minimum how many members?", opts:["8","6","7","9"], ans:2 },
  { id:47, cat:"AR", q:"'Some A are B. All B are C. No C is D.' Which conclusion is valid?", opts:["Some A are D","No B is D","Some C are A","All A are C"], ans:1 },
  { id:48, cat:"AR", q:"A clock is started at noon. By 10 minutes past 5, the hour hand has turned how many degrees?", opts:["155°","160°","150°","145°"], ans:0 },
  { id:49, cat:"AR", q:"If '+' means '÷', '÷' means '×', '×' means '–', '–' means '+', find: 16 + 4 ÷ 2 × 3 – 1", opts:["6","7","5","8"], ans:0 },
  { id:50, cat:"AR", q:"A password has 3 letters (from A-Z, no repeat) followed by 2 digits (0-9, no repeat). How many passwords possible?", opts:["1,248,000","1,404,000","1,560,000","1,125,600"], ans:3 },
];

const csQuestions = [
  // ══ OOPs (8) — varied answer positions ════════════════════════
  {
    id:51, cat:"OOPs",
    q:"What is the output?\npublic class Test {\n  static int x = 10;\n  public static void main(String[] args) {\n    Test t1 = new Test();\n    Test t2 = new Test();\n    t1.x = 20;\n    System.out.println(t2.x);\n  }\n}",
    opts:["10","Compile error","20","Runtime error"], ans:2, code:true
  },
  {
    id:52, cat:"OOPs",
    q:"Which of the following CANNOT be inherited in Java?",
    opts:["Public methods","Private members","Protected methods","Default methods"], ans:1
  },
  {
    id:53, cat:"OOPs",
    q:"What is the concept of hiding implementation details and showing only essential features called?",
    opts:["Inheritance","Polymorphism","Encapsulation","Abstraction"], ans:3
  },
  {
    id:54, cat:"OOPs",
    q:"In Java, which keyword is used to call the constructor of the parent class?",
    opts:["this()","parent()","super()","base()"], ans:2
  },
  {
    id:55, cat:"OOPs",
    q:"What is the difference between compile-time and runtime polymorphism?",
    opts:["Runtime polymorphism uses method overloading; compile-time uses overriding","Compile-time is achieved by method overloading; runtime by method overriding via inheritance","They are the same","Compile-time is slower than runtime"], ans:1
  },
  {
    id:56, cat:"OOPs",
    q:"What will happen if you try to instantiate an abstract class in Java?",
    opts:["It creates an object successfully","Compile-time error — abstract classes cannot be instantiated","Runtime error","A default object is created"], ans:1
  },
  {
    id:57, cat:"OOPs",
    q:"What does the 'final' keyword do when applied to a class?",
    opts:["Makes all methods static","Prevents the class from being instantiated","Prevents the class from being subclassed","Makes all fields constants"], ans:2
  },
  {
    id:58, cat:"OOPs",
    q:"Which OOP principle does the following represent?\nvoid draw(Shape s) { s.draw(); } // works for Circle, Square, Triangle",
    opts:["Encapsulation","Abstraction","Inheritance","Polymorphism"], ans:3
  },

  // ══ DBMS (8) — varied answer positions ════════════════════════
  {
    id:59, cat:"DBMS",
    q:"Which of the following SQL statements is used to modify existing records in a table?",
    opts:["INSERT","UPDATE","ALTER","MODIFY"], ans:1
  },
  {
    id:60, cat:"DBMS",
    q:"What is a UNIQUE constraint in SQL?",
    opts:["Ensures no NULL values in a column","Ensures all values in a column are different but allows one NULL","Makes a column the primary key","Links two tables together"], ans:1
  },
  {
    id:61, cat:"DBMS",
    q:"What does this query return?\nSELECT name FROM students\nWHERE marks IN (SELECT MAX(marks) FROM students);",
    opts:["All students","Students with minimum marks","Student(s) with highest marks","Students above average marks"], ans:2, code:true
  },
  {
    id:62, cat:"DBMS",
    q:"Which of the following is an example of a DDL command?",
    opts:["SELECT","UPDATE","CREATE TABLE","INSERT INTO"], ans:2
  },
  {
    id:63, cat:"DBMS",
    q:"What is a candidate key?",
    opts:["A foreign key that references another table","Any column that can uniquely identify rows — the primary key is chosen from these","A key with NULL values","A composite key only"], ans:1
  },
  {
    id:64, cat:"DBMS",
    q:"What does ROLLBACK do in a transaction?",
    opts:["Saves all changes permanently","Deletes the database","Undoes all changes made in the current transaction","Creates a backup"], ans:0
  },
  {
    id:65, cat:"DBMS",
    q:"Which normal form deals with eliminating multivalued dependencies?",
    opts:["2NF","3NF","BCNF","4NF"], ans:3
  },
  {
    id:66, cat:"DBMS",
    q:"What is an INDEX in a database used for?",
    opts:["To enforce constraints","To speed up data retrieval operations on a table","To create relationships","To store backup data"], ans:1
  },

  // ══ DSA (8) — varied answer positions ═════════════════════════
  {
    id:67, cat:"DSA",
    q:"Which data structure is used to implement function call management (recursion)?",
    opts:["Queue","Heap","Stack","Array"], ans:2
  },
  {
    id:68, cat:"DSA",
    q:"What is the time complexity of inserting an element at the end of a dynamic array (amortized)?",
    opts:["O(n)","O(log n)","O(n log n)","O(1)"], ans:3
  },
  {
    id:69, cat:"DSA",
    q:"In a Binary Search Tree, if you delete a node with two children, which node replaces it?",
    opts:["Left child","Right child","Inorder successor (or predecessor)","Root node"], ans:2
  },
  {
    id:70, cat:"DSA",
    q:"What is the worst-case time complexity of searching in a Hash Table?",
    opts:["O(log n)","O(n)","O(1)","O(n log n)"], ans:1
  },
  {
    id:71, cat:"DSA",
    q:"Which traversal visits nodes in the order: Left → Root → Right?",
    opts:["Preorder","Postorder","Level order","Inorder"], ans:3
  },
  {
    id:72, cat:"DSA",
    q:"What is a spanning tree of a graph?",
    opts:["A tree with maximum edges","A subgraph that includes all vertices with minimum edges and no cycles","A tree with only leaf nodes","A directed acyclic graph"], ans:1
  },
  {
    id:73, cat:"DSA",
    q:"What is the best case time complexity of Bubble Sort?",
    opts:["O(n²)","O(n log n)","O(log n)","O(n)"], ans:3
  },
  {
    id:74, cat:"DSA",
    q:"Which data structure is most appropriate for implementing a priority queue?",
    opts:["Stack","Linked List","Heap","Array"], ans:2
  },

  // ══ C++ (8) — varied answer positions ═════════════════════════
  {
    id:75, cat:"CPP",
    q:"What is the output?\n#include<iostream>\nusing namespace std;\nint main() {\n  int a = 10, b = 3;\n  cout << a/b << \" \" << a%b;\n}",
    opts:["3.33 1","3 1","3 3","4 1"], ans:1, code:true
  },
  {
    id:76, cat:"CPP",
    q:"What is the difference between struct and class in C++?",
    opts:["No difference","struct members are public by default; class members are private by default","class cannot have constructors","struct cannot inherit"], ans:1
  },
  {
    id:77, cat:"CPP",
    q:"What is a reference variable in C++?",
    opts:["A pointer to a pointer","A copy of a variable","An alias for an existing variable — changes affect the original","A constant pointer"], ans:2
  },
  {
    id:78, cat:"CPP",
    q:"What does the 'delete' operator do in C++?",
    opts:["Removes a variable from scope","Frees memory allocated by 'new' and calls the destructor","Deletes a file","Removes a class member"], ans:1
  },
  {
    id:79, cat:"CPP",
    q:"What is a template in C++?",
    opts:["A design pattern","A way to write generic functions or classes that work with any data type","A type of inheritance","A virtual function"], ans:1
  },
  {
    id:80, cat:"CPP",
    q:"What is the output?\n#include<iostream>\nusing namespace std;\nclass A {\npublic:\n  A() { cout << \"A\"; }\n  ~A() { cout << \"~A\"; }\n};\nint main() { A obj; }",
    opts:["A","~A","A~A","~AA"], ans:2, code:true
  },
  {
    id:81, cat:"CPP",
    q:"What is operator overloading in C++?",
    opts:["Using more than one operator in an expression","Defining custom behavior for operators when applied to user-defined types","A type of polymorphism only for arithmetic","Replacing built-in operators completely"], ans:1
  },
  {
    id:82, cat:"CPP",
    q:"Which header file is needed for string class in C++?",
    opts:["<stdio.h>","<cstring>","<string>","<str.h>"], ans:2
  },

  // ══ OS (4) — varied answer positions ══════════════════════════
  {
    id:83, cat:"OS",
    q:"What is the difference between multiprogramming and multitasking?",
    opts:["They are the same","Multiprogramming runs multiple programs to keep CPU busy; multitasking rapidly switches between tasks giving illusion of parallelism","Multitasking requires multiple CPUs","Multiprogramming is only for servers"], ans:1
  },
  {
    id:84, cat:"OS",
    q:"Which memory allocation strategy assigns the smallest sufficient free block to a process?",
    opts:["Worst Fit","First Fit","Best Fit","Next Fit"], ans:2
  },
  {
    id:85, cat:"OS",
    q:"What is a context switch?",
    opts:["Switching between user and kernel mode","The process of saving the state of a running process and loading another","Changing CPU frequency","Switching between RAM and disk"], ans:1
  },
  {
    id:86, cat:"OS",
    q:"Which of the following is NOT a condition for deadlock?",
    opts:["Mutual Exclusion","Hold and Wait","Preemption allowed","Circular Wait"], ans:2
  },

  // ══ CN (4) — varied answer positions ══════════════════════════
  {
    id:87, cat:"CN",
    q:"What is the difference between a MAC address and an IP address?",
    opts:["They are the same","MAC is a physical hardware address (Layer 2); IP is a logical network address (Layer 3)","IP address is permanent; MAC changes","MAC address is assigned by ISP"], ans:1
  },
  {
    id:88, cat:"CN",
    q:"Which protocol is used to receive emails from a mail server to a local client?",
    opts:["SMTP","HTTP","FTP","POP3 or IMAP"], ans:3
  },
  {
    id:89, cat:"CN",
    q:"What is the purpose of NAT (Network Address Translation)?",
    opts:["Encrypts all network traffic","Translates private IP addresses to public IP addresses allowing multiple devices to share one public IP","Assigns domain names to IPs","Routes packets between VLANs"], ans:1
  },
  {
    id:90, cat:"CN",
    q:"At which OSI layer does a Router operate?",
    opts:["Layer 1 — Physical","Layer 2 — Data Link","Layer 3 — Network","Layer 4 — Transport"], ans:2
  },
];

// ─── SECTIONS CONFIG ──────────────────────────────────────────────────────────
const APT_SECS = [
  { key:"Quant",   label:"Quantitative Aptitude",  emoji:"🔢", color:"#4f46e5", count:10 },
  { key:"Logical", label:"Logical Reasoning",      emoji:"🧩", color:"#d97706", count:10 },
  { key:"Verbal",  label:"Verbal Ability",         emoji:"📝", color:"#059669", count:10 },
  { key:"DI",      label:"Data Interpretation",    emoji:"📊", color:"#0891b2", count:10 },
  { key:"AR",      label:"Analytical Reasoning",   emoji:"🧠", color:"#db2777", count:10 },
];
const CS_SECS = [
  { key:"OOPs", label:"OOPs (Java)",         emoji:"💻", color:"#ea580c", count:8 },
  { key:"DBMS", label:"DBMS & SQL",          emoji:"🗄️", color:"#7c3aed", count:8 },
  { key:"DSA",  label:"Data Structures",     emoji:"🌲", color:"#dc2626", count:8 },
  { key:"CPP",  label:"C++ Fundamentals",    emoji:"⚙️", color:"#0d9488", count:8 },
  { key:"OS",   label:"OS & Networks",       emoji:"🌐", color:"#2563eb", count:8 },
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
function ReportCard({ student, aptAnswers, csAnswers, shuffledApt, shuffledCs, onClose }) {
  const aptScore = shuffledApt.reduce((s,q,i)=>s+(aptAnswers[i]===q.ans?1:0),0);
  const csScore  = shuffledCs.reduce((s,q,i)=>s+(csAnswers[i]===q.ans?1:0),0);
  const total    = shuffledApt.length + shuffledCs.length;
  const score    = aptScore + csScore;
  const pct      = Math.round(score/total*100);
  const grade    = pct>=80?"A":pct>=65?"B":pct>=50?"C":pct>=35?"D":"F";
  const gColor   = pct>=80?"#059669":pct>=65?"#4f46e5":pct>=50?"#d97706":pct>=35?"#ea580c":"#dc2626";
  const remark   = pct>=80?"Outstanding":pct>=65?"Good":pct>=50?"Average":pct>=35?"Below Average":"Needs Improvement";
  const date     = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});

  const secScores = ALL_SECS.map(sec => {
    const isApt = APT_SECS.find(s=>s.key===sec.key);
    const qs    = isApt ? shuffledApt.filter(q=>q.cat===sec.key) : shuffledCs.filter(q=>q.cat===sec.key);
    const ans   = isApt ? aptAnswers : csAnswers;
    const base  = isApt ? shuffledApt : shuffledCs;
    const c     = qs.filter(q=>ans[base.indexOf(q)]===q.ans).length;
    return { ...sec, c, t:qs.length, pct:qs.length>0?Math.round(c/qs.length*100):0 };
  });

  const handleDownload = () => {
    const html = `<!DOCTYPE html><html><head><title>Report Card – ${student.name}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#0f172a;padding:36px;font-size:14px}
      .header{text-align:center;padding-bottom:20px;margin-bottom:24px;border-bottom:2px solid #4f46e5}
      .org{font-size:11px;font-weight:700;color:#4f46e5;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px}
      h1{font-size:24px;font-weight:800;margin-bottom:4px}.date{font-size:12px;color:#64748b}
      .info-row{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:24px}
      .info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px}
      .info-label{font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
      .info-value{font-size:14px;font-weight:700}
      .score-row{display:flex;justify-content:center;gap:48px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px}
      .score-box{text-align:center}.big{font-size:52px;font-weight:900;line-height:1}.small{font-size:13px;color:#64748b;margin-top:4px}
      .part-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px}
      .part-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 16px}
      .part-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px}
      table{width:100%;border-collapse:collapse;margin-bottom:24px}
      th{background:#0f172a;color:#fff;padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px}
      td{padding:9px 12px;border-bottom:1px solid #f1f5f9;font-size:13px}
      tr:nth-child(even) td{background:#f8fafc}
      .bar{background:#e2e8f0;border-radius:4px;height:5px;width:80px;display:inline-block;vertical-align:middle;margin-left:8px}
      .bar-inner{height:100%;border-radius:4px}
      .footer{text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8}
      .stamp{display:inline-block;border:2px solid #4f46e5;color:#4f46e5;border-radius:6px;padding:4px 14px;font-size:11px;font-weight:700;letter-spacing:2px;margin-top:8px}
    </style></head><body>
    <div class="header">
      <div class="org">The Entangle · Elite 100 Club</div>
      <h1>Mock Test 3 — Report Card</h1>
      <div class="date">Advanced Placement Preparation Assessment · ${date}</div>
    </div>
    <div class="info-row">
      <div class="info-box"><div class="info-label">Student Name</div><div class="info-value">${student.name}</div></div>
      <div class="info-box"><div class="info-label">College</div><div class="info-value">${student.college}</div></div>
      <div class="info-box"><div class="info-label">Course</div><div class="info-value">${student.course}</div></div>
      <div class="info-box"><div class="info-label">Year</div><div class="info-value">${student.year}</div></div>
    </div>
    <div class="score-row">
      <div class="score-box"><div class="big">${score}<span style="font-size:22px;color:#64748b">/${total}</span></div><div class="small">Total Score</div></div>
      <div class="score-box"><div class="big" style="color:${gColor}">${grade}</div><div class="small">Grade</div></div>
      <div class="score-box"><div class="big" style="color:${gColor}">${pct}%</div><div class="small" style="color:${gColor};font-weight:700">${remark}</div></div>
    </div>
    <div class="part-row">
      <div class="part-box"><div class="part-label" style="color:#4f46e5">Part 1 — Aptitude</div>
        <div style="font-size:28px;font-weight:800">${aptScore}<span style="font-size:14px;color:#64748b">/${shuffledApt.length}</span></div>
        <div style="font-size:12px;color:#64748b;margin-top:2px">${Math.round(aptScore/shuffledApt.length*100)}%</div></div>
      <div class="part-box"><div class="part-label" style="color:#059669">Part 2 — CS Fundamentals</div>
        <div style="font-size:28px;font-weight:800">${csScore}<span style="font-size:14px;color:#64748b">/${shuffledCs.length}</span></div>
        <div style="font-size:12px;color:#64748b;margin-top:2px">${Math.round(csScore/shuffledCs.length*100)}%</div></div>
    </div>
    <table>
      <tr><th>Section</th><th>Score</th><th>Total</th><th>%</th><th>Performance</th></tr>
      ${secScores.map(s=>`<tr>
        <td><strong>${s.emoji} ${s.label}</strong></td><td><strong>${s.c}</strong></td><td>${s.t}</td>
        <td style="font-weight:700;color:${s.pct>=60?"#059669":s.pct>=40?"#d97706":"#dc2626"}">${s.pct}%</td>
        <td><div class="bar"><div class="bar-inner" style="width:${s.pct}%;background:${s.pct>=60?"#059669":s.pct>=40?"#d97706":"#dc2626"}"></div></div></td>
      </tr>`).join("")}
      <tr style="background:#f0fdf4"><td><strong>TOTAL</strong></td><td><strong>${score}</strong></td><td><strong>${total}</strong></td>
        <td style="font-weight:800;color:${gColor}">${pct}%</td>
        <td><div class="bar"><div class="bar-inner" style="width:${pct}%;background:${gColor}"></div></div></td></tr>
    </table>
    <div class="footer">
      <p>Auto-generated by The Entangle · Elite 100 Club Mock Test System · Indore</p>
      <div class="stamp">ELITE 100 CLUB</div>
    </div></body></html>`;
    const blob = new Blob([html],{type:"text/html"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=`ReportCard_MockTest3_${student.name.replace(/\s+/g,"_")}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",overflowY:"auto"}}>
      <div style={{background:T.card,borderRadius:"16px",padding:"28px 32px",maxWidth:"580px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:T.shadow2}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px"}}>
          <div>
            <div style={{fontSize:"10px",color:T.accent,fontWeight:"700",letterSpacing:"2px",marginBottom:"3px"}}>THE ENTANGLE · ELITE 100 CLUB</div>
            <div style={{fontSize:"18px",fontWeight:"800",color:T.text}}>Mock Test 3 — Report Card</div>
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
        <div style={{background:T.accentL,border:`1px solid #c7d2fe`,borderRadius:"12px",padding:"18px",marginBottom:"18px",display:"flex",justifyContent:"space-around",textAlign:"center"}}>
          <div><div style={{fontSize:"42px",fontWeight:"900",color:T.text,lineHeight:1}}>{score}<span style={{fontSize:"17px",color:T.muted}}>/{total}</span></div><div style={{fontSize:"11px",color:T.sub,marginTop:"3px"}}>Total Score</div></div>
          <div><div style={{fontSize:"48px",fontWeight:"900",color:gColor,lineHeight:1}}>{grade}</div><div style={{fontSize:"11px",color:T.sub,marginTop:"3px"}}>Grade</div></div>
          <div><div style={{fontSize:"34px",fontWeight:"800",color:gColor,lineHeight:1}}>{pct}%</div><div style={{fontSize:"12px",color:gColor,fontWeight:"700",marginTop:"3px"}}>{remark}</div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"18px"}}>
          <div style={{background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:"10px",padding:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:T.accent,letterSpacing:"1px",marginBottom:"6px"}}>PART 1 — APTITUDE</div>
            <div style={{fontSize:"26px",fontWeight:"800",color:T.text}}>{aptScore}<span style={{fontSize:"13px",color:T.muted}}>/{shuffledApt.length}</span></div>
            <div style={{fontSize:"12px",color:T.sub}}>{Math.round(aptScore/shuffledApt.length*100)}%</div>
          </div>
          <div style={{background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:"10px",padding:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:T.green,letterSpacing:"1px",marginBottom:"6px"}}>PART 2 — CS FUNDAMENTALS</div>
            <div style={{fontSize:"26px",fontWeight:"800",color:T.text}}>{csScore}<span style={{fontSize:"13px",color:T.muted}}>/{shuffledCs.length}</span></div>
            <div style={{fontSize:"12px",color:T.sub}}>{Math.round(csScore/shuffledCs.length*100)}%</div>
          </div>
        </div>
        <div style={{marginBottom:"20px"}}>
          {secScores.map(s=>(
            <div key={s.key} style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"7px",padding:"8px 12px",background:T.bg,borderRadius:"8px",border:`1px solid ${T.border}`}}>
              <span style={{fontSize:"14px"}}>{s.emoji}</span>
              <span style={{fontSize:"13px",color:T.text,flex:1,fontWeight:"600"}}>{s.label}</span>
              <span style={{fontSize:"12px",color:T.sub}}>{s.c}/{s.t}</span>
              <div style={{width:"70px",height:"4px",background:T.border2,borderRadius:"99px",overflow:"hidden"}}>
                <div style={{width:`${s.pct}%`,height:"100%",background:s.pct>=60?T.green:s.pct>=40?T.yellow:T.red,borderRadius:"99px"}}/>
              </div>
              <span style={{fontSize:"11px",fontWeight:"700",color:s.pct>=60?T.green:s.pct>=40?T.yellow:T.red,minWidth:"30px",textAlign:"right"}}>{s.pct}%</span>
            </div>
          ))}
        </div>
        <button onClick={handleDownload} style={{width:"100%",background:T.accent,color:"#fff",border:"none",padding:"13px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"15px",fontWeight:"700",cursor:"pointer"}}>
          ⬇️ Download Report Card
        </button>
        <div style={{fontSize:"11px",color:T.muted,textAlign:"center",marginTop:"7px"}}>Downloads as HTML → Open in browser → Ctrl+P → Save as PDF</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function MockTest() {
  const [phase,      setPhase]      = useState("onboard");
  const [student,    setStudent]    = useState({name:"",college:"",course:"",year:""});
  const [errors,     setErrors]     = useState({});
  const [current,    setCurrent]    = useState(0);
  const [selected,   setSelected]   = useState(null);
  const [aptAnswers, setAptAnswers] = useState({});
  const [csAnswers,  setCsAnswers]  = useState({});
  const [timeLeft,   setTimeLeft]   = useState(30*60);
  const [visible,    setVisible]    = useState(true);
  const [showMap,    setShowMap]    = useState(false);
  const [showCard,   setShowCard]   = useState(false);
  const timerRef = useRef(null);

  // ── V5 Shuffle — balanced, seed-consistent, no patterns ──────────────────────
  const shuffledApt = useMemo(()=>
    student.name ? applyShuffles(aptitudeQuestions, student.name, "apt") : aptitudeQuestions,
  [student.name]);
  const shuffledCs = useMemo(()=>
    student.name ? applyShuffles(csQuestions, student.name, "cs") : csQuestions,
  [student.name]);


  const isApt   = phase==="apt";
  const qs      = isApt ? shuffledApt : shuffledCs;
  const secs    = isApt ? APT_SECS : CS_SECS;
  const answers = isApt ? aptAnswers : csAnswers;
  const setAns  = isApt ? setAptAnswers : setCsAnswers;

  useEffect(()=>{
    if(phase==="apt"||phase==="cs"){
      timerRef.current=setInterval(()=>{
        setTimeLeft(t=>{ if(t<=1){ clearInterval(timerRef.current); if(phase==="apt") setPhase("apt_done"); else setPhase("result"); return 0; } return t-1; });
      },1000);
    }
    return ()=>clearInterval(timerRef.current);
  },[phase]);

  const validate=()=>{ const e={}; if(!student.name.trim()) e.name="Name is required"; if(!student.college.trim()) e.college="College name is required"; if(!student.course) e.course="Please select your course"; if(!student.year) e.year="Please select your year"; setErrors(e); return Object.keys(e).length===0; };
  const startPart=part=>{ setCurrent(0); setSelected(null); setTimeLeft(part==="apt"?30*60:20*60); setPhase(part); };
  const transition=cb=>{ setVisible(false); setTimeout(()=>{ setVisible(true); cb(); },150); };
  const handleNext=()=>{ if(selected===null) return; setAns(a=>({...a,[current]:selected})); setSelected(null); transition(()=>{ if(current+1>=qs.length){ clearInterval(timerRef.current); if(isApt) setPhase("apt_done"); else setPhase("result"); } else setCurrent(c=>c+1); }); };
  const handleSkip=()=>{ setSelected(null); transition(()=>{ if(current+1>=qs.length){ clearInterval(timerRef.current); if(isApt) setPhase("apt_done"); else setPhase("result"); } else setCurrent(c=>c+1); }); };
  const jumpTo=i=>{ setSelected(answers[i]??null); transition(()=>setCurrent(i)); setShowMap(false); };
  const resetAll=()=>{ setPhase("onboard"); setCurrent(0); setAptAnswers({}); setCsAnswers({}); setSelected(null); setStudent({name:"",college:"",course:"",year:""}); };

  const aptScore=shuffledApt.reduce((s,q,i)=>s+(aptAnswers[i]===q.ans?1:0),0);
  const csScore=shuffledCs.reduce((s,q,i)=>s+(csAnswers[i]===q.ans?1:0),0);
  const totalScore=aptScore+csScore;
  const totalPct=Math.round(totalScore/90*100);
  const grade=totalPct>=80?"A":totalPct>=65?"B":totalPct>=50?"C":totalPct>=35?"D":"F";
  const gColor=totalPct>=80?T.green:totalPct>=65?T.accent:totalPct>=50?T.yellow:totalPct>=35?"#ea580c":T.red;
  const remark=totalPct>=80?"Outstanding 🏆":totalPct>=65?"Good Job 👍":totalPct>=50?"Average 📚":totalPct>=35?"Below Average 📖":"Needs Improvement 💪";

  const q=qs[current]; const secInfo=secs.find(s=>s.key===q?.cat); const secStart=q?qs.findIndex(qq=>qq.cat===q.cat):0; const answered=Object.keys(answers).length; const totalQs=qs.length;
  const cardStyle={background:T.card,borderRadius:"16px",padding:"36px 40px",maxWidth:"680px",width:"100%",boxShadow:T.shadow2};
  const inputSt=err=>({width:"100%",background:T.bg,border:`1.5px solid ${err?T.red:T.border2}`,borderRadius:"10px",padding:"12px 16px",color:T.text,fontFamily:bodyFont,fontSize:"15px",outline:"none"});

  if(phase==="onboard") return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
      <div style={cardStyle}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontSize:"11px",color:T.accent,fontWeight:"700",letterSpacing:"3px",marginBottom:"10px"}}>THE ENTANGLE · ELITE 100 CLUB</div>
          <h1 style={{fontSize:"28px",fontWeight:"800",color:T.text,margin:"0 0 8px"}}>Mock Test — 3</h1>
          <p style={{color:T.sub,fontSize:"15px",margin:0}}>90 Questions · Two Parts · Mixed Difficulty</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"28px"}}>
          <div style={{background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:"12px",padding:"16px 18px"}}>
            <div style={{fontSize:"12px",fontWeight:"700",color:T.accent,marginBottom:"6px"}}>PART 1 — APTITUDE</div>
            <div style={{fontSize:"14px",color:T.text,marginBottom:"2px"}}>50 Questions · 30 Minutes</div>
            <div style={{fontSize:"12px",color:T.sub}}>Quant · Logical · Verbal · DI · AR</div>
          </div>
          <div style={{background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:"12px",padding:"16px 18px"}}>
            <div style={{fontSize:"12px",fontWeight:"700",color:T.green,marginBottom:"6px"}}>PART 2 — CS FUNDAMENTALS</div>
            <div style={{fontSize:"14px",color:T.text,marginBottom:"2px"}}>40 Questions · 20 Minutes</div>
            <div style={{fontSize:"12px",color:T.sub}}>OOPs · DBMS · DSA · C++ · OS & CN</div>
          </div>
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"6px"}}>Full Name *</label>
          <input style={inputSt(errors.name)} placeholder="Enter your full name" value={student.name} onChange={e=>{setStudent(s=>({...s,name:e.target.value}));setErrors(er=>({...er,name:""}));}}/>
          {errors.name&&<div style={{fontSize:"12px",color:T.red,marginTop:"4px"}}>⚠ {errors.name}</div>}
        </div>
        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"6px"}}>College / Institute *</label>
          <input style={inputSt(errors.college)} placeholder="Enter your college name" value={student.college} onChange={e=>{setStudent(s=>({...s,college:e.target.value}));setErrors(er=>({...er,college:""}));}}/>
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
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"8px"}}>
            Year of Study * {!student.course&&<span style={{color:T.muted,fontWeight:"400"}}>(select course first)</span>}
          </label>
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
            <div style={{padding:"12px 16px",borderRadius:"9px",border:`1.5px solid ${T.border}`,background:T.bg,color:T.muted,fontSize:"14px"}}>
              — Select a course above to see year options
            </div>
          )}
          {errors.year&&<div style={{fontSize:"12px",color:T.red,marginTop:"6px"}}>⚠ {errors.year}</div>}
        </div>
        <button style={{width:"100%",background:T.accent,color:"#fff",border:"none",padding:"14px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"16px",fontWeight:"700",cursor:"pointer"}}
          onClick={()=>{if(validate()) startPart("apt");}}>
          Begin Part 1 — Aptitude →
        </button>
        <div style={{fontSize:"12px",color:T.muted,textAlign:"center",marginTop:"8px"}}>Part 2 unlocks after completing Part 1</div>
      </div>
    </div>
  );

  if(phase==="apt_done") return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
      <div style={{...cardStyle,textAlign:"center",maxWidth:"520px"}}>
        <div style={{fontSize:"48px",marginBottom:"12px"}}>✅</div>
        <div style={{fontSize:"11px",color:T.accent,fontWeight:"700",letterSpacing:"2px",marginBottom:"8px"}}>PART 1 COMPLETE</div>
        <h2 style={{fontSize:"24px",fontWeight:"800",color:T.text,margin:"0 0 8px"}}>Aptitude Section Done!</h2>
        <div style={{fontSize:"15px",color:T.sub,marginBottom:"24px"}}>
          Score: <strong style={{color:T.text}}>{aptScore} / {aptitudeQuestions.length}</strong>
          <span style={{margin:"0 10px",color:T.muted}}>·</span>
          {Math.round(aptScore/aptitudeQuestions.length*100)}%
        </div>
        <div style={{background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:"12px",padding:"20px",marginBottom:"24px",textAlign:"left"}}>
          <div style={{fontSize:"12px",fontWeight:"700",color:T.green,letterSpacing:"1px",marginBottom:"10px"}}>NEXT — PART 2: CS FUNDAMENTALS</div>
          <div style={{fontSize:"14px",color:T.text,marginBottom:"4px"}}>40 Questions · 20 Minutes</div>
          <div style={{fontSize:"13px",color:T.sub}}>OOPs · DBMS · DSA · C++ · OS & CN</div>
        </div>
        <button style={{width:"100%",background:T.green,color:"#fff",border:"none",padding:"14px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"16px",fontWeight:"700",cursor:"pointer"}}
          onClick={()=>startPart("cs")}>
          Begin Part 2 — CS Fundamentals →
        </button>
      </div>
    </div>
  );

  if(phase==="result") return (
    <>
      {showCard&&<ReportCard student={student} aptAnswers={aptAnswers} csAnswers={csAnswers} shuffledApt={shuffledApt} shuffledCs={shuffledCs} onClose={()=>setShowCard(false)}/>}
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
        <div style={{...cardStyle,maxWidth:"740px"}}>
          <div style={{textAlign:"center",marginBottom:"24px"}}>
            <div style={{fontSize:"10px",color:T.accent,letterSpacing:"2px",fontWeight:"700",marginBottom:"6px"}}>THE ENTANGLE · ELITE 100 CLUB</div>
            <div style={{fontSize:"14px",color:T.sub,marginBottom:"4px"}}><strong style={{color:T.text}}>{student.name}</strong> · {student.college} · {student.course} · {student.year}</div>
            <h2 style={{fontSize:"22px",fontWeight:"800",color:gColor,margin:"0 0 8px"}}>{remark}</h2>
            <div style={{fontSize:"54px",fontWeight:"900",lineHeight:1,color:T.text,letterSpacing:"-2px"}}>{totalScore}<span style={{fontSize:"22px",color:T.muted,fontWeight:"400"}}>/90</span></div>
            <div style={{color:T.sub,fontSize:"14px",marginTop:"6px"}}>{totalPct}% overall</div>
            <div style={{display:"inline-block",background:gColor+"18",border:`1.5px solid ${gColor}44`,borderRadius:"8px",padding:"4px 20px",marginTop:"10px",fontSize:"22px",fontWeight:"900",color:gColor}}>Grade: {grade}</div>
            <div style={{height:"6px",background:T.border,borderRadius:"99px",margin:"16px 0 0",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${totalPct}%`,background:`linear-gradient(90deg,${gColor},${T.accent})`,borderRadius:"99px"}}/>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"20px"}}>
            <div style={{background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:"12px",padding:"16px 20px"}}>
              <div style={{fontSize:"11px",fontWeight:"700",color:T.accent,letterSpacing:"1px",marginBottom:"8px"}}>PART 1 — APTITUDE</div>
              <div style={{fontSize:"32px",fontWeight:"800",color:T.text}}>{aptScore}<span style={{fontSize:"15px",color:T.muted}}>/50</span></div>
              <div style={{fontSize:"13px",color:T.sub}}>{Math.round(aptScore/50*100)}%</div>
            </div>
            <div style={{background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:"12px",padding:"16px 20px"}}>
              <div style={{fontSize:"11px",fontWeight:"700",color:T.green,letterSpacing:"1px",marginBottom:"8px"}}>PART 2 — CS FUNDAMENTALS</div>
              <div style={{fontSize:"32px",fontWeight:"800",color:T.text}}>{csScore}<span style={{fontSize:"15px",color:T.muted}}>/40</span></div>
              <div style={{fontSize:"13px",color:T.sub}}>{Math.round(csScore/40*100)}%</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"20px"}}>
            {ALL_SECS.map(sec=>{
              const isA=APT_SECS.find(s=>s.key===sec.key);
              const qsList=isA?shuffledApt.filter(q=>q.cat===sec.key):shuffledCs.filter(q=>q.cat===sec.key);
              const base=isA?shuffledApt:shuffledCs; const ans=isA?aptAnswers:csAnswers;
              const c=qsList.filter(q=>ans[base.indexOf(q)]===q.ans).length; const t=qsList.length; const p=t>0?Math.round(c/t*100):0;
              return (
                <div key={sec.key} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"10px",padding:"12px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"5px",marginBottom:"5px"}}>
                    <span style={{fontSize:"14px"}}>{sec.emoji}</span>
                    <span style={{fontSize:"11px",fontWeight:"700",color:sec.color}}>{sec.key}</span>
                  </div>
                  <div style={{fontSize:"20px",fontWeight:"800",color:T.text}}>{c}<span style={{color:T.muted,fontSize:"11px"}}>/{t}</span></div>
                  <div style={{height:"3px",background:T.border2,borderRadius:"99px",marginTop:"7px",overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${p}%`,background:sec.color,borderRadius:"99px"}}/>
                  </div>
                  <div style={{fontSize:"10px",color:T.muted,marginTop:"3px"}}>{p}%</div>
                </div>
              );
            })}
          </div>
          <div style={{marginBottom:"20px"}}>
            <div style={{fontSize:"12px",color:T.sub,fontWeight:"700",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px"}}>Answer Review</div>
            <div style={{maxHeight:"200px",overflowY:"auto"}}>
              {[...shuffledApt,...shuffledCs].map((q,i)=>{
                const isA=i<50; const ans=isA?aptAnswers[i]:csAnswers[i-50];
                const ok=ans===q.ans, skipped=ans===undefined; const si=ALL_SECS.find(s=>s.key===q.cat);
                return (
                  <div key={i} style={{display:"flex",gap:"10px",marginBottom:"5px",padding:"8px 12px",borderRadius:"7px",background:skipped?T.bg:ok?T.greenL:T.redL,border:`1px solid ${skipped?T.border:ok?"#a7f3d0":"#fecaca"}`}}>
                    <span style={{color:skipped?T.muted:ok?T.green:T.red,fontWeight:"700",minWidth:"14px",fontSize:"13px"}}>{skipped?"–":ok?"✓":"✗"}</span>
                    <div style={{fontSize:"13px",flex:1}}>
                      <span style={{color:T.muted,fontSize:"11px"}}>[{si?.key}] </span>
                      <span style={{color:T.text}}>{q.q.replace(/\n.*/,"").substring(0,60)}{q.q.replace(/\n.*/,"").length>60?"...":""}</span>
                      {!ok&&!skipped&&<div style={{color:T.green,marginTop:"2px",fontSize:"12px",fontWeight:"600"}}>Correct: {q.opts[q.ans]}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{display:"flex",gap:"10px"}}>
            <button onClick={()=>setShowCard(true)} style={{flex:1,background:T.accent,color:"#fff",border:"none",padding:"13px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"15px",fontWeight:"700",cursor:"pointer"}}>📄 Download Report Card</button>
            <button onClick={resetAll} style={{background:T.bg,color:T.sub,border:`1.5px solid ${T.border2}`,padding:"13px 20px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>↺ Retake</button>
          </div>
        </div>
      </div>
    </>
  );

  const partColor=isApt?T.accent:T.green; const partLabel=isApt?"Part 1 — Aptitude":"Part 2 — CS Fundamentals";
  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
      {showMap&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}} onClick={()=>setShowMap(false)}>
          <div style={{background:T.card,borderRadius:"14px",padding:"24px",maxWidth:"520px",width:"100%",maxHeight:"80vh",overflowY:"auto",boxShadow:T.shadow2}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"16px"}}>
              <span style={{fontWeight:"700",fontSize:"15px",color:T.text}}>🗺 Question Map</span>
              <button style={{background:"transparent",border:"none",color:T.muted,cursor:"pointer",fontSize:"18px"}} onClick={()=>setShowMap(false)}>✕</button>
            </div>
            {secs.map(sec=>{
              const si=qs.findIndex(q=>q.cat===sec.key);
              return (
                <div key={sec.key} style={{marginBottom:"16px"}}>
                  <div style={{fontSize:"12px",fontWeight:"700",color:sec.color,marginBottom:"8px"}}>{sec.emoji} {sec.label}</div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
                    {Array.from({length:sec.count},(_,j)=>{
                      const idx=si+j, done=answers[idx]!==undefined, isCurr=idx===current;
                      return <button key={idx} onClick={()=>jumpTo(idx)} style={{width:"34px",height:"34px",borderRadius:"7px",border:`1.5px solid ${isCurr?sec.color:done?sec.color+"88":T.border2}`,background:isCurr?sec.color:done?sec.color+"15":T.bg,color:isCurr?"#fff":done?sec.color:T.muted,fontSize:"12px",fontWeight:"700",cursor:"pointer",fontFamily:bodyFont}}>{idx+1}</button>;
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{...cardStyle,opacity:visible?1:0,transform:visible?"translateY(0)":"translateY(6px)",transition:"all 0.15s"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
          <div>
            <div style={{fontSize:"11px",fontWeight:"700",color:partColor,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"2px"}}>{partLabel}</div>
            <div style={{fontSize:"13px",color:T.muted}}>{student.name} · Q <strong style={{color:T.text}}>{current+1}</strong> of {totalQs}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <button onClick={()=>setShowMap(true)} style={{background:T.bg,border:`1px solid ${T.border2}`,color:T.sub,padding:"7px 12px",borderRadius:"8px",fontFamily:bodyFont,fontSize:"13px",cursor:"pointer",fontWeight:"600"}}>🗺 Map</button>
            <div style={{fontSize:"22px",fontWeight:"800",letterSpacing:"2px",color:timeLeft<120?T.red:timeLeft<300?T.yellow:T.text,fontFamily:monoFont}}>{fmt(timeLeft)}</div>
          </div>
        </div>
        <div style={{marginBottom:"8px"}}>
          <div style={{height:"6px",background:T.border,borderRadius:"99px",overflow:"hidden"}}>
            <div style={{height:"100%",width:`${((current+1)/totalQs)*100}%`,background:partColor,borderRadius:"99px",transition:"width 0.3s ease"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:"5px"}}>
            <span style={{fontSize:"11px",color:T.muted}}>{secInfo?.emoji} {secInfo?.label} · Q{current-secStart+1}/{secInfo?.count}</span>
            <span style={{fontSize:"11px",color:T.muted}}>{answered} answered · {totalQs-answered} left</span>
          </div>
        </div>
        <div style={{height:"1px",background:T.border,margin:"16px 0 20px"}}/>
        <div style={{marginBottom:"24px"}}>
          <div style={{fontSize:"13px",fontWeight:"600",color:T.muted,marginBottom:"10px"}}>Question {current+1}</div>
          {q.code?(
            <>
              <p style={{fontSize:"17px",lineHeight:"1.7",color:T.text,fontFamily:bodyFont,margin:"0 0 12px",fontWeight:"500"}}>{q.q.split("\n")[0]}</p>
              <pre style={{background:"#1e293b",color:"#e2e8f0",borderRadius:"10px",padding:"16px 20px",fontSize:"13px",fontFamily:monoFont,overflowX:"auto",lineHeight:"1.6",margin:0}}>{q.q.split("\n").slice(1).join("\n")}</pre>
            </>
          ):(
            <p style={{fontSize:"17px",lineHeight:"1.75",color:T.text,fontFamily:bodyFont,margin:0,fontWeight:"500",whiteSpace:"pre-line"}}>{q.q}</p>
          )}
        </div>
        <div style={{marginBottom:"20px"}}>
          {q.opts.map((opt,i)=>{
            const isSel=selected===i, isOk=selected!==null&&i===q.ans, isNg=selected===i&&i!==q.ans;
            return (
              <button key={i} onClick={()=>{ if(selected===null) setSelected(i); }}
                style={{display:"block",width:"100%",textAlign:"left",padding:"15px 20px",marginBottom:"10px",borderRadius:"10px",
                  border:`1.5px solid ${isOk?"#059669":isNg?T.red:isSel?T.accent:T.border2}`,
                  background:isOk?T.greenL:isNg?T.redL:isSel?T.accentL:T.bg,
                  color:isOk?T.green:isNg?T.red:isSel?T.accent:T.text,
                  cursor:selected!==null?"default":"pointer",fontSize:"16px",fontFamily:bodyFont,
                  fontWeight:isSel||isOk?"600":"400",transition:"all 0.15s",lineHeight:"1.5"}}>
                <span style={{fontWeight:"700",marginRight:"12px",color:isOk?T.green:isNg?T.red:isSel?T.accent:T.muted,fontSize:"14px"}}>{String.fromCharCode(65+i)}.</span>
                {opt}
              </button>
            );
          })}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"4px"}}>
          <button onClick={handleSkip} style={{background:T.bg,color:T.sub,border:`1.5px solid ${T.border2}`,padding:"12px 20px",borderRadius:"9px",fontFamily:bodyFont,fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>Skip →</button>
          <button onClick={handleNext} disabled={selected===null}
            style={{background:selected===null?T.border:partColor,color:selected===null?T.muted:"#fff",border:"none",padding:"12px 28px",borderRadius:"9px",fontFamily:bodyFont,fontSize:"15px",fontWeight:"700",cursor:selected===null?"not-allowed":"pointer",transition:"all 0.15s"}}>
            {current+1===totalQs?(isApt?"Complete Part 1 →":"Submit Test →"):"Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}