import React from "react";
import { supportsQuestionVisual } from "./VisualCoverage";

const palette = ["#4f46e5", "#0891b2", "#f59e0b", "#10b981", "#ec4899", "#7c3aed"];
const numbers = text => [...String(text).matchAll(/-?\d+(?:\.\d+)?/g)].map(match => Number(match[0])).filter(Number.isFinite);
const unique = values => [...new Set(values)];
const words = text => unique([...String(text).matchAll(/\b[A-Z][a-z]{2,}\b/g)].map(match => match[0])).filter(word => !["Statements", "Conclusions", "Select", "Which", "How", "What", "Find", "Campus", "Panel", "Meeting", "Sprint", "Assessment", "Six", "Five", "Round", "Gate", "Role", "Plan", "Product", "Team", "Service", "Desk", "Interview", "Queue", "Coding", "Contest", "Orientation", "Day", "Map", "Codebook", "Family", "Concept", "Reasoning", "Verification", "Final"].includes(word));

function Frame({ title, caption, children }) {
  return <figure style={{ margin:"16px 0 20px", border:"1px solid #dbe4f0", borderRadius:14, background:"linear-gradient(180deg,#ffffff,#f8fafc)", padding:"12px 12px 9px", overflow:"hidden" }}>
    <div style={{ display:"flex", justifyContent:"space-between", gap:12, alignItems:"center", marginBottom:8 }}><strong style={{ fontSize:12, color:"#334155", letterSpacing:.3 }}>{title}</strong><span style={{ fontSize:10, color:"#64748b", fontWeight:800 }}>VISUAL AID</span></div>
    <div role="img" aria-label={caption} style={{ width:"100%", overflowX:"auto" }}>{children}</div>
    <figcaption style={{ color:"#64748b", fontSize:11, lineHeight:1.45, marginTop:7 }}>{caption}</figcaption>
  </figure>;
}

const Svg = ({ children, height=220, viewBox="0 0 720 220" }) => <svg viewBox={viewBox} style={{ width:"100%", minWidth:300, height:"auto", maxHeight:height }} aria-hidden="true">{children}</svg>;

function DataChart({ item }) {
  const assigned=[...item.q.matchAll(/=\s*(?:Rs\s*)?(\d+(?:\.\d+)?)/gi)].map(match=>Number(match[1])), values = (assigned.length>=2?assigned:numbers(item.q)).filter(value => value >= 0).slice(0, 6);
  const chartValues = values.length > 1 ? values : [20, 35, 28, 46];
  const max = Math.max(...chartValues, 1);
  const isLine = /line|growth|trend|index|cagr/i.test(item.subtopic);
  const isPie = /pie/i.test(item.q+item.subtopic);
  const isTable = /table|headcount|inventory|frequency|two-row|two-table/i.test(item.q+item.subtopic);
  const points = chartValues.map((value, index) => `${80 + index * (540 / Math.max(1, chartValues.length - 1))},${178 - value / max * 128}`).join(" ");
  if(isPie){
    const segments=chartValues.slice(0,4).map((value,index,array)=>({value,index,offset:-array.slice(0,index).reduce((sum,current)=>sum+current,0)*3.77}));
    return <Frame title="Pie-chart stimulus" caption="The coloured sectors show only the listed shares; the unlabelled grey sector is the unknown remainder."><Svg>
      <circle cx="260" cy="112" r="65" fill="none" stroke="#cbd5e1" strokeWidth="54"/>
      {segments.map(({value,index,offset})=><circle key={index} cx="260" cy="112" r="65" fill="none" stroke={palette[index]} strokeWidth="54" strokeDasharray={`${Math.min(100,value)*3.77} 377`} strokeDashoffset={offset} transform="rotate(-90 260 112)"/>)}
      <circle cx="260" cy="112" r="31" fill="#fff"/><text x="260" y="117" textAnchor="middle" fontSize="14" fontWeight="800" fill="#475569">100%</text>
      {chartValues.slice(0,4).map((value,index)=><g key={index}><rect x="410" y={55+index*32} width="18" height="18" rx="4" fill={palette[index]}/><text x="440" y={69+index*32} fontSize="14" fill="#334155">Category {String.fromCharCode(65+index)} · {value}%</text></g>)}
      <rect x="410" y={55+chartValues.slice(0,4).length*32} width="18" height="18" rx="4" fill="#cbd5e1"/><text x="440" y={69+chartValues.slice(0,4).length*32} fontSize="14" fill="#334155">Other · ?</text>
    </Svg></Frame>;
  }
  if(isTable)return <Frame title="Data table" caption={`Table generated from the figures stated in the question: ${chartValues.join(", ")}.`}><Svg>{chartValues.map((value,index)=>{const cols=Math.min(3,chartValues.length),x=95+(index%cols)*175,y=45+Math.floor(index/cols)*75;return <g key={index}><rect x={x} y={y} width="160" height="60" rx="8" fill={`${palette[index%palette.length]}18`} stroke={palette[index%palette.length]} strokeWidth="3"/><text x={x+80} y={y+23} textAnchor="middle" fontSize="11" fill="#64748b">Value {index+1}</text><text x={x+80} y={y+46} textAnchor="middle" fontSize="18" fontWeight="900" fill="#334155">{value}</text></g>})}</Svg></Frame>;
  return <Frame title="Data representation" caption={`Chart generated from the figures stated in the question: ${chartValues.join(", ")}.`}><Svg>
    {[0,1,2,3].map(i=><line key={i} x1="60" y1={50+i*42} x2="660" y2={50+i*42} stroke="#e2e8f0" />)}
    {isLine ? <><polyline points={points} fill="none" stroke="#4f46e5" strokeWidth="5" strokeLinejoin="round" />{chartValues.map((value,index)=><g key={index}><circle cx={80+index*(540/Math.max(1,chartValues.length-1))} cy={178-value/max*128} r="7" fill={palette[index%palette.length]} /><text x={80+index*(540/Math.max(1,chartValues.length-1))} y={198} textAnchor="middle" fontSize="13" fill="#475569">{value}</text></g>)}</> : chartValues.map((value,index)=>{const width=500/chartValues.length,x=90+index*(width+12),h=value/max*128;return <g key={index}><rect x={x} y={178-h} width={width} height={h} rx="7" fill={palette[index%palette.length]} opacity=".88"/><text x={x+width/2} y={170-h} textAnchor="middle" fontSize="13" fontWeight="700" fill="#334155">{value}</text><text x={x+width/2} y="199" textAnchor="middle" fontSize="12" fill="#64748b">V{index+1}</text></g>})}
    <line x1="60" y1="178" x2="670" y2="178" stroke="#94a3b8" strokeWidth="2" />
  </Svg></Frame>;
}

