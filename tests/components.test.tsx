import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChampionsApp } from "../components/ChampionsApp";
import { MoveDatabaseV2, PokemonTableV2, ResourceDatabaseV2, SpeedCompareV2 } from "../components/DatabaseViews";
import { useTeamStore } from "../lib/team-store";

beforeEach(() => useTeamStore.setState({ members: [], hydrated: true }));
afterEach(() => vi.unstubAllGlobals());

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
  it("paginates all legal Pokémon forms instead of hiding rows after 100", async () => {
    const user = userEvent.setup();
    const { container } = render(<PokemonTableV2 locale="en" format="doubles" onSelect={() => undefined} />);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(100);
    expect(screen.getByText("Page", { exact: false })).toHaveTextContent("1 / 4");
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(container.querySelectorAll("tbody tr")).toHaveLength(58);
    expect(screen.getByText("Page", { exact: false })).toHaveTextContent("4 / 4");
  });

  it("opens complete Pokémon details and switches current battle formats", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ data: {
      scope: "species",
      singles: { pokemon: "Absol", format: "Singles", season: "Current", date: null, source: "Pokémon Champions Battle Data", rows: [{ category: "move", rank: 1, name: "Sucker Punch", percentage: "70.0%", percentageValue: 70, statUp: "", statDown: "", ap: null }] },
      doubles: { pokemon: "Absol", format: "Doubles", season: "Current", date: null, source: "Pokémon Champions Battle Data", rows: [{ category: "held_item", rank: 1, name: "Absolite", percentage: "39.5%", percentageValue: 39.5, statUp: "", statDown: "", ap: null }] },
    } })));
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon or type…"), "Absol");
    await user.click(screen.getByRole("button", { name: "Absol", exact: true }));
    const dialog = screen.getByRole("dialog", { name: "Absol" });
    expect(within(dialog).getByText("Learnable moves")).toBeInTheDocument();
    expect(within(dialog).getByText("Available abilities")).toBeInTheDocument();
    expect(await within(dialog).findByText("Absolite")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Singles" }));
    expect(within(dialog).getAllByText("Sucker Punch").length).toBeGreaterThan(1);
  });

  it("preselects and locks the dedicated stone for a Mega build", async () => {
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon or type…"), "Mega Absol");
    await user.click(screen.getByRole("button", { name: "Configure Mega Absol" }));
    const item = screen.getByRole("combobox", { name: /Held item/ });
    expect(item).toBeDisabled();
    expect(item).toHaveValue("absolite");
    expect(screen.getByText("This Mega form must hold its dedicated Mega Stone.")).toBeInTheDocument();
  });

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
