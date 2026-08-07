export const VISUAL_KINDS = new Set([
  "mensuration", "dataInterpretation", "probability", "distance", "trainsBoats", "mixture",
  "syllogisms", "bloodRelations", "directionSense", "seatingArrangements", "analyticalPuzzles",
  "clocksCalendars", "nonVerbalSpatial",
]);

export const supportsQuestionVisual = kind => VISUAL_KINDS.has(kind);