function Geometry({ item }) {
  const s=item.subtopic.toLowerCase();
  const raw=numbers(item.q).filter(n=>n>0).slice(0,4), vals=/path around/.test(s)&&raw.length>=3?[raw[1],raw[2],raw[0]]:raw, label=i=>vals[i]??"?";
  let figure;
  if(/circle|sector|arc|semicircle/.test(s)) figure=<><circle cx="350" cy="112" r="78" fill="#eef2ff" stroke="#4f46e5" strokeWidth="4"/><line x1="350" y1="112" x2="428" y2="112" stroke="#ef4444" strokeWidth="4"/><text x="386" y="103" fontSize="15" fill="#b91c1c">r={label(0)}</text>{/sector|arc/.test(s)&&<path d="M350 112 L428 112 A78 78 0 0 0 389 44 Z" fill="#fef3c7" stroke="#f59e0b" strokeWidth="3"/>}</>;
  else if(/heron/.test(s)) figure=<><path d="M350 35 L205 185 L495 185 Z" fill="#ecfeff" stroke="#0891b2" strokeWidth="4"/><text x="270" y="105" fontSize="15" fill="#334155">{label(0)}</text><text x="430" y="105" fontSize="15" fill="#334155">{label(1)}</text><text x="350" y="207" textAnchor="middle" fontSize="15" fill="#334155">{label(2)}</text></>;
  else if(/equilateral/.test(s)) figure=<><path d="M350 35 L205 185 L495 185 Z" fill="#ecfeff" stroke="#0891b2" strokeWidth="4"/><text x="350" y="207" textAnchor="middle" fontSize="15" fill="#334155">each side={label(0)}</text></>;
  else if(/triangle|cone/.test(s)) figure=<><path d="M350 35 L205 185 L495 185 Z" fill="#ecfeff" stroke="#0891b2" strokeWidth="4"/><line x1="350" y1="35" x2="350" y2="185" stroke="#ef4444" strokeDasharray="7 6" strokeWidth="3"/><text x="355" y="112" fontSize="15" fill="#b91c1c">h={label(1)}</text><text x="350" y="207" textAnchor="middle" fontSize="15" fill="#334155">base/radius={label(0)}</text></>;
  else if(/cylinder/.test(s)) figure=<><ellipse cx="350" cy="50" rx="92" ry="27" fill="#dbeafe" stroke="#2563eb" strokeWidth="4"/><path d="M258 50 V172 M442 50 V172" stroke="#2563eb" strokeWidth="4"/><ellipse cx="350" cy="172" rx="92" ry="27" fill="#bfdbfe" stroke="#2563eb" strokeWidth="4"/><text x="451" y="115" fontSize="15" fill="#334155">h={label(1)}</text><text x="350" y="45" textAnchor="middle" fontSize="15" fill="#334155">r={label(0)}</text></>;
  else if(/sphere/.test(s)) figure=<><circle cx="350" cy="112" r="82" fill="#ede9fe" stroke="#7c3aed" strokeWidth="4"/><ellipse cx="350" cy="112" rx="82" ry="25" fill="none" stroke="#a78bfa" strokeDasharray="7 5" strokeWidth="3"/><line x1="350" y1="112" x2="432" y2="112" stroke="#ef4444" strokeWidth="3"/><text x="384" y="103" fontSize="15" fill="#b91c1c">r={label(0)}</text></>;
  else if(/rhombus/.test(s)) figure=<><path d="M350 35 L505 112 L350 189 L195 112 Z" fill="#f0fdf4" stroke="#059669" strokeWidth="4"/><line x1="195" y1="112" x2="505" y2="112" stroke="#ef4444" strokeDasharray="7 5" strokeWidth="3"/><line x1="350" y1="35" x2="350" y2="189" stroke="#f59e0b" strokeDasharray="7 5" strokeWidth="3"/><text x="350" y="104" textAnchor="middle" fontSize="14" fill="#b91c1c">d₁={label(0)}</text><text x="358" y="72" fontSize="14" fill="#92400e">d₂={label(1)}</text></>;
  else if(/trapezium/.test(s)) figure=<><path d="M250 45 L450 45 L525 185 L175 185 Z" fill="#ecfeff" stroke="#0891b2" strokeWidth="4"/><line x1="350" y1="45" x2="350" y2="185" stroke="#ef4444" strokeDasharray="7 5" strokeWidth="3"/><text x="350" y="35" textAnchor="middle" fontSize="14" fill="#334155">a={label(0)}</text><text x="350" y="207" textAnchor="middle" fontSize="14" fill="#334155">b={label(1)}</text><text x="360" y="120" fontSize="14" fill="#b91c1c">h={label(2)}</text></>;
  else if(/square/.test(s)) figure=<><rect x="265" y="30" width="170" height="170" fill="#f0fdf4" stroke="#059669" strokeWidth="4"/><line x1="265" y1="200" x2="435" y2="30" stroke="#ef4444" strokeDasharray="7 5" strokeWidth="3"/><text x="350" y="218" textAnchor="middle" fontSize="14" fill="#334155">side={label(0)}</text></>;
  else if(/cube|cuboid|tank/.test(s)) figure=<><path d="M245 75 L390 40 L485 92 L340 128 Z M245 75 V170 L340 207 V128 M340 207 L485 170 V92" fill="#e0f2fe" stroke="#0369a1" strokeWidth="4" strokeLinejoin="round"/><text x="360" y="218" fontSize="14" fill="#334155">{vals.join(" × ")}</text></>;
  else figure=<><rect x="205" y="50" width="290" height="135" rx="3" fill="#ecfdf5" stroke="#059669" strokeWidth="4"/><text x="350" y="207" textAnchor="middle" fontSize="15" fill="#334155">length={label(0)}</text><text x="505" y="120" fontSize="15" fill="#334155">width={label(1)}</text>{/path/.test(s)&&<rect x="185" y="30" width="330" height="175" fill="none" stroke="#f59e0b" strokeWidth="14" opacity=".7"/>}</>;
  return <Frame title="Dimension diagram" caption="Not to scale. All displayed dimensions come from the question statement."><Svg>{figure}</Svg></Frame>;
}

