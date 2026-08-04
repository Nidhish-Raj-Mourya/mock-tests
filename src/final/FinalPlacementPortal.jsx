import {useState} from "react";
import AptitudePractice from "../tests/weekly/AptitudePractice";

const numericalTopics=[
  {title:"Number System",kind:"number",color:"#4f46e5",coverage:"25 genuine patterns: divisibility, factors, HCF-LCM, factorial valuation, cyclicity, modular arithmetic, base conversion and digit problems",ready:true,quality:true},
  {title:"Percentages",kind:"percentage",color:"#0891b2",coverage:"25 genuine patterns: reverse and successive change, comparison, expenditure, savings, elections, growth, mixtures, error, geometry and DI",ready:true,quality:true},
  {title:"Profit and Loss",kind:"profit",color:"#ea580c",coverage:"25 genuine patterns: CP-SP reversals, markup, target profit, successive discounts, false weights, schemes, mixed lots and trader chains",ready:true,quality:true},
  {title:"Ratio and Proportion",kind:"ratio",color:"#7c3aed",coverage:"25 genuine patterns: division, ages, direct/inverse variation, proportions, partnership, wages, alligation, mixtures and map scale",ready:true,quality:true},
  {title:"Averages",kind:"average",color:"#059669",coverage:"25 genuine patterns: totals, missing values, addition/removal, corrections, combined and weighted groups, speed, sports and ages",ready:true,quality:true},
  {title:"Simple and Compound Interest",kind:"interest",color:"#be123c",coverage:"25 genuine patterns: SI unknowns, annual/monthly/quarterly compounding, variable rates, present value, depreciation and SI-CI differences",ready:true,quality:true},
  {title:"Mixtures and Alligation",color:"#0f766e",coverage:"Replacement, concentration, weighted mixture and alligation",ready:false},
  {title:"Time and Work",color:"#1d4ed8",coverage:"Efficiency, combined work, alternate work, wages and work equivalence",ready:false},
  {title:"Pipes and Cisterns",color:"#0369a1",coverage:"Filling, leakage, combined pipes and changing rates",ready:false},
  {title:"Time, Speed and Distance",color:"#b45309",coverage:"Relative speed, average speed, meetings, races and circular tracks",ready:false},
  {title:"Trains, Boats and Streams",color:"#c2410c",coverage:"Platforms, crossings, upstream-downstream and effective speed",ready:false},
  {title:"Data Interpretation",color:"#047857",coverage:"Tables, bar charts, line graphs, pie charts and caselets",ready:false},
  {title:"Permutation and Combination",color:"#6d28d9",coverage:"Arrangements, selections, restrictions and distribution",ready:false},
  {title:"Probability",color:"#9333ea",coverage:"Basic probability, conditional cases, dice, cards and selections",ready:false},
  {title:"Algebra",color:"#be185d",coverage:"Linear equations, quadratics, identities, inequalities and progressions",ready:false},
  {title:"Mensuration",color:"#9f1239",coverage:"Plane figures, solids, paths, volume and surface area",ready:false},
];

const logicalTopics=["Syllogisms","Coding–Decoding","Blood Relations","Direction Sense","Ranking and Ordering","Number and Letter Series","Statement and Conclusion","Assumption and Inference","Data Sufficiency","Seating Arrangements","Analytical Puzzles","Clocks and Calendars"];
const verbalTopics=["Error Detection","Sentence Correction","Grammar Fundamentals","Sentence Completion","Vocabulary","Synonyms and Antonyms","Idioms and Phrases","Cloze Tests","Para Jumbles","Reading Comprehension","Critical Reasoning","One-word Substitution"];

const sections=[
  {id:"numerical",title:"Numerical Ability",subtitle:"Arithmetic, number theory, commercial maths and data interpretation",color:"#2563eb",count:numericalTopics.length},
  {id:"logical",title:"Logical Reasoning",subtitle:"Deduction, arrangements, analytical reasoning and pattern recognition",color:"#7c3aed",count:logicalTopics.length},
  {id:"verbal",title:"Verbal Ability",subtitle:"Grammar, vocabulary, comprehension and critical reasoning",color:"#059669",count:verbalTopics.length},
];

