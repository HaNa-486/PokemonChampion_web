import type { Metadata } from "next";
import { ChampionsApp } from "../components/ChampionsApp";
import { TypeChartFloating } from "../components/TypeChartView";

export const metadata: Metadata = {
  title: "Champions Lab — Pokémon Champions Team Builder",
  description: "Explore the current Pokémon Champions Regulation, inspect move priority, build a legal six-Pokémon team, and compare Speed.",
};

export default function Home() {
  return <><ChampionsApp /><TypeChartFloating /></>;
}