function ProbabilityVisual({ item }) {
  const text=(item.q+" "+item.subtopic).toLowerCase();
  const icon=/dice/.test(text)?"⚄":/card/.test(text)?"A♠":/coin/.test(text)?"H / T":/urn|ball|bag/.test(text)?"● ● ● ○ ○":"Outcome grid";
  return <Frame title="Sample-space model" caption="Organise equally likely outcomes before counting favourable cases."><Svg>{[0,1,2,3].map(i=><g key={i}><rect x={95+i*140} y="55" width="110" height="105" rx="14" fill={palette[i]} opacity=".12" stroke={palette[i]} strokeWidth="3"/><text x={150+i*140} y="118" textAnchor="middle" fontSize={icon.length>5?18:30} fontWeight="800" fill={palette[i]}>{icon}</text><text x={150+i*140} y="185" textAnchor="middle" fontSize="13" fill="#64748b">case {i+1}</text></g>)}</Svg></Frame>;
}

function MotionVisual({ item, train=false }) {
  const vals=numbers(item.q).filter(n=>n>0).slice(0,5), circular=/circular|track|lap/i.test(item.subtopic), boat=/boat|stream|river|upstream|downstream/i.test(item.q+item.subtopic);
  if(circular)return <Frame title="Circular-track model" caption="The marked path represents one complete lap; use relative speed in the stated direction."><Svg><ellipse cx="360" cy="112" rx="245" ry="78" fill="#f8fafc" stroke="#7c3aed" strokeWidth="12"/><circle cx="130" cy="88" r="12" fill="#ef4444"/><circle cx="170" cy="158" r="12" fill="#2563eb"/><text x="360" y="117" textAnchor="middle" fontSize="20" fontWeight="800" fill="#475569">{vals[0]??"?"} m track</text></Svg></Frame>;
  return <Frame title={train?"Crossing-distance model":boat?"Stream-direction model":"Route model"} caption="Use the labelled lengths, speeds and directions exactly as stated; the drawing is not to scale."><Svg><line x1="80" y1="160" x2="650" y2="160" stroke="#94a3b8" strokeWidth="5"/>{boat?<><path d="M80 185 Q160 160 240 185 T400 185 T560 185" fill="none" stroke="#38bdf8" strokeWidth="6"/><path d="M275 120 L395 120 L425 145 L250 145 Z" fill="#f59e0b"/><text x="340" y="103" textAnchor="middle" fontSize="16" fill="#334155">stream →</text></>:train?<><rect x="150" y="91" width="245" height="65" rx="8" fill="#dbeafe" stroke="#2563eb" strokeWidth="4"/><circle cx="205" cy="162" r="15" fill="#334155"/><circle cx="345" cy="162" r="15" fill="#334155"/><rect x="440" y="135" width="160" height="25" fill="#fcd34d"/><text x="272" y="82" textAnchor="middle" fontSize="15" fill="#334155">train {vals[0]??"?"} m</text></>:<><circle cx="115" cy="150" r="12" fill="#2563eb"/><circle cx="615" cy="150" r="12" fill="#ef4444"/><path d="M145 130 H560" stroke="#4f46e5" strokeWidth="5" markerEnd="url(#arrow)"/><text x="350" y="112" textAnchor="middle" fontSize="17" fill="#334155">distance {vals[0]??"?"} · speed {vals[1]??"?"}</text></>}<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#4f46e5"/></marker></defs></Svg></Frame>;
}

