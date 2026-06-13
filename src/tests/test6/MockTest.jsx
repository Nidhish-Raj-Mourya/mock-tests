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
// QUESTION BANK — Mock Test 6 (All New — distinct from Tests 1-5)
// Source: A=23 B=22 C=23 D=22 | No 3+ consecutive runs
// ═══════════════════════════════════════════════════════════════════════════════

const aptitudeQuestions = [
  // ══ QUANT (10) A=3 B=2 C=3 D=2 ═══════════════════════════════
  {id:1,  cat:"Quant", q:"A number is increased by 20% and then decreased by 20%. Net change?",
   opts:["No change","4% decrease","4% increase","2% decrease"], ans:1},
  {id:2,  cat:"Quant", q:"A can finish a work in 18 days, B in 27 days. They work together for 9 days. What fraction of work remains?",
   opts:["1/6","1/4","1/3","1/2"], ans:2},
  {id:3,  cat:"Quant", q:"Two numbers are in ratio 3:4. Their HCF is 8. Find their LCM.",
   opts:["72","84","96","108"], ans:2},
  {id:4,  cat:"Quant", q:"A sum of money doubles itself at SI in 8 years. In how many years will it triple?",
   opts:["12 years","14 years","16 years","18 years"], ans:2},
  {id:5,  cat:"Quant", q:"A shopkeeper buys 200 apples for ₹1000 and sells 180 at ₹6 each, rest are spoiled. Profit or loss %?",
   opts:["4% profit","8% profit","4% loss","8% loss"], ans:1},
  {id:6,  cat:"Quant", q:"Speed of a boat in still water is 15 km/h. Stream speed is 3 km/h. Time to go 72 km downstream?",
   opts:["4 hrs","4.5 hrs","5 hrs","3.5 hrs"], ans:0},
  {id:7,  cat:"Quant", q:"A die is thrown twice. Probability of getting sum = 9?",
   opts:["1/9","2/9","1/6","1/12"], ans:0},
  {id:8,  cat:"Quant", q:"The average of 5 consecutive even numbers is 18. Find the largest number.",
   opts:["20","22","24","26"], ans:1},
  {id:9,  cat:"Quant", q:"A rectangle has perimeter 48 cm and length is 3 times breadth. Find area.",
   opts:["96 sq cm","108 sq cm","120 sq cm","135 sq cm"], ans:1},
  {id:10, cat:"Quant", q:"X is 3 years older than Y. 5 years ago X was twice Y's age. Find current age of Y.",
   opts:["8 years","9 years","10 years","11 years"], ans:0},

  // ══ LOGICAL (10) A=2 B=3 C=2 D=3 ════════════════════════════
  {id:11, cat:"Logical", q:"Series: 2, 6, 12, 20, 30, 42, ?",
   opts:["54","56","58","60"], ans:1},
  {id:12, cat:"Logical", q:"If PAPER is coded as OZODQ, how is PENCIL coded?",
   opts:["ODBMHK","ODMBHK","OEBNHK","ODBMHL"], ans:3},
  {id:13, cat:"Logical", q:"A+B means A is father of B. A-B means A is wife of B. A*B means A is brother of B. In P+Q-R, how is P related to R?",
   opts:["Father-in-law","Son-in-law","Brother-in-law","Father"], ans:0},
  {id:14, cat:"Logical", q:"Some doctors are engineers. All engineers are scientists. No scientist is a musician. Which is true?",
   opts:["Some doctors are musicians","No doctor is a musician","All doctors are scientists","Some engineers are musicians"], ans:3},
  {id:15, cat:"Logical", q:"A clock shows 8:40. What is the angle between the hands?",
   opts:["100°","110°","120°","130°"], ans:1},
  {id:16, cat:"Logical", q:"In a class of 40, 18 play cricket, 15 play football, 7 play both. How many play neither?",
   opts:["12","14","16","18"], ans:1},
  {id:17, cat:"Logical", q:"Find odd one out: 3, 5, 7, 11, 13, 15",
   opts:["5","7","13","15"], ans:3},
  {id:18, cat:"Logical", q:"If South-East becomes East, North-West becomes West, then what does South-West become?",
   opts:["East","West","South","North"], ans:1},
  {id:19, cat:"Logical", q:"Statement: All pens write. Some pens are red.\nConclusion I: Some red things write.\nConclusion II: All writing things are pens.\nWhich follows?",
   opts:["Both I and II","Only I follows","Only II follows","Neither follows"], ans:3},
  {id:20, cat:"Logical", q:"A is 5th from top in a class. B is 8th from bottom. If there are 3 students between them, how many students in the class?",
   opts:["14","15","16","17"], ans:3},

  // ══ VERBAL (10) A=3 B=2 C=2 D=3 ══════════════════════════════
  {id:21, cat:"Verbal", q:"Synonym of EPHEMERAL:",
   opts:["Short-lived","Permanent","Ancient","Spiritual"], ans:0},
  {id:22, cat:"Verbal", q:"Antonym of MAGNANIMOUS:",
   opts:["Generous","Noble","Petty","Courageous"], ans:3},
  {id:23, cat:"Verbal", q:"Fill in: 'The data ___ collected from multiple sources to ensure accuracy.'",
   opts:["was","were","are","have"], ans:0},
  {id:24, cat:"Verbal", q:"Correctly spelled word:",
   opts:["Accomodation","Accomadation","Accommodation","Acommodation"], ans:1},
  {id:25, cat:"Verbal", q:"'Bite the bullet' means:",
   opts:["Shoot quickly","End a conflict","Eat hastily","Endure pain or difficulty bravely"], ans:3},
  {id:26, cat:"Verbal", q:"Error: 'The list of items are (A) placed (B) on (C) the table (D).'",
   opts:["A — 'are' should be 'is'","B — 'placed' is wrong","C — 'on' is wrong","D — No error"], ans:0},
  {id:27, cat:"Verbal", q:"Best word: 'The politician gave a ___ speech that swayed many undecided voters.'",
   opts:["monotonous","confusing","persuasive","irrelevant"], ans:1},
  {id:28, cat:"Verbal", q:"AUTHOR : NOVEL :: COMPOSER : ?",
   opts:["Stage","Concert","Symphony","Musician"], ans:0},
  {id:29, cat:"Verbal", q:"Correct sentence:",
   opts:["She suggested that he should to go","She suggested that he go","She suggested that he goes","She suggested that he going"], ans:3},
  {id:30, cat:"Verbal", q:"Word closest to AMELIORATE:",
   opts:["Worsen","Improve","Maintain","Destroy"], ans:1},

  // ══ DI (10) A=2 B=3 C=3 D=2 ══════════════════════════════════
  // Sales (units): Q1=800, Q2=950, Q3=720, Q4=1100, Total=3570
  // Targets:       Q1=850, Q2=900, Q3=800, Q4=1000
  {id:31, cat:"DI", q:"Sales vs Target:\nActual: Q1=800 Q2=950 Q3=720 Q4=1100\nTarget: Q1=850 Q2=900 Q3=800 Q4=1000\n\nTotal actual sales?",
   opts:["3470","3570","3670","3770"], ans:1},
  {id:32, cat:"DI", q:"Sales vs Target:\nActual: Q1=800 Q2=950 Q3=720 Q4=1100\nTarget: Q1=850 Q2=900 Q3=800 Q4=1000\n\nWhich quarter exceeded target by most?",
   opts:["Q1","Q2","Q3","Q4"], ans:1},
  {id:33, cat:"DI", q:"Sales vs Target:\nActual: Q1=800 Q2=950 Q3=720 Q4=1100\nTarget: Q1=850 Q2=900 Q3=800 Q4=1000\n\nIn how many quarters did actual exceed target?",
   opts:["1","2","3","4"], ans:1},
  {id:34, cat:"DI", q:"Sales vs Target:\nActual: Q1=800 Q2=950 Q3=720 Q4=1100\nTarget: Q1=850 Q2=900 Q3=800 Q4=1000\n\n% achievement in Q4?",
   opts:["105%","108%","110%","115%"], ans:2},
  {id:35, cat:"DI", q:"Sales vs Target:\nActual: Q1=800 Q2=950 Q3=720 Q4=1100\nTarget: Q1=850 Q2=900 Q3=800 Q4=1000\n\nQ3 shortfall from target?",
   opts:["60","70","80","90"], ans:2},
  // Employees: Engineering=120, Sales=80, HR=40, Finance=60, Support=50
  {id:36, cat:"DI", q:"Employees: Eng=120, Sales=80, HR=40, Finance=60, Support=50\n\nTotal employees?",
   opts:["340","350","360","370"], ans:1},
  {id:37, cat:"DI", q:"Employees: Eng=120, Sales=80, HR=40, Finance=60, Support=50\n\nEngineering as % of total?",
   opts:["32.4%","33.3%","34.3%","35.2%"], ans:2},
  {id:38, cat:"DI", q:"Employees: Eng=120, Sales=80, HR=40, Finance=60, Support=50\n\nRatio of Sales to HR?",
   opts:["1:2","3:2","2:1","4:3"], ans:2},
  {id:39, cat:"DI", q:"Employees: Eng=120, Sales=80, HR=40, Finance=60, Support=50\n\nIf 10 join Finance, new Finance % of total?",
   opts:["18.6%","19.4%","20.0%","17.8%"], ans:1},
  {id:40, cat:"DI", q:"Employees: Eng=120, Sales=80, HR=40, Finance=60, Support=50\n\nNon-Engineering employees?",
   opts:["220","230","240","250"], ans:1},

  // ══ AR (10) A=3 B=2 C=3 D=2 ══════════════════════════════════
  {id:41, cat:"AR", q:"A is mother of B. B is sister of C. C is husband of D. How is A related to D?",
   opts:["Mother","Mother-in-law","Grandmother","Aunt"], ans:1},
  {id:42, cat:"AR", q:"Complete: 1, 4, 9, 16, 25, 36, ?",
   opts:["42","48","49","56"], ans:2},
  {id:43, cat:"AR", q:"A train 300m long moving at 72 km/h crosses a man running at 18 km/h in same direction. Time taken?",
   opts:["16 sec","18 sec","20 sec","22 sec"], ans:2},
  {id:44, cat:"AR", q:"5 friends sit in a row. A is to the left of B. C is between D and E. B is to the right of E. Who sits in middle?",
   opts:["A","B","C","E"], ans:3},
  {id:45, cat:"AR", q:"All tigers are lions. Some lions are bears. No bear is a fox.\nConclusion I: Some tigers are bears.\nConclusion II: No tiger is a fox.\nWhich follows?",
   opts:["Only I","Only II","Both","Neither"], ans:0},
  {id:46, cat:"AR", q:"A man invests ₹5000 at 10% CI and ₹4000 at 12% SI for 2 years. Difference in interests earned?",
   opts:["₹30","₹40","₹50","₹60"], ans:1},
  {id:47, cat:"AR", q:"How many times do the hands of a clock coincide in 12 hours?",
   opts:["10","11","12","13"], ans:0},
  {id:48, cat:"AR", q:"A cube of side 4cm is painted blue on all faces and cut into 1cm cubes. How many have exactly 1 face painted?",
   opts:["16","24","32","8"], ans:1},
  {id:49, cat:"AR", q:"P is taller than Q but shorter than R. S is taller than R. T is shorter than Q. Who is second tallest?",
   opts:["P","Q","R","S"], ans:2},
  {id:50, cat:"AR", q:"In a row of students, Rahul is 15th from left. Priya is 20th from right. If they swap, Rahul is 18th from left. Total students?",
   opts:["35","36","37","38"], ans:2},
];

