const q = (text, opts, ans, explanation) => ({ text, opts, ans, explanation });

const percentage = [
  q("A salary is increased by 20% and then reduced by 10%. What is the net percentage change?",["8% increase","10% increase","8% decrease","No change"],0,"Use successive multipliers: 1.20 × 0.90 = 1.08. The final salary is 108% of the original, so the net change is an 8% increase."),
  q("The price of an item rises from ₹800 to ₹920. By what percentage must the new price be reduced to return to ₹800?",["13.04%","15%","12%","11.5%"],0,"Required reduction is calculated on the new price: (920−800)/920 × 100 = 120/920 × 100 = 13.04%."),
  q("A number is 25% less than 480. What is the number?",["360","380","400","420"],0,"A 25% reduction leaves 75% of the original. Therefore 480 × 0.75 = 360."),
  q("If A is 40% more than B, then B is what percent less than A?",["28.57%","40%","25%","33.33%"],0,"Let B=100, so A=140. Percentage by which B is less than A is 40/140 × 100 = 28.57%."),
  q("A town's population grows by 10% in one year and falls by 10% the next year. Find the net change.",["1% decrease","No change","1% increase","2% decrease"],0,"The multiplier is 1.10 × 0.90 = 0.99. The population becomes 99% of the original, a 1% decrease."),
  q("In an examination, a candidate needs 40% to pass. She scores 220 and fails by 20 marks. What are the maximum marks?",["600","550","500","650"],0,"Pass marks are 220+20=240. Since 240 is 40% of the maximum, maximum marks = 240×100/40 = 600."),
  q("The price of petrol increases by 25%. By what percentage should consumption decrease to keep expenditure unchanged?",["20%","25%","16.67%","22.5%"],0,"For unchanged expenditure, reduction = 100×25/(100+25) = 2500/125 = 20%."),
  q("A company's revenue rises by 20%, while its expenditure rises by 10%. Initially revenue was ₹5 lakh and expenditure ₹4 lakh. By what percentage does profit increase?",["60%","50%","40%","20%"],0,"Old profit = 5−4=₹1 lakh. New revenue=₹6 lakh and expenditure=₹4.4 lakh, so new profit=₹1.6 lakh. Increase=0.6/1×100=60%."),
  q("Sixty percent of a class are boys. If 20% of boys and 25% of girls are absent, what percentage of the class is present?",["78%","79%","80%","77%"],0,"Absent percentage = 0.60×20 + 0.40×25 = 12+10=22%. Therefore present percentage = 100−22=78%."),
  q("A machine depreciates by 20% annually. If its value after two years is ₹64,000, what was its original value?",["₹1,00,000","₹96,000","₹80,000","₹1,20,000"],0,"After two years the value multiplier is 0.8²=0.64. Original value = 64,000/0.64 = ₹1,00,000."),
  q("The numerator of a fraction is increased by 20% and its denominator is decreased by 20%. By what percentage does the fraction increase?",["50%","40%","44%","25%"],0,"New fraction/original fraction = 1.20/0.80 = 1.5. It becomes 150% of the original, an increase of 50%."),
  q("In an election, 15% did not vote and 10% of votes cast were invalid. The winner received 60% of valid votes. What percent of all registered voters voted for the winner?",["45.9%","51%","54%","46.5%"],0,"Votes cast=85%; valid votes=85%×90%=76.5%; winner's share=76.5%×60%=45.9% of registered voters."),
  q("A liquid contains 30% water. How much water must be added to 40 litres so that water becomes 44% of the mixture?",["10 litres","8 litres","12 litres","14 litres"],0,"Initial water=12 L. Let x be added: (12+x)/(40+x)=0.44. Solving gives 12+x=17.6+0.44x, so 0.56x=5.6 and x=10 L."),
  q("A person spends 30% of income on rent, 20% of the remainder on food, and saves ₹11,200. Find the income.",["₹20,000","₹18,000","₹22,400","₹25,000"],0,"After rent, 70% remains. After food, 80% of that remains: 0.70×0.80=0.56. Income=11,200/0.56=₹20,000."),
  q("A value is increased by 10%, then by 20%, and finally decreased by 25%. Find the net percentage change.",["1% decrease","5% decrease","No change","2% increase"],0,"Combined multiplier = 1.10×1.20×0.75 = 0.99. The final value is 99% of the original, so the net change is a 1% decrease."),
];