function MixtureVisual({ item }) {
  const vals=numbers(item.q).filter(n=>n>=0).slice(0,6);
  return <Frame title="Mixture balance" caption="Container levels illustrate the stated quantities and concentrations; apply component conservation."><Svg>{[0,1,2].map((i)=>{const x=115+i*210,fill=Math.min(105,40+(vals[i*2]??30)%75);return <g key={i}><path d={`M${x} 45 H${x+110} L${x+95} 180 H${x+15} Z`} fill="#fff" stroke="#475569" strokeWidth="3"/><path d={`M${x+10} ${180-fill} H${x+100} L${x+95} 180 H${x+15} Z`} fill={palette[i]} opacity=".55"/><text x={x+55} y="207" textAnchor="middle" fontSize="13" fill="#334155">{vals[i*2]??"?"} L · {vals[i*2+1]??"?"}%</text>{i<2&&<text x={x+155} y="118" textAnchor="middle" fontSize="28" fill="#64748b">{i===0?"+":"→"}</text>}</g>})}</Svg></Frame>;
}

function SetMap({ item, revealed }) {
  if(!revealed)return null;
  const premiseText=item.q.split("Conclusions:")[0], premises=[...premiseText.matchAll(/(All|Some|No)\s+([a-z]+)\s+(?:are|is)(\s+not)?\s+(?:a\s+|an\s+)?([a-z]+)/gi)].slice(0,3).map(match=>({type:`${match[1].toLowerCase()}${match[3]?"-not":""}`,a:match[2],b:match[4]}));
  return <Frame title="Solved Venn checks" caption="Each panel is a minimal diagram of one premise; combine only deductions forced across the panels."><Svg>{premises.map((premise,i)=>{const x=125+i*225;return <g key={i}><rect x={x-90} y="30" width="180" height="165" rx="14" fill="#fff" stroke="#e2e8f0" strokeWidth="2"/><text x={x} y="52" textAnchor="middle" fontSize="12" fontWeight="900" fill="#475569">{premise.type.toUpperCase()}</text>{premise.type==="all"?<><circle cx={x} cy="122" r="55" fill="#dbeafe" stroke="#2563eb" strokeWidth="3"/><circle cx={x} cy="125" r="27" fill="#ede9fe" stroke="#7c3aed" strokeWidth="3"/><text x={x} y="129" textAnchor="middle" fontSize="11" fontWeight="800">{premise.a}</text><text x={x} y="82" textAnchor="middle" fontSize="11" fontWeight="800">{premise.b}</text></>:premise.type==="no"?<><circle cx={x-38} cy="125" r="38" fill="#fee2e2" stroke="#ef4444" strokeWidth="3"/><circle cx={x+42} cy="125" r="38" fill="#dbeafe" stroke="#2563eb" strokeWidth="3"/><text x={x-38} y="130" textAnchor="middle" fontSize="10" fontWeight="800">{premise.a}</text><text x={x+42} y="130" textAnchor="middle" fontSize="10" fontWeight="800">{premise.b}</text></>:premise.type==="some-not"?<><circle cx={x+25} cy="125" r="48" fill="#dbeafe" stroke="#2563eb" strokeWidth="3"/><circle cx={x-48} cy="125" r="8" fill="#ef4444"/><text x={x+25} y="130" textAnchor="middle" fontSize="10" fontWeight="800">{premise.b}</text><text x={x-48} y="153" textAnchor="middle" fontSize="10" fontWeight="800">some {premise.a}</text></>:<><circle cx={x-25} cy="125" r="48" fill="#ede9fe" fillOpacity=".7" stroke="#7c3aed" strokeWidth="3"/><circle cx={x+25} cy="125" r="48" fill="#dbeafe" fillOpacity=".7" stroke="#2563eb" strokeWidth="3"/><circle cx={x} cy="125" r="7" fill="#ef4444"/><text x={x-47} y="130" textAnchor="middle" fontSize="10" fontWeight="800">{premise.a}</text><text x={x+47} y="130" textAnchor="middle" fontSize="10" fontWeight="800">{premise.b}</text></>}</g>})}</Svg></Frame>;
}

