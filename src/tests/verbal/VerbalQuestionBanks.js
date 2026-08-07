import { auditVerbalBuilders } from "./VerbalQuestionFactory.js";
import { errorDetectionVerbalBank, sentenceCorrectionVerbalBank, grammarFundamentalsVerbalBank, sentenceCompletionVerbalBank } from "./GrammarBanks.js";
import { vocabularyVerbalBank, synonymsAntonymsVerbalBank, idiomsPhrasesVerbalBank, oneWordSubstitutionVerbalBank } from "./LexicalBanks.js";
import { clozeTestsVerbalBank, paraJumblesVerbalBank, readingComprehensionVerbalBank, criticalReasoningVerbalBank } from "./ComprehensionBanks.js";

export const VERBAL_BUILDERS={
  errorDetection:errorDetectionVerbalBank,
  sentenceCorrection:sentenceCorrectionVerbalBank,
  grammarFundamentals:grammarFundamentalsVerbalBank,
  sentenceCompletion:sentenceCompletionVerbalBank,
  vocabulary:vocabularyVerbalBank,
  synonymsAntonyms:synonymsAntonymsVerbalBank,
  idiomsPhrases:idiomsPhrasesVerbalBank,
  clozeTests:clozeTestsVerbalBank,
  paraJumbles:paraJumblesVerbalBank,
  readingComprehension:readingComprehensionVerbalBank,
  criticalReasoning:criticalReasoningVerbalBank,
  oneWordSubstitution:oneWordSubstitutionVerbalBank,
};

export const auditVerbalBanks=()=>auditVerbalBuilders(VERBAL_BUILDERS);
