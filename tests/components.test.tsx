import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChampionsApp } from "../components/ChampionsApp";
import { TypeChart, TypeChartFloating } from "../components/TypeChartView";
import { MoveDatabaseV2, PokemonTableV2, ResourceDatabaseV2, SpeedCompareV2 } from "../components/DatabaseViews";
import { compareLearnableMoves } from "../components/PokemonDetailDialog";
import { ZERO_STATS } from "../lib/domain";
import { moves } from "../lib/catalog";
import { useTeamStore } from "../lib/team-store";
import type { TeamMember } from "../lib/types";

beforeEach(() => useTeamStore.setState({ teams: { singles: [], doubles: [] }, hydrated: true }));
afterEach(() => vi.unstubAllGlobals());

describe("Move Database", () => {
  it("localizes move properties in Traditional Chinese mode", async () => {
    const user = userEvent.setup();
    render(<MoveDatabaseV2 locale="zh-Hant" />);
    await user.type(screen.getByPlaceholderText("搜尋招式…"), "Accelerock");
    const row = screen.getByRole("button", { name: "衝岩" }).closest("tr");
    expect(row).toHaveTextContent("接觸");
    expect(row).toHaveTextContent("可被守住");
    expect(row).not.toHaveTextContent("Contact");
  });

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
    const defaultRows = Array.from(dialog.querySelectorAll(".reverse-results-table tbody tr"));
    const preferredFlags = defaultRows.map((row) => row.classList.contains("preferred-type"));
    const firstNonPreferred = preferredFlags.indexOf(false);
    expect(firstNonPreferred === -1 || preferredFlags.slice(firstNonPreferred).every((value) => !value)).toBe(true);
    const sort = within(dialog).getByRole("combobox", { name: "Sort reverse lookup Pokémon" });
    const direction = within(dialog).getByRole("combobox", { name: "Reverse lookup sort direction" });
    expect(sort).toHaveValue("relevance");
    expect(direction).toBeDisabled();
    await user.selectOptions(sort, "speed");
    expect(direction).toHaveValue("desc");
    const table = within(dialog).getByRole("table");
    const speedHeader = within(table).getByRole("button", { name: /Spe/ });
    expect(speedHeader.closest("th")).toHaveAttribute("aria-sort", "descending");
    const descendingSpeeds = Array.from(dialog.querySelectorAll(".reverse-results-table td[data-stat='speed']"), (node) => Number(node.textContent));
    expect(descendingSpeeds).toEqual([...descendingSpeeds].sort((a, b) => b - a));
    await user.click(speedHeader);
    expect(direction).toHaveValue("asc");
    expect(speedHeader.closest("th")).toHaveAttribute("aria-sort", "ascending");
    const ascendingSpeeds = Array.from(dialog.querySelectorAll(".reverse-results-table td[data-stat='speed']"), (node) => Number(node.textContent));
    expect(ascendingSpeeds).toEqual([...ascendingSpeeds].sort((a, b) => a - b));
    const filters = dialog.querySelector<HTMLElement>(".reverse-filters")!;
    await user.click(within(filters).getByRole("button", { name: "Dragon" }));
    await user.click(within(filters).getByRole("button", { name: "Fire" }));
    await user.click(within(filters).getByRole("button", { name: "AND" }));
    await user.click(within(filters).getByRole("button", { name: "Mega" }));
    await user.type(within(filters).getByRole("combobox", { name: "Search reverse lookup ability filter" }), "Tough Claws");
    await user.type(within(filters).getByRole("combobox", { name: "Search reverse lookup known move filter" }), "Flare Blitz");
    await user.clear(within(filters).getByRole("spinbutton", { name: "Reverse lookup minimum SpA" }));
    await user.type(within(filters).getByRole("spinbutton", { name: "Reverse lookup minimum SpA" }), "100");
    expect(within(dialog).getByText("Mega Charizard X")).toBeInTheDocument();
    expect(dialog.querySelectorAll(".reverse-results-table tbody tr")).toHaveLength(1);
  });

  it("paginates all moves instead of hiding entries after 100", async () => {
    const user = userEvent.setup();
    const { container } = render(<MoveDatabaseV2 locale="en" />);
    const pages = Math.ceil(moves.length / 100);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(100);
    expect(screen.getByText("Page", { exact: false })).toHaveTextContent(`1 / ${pages}`);
    for (let page = 1; page < pages; page += 1) await user.click(screen.getByRole("button", { name: "Next move page" }));
    expect(container.querySelectorAll("tbody tr")).toHaveLength(moves.length % 100 || 100);
    expect(screen.getByText("Page", { exact: false })).toHaveTextContent(`${pages} / ${pages}`);
  });
});