export default function FinalPlacementPortal(){
  const [activeSection,setActiveSection]=useState(null),[activeTopic,setActiveTopic]=useState(null);
  const shell={minHeight:"100vh",background:"#f1f5f9",padding:"clamp(28px,5vw,64px) 16px",fontFamily:"Inter,Segoe UI,sans-serif",color:"#0f172a"};
  const card={width:"min(100%,1050px)",margin:"0 auto",background:"#fff",border:"1px solid #e2e8f0",borderRadius:18,padding:"clamp(22px,4vw,40px)",boxShadow:"0 16px 45px rgba(15,23,42,.08)"};

  if(activeTopic)return <div><button onClick={()=>setActiveTopic(null)} style={{position:"fixed",top:16,left:16,zIndex:999,border:"1px solid #cbd5e1",borderRadius:9,background:"#fff",padding:"9px 14px",fontWeight:800,cursor:"pointer",boxShadow:"0 5px 18px rgba(15,23,42,.12)"}}>← Numerical Topics</button><AptitudePractice day="Numerical Ability" topic={activeTopic.title} kind={activeTopic.kind} color={activeTopic.color}/></div>;

  if(!activeSection)return <div style={shell}><div style={card}><div style={{fontSize:12,fontWeight:900,letterSpacing:2,color:"#4f46e5"}}>CAMPUS PLACEMENT PREPARATION</div><h1 style={{fontSize:"clamp(34px,6vw,58px)",lineHeight:1.08,margin:"12px 0"}}>Placement Mastery Portal</h1><p style={{color:"#64748b",lineHeight:1.65,maxWidth:760}}>Build speed, accuracy and reasoning depth through structured topic practice. Completed Numerical Ability modules are available now; upcoming Numerical, Logical and Verbal modules are clearly marked Coming Soon.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16,marginTop:30}}>{sections.map(section=><button key={section.id} onClick={()=>setActiveSection(section.id)} style={{textAlign:"left",padding:24,borderRadius:15,border:`2px solid ${section.color}30`,borderTop:`5px solid ${section.color}`,background:"#fff",cursor:"pointer",color:"#0f172a"}}><h2 style={{fontSize:25,margin:"0 0 7px"}}>{section.title}</h2><p style={{fontSize:13,color:"#64748b",lineHeight:1.5,minHeight:58}}>{section.subtitle}</p><div style={{marginTop:14,color:section.color,fontWeight:900}}>{section.count} topics →</div></button>)}</div></div></div>;

  const sectionInfo=sections.find(section=>section.id===activeSection);
  const topics=activeSection==="numerical"?numericalTopics:(activeSection==="logical"?logicalTopics:verbalTopics).map(title=>({title,coverage:"Structured placement practice module is under development.",ready:false,color:sectionInfo.color}));
  return <div style={shell}><div style={card}><button onClick={()=>setActiveSection(null)} style={{border:"1px solid #cbd5e1",borderRadius:8,background:"#fff",padding:"8px 12px",fontWeight:800,cursor:"pointer",color:"#475569"}}>← Ability Sections</button><div style={{marginTop:24,color:sectionInfo.color,fontSize:12,fontWeight:900,letterSpacing:2}}>{sectionInfo.title.toUpperCase()}</div><h1 style={{fontSize:"clamp(32px,5vw,48px)",margin:"8px 0"}}>Choose a Topic</h1><p style={{color:"#64748b",lineHeight:1.6}}>Available modules contain 150 verified questions across 25 placement patterns, with timed navigation, worked solutions and review controls. Additional modules are being released progressively.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:13,marginTop:26}}>{topics.map(topic=><button key={topic.title} disabled={!topic.ready} onClick={()=>topic.ready&&setActiveTopic(topic)} style={{textAlign:"left",padding:19,borderRadius:13,border:`1.5px solid ${topic.ready?topic.color+"55":"#e2e8f0"}`,borderLeft:`5px solid ${topic.ready?topic.color:"#cbd5e1"}`,background:topic.ready?"#fff":"#f8fafc",cursor:topic.ready?"pointer":"default",color:"#0f172a",opacity:topic.ready?1:.68}}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><h2 style={{fontSize:19,margin:0}}>{topic.title}</h2><span style={{fontSize:11,fontWeight:900,color:topic.quality?"#047857":topic.ready?"#b45309":"#64748b",whiteSpace:"nowrap"}}>{topic.quality?"AVAILABLE · 150":topic.ready?"REVIEWING":"COMING SOON"}</span></div><p style={{fontSize:12,color:"#64748b",lineHeight:1.5,marginTop:8}}>{topic.coverage}</p>{topic.ready&&<div style={{marginTop:11,color:topic.color,fontWeight:900,fontSize:13}}>Open practice →</div>}</button>)}</div></div></div>;
}
