import * as R from "remeda";
import { Match } from "types";
import { matchTeamIndex, playerSlug } from "helpers";
import { Appearance } from "types/index";

export default function findNearestPlayerSlug(
  matches: Pick<Match, "teams" | "lineups">[],
  slug: string
): string | null {
  const players = R.pipe(
    matches,
    R.map((match) => match.lineups[matchTeamIndex(match)]),
    R.flatten()
  );

  const searchStrategies = [
    (player: Appearance) => playerSlug(player.name) === slug,
    (player: Appearance) => {
      const slugParts = slug.split("-");
      return (
        playerSlug(player.name) ===
        R.compact([slugParts.shift(), slugParts.pop()]).join("-")
      );
    },
    (player: Appearance) =>
      playerSlug(player.name, { firstInitialOnly: true }) === slug,
  ];

  // it leverages remeda lazy evaluation
  const player = R.pipe(
    searchStrategies,
    R.map((fn) => R.find(players, fn)),
    R.find((player) => !!player)
  );

  if (!player) {
    return null;
  }

  return playerSlug(player.name);
}