import { auditLogicalBuilders } from "./LogicalQuestionFactory.js";
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

export const LOGICAL_BUILDERS = {
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

export const auditLogicalBanks = () => auditLogicalBuilders(LOGICAL_BUILDERS);