describe("reference filters", () => {
  it("localizes ability category values in Traditional Chinese mode", async () => {
    const user = userEvent.setup();
    render(<ResourceDatabaseV2 kind="abilities" locale="zh-Hant" />);
    await user.type(screen.getByPlaceholderText("搜尋特性…"), "Blaze");
    const row = screen.getByRole("button", { name: "猛火" }).closest("tr");
    expect(row).toHaveTextContent("攻擊");
    expect(row).not.toHaveTextContent("Offense");
  });

  it("localizes held-item controls, headers, classes, and single-use mechanics", async () => {
    const user = userEvent.setup();
    render(<ResourceDatabaseV2 kind="items" locale="zh-Hant" />);
    expect(screen.getByText("所有項目皆來自目前的 Pokémon Champions 規則資料。")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "名稱" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "效果分類" })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("搜尋持有物…"), "Sitrus Berry");
    const row = screen.getByRole("button", { name: "文柚果" }).closest("tr");
    expect(row).toHaveTextContent("HP 回復");
    expect(row).toHaveTextContent("使用後消失");
  });

  it("filters abilities by derived battle category", async () => {
    const user = userEvent.setup();
    render(<ResourceDatabaseV2 kind="abilities" locale="en" />);
    await user.click(screen.getByRole("button", { name: "Weather" }));
    expect(screen.getByRole("button", { name: "Drought" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rough Skin" })).not.toBeInTheDocument();
  });

  it("filters held items by real category", async () => {
    const user = userEvent.setup();
    const { container } = render(<ResourceDatabaseV2 kind="items" locale="en" />);
    await user.click(screen.getByRole("button", { name: "Mega Stone" }));
    const charizardite = screen.getByRole("button", { name: "Charizardite X" });
    expect(charizardite).toBeInTheDocument();
    expect(charizardite.querySelector("img")).toHaveAttribute("src", "/items/charizardite-x.png");
    expect(screen.queryByRole("button", { name: "Choice Scarf" })).not.toBeInTheDocument();
    expect(container.querySelectorAll("tbody img.item-icon").length).toBeGreaterThan(0);
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
  it("sorts detail learnsets by category, type, descending priority, properties, and target", () => {
    const names = ["Swords Dance", "Air Slash", "Assurance", "Aerial Ace", "Sucker Punch"];
    const fixture = names.map((name) => moves.find((move) => move.name === name)!);
    expect([...fixture].sort(compareLearnableMoves).map((move) => move.name)).toEqual(["Sucker Punch", "Assurance", "Aerial Ace", "Air Slash", "Swords Dance"]);
  });

  it("renders every member in a full six-Pokémon scrollable team list", () => {
    const pokemonIds = ["abomasnow", "aerodactyl", "alakazam", "arbok", "arcanine", "garchomp"];
    const members: TeamMember[] = pokemonIds.map((pokemonId, index) => ({ id: `member-${index}`, pokemonId, abilityId: null, itemId: null, moveIds: [], ap: { ...ZERO_STATS }, nature: { name: "Serious", nameZh: "認真", up: null, down: null } }));
    useTeamStore.setState({ teams: { singles: [], doubles: members }, hydrated: true });
    const { container } = render(<ChampionsApp />);
    const list = container.querySelector<HTMLElement>(".team-list")!;
    expect(list).toBeInTheDocument();
    expect(list.querySelectorAll(":scope > .team-card")).toHaveLength(6);
    expect(within(list).getByText("Garchomp")).toBeInTheDocument();
  });

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

  it("filters Pokémon by type, form, ability, known moves, and minimum stats", async () => {
    const user = userEvent.setup();
    const { container } = render(<PokemonTableV2 locale="en" format="doubles" onSelect={() => undefined} />);
    const filters = container.querySelector<HTMLElement>(".pokemon-advanced-filters")!;
    await user.click(within(filters).getByRole("button", { name: "Water" }));
    await user.click(within(filters).getByRole("button", { name: "Mega" }));
    await user.type(within(filters).getByRole("combobox", { name: "Search ability filter" }), "Mega Launcher");
    await user.type(within(filters).getByRole("combobox", { name: "Search known move filter" }), "Aura Sphere");
    await user.clear(within(filters).getByRole("spinbutton", { name: "Minimum SpA" }));
    await user.type(within(filters).getByRole("spinbutton", { name: "Minimum SpA" }), "130");
    expect(screen.getByRole("button", { name: /^Mega Blastoise/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Blastoise$/ })).not.toBeInTheDocument();
  });

  it("searches names only and keeps type matching in the advanced type filter", async () => {
    const user = userEvent.setup();
    const { container } = render(<PokemonTableV2 locale="en" format="doubles" onSelect={() => undefined} />);
    const filters = container.querySelector<HTMLElement>(".pokemon-advanced-filters")!;
    const nameSearch = within(filters).getByRole("textbox", { name: "Search Pokémon by name" });
    await user.type(nameSearch, "ra");
    expect(screen.queryByRole("button", { name: "Whimsicott" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Mega Meganium/ })).not.toBeInTheDocument();
    await user.clear(nameSearch);
    await user.click(within(filters).getByRole("button", { name: "Grass" }));
    expect(screen.getByRole("button", { name: "Whimsicott" })).toBeInTheDocument();
  });

  it("lets users choose OR or AND behavior for multiple type filters", async () => {
    const user = userEvent.setup();
    const { container } = render(<PokemonTableV2 locale="en" format="doubles" onSelect={() => undefined} />);
    const filters = container.querySelector<HTMLElement>(".pokemon-advanced-filters")!;
    await user.click(within(filters).getByRole("button", { name: "Ground" }));
    await user.click(within(filters).getByRole("button", { name: "Steel" }));
    expect(screen.getByRole("button", { name: "Garchomp" })).toBeInTheDocument();
    const logic = within(filters).getByRole("group", { name: "Type filter logic" });
    await user.click(within(logic).getByRole("button", { name: "AND" }));
    expect(screen.queryByRole("button", { name: "Garchomp" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Excadrill" })).toBeInTheDocument();
  });

  it("opens complete Pokémon details and switches current battle formats", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ data: {
      scope: "species",
      singles: { pokemon: "Absol", format: "Singles", season: "Current", date: null, source: "Pokémon Champions Battle Data", rows: [{ category: "move", rank: 1, name: "Sucker Punch", percentage: "70.0%", percentageValue: 70, statUp: "", statDown: "", ap: null }] },
      doubles: { pokemon: "Absol", format: "Doubles", season: "Current", date: null, source: "Pokémon Champions Battle Data", rows: [
        { category: "held_item", rank: 1, name: "Absolite", percentage: "39.5%", percentageValue: 39.5, statUp: "", statDown: "", ap: null },
        { category: "ability", rank: 1, name: "Pressure", percentage: "60.5%", percentageValue: 60.5, statUp: "", statDown: "", ap: null },
      ] },
    } })));
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), "Absol");
    await user.click(screen.getByRole("button", { name: /^Absol$/ }));
    const dialog = screen.getByRole("dialog", { name: "Absol" });
    expect(within(dialog).getByText("Learnable moves")).toBeInTheDocument();
    expect(within(dialog).getByText("Available abilities")).toBeInTheDocument();
    expect(await within(dialog).findByText("Absolite")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Absolite" }).querySelector("img")).toHaveAttribute("src", "/items/absolite.png");
    const moveFilters = dialog.querySelector<HTMLElement>(".detail-move-filters")!;
    await user.click(within(moveFilters).getByRole("button", { name: "+ Positive" }));
    await user.click(within(moveFilters).getByRole("button", { name: "Dark" }));
    await user.click(within(moveFilters).getByRole("button", { name: "Physical" }));
    await user.click(within(moveFilters).getByRole("button", { name: "1 target" }));
    await user.click(within(moveFilters).getByRole("button", { name: "Contact" }));
    expect(within(dialog).getByRole("button", { name: "Sucker Punch" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Calm Mind" })).not.toBeInTheDocument();
    const mobileFilterToggle = within(dialog).getByRole("button", { name: "Move filters (5)" });
    expect(mobileFilterToggle).toHaveAttribute("aria-expanded", "false");
    await user.click(mobileFilterToggle);
    expect(mobileFilterToggle).toHaveAttribute("aria-expanded", "true");
    const battleUsage = dialog.querySelector<HTMLElement>(".battle-usage")!;
    await user.click(within(battleUsage).getByRole("button", { name: "Absolite" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("allows it to Mega Evolve into Mega Absol");
    await user.click(within(battleUsage).getByRole("button", { name: "Absolite" }));
    fireEvent.focus(within(battleUsage).getByRole("button", { name: "Pressure" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("loses one additional PP");
    const matchups = within(dialog).getByRole("heading", { name: "Defensive type matchups" }).closest("section")!;
    expect(within(matchups).getByText("Weak")).toBeInTheDocument();
    expect(within(matchups).getByText("Psychic")).toBeInTheDocument();
    expect(within(matchups).getByText("0×")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Singles" }));
    const singlesUsage = dialog.querySelector<HTMLElement>(".battle-usage")!;
    const usageMove = within(singlesUsage).getByRole("button", { name: "Sucker Punch" });
    expect(usageMove.closest(".usage-row")).toHaveTextContent("Dark");
    fireEvent.focus(usageMove);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Priority +1");
  });

  it("shows all 21 natures with stat effects and keeps matchups on the team card", async () => {
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), "Absol");
    await user.click(screen.getByRole("button", { name: "Configure Absol" }));
    const nature = screen.getByRole("combobox", { name: "Nature" });
    expect(within(nature).getAllByRole("option")).toHaveLength(21);
    expect(within(nature).getByRole("option", { name: "Adamant (Atk ↑ / SpA ↓)" })).toBeInTheDocument();
    await user.selectOptions(nature, "Adamant");
    await user.click(screen.getByRole("button", { name: "Build & add" }));
    const tray = screen.getByRole("complementary", { name: "Selected team" });
    expect(within(tray).getByText("Weak")).toBeInTheDocument();
    expect(within(tray).getByText("Immune")).toBeInTheDocument();
    expect(within(tray).getByText("Adamant")).toHaveAttribute("title", "Adamant (Atk ↑ / SpA ↓)");
  });

  it("preselects and locks the dedicated stone for a Mega build", async () => {
    const user = userEvent.setup();
    const { container } = render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), "Mega Absol");
    await user.click(screen.getByRole("button", { name: "Configure Mega Absol" }));
    const item = screen.getByRole("combobox", { name: /Held item/ });
    expect(item).toBeDisabled();
    expect(item).toHaveValue("absolite");
    expect(container.querySelector(".selected-item-preview img")).toHaveAttribute("src", "/items/absolite.png");
    expect(screen.getByText("This Mega form must hold its dedicated Mega Stone.")).toBeInTheDocument();
  });

  it("applies current-format usage and transforms a base Pokémon when its Mega Stone is selected", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ data: {
      singles: { pokemon: "Blastoise", format: "Singles", season: "Current", date: null, source: "test", rows: [{ category: "held_item", rank: 1, name: "Leftovers", percentage: "40%", percentageValue: 40, statUp: "", statDown: "", ap: null }] },
      doubles: { pokemon: "Blastoise", format: "Doubles", season: "Current", date: null, source: "test", rows: [
        { category: "held_item", rank: 1, name: "Blastoisinite", percentage: "80%", percentageValue: 80, statUp: "", statDown: "", ap: null },
        { category: "ability", rank: 1, name: "Mega Launcher", percentage: "100%", percentageValue: 100, statUp: "", statDown: "", ap: null },
        { category: "stat_alignment", rank: 1, name: "Modest", percentage: "75%", percentageValue: 75, statUp: "Sp. Atk", statDown: "Attack", ap: null },
        { category: "stat_points", rank: 1, name: "", percentage: "60%", percentageValue: 60, statUp: "", statDown: "", ap: { hp: 2, attack: 0, defense: 0, specialAttack: 32, specialDefense: 0, speed: 32 } },
        ...["Aura Sphere", "Dark Pulse", "Dragon Pulse", "Water Pulse"].map((name, index) => ({ category: "move", rank: index + 1, name, percentage: `${90 - index}%`, percentageValue: 90 - index, statUp: "", statDown: "", ap: null })),
      ] },
    } })));
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), "Blastoise");
    await user.click(screen.getByRole("button", { name: "Configure Blastoise" }));
    expect(await screen.findByRole("heading", { name: "Mega Blastoise" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Held item/ })).toHaveValue("blastoisinite");
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Ability" })).toHaveValue("mega-launcher"));
    expect(screen.getByRole("combobox", { name: "Nature" })).toHaveValue("Modest");
    expect(screen.getByRole("slider", { name: /SpA/ })).toHaveValue("32");
    expect(screen.getByRole("slider", { name: /Spe/ })).toHaveValue("32");
    expect(screen.getByText("0 / 66 remaining")).toBeInTheDocument();
    expect(screen.getByText(/transforms this build into Mega Blastoise/)).toBeInTheDocument();
    const moveValues = screen.getAllByRole("combobox", { name: /Move [1-4]/ }).map((entry) => (entry as HTMLSelectElement).value);
    expect(moveValues).toEqual(["aura-sphere", "dark-pulse", "dragon-pulse", "water-pulse"]);
    const buildMode = screen.getAllByRole("group", { name: "Team mode" }).at(-1)!;
    await user.click(within(buildMode).getByRole("button", { name: "Singles" }));
    expect(await screen.findByRole("heading", { name: "Blastoise" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Held item/ })).toHaveValue("leftovers");
  });

  it("keeps independent selectable Singles and Doubles teams", async () => {
    const member = (id: string, pokemonId: string): TeamMember => ({ id, pokemonId, abilityId: null, itemId: null, moveIds: [], ap: { ...ZERO_STATS }, nature: { name: "Serious", up: null, down: null } });
    useTeamStore.setState({ teams: { singles: [member("single", "absol")], doubles: [member("double", "garchomp")] }, hydrated: true });
    const user = userEvent.setup();
    render(<ChampionsApp />);
    const tray = screen.getByRole("complementary", { name: "Selected team" });
    expect(within(tray).getByText("Garchomp")).toBeInTheDocument();
    await user.click(within(tray).getByRole("button", { name: "Singles 1/6" }));
    expect(within(tray).getByText("Absol")).toBeInTheDocument();
    expect(within(tray).queryByText("Garchomp")).not.toBeInTheDocument();
  });

  it("switches language without losing navigation", async () => {
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.click(screen.getByRole("button", { name: "繁中" }));
    expect(screen.getByRole("button", { name: "招式資料庫" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "寶可夢資料庫" })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("搜尋寶可夢名稱…"), "Garchomp");
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

describe("Type matchup chart", () => {
  it("renders the complete 18 by 18 effectiveness matrix", () => {
    const { container } = render(<TypeChart locale="en" />);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(18);
    expect(container.querySelectorAll("tbody td")).toHaveLength(324);
    const defendingHeader = container.querySelector("thead")!;
    expect(within(defendingHeader).getByText("Normal")).toBeInTheDocument();
    expect(within(defendingHeader).getByText("Fairy")).toBeInTheDocument();
    expect(screen.getByText("Type Matchup Chart")).toBeInTheDocument();
  });

  it("opens from the lower-left floating control and links to the full page", async () => {
    const user = userEvent.setup();
    render(<TypeChartFloating />);
    await user.click(screen.getByRole("button", { name: /Type chart/ }));
    expect(screen.getByRole("link", { name: /Open full type chart page/ })).toHaveAttribute("href", "/type-chart");
    expect(screen.getByLabelText("Type Matchup Chart")).toBeInTheDocument();
  });
});
