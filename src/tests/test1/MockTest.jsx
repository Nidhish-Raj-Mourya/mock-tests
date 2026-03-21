import { useState, useEffect, useRef } from "react";

// ─── QUESTION BANK ────────────────────────────────────────────────────────────
const aptitudeQuestions = [
  // ══ QUANTITATIVE APTITUDE (10) ════════════════════════════════
  { id:1,  cat:"Quant",   q:"What is 25% of 480?", opts:["100","110","120","130"], ans:2 },
  { id:2,  cat:"Quant",   q:"A number when divided by 6 gives quotient 12 and remainder 3. Find the number.", opts:["72","75","78","81"], ans:1 },
  { id:3,  cat:"Quant",   q:"Speed of a train is 72 km/h. Convert to m/s.", opts:["18 m/s","20 m/s","22 m/s","24 m/s"], ans:0 },
  { id:4,  cat:"Quant",   q:"A can do a piece of work in 12 days, B in 18 days. In how many days will both together complete it?", opts:["6 days","7.2 days","8 days","9 days"], ans:1 },
  { id:5,  cat:"Quant",   q:"A sum of Rs. 12,000 is invested at 10% p.a. compound interest for 2 years. Find the amount.", opts:["Rs. 14,400","Rs. 14,520","Rs. 13,200","Rs. 14,640"], ans:1 },
  { id:6,  cat:"Quant",   q:"A train 150 m long passes a pole in 15 seconds. How long will it take to pass a platform 300 m long?", opts:["30 s","40 s","45 s","50 s"], ans:2 },
  { id:7,  cat:"Quant",   q:"Two numbers are in the ratio 3:5. Their LCM is 120. Find their sum.", opts:["56","64","72","80"], ans:1 },
  { id:8,  cat:"Quant",   q:"A merchant marks goods 40% above cost price and gives a 25% discount. Find profit or loss %.", opts:["2% loss","5% profit","4% profit","No profit no loss"], ans:1 },
  { id:9,  cat:"Quant",   q:"A cistern has a leak that empties it in 8 hrs. A tap fills it in 6 hrs. If both are open together, when will it be full?", opts:["18 hrs","24 hrs","20 hrs","16 hrs"], ans:1 },
  { id:10, cat:"Quant",   q:"In how many ways can 5 boys and 3 girls be seated in a row such that no two girls are adjacent?", opts:["14400","28800","43200","2880"], ans:0 },
  // ══ LOGICAL REASONING (10) ════════════════════════════════════
  { id:11, cat:"Logical", q:"Complete the series: 3, 9, 27, 81, ?", opts:["162","243","256","324"], ans:1 },
  { id:12, cat:"Logical", q:"If CAT = 24 and DOG = 26 in a code (sum of letter positions), what is APE?", opts:["22","24","20","18"], ans:0 },
  { id:13, cat:"Logical", q:"Pointing to a photograph, Ravi says 'She is the daughter of the only son of my grandfather.' How is the girl related to Ravi?", opts:["Sister","Niece","Cousin","Daughter"], ans:0 },
  { id:14, cat:"Logical", q:"All managers are leaders. Some leaders are visionaries. Which conclusion is definitely true?", opts:["All managers are visionaries","Some managers are visionaries","No manager is a visionary","Some visionaries are managers"], ans:3 },
  { id:15, cat:"Logical", q:"A clock gains 5 minutes every hour. Set correct at 8:00 AM. What time does it show at 8:00 PM the same day?", opts:["8:50 PM","9:00 PM","9:30 PM","10:00 PM"], ans:1 },
  { id:16, cat:"Logical", q:"Five persons P, Q, R, S, T sit in a row. P is to the right of Q. T is not at either end. R is at extreme left. S is between T and P. Who is at extreme right?", opts:["P","Q","S","T"], ans:0 },
  { id:17, cat:"Logical", q:"Find the odd one out: 8, 27, 64, 125, 196", opts:["8","27","125","196"], ans:3 },
  { id:18, cat:"Logical", q:"In a code: MONKEY = XDJMNL. Using the same logic, what is TIGER?", opts:["QDFTH","SHFHT","RGEQI","UJHFS"], ans:0 },
  { id:19, cat:"Logical", q:"A is 3 ranks ahead of B. C is 2 ranks behind D. B and D have the same rank. A is 5th from top. What is C's rank from top?", opts:["9th","10th","8th","11th"], ans:1 },
  { id:20, cat:"Logical", q:"Statements: Some phones are tablets. All tablets are computers. No computer is a TV.\nConclusion I: No phone is a TV.\nConclusion II: Some computers are phones.\nWhich follow(s)?", opts:["Only I","Only II","Both I and II","Neither"], ans:1 },
  // ══ VERBAL ABILITY (10) ═══════════════════════════════════════
  { id:21, cat:"Verbal",  q:"Choose the synonym of DILIGENT:", opts:["Lazy","Hardworking","Careless","Reckless"], ans:1 },
  { id:22, cat:"Verbal",  q:"Choose the antonym of VERBOSE:", opts:["Talkative","Wordy","Concise","Fluent"], ans:2 },
  { id:23, cat:"Verbal",  q:"Fill in the blank:\n'Neither the students nor the teacher ___ present today.'", opts:["were","are","was","have been"], ans:2 },
  { id:24, cat:"Verbal",  q:"Choose the correctly spelled word:", opts:["Entrepreneurr","Entrepreneur","Entreprenueur","Entrepenuer"], ans:1 },
  { id:25, cat:"Verbal",  q:"Meaning of the idiom 'Burn the midnight oil':", opts:["Set things on fire","Work late into the night","Waste resources","Cook food at night"], ans:1 },
  { id:26, cat:"Verbal",  q:"Identify the error:\n'The committee have (A) reached (B) their (C) decision unanimously (D).'", opts:["A — 'have' should be 'has'","B — 'reached' is incorrect","C — 'their' should be 'its'","D — No error"], ans:0 },
  { id:27, cat:"Verbal",  q:"Choose the best word:\n'The professor's lecture was so ___ that most students struggled to stay awake.'", opts:["stimulating","provocative","soporific","compelling"], ans:2 },
  { id:28, cat:"Verbal",  q:"Choose the pair with a similar relationship to PERJURY : TESTIMONY:", opts:["Forgery : Signature","Slander : Reputation","Fraud : Trust","Plagiarism : Writing"], ans:3 },
  { id:29, cat:"Verbal",  q:"Choose the correct version:\n'Had I known about the meeting, I would have came.'", opts:["Had I known, I would have come","Had I knew, I would have come","If I had known, I would have came","Had I know, I would come"], ans:0 },
  { id:30, cat:"Verbal",  q:"Choose the word closest in meaning to EQUIVOCATE:", opts:["Clarify","Prevaricate","Elaborate","Assert"], ans:1 },
  // ══ DATA INTERPRETATION (10) ══════════════════════════════════
  { id:31, cat:"DI",      q:"Revenue Table (Rs. Cr): 2019→120, 2020→96, 2021→150, 2022→180, 2023→210\n\nTotal revenue from 2019 to 2023?", opts:["Rs. 726 Cr","Rs. 746 Cr","Rs. 756 Cr","Rs. 766 Cr"], ans:2 },
  { id:32, cat:"DI",      q:"Revenue Table (Rs. Cr): 2019→120, 2020→96, 2021→150, 2022→180, 2023→210\n\nIn which year was revenue the lowest?", opts:["2019","2020","2021","2022"], ans:1 },
  { id:33, cat:"DI",      q:"Revenue Table (Rs. Cr): 2019→120, 2020→96, 2021→150, 2022→180, 2023→210\n\n% increase in revenue from 2020 to 2021?", opts:["50%","56.25%","62.5%","45%"], ans:1 },
  { id:34, cat:"DI",      q:"Revenue Table (Rs. Cr): 2019→120, 2020→96, 2021→150, 2022→180, 2023→210\n\nAverage annual revenue from 2019 to 2023?", opts:["Rs. 148 Cr","Rs. 150 Cr","Rs. 151.2 Cr","Rs. 155 Cr"], ans:2 },
  { id:35, cat:"DI",      q:"Revenue Table (Rs. Cr): 2019→120, 2020→96, 2021→150, 2022→180, 2023→210\n\nRevenue in 2023 is what % more than in 2019?", opts:["70%","72%","75%","80%"], ans:2 },
  { id:36, cat:"DI",      q:"Dept Headcount (Total=400): Eng:35%, Sales:20%, HR:10%, Finance:15%, Ops:20%\n\nHow many employees are in Engineering?", opts:["120","130","140","150"], ans:2 },
  { id:37, cat:"DI",      q:"Dept Headcount (Total=400): Eng:35%, Sales:20%, HR:10%, Finance:15%, Ops:20%\n\nHow many more employees does Engineering have than HR?", opts:["80","90","100","110"], ans:2 },
  { id:38, cat:"DI",      q:"Dept Headcount (Total=400): Eng:35%, Sales:20%, HR:10%, Finance:15%, Ops:20%\n\nIf 20 new employees join Finance, what is Finance's new % of total headcount?", opts:["16.9%","17.5%","18.2%","19%"], ans:0 },
  { id:39, cat:"DI",      q:"Dept Headcount (Total=400): Eng:35%, Sales:20%, HR:10%, Finance:15%, Ops:20%\n\nRatio of (Sales + Ops) to (Eng + Finance)?", opts:["4:5","8:11","1:1","10:11"], ans:1 },
  { id:40, cat:"DI",      q:"Revenue Table (Rs. Cr): 2019→120, 2020→96, 2021→150, 2022→180, 2023→210\n\nIf revenue grows at same absolute increment as 2022 to 2023 each year, what will it be in 2025?", opts:["Rs. 240 Cr","Rs. 270 Cr","Rs. 280 Cr","Rs. 300 Cr"], ans:1 },
  // ══ ANALYTICAL REASONING (10) ════════════════════════════════
  { id:41, cat:"AR",      q:"All roses are flowers. Some flowers fade quickly. Which is definitely true?", opts:["All roses fade quickly","Some roses may fade quickly","No roses fade quickly","All flowers are roses"], ans:1 },
  { id:42, cat:"AR",      q:"A box has red, blue, green balls in ratio 2:3:5. Total 80 balls. How many green balls?", opts:["16","24","32","40"], ans:3 },
  { id:43, cat:"AR",      q:"It takes 5 machines 5 minutes to make 5 items. How long will 100 machines take to make 100 items?", opts:["100 min","50 min","10 min","5 min"], ans:3 },
  { id:44, cat:"AR",      q:"In a class of 100, 60% are boys. 40% of boys and 50% of girls play sport. How many students play sport?", opts:["42","44","46","48"], ans:2 },
  { id:45, cat:"AR",      q:"You have a 3-litre and a 5-litre jug. How do you measure exactly 4 litres?", opts:["Fill 5L, pour into 3L, empty 3L, pour remainder, fill 5L, top up 3L — 4L left","Fill 3L twice into 5L; 1L remains, refill 3L, pour into 5L = 4L","Both A and B work","Neither works"], ans:2 },
  { id:46, cat:"AR",      q:"6 people shake hands with each other exactly once. Total handshakes?", opts:["12","15","18","21"], ans:1 },
  { id:47, cat:"AR",      q:"A is twice as old as B was when A was as old as B is now. Sum of their ages is 63. Find A's age.", opts:["36","38","40","42"], ans:0 },
  { id:48, cat:"AR",      q:"'All politicians are liars. Ram is not a liar.' Which conclusion is logically valid?", opts:["Ram is a politician","Ram is not a politician","Some politicians are honest","Ram is always truthful"], ans:1 },
  { id:49, cat:"AR",      q:"A train leaves Delhi at 6 AM at 60 km/h. Another leaves Agra (200 km away) at 8 AM toward Delhi at 80 km/h. At what time do they meet?", opts:["9:20 AM","9:30 AM","9:45 AM","10:00 AM"], ans:0 },
  { id:50, cat:"AR",      q:"In how many ways can the letters of the word MISSISSIPPI be arranged?", opts:["34650","11!","50400","69300"], ans:0 },
];

