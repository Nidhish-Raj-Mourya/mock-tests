import { useState, useEffect, useRef } from "react";

const aptitudeQuestions = [
  // ══ QUANTITATIVE APTITUDE (10) ════════════════════════════════
  { id:1,  cat:"Quant", q:"A shopkeeper sells an item at ₹450 after giving 10% discount. What is the marked price?", opts:["₹480","₹490","₹500","₹510"], ans:2 },
  { id:2,  cat:"Quant", q:"The ratio of ages of A and B is 3:4. After 6 years, the ratio will be 4:5. Find A's current age.", opts:["18 years","21 years","24 years","27 years"], ans:0 },
  { id:3,  cat:"Quant", q:"A boat travels 30 km upstream in 6 hours and 30 km downstream in 3 hours. What is the speed of the stream?", opts:["2.5 km/h","3 km/h","3.5 km/h","4 km/h"], ans:0 },
  { id:4,  cat:"Quant", q:"If the diagonal of a square is 8√2 cm, find its area.", opts:["48 sq cm","56 sq cm","64 sq cm","72 sq cm"], ans:2 },
  { id:5,  cat:"Quant", q:"A sum triples itself in 20 years at simple interest. What is the rate of interest per annum?", opts:["8%","10%","12%","15%"], ans:1 },
  { id:6,  cat:"Quant", q:"3 men or 5 women can complete a work in 12 days. In how many days can 6 men and 5 women complete it?", opts:["4 days","5 days","6 days","8 days"], ans:0 },
  { id:7,  cat:"Quant", q:"What is the probability of getting a prime number when a die is thrown once?", opts:["1/2","1/3","2/3","1/6"], ans:0 },
  { id:8,  cat:"Quant", q:"A mixture of 40 litres contains milk and water in ratio 7:3. How much water should be added to make ratio 7:5?", opts:["8 litres","10 litres","12 litres","14 litres"], ans:0 },
  { id:9,  cat:"Quant", q:"Find the compound interest on ₹8000 at 15% p.a. for 2 years, compounded annually.", opts:["₹2460","₹2480","₹2520","₹2580"], ans:3 },
  { id:10, cat:"Quant", q:"The speed of a train is 90 km/h. It crosses a man standing on a platform in 8 seconds. Find the length of the train.", opts:["180 m","200 m","210 m","220 m"], ans:1 },

  // ══ LOGICAL REASONING (10) ════════════════════════════════════
  { id:11, cat:"Logical", q:"Complete the series: 1, 4, 9, 16, 25, ?", opts:["30","34","36","40"], ans:2 },
  { id:12, cat:"Logical", q:"If ROSE = 6821 and CHAIR = 73456, what is ARCHIE?", opts:["467351","476351","463751","476531"], ans:1 },
  { id:13, cat:"Logical", q:"In a class, every student plays at least one sport. 25 play cricket, 20 play football, 10 play both. How many students are there?", opts:["35","40","45","55"], ans:0 },
  { id:14, cat:"Logical", q:"Some doctors are lawyers. All lawyers are engineers. Which is definitely true?", opts:["All doctors are engineers","Some doctors are engineers","All engineers are lawyers","No doctor is an engineer"], ans:1 },
  { id:15, cat:"Logical", q:"A mirror is placed to the left of a clock showing 8:20. What time does the mirror image show?", opts:["3:40","4:40","3:20","4:20"], ans:0 },
  { id:16, cat:"Logical", q:"Six people A, B, C, D, E, F sit in a circle. A sits opposite D. B sits between A and C. E sits opposite B. Who sits opposite C?", opts:["D","E","F","A"], ans:2 },
  { id:17, cat:"Logical", q:"Find the missing number: 7, 12, 19, 28, 39, ?", opts:["48","50","52","54"], ans:2 },
  { id:18, cat:"Logical", q:"Introducing a man, a woman says 'He is the only son of my mother's mother.' How is the man related to the woman?", opts:["Uncle","Brother","Father","Maternal Uncle"], ans:3 },
  { id:19, cat:"Logical", q:"If in a code language PENCIL = QFODJM, how is ERASER written?", opts:["FSBSFS","FSBTFS","FSBTFT","FSASFS"], ans:0 },
  { id:20, cat:"Logical", q:"Statement: All trees are plants. No plant is an animal.\nConclusion I: No tree is an animal.\nConclusion II: All plants are trees.\nWhich follow(s)?", opts:["Only I","Only II","Both","Neither"], ans:0 },

  // ══ VERBAL ABILITY (10) ═══════════════════════════════════════
  { id:21, cat:"Verbal", q:"Choose the synonym of LACONIC:", opts:["Verbose","Brief","Detailed","Elaborate"], ans:1 },
  { id:22, cat:"Verbal", q:"Choose the antonym of BENEVOLENT:", opts:["Kind","Generous","Malicious","Charitable"], ans:2 },
  { id:23, cat:"Verbal", q:"Fill in the blank:\n'The jury ___ divided in their opinion.'", opts:["is","are","was","were"], ans:3 },
  { id:24, cat:"Verbal", q:"Identify the correctly spelled word:", opts:["Reccommend","Recommend","Recomend","Recommand"], ans:1 },
  { id:25, cat:"Verbal", q:"Meaning of the idiom 'Bite off more than you can chew':", opts:["Eat too much food","Take on more responsibility than you can handle","Be greedy","Speak without thinking"], ans:1 },
  { id:26, cat:"Verbal", q:"Identify the error:\n'Between you and I (A), this project (B) is going (C) nowhere (D).'", opts:["A — 'I' should be 'me'","B — 'project' is wrong","C — 'going' should be 'gone'","D — No error"], ans:0 },
  { id:27, cat:"Verbal", q:"Choose the word that fits:\n'The scientist made a ___ discovery that changed the field forever.'", opts:["trivial","redundant","landmark","marginal"], ans:2 },
  { id:28, cat:"Verbal", q:"Choose the pair with similar relationship to AUTHOR : NOVEL:", opts:["Painter : Canvas","Sculptor : Chisel","Composer : Symphony","Director : Actor"], ans:2 },
  { id:29, cat:"Verbal", q:"Choose the correct sentence:", opts:["He is one of the student who has passed","He is one of the students who have passed","He is one of the students who has passed","He is one of the student who have passed"], ans:1 },
  { id:30, cat:"Verbal", q:"Choose the word closest in meaning to PERFIDIOUS:", opts:["Loyal","Treacherous","Brave","Honest"], ans:1 },

  // ══ DATA INTERPRETATION (10) ══════════════════════════════════
  // Table: Students enrolled per dept — CS:450, IT:300, ECE:350, Mech:250, Civil:150
  { id:31, cat:"DI", q:"Enrollment Table: CS:450, IT:300, ECE:350, Mech:250, Civil:150\n\nTotal students enrolled across all departments?", opts:["1400","1450","1500","1550"], ans:2 },
  { id:32, cat:"DI", q:"Enrollment Table: CS:450, IT:300, ECE:350, Mech:250, Civil:150\n\nWhat % of total students are in CS?", opts:["28%","30%","32%","35%"], ans:1 },
  { id:33, cat:"DI", q:"Enrollment Table: CS:450, IT:300, ECE:350, Mech:250, Civil:150\n\nRatio of IT to ECE students?", opts:["5:6","6:7","7:8","6:5"], ans:1 },
  { id:34, cat:"DI", q:"Enrollment Table: CS:450, IT:300, ECE:350, Mech:250, Civil:150\n\nIf 20% of CS students drop out, new CS enrollment?", opts:["340","350","360","380"], ans:2 },
  { id:35, cat:"DI", q:"Enrollment Table: CS:450, IT:300, ECE:350, Mech:250, Civil:150\n\nHow many more students are in ECE than Civil?", opts:["180","190","200","210"], ans:2 },
  // Bar chart: Monthly expenses (₹000s) — Jan:45, Feb:38, Mar:52, Apr:41, May:60, Jun:55
  { id:36, cat:"DI", q:"Monthly Expenses (₹000s): Jan:45, Feb:38, Mar:52, Apr:41, May:60, Jun:55\n\nAverage monthly expense over 6 months?", opts:["₹47,833","₹48,500","₹48,000","₹49,167"], ans:3 },
  { id:37, cat:"DI", q:"Monthly Expenses (₹000s): Jan:45, Feb:38, Mar:52, Apr:41, May:60, Jun:55\n\nWhich month had the highest expense?", opts:["March","April","May","June"], ans:2 },
  { id:38, cat:"DI", q:"Monthly Expenses (₹000s): Jan:45, Feb:38, Mar:52, Apr:41, May:60, Jun:55\n\n% increase from Feb to Mar?", opts:["32.6%","36.8%","38.5%","42.1%"], ans:1 },
  { id:39, cat:"DI", q:"Monthly Expenses (₹000s): Jan:45, Feb:38, Mar:52, Apr:41, May:60, Jun:55\n\nTotal expenses in Q2 (Apr, May, Jun)?", opts:["₹1,46,000","₹1,52,000","₹1,56,000","₹1,60,000"], ans:2 },
  { id:40, cat:"DI", q:"Monthly Expenses (₹000s): Jan:45, Feb:38, Mar:52, Apr:41, May:60, Jun:55\n\nRatio of Q1 (Jan-Mar) to Q2 (Apr-Jun) expenses?", opts:["134:155","135:156","136:157","133:154"], ans:1 },

  // ══ ANALYTICAL REASONING (10) ════════════════════════════════
  { id:41, cat:"AR", q:"A father is 4 times older than his son. After 16 years, he will be only twice as old. Find father's current age.", opts:["32 years","36 years","40 years","44 years"], ans:0 },
  { id:42, cat:"AR", q:"There are 5 houses in a row. The green house is immediately to the right of the white house. Which statement must be true?", opts:["White house is first","Green house is not first","White is not last","Both B and C"], ans:3 },
  { id:43, cat:"AR", q:"A snail climbs 3 metres up a pole during the day and slips 1 metre at night. The pole is 12 metres tall. How many days to reach the top?", opts:["5 days","6 days","7 days","8 days"], ans:1 },
  { id:44, cat:"AR", q:"In a family of 6: 2 married couples, 1 doctor, 1 engineer, 1 teacher, 1 lawyer. The doctor is a woman. The engineer is a man. Which is possible?", opts:["The lawyer is a woman married to the doctor","The teacher is a man married to the engineer","The doctor is married to the lawyer","Both B and C"], ans:3 },
  { id:45, cat:"AR", q:"A clock is set correctly at noon. It gains 10 minutes per hour. What will be the actual time when clock shows 3 PM?", opts:["2:45 PM","2:44 PM","2:43 PM","2:42 PM"], ans:1 },
  { id:46, cat:"AR", q:"How many rectangles are in a 3×3 grid?", opts:["16","18","36","24"], ans:2 },
  { id:47, cat:"AR", q:"P, Q, R, S run a race. P beats Q by 10m. Q beats R by 10m. P beats R by how much in a 100m race?", opts:["19m","20m","21m","18m"], ans:0 },
  { id:48, cat:"AR", q:"A container has 80 litres of pure alcohol. 8 litres is replaced by water, then again 8 litres of mixture is replaced by water. What % is alcohol now?", opts:["81%","82%","83%","80%"], ans:0 },
  { id:49, cat:"AR", q:"If 'CODING' is written as 'DPEJOH' in a code, how is 'DEBUGS' written?", opts:["EFCVHT","EFBVHT","EFCVHU","EGCVHT"], ans:0 },
  { id:50, cat:"AR", q:"There are 10 points on a circle. How many chords can be drawn?", opts:["40","45","50","55"], ans:1 },
];