function FamilyMap({ item }) {
  const statements=item.q.split(/[.;]/).map(part=>part.trim()).filter(Boolean), rows=[];
  for(const statement of statements){
    let match=statement.match(/^([A-Z][a-z]+) is ([A-Z][a-z]+)'s ([a-z-]+)/);
    if(match){rows.push({left:match[1],relation:`${match[3]} of`,right:match[2]});continue;}
    match=statement.match(/^([A-Z][a-z]+) is (?:the )?([a-z-]+) of ([A-Z][a-z]+)/);
    if(match){rows.push({left:match[1],relation:`${match[2]} of`,right:match[3]});continue;}
    match=statement.match(/^([A-Z][a-z]+) is married to ([A-Z][a-z]+)/);
    if(match){rows.push({left:match[1],relation:"married to",right:match[2]});continue;}
    match=statement.match(/^([A-Z][a-z]+) and ([A-Z][a-z]+) are married/);
    if(match)rows.push({left:match[1],relation:"married to",right:match[2]});
  }
  const people=words(item.q).slice(0,5), displayed=rows.slice(0,3);
  return <Frame title="Family-relation map" caption="Each arrow preserves the exact direction of a relationship stated in the question."><Svg height={250} viewBox="0 0 720 250">{displayed.length?displayed.map((row,i)=>{const y=36+i*70;return <g key={`${row.left}-${i}`}><rect x="75" y={y} width="165" height="48" rx="12" fill={`${palette[i]}20`} stroke={palette[i]} strokeWidth="3"/><text x="157" y={y+30} textAnchor="middle" fontSize="15" fontWeight="800" fill="#334155">{row.left}</text><line x1="245" y1={y+24} x2="465" y2={y+24} stroke="#94a3b8" strokeWidth="3"/><path d={`M465 ${y+24} l-12 -7 v14 z`} fill="#94a3b8"/><text x="355" y={y+17} textAnchor="middle" fontSize="12" fontWeight="700" fill="#7c3aed">{row.relation}</text><rect x="480" y={y} width="165" height="48" rx="12" fill={`${palette[i+2]}20`} stroke={palette[i+2]} strokeWidth="3"/><text x="562" y={y+30} textAnchor="middle" fontSize="15" fontWeight="800" fill="#334155">{row.right}</text></g>}):people.map((name,i)=>{const x=80+i*125;return <g key={name}><rect x={x} y="82" width="108" height="54" rx="12" fill={`${palette[i]}20`} stroke={palette[i]} strokeWidth="3"/><text x={x+54} y="114" textAnchor="middle" fontSize="13" fontWeight="800" fill="#334155">{name}</text></g>})}</Svg></Frame>;
}

function DirectionMap({ item }) {
  const moves=[...item.q.matchAll(/(\d+(?:\.\d+)?)\s*m\s*(north|south|east|west)/gi)].map(m=>({n:Number(m[1]),d:m[2].toLowerCase()}));
  let x=0,y=0,pts=[[0,0]];for(const move of moves){if(move.d==="north")y+=move.n;if(move.d==="south")y-=move.n;if(move.d==="east")x+=move.n;if(move.d==="west")x-=move.n;pts.push([x,y]);}
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),map=([px,py])=>[90+(px-minX)/(maxX-minX||1)*500,180-(py-minY)/(maxY-minY||1)*125],line=pts.map(map).map(p=>p.join(",")).join(" ");
  return <Frame title="Route map" caption="The polyline follows every movement in order; the dashed line is the final displacement."><Svg><text x="630" y="35" fontSize="13" fill="#334155">N ↑</text><polyline points={line} fill="none" stroke="#4f46e5" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round"/>{pts.map((p,i)=>{const [cx,cy]=map(p);return <g key={i}><circle cx={cx} cy={cy} r={i===0||i===pts.length-1?8:5} fill={i===0?"#10b981":i===pts.length-1?"#ef4444":"#4f46e5"}/><text x={cx+8} y={cy-8} fontSize="11" fill="#475569">{i===0?"Start":i===pts.length-1?"Finish":i}</text></g>})}{pts.length>1&&<line x1={map(pts[0])[0]} y1={map(pts[0])[1]} x2={map(pts.at(-1))[0]} y2={map(pts.at(-1))[1]} stroke="#ef4444" strokeWidth="3" strokeDasharray="7 5"/>}</Svg></Frame>;
}