const csQuestions = [
  // ══ OOPs (8) ══════════════════════════════════════════════════
  { id:51, cat:"OOPs", q:"Which OOP principle allows a class to inherit properties and methods from another class?", opts:["Encapsulation","Polymorphism","Inheritance","Abstraction"], ans:2 },
  { id:52, cat:"OOPs", q:"What is the output?\nclass A { int x = 5; }\nclass B extends A { int x = 10; }\nA obj = new B();\nSystem.out.println(obj.x);", opts:["5","10","Compile error","Runtime error"], ans:0, code:true },
  { id:53, cat:"OOPs", q:"Which concept bundles data with methods and prevents direct access to internal state?", opts:["Inheritance","Abstraction","Encapsulation","Polymorphism"], ans:2 },
  { id:54, cat:"OOPs", q:"In Java, what is method overriding?", opts:["Two methods in same class, same name, different parameters","Subclass provides its own implementation of a parent class method","Hiding parent method using the static keyword","None of the above"], ans:1 },
  { id:55, cat:"OOPs", q:"Which keyword prevents a method from being overridden in Java?", opts:["static","abstract","final","private"], ans:2 },
  { id:56, cat:"OOPs", q:"What is true about abstract classes vs interfaces in Java (pre Java 8)?", opts:["Abstract class can have constructors; interface cannot","Interface supports multiple inheritance; abstract class does not","Abstract class can have concrete methods; interface has only abstract methods","All of the above"], ans:3 },
  { id:57, cat:"OOPs", q:"What will this C++ code output?\nclass Base {\npublic:\n  virtual void show() { cout << \"Base\"; }\n};\nclass Derived : public Base {\npublic:\n  void show() { cout << \"Derived\"; }\n};\nBase *b = new Derived();\nb->show();", opts:["Base","Derived","Compile error","Runtime error"], ans:1, code:true },
  { id:58, cat:"OOPs", q:"Which SOLID principle states 'a class should have only one reason to change'?", opts:["Open/Closed Principle","Liskov Substitution Principle","Single Responsibility Principle","Dependency Inversion Principle"], ans:2 },
  // ══ DBMS (8) ══════════════════════════════════════════════════
  { id:59, cat:"DBMS", q:"Which SQL command is used to retrieve data from a table?", opts:["INSERT","UPDATE","SELECT","DELETE"], ans:2 },
  { id:60, cat:"DBMS", q:"What does a PRIMARY KEY constraint ensure?", opts:["Allows duplicate values","Allows NULL values","Uniquely identifies each row with no NULLs","Multiple primary keys per table are allowed"], ans:2 },
  { id:61, cat:"DBMS", q:"What does this query return?\nSELECT COUNT(*) FROM Employees WHERE Salary > 50000;", opts:["Sum of salaries above 50000","Number of employees with salary above 50000","Average salary","List of employee names"], ans:1, code:true },
  { id:62, cat:"DBMS", q:"Which normal form eliminates partial dependencies?", opts:["1NF","2NF","3NF","BCNF"], ans:1 },
  { id:63, cat:"DBMS", q:"Key difference between DELETE and TRUNCATE in SQL?", opts:["No difference","DELETE removes specific rows with WHERE; TRUNCATE removes all rows and is not easily rolled back","TRUNCATE can use WHERE clause; DELETE cannot","DELETE is DDL; TRUNCATE is DML"], ans:1 },
  { id:64, cat:"DBMS", q:"Which JOIN returns all rows from both tables, filling unmatched rows with NULLs?", opts:["INNER JOIN","LEFT JOIN","RIGHT JOIN","FULL OUTER JOIN"], ans:3 },
  { id:65, cat:"DBMS", q:"In ACID properties, what does 'Isolation' mean?", opts:["Data is saved permanently after commit","All operations execute completely or not at all","Concurrent transactions do not interfere with each other","Data remains consistent before and after transaction"], ans:2 },
  { id:66, cat:"DBMS", q:"What will this query return?\nSELECT dept, AVG(salary) FROM emp\nGROUP BY dept\nHAVING AVG(salary) > 60000;", opts:["All departments","Departments where average salary exceeds 60000","Employees earning more than 60000","Error — HAVING cannot use AVG"], ans:1, code:true },
  // ══ OS (8) ════════════════════════════════════════════════════
  { id:67, cat:"OS",   q:"What is the primary function of an Operating System?", opts:["Provide internet access","Manage hardware and software resources","Compile programs","Permanently store user data"], ans:1 },
  { id:68, cat:"OS",   q:"Which CPU scheduling algorithm gives priority to the process that arrives first?", opts:["SJF","Round Robin","FCFS","Priority Scheduling"], ans:2 },
  { id:69, cat:"OS",   q:"What is a deadlock in an operating system?", opts:["Process consuming 100% CPU","Two or more processes waiting indefinitely for resources held by each other","A memory overflow error","A kernel panic"], ans:1 },
  { id:70, cat:"OS",   q:"Which page replacement algorithm replaces the page not used for the longest period?", opts:["FIFO","LRU","Optimal","Clock"], ans:1 },
  { id:71, cat:"OS",   q:"Key difference between a process and a thread?", opts:["No difference","A thread is lightweight and shares process memory; a process has its own memory space","A process can only have one thread","Threads each have their own PCB"], ans:1 },
  { id:72, cat:"OS",   q:"In the Banker's Algorithm, the system is in a safe state when:", opts:["No process is waiting","There exists at least one safe sequence of process execution","All resources are fully allocated","A deadlock has been detected"], ans:1 },
  { id:73, cat:"OS",   q:"P1 (Max:9, Alloc:3), P2 (Max:6, Alloc:2), P3 (Max:8, Alloc:2). Available = 3.\nIs the system in a safe state?", opts:["Yes — safe sequence: P2, P1, P3","Yes — safe sequence: P3, P1, P2","No — system is in deadlock","Cannot determine without total resources"], ans:0 },
  { id:74, cat:"OS",   q:"Which statement is TRUE about virtual memory?", opts:["It physically increases RAM size","Allows processes larger than physical memory to run using disk as extension","Replaces the need for CPU cache","Only applicable to 64-bit operating systems"], ans:1 },
  // ══ CN (8) ════════════════════════════════════════════════════
  { id:75, cat:"CN",   q:"What is the main function of IP (Internet Protocol)?", opts:["Route data packets across networks","Encrypt data in transit","Assign domain names to websites","Establish secure connections"], ans:0 },
  { id:76, cat:"CN",   q:"Which OSI layer is responsible for end-to-end communication, error recovery, and flow control?", opts:["Network Layer","Data Link Layer","Transport Layer","Session Layer"], ans:2 },
  { id:77, cat:"CN",   q:"Primary difference between TCP and UDP?", opts:["TCP is faster; UDP is reliable","TCP is connection-oriented and reliable; UDP is connectionless and faster","UDP guarantees delivery; TCP does not","They are functionally identical"], ans:1 },
  { id:78, cat:"CN",   q:"What is the default subnet mask for a Class C IP address?", opts:["255.0.0.0","255.255.0.0","255.255.255.0","255.255.255.255"], ans:2 },
  { id:79, cat:"CN",   q:"What does DNS do?", opts:["Encrypts internet traffic","Translates domain names to IP addresses","Assigns dynamic IPs to hosts","Manages routing between networks"], ans:1 },
  { id:80, cat:"CN",   q:"Which protocol is used to send emails from a client to a mail server?", opts:["FTP","HTTP","SMTP","POP3"], ans:2 },
  { id:81, cat:"CN",   q:"Host A (192.168.1.10/24) wants to communicate with Host B (192.168.2.10/24). Which device is required?", opts:["Switch","Hub","Router","Bridge"], ans:2 },
  { id:82, cat:"CN",   q:"What is the correct sequence of a TCP three-way handshake?", opts:["SYN → ACK → SYN-ACK","SYN → SYN-ACK → ACK","ACK → SYN → SYN-ACK","SYN-ACK → SYN → ACK"], ans:1 },
  // ══ DSA (8) ═══════════════════════════════════════════════════
  { id:83, cat:"DSA",  q:"What is the time complexity of binary search on a sorted array of n elements?", opts:["O(n)","O(log n)","O(n log n)","O(1)"], ans:1 },
  { id:84, cat:"DSA",  q:"Which data structure follows LIFO (Last In First Out) order?", opts:["Queue","Stack","Linked List","Tree"], ans:1 },
  { id:85, cat:"DSA",  q:"What is the worst-case time complexity of QuickSort?", opts:["O(n log n)","O(n²)","O(n)","O(log n)"], ans:1 },
  { id:86, cat:"DSA",  q:"In a singly linked list, what is the time complexity of deleting a node given only a pointer to that node (not the previous)?", opts:["O(1)","O(n)","O(log n)","Not possible without previous node"], ans:0 },
  { id:87, cat:"DSA",  q:"Which traversal of a Binary Search Tree produces elements in sorted ascending order?", opts:["Preorder","Postorder","Inorder","Level order"], ans:2 },
  { id:88, cat:"DSA",  q:"What is the space complexity of Merge Sort?", opts:["O(1)","O(log n)","O(n)","O(n²)"], ans:2 },
  { id:89, cat:"DSA",  q:"What is the time complexity of Dijkstra's algorithm using a Min Heap?", opts:["O(V²)","O((V + E) log V)","O(V log E)","O(E + V)"], ans:1 },
  { id:90, cat:"DSA",  q:"Which of the following is NP-Hard (no known polynomial-time solution)?", opts:["Binary Search","Merge Sort","Travelling Salesman Problem (optimal tour)","BFS traversal"], ans:2 },
];

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const APT_SECS = [
  { key:"Quant",   label:"Quantitative Aptitude",  emoji:"🔢", color:"#4f46e5", count:10 },
  { key:"Logical", label:"Logical Reasoning",      emoji:"🧩", color:"#d97706", count:10 },
  { key:"Verbal",  label:"Verbal Ability",         emoji:"📝", color:"#059669", count:10 },
  { key:"DI",      label:"Data Interpretation",    emoji:"📊", color:"#0891b2", count:10 },
  { key:"AR",      label:"Analytical Reasoning",   emoji:"🧠", color:"#db2777", count:10 },
];
const CS_SECS = [
  { key:"OOPs",    label:"OOPs (Java/C++)",        emoji:"💻", color:"#ea580c", count:8 },
  { key:"DBMS",    label:"DBMS & SQL",             emoji:"🗄️", color:"#7c3aed", count:8 },
  { key:"OS",      label:"Operating Systems",      emoji:"⚙️", color:"#0d9488", count:8 },
  { key:"CN",      label:"Computer Networks",      emoji:"🌐", color:"#2563eb", count:8 },
  { key:"DSA",     label:"DSA",                    emoji:"🌲", color:"#dc2626", count:8 },
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
  bg:      "#f1f5f9",
  page:    "#ffffff",
  card:    "#ffffff",
  border:  "#e2e8f0",
  border2: "#cbd5e1",
  accent:  "#4f46e5",
  accentL: "#eef2ff",
  text:    "#0f172a",
  sub:     "#475569",
  muted:   "#94a3b8",
  green:   "#059669",
  greenL:  "#ecfdf5",
  red:     "#dc2626",
  redL:    "#fef2f2",
  yellow:  "#d97706",
  shadow:  "0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)",
  shadow2: "0 2px 8px rgba(0,0,0,0.10), 0 8px 32px rgba(0,0,0,0.08)",
};
const bodyFont = "'Segoe UI', 'Inter', system-ui, sans-serif";
const monoFont = "'Fira Code', 'Courier New', monospace";
const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