const csQuestions = [
  // ══ OOPs (8) ══════════════════════════════════════════════════
  { id:51, cat:"OOPs", q:"What is the output of this Java code?\nclass Animal {\n  String sound() { return \"Generic\"; }\n}\nclass Dog extends Animal {\n  String sound() { return \"Woof\"; }\n}\nAnimal a = new Dog();\nSystem.out.println(a.sound());", opts:["Generic","Woof","Compile error","Runtime error"], ans:1, code:true },
  { id:52, cat:"OOPs", q:"Which of the following is NOT a feature of Object-Oriented Programming?", opts:["Encapsulation","Polymorphism","Compilation","Inheritance"], ans:2 },
  { id:53, cat:"OOPs", q:"What is a constructor in Java?", opts:["A method that returns an object","A special method with same name as class, no return type, called on object creation","A static method used to create objects","A method that destroys objects"], ans:1 },
  { id:54, cat:"OOPs", q:"What is the difference between method overloading and method overriding?", opts:["No difference","Overloading is compile-time polymorphism (same name, different params); Overriding is runtime polymorphism (subclass redefines parent method)","Overriding is compile-time; Overloading is runtime","Both are runtime polymorphism"], ans:1 },
  { id:55, cat:"OOPs", q:"Which access modifier makes a member accessible only within the same class?", opts:["public","protected","default","private"], ans:3 },
  { id:56, cat:"OOPs", q:"What does the 'super' keyword do in Java?", opts:["Refers to current class instance","Refers to parent class and is used to call parent constructor or methods","Creates a superclass object","Makes a method static"], ans:1 },
  { id:57, cat:"OOPs", q:"What is an abstract class?", opts:["A class with no methods","A class that cannot be instantiated and may have abstract methods that subclasses must implement","A class with only static methods","A class with private constructor"], ans:1 },
  { id:58, cat:"OOPs", q:"Which design pattern ensures only one instance of a class exists throughout the application?", opts:["Factory Pattern","Observer Pattern","Singleton Pattern","Decorator Pattern"], ans:2 },

  // ══ DBMS (8) ══════════════════════════════════════════════════
  { id:59, cat:"DBMS", q:"What is a Foreign Key in a relational database?", opts:["A key that uniquely identifies each row","A key that references the Primary Key of another table to establish relationships","A key that allows NULL values","A key used for indexing"], ans:1 },
  { id:60, cat:"DBMS", q:"What does the following SQL query return?\nSELECT name, salary FROM employees\nWHERE salary BETWEEN 30000 AND 60000\nORDER BY salary DESC;", opts:["All employees","Employees with salary 30000 to 60000, sorted highest first","Employees outside that range","Error — BETWEEN cannot be used with ORDER BY"], ans:1 },
  { id:61, cat:"DBMS", q:"What is a VIEW in SQL?", opts:["A physical copy of a table","A virtual table based on a SELECT query — does not store data itself","A temporary table","A type of index"], ans:1 },
  { id:62, cat:"DBMS", q:"Which SQL clause is used to combine rows from two or more tables based on a related column?", opts:["UNION","GROUP BY","JOIN","MERGE"], ans:2 },
  { id:63, cat:"DBMS", q:"What is the difference between UNION and UNION ALL in SQL?", opts:["No difference","UNION removes duplicates; UNION ALL includes all rows including duplicates","UNION ALL removes duplicates; UNION keeps them","UNION works only with same tables"], ans:1 },
  { id:64, cat:"DBMS", q:"Which of the following is NOT a type of SQL command category?", opts:["DDL","DML","DCL","DPL"], ans:3 },
  { id:65, cat:"DBMS", q:"What does 3NF (Third Normal Form) eliminate?", opts:["Partial dependencies","Transitive dependencies","Multivalued dependencies","Redundant primary keys"], ans:1 },
  { id:66, cat:"DBMS", q:"What will this query return?\nSELECT dept, COUNT(*) as total\nFROM employees\nGROUP BY dept\nHAVING COUNT(*) > 5;", opts:["All departments","Departments with more than 5 employees","Employees in large departments","Error"], ans:1, code:true },

  // ══ DSA (8) ═══════════════════════════════════════════════════
  { id:67, cat:"DSA", q:"What is the time complexity of inserting an element at the beginning of a singly linked list?", opts:["O(n)","O(log n)","O(1)","O(n²)"], ans:2 },
  { id:68, cat:"DSA", q:"Which data structure is used for BFS (Breadth First Search) traversal of a graph?", opts:["Stack","Queue","Priority Queue","Deque"], ans:1 },
  { id:69, cat:"DSA", q:"What is the height of a complete binary tree with n nodes?", opts:["O(n)","O(log n)","O(n log n)","O(√n)"], ans:1 },
  { id:70, cat:"DSA", q:"In a max-heap, which element is always at the root?", opts:["Smallest element","Largest element","Middle element","Last inserted element"], ans:1 },
  { id:71, cat:"DSA", q:"What is the average time complexity of HashTable lookup?", opts:["O(n)","O(log n)","O(1)","O(n²)"], ans:2 },
  { id:72, cat:"DSA", q:"Which sorting algorithm has the best average case time complexity?", opts:["Bubble Sort","Selection Sort","Merge Sort","Insertion Sort"], ans:2 },
  { id:73, cat:"DSA", q:"What is a Graph in data structures?", opts:["A linear collection of elements","A collection of nodes (vertices) and edges connecting them","A tree with more than 2 children","A sorted array"], ans:1 },
  { id:74, cat:"DSA", q:"What is the space complexity of DFS using recursion on a graph with V vertices and E edges?", opts:["O(1)","O(E)","O(V)","O(V+E)"], ans:2 },

  // ══ C++ (8) ═══════════════════════════════════════════════════
  { id:75, cat:"CPP", q:"What is the output?\n#include<iostream>\nusing namespace std;\nint main() {\n  int x = 5;\n  cout << x++ << \" \" << ++x;\n  return 0;\n}", opts:["5 7","5 6","6 7","6 6"], ans:0, code:true },
  { id:76, cat:"CPP", q:"What is a pointer in C++?", opts:["A variable that stores a value","A variable that stores the memory address of another variable","A reference to a function","A constant variable"], ans:1 },
  { id:77, cat:"CPP", q:"What is the difference between 'new' and 'malloc' in C++?", opts:["No difference","'new' calls constructor and is type-safe; 'malloc' allocates raw memory without calling constructor","'malloc' is faster always","'new' is used only for arrays"], ans:1 },
  { id:78, cat:"CPP", q:"What does the 'const' keyword do when applied to a pointer?\nint* const ptr = &x;", opts:["The value at the pointer cannot be changed","The pointer itself cannot point to another address","Both value and address are constant","Pointer becomes null"], ans:1 },
  { id:79, cat:"CPP", q:"What is function overloading in C++?", opts:["Two functions in different classes with same name","Multiple functions with the same name but different parameter lists in the same scope","A function calling itself","A virtual function"], ans:1 },
  { id:80, cat:"CPP", q:"What is the output?\n#include<iostream>\nusing namespace std;\nvoid swap(int &a, int &b) {\n  int t = a; a = b; b = t;\n}\nint main() {\n  int x=3, y=7;\n  swap(x,y);\n  cout << x << \" \" << y;\n}", opts:["3 7","7 3","3 3","7 7"], ans:1, code:true },
  { id:81, cat:"CPP", q:"What is a destructor in C++?", opts:["A function that creates objects","A special function called automatically when an object goes out of scope to free resources","A function that copies objects","A constructor with parameters"], ans:1 },
  { id:82, cat:"CPP", q:"Which of the following correctly declares a pure virtual function in C++?", opts:["virtual void show() {}","void show() = 0;","virtual void show() = 0;","abstract void show();"], ans:2 },

  // ══ OS (4) + CN (4) ═══════════════════════════════════════════
  { id:83, cat:"OS", q:"What is thrashing in an operating system?", opts:["CPU executing too many processes","Excessive paging activity where OS spends more time swapping pages than executing processes","A type of deadlock","Memory overflow error"], ans:1 },
  { id:84, cat:"OS", q:"What is the difference between preemptive and non-preemptive scheduling?", opts:["No difference","Preemptive allows OS to interrupt a running process; non-preemptive lets process run until it finishes or blocks","Non-preemptive is faster always","Preemptive only works with single-core CPUs"], ans:1 },
  { id:85, cat:"OS", q:"What is a semaphore in OS?", opts:["A type of process","A synchronization tool used to control access to shared resources by multiple processes","A memory management unit","A type of file system"], ans:1 },
  { id:86, cat:"OS", q:"Which of the following is TRUE about demand paging?", opts:["All pages are loaded at program start","Pages are loaded into memory only when they are needed (on demand)","Pages are loaded randomly","Demand paging increases memory usage always"], ans:1 },
  { id:87, cat:"CN", q:"What is the difference between HTTP and HTTPS?", opts:["No difference","HTTPS uses SSL/TLS encryption for secure communication; HTTP does not","HTTP is faster always","HTTPS only works on port 80"], ans:1 },
  { id:88, cat:"CN", q:"What is the purpose of ARP (Address Resolution Protocol)?", opts:["Assigns IP addresses dynamically","Maps IP addresses to MAC addresses on a local network","Translates domain names to IP addresses","Routes packets between networks"], ans:1 },
  { id:89, cat:"CN", q:"What is the difference between a hub and a switch?", opts:["No difference","A hub broadcasts data to all ports; a switch intelligently forwards data only to the destination port","A switch is slower than a hub","Hubs work at Layer 3; switches at Layer 2"], ans:1 },
  { id:90, cat:"CN", q:"Which protocol is used to automatically assign IP addresses to devices on a network?", opts:["DNS","FTP","DHCP","SMTP"], ans:2 },
];

