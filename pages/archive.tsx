import db from "../lib/api/db";
import Layout from "../components/Layout";
import Fixtures from "../components/Fixtures";

interface Props {
  archive: [];
}

const ArchivePage = ({ archive }: Props) => {
  return (
    <Layout title="Archive">
      {archive.map(({ year, matches }: { year: number; matches: any[] }) => (
        <Fixtures title={year.toString()} matches={matches} isArchive />
      ))}
    </Layout>
  );
};

ArchivePage.getInitialProps = async () => {
  const { archive } = await db("archive");
  return { archive };
};

export default ArchivePage;
