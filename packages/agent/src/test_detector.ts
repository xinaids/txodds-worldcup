import { detectShift } from "./detector";

const prev = {
  messageId: "a", fixtureId: 1, timestamp: "2026-06-24T18:00:00Z",
  market: "1X2", marketLine: "FT", participant1Odds: 2.10,
  participant2Odds: 3.50, drawOdds: 3.20
};
const curr = {
  messageId: "b", fixtureId: 1, timestamp: "2026-06-24T18:05:00Z",
  market: "1X2", marketLine: "FT", participant1Odds: 1.75,
  participant2Odds: 4.20, drawOdds: 3.40
};

const shift = detectShift(prev, curr, { home: "Brazil", away: "Argentina" });
console.log("Shift detected:", JSON.stringify(shift, null, 2));
