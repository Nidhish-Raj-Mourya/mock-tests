import { buildLogicalBank } from "./LogicalQuestionFactory.js";

const nounSets = [
  ["analysts", "mentors", "leaders"],
  ["coders", "testers", "engineers"],
  ["designers", "reviewers", "managers"],
  ["interns", "graduates", "trainees"],
  ["auditors", "consultants", "advisers"],
  ["planners", "coordinators", "directors"],
];
const optionSet = ["Only conclusion I follows", "Only conclusion II follows", "Both conclusions follow", "Neither conclusion follows"];
const a="A", b="B", c="C";

const cases = [
  ["Barbara chain",(a,b,c)=>[`All ${a} are ${b}.`,`All ${b} are ${c}.`],[`All ${a} are ${c}.`,`All ${c} are ${a}.`],0,"The subset chain A inside B inside C forces A inside C, but it does not reverse C into A."],
  ["Universal exclusion",(a,b,c)=>[`All ${a} are ${b}.`,`No ${b} is a ${c}.`],[`No ${a} is a ${c}.`,`No ${c} is an ${a}.`],2,"A lies inside B and B is disjoint from C, so A and C are disjoint; the no-relation statement is symmetric."],
  ["Particular chain",(a,b,c)=>[`Some ${a} are ${b}.`,`All ${b} are ${c}.`],[`Some ${a} are ${c}.`,`All ${a} are ${c}.`],0,"The known A-B members enter C because every B is C, but unknown A members prevent a universal conclusion."],
  ["Particular exclusion",(a,b,c)=>[`Some ${a} are ${b}.`,`No ${b} is a ${c}.`],[`Some ${a} are not ${c}.`,`No ${a} is a ${c}.`],0,"The particular A-B members cannot be C, proving some A are not C; other A may still be C."],
  ["No relation with particular",(a,b,c)=>[`No ${a} is a ${b}.`,`Some ${c} are ${a}.`],[`Some ${c} are not ${b}.`,`No ${c} is a ${b}.`],0,"The specified C-A members cannot be B, while other C members remain unrestricted."],
  ["Particular overlap transfer",(a,b,c)=>[`All ${a} are ${b}.`,`Some ${a} are ${c}.`],[`Some ${c} are ${b}.`,`Some ${b} are ${c}.`],2,"The witnessed members belong to A and C; since A is inside B, those same members establish both equivalent particular overlaps."],
  ["Undistributed middle",(a,b,c)=>[`Some ${a} are ${b}.`,`Some ${b} are ${c}.`],[`Some ${a} are ${c}.`,`No ${a} is a ${c}.`],3,"The two some-statements may refer to different B members, so neither overlap nor separation of A and C is forced."],
  ["Common superset",(a,b,c)=>[`All ${a} are ${b}.`,`All ${c} are ${b}.`],[`Some ${a} are ${c}.`,`No ${a} is a ${c}.`],3,"Sharing the same superset B does not determine whether subsets A and C overlap or remain separate."],
  ["Two exclusions",(a,b,c)=>[`No ${a} is a ${b}.`,`No ${b} is a ${c}.`],[`No ${a} is a ${c}.`,`Some ${a} are ${c}.`],3,"Both A and C are outside B, but their mutual relationship remains completely undetermined."],
  ["Some-not transfer",(a,b,c)=>[`Some ${a} are not ${b}.`,`All ${a} are ${c}.`],[`Some ${c} are not ${b}.`,`All ${c} are ${a}.`],0,"The witnessed A-not-B member must be C, proving some C are not B; the universal relation cannot be reversed."],
  ["Superset witness",(a,b,c)=>[`All ${a} are ${b}.`,`Some ${b} are ${c}.`],[`Some ${c} are ${b}.`,`Some ${c} are ${a}.`],0,"The second premise itself converts to some C are B, but its B-C witness need not belong to subset A."],
  ["Particular conversion",(a,b,c)=>[`Some ${a} are ${b}.`,`No ${b} is a ${c}.`],[`Some ${b} are ${a}.`,`Some ${c} are not ${a}.`],0,"Some A are B converts safely to some B are A; nothing guarantees that any C exists or lies outside A."],
  ["Exclusion plus inclusion",(a,b,c)=>[`No ${a} is a ${b}.`,`All ${c} are ${a}.`],[`No ${c} is a ${b}.`,`No ${b} is a ${c}.`],2,"C is inside A and A is disjoint from B, so C and B are disjoint in both statement directions."],
  ["Nested particular existence",(a,b,c)=>[`All ${a} are ${b}.`,`All ${b} are ${c}.`,`Some ${a} exist.`],[`Some ${c} are ${a}.`,`Some ${b} are ${c}.`],2,"The explicit A witness lies in B and C; it establishes C-A overlap and also B-C overlap."],
  ["Some middle outside",(a,b,c)=>[`All ${a} are ${b}.`,`Some ${b} are not ${c}.`],[`Some ${a} are not ${c}.`,`Some ${b} are not ${c}.`],1,"The second conclusion repeats the witnessed fact, while that witness may be a B outside subset A."],
  ["No A B with some B C",(a,b,c)=>[`No ${a} is a ${b}.`,`Some ${b} are ${c}.`],[`Some ${c} are not ${a}.`,`Some ${a} are not ${c}.`],0,"The B-C witness cannot be A, proving some C are not A; existence of an A outside C is not supplied."],
  ["All A B some C not B",(a,b,c)=>[`All ${a} are ${b}.`,`Some ${c} are not ${b}.`],[`Some ${c} are not ${a}.`,`No ${c} is an ${a}.`],0,"Anything outside B must be outside subset A, so the witnessed C is not A; other C may still be A."],
  ["All A B no C A",(a,b,c)=>[`All ${a} are ${b}.`,`No ${c} is an ${a}.`],[`No ${a} is a ${c}.`,`No ${b} is a ${c}.`],0,"No C is A converts to no A is C, but B can include members unrelated to A and may overlap C."],
  ["Some A C all C B",(a,b,c)=>[`Some ${a} are ${c}.`,`All ${c} are ${b}.`],[`Some ${a} are ${b}.`,`Some ${b} are ${a}.`],2,"The A-C witness enters B through C, establishing the same A-B overlap in both particular directions."],
  ["Some A B some A C",(a,b,c)=>[`Some ${a} are ${b}.`,`Some ${a} are ${c}.`],[`Some ${b} are ${c}.`,`Some ${c} are not ${b}.`],3,"The two some-premises may use different A members, so B-C overlap and separation are both merely possible."],
  ["All A B no A C",(a,b,c)=>[`All ${a} are ${b}.`,`No ${a} is a ${c}.`,`Some ${a} exist.`],[`Some ${b} are not ${c}.`,`Some ${c} are not ${b}.`],0,"The existing A member is inside B and outside C, proving some B are not C; no C existence or location is guaranteed."],
  ["No B C some A B",(a,b,c)=>[`No ${b} is a ${c}.`,`Some ${a} are ${b}.`],[`Some ${a} are not ${c}.`,`Some ${c} are not ${a}.`],0,"The A-B witness cannot be C, proving the first conclusion; the premises do not guarantee any C member."],
  ["All C B no A B",(a,b,c)=>[`All ${c} are ${b}.`,`No ${a} is a ${b}.`],[`No ${a} is a ${c}.`,`No ${c} is an ${a}.`],2,"C lies inside B while A is outside B, so A and C cannot overlap; universal exclusion converts symmetrically."],
  ["Either overlap unresolved",(a,b,c)=>[`Some ${a} are not ${b}.`,`Some ${c} are ${b}.`],[`Some ${a} are not ${c}.`,`Some ${c} are not ${a}.`],3,"The two witnesses give no fixed A-C placement; they can coincide only where conditions permit or remain separate."],
  ["Three-level exclusion",(a,b,c)=>[`All ${a} are ${b}.`,`All ${b} are ${c}.`,`No ${c} are leaders.`],[`No ${a} are leaders.`,`No ${b} are leaders.`],2,"A and B both lie within C, and C is disjoint from leaders; therefore both nested groups are disjoint from leaders."],
];

const patterns = cases.map(([name,premises,conclusions,answer,reason]) => v => {
  const [a,b,c]=nounSets[v-1];
  const grammar=text=>text.replace(/No ([a-z]+) is an? ([a-z]+)/gi,"No $1 are $2");
  const p=premises(a,b,c).map(grammar);
  const render=text=>grammar(text.replace(/\bA\b/g,a).replace(/\bB\b/g,b).replace(/\bC\b/g,c));
  const q=conclusions.map(render);
  return {
    subtopic:name,
    prompt:`Statements: ${p.join(" ")} Conclusions: I. ${q[0]} II. ${q[1]} Select the conclusion status that necessarily follows.`,
    correct:optionSet[answer],
    distractors:optionSet.filter((_,index)=>index!==answer),
    explanation:reason,
    assessmentStyle:"multi-step",
    shortcut:"Draw three minimal set circles. Mark explicit existence before testing each conclusion independently.",
    commonMistake:"Do not reverse an all-statement, merge two separate some-witnesses, or assume existence from a universal statement alone.",
  };
});

export const syllogismLogicalBank=()=>buildLogicalBank(patterns);
