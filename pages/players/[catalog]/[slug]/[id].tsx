import internalAPI from "lib/api/internal";
import Layout from "components/Layout";
import Fixtures from "components/Fixtures";
import Competitions from "components/Competitions";

interface Props {
  id: string;
  slug: string;
  name: string;
  stat: any;
  competitions: string[];
  matches: any[];
}

const PlayerStat = ({ stat: { mp, si, so, g, yc, rc } }: any) => {
  return (
    <p className="mb-4">
      {mp} matches ({si} SI, {so} SO), {g} goals, {yc}YC {rc}RC
    </p>
  );
};

const PlayerPage = ({ name, stat, competitions, matches }: Props) => {
  return (
    <Layout title={`${name} | Players`}>
      <h2 className="mb-4 font-semibold uppercase">{name}</h2>
      {stat && <PlayerStat stat={stat} />}
      <Competitions names={competitions} />
      <Fixtures title="Matches" matches={matches} />
    </Layout>
  );
};

PlayerPage.getInitialProps = async ({ query, res }: any) => {
  const { id, catalog, slug } = query;
  const result = await internalAPI(`players/${id}`);

  if (res) {
    res.setHeader(
      "Link",
      `<https://albicelestes.com/players/${catalog}/${slug}/${id}>; rel="canonical"`
    );

    res.setHeader(
      "Cache-Control",
      "s-maxage=3600, max-age=60, stale-while-revalidate"
    );
  }

  return { id, slug, ...result };
};

export default PlayerPage;