// ─── REPORT CARD ─────────────────────────────────────────────────────────────
function ReportCard({ student, aptAnswers, csAnswers, onClose }) {
  const aptScore = aptitudeQuestions.reduce((s,q,i)=>s+(aptAnswers[i]===q.ans?1:0),0);
  const csScore  = csQuestions.reduce((s,q,i)=>s+(csAnswers[i]===q.ans?1:0),0);
  const total    = aptitudeQuestions.length + csQuestions.length;
  const score    = aptScore + csScore;
  const pct      = Math.round(score/total*100);
  const grade    = pct>=80?"A":pct>=65?"B":pct>=50?"C":pct>=35?"D":"F";
  const gColor   = pct>=80?"#059669":pct>=65?"#4f46e5":pct>=50?"#d97706":pct>=35?"#ea580c":"#dc2626";
  const remark   = pct>=80?"Outstanding":pct>=65?"Good":pct>=50?"Average":pct>=35?"Below Average":"Needs Improvement";
  const date     = new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"});

  const secScores = ALL_SECS.map(sec => {
    const isApt = APT_SECS.find(s=>s.key===sec.key);
    const qs    = isApt ? aptitudeQuestions.filter(q=>q.cat===sec.key) : csQuestions.filter(q=>q.cat===sec.key);
    const ans   = isApt ? aptAnswers : csAnswers;
    const base  = isApt ? aptitudeQuestions : csQuestions;
    const c     = qs.filter(q=>ans[base.indexOf(q)]===q.ans).length;
    return { ...sec, c, t:qs.length, pct:Math.round(c/qs.length*100) };
  });

  const handlePrint = () => {
    const html = `<!DOCTYPE html><html><head><title>Report Card – ${student.name}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#0f172a;padding:36px;font-size:14px}
      .header{text-align:center;padding-bottom:20px;margin-bottom:24px;border-bottom:2px solid #4f46e5}
      .org{font-size:11px;font-weight:700;color:#4f46e5;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px}
      h1{font-size:24px;font-weight:800;margin-bottom:4px}
      .date{font-size:12px;color:#64748b}
      .info-row{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:24px}
      .info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 14px}
      .info-label{font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
      .info-value{font-size:14px;font-weight:700}
      .score-row{display:flex;justify-content:center;align-items:center;gap:48px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px}
      .score-box{text-align:center}
      .big{font-size:52px;font-weight:900;line-height:1}
      .small{font-size:13px;color:#64748b;margin-top:4px}
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
      <h1>Mock Test Report Card</h1>
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
      <div class="part-box">
        <div class="part-label" style="color:#4f46e5">Part 1 — Aptitude</div>
        <div style="font-size:28px;font-weight:800">${aptScore}<span style="font-size:14px;color:#64748b">/${aptitudeQuestions.length}</span></div>
        <div style="font-size:12px;color:#64748b;margin-top:2px">${Math.round(aptScore/aptitudeQuestions.length*100)}%</div>
      </div>
      <div class="part-box">
        <div class="part-label" style="color:#059669">Part 2 — CS Fundamentals</div>
        <div style="font-size:28px;font-weight:800">${csScore}<span style="font-size:14px;color:#64748b">/${csQuestions.length}</span></div>
        <div style="font-size:12px;color:#64748b;margin-top:2px">${Math.round(csScore/csQuestions.length*100)}%</div>
      </div>
    </div>
    <table>
      <tr><th>Section</th><th>Score</th><th>Total</th><th>%</th><th>Bar</th></tr>
      ${secScores.map(s=>`<tr>
        <td><strong>${s.emoji} ${s.label}</strong></td>
        <td><strong>${s.c}</strong></td><td>${s.t}</td>
        <td style="font-weight:700;color:${s.pct>=60?"#059669":s.pct>=40?"#d97706":"#dc2626"}">${s.pct}%</td>
        <td><div class="bar"><div class="bar-inner" style="width:${s.pct}%;background:${s.pct>=60?"#059669":s.pct>=40?"#d97706":"#dc2626"}"></div></div></td>
      </tr>`).join("")}
      <tr style="background:#f0fdf4"><td><strong>TOTAL</strong></td><td><strong>${score}</strong></td><td><strong>${total}</strong></td><td style="font-weight:800;color:${gColor}">${pct}%</td><td><div class="bar"><div class="bar-inner" style="width:${pct}%;background:${gColor}"></div></div></td></tr>
    </table>
    <div class="footer">
      <p>Auto-generated by The Entangle · Elite 100 Club Mock Test System · Indore</p>
      <div class="stamp">ELITE 100 CLUB</div>
    </div>
    </body></html>`;

    // Use blob URL — works reliably in all environments including sandboxed iframes
    const blob = new Blob([html], { type: "text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `ReportCard_${student.name.replace(/\s+/g,"_")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",overflowY:"auto"}}>
      <div style={{background:T.card,borderRadius:"16px",padding:"28px 32px",maxWidth:"580px",width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:T.shadow2}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px"}}>
          <div>
            <div style={{fontSize:"10px",color:T.accent,fontWeight:"700",letterSpacing:"2px",marginBottom:"3px"}}>THE ENTANGLE · ELITE 100 CLUB</div>
            <div style={{fontSize:"18px",fontWeight:"800",color:T.text}}>Report Card Preview</div>
          </div>
          <button onClick={onClose} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.sub,padding:"6px 12px",borderRadius:"7px",fontFamily:bodyFont,cursor:"pointer",fontSize:"13px"}}>✕</button>
        </div>

        {/* Info */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"8px",marginBottom:"18px"}}>
          {[["Student",student.name],["College",student.college],["Course",student.course],["Year",student.year]].map(([l,v])=>(
            <div key={l} style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:"8px",padding:"10px 12px"}}>
              <div style={{fontSize:"10px",color:T.muted,fontWeight:"700",textTransform:"uppercase",letterSpacing:"1px",marginBottom:"2px"}}>{l}</div>
              <div style={{fontSize:"12px",fontWeight:"700",color:T.text}}>{v}</div>
            </div>
          ))}
        </div>

        {/* Score */}
        <div style={{background:T.accentL,border:`1px solid #c7d2fe`,borderRadius:"12px",padding:"18px",marginBottom:"18px",display:"flex",justifyContent:"space-around",textAlign:"center"}}>
          <div><div style={{fontSize:"42px",fontWeight:"900",color:T.text,lineHeight:1}}>{score}<span style={{fontSize:"17px",color:T.muted}}>/{total}</span></div><div style={{fontSize:"11px",color:T.sub,marginTop:"3px"}}>Total Score</div></div>
          <div><div style={{fontSize:"48px",fontWeight:"900",color:gColor,lineHeight:1}}>{grade}</div><div style={{fontSize:"11px",color:T.sub,marginTop:"3px"}}>Grade</div></div>
          <div><div style={{fontSize:"34px",fontWeight:"800",color:gColor,lineHeight:1}}>{pct}%</div><div style={{fontSize:"12px",color:gColor,fontWeight:"700",marginTop:"3px"}}>{remark}</div></div>
        </div>

        {/* Part split */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"18px"}}>
          <div style={{background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:"10px",padding:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:T.accent,letterSpacing:"1px",marginBottom:"6px"}}>PART 1 — APTITUDE</div>
            <div style={{fontSize:"26px",fontWeight:"800",color:T.text}}>{aptScore}<span style={{fontSize:"13px",color:T.muted}}>/{aptitudeQuestions.length}</span></div>
            <div style={{fontSize:"12px",color:T.sub}}>{Math.round(aptScore/aptitudeQuestions.length*100)}%</div>
          </div>
          <div style={{background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:"10px",padding:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:T.green,letterSpacing:"1px",marginBottom:"6px"}}>PART 2 — CS FUNDAMENTALS</div>
            <div style={{fontSize:"26px",fontWeight:"800",color:T.text}}>{csScore}<span style={{fontSize:"13px",color:T.muted}}>/{csQuestions.length}</span></div>
            <div style={{fontSize:"12px",color:T.sub}}>{Math.round(csScore/csQuestions.length*100)}%</div>
          </div>
        </div>

        {/* Section scores */}
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

        <button onClick={handlePrint} style={{width:"100%",background:T.accent,color:"#fff",border:"none",padding:"13px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"15px",fontWeight:"700",cursor:"pointer"}}>
          ⬇️ Download Report Card
        </button>
        <div style={{fontSize:"11px",color:T.muted,textAlign:"center",marginTop:"7px"}}>Downloads as HTML file → Open in browser → Print / Save as PDF</div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function MockTest() {
  const [phase,      setPhase]      = useState("onboard"); // onboard | apt | apt_done | cs | result
  const [student,    setStudent]    = useState({ name:"", college:"", course:"", year:"" });
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

  const isApt   = phase === "apt";
  const qs      = isApt ? aptitudeQuestions : csQuestions;
  const secs    = isApt ? APT_SECS : CS_SECS;
  const answers = isApt ? aptAnswers : csAnswers;
  const setAns  = isApt ? setAptAnswers : setCsAnswers;

  useEffect(()=>{
    if(phase==="apt"||phase==="cs"){
      timerRef.current=setInterval(()=>{
        setTimeLeft(t=>{
          if(t<=1){
            clearInterval(timerRef.current);
            if(phase==="apt") setPhase("apt_done");
            else setPhase("result");
            return 0;
          }
          return t-1;
        });
      },1000);
    }
    return ()=>clearInterval(timerRef.current);
  },[phase]);

  const validate = () => {
    const e={};
    if(!student.name.trim()) e.name="Name is required";
    if(!student.college.trim()) e.college="College name is required";
    if(!student.course) e.course="Please select your course";
    if(!student.year) e.year="Please select your year";
    setErrors(e);
    return Object.keys(e).length===0;
  };

  const startPart = (part) => {
    setCurrent(0); setSelected(null);
    setTimeLeft(part==="apt"?30*60:20*60);
    setPhase(part);
  };

  const transition = cb => { setVisible(false); setTimeout(()=>{ setVisible(true); cb(); },150); };

  const handleNext = () => {
    if(selected===null) return;
    setAns(a=>({...a,[current]:selected}));
    setSelected(null);
    transition(()=>{
      if(current+1>=qs.length){
        clearInterval(timerRef.current);
        if(isApt) setPhase("apt_done"); else setPhase("result");
      } else setCurrent(c=>c+1);
    });
  };

  const handleSkip = () => {
    setSelected(null);
    transition(()=>{
      if(current+1>=qs.length){
        clearInterval(timerRef.current);
        if(isApt) setPhase("apt_done"); else setPhase("result");
      } else setCurrent(c=>c+1);
    });
  };

  const jumpTo = i => { setSelected(answers[i]??null); transition(()=>setCurrent(i)); setShowMap(false); };

  const aptScore  = aptitudeQuestions.reduce((s,q,i)=>s+(aptAnswers[i]===q.ans?1:0),0);
  const csScore   = csQuestions.reduce((s,q,i)=>s+(csAnswers[i]===q.ans?1:0),0);
  const totalScore= aptScore+csScore;
  const totalPct  = Math.round(totalScore/90*100);
  const grade     = totalPct>=80?"A":totalPct>=65?"B":totalPct>=50?"C":totalPct>=35?"D":"F";
  const gColor    = totalPct>=80?T.green:totalPct>=65?T.accent:totalPct>=50?T.yellow:totalPct>=35?"#ea580c":T.red;
  const remark    = totalPct>=80?"Outstanding 🏆":totalPct>=65?"Good Job 👍":totalPct>=50?"Average 📚":totalPct>=35?"Below Average 📖":"Needs Improvement 💪";

  const q       = qs[current];
  const secInfo = secs.find(s=>s.key===q?.cat);
  const secStart= q ? qs.findIndex(qq=>qq.cat===q.cat) : 0;
  const answered= Object.keys(answers).length;

  // ── shared card style ──
  const cardStyle = { background:T.card, borderRadius:"16px", padding:"36px 40px", maxWidth:"680px", width:"100%", boxShadow:T.shadow2 };

  const inputSt = err => ({ width:"100%", background:T.bg, border:`1.5px solid ${err?T.red:T.border2}`, borderRadius:"10px", padding:"12px 16px", color:T.text, fontFamily:bodyFont, fontSize:"15px", outline:"none" });

  // ══ ONBOARD ═════════════════════════════════════════════════════════════════
  if(phase==="onboard") return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
      <div style={cardStyle}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontSize:"11px",color:T.accent,fontWeight:"700",letterSpacing:"3px",marginBottom:"10px"}}>THE ENTANGLE · ELITE 100 CLUB</div>
          <h1 style={{fontSize:"28px",fontWeight:"800",color:T.text,margin:"0 0 8px"}}>Advanced Mock Test</h1>
          <p style={{color:T.sub,fontSize:"15px",margin:0}}>90 Questions · Two Parts · Mixed Difficulty</p>
        </div>

        {/* Part pills */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"28px"}}>
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

        {/* Fields */}
        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"6px"}}>Full Name *</label>
          <input style={inputSt(errors.name)} placeholder="Enter your full name" value={student.name}
            onChange={e=>{setStudent(s=>({...s,name:e.target.value}));setErrors(er=>({...er,name:""}));}}/>
          {errors.name&&<div style={{fontSize:"12px",color:T.red,marginTop:"4px"}}>⚠ {errors.name}</div>}
        </div>

        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"6px"}}>College / Institute *</label>
          <input style={inputSt(errors.college)} placeholder="Enter your college name" value={student.college}
            onChange={e=>{setStudent(s=>({...s,college:e.target.value}));setErrors(er=>({...er,college:""}));}}/>
          {errors.college&&<div style={{fontSize:"12px",color:T.red,marginTop:"4px"}}>⚠ {errors.college}</div>}
        </div>

        <div style={{marginBottom:"16px"}}>
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"8px"}}>Course *</label>
          <div style={{display:"flex",gap:"8px"}}>
            {COURSES.map(c=>(
              <button key={c} onClick={()=>{setStudent(s=>({...s,course:c,year:""}));setErrors(er=>({...er,course:"",year:""}));}}
                style={{flex:1,padding:"11px 10px",borderRadius:"9px",border:`1.5px solid ${student.course===c?T.accent:T.border2}`,background:student.course===c?T.accentL:T.bg,color:student.course===c?T.accent:T.sub,fontFamily:bodyFont,fontSize:"14px",fontWeight:student.course===c?"700":"400",cursor:"pointer",transition:"all 0.15s",textAlign:"center"}}>
                {student.course===c?"✓ ":""}{c}
              </button>
            ))}
          </div>
          {errors.course&&<div style={{fontSize:"12px",color:T.red,marginTop:"4px"}}>⚠ {errors.course}</div>}
        </div>

        <div style={{marginBottom:"28px"}}>
          <label style={{fontSize:"13px",fontWeight:"600",color:T.sub,display:"block",marginBottom:"8px"}}>
            Year of Study * {!student.course && <span style={{color:T.muted,fontWeight:"400"}}>(select course first)</span>}
          </label>
          {student.course ? (
            <div style={{display:"flex",gap:"8px",flexWrap:"wrap"}}>
              {COURSE_YEARS[student.course].map(y=>(
                <button key={y} onClick={()=>{setStudent(s=>({...s,year:y}));setErrors(er=>({...er,year:""}));}}
                  style={{padding:"11px 18px",borderRadius:"9px",border:`1.5px solid ${student.year===y?T.accent:T.border2}`,background:student.year===y?T.accentL:T.bg,color:student.year===y?T.accent:T.sub,fontFamily:bodyFont,fontSize:"14px",fontWeight:student.year===y?"700":"400",cursor:"pointer",transition:"all 0.15s"}}>
                  {student.year===y?"✓ ":""}{y}
                </button>
              ))}
            </div>
          ) : (
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

  // ══ APTITUDE DONE — TRANSITION SCREEN ═══════════════════════════════════════
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
          <div style={{fontSize:"13px",color:T.sub}}>OOPs (Java/C++) · DBMS & SQL · Operating Systems · Computer Networks · DSA</div>
        </div>

        <button style={{width:"100%",background:T.green,color:"#fff",border:"none",padding:"14px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"16px",fontWeight:"700",cursor:"pointer"}}
          onClick={()=>startPart("cs")}>
          Begin Part 2 — CS Fundamentals →
        </button>
      </div>
    </div>
  );

  // ══ RESULT ═══════════════════════════════════════════════════════════════════
  if(phase==="result") return (
    <>
      {showCard&&<ReportCard student={student} aptAnswers={aptAnswers} csAnswers={csAnswers} onClose={()=>setShowCard(false)}/>}
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
        <div style={{...cardStyle,maxWidth:"740px"}}>
          <div style={{textAlign:"center",marginBottom:"24px"}}>
            <div style={{fontSize:"10px",color:T.accent,letterSpacing:"2px",fontWeight:"700",marginBottom:"6px"}}>THE ENTANGLE · ELITE 100 CLUB</div>
            <div style={{fontSize:"14px",color:T.sub,marginBottom:"4px"}}>
              <strong style={{color:T.text}}>{student.name}</strong> · {student.college} · {student.course} · {student.year}
            </div>
            <h2 style={{fontSize:"22px",fontWeight:"800",color:gColor,margin:"0 0 8px"}}>{remark}</h2>
            <div style={{fontSize:"54px",fontWeight:"900",lineHeight:1,color:T.text,letterSpacing:"-2px"}}>{totalScore}<span style={{fontSize:"22px",color:T.muted,fontWeight:"400"}}>/ 90</span></div>
            <div style={{color:T.sub,fontSize:"14px",marginTop:"6px"}}>{totalPct}% overall</div>
            <div style={{display:"inline-block",background:gColor+"18",border:`1.5px solid ${gColor}44`,borderRadius:"8px",padding:"4px 20px",marginTop:"10px",fontSize:"22px",fontWeight:"900",color:gColor}}>Grade: {grade}</div>
            <div style={{height:"6px",background:T.border,borderRadius:"99px",margin:"16px 0 0",overflow:"hidden"}}>
              <div style={{height:"100%",width:`${totalPct}%`,background:`linear-gradient(90deg,${gColor},${T.accent})`,borderRadius:"99px",transition:"width 1s ease"}}/>
            </div>
          </div>

          {/* Part summary */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px",marginBottom:"20px"}}>
            <div style={{background:"#eef2ff",border:"1px solid #c7d2fe",borderRadius:"12px",padding:"16px 20px"}}>
              <div style={{fontSize:"11px",fontWeight:"700",color:T.accent,letterSpacing:"1px",marginBottom:"8px"}}>PART 1 — APTITUDE</div>
              <div style={{fontSize:"32px",fontWeight:"800",color:T.text}}>{aptScore}<span style={{fontSize:"15px",color:T.muted}}>/{aptitudeQuestions.length}</span></div>
              <div style={{fontSize:"13px",color:T.sub}}>{Math.round(aptScore/aptitudeQuestions.length*100)}%</div>
            </div>
            <div style={{background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:"12px",padding:"16px 20px"}}>
              <div style={{fontSize:"11px",fontWeight:"700",color:T.green,letterSpacing:"1px",marginBottom:"8px"}}>PART 2 — CS FUNDAMENTALS</div>
              <div style={{fontSize:"32px",fontWeight:"800",color:T.text}}>{csScore}<span style={{fontSize:"15px",color:T.muted}}>/{csQuestions.length}</span></div>
              <div style={{fontSize:"13px",color:T.sub}}>{Math.round(csScore/csQuestions.length*100)}%</div>
            </div>
          </div>

          {/* Section grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"20px"}}>
            {ALL_SECS.map(sec=>{
              const isA=APT_SECS.find(s=>s.key===sec.key);
              const qsList=isA?aptitudeQuestions.filter(q=>q.cat===sec.key):csQuestions.filter(q=>q.cat===sec.key);
              const base=isA?aptitudeQuestions:csQuestions;
              const ans=isA?aptAnswers:csAnswers;
              const c=qsList.filter(q=>ans[base.indexOf(q)]===q.ans).length;
              const t=qsList.length;
              const p=Math.round(c/t*100);
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

          {/* Answer Review */}
          <div style={{marginBottom:"20px"}}>
            <div style={{fontSize:"12px",color:T.sub,fontWeight:"700",letterSpacing:"1px",textTransform:"uppercase",marginBottom:"10px"}}>Answer Review</div>
            <div style={{maxHeight:"200px",overflowY:"auto"}}>
              {[...aptitudeQuestions,...csQuestions].map((q,i)=>{
                const isA=i<50;
                const ans=isA?aptAnswers[i]:csAnswers[i-50];
                const ok=ans===q.ans, skipped=ans===undefined;
                const si=ALL_SECS.find(s=>s.key===q.cat);
                return (
                  <div key={i} style={{display:"flex",gap:"10px",marginBottom:"5px",padding:"8px 12px",borderRadius:"7px",background:skipped?T.bg:ok?T.greenL:T.redL,border:`1px solid ${skipped?T.border:ok?"#a7f3d0":"#fecaca"}`}}>
                    <span style={{color:skipped?T.muted:ok?T.green:T.red,fontWeight:"700",minWidth:"14px",fontSize:"13px"}}>{skipped?"–":ok?"✓":"✗"}</span>
                    <div style={{fontSize:"13px",flex:1,fontFamily:bodyFont}}>
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
            <button onClick={()=>setShowCard(true)} style={{flex:1,background:T.accent,color:"#fff",border:"none",padding:"13px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"15px",fontWeight:"700",cursor:"pointer"}}>
              📄 Download Report Card
            </button>
            <button onClick={()=>{setPhase("onboard");setCurrent(0);setAptAnswers({});setCsAnswers({});setSelected(null);setStudent({name:"",college:"",course:"",year:""});}}
              style={{background:T.bg,color:T.sub,border:`1.5px solid ${T.border2}`,padding:"13px 20px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>
              ↺ Retake
            </button>
          </div>
        </div>
      </div>
    </>
  );

  // ══ TEST (APT or CS) ══════════════════════════════════════════════════════════
  const partColor = isApt ? T.accent : T.green;
  const partLabel = isApt ? "Part 1 — Aptitude" : "Part 2 — CS Fundamentals";
  const secIdx    = secs.findIndex(s=>s.key===secInfo?.key);
  const totalQs   = qs.length;
  const secProg   = secInfo ? ((current - secStart) / secInfo.count) * 100 : 0;

  return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
      {/* Map Modal */}
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

        {/* Header */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px"}}>
          <div>
            <div style={{fontSize:"11px",fontWeight:"700",color:partColor,letterSpacing:"1px",textTransform:"uppercase",marginBottom:"2px"}}>{partLabel}</div>
            <div style={{fontSize:"13px",color:T.muted}}>
              {student.name} · Q <strong style={{color:T.text}}>{current+1}</strong> of {totalQs}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <button onClick={()=>setShowMap(true)} style={{background:T.bg,border:`1px solid ${T.border2}`,color:T.sub,padding:"7px 12px",borderRadius:"8px",fontFamily:bodyFont,fontSize:"13px",cursor:"pointer",fontWeight:"600"}}>
              🗺 Map
            </button>
            <div style={{fontSize:"22px",fontWeight:"800",letterSpacing:"2px",color:timeLeft<120?T.red:timeLeft<300?T.yellow:T.text,fontFamily:monoFont}}>
              {fmt(timeLeft)}
            </div>
          </div>
        </div>

        {/* Progress bar — simple single bar */}
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

        {/* Question */}
        <div style={{marginBottom:"24px"}}>
          <div style={{fontSize:"13px",fontWeight:"600",color:T.muted,marginBottom:"10px"}}>Question {current+1}</div>
          {q.code ? (
            <>
              <p style={{fontSize:"17px",lineHeight:"1.7",color:T.text,fontFamily:bodyFont,margin:"0 0 12px",fontWeight:"500"}}>
                {q.q.split("\n")[0]}
              </p>
              <pre style={{background:"#1e293b",color:"#e2e8f0",borderRadius:"10px",padding:"16px 20px",fontSize:"13px",fontFamily:monoFont,overflowX:"auto",lineHeight:"1.6",margin:0}}>
                {q.q.split("\n").slice(1).join("\n")}
              </pre>
            </>
          ) : (
            <p style={{fontSize:"17px",lineHeight:"1.75",color:T.text,fontFamily:bodyFont,margin:0,fontWeight:"500",whiteSpace:"pre-line"}}>
              {q.q}
            </p>
          )}
        </div>

        {/* Options */}
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
                <span style={{fontWeight:"700",marginRight:"12px",color:isOk?T.green:isNg?T.red:isSel?T.accent:T.muted,fontSize:"14px"}}>
                  {String.fromCharCode(65+i)}.
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:"4px"}}>
          <button onClick={handleSkip}
            style={{background:T.bg,color:T.sub,border:`1.5px solid ${T.border2}`,padding:"12px 20px",borderRadius:"9px",fontFamily:bodyFont,fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>
            Skip →
          </button>
          <button onClick={handleNext} disabled={selected===null}
            style={{background:selected===null?T.border:partColor,color:selected===null?T.muted:"#fff",border:"none",padding:"12px 28px",borderRadius:"9px",fontFamily:bodyFont,fontSize:"15px",fontWeight:"700",cursor:selected===null?"not-allowed":"pointer",transition:"all 0.15s"}}>
            {current+1===totalQs?(isApt?"Complete Part 1 →":"Submit Test →"):"Next →"}
          </button>
        </div>
      </div>
    </div>
  );
}