// ─── SECTIONS CONFIG ─────────────────────────────────────────────────────────
const APT_SECS = [
  { key:"Quant",   label:"Quantitative Aptitude",  emoji:"🔢", color:"#4f46e5", count:10 },
  { key:"Logical", label:"Logical Reasoning",      emoji:"🧩", color:"#d97706", count:10 },
  { key:"Verbal",  label:"Verbal Ability",         emoji:"📝", color:"#059669", count:10 },
  { key:"DI",      label:"Data Interpretation",    emoji:"📊", color:"#0891b2", count:10 },
  { key:"AR",      label:"Analytical Reasoning",   emoji:"🧠", color:"#db2777", count:10 },
];
const CS_SECS = [
  { key:"OOPs",    label:"OOPs (Java)",            emoji:"💻", color:"#ea580c", count:8 },
  { key:"DBMS",    label:"DBMS & SQL",             emoji:"🗄️", color:"#7c3aed", count:8 },
  { key:"DSA",     label:"Data Structures",        emoji:"🌲", color:"#dc2626", count:8 },
  { key:"CPP",     label:"C++ Fundamentals",       emoji:"⚙️", color:"#0d9488", count:8 },
  { key:"OS",      label:"OS & Networks",          emoji:"🌐", color:"#2563eb", count:4+4 },
];
const ALL_SECS = [...APT_SECS, ...CS_SECS];
const COURSES = ["B.Tech / B.E.", "BCA", "MCA"];
const COURSE_YEARS = {
  "B.Tech / B.E.": ["1st Year","2nd Year","3rd Year","4th Year"],
  "BCA":           ["1st Year","2nd Year","3rd Year"],
  "MCA":           ["1st Year","2nd Year"],
};

