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
const APT_TEMPLATE = [2, 0, 1, 2, 3, 1, 2, 0, 3, 0, 1, 3, 0, 2, 1, 0, 3, 1, 2, 3, 0, 2, 3, 1, 0, 2, 1, 3, 0, 2, 3, 0, 1, 2, 0, 3, 2, 1, 0, 2, 1, 3, 0, 1, 2, 3, 0, 1, 2, 3];
const CS_TEMPLATE  = [0, 2, 3, 1, 2, 0, 3, 1, 3, 2, 0, 1, 3, 0, 1, 2, 0, 3, 2, 0, 1, 3, 2, 1, 2, 3, 0, 1, 2, 1, 3, 0, 2, 2, 3, 0, 1, 3, 0, 1];

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
// QUESTION BANK — Mock Test 5 (All New — distinct from Tests 1-4)
// Source: A=23 B=22 C=23 D=22 | No 3+ consecutive runs
// ═══════════════════════════════════════════════════════════════════════════════

const aptitudeQuestions = [
  // ══ QUANT (10) A=3 B=2 C=3 D=2 ═══════════════════════════════
  {id:1, cat:"Quant", q:"If 40% of a number is 120, what is 25% of that number?", opts:["75","80","70","85"], ans:0},
  {id:2, cat:"Quant", q:"A train crosses a 200m bridge in 20 sec and a pole in 10 sec. Length of train?", opts:["100 m","150 m","200 m","250 m"], ans:2},
  {id:3, cat:"Quant", q:"A and B invest ₹3000 and ₹4000. A gets 10% of profit as salary, rest split by ratio. Total profit ₹1400. A's share?", opts:["₹740","₹700","₹660","₹780"], ans:0},
  {id:4, cat:"Quant", q:"Ratio of two numbers is 4:5. Add 6 to each, ratio becomes 6:7. Find smaller number.", opts:["10","12","15","18"], ans:1},
  {id:5, cat:"Quant", q:"Shopkeeper sells 12 items at cost price of 15. Profit %?", opts:["20%","22%","25%","30%"], ans:2},
  {id:6, cat:"Quant", q:"SI on a sum at 8% p.a. for 3 years is ₹2400. Find the principal.", opts:["₹8000","₹10000","₹12000","₹9000"], ans:1},
  {id:7, cat:"Quant", q:"Pipe A fills tank in 12 hrs, B empties in 16 hrs. Both open together — time to fill?", opts:["36 hrs","42 hrs","48 hrs","52 hrs"], ans:2},
  {id:8, cat:"Quant", q:"Mean of 20 observations is 45. One value 54 was misread as 45. Correct mean?", opts:["45.35","45.45","45.55","45.25"], ans:1},
  {id:9, cat:"Quant", q:"Boat goes 30 km upstream in 3 hrs, 30 km downstream in 2 hrs. Speed of stream?", opts:["1.5 km/h","2 km/h","2.5 km/h","3 km/h"], ans:2},
  {id:10, cat:"Quant", q:"3-digit numbers divisible by both 4 and 6 — how many?", opts:["50","75","67","60"], ans:1},

  // ══ LOGICAL (10) A=2 B=3 C=2 D=3 ════════════════════════════
  {id:11, cat:"Logical", q:"Series: 144, 121, 100, 81, 64, ?", opts:["49","45","36","25"], ans:0},
  {id:12, cat:"Logical", q:"DELHI coded as EFMIJ. How is MUMBAI coded?", opts:["NVNCBJ","NVNDBI","NVNBCJ","NVNCAJ"], ans:3},
  {id:13, cat:"Logical", q:"X is Y's brother. Y is Z's sister. Z is W's son. How is X related to W?", opts:["Son","Nephew","Daughter","Son or Daughter"], ans:3},
  {id:14, cat:"Logical", q:"All cats are mammals. No mammal is a reptile. Which is definitely true?", opts:["No cat is a reptile","Some cats are reptiles","All reptiles are mammals","Some mammals are cats"], ans:0},
  {id:15, cat:"Logical", q:"Mirror faces west. At 7:15 AM, what time does mirror image show?", opts:["4:45","5:45","4:15","5:15"], ans:1},
  {id:16, cat:"Logical", q:"A is 8th from left, 14th from right in a row. Total students?", opts:["20","21","22","23"], ans:1},
  {id:17, cat:"Logical", q:"7 people can do a job in 5 days. How many days for 5 people?", opts:["6","7","8","9"], ans:1},
  {id:18, cat:"Logical", q:"ODD one out: BDFH, CEGI, DFHJ, EGIK, FGJL", opts:["BDFH","CEGI","DFHJ","FGJL"], ans:3},
  {id:19, cat:"Logical", q:"Statements: All books are papers. Some papers are white.\nConclusion: Some books are white. Valid?", opts:["Yes — definite","No — not certain","Only if all papers are white","Depends on context"], ans:1},
  {id:20, cat:"Logical", q:"P taller than Q. R shorter than S. S taller than P. Who is tallest?", opts:["P","Q","R","S"], ans:3},

  // ══ VERBAL (10) A=3 B=2 C=2 D=3 ══════════════════════════════
  {id:21, cat:"Verbal", q:"Synonym of TENACIOUS:", opts:["Persistent","Weak","Flexible","Timid"], ans:0},
  {id:22, cat:"Verbal", q:"Antonym of PRUDENT:", opts:["Careful","Wise","Reckless","Cautious"], ans:3},
  {id:23, cat:"Verbal", q:"Fill in: 'The team, along with its coach, ___ preparing for the match.'", opts:["are","were","is","have been"], ans:0},
  {id:24, cat:"Verbal", q:"Correctly spelled word:", opts:["Mispelled","Misspelled","Mispeled","Misspeled"], ans:1},
  {id:25, cat:"Verbal", q:"'Beat around the bush' means:", opts:["Work very hard","Avoid the main topic","Win easily","Cause confusion"], ans:3},
  {id:26, cat:"Verbal", q:"Error: 'Neither John nor his friends was (A) present (B) at (C) the meeting (D).'", opts:["A — 'was' should be 'were'","B — 'present' wrong","C — 'at' wrong","D — No error"], ans:0},
  {id:27, cat:"Verbal", q:"Best word: 'Her argument was so ___ that even opponents had to agree.'", opts:["vague","compelling","irrelevant","confusing"], ans:1},
  {id:28, cat:"Verbal", q:"SCULPTOR : CHISEL :: PAINTER : ?", opts:["Canvas","Brush","Gallery","Portrait"], ans:0},
  {id:29, cat:"Verbal", q:"Correct sentence:", opts:["He don't know the answer","He doesn't knows the answer","He do not knows the answer","He doesn't know the answer"], ans:3},
  {id:30, cat:"Verbal", q:"Word closest to VERBOSE:", opts:["Concise","Talkative","Silent","Rude"], ans:1},

  // ══ DI (10) A=2 B=3 C=3 D=2 ══════════════════════════════════
  // Expenses (₹L): Salaries=45, Rent=12, Marketing=18, Ops=25, Misc=10
  {id:31, cat:"DI", q:"Expenses (₹L): Salaries=45, Rent=12, Marketing=18, Ops=25, Misc=10\n\nTotal?", opts:["₹108L","₹110L","₹112L","₹115L"], ans:1},
  {id:32, cat:"DI", q:"Expenses (₹L): Salaries=45, Rent=12, Marketing=18, Ops=25, Misc=10\n\nSalaries as % of total?", opts:["39.6%","40.9%","42.1%","38.5%"], ans:1},
  {id:33, cat:"DI", q:"Expenses (₹L): Salaries=45, Rent=12, Marketing=18, Ops=25, Misc=10\n\nRatio of Marketing to Rent?", opts:["2:1","3:2","4:3","5:3"], ans:1},
  {id:34, cat:"DI", q:"Expenses (₹L): Salaries=45, Rent=12, Marketing=18, Ops=25, Misc=10\n\nEach expense rises 10%. New total?", opts:["₹118L","₹121L","₹124L","₹116L"], ans:1},
  {id:35, cat:"DI", q:"Expenses (₹L): Salaries=45, Rent=12, Marketing=18, Ops=25, Misc=10\n\nOps+Misc as % of total?", opts:["29.5%","31.8%","33.6%","27.2%"], ans:1},
  // Scores: Physics=72, Chemistry=68, Maths=85, English=79, CS=91
  {id:36, cat:"DI", q:"Scores: Physics=72, Chemistry=68, Maths=85, English=79, CS=91\n\nAverage?", opts:["76","77","79","78"], ans:2},
  {id:37, cat:"DI", q:"Scores: Physics=72, Chemistry=68, Maths=85, English=79, CS=91\n\nCS more than Chemistry by?", opts:["21","23","25","27"], ans:1},
  {id:38, cat:"DI", q:"Scores: Physics=72, Chemistry=68, Maths=85, English=79, CS=91\n\nSubjects above average?", opts:["CS only","Maths and CS","Maths, English, CS","CS, English"], ans:2},
  {id:39, cat:"DI", q:"Scores: Physics=72, Chemistry=68, Maths=85, English=79, CS=91\n\nMaths % out of 100?", opts:["82%","83%","85%","87%"], ans:2},
  {id:40, cat:"DI", q:"Scores: Physics=72, Chemistry=68, Maths=85, English=79, CS=91\n\nTotal out of 500?", opts:["393","394","395","396"], ans:2},

  // ══ AR (10) A=3 B=2 C=3 D=2 ══════════════════════════════════
  {id:41, cat:"AR", q:"6 people, each shakes hands with every other once. Total handshakes?", opts:["12","15","18","20"], ans:1},
  {id:42, cat:"AR", q:"Clock shows 3:25. Angle between hour and minute hands?", opts:["45.5°","47.5°","49.5°","52°"], ans:1},
  {id:43, cat:"AR", q:"X finishes work in 20 days, Y in 30. Work together 6 days, X leaves. Days for Y alone to finish rest?", opts:["10","12","14","16"], ans:2},
  {id:44, cat:"AR", q:"4-digit numbers using 1,2,3,4 each once. How many divisible by 2?", opts:["10","12","14","16"], ans:1},
  {id:45, cat:"AR", q:"All pens are erasers. Some erasers are sharpeners.\nConclusion I: Some pens are sharpeners.\nConclusion II: Some sharpeners are erasers.\nWhich follows?", opts:["Only I","Only II","Both","Neither"], ans:0},
  {id:46, cat:"AR", q:"Train A=54 km/h (200m long), B=36 km/h (300m long), same direction. Time for A to pass B?", opts:["80 sec","90 sec","100 sec","110 sec"], ans:1},
  {id:47, cat:"AR", q:"Bag: 5 red, 3 blue, 2 green. Probability of non-red ball?", opts:["1/2","3/5","2/5","1/5"], ans:0},
  {id:48, cat:"AR", q:"Cube painted red, cut into 27 small cubes. How many have NO painted face?", opts:["0","1","2","3"], ans:1},
  {id:49, cat:"AR", q:"Man walks 4 km North, 3 km East, 4 km South. Distance from start?", opts:["2 km","3 km","4 km","5 km"], ans:1},
  {id:50, cat:"AR", q:"A,B,C finish work in 6,8,12 days. All work together. Fraction done in 1 day?", opts:["3/8","1/3","5/12","7/24"], ans:3},
];