const syllogismOpts=["Only conclusion I follows","Only conclusion II follows","Both conclusions follow","Neither conclusion follows"];
const syllogism = [
  q("Statements: All coders are logical. Some engineers are coders.\nI. Some engineers are logical.\nII. All logical people are engineers.",syllogismOpts,0,"The engineers who are coders must also be logical, so I follows. The statements do not say that every logical person is an engineer, so II does not follow."),
  q("Statements: No tablet is a laptop. Some devices are tablets.\nI. Some devices are not laptops.\nII. No device is a laptop.",syllogismOpts,0,"The devices that are tablets cannot be laptops, so I follows. Other devices may be laptops, so the universal conclusion II does not follow."),
  q("Statements: All managers are graduates. All graduates are readers.\nI. All managers are readers.\nII. Some readers are managers.",syllogismOpts,0,"The chain Managers→Graduates→Readers proves I. Universal statements do not guarantee that managers exist, so the particular conclusion II does not follow."),
  q("Statements: Some artists are dancers. All dancers are fit.\nI. Some artists are fit.\nII. Some fit people are artists.",syllogismOpts,2,"The artists who are dancers are fit. Therefore some artists are fit, and conversion of this particular affirmative gives some fit people are artists. Both follow."),
  q("Statements: No doctor is careless. Some researchers are doctors.\nI. Some researchers are not careless.\nII. Some careless people are researchers.",syllogismOpts,0,"Researchers who are doctors cannot be careless, proving I. Nothing establishes a careless researcher, so II does not follow."),
  q("Statements: Some books are journals. Some journals are digital.\nI. Some books are digital.\nII. Some digital items are journals.",syllogismOpts,1,"The two 'some' groups of journals may be different, so I is not certain. From 'some journals are digital,' conversion proves that some digital items are journals, so II follows."),
  q("Statements: All roses are flowers. No flower is metallic.\nI. No rose is metallic.\nII. Some flowers are roses.",syllogismOpts,0,"Roses are contained within flowers, and flowers exclude metallic objects, so I follows. The premises do not assert that roses exist, so II does not follow."),
  q("Statements: Some analysts are writers. No writer is silent.\nI. Some analysts are not silent.\nII. No analyst is silent.",syllogismOpts,0,"The analysts who are writers cannot be silent, so I follows. Analysts outside that overlap may be silent, so II is too broad."),
  q("Statements: All servers are machines. Some machines are portable.\nI. Some servers are portable.\nII. Some portable things are machines.",syllogismOpts,1,"Portable machines need not be servers, so I does not follow. 'Some machines are portable' validly converts to 'some portable things are machines,' proving II."),
  q("Statements: No poet is dull. All poets are imaginative.\nI. Some imaginative people are not dull.\nII. No imaginative person is dull.",syllogismOpts,3,"The statements do not guarantee that poets exist, so I is not forced. They describe only poets, not every imaginative person, so II also does not follow."),
  q("Statements: Some interns are employees. All employees are insured. No insured person is temporary.\nI. Some interns are not temporary.\nII. No employee is temporary.",syllogismOpts,2,"Intern-employees are insured and therefore not temporary, proving I. Since all employees are insured and no insured person is temporary, II also follows."),
  q("Statements: All pens are tools. Some tools are expensive. No expensive item is disposable.\nI. Some pens are not disposable.\nII. Some tools are not disposable.",syllogismOpts,1,"The expensive tools may not be pens, so I is uncertain. Those expensive tools are not disposable, which proves that some tools are not disposable; II follows."),
  q("Statements: Some cars are electric. All electric vehicles are quiet. Some quiet vehicles are costly.\nI. Some cars are quiet.\nII. Some electric vehicles are costly.",syllogismOpts,0,"Electric cars must be quiet, proving I. The costly quiet vehicles need not be the electric vehicles, so II does not necessarily follow."),
  q("Statements: No chair is a table. All desks are tables. Some furniture items are chairs.\nI. No desk is a chair.\nII. Some furniture items are not tables.",syllogismOpts,2,"Desks are tables and no table can be a chair, so I follows. The furniture items that are chairs are not tables, proving II."),
  q("Statements: Some leaders are mentors. Some mentors are teachers. No teacher is impatient.\nI. Some leaders are teachers.\nII. Some mentors are not impatient.",syllogismOpts,1,"The leader-mentor group and teacher-mentor group may differ, so I is uncertain. Mentors who are teachers cannot be impatient, proving II."),
];

