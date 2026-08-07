import { buildVerbalBank } from "./VerbalQuestionFactory.js";

const names=["Aarav","Meera","Kabir","Naina","Rohan","Sara"], teams=["analytics team","quality committee","design group","audit panel","research unit","support crew"], projects=["migration","prototype","compliance review","market study","release plan","training programme"];
const pick=(values,v,offset=0)=>values[(v-1+offset)%values.length];
const segmented=parts=>parts.map((part,index)=>`(${String.fromCharCode(65+index)}) ${part}`).join(" ");

const errorSpecs=[
 ["Subject–verb agreement: collective unit",v=>({parts:[`The ${pick(teams,v)}`,"have approved",`the ${pick(projects,v)}`,"unanimously."],error:1,fix:"has approved",why:"A collective noun acting as one decision-making unit takes a singular verb."})],
 ["Agreement with neither–nor",v=>({parts:[`Neither ${pick(names,v)} nor`,`${pick(names,v,1)}'s colleagues`,`was available`,`for interview round ${v}.`],error:2,fix:"were available",why:"With neither–nor, the verb agrees with the nearer plural subject, colleagues."})],
 ["Agreement after each of",v=>({parts:["Each of the shortlisted applicants","have submitted",`a portfolio for role ${v}`,"before the deadline."],error:1,fix:"has submitted",why:"Each is singular even when followed by a plural of-phrase."})],
 ["Uncountable noun agreement",v=>({parts:[`The equipment for lab ${v}`,"were delivered","after inspection","without damage."],error:1,fix:"was delivered",why:"Equipment is an uncountable singular noun and takes a singular verb."})],
 ["Past perfect sequence",v=>({parts:[`By the time ${pick(names,v)} arrived,`,`the presentation already started`,`in conference room ${v}`,"without the final slide."],error:1,fix:"the presentation had already started",why:"The earlier of two past actions is expressed with the past perfect."})],
 ["Parallel verb forms",v=>({parts:[`The role requires analysing data,`,`preparing dashboards,`,`and to explain findings`,`to client team ${v}.`],error:2,fix:"and explaining findings",why:"Items in a coordinated list must use parallel grammatical forms."})],
 ["Pronoun case after preposition",v=>({parts:[`The manager shared the feedback`,`between ${pick(names,v)}`,`and I`,`after assessment ${v}.`],error:2,fix:"and me",why:"A pronoun governed by a preposition must be in the objective case."})],
 ["Dangling modifier",v=>({parts:["After reviewing the incident log,","the network fault","was obvious",`to ${pick(names,v)}.`],error:0,fix:`After ${pick(names,v)} reviewed the incident log,`,why:"The introductory modifier must logically describe the grammatical subject that follows."})],
 ["Comparative degree",v=>({parts:[`This algorithm is more faster`,`than the version used`,`in sprint ${v}`,"under identical load."],error:0,fix:"This algorithm is faster",why:"Faster is already comparative, so more creates an incorrect double comparative."})],
 ["Preposition with responsible",v=>({parts:[`${pick(names,v)} is responsible`,`of validating`,`the invoices generated`,`during cycle ${v}.`],error:1,fix:"for validating",why:"The adjective responsible conventionally takes the preposition for."})],
 ["Indefinite article choice",v=>({parts:[`${pick(names,v)} prepared`,`a honest estimate`,`for phase ${v}`,"of the integration."],error:1,fix:"an honest estimate",why:"Article choice follows sound; honest begins with a vowel sound because h is silent."})],
 ["Gerund after preposition",v=>({parts:[`The analyst succeeded`,`by to compare`,`all six samples`,`before review ${v}.`],error:1,fix:"by comparing",why:"A preposition is followed by a noun or gerund, not a to-infinitive."})],
 ["Third conditional form",v=>({parts:[`If the backup had run,`,`the team would recover`,`the deleted records`,`before audit ${v}.`],error:1,fix:"the team would have recovered",why:"An unreal past condition requires would have plus past participle in the result clause."})],
 ["Reported speech backshift",v=>({parts:[`${pick(names,v)} said that`,`the server is failing`,`during the previous night`,`in region ${v}.`],error:1,fix:"the server had failed",why:"A completed action before a past reporting verb normally backshifts to past perfect."})],
 ["Relative pronoun for possession",v=>({parts:[`The applicant which portfolio`,`won the panel's approval`,`joined cohort ${v}`,"on Monday."],error:0,fix:"The applicant whose portfolio",why:"Whose expresses possession for people; which cannot replace a possessive relative."})],
 ["Agreement across an intervening phrase",v=>({parts:[`The list of defects`,`are attached`,`to ticket ${100+v}`,"for verification."],error:1,fix:"is attached",why:"The head of the subject is singular list; the plural noun in the of-phrase does not control agreement."})],
 ["Correlative conjunction balance",v=>({parts:[`${pick(names,v)} not only documented`,`the defect but also`,`a workaround was proposed`,`during sprint ${v}.`],error:2,fix:"proposed a workaround",why:"Not only and but also must connect grammatically parallel elements."})],
 ["Redundant expression",v=>({parts:[`The two teams collaborated together`,`on release ${v}`,"to reduce duplicate work","across locations."],error:0,fix:"The two teams collaborated",why:"Collaborate already means work together, making together redundant."})],
 ["Double negative",v=>({parts:[`${pick(names,v)} could not find`,`no inconsistency`,`in dataset ${v}`,"after two reviews."],error:1,fix:"any inconsistency",why:"Standard formal English avoids using two negatives to express one negation."})],
 ["Adjective–adverb distinction",v=>({parts:[`The ${pick(teams,v)}`,"performed good",`during sprint ${v}`,"despite the compressed schedule."],error:1,fix:"performed well",why:"The verb performed must be modified by the adverb well, not the adjective good."})],
 ["Participial construction",v=>({parts:["Having completed the test,",`the results were emailed`,`to ${pick(names,v)}`,`for round ${v}.`],error:1,fix:`${pick(names,v)} emailed the results`,why:"The implied subject of having completed must be the person named in the main clause."})],
 ["Number versus amount",v=>({parts:[`A large amount of applicants`,`attended drive ${v}`,"despite heavy rain","near the campus."],error:0,fix:"A large number of applicants",why:"Number is used with countable plural nouns; amount is used with uncountable nouns."})],
 ["Fewer versus less",v=>({parts:[`The revised form has less fields`,`than version ${v}`,"but captures","the same information."],error:0,fix:"The revised form has fewer fields",why:"Fewer modifies countable plural nouns such as fields."})],
 ["Since versus for",v=>({parts:[`${pick(names,v)} has worked remotely`,`since three months`,`on the ${pick(projects,v)}`,"without interruption."],error:1,fix:"for three months",why:"For introduces a duration; since introduces a starting point."})],
 ["No sooner construction",v=>({parts:[`No sooner had build ${v} finished`,`when the alerts appeared`,"on the monitoring screen","during validation."],error:1,fix:"than the alerts appeared",why:"The fixed correlative construction is no sooner ... than."})],
];

