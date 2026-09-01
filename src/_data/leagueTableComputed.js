const rawTable = require("./league_table.json");
const { extractObjectPayload } = require("./adminPayload.js");

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
}

/**
 * Prepares standings for display. The CMS stores only match outcomes and
 * goals; matches played, points, and the position are always derived here.
 */
module.exports = function () {
  const table = extractObjectPayload(rawTable, ["season", "competition", "teams"]);
  const sourceTeams = Array.isArray(table.teams) ? table.teams : [];

  const teams = sourceTeams
    .filter((team) => team && String(team.name || "").trim())
    .map((team, sourceIndex) => {
      const wins = nonNegativeInteger(team.wins);
      const draws = nonNegativeInteger(team.draws);
      const losses = nonNegativeInteger(team.losses);
      const goalsFor = nonNegativeInteger(team.goalsFor);
      const goalsAgainst = nonNegativeInteger(team.goalsAgainst);

      return {
        name: String(team.name).trim(),
        wins,
        draws,
        losses,
        goalsFor,
        goalsAgainst,
        played: wins + draws + losses,
        points: wins * 3 + draws,
        sourceIndex
      };
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;

      const goalDifferenceA = a.goalsFor - a.goalsAgainst;
      const goalDifferenceB = b.goalsFor - b.goalsAgainst;
      if (goalDifferenceB !== goalDifferenceA) return goalDifferenceB - goalDifferenceA;

      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;

      // Teams still tied after the displayed criteria retain their CMS order.
      return a.sourceIndex - b.sourceIndex;
    })
    .map(({ sourceIndex, ...team }, index) => ({
      ...team,
      pos: index + 1
    }));

  return {
    season: String(table.season || ""),
    competition: String(table.competition || ""),
    teams
  };
};