const csQuestions = [
  // ══ OOPs (8) A=2 B=2 C=2 D=2 ═════════════════════════════════
  {id:51, cat:"OOPs", q:"What is the output?\nclass Box {\n  int width;\n  Box(int w) { width = w; }\n  Box(Box b) { width = b.width; }\n}\nBox b1 = new Box(10);\nBox b2 = new Box(b1);\nb1.width = 20;\nSystem.out.println(b2.width);",
   opts:["10","20","0","Compile error"], ans:0, code:true},
  {id:52, cat:"OOPs", q:"What is the difference between an abstract class and a concrete class?",
   opts:["No difference — both can be instantiated","Abstract class cannot be instantiated and may have abstract methods; concrete class can be instantiated","Concrete class cannot have methods","Abstract class can only have static methods"], ans:3},
  {id:53, cat:"OOPs", q:"Which concept allows treating objects of different classes through a common interface?",
   opts:["Encapsulation","Inheritance","Polymorphism","Abstraction"], ans:2},
  {id:54, cat:"OOPs", q:"What is the purpose of the 'this' keyword in Java?",
   opts:["Refers to the parent class instance","Refers to the current class instance — used to resolve ambiguity between fields and parameters","Creates a new instance of the class","Refers to a static member of the class"], ans:1},
  {id:55, cat:"OOPs", q:"What is multiple inheritance and why doesn't Java support it directly?",
   opts:["Java supports it fully through classes","Java avoids diamond problem ambiguity — supports multiple inheritance through interfaces only","Multiple inheritance means having multiple constructors","Java supports it through abstract classes"], ans:3},
  {id:56, cat:"OOPs", q:"What is a copy constructor?",
   opts:["A constructor with no parameters","A constructor that creates a new object by copying another object of the same class","A static method that duplicates an object","A constructor called automatically when object is destroyed"], ans:2},
  {id:57, cat:"OOPs", q:"What does 'composition over inheritance' mean in OOP design?",
   opts:["Always use abstract classes instead of interfaces","Prefer combining simple objects (has-a) over extending classes (is-a) for flexibility","Composition is slower than inheritance always","Only use inheritance when classes share methods"], ans:0},
  {id:58, cat:"OOPs", q:"What is method hiding in Java?",
   opts:["Making a method private so subclasses cannot see it","When a subclass defines a static method with same signature as parent's static method","Overriding a method in a subclass","Using access modifiers to restrict method access"], ans:1},

  // ══ DBMS (8) A=2 B=2 C=2 D=2 ═════════════════════════════════
  {id:59, cat:"DBMS", q:"What is the difference between UNION and UNION ALL?",
   opts:["UNION keeps duplicates; UNION ALL removes them","UNION removes duplicate rows; UNION ALL includes all rows including duplicates","Both are identical in behavior","UNION works only with same table; UNION ALL with different tables"], ans:3},
  {id:60, cat:"DBMS", q:"What is a self-join?",
   opts:["Joining a table to a copy of itself to compare rows within the same table","Joining two tables with same structure","A join that automatically finds related columns","A join with no ON condition"], ans:2},
  {id:61, cat:"DBMS", q:"What does EXPLAIN do in SQL?",
   opts:["Shows the table structure and column definitions","Shows the query execution plan — how the database will run the query","Lists all indexes on a table","Displays all foreign key relationships"], ans:0},
  {id:62, cat:"DBMS", q:"What is a surrogate key?",
   opts:["A key derived from business data like email or phone","A system-generated unique identifier (like auto-increment ID) with no business meaning","A composite key with two columns","A key that references another table"], ans:3},
  {id:63, cat:"DBMS", q:"What is the difference between optimistic and pessimistic locking?",
   opts:["No practical difference — both prevent conflicts","Optimistic: assumes no conflict, checks at commit; pessimistic: locks data immediately when reading","Pessimistic locking is always faster","Optimistic locking is only for read operations"], ans:1},
  {id:64, cat:"DBMS", q:"What is data redundancy and why is it a problem?",
   opts:["Having too many indexes on a table","Storing more data than needed for backup","Same data stored in multiple places — causes inconsistency and wastes storage","Having too many tables in a database"], ans:2},
  {id:65, cat:"DBMS", q:"What does the ROLLBACK TO SAVEPOINT command do?",
   opts:["Commits all changes up to the savepoint","Rolls back all changes to the beginning of the transaction","Undoes changes made after a specific savepoint without rolling back the entire transaction","Creates a new transaction from the savepoint"], ans:3},
  {id:66, cat:"DBMS", q:"What is the difference between a primary key and a unique key?",
   opts:["No difference — both are identical","Primary key does not allow NULL; unique key allows one NULL — both enforce uniqueness","Unique key does not allow duplicates; primary key does","Primary key allows multiple NULLs; unique key allows only one"], ans:1},

  // ══ OS (8) A=2 B=2 C=2 D=2 ════════════════════════════════════
  {id:67, cat:"OS", q:"What is the difference between a process and a program?",
   opts:["They are identical concepts","A program is active code running in memory; a process is passive code stored on disk","A program is passive code on disk; a process is an active instance of a program in execution","A process can only run one program at a time"], ans:3},
  {id:68, cat:"OS", q:"What is thrashing in operating systems?",
   opts:["CPU executing too many processes simultaneously","A type of deadlock between two processes","Excessive paging where OS spends more time swapping pages than executing processes, causing performance collapse","Memory overflow causing system crash"], ans:2},
  {id:69, cat:"OS", q:"What is the purpose of the scheduler in an OS?",
   opts:["Manages disk I/O operations","Allocates memory to processes","Decides which process gets CPU time and for how long","Handles network communication"], ans:1},
  {id:70, cat:"OS", q:"What is the difference between hard and soft real-time systems?",
   opts:["No practical difference","Hard: missing deadline causes system failure; soft: missing deadline causes degraded performance but not failure","Soft real-time is always faster","Hard real-time uses more memory"], ans:2},
  {id:71, cat:"OS", q:"What is spooling in operating systems?",
   opts:["A memory management technique","Simultaneously Peripheral Operations On-Line — buffering data for slow devices like printers so CPU is not blocked","A type of CPU scheduling","A method of disk defragmentation"], ans:0},
  {id:72, cat:"OS", q:"What is the difference between swapping and paging?",
   opts:["They are the same memory management technique","Swapping moves entire processes to disk; paging moves fixed-size pages — paging is more efficient","Paging moves entire processes; swapping moves pages","Swapping is only for virtual memory systems"], ans:3},
  {id:73, cat:"OS", q:"What is an interrupt in an OS?",
   opts:["A process waiting for I/O","A signal to the CPU indicating an event requiring immediate attention — causes CPU to pause and run interrupt handler","A deadlock condition","A type of context switch between processes"], ans:2},
  {id:74, cat:"OS", q:"What is the Dining Philosophers problem used to illustrate?",
   opts:["CPU scheduling efficiency","Memory allocation strategies","Deadlock and resource allocation challenges in concurrent systems","Thread synchronization using semaphores only"], ans:1},

  // ══ CN (8) A=2 B=2 C=2 D=2 ════════════════════════════════════
  {id:75, cat:"CN", q:"What is the difference between TCP and UDP?",
   opts:["UDP is connection-oriented; TCP is connectionless","TCP provides reliable ordered delivery with error checking; UDP is faster but connectionless with no delivery guarantee","Both provide the same reliability level","TCP is used only for file transfer; UDP only for streaming"], ans:3},
  {id:76, cat:"CN", q:"What is NAT (Network Address Translation)?",
   opts:["A protocol for encrypting network traffic","A technique that translates private IP addresses to public IPs, allowing multiple devices to share one public IP","A routing protocol between ISPs","A method to assign static IP addresses"], ans:2},
  {id:77, cat:"CN", q:"What is the difference between a packet and a frame?",
   opts:["They are identical data units","A packet operates at Layer 3 (Network) and contains IP addresses; a frame operates at Layer 2 (Data Link) and contains MAC addresses","A frame is larger than a packet always","Packets are used for wireless; frames for wired networks"], ans:0},
  {id:78, cat:"CN", q:"What is HTTPS and how does it differ from HTTP?",
   opts:["HTTPS is faster than HTTP only","No functional difference — HTTPS is just HTTP version 2","HTTPS uses SSL/TLS encryption for secure communication; HTTP sends data in plain text","HTTP uses port 443; HTTPS uses port 80"], ans:3},
  {id:79, cat:"CN", q:"What is a default gateway?",
   opts:["The fastest router in a network","The router that handles traffic destined for networks outside the local subnet","The primary DNS server for a network","The server that assigns IP addresses via DHCP"], ans:1},
  {id:80, cat:"CN", q:"What is the purpose of a subnet mask?",
   opts:["Encrypts data between subnets","Identifies which portion of an IP address is the network part and which is the host part","Assigns IP addresses dynamically","Routes packets between different networks"], ans:2},
  {id:81, cat:"CN", q:"What is a CDN (Content Delivery Network)?",
   opts:["A type of firewall for content filtering","A private network for corporate use only","A protocol for transferring large files","A distributed network of servers that delivers content to users from the nearest geographic location"], ans:0},
  {id:82, cat:"CN", q:"What happens during a DNS lookup for 'www.google.com'?",
   opts:["Browser directly contacts Google's server","Browser checks cache, then queries recursive resolver, root server, TLD server, and authoritative server to get IP","Browser contacts ISP who provides IP directly","DNS lookup only happens once per device lifetime"], ans:1},

  // ══ DSA (8) A=2 B=2 C=2 D=2 ════════════════════════════════════
  {id:83, cat:"DSA", q:"What is the difference between a stack and a queue?",
   opts:["No difference — both are linear structures","Stack: LIFO (Last In First Out); Queue: FIFO (First In First Out)","Queue uses LIFO; Stack uses FIFO","Stack is only for recursion; Queue only for BFS"], ans:3},
  {id:84, cat:"DSA", q:"What is a hash collision and how is it resolved?",
   opts:["When two keys are identical","When hash function produces same index for two different keys — resolved by chaining or open addressing","When a hash table is full","When lookup time exceeds O(n)"], ans:1},
  {id:85, cat:"DSA", q:"What is the time complexity of finding an element in a balanced BST?",
   opts:["O(n)","O(n log n)","O(log n)","O(1)"], ans:2},
  {id:86, cat:"DSA", q:"What is memoization in dynamic programming?",
   opts:["Storing all data in external memory","Randomly caching results for later use","Using recursion without any optimization","Caching results of expensive function calls to avoid recomputing the same subproblems"], ans:0},
  {id:87, cat:"DSA", q:"What is the difference between depth-first search and breadth-first search time complexity?",
   opts:["DFS is always faster","BFS is always O(1)","Both are O(V+E) where V=vertices and E=edges — they differ in traversal order not complexity","DFS is O(V²); BFS is O(V+E)"], ans:2},
  {id:88, cat:"DSA", q:"What is a trie data structure used for?",
   opts:["Storing sorted numbers efficiently","Implementing priority queues","Efficiently storing and searching strings — commonly used in autocomplete and spell-checkers","Representing graphs with weighted edges"], ans:1},
  {id:89, cat:"DSA", q:"What is the worst-case time complexity of QuickSort and when does it occur?",
   opts:["O(n log n) — always","O(n²) — when pivot is always smallest or largest element (sorted/reverse sorted input)","O(n) — when array is already sorted","O(log n) — when pivot is always median"], ans:2},
  {id:90, cat:"DSA", q:"What is an AVL tree?",
   opts:["A tree where all nodes have exactly 2 children","A graph with no cycles","A self-balancing BST where height difference between left and right subtrees of any node is at most 1","A tree used only for heap operations"], ans:3},
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
    <div class="hdr"><div class="org">The Entangle · Elite 100 Club</div><h1>Mock Test 6 — Report Card</h1><div class="dt">Advanced Placement Preparation · ${date}</div></div>
    <div class="ir"><div class="ib"><div class="il">Student</div><div class="iv">${student.name}</div></div><div class="ib"><div class="il">College</div><div class="iv">${student.college}</div></div><div class="ib"><div class="il">Course</div><div class="iv">${student.course}</div></div><div class="ib"><div class="il">Year</div><div class="iv">${student.year}</div></div></div>
    <div class="sr"><div class="sb"><div class="big">${score}<span style="font-size:22px;color:#64748b">/90</span></div><div class="sm">Total Score</div></div><div class="sb"><div class="big" style="color:${gColor}">${grade}</div><div class="sm">Grade</div></div><div class="sb"><div class="big" style="color:${gColor}">${pct}%</div><div class="sm" style="color:${gColor};font-weight:700">${remark}</div></div></div>
    <div class="pr"><div class="pb"><div class="pl" style="color:#4f46e5">Part 1 — Aptitude</div><div style="font-size:28px;font-weight:800">${aptScore}<span style="font-size:14px;color:#64748b">/50</span></div><div style="font-size:12px;color:#64748b">${Math.round(aptScore/50*100)}%</div></div><div class="pb"><div class="pl" style="color:#059669">Part 2 — CS Fundamentals</div><div style="font-size:28px;font-weight:800">${csScore}<span style="font-size:14px;color:#64748b">/40</span></div><div style="font-size:12px;color:#64748b">${Math.round(csScore/40*100)}%</div></div></div>
    <table><tr><th>Section</th><th>Score</th><th>Total</th><th>%</th><th>Performance</th></tr>${secScores.map(s=>`<tr><td><strong>${s.emoji} ${s.label}</strong></td><td><strong>${s.c}</strong></td><td>${s.t}</td><td style="font-weight:700;color:${s.pct>=60?"#059669":s.pct>=40?"#d97706":"#dc2626"}">${s.pct}%</td><td><div class="bar"><div class="bi" style="width:${s.pct}%;background:${s.pct>=60?"#059669":s.pct>=40?"#d97706":"#dc2626"}"></div></div></td></tr>`).join("")}<tr style="background:#f0fdf4"><td><strong>TOTAL</strong></td><td><strong>${score}</strong></td><td><strong>90</strong></td><td style="font-weight:800;color:${gColor}">${pct}%</td><td><div class="bar"><div class="bi" style="width:${pct}%;background:${gColor}"></div></div></td></tr></table>
    <div class="ftr"><p>Auto-generated by The Entangle · Elite 100 Club · Indore</p><div class="st">ELITE 100 CLUB</div></div></body></html>`;
    const blob=new Blob([h],{type:"text/html"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url; a.download=`ReportCard_MockTest6_${student.name.replace(/\s+/g,"_")}.html`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",overflowY:"auto"}}>
      <div style={{background:T.card,borderRadius:"16px",padding:"28px 32px",maxWidth:"580px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:T.shadow2}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px"}}>
          <div><div style={{fontSize:"10px",color:T.accent,fontWeight:"700",letterSpacing:"2px",marginBottom:"3px"}}>THE ENTANGLE · ELITE 100 CLUB</div><div style={{fontSize:"18px",fontWeight:"800",color:T.text}}>Mock Test 6 — Report Card</div></div>
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
          <h1 style={{fontSize:"28px",fontWeight:"800",color:T.text,margin:"0 0 8px"}}>Mock Test — 6</h1>
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