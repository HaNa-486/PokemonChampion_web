import type { Metadata } from "next";
import { TypeChartPageShell } from "../../components/TypeChartView";

export const metadata: Metadata = {
  title: "Type Matchup Chart | Champions Lab",
  description: "A complete Pokémon Champions attacking and defending type effectiveness chart.",
};

export default function TypeChartPage() {
  return <TypeChartPageShell />;
}
