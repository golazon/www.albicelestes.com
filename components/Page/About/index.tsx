import React from "react";
import { Bibliography } from "types";
import Layout from "components/Layout";
import Section from "components/Layout/Section";
import ExternalLink from "components/Layout/ExternalLink";

export type Props = {
  bibliography: Bibliography;
  stat: {
    matchesTotal: number;
    matchesVerified: number;
  };
};

export default function AboutPage(props: Props) {
  const { stat, bibliography } = props;
  return (
    <Layout title={["About"]}>
      <Section title="About">
        <p>Argentina football national team archive</p>
      </Section>

      <Section title="Status">
        <p>
          Verified matches:{" "}
          <span className="font-semibold">{stat.matchesVerified}</span>/
          {stat.matchesTotal} (
          {((stat.matchesVerified / stat.matchesTotal) * 100).toFixed(2)}%)
        </p>
      </Section>

      <Section title="See also">
        <p>
          <ExternalLink href="https://github.com/sobstel/albicelestes">
            github
          </ExternalLink>
        </p>
        <p>
          <ExternalLink href="https://twitter.com/albicelestescom">
            twitter
          </ExternalLink>
        </p>
      </Section>

      <Section title="Sources">
        {Object.keys(bibliography).map((key) => {
          const item = bibliography[key];
          return (
            <p key={key}>
              <ExternalLink href={item.url}>{item.name}</ExternalLink>
            </p>
          );
        })}
      </Section>
    </Layout>
  );
}
