import React from "react";
import { useMediaQuery } from "react-responsive";
import {
  getMatchDate,
  getMatchYear,
  getMatchScore,
  getMatchSlug,
} from "helpers";
import { MatchItem } from "types";
import { fetchTeamInflections, fetchCompetitionInflections } from "data";
import { Block, LinkAnchor } from "./layout";
import getMatchTeamIndex from "helpers/getMatchTeamIndex";

type Props = {
  matches: MatchItem[];
};

const competitionInflections = fetchCompetitionInflections();
const teamInflections = fetchTeamInflections();

function useCompact(): boolean {
  return useMediaQuery({ query: "(max-device-width: 425px)" });
}

function getResponsiveTeamLabel(match: MatchItem): string {
  const isCompact = useCompact();

  if (isCompact) {
    const myTeamIndex = getMatchTeamIndex(match);
    const otherTeamIndex = 1 - myTeamIndex;
    const venueIndicator = myTeamIndex === 0 ? "(H)" : "(A)";

    return [
      teamInflections[match.teams[otherTeamIndex].name] ??
        match.teams[otherTeamIndex].name,
      venueIndicator,
    ].join(" ");
  }

  return [
    teamInflections[match.teams[0].name] ?? match.teams[0].name,
    teamInflections[match.teams[1].name] ?? match.teams[1].name,
  ].join(" - ");
}

function getResponsiveScore(match: MatchItem): string {
  const isCompact = useCompact();

  if (isCompact) {
    const myTeamIndex = getMatchTeamIndex(match);

    if (myTeamIndex === 1) {
      // TODO: extract to sub-helpers handling home/away etc helper: isAwayTeam or isMyTeamAway as myTeamIndex === 1 is enigmatic

      return getMatchScore(
        {
          teams: [match.teams[1], match.teams[0]],
          score: [match.score[1], match.score[0]],
          pen: match.pen && [match.pen[1], match.pen[0]],
          result: match.result,
        },
        { short: true }
      );
    }

    return getMatchScore(match, { short: true });
  }

  return getMatchScore(match, { short: false });
}

function getResponsiveCompetitionName(match: MatchItem): string {
  return competitionInflections[match.competition] ?? match.competition;
}

export default function MatchList({ matches }: Props) {
  if (matches.length === 0) return null;

  return (
    <Block>
      <div className="max-w-full overflow-hidden">
        <table>
          <tbody>
            {matches.map((match) => (
              <tr key={`${getMatchYear(match)}-${getMatchSlug(match)}`}>
                <td>{getMatchDate(match, { withYear: true })}</td>
                <td>
                  <LinkAnchor
                    href={`/${getMatchYear(match)}/${getMatchSlug(match)}`}
                  >
                    {getResponsiveTeamLabel(match)}
                  </LinkAnchor>
                </td>
                <td>{getResponsiveScore(match)}</td>
                <td>
                  <em>{getResponsiveCompetitionName(match)}</em>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Block>
  );
}