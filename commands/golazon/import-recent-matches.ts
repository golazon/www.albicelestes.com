import * as R from "remeda";
import got from "got";
import { fetchMatches } from "db";
import { spinner } from "utility/command";
import util from "util";
import { Match, Result } from "types";
import { matchSlug, matchYear } from 'helpers';
// import jsonStringify from "utility/jsonStringify";

const TEAM_URL = "https://golazon.com/api/teams/03l";
const MATCH_URL = "https://golazon.com/api/matches/ID";

namespace Golazon {
  type Person = { person_id: string; name: string };
  export type Player = Person & { in?: string; out?: string };
  export type Goal = Person & { code: "G" | "PG" | "OG"; score: [number, number]; min: string };
  export type Card = Person & { code: "YC" | "RC" | "Y2C"; min: string };
  type Score = [number, number];

  export type Match = {
  match_id: string;
  date: string;
  time: string;
  home_id: string;
  home_name: string;
  away_id: string;
  away_name: string;
  ended?: boolean;
  suspended?: boolean;
  ft: Score;
  ht: Score;
  ps?: Score;
  goals: Goal[];
  cards: Card[];
  home_players: Player[];
  home_coach: Person;
  away_players: Player[];
  away_coach: Person;
  competition_id: string;
  competition_name: string;
  area_name: string;
  round_name: string;
  teamtype: string | null;
  venue: { name: string; city: string };
  penalty_shootout: (Person & { code: 'G' | 'M', score: Score })[];
};

export type Team = { recentFixtures: { match_id: string; date: string }[] };
}

namespace Conversion {
  const toSlug = (match: Golazon.Match, dbMatches: Match[]) => {
    const slug = matchSlug({ teams: [ { name: match.home_name }, { name: match.away_name }]});
    const year = matchYear({ date: match.date });

    const similarSlugsCount = R.filter(dbMatches, dbMatch => matchYear(dbMatch) === year && matchSlug(dbMatch).indexOf(slug) !== -1)?.length || 0;
    if (similarSlugsCount > 0) {
      return `${slug}-${similarSlugsCount + 1}`;
    }

    return false;
  }

  const toResult = (match: Golazon.Match) => {
    if (match.suspended) return Result.Suspended;

    const { ft, home_name: homeName } = match;
    const argFirst = homeName == 'Argentina';

    if (ft[0] > ft[1]) return argFirst ? Result.Win : Result.Loss;
    if (ft[0] < ft[1]) return argFirst ? Result.Loss : Result.Win;
    return Result.Draw;
  }

  const toLineup = (players: Golazon.Player[]) => {
    return R.map(players, (player) => ({
    name: player.name,
    ...(player.in && { in: player.in }),
    ...(player.out && { out: player.out }),
  }))};

  const findTeamIndex = (match: Golazon.Match, playerable: { person_id: string }) => {
    const isHome = R.find(match['home_players'], (player) => player['person_id'] === playerable['person_id']);
    if (isHome) return 0;
    const isAway = R.find(match['away_players'], (player) => player['person_id'] === playerable['person_id']);
    if (isAway) return 1;
    return false;
  }

  const toGoals = (match: Golazon.Match) => {
    const toGoalType = (code: Golazon.Goal["code"]): 'G' | 'P' | 'OG' => {
      if (code == 'PG') return 'P';
      return code;
    }

    return R.reduce(match.goals, (acc, goal) => {
      const convertedGoal = { name: goal.name, min: goal.min, type: toGoalType(goal.code) };
      const index = findTeamIndex(match, goal);
      if (index) {
        acc[goal.code === 'OG' ? Math.abs(index - 1) : index].push(convertedGoal);
      }
      return acc;
    }, [[], []] as Match["goals"])
  }

  const toCards = (match: Golazon.Match) => {
    const toCardType = (code: Golazon.Card["code"]): 'Y' | 'R' => {
      if (code == 'YC') return 'Y';
      if (code == 'RC') return 'R';
      return 'Y';
    }

    return R.reduce(match.cards, (acc, card) => {
      const convertedCard = { name: card.name, min: card.min, type: toCardType(card.code) };
      const index = findTeamIndex(match, card);
      if (index) {
        acc[index].push(convertedCard);
        if (card.code === 'Y2C') { // separate Y & R events for 2nd Y
          acc[index].push({ name: card.name, min: card.min, type: 'R' });
        }
      }
      return acc;
    }, [[], []] as Match["cards"]);
  }

  export const toMatch = (match: Golazon.Match, dbMatches: Match[]) => {
    const slug = toSlug(match, dbMatches);

    /* eslint-disable @typescript-eslint/camelcase */
    const dbMatch: Match = {
      ...(slug && { slug }),
      date: match.date,
      competition: match["competition_name"],
      round: match["round_name"], // TODO: add to albicelestes types
      venue: { name: match.venue.name, city: match.venue.city },
      teams: [{ name: match["home_name"] }, { name: match["away_name"] }],
      score: match.ft,
      ...(match.ps && { pen: match.ps }),
      result: toResult(match),
      goals: toGoals(match),
      cards: toCards(match),
      coaches: [
        { name: match["home_coach"].name },
        { name: match["away_coach"].name },
      ],
      lineups: [toLineup(match["home_players"]), toLineup(match["away_players"])],
      ...(match["penalty_shootout"] && { penaltyShootout: R.map(match["penalty_shootout"], shot => ({
        name: shot.name,
        score: shot.code === 'M' ? 'x' : shot.score
      })) }),
      sources: ["Golazon"],
    };
    /* eslint-enable @typescript-eslint/camelcase */
    return dbMatch;
  }
}

export default async () => {
  spinner.next("Fetch recent matches from Golazon API");
  const response = await got(TEAM_URL);

  spinner.next("Parse fetched matches");
  const { recentFixtures } = JSON.parse(response.body) as Golazon.Team;

  spinner.next("Fetch matches and last match from DB");
  const dbMatches = fetchMatches();
  const dbLastMatch = R.last(dbMatches);
  if (!dbLastMatch) {
    throw new Error("Db last match not found");
  }

  const matchIds = R.pipe(
    recentFixtures,
    R.filter((fixture) => fixture["date"] > dbLastMatch["date"]),
    R.map(R.prop("match_id"))
  );

  const apiResponses = await Promise.all(
    R.map(matchIds, (matchId) => got(MATCH_URL.replace("ID", matchId)))
  );

  apiResponses.forEach((response) => {
    const match = JSON.parse(response.body) as Golazon.Match;
    const dbMatch = Conversion.toMatch(match, dbMatches);

    console.log(util.inspect(dbMatch, { depth: 4 }));

    // TODO: match popular names (if no other similar)
    // TODO: (?) have index of names by person_id
    // TODO: use inquirer
    // dbMatches = dbMatches.concat(newMatch);
    // TODO: save to db
    // dbMatches
    // jsonStringify();
  });

  spinner.done();
};