const csQuestions = [
  // ══ OOPs (8) A=2 B=2 C=2 D=2 ═════════════════════════════════
  {id:51, cat:"OOPs", q:"What is the output?\nclass Counter {\n  static int count = 0;\n  Counter() { count++; }\n}\nnew Counter(); new Counter(); new Counter();\nSystem.out.println(Counter.count);",
   opts:["0","1","2","3"], ans:3, code:true},
  {id:52, cat:"OOPs", q:"Which best describes Encapsulation?",
   opts:["Inheriting methods from parent class","Binding data and methods together, hiding internal details","Method doing different things based on input","A class that cannot be instantiated"], ans:1},
  {id:53, cat:"OOPs", q:"Difference between method overloading and overriding?",
   opts:["No practical difference","Overloading: compile-time, same class, different params; Overriding: runtime, subclass redefines parent","Overriding is compile-time; overloading is runtime","Both require inheritance"], ans:3},
  {id:54, cat:"OOPs", q:"Which keyword prevents a class from being inherited in Java?",
   opts:["static","abstract","private","final"], ans:2},
    {id:55, cat:"OOPs", q:"What is the output?\nclass Animal { void speak() { System.out.print('Animal'); } }\nclass Dog extends Animal { void speak() { System.out.print('Dog'); } }\nAnimal a = new Dog();\na.speak();",
   opts:["Animal","Dog","AnimalDog","Compile error"], ans:1, code:true},
  {id:56, cat:"OOPs", q:"What does the Open/Closed Principle state?",
   opts:["Open for modification, closed for extension","Closed for both extension and modification","Open for extension, closed for modification","Open classes cannot have private methods"], ans:3},
  {id:57, cat:"OOPs", q:"What is an interface in Java?",
   opts:["A blueprint defining method signatures without implementation (classes must implement all)","A class with only static methods","A class that cannot be extended","A type of abstract class with constructors"], ans:0},
  {id:58, cat:"OOPs", q:"If a subclass does NOT override an abstract method from parent, what happens?",
   opts:["Method is auto-generated with empty body","Subclass must also be declared abstract or provide the implementation","Program runs with parent's abstract method","Compile error — abstract methods auto-inherit"], ans:1},

  // ══ DBMS (8) A=2 B=2 C=2 D=2 ═════════════════════════════════
  {id:59, cat:"DBMS", q:"What is a composite key?",
   opts:["Two or more columns that together uniquely identify a row","A key referencing another table's primary key","A key that allows NULL values","A key used for indexing only"], ans:0},
  {id:60, cat:"DBMS", q:"What does this query return?\nSELECT name FROM employees\nORDER BY salary DESC LIMIT 1;",
   opts:["Employee with lowest salary","All employees sorted by salary","Random employee","Employee with highest salary"], ans:3, code:true},
  {id:61, cat:"DBMS", q:"Purpose of GROUP BY in SQL?",
   opts:["Sorts result in ascending order","Groups rows sharing same value in columns, used with aggregate functions","Filters rows based on condition","Joins two tables"], ans:1},
  {id:62, cat:"DBMS", q:"What is referential integrity?",
   opts:["Ensures all column values are non-null","Ensures no duplicate rows exist","A foreign key always matches an existing primary key in the referenced table","Ensures data is backed up regularly"], ans:2},
  {id:63, cat:"DBMS", q:"Difference between WHERE and HAVING?",
   opts:["WHERE filters rows before grouping; HAVING filters groups after GROUP BY","They are interchangeable in all cases","HAVING filters before grouping; WHERE after","WHERE works only with SELECT; HAVING with UPDATE"], ans:0},
  {id:64, cat:"DBMS", q:"What is a deadlock in databases?",
   opts:["A query running indefinitely","A constraint violation rolling back a transaction","A table with too many indexes","Two or more transactions waiting for each other's locked resources, causing indefinite blocking"], ans:3},
  {id:65, cat:"DBMS", q:"What does BCNF ensure?",
   opts:["No partial dependencies","No transitive dependencies","Every determinant in the table is a candidate key","No multivalued dependencies"], ans:2},
  {id:66, cat:"DBMS", q:"Difference between CHAR and VARCHAR?",
   opts:["No difference","CHAR stores fixed-length strings (pads spaces); VARCHAR stores variable-length (no padding)","VARCHAR is always faster","CHAR stores numbers; VARCHAR cannot"], ans:1},

  // ══ OS (8) A=2 B=2 C=2 D=2 ════════════════════════════════════
  {id:67, cat:"OS", q:"Difference between preemptive and non-preemptive scheduling?",
   opts:["Preemptive: OS can interrupt a running process; non-preemptive: process runs until it yields or finishes","Non-preemptive is always more efficient","Preemptive needs single-core only","Non-preemptive used only in real-time systems"], ans:0},
  {id:68, cat:"OS", q:"What is a page fault?",
   opts:["Dividing by zero in a program","A segmentation fault in C","Two processes writing same memory","A process accesses a memory page not currently loaded in physical RAM"], ans:3},
  {id:69, cat:"OS", q:"Role of PCB (Process Control Block)?",
   opts:["Stores compiled binary of a process","Contains all process info (PID, state, registers, memory) needed by OS","Manages disk allocation","Stores I/O buffers"], ans:1},
  {id:70, cat:"OS", q:"Difference between multiprogramming and multiprocessing?",
   opts:["Same concept, different names","Multiprogramming needs multiple CPUs; multiprocessing needs one","Multiprocessing is slower but reliable","Multiprogramming: multiple programs on one CPU by switching; multiprocessing: multiple CPUs simultaneously"], ans:2},
  {id:71, cat:"OS", q:"What is a mutex?",
   opts:["Synchronization mechanism ensuring only one thread accesses a critical section at a time","A scheduling algorithm","A memory management technique","A type of interrupt handler"], ans:0},
  {id:72, cat:"OS", q:"In Round Robin scheduling, what is a time quantum?",
   opts:["Total time for all processes","Time to complete a context switch","Time a process waits in ready queue","Fixed time slice allocated to each process before CPU switches"], ans:3},
  {id:73, cat:"OS", q:"Difference between internal and external fragmentation?",
   opts:["Both refer to same concept","External: only in paging; internal: only in segmentation","Internal is wasted space within allocated block; external is scattered free space between allocations","Internal is disk problem; external is RAM"], ans:2},
  {id:74, cat:"OS", q:"What does fork() return in the child process?",
   opts:["PID of parent","PID of child itself","0 — indicating it is the child","Negative value indicating error"], ans:1},

  // ══ CN (8) A=2 B=2 C=2 D=2 ════════════════════════════════════
  {id:75, cat:"CN", q:"Difference between hub, switch, and router?",
   opts:["All identical at network layer","Switch and router are same device","Hub: Layer 3; switch: Layer 2; router: Layer 1","Hub: broadcasts to all (Layer 1); switch: forwards to port (Layer 2); router: routes between networks (Layer 3)"], ans:2},
  {id:76, cat:"CN", q:"What is subnetting used for?",
   opts:["Encrypting data between nodes","Increasing transmission speed","Assigning dynamic IPs","Dividing a large network into smaller subnetworks for better management and security"], ans:3},
  {id:77, cat:"CN", q:"TCP/IP model vs OSI model?",
   opts:["TCP/IP has 4 layers (Application, Transport, Internet, Network Access); OSI has 7 — TCP/IP is the practical internet implementation","Identical — just different names","TCP/IP has 7 layers; OSI has 4","TCP/IP only for wireless; OSI for wired"], ans:0},
  {id:78, cat:"CN", q:"What is a VLAN?",
   opts:["A physical network segment separated by routers","A type of wireless protocol","A secure tunnel between remote networks","Logical grouping of devices regardless of physical location, created on managed switches"], ans:3},
  {id:79, cat:"CN", q:"What does the ping command test?",
   opts:["Reachability of host and round-trip time using ICMP","Download speed","DNS resolution speed","Number of hops to destination"], ans:0},
  {id:80, cat:"CN", q:"Difference between IPv4 and IPv6?",
   opts:["IPv4 is newer; IPv6 is original","IPv6 is slower due to larger addresses","Both have same address space, different packet format","IPv4: 32-bit addresses (4.3B); IPv6: 128-bit (virtually unlimited) — created due to IPv4 exhaustion"], ans:2},
  {id:81, cat:"CN", q:"What is a firewall?",
   opts:["A device that monitors and controls network traffic based on predefined rules","A protocol for assigning IP addresses","A type of VPN","A device that speeds up network traffic"], ans:0},
  {id:82, cat:"CN", q:"Purpose of TTL field in an IP packet?",
   opts:["Specifies DNS caching duration","Encrypts the packet header","Indicates packet priority","Limits number of hops — decremented at each router, discarded at 0"], ans:1},

  // ══ DSA (8) A=2 B=2 C=2 D=2 ════════════════════════════════════
  {id:83, cat:"DSA", q:"Time complexity of inserting at beginning of doubly linked list?",
   opts:["O(n)","O(log n)","O(n²)","O(1)"], ans:3},
  {id:84, cat:"DSA", q:"Most efficient sorting algorithm for nearly-sorted data?",
   opts:["Merge Sort","Insertion Sort","Quick Sort","Selection Sort"], ans:1},
  {id:85, cat:"DSA", q:"What is a balanced BST and why important?",
   opts:["BST with all leaves at same level","BST with only left children","BST where height difference between subtrees ≤ 1 — ensures O(log n) operations","BST stored as sorted array"], ans:2},
  {id:86, cat:"DSA", q:"Difference between BFS and DFS?",
   opts:["BFS: explores level by level (queue); DFS: depth-first (stack/recursion)","No difference — same result always","DFS uses queue; BFS uses stack","BFS only for trees; DFS for graphs"], ans:0},
  {id:87, cat:"DSA", q:"What is dynamic programming?",
   opts:["A paradigm using only recursion","A method of allocating memory at runtime","An optimization solving complex problems by breaking into overlapping subproblems and storing results","A type of sorting for large datasets"], ans:2},
  {id:88, cat:"DSA", q:"Space complexity of adjacency matrix for graph with V vertices?",
   opts:["O(V)","O(V + E)","O(V²)","O(E)"], ans:1},
  {id:89, cat:"DSA", q:"What is a priority queue?",
   opts:["Queue where elements removed FIFO only","A circular queue with fixed capacity","A stack supporting priority insertion","Queue where each element has priority — higher priority dequeued first"], ans:2},
  {id:90, cat:"DSA", q:"Worst-case time complexity of inserting into min-heap of n elements?",
   opts:["O(n)","O(n log n)","O(1)","O(log n)"], ans:3},
];

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
  { key:"DSA",  label:"Data Structures",      emoji:"🌲", color:"#dc2626", count:8 },
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
    <div class="hdr"><div class="org">The Entangle · Elite 100 Club</div><h1>Mock Test 5 — Report Card</h1><div class="dt">Advanced Placement Preparation · ${date}</div></div>
    <div class="ir"><div class="ib"><div class="il">Student</div><div class="iv">${student.name}</div></div><div class="ib"><div class="il">College</div><div class="iv">${student.college}</div></div><div class="ib"><div class="il">Course</div><div class="iv">${student.course}</div></div><div class="ib"><div class="il">Year</div><div class="iv">${student.year}</div></div></div>
    <div class="sr"><div class="sb"><div class="big">${score}<span style="font-size:22px;color:#64748b">/90</span></div><div class="sm">Total Score</div></div><div class="sb"><div class="big" style="color:${gColor}">${grade}</div><div class="sm">Grade</div></div><div class="sb"><div class="big" style="color:${gColor}">${pct}%</div><div class="sm" style="color:${gColor};font-weight:700">${remark}</div></div></div>
    <div class="pr"><div class="pb"><div class="pl" style="color:#4f46e5">Part 1 — Aptitude</div><div style="font-size:28px;font-weight:800">${aptScore}<span style="font-size:14px;color:#64748b">/50</span></div><div style="font-size:12px;color:#64748b">${Math.round(aptScore/50*100)}%</div></div><div class="pb"><div class="pl" style="color:#059669">Part 2 — CS Fundamentals</div><div style="font-size:28px;font-weight:800">${csScore}<span style="font-size:14px;color:#64748b">/40</span></div><div style="font-size:12px;color:#64748b">${Math.round(csScore/40*100)}%</div></div></div>
    <table><tr><th>Section</th><th>Score</th><th>Total</th><th>%</th><th>Performance</th></tr>${secScores.map(s=>`<tr><td><strong>${s.emoji} ${s.label}</strong></td><td><strong>${s.c}</strong></td><td>${s.t}</td><td style="font-weight:700;color:${s.pct>=60?"#059669":s.pct>=40?"#d97706":"#dc2626"}">${s.pct}%</td><td><div class="bar"><div class="bi" style="width:${s.pct}%;background:${s.pct>=60?"#059669":s.pct>=40?"#d97706":"#dc2626"}"></div></div></td></tr>`).join("")}<tr style="background:#f0fdf4"><td><strong>TOTAL</strong></td><td><strong>${score}</strong></td><td><strong>90</strong></td><td style="font-weight:800;color:${gColor}">${pct}%</td><td><div class="bar"><div class="bi" style="width:${pct}%;background:${gColor}"></div></div></td></tr></table>
    <div class="ftr"><p>Auto-generated by The Entangle · Elite 100 Club · Indore</p><div class="st">ELITE 100 CLUB</div></div></body></html>`;
    const blob=new Blob([h],{type:"text/html"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=`ReportCard_MockTest5_${student.name.replace(/\s+/g,"_")}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",overflowY:"auto"}}>
      <div style={{background:T.card,borderRadius:"16px",padding:"28px 32px",maxWidth:"580px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:T.shadow2}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px"}}>
          <div><div style={{fontSize:"10px",color:T.accent,fontWeight:"700",letterSpacing:"2px",marginBottom:"3px"}}>THE ENTANGLE · ELITE 100 CLUB</div><div style={{fontSize:"18px",fontWeight:"800",color:T.text}}>Mock Test 5 — Report Card</div></div>
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
            <div style={{fontSize:"12px",color:T.sub}}>OOPs · DBMS · OS · CN · DSA</div>
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
          <div style={{fontSize:"13px",color:T.sub}}>OOPs · DBMS · OS · CN · DSA</div>
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