// ─── THEME ───────────────────────────────────────────────────────────────────
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
    return { ...sec, c, t:qs.length, pct:qs.length>0?Math.round(c/qs.length*100):0 };
  });

  const handleDownload = () => {
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
      .score-row{display:flex;justify-content:center;gap:48px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:24px;margin-bottom:24px}
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
      <h1>Mock Test 2 — Report Card</h1>
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
      <tr><th>Section</th><th>Score</th><th>Total</th><th>%</th><th>Performance</th></tr>
      ${secScores.map(s=>`<tr>
        <td><strong>${s.emoji} ${s.label}</strong></td>
        <td><strong>${s.c}</strong></td><td>${s.t}</td>
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
    </div>
    </body></html>`;

    const blob = new Blob([html], { type:"text/html" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `ReportCard_MockTest2_${student.name.replace(/\s+/g,"_")}.html`;
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
            <div style={{fontSize:"18px",fontWeight:"800",color:T.text}}>Mock Test 2 — Report Card</div>
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
            <div style={{fontSize:"26px",fontWeight:"800",color:T.text}}>{aptScore}<span style={{fontSize:"13px",color:T.muted}}>/{aptitudeQuestions.length}</span></div>
            <div style={{fontSize:"12px",color:T.sub}}>{Math.round(aptScore/aptitudeQuestions.length*100)}%</div>
          </div>
          <div style={{background:"#ecfdf5",border:"1px solid #a7f3d0",borderRadius:"10px",padding:"14px"}}>
            <div style={{fontSize:"10px",fontWeight:"700",color:T.green,letterSpacing:"1px",marginBottom:"6px"}}>PART 2 — CS FUNDAMENTALS</div>
            <div style={{fontSize:"26px",fontWeight:"800",color:T.text}}>{csScore}<span style={{fontSize:"13px",color:T.muted}}>/{csQuestions.length}</span></div>
            <div style={{fontSize:"12px",color:T.sub}}>{Math.round(csScore/csQuestions.length*100)}%</div>
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

  const isApt   = phase==="apt";
  const qs      = isApt ? aptitudeQuestions : csQuestions;
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

  const validate = () => {
    const e={};
    if(!student.name.trim())    e.name="Name is required";
    if(!student.college.trim()) e.college="College name is required";
    if(!student.course)         e.course="Please select your course";
    if(!student.year)           e.year="Please select your year";
    setErrors(e); return Object.keys(e).length===0;
  };

  const startPart = (part) => { setCurrent(0); setSelected(null); setTimeLeft(part==="apt"?30*60:20*60); setPhase(part); };
  const transition = cb => { setVisible(false); setTimeout(()=>{ setVisible(true); cb(); },150); };
  const handleNext = () => {
    if(selected===null) return;
    setAns(a=>({...a,[current]:selected}));
    setSelected(null);
    transition(()=>{ if(current+1>=qs.length){ clearInterval(timerRef.current); if(isApt) setPhase("apt_done"); else setPhase("result"); } else setCurrent(c=>c+1); });
  };
  const handleSkip = () => { setSelected(null); transition(()=>{ if(current+1>=qs.length){ clearInterval(timerRef.current); if(isApt) setPhase("apt_done"); else setPhase("result"); } else setCurrent(c=>c+1); }); };
  const jumpTo = i => { setSelected(answers[i]??null); transition(()=>setCurrent(i)); setShowMap(false); };
  const resetAll = () => { setPhase("onboard"); setCurrent(0); setAptAnswers({}); setCsAnswers({}); setSelected(null); setStudent({name:"",college:"",course:"",year:""}); };

  const aptScore   = aptitudeQuestions.reduce((s,q,i)=>s+(aptAnswers[i]===q.ans?1:0),0);
  const csScore    = csQuestions.reduce((s,q,i)=>s+(csAnswers[i]===q.ans?1:0),0);
  const totalScore = aptScore+csScore;
  const totalPct   = Math.round(totalScore/90*100);
  const grade      = totalPct>=80?"A":totalPct>=65?"B":totalPct>=50?"C":totalPct>=35?"D":"F";
  const gColor     = totalPct>=80?T.green:totalPct>=65?T.accent:totalPct>=50?T.yellow:totalPct>=35?"#ea580c":T.red;
  const remark     = totalPct>=80?"Outstanding 🏆":totalPct>=65?"Good Job 👍":totalPct>=50?"Average 📚":totalPct>=35?"Below Average 📖":"Needs Improvement 💪";

  const q        = qs[current];
  const secInfo  = secs.find(s=>s.key===q?.cat);
  const secStart = q ? qs.findIndex(qq=>qq.cat===q.cat) : 0;
  const answered = Object.keys(answers).length;
  const totalQs  = qs.length;

  const cardStyle = { background:T.card, borderRadius:"16px", padding:"36px 40px", maxWidth:"680px", width:"100%", boxShadow:T.shadow2 };
  const inputSt   = err => ({ width:"100%", background:T.bg, border:`1.5px solid ${err?T.red:T.border2}`, borderRadius:"10px", padding:"12px 16px", color:T.text, fontFamily:bodyFont, fontSize:"15px", outline:"none" });

  if(phase==="onboard") return (
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
      <div style={cardStyle}>
        <div style={{textAlign:"center",marginBottom:"32px"}}>
          <div style={{fontSize:"11px",color:T.accent,fontWeight:"700",letterSpacing:"3px",marginBottom:"10px"}}>THE ENTANGLE · ELITE 100 CLUB</div>
          <h1 style={{fontSize:"28px",fontWeight:"800",color:T.text,margin:"0 0 8px"}}>Mock Test — 2</h1>
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
      {showCard&&<ReportCard student={student} aptAnswers={aptAnswers} csAnswers={csAnswers} onClose={()=>setShowCard(false)}/>}
      <div style={{minHeight:"100vh",background:T.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:"20px",fontFamily:bodyFont}}>
        <div style={{...cardStyle,maxWidth:"740px"}}>
          <div style={{textAlign:"center",marginBottom:"24px"}}>
            <div style={{fontSize:"10px",color:T.accent,letterSpacing:"2px",fontWeight:"700",marginBottom:"6px"}}>THE ENTANGLE · ELITE 100 CLUB</div>
            <div style={{fontSize:"14px",color:T.sub,marginBottom:"4px"}}>
              <strong style={{color:T.text}}>{student.name}</strong> · {student.college} · {student.course} · {student.year}
            </div>
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
              const qsList=isA?aptitudeQuestions.filter(q=>q.cat===sec.key):csQuestions.filter(q=>q.cat===sec.key);
              const base=isA?aptitudeQuestions:csQuestions;
              const ans=isA?aptAnswers:csAnswers;
              const c=qsList.filter(q=>ans[base.indexOf(q)]===q.ans).length;
              const t=qsList.length; const p=t>0?Math.round(c/t*100):0;
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
              {[...aptitudeQuestions,...csQuestions].map((q,i)=>{
                const isA=i<50; const ans=isA?aptAnswers[i]:csAnswers[i-50];
                const ok=ans===q.ans, skipped=ans===undefined;
                const si=ALL_SECS.find(s=>s.key===q.cat);
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
            <button onClick={()=>setShowCard(true)} style={{flex:1,background:T.accent,color:"#fff",border:"none",padding:"13px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"15px",fontWeight:"700",cursor:"pointer"}}>
              📄 Download Report Card
            </button>
            <button onClick={resetAll} style={{background:T.bg,color:T.sub,border:`1.5px solid ${T.border2}`,padding:"13px 20px",borderRadius:"10px",fontFamily:bodyFont,fontSize:"14px",fontWeight:"600",cursor:"pointer"}}>
              ↺ Retake
            </button>
          </div>
        </div>
      </div>
    </>
  );

  const partColor = isApt ? T.accent : T.green;
  const partLabel = isApt ? "Part 1 — Aptitude" : "Part 2 — CS Fundamentals";

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
          {q.code ? (
            <>
              <p style={{fontSize:"17px",lineHeight:"1.7",color:T.text,fontFamily:bodyFont,margin:"0 0 12px",fontWeight:"500"}}>{q.q.split("\n")[0]}</p>
              <pre style={{background:"#1e293b",color:"#e2e8f0",borderRadius:"10px",padding:"16px 20px",fontSize:"13px",fontFamily:monoFont,overflowX:"auto",lineHeight:"1.6",margin:0}}>{q.q.split("\n").slice(1).join("\n")}</pre>
            </>
          ) : (
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
