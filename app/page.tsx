import type { Metadata } from "next";
import { ChampionsApp } from "../components/ChampionsApp";

export const metadata: Metadata = {
  title: "Champions Lab — Pokémon Champions Team Builder",
  description: "Explore the current Pokémon Champions Regulation, inspect move priority and type matchups, and build a legal six-Pokémon team.",
};

export default function Home() {
  return <ChampionsApp />;
}
