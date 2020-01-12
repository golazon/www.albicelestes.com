import Link from "next/link";
import internalAPI from "lib/api/internal";
import { playerName, playerCatalog, playerSlug } from "lib/name";
import Layout from "components/Layout";
import Nav from "components/players/Nav";

type Props = { catalog: string; players: any[] };

const PlayersPage = ({ catalog, players }: Props) => {
  return (
    <Layout title={`${catalog.toUpperCase()} | Argentina Players`}>
      <Nav catalog={catalog} />

      {players.length > 0 && (
        <>
          <h2 className="mb-4 font-semibold uppercase">Players</h2>
          {players.map(({ id, name, mp }) => {
            const _playerName = playerName(name);
            const slug = playerSlug(name);
            const catalog = playerCatalog(name);

            const boldStyle = mp > 20 ? "font-bold" : "";

            return (
              <p key={id}>
                <Link
                  href="/players/[slug]/[catalog]/[id]"
                  as={`/players/${catalog}/${slug}/${id}`}
                >
                  <a
                    className={`text-blue-600 hover:text-blue-400 ${boldStyle}`}
                    title={name}
                  >
                    {_playerName.lastName},{" "}
                    {[_playerName.firstName, _playerName.middleName]
                      .join(" ")
                      .trim()}
                  </a>
                </Link>{" "}
                ({mp})
              </p>
            );
          })}
        </>
      )}
    </Layout>
  );
};

PlayersPage.getInitialProps = async ({ query, res }: any) => {
  const { catalog } = query;
  const result = await internalAPI(`players?catalog=${catalog}`);

  if (res) {
    res.setHeader(
      "Cache-Control",
      "s-maxage=3600, max-age=60, stale-while-revalidate"
    );
  }

  return { catalog, ...result };
};

export default PlayersPage;