const errorPatterns=errorSpecs.map(([subtopic,make])=>v=>{const data=make(v),labels=data.parts.map((_,i)=>`Part ${String.fromCharCode(65+i)}`),correct=labels[data.error];return{subtopic,prompt:`Identify the part containing the grammatical error. ${segmented(data.parts)}`,correct,distractors:labels.filter(label=>label!==correct).slice(0,3),explanation:`${data.why} In Part ${String.fromCharCode(65+data.error)}, “${data.parts[data.error]}” must be replaced by “${data.fix}”; the remaining segments are grammatically compatible.`,assessmentStyle:"contextual"};});

const correctionPatterns=errorSpecs.map(([subtopic,make])=>v=>{const data=make(v),wrong=data.parts[data.error],correct=data.fix;return{subtopic,prompt:`Choose the best replacement for the underlined portion in this sentence: ${data.parts.join(" ")} [Replace: “${wrong}”]`,correct,distractors:[wrong,correct.replace(/\b(has|had|is|was|were|for|than)\b/i,match=>({has:"have",had:"has",is:"are",was:"were",were:"was",for:"since",than:"when"}[match.toLowerCase()]||match)),"No improvement"],explanation:`${data.why} The replacement “${correct}” repairs the tested construction without changing the intended workplace meaning.`,assessmentStyle:"contextual"};});

const grammarConcepts=errorSpecs.map(([subtopic,make],index)=>v=>{const data=make(v),correct=data.fix,wrong=data.parts[data.error];return{subtopic,prompt:`In placement set ${v}, which option correctly applies the rule tested by this phrase: “${wrong}”?`,correct,distractors:[wrong,correct+" only",index%2?"Both forms are always interchangeable":"The rule depends only on punctuation"],explanation:`${data.why} Therefore “${correct}” is the grammatically valid application in this context, whereas “${wrong}” violates the named rule.`,assessmentStyle:index<5?"direct":"contextual"};});