function SeatingMap({ item, revealed }) {
  const circular=/circular table/i.test(item.q), orderMatch=item.solution.match(/(?:order is|order, up to rotation, is|schedule is)\s+([A-Za-z]+(?:\s*(?:–|→|>|,|=)\s*[A-Za-z]+){5})/i), parsed=orderMatch?.[1].split(/\s*(?:–|→|>|,|=)\s*/).filter(Boolean), namesInSolution=parsed?.length>=6?parsed:words(item.solution).filter(name=>words(item.q).includes(name)).slice(0,6), labels=revealed&&namesInSolution.length>=6?namesInSolution:Array.from({length:6},(_,i)=>`Seat ${i+1}`);
  return <Frame title={revealed?"Solved seating layout":"Seating workspace"} caption={revealed?"Use the final layout to verify neighbours, positions and opposite seats.":"Numbered seats are provided as a scratch layout; place candidates from the constraints."}><Svg>{circular?<><ellipse cx="360" cy="112" rx="145" ry="70" fill="#f1f5f9" stroke="#7c3aed" strokeWidth="4"/>{labels.map((label,i)=>{const a=Math.PI*2*i/6-Math.PI/2,x=360+225*Math.cos(a),y=112+92*Math.sin(a);return <g key={i}><circle cx={x} cy={y} r="34" fill="#fff" stroke={palette[i]} strokeWidth="4"/><text x={x} y={y+4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#334155">{label}</text></g>})}</>:labels.map((label,i)=>{const x=48+i*108;return <g key={i}><rect x={x} y="74" width="92" height="76" rx="13" fill="#fff" stroke={palette[i]} strokeWidth="4"/><text x={x+46} y="116" textAnchor="middle" fontSize="11" fontWeight="800" fill="#334155">{label}</text><text x={x+46} y="174" textAnchor="middle" fontSize="12" fill="#64748b">{i+1}</text></g>})}</Svg></Frame>;
}

function ScheduleGrid({ item, revealed }) {
  const days=["Mon","Tue","Wed","Thu","Fri","Sat"], assignments=[...item.solution.matchAll(/(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday)=([A-Za-z]+)/g)].map(match=>match[1]), projectNames=assignments.length>=6?assignments:words(item.q).filter(word=>!days.includes(word.slice(0,3))).slice(0,6), labels=revealed&&projectNames.length>=6?projectNames:Array(6).fill("?");
  return <Frame title={revealed?"Solved schedule grid":"Scheduling grid"} caption={revealed?"Read the final allocation from left to right and recheck every gap condition.":"Fill fixed days first, then exact gaps, followed by general before/after conditions."}><Svg>{days.map((day,i)=>{const x=45+i*110;return <g key={day}><rect x={x} y="58" width="96" height="104" rx="10" fill={labels[i]==="?"?"#f8fafc":`${palette[i]}18`} stroke={palette[i]} strokeWidth="3"/><text x={x+48} y="86" textAnchor="middle" fontSize="13" fontWeight="900" fill={palette[i]}>{day}</text><text x={x+48} y="126" textAnchor="middle" fontSize="11" fontWeight="700" fill="#334155">{labels[i]}</text></g>})}</Svg></Frame>;
}

function ClockFace({ item }) {
  const match=item.q.match(/(?:At|time is|actual time is)\s*(\d{1,2}):(\d{2})/i),h=Number(match?.[1]??10),m=Number(match?.[2]??10),minute=-Math.PI/2+m/60*2*Math.PI,hour=-Math.PI/2+(h%12+m/60)/12*2*Math.PI;
  const hand=(angle,length)=>[360+Math.cos(angle)*length,112+Math.sin(angle)*length];const mp=hand(minute,75),hp=hand(hour,48);
  return <Frame title="Analogue clock" caption={`Clock face drawn for ${h}:${String(m).padStart(2,"0")}; the hour hand includes its minute-by-minute movement.`}><Svg><circle cx="360" cy="112" r="103" fill="#fff" stroke="#7c3aed" strokeWidth="5"/>{Array.from({length:12},(_,i)=>{const a=-Math.PI/2+i/12*2*Math.PI,x=360+Math.cos(a)*88,y=112+Math.sin(a)*88;return <text key={i} x={x} y={y+5} textAnchor="middle" fontSize="13" fill="#475569">{i||12}</text>})}<line x1="360" y1="112" x2={hp[0]} y2={hp[1]} stroke="#0f172a" strokeWidth="7" strokeLinecap="round"/><line x1="360" y1="112" x2={mp[0]} y2={mp[1]} stroke="#ef4444" strokeWidth="4" strokeLinecap="round"/><circle cx="360" cy="112" r="7" fill="#4f46e5"/></Svg></Frame>;
}

function CalendarVisual({ item }) {
  const dateMatch=item.q.match(/(\d{2})-(\d{2})-(\d{4})/), vals=numbers(item.q), highlighted=Number(dateMatch?.[1]??0), year=Number(dateMatch?.[3]??vals.find(value=>value>1900)??new Date().getFullYear()), weekdays=["S","M","T","W","T","F","S"];
  return <Frame title={/leap/i.test(item.q)?"Leap-year timeline":"Calendar workspace"} caption={/leap/i.test(item.q)?"Apply the complete divisibility-by-4, century and 400-year rules to the shown interval.":"Reduce day shifts modulo seven and mark the target date on the weekday grid."}><Svg>
    {/leap/i.test(item.q)?<>
      {Array.from({length:6},(_,i)=>{const y=(vals[0]??year)+i*4;return <g key={y}><circle cx={95+i*105} cy="105" r="28" fill={y%400===0||(y%4===0&&y%100!==0)?"#dcfce7":"#f1f5f9"} stroke={palette[i]} strokeWidth="3"/><text x={95+i*105} y="110" textAnchor="middle" fontSize="13" fontWeight="800" fill="#334155">{y}</text></g>})}
      <line x1="95" y1="145" x2="620" y2="145" stroke="#94a3b8" strokeWidth="3"/>
    </>:<>
      {weekdays.map((day,i)=><text key={i} x={170+i*62} y="36" textAnchor="middle" fontSize="13" fontWeight="900" fill="#64748b">{day}</text>)}
      {Array.from({length:31},(_,i)=>{const day=i+1,x=140+(i%7)*62,y=48+Math.floor(i/7)*32,active=day===highlighted;return <g key={i}><rect x={x} y={y} width="58" height="28" rx="5" fill={active?"#ede9fe":"#f8fafc"} stroke={active?"#7c3aed":"#e2e8f0"}/><text x={x+29} y={y+19} textAnchor="middle" fontSize="11" fontWeight={active?"900":"500"} fill="#334155">{day}</text></g>})}
      <text x="70" y="118" textAnchor="middle" fontSize="18" fontWeight="900" fill="#7c3aed">{dateMatch?`${dateMatch[2]}/${year}`:`+${vals.at(-1)??"n"} days`}</text>
    </>}
  </Svg></Frame>;
}

function SpatialVisual({ item }) {
  const vals=numbers(item.q);
  if(/cube net/.test(item.q.toLowerCase())){const faceLabels=unique([...item.q.matchAll(/\b[A-F]\d?\b/g)].map(match=>match[0])).slice(0,6);while(faceLabels.length<6)faceLabels.push(String.fromCharCode(65+faceLabels.length));return <Frame title="Cube net" caption="Trace shared edges before identifying opposite faces."><Svg>{[[260,75],[330,75],[400,75],[470,75],[330,5],[330,145]].map(([x,y],i)=><g key={i}><rect x={x} y={y} width="70" height="70" fill={`${palette[i]}22`} stroke={palette[i]} strokeWidth="3"/><text x={x+35} y={y+41} textAnchor="middle" fontSize="16" fontWeight="800">{faceLabels[i]}</text></g>)}</Svg></Frame>}
  if(/paper|fold/.test(item.q.toLowerCase()))return <Frame title="Paper-fold model" caption="Each half-fold doubles the layer count; punches away from creases reproduce symmetrically."><Svg>{[0,1,2].map(i=><rect key={i} x={220+i*18} y={35+i*15} width="280" height="145" rx="4" fill="#ede9fe" stroke="#7c3aed" strokeWidth="3" opacity={.45+i*.2}/>)}<circle cx="380" cy="112" r="10" fill="#ef4444"/><text x="360" y="207" textAnchor="middle" fontSize="14" fill="#475569">folds/layers from question: {vals.slice(0,2).join(" · ")}</text></Svg></Frame>;
  if(/arrow|rotation/.test(item.q.toLowerCase()))return <Frame title="Rotation tracker" caption="Reduce repeated rotations modulo four quarter-turns."><Svg>{[0,1,2,3].map((_,i)=><g key={i} transform={`translate(${165+i*135} 110) rotate(${i*90})`}><path d="M-35 8 H25 V27 L60 0 L25 -27 V-8 H-35 Z" fill={palette[i]}/></g>)}</Svg></Frame>;
  if(/figure series/.test(item.q.toLowerCase())){const shapes=[...item.q.matchAll(/(circle|triangle|square|star|pentagon|diamond)/gi)].map(m=>m[1]).slice(0,5);return <Frame title="Figure sequence" caption="Track the constant jump through the stated shape cycle."><Svg>{shapes.map((shape,i)=><g key={i}><rect x={65+i*125} y="62" width="95" height="95" rx="16" fill={`${palette[i]}18`} stroke={palette[i]} strokeWidth="3"/><text x={112+i*125} y="116" textAnchor="middle" fontSize="13" fontWeight="800" fill="#334155">{shape}</text>{i<4&&<text x={174+i*125} y="116" fontSize="22" fill="#64748b">→</text>}</g>)}</Svg></Frame>}
  return <Frame title="Painted-cube model" caption="Separate corner, edge, face-centre and internal cubes before counting."><Svg><path d="M255 65 L390 28 L495 83 L360 122 Z M255 65 V165 L360 208 V122 M360 208 L495 165 V83" fill="#dbeafe" stroke="#2563eb" strokeWidth="4"/><path d="M300 53 V180 M345 41 V198 M405 36 V193 M450 60 V180 M255 100 L360 142 L495 103 M255 135 L360 172 L495 135" fill="none" stroke="#60a5fa" strokeWidth="2" opacity=".8"/></Svg></Frame>;
}

export default function QuestionVisual({ item, kind, revealed=false }) {
  if(!item || !supportsQuestionVisual(kind))return null;
  if(kind==="dataInterpretation")return <DataChart item={item}/>;
  if(kind==="mensuration")return <Geometry item={item}/>;
  if(kind==="probability")return <ProbabilityVisual item={item}/>;
  if(kind==="distance")return <MotionVisual item={item}/>;
  if(kind==="trainsBoats")return <MotionVisual item={item} train/>;
  if(kind==="mixture")return <MixtureVisual item={item}/>;
  if(kind==="syllogisms")return <SetMap item={item} revealed={revealed}/>;
  if(kind==="bloodRelations")return <FamilyMap item={item}/>;
  if(kind==="directionSense")return <DirectionMap item={item}/>;
  if(kind==="seatingArrangements")return <SeatingMap item={item} revealed={revealed}/>;
  if(kind==="analyticalPuzzles")return <ScheduleGrid item={item} revealed={revealed}/>;
  if(kind==="clocksCalendars")return /clock|analogue|mirror/i.test(item.q)?<ClockFace item={item}/>:<CalendarVisual item={item}/>;
  if(kind==="nonVerbalSpatial")return <SpatialVisual item={item}/>;
  return null;
}
