import {
  countBy,
  flatten,
  flow,
  forEach,
  fromPairs,
  keys,
  map,
  memoize,
  pickBy,
  size,
  zip
} from "lodash";
import slugify from "slugify";
import Link from "next/link";
import { inflect } from "db/inflections";

function shortenName(name: string) {
  const inflectedName = inflect(name);
  if (inflectedName.inflected) return inflectedName.name;

  return name
    .split(" ")
    .slice(1)
    .join(" ");
}

const shortenNames = memoize(function(match) {
  return flow(
    flatten,
    names => map(names, (appearance: Appearance) => appearance.name),
    names => fromPairs(zip(names, map(names, shortenName))),
    deduplicateNames
  )(match.lineups);
});

function deduplicateNames(indexedNames: Record<string, string>) {
  const indexedNamesUniq = indexedNames;

  let duplicateNames;
  let i = 0;

  do {
    i += 1;

    duplicateNames = keys(
      pickBy(countBy(indexedNamesUniq), count => count > 1)
    );

    forEach(duplicateNames, name => {
      const duplicateIndexes = keys(
        pickBy(indexedNamesUniq, (value: string) => value === name)
      );

      forEach(duplicateIndexes, (fullName: string) => {
        const firstNameLength = fullName.indexOf(" ");
        if (firstNameLength < i) return;

        const shortenedFirstName = fullName.slice(0, i);
        const lastName = shortenName(fullName);

        indexedNamesUniq[fullName] = `${shortenedFirstName}. ${lastName}`;
      });
    });
  } while (size(duplicateNames) > 0 && i < 8);

  return indexedNamesUniq;
}

function PlayerName({
  name,
  match,
  id = null
}: {
  name: string;
  match: Match;
  id?: string | null;
}) {
  const shortNames = shortenNames(match);
  // @ts-ignore
  const shortName = shortNames[name] || id || "unknown";

  if (id) {
    const slug = slugify(name, { lower: true });
    return (
      <Link href="/players/[slug]/[id]" as={`/players/${slug}/${id}`}>
        <a className="text-blue-600 hover:text-blue-400" title={name}>
          {shortName}
        </a>
      </Link>
    );
  }

  return <span title={name}>{shortName}</span>;
}

export default PlayerName;