const errorOpts=["Part A contains the error","Part B contains the error","Part C contains the error","No error"];
const verbal = [
  q("A: Each of the candidates / B: have submitted / C: the required documents.",errorOpts,1,"'Each' is singular, so the verb must be singular. Replace 'have submitted' with 'has submitted'."),
  q("A: Neither the manager nor the employees / B: was willing / C: to accept the revised schedule.",errorOpts,1,"With neither...nor, the verb agrees with the nearer subject. 'Employees' is plural, so use 'were willing'."),
  q("A: The quality of these products / B: have improved / C: significantly this quarter.",errorOpts,1,"The subject is the singular noun 'quality,' not 'products.' Replace 'have improved' with 'has improved'."),
  q("A: She is one of the engineers / B: who has completed / C: the certification early.",errorOpts,1,"The relative pronoun 'who' refers to plural 'engineers.' Use 'who have completed'."),
  q("A: Hardly had the meeting begun / B: when the fire alarm / C: started ringing.",errorOpts,3,"The standard construction is 'hardly...when.' The inversion and tense are also correct, so the sentence has no error."),
  q("A: The committee discussed / B: about the proposal / C: before taking a decision.",errorOpts,1,"'Discuss' is transitive and does not take 'about.' Write 'discussed the proposal'."),
  q("A: He has been working / B: in this organisation / C: since five years.",errorOpts,2,"Use 'for' with a duration and 'since' with a starting point. Replace 'since five years' with 'for five years'."),
  q("A: No sooner did she reach / B: the station when / C: the train departed.",errorOpts,1,"The correct correlative pair is 'no sooner...than.' Replace 'when' with 'than'."),
  q("A: The data collected from the survey / B: indicate that / C: customer satisfaction has risen.",errorOpts,3,"In formal usage, 'data' may take a plural verb, and 'indicate' agrees with it. The remaining clause is also correct."),
  q("A: Despite of working late, / B: the team could not / C: complete the migration.",errorOpts,0,"'Despite' is not followed by 'of.' Use either 'Despite working late' or 'In spite of working late'."),
  q("A: If I would have known / B: about the deadline, / C: I would have applied earlier.",errorOpts,0,"A third conditional uses 'if + past perfect.' Replace 'If I would have known' with 'If I had known'."),
  q("A: The number of applicants / B: are increasing / C: every year.",errorOpts,1,"'The number of' takes a singular verb. Replace 'are increasing' with 'is increasing'."),
  q("A: She prefers working remotely / B: than travelling / C: to the office every day.",errorOpts,1,"The verb 'prefer' takes 'to,' not 'than,' when comparing gerunds. Use 'prefers working remotely to travelling'."),
  q("A: Having completed the assignment, / B: the laptop was switched off / C: by Rohan.",errorOpts,1,"The opening participial phrase must logically modify the subject. Rohan completed the assignment, not the laptop. Write 'Rohan switched off the laptop'."),
  q("A: Not only did the new policy reduce costs, / B: but it also improved / C: employee satisfaction.",errorOpts,3,"The 'not only...but also' construction is parallel, the inversion after 'not only' is correct, and both verb phrases agree. There is no error."),
];

export const pilotSections=[
  {id:"numerical",title:"Numerical Ability",topic:"Percentages",color:"#2563eb",questions:percentage},
  {id:"logical",title:"Logical Reasoning",topic:"Syllogisms",color:"#7c3aed",questions:syllogism},
  {id:"verbal",title:"Verbal Ability",topic:"Error Detection",color:"#059669",questions:verbal},
];

export function auditPilotBanks(){
  return pilotSections.map(section=>{
    const unique=new Set(section.questions.map(item=>item.text));
    const invalid=section.questions.filter(item=>item.opts.length!==4||new Set(item.opts).size!==4||item.ans<0||item.ans>3||!item.explanation||item.explanation.length<60);
    if(section.questions.length!==15||unique.size!==15||invalid.length) throw new Error(`${section.id} pilot audit failed`);
    return {section:section.id,questions:15,unique:unique.size,verified:15};
  });
}
