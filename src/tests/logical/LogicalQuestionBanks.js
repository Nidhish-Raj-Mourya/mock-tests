import { auditLogicalBuilders, LOGICAL_LEVELS } from "./LogicalQuestionFactory.js";
import { syllogismLogicalBank } from "./SyllogismBank.js";
import { statementConclusionLogicalBank } from "./StatementConclusionBank.js";
import { assumptionInferenceLogicalBank } from "./AssumptionInferenceBank.js";
import { dataSufficiencyLogicalBank } from "./DataSufficiencyBank.js";
import { bloodRelationsLogicalBank } from "./BloodRelationsBank.js";
import { directionSenseLogicalBank } from "./DirectionSenseBank.js";
import { rankingOrderingLogicalBank } from "./RankingOrderingBank.js";
import { codingDecodingLogicalBank, numberLetterSeriesLogicalBank } from "./CodingSeriesBanks.js";
import { clocksCalendarsLogicalBank } from "./ClocksCalendarsBank.js";
import { seatingArrangementsLogicalBank, analyticalPuzzlesLogicalBank } from "./ArrangementPuzzleBanks.js";
import { nonVerbalSpatialLogicalBank } from "./NonVerbalSpatialBank.js";

const RAW_LOGICAL_BUILDERS = {
  syllogisms: syllogismLogicalBank,
  codingDecoding: codingDecodingLogicalBank,
  bloodRelations: bloodRelationsLogicalBank,
  directionSense: directionSenseLogicalBank,
  rankingOrdering: rankingOrderingLogicalBank,
  numberLetterSeries: numberLetterSeriesLogicalBank,
  statementConclusion: statementConclusionLogicalBank,
  assumptionInference: assumptionInferenceLogicalBank,
  dataSufficiency: dataSufficiencyLogicalBank,
  seatingArrangements: seatingArrangementsLogicalBank,
  analyticalPuzzles: analyticalPuzzlesLogicalBank,
  clocksCalendars: clocksCalendarsLogicalBank,
  nonVerbalSpatial: nonVerbalSpatialLogicalBank,
};

const logicalDifficultyRank=question=>{
  const text=`${question.q} ${question.subtopic}`.toLowerCase();
  const constraintCount=(text.match(/\b(?:only|exactly|immediately|between|neither|either|unless|not|before|after|opposite|reverse|alternating|conclusion|sufficient|clockwise|anticlockwise)\b/g)||[]).length;
  const relationshipCount=(text.match(/;|, then|\b(?:and|but|while|whereas|therefore)\b/g)||[]).length;
  const wordCount=question.q.trim().split(/\s+/).length;
  const optionComplexity=question.opts.reduce((sum,option)=>sum+option.split(/\s+/).length,0);
  const numberedFamily=question.subtopic.match(/(?:Series rule|Coding rule|Spatial pattern|Clock-calendar pattern) (\d+)/i);
  const familyNumber=numberedFamily?Number(numberedFamily[1])-1:0;
  const family=familyNumber%5,band=Math.floor(familyNumber/5);
  const authoredFamilyRank=/Series rule/i.test(question.subtopic)?[0,1,2,2,3][family]:/Coding rule/i.test(question.subtopic)?[0,1,1,3,2][family]:/Spatial pattern/i.test(question.subtopic)?[2,1,3,1,2][family]:/Clock-calendar pattern/i.test(question.subtopic)?[2,2,0,3,1][family]:0;
  return authoredFamilyRank*140+band*8+constraintCount*100+relationshipCount*20+Math.min(90,wordCount)+optionComplexity/10;
};

const progressiveLogicalBank=build=>()=>build()
 .map((question,sourceIndex)=>({question,sourceIndex,rank:logicalDifficultyRank(question)}))
 .sort((a,b)=>a.rank-b.rank||a.sourceIndex-b.sourceIndex)
 .map(({question},id)=>{
  const level=id<20?LOGICAL_LEVELS[0]:id<75?LOGICAL_LEVELS[1]:id<120?LOGICAL_LEVELS[2]:LOGICAL_LEVELS[3];
  const idealTimeSeconds=level===LOGICAL_LEVELS[0]?30:level===LOGICAL_LEVELS[1]?45:level===LOGICAL_LEVELS[2]?60:85;
  const verification=level===LOGICAL_LEVELS[0]
   ? "Foundation check: translate each stated relation once and avoid adding an unstated converse."
   : level===LOGICAL_LEVELS[1]
    ? "Core check: combine the constraints in order and reject any option contradicted by one mandatory relation."
    : level===LOGICAL_LEVELS[2]
     ? "Advanced check: test the conclusion against all viable arrangements, not merely the first arrangement that fits."
     : "Challenge check: preserve orientation and conditional direction, exhaust competing arrangements, and accept only the option forced in every valid case.";
  return{...question,id,level,idealTimeSeconds,solution:`${question.solution} ${verification}`};
 });

export const LOGICAL_BUILDERS=Object.fromEntries(
 Object.entries(RAW_LOGICAL_BUILDERS).map(([topic,build])=>[topic,progressiveLogicalBank(build)])
);

export const auditLogicalBanks = () => auditLogicalBuilders(LOGICAL_BUILDERS);
