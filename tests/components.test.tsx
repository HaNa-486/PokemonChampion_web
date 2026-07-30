import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ChampionsApp, MoveDatabase } from "../components/ChampionsApp";
import { useTeamStore } from "../lib/team-store";

beforeEach(() => useTeamStore.setState({ members: [], hydrated: true }));

describe("Move Database", () => {
  it("filters positive and negative priority independently", async () => {
    const user = userEvent.setup();
    render(<MoveDatabase locale="en" />);
    await user.click(screen.getByRole("button", { name: "+ Positive" }));
    expect(screen.getByRole("button", { name: "Quick Attack" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Trick Room" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "+ Positive" }));
    await user.click(screen.getByRole("button", { name: "− Negative" }));
    expect(screen.getByRole("button", { name: "Trick Room" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Quick Attack" })).not.toBeInTheDocument();
  });

  it("opens a move explanation from keyboard focus", async () => {
    const user = userEvent.setup();
    render(<MoveDatabase locale="en" />);
    await user.type(screen.getByPlaceholderText("Search moves…"), "Extreme Speed");
    const trigger = screen.getByRole("button", { name: "Extreme Speed" });
    fireEvent.focus(trigger);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Priority +2");
  });
});

describe("ChampionsApp", () => {
  it("switches language without losing navigation", async () => {
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.click(screen.getByRole("button", { name: "繁中" }));
    expect(screen.getByRole("button", { name: "招式資料庫" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "寶可夢資料庫" })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("搜尋寶可夢或屬性…"), "Garchomp");
    expect(screen.getByText("烈咬陸鯊")).toBeInTheDocument();
  });

  it("opens searchable ability and item reference views", async () => {
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.click(screen.getByRole("button", { name: "Ability DB" }));
    expect(screen.getByRole("heading", { name: "Ability DB" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rough Skin" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Held Item DB" }));
    expect(screen.getByRole("button", { name: "Choice Scarf" })).toBeInTheDocument();
  });
});
