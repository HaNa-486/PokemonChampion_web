import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { ChampionsApp } from "../components/ChampionsApp";
import { MoveDatabaseV2, ResourceDatabaseV2, SpeedCompareV2 } from "../components/DatabaseViews";
import { useTeamStore } from "../lib/team-store";

beforeEach(() => useTeamStore.setState({ members: [], hydrated: true }));

describe("Move Database", () => {
  it("filters positive and negative priority independently", async () => {
    const user = userEvent.setup();
    render(<MoveDatabaseV2 locale="en" />);
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
    render(<MoveDatabaseV2 locale="en" />);
    await user.type(screen.getByPlaceholderText("Search moves…"), "Extreme Speed");
    const trigger = screen.getByRole("button", { name: "Extreme Speed" });
    fireEvent.focus(trigger);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Priority +2");
  });

  it("combines category and property filters using upstream move flags", async () => {
    const user = userEvent.setup();
    render(<MoveDatabaseV2 locale="en" />);
    await user.click(screen.getByRole("button", { name: "Status" }));
    await user.click(screen.getByRole("button", { name: "Sound" }));
    expect(screen.getByRole("button", { name: "Parting Shot" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fire Punch" })).not.toBeInTheDocument();
  });

  it("sorts move columns in both directions", async () => {
    const user = userEvent.setup();
    render(<MoveDatabaseV2 locale="en" />);
    const priority = screen.getByRole("button", { name: /Priority/ });
    await user.click(priority);
    expect(priority.closest("th")).toHaveAttribute("aria-sort", "ascending");
    await user.click(priority);
    expect(priority.closest("th")).toHaveAttribute("aria-sort", "descending");
  });

  it("sorts by usable Pokémon count and opens the reverse lookup", async () => {
    const user = userEvent.setup();
    render(<MoveDatabaseV2 locale="en" />);
    const users = screen.getByRole("button", { name: "Usable Pokémon" });
    await user.click(users);
    expect(users.closest("th")).toHaveAttribute("aria-sort", "ascending");
    await user.type(screen.getByRole("textbox", { name: "Search moves" }), "Dragon Claw");
    await user.click(screen.getByRole("button", { name: "Dragon Claw" }));
    const dialog = screen.getByRole("dialog", { name: "Dragon Claw" });
    expect(within(dialog).getByText("Garchomp")).toBeInTheDocument();
    expect(within(dialog).getByText("Mega Charizard X")).toBeInTheDocument();
  });
});

describe("reference filters", () => {
  it("filters abilities by derived battle category", async () => {
    const user = userEvent.setup();
    render(<ResourceDatabaseV2 kind="abilities" locale="en" />);
    await user.click(screen.getByRole("button", { name: "Weather" }));
    expect(screen.getByRole("button", { name: "Drought" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rough Skin" })).not.toBeInTheDocument();
  });

  it("filters held items by real category", async () => {
    const user = userEvent.setup();
    render(<ResourceDatabaseV2 kind="items" locale="en" />);
    await user.click(screen.getByRole("button", { name: "Mega Stone" }));
    expect(screen.getByRole("button", { name: "Charizardite X" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Choice Scarf" })).not.toBeInTheDocument();
  });

  it("sorts abilities by user count and opens all eligible Pokémon", async () => {
    const user = userEvent.setup();
    render(<ResourceDatabaseV2 kind="abilities" locale="en" />);
    const users = screen.getByRole("button", { name: "Usable Pokémon" });
    await user.click(users);
    expect(users.closest("th")).toHaveAttribute("aria-sort", "ascending");
    await user.type(screen.getByRole("textbox", { name: "Search abilities" }), "Rough Skin");
    await user.click(screen.getByRole("button", { name: "Rough Skin" }));
    const dialog = screen.getByRole("dialog", { name: "Rough Skin" });
    expect(within(dialog).getByText("Garchomp")).toBeInTheDocument();
  });
});

describe("Speed Compare", () => {
  it("adds independent comparison rows and exposes per-row scenarios", async () => {
    const user = userEvent.setup();
    render(<SpeedCompareV2 locale="en" />);
    expect(screen.getByText("No comparison rows yet")).toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "Pokemon to compare" }), "alakazam");
    await user.click(screen.getByRole("button", { name: "Add comparison" }));
    const row = screen.getByRole("spinbutton", { name: "Speed AP for Alakazam" }).closest("article")!;
    expect(within(row).getByRole("spinbutton", { name: "Speed AP for Alakazam" })).toHaveValue(0);
    expect(within(row).getByText("140")).toBeInTheDocument();
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