const completionSpecs=[
 ["Contrast connector","although","because","therefore","unless","the pilot missed its target, the team retained it because customer satisfaction improved"],
 ["Cause connector","because","although","nevertheless","whereas","the deployment was postponed, the security review had identified a critical dependency"],
 ["Result connector","therefore","however","unless","despite","the response time fell below the service threshold; the team therefore increased capacity"],
 ["Conditional connector","unless","because","although","therefore","the checksum matches, the file must not be released"],
 ["Concession connector","despite","because of","therefore","unless","receiving limited training, the new analyst completed the audit accurately"],
 ["Purpose infinitive","to prevent","preventing","prevented","for prevent","duplicate payments, the workflow validates every invoice number"],
 ["Past perfect completion","had completed","completed","has completed","was completing","the regression suite before the client joined the review call"],
 ["Present perfect duration","has managed","managed","is managing","had manage","the service desk since the process was introduced"],
 ["Future condition","passes","will pass","passed","would pass","the build passes all mandatory checks before it is promoted"],
 ["Modal of obligation","must","might","could","would","all candidates must present a valid identity document at check-in"],
 ["Modal of deduction","must have","should","can","will","the earlier job must have failed because no output file exists"],
 ["Collocation: meet a deadline","meet","catch","touch","arrive","the team must meet the revised deadline without reducing test coverage"],
 ["Collocation: raise a concern","raised","lifted","grew","mounted","the reviewer raised a concern about access controls during the walkthrough"],
 ["Collocation: draw a conclusion","draw","pull","paint","make up","the panel cannot draw a conclusion from a sample of only two users"],
 ["Contextual precision: feasible","feasible","fragile","casual","decorative","the proposal is feasible within the available budget and six-week schedule"],
 ["Contextual precision: mitigate","mitigate","multiply","imitate","postpone","the new control is designed to mitigate the risk of duplicate refunds"],
 ["Contextual precision: corroborate","corroborate","contradict","conceal","estimate","the timestamped logs corroborate the engineer's account of the outage"],
 ["Contextual precision: ambiguous","ambiguous","transparent","mandatory","concise","the requirement was ambiguous, so two teams implemented different interpretations"],
 ["Parallel completion","documenting","to document","documented","document","the role involves gathering evidence, interviewing users and documenting exceptions"],
 ["Gerund complement","implementing","to implemented","implement","implemented","the committee recommended implementing the control in every regional office"],
 ["Infinitive complement","to revise","revising","revised","revise","the product owner agreed to revise the acceptance criteria before planning"],
 ["Relative clause completion","that","what","where","whose","the dashboard that the analyst created updates every fifteen minutes"],
 ["Comparison completion","than","then","from","to","the automated process is more reliable than the manual workaround"],
 ["Paired conjunction","but also","and too","as well","rather","the change not only reduced errors but also shortened processing time"],
 ["Tone-aware completion","respectfully","carelessly","aggressively","vaguely","the candidate respectfully disagreed and supported the alternative with evidence"],
];

const completionPatterns=completionSpecs.map(([subtopic,correct,...rest],index)=>v=>{const [wrong1,wrong2,wrong3,base]=rest,escaped=correct.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"),matcher=new RegExp(`\\b${escaped}\\b`,"i"),sentence=matcher.test(base)?base.replace(matcher,"[BLANK]"):`[BLANK] ${base}`;return{subtopic,prompt:`Choose the option that best completes the sentence in assessment scenario ${v}: ${sentence}.`,correct,distractors:[wrong1,wrong2,wrong3],explanation:`“${correct}” supplies the ${subtopic.toLowerCase()} relationship required by the clause. The other choices either reverse the logic, violate the governing construction, or create an unsuitable workplace tone.`,assessmentStyle:index<5?"multi-step":"contextual"};});

export const errorDetectionVerbalBank=()=>buildVerbalBank(errorPatterns);
export const sentenceCorrectionVerbalBank=()=>buildVerbalBank(correctionPatterns);
export const grammarFundamentalsVerbalBank=()=>buildVerbalBank(grammarConcepts);
export const sentenceCompletionVerbalBank=()=>buildVerbalBank(completionPatterns);
