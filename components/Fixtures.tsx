import slugify from "slugify";
import Link from "next/link";
import { formatDate } from "../lib/date";
import Section from "./layout/Section";

interface Props {
  title?: string;
  matches: any[];
}

const Fixtures = ({ title, matches }: Props) => {
  if (matches.length === 0) {
    return null;
  }

  return (
    <Section title={title}>
      {matches.map(match => {
        const [homeTeam, awayTeam] = match.teams;
        const homeSlug =
          homeTeam.slug || slugify(homeTeam.name, { lower: true });
        const awaySlug =
          awayTeam.slug || slugify(awayTeam.name, { lower: true });
        const matchYear = match.date.substring(0, 4);

        return (
          <div key={match.id} className="mb-2">
            <p>
              {formatDate(match.date, true)}, {match.competition}
            </p>
            <p>
              <Link
                href="/archive/[year]/[slug]/[id]"
                as={`/archive/${matchYear}/${homeSlug}-${awaySlug}/${match.id}`}
              >
                <a className="block text-blue-600 hover:text-blue-400">
                  {homeTeam.name} - {awayTeam.name} {match.score.join(":")}
                </a>
              </Link>
            </p>
          </div>
        );
      })}
    </Section>
  );
};

Fixtures.defaultProps = {
  matches: []
};

export default Fixtures;
