import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChampionsApp } from "../components/ChampionsApp";
import { TypeChart } from "../components/TypeChartView";
import { MoveDatabaseV2, PokemonTableV2, ResourceDatabaseV2 } from "../components/DatabaseViews";
import { compareLearnableMoves } from "../components/PokemonDetailDialog";
import { ZERO_STATS } from "../lib/domain";
import { moves, pokemon } from "../lib/catalog";
import { useTeamStore } from "../lib/team-store";
import { useScrapbookStore } from "../lib/scrapbook-store";
import { ALL_TYPES } from "../lib/type-chart";
import type { TeamMember } from "../lib/types";

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.locale;
  delete document.documentElement.dataset.localePending;
  useTeamStore.setState({ teams: { singles: [], doubles: [] }, hydrated: true });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const openTeamTray = () => {
  const tray = screen.getByRole("complementary", { name: "Selected team" });
  const header = tray.querySelector<HTMLButtonElement>(".tray-header")!;
  if (header.getAttribute("aria-expanded") !== "true") fireEvent.click(header);
  return tray;
};

describe("Move Database", () => {
  it("localizes move properties in Traditional Chinese mode", async () => {
    const user = userEvent.setup();
    render(<MoveDatabaseV2 locale="zh-Hant" />);
    await user.type(screen.getByPlaceholderText("搜尋招式…"), "Accelerock");
    const row = screen.getByRole("button", { name: "衝岩" }).closest("tr");
    expect(row).toHaveTextContent("接觸");
    expect(row).toHaveTextContent("可被守住");
    expect(row).not.toHaveTextContent("Contact");
    const headers = within(row!.closest("table")!).getAllByRole("columnheader");
    const headerLabels = headers.map((header) => header.textContent?.replace(/[↑↓↕]/g, ""));
    expect(headerLabels).toEqual(expect.arrayContaining(["目標", "效果", "特性標籤"]));
    expect(headerLabels.indexOf("效果")).toBe(headerLabels.indexOf("目標") + 1);
    expect(headerLabels.indexOf("特性標籤")).toBe(headerLabels.indexOf("效果") + 1);
    expect(row?.querySelector(".move-effect-cell")).toHaveTextContent(moves.find((move) => move.name === "Accelerock")!.descriptionZh);
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

  it("uses the Pokémon database type order and clears every move filter in one action", async () => {
    const user = userEvent.setup();
    const { container } = render(<MoveDatabaseV2 locale="en" />);
    const typeGroup = Array.from(container.querySelectorAll<HTMLElement>(".filter-group")).find((group) => group.querySelector("b")?.textContent === "Type")!;
    expect(within(typeGroup).getAllByRole("button").map((button) => button.textContent)).toEqual(ALL_TYPES);
    await user.type(screen.getByRole("textbox", { name: "Search moves" }), "Punch");
    await user.click(within(typeGroup).getByRole("button", { name: "Fire" }));
    await user.click(screen.getByRole("button", { name: "+ Positive" }));
    await user.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(screen.getByRole("textbox", { name: "Search moves" })).toHaveValue("");
    expect(container.querySelectorAll(".filter-chip[aria-pressed='true']")).toHaveLength(0);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(100);
  });

  it("sorts the requested move columns descending on the first click", async () => {
    const user = userEvent.setup();
    render(<MoveDatabaseV2 locale="en" />);
    for (const name of ["Class", "Power", "Acc.", "PP", "Priority"]) {
      const header = screen.getByRole("button", { name });
      await user.click(header);
      expect(header.closest("th")).toHaveAttribute("aria-sort", "descending");
    }
    const priority = screen.getByRole("button", { name: /Priority/ });
    await user.click(priority);
    expect(priority.closest("th")).toHaveAttribute("aria-sort", "ascending");
  });

  it("keeps missing move values last while sorting Power and Acc. descending", async () => {
    const user = userEvent.setup();
    const { container } = render(<MoveDatabaseV2 locale="en" />);
    for (const [name, column] of [["Power", 3], ["Acc.", 4]] as const) {
      await user.click(screen.getByRole("button", { name }));
      const values = Array.from(container.querySelectorAll<HTMLTableCellElement>(`tbody tr td:nth-child(${column + 1})`), (cell) => cell.textContent ?? "");
      expect(values).not.toContain("—");
      const numericValues = values.map(Number);
      expect(numericValues).toEqual([...numericValues].sort((a, b) => b - a));
    }
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
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Dragon Claw" })).not.toBeInTheDocument();
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

  it("clears ability search and category filters in one action", async () => {
    const user = userEvent.setup();
    const { container } = render(<ResourceDatabaseV2 kind="abilities" locale="en" />);
    await user.type(screen.getByRole("textbox", { name: "Search abilities" }), "Drought");
    await user.click(screen.getByRole("button", { name: "Weather" }));
    await user.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(screen.getByRole("textbox", { name: "Search abilities" })).toHaveValue("");
    expect(container.querySelectorAll(".filter-chip[aria-pressed='true']")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Rough Skin" })).toBeInTheDocument();
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

  it("clears held-item search and category filters while restoring Mega items", async () => {
    const user = userEvent.setup();
    const { container } = render(<ResourceDatabaseV2 kind="items" locale="en" />);
    await user.type(screen.getByRole("textbox", { name: "Search held items" }), "Sitrus");
    await user.click(screen.getByRole("button", { name: "Berry" }));
    await user.click(screen.getByRole("button", { name: "ON" }));
    await user.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(screen.getByRole("textbox", { name: "Search held items" })).toHaveValue("");
    expect(screen.getByRole("button", { name: "ON" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelectorAll(".filter-chip[aria-pressed='true']")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Charizardite X" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choice Scarf" })).toBeInTheDocument();
  });

  it("offers an Other effect filter for uncategorized held items", async () => {
    const user = userEvent.setup();
    render(<ResourceDatabaseV2 kind="items" locale="en" />);
    await user.click(screen.getByRole("button", { name: "Other" }));
    expect(screen.getByRole("button", { name: "King's Rock" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Leftovers" })).not.toBeInTheDocument();
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

describe("ChampionsApp", () => {
  it("starts with the selected-team tray collapsed", () => {
    render(<ChampionsApp />);
    const tray = screen.getByRole("complementary", { name: "Selected team" });
    expect(tray).toHaveClass("collapsed");
    expect(tray.querySelector(".tray-header")).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps each database state while switching views, then resets after remount", async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<ChampionsApp />);

    const pokemonFilters = container.querySelector<HTMLElement>(".pokemon-advanced-filters")!;
    await user.click(within(pokemonFilters).getByRole("button", { name: "Water" }));

    await user.click(screen.getByRole("button", { name: "Move DB" }));
    const movePanel = screen.getByRole("heading", { name: "Move DB" }).closest("section")!;
    await user.click(within(movePanel).getByRole("button", { name: "Water" }));

    await user.click(screen.getByRole("button", { name: "Ability DB" }));
    await user.click(screen.getByRole("button", { name: "Weather" }));

    await user.click(screen.getByRole("button", { name: "Held Item DB" }));
    await user.click(screen.getByRole("button", { name: "Berry" }));

    await user.click(screen.getByRole("button", { name: "Pokémon DB" }));
    expect(within(pokemonFilters).getByRole("button", { name: "Water" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Move DB" }));
    expect(within(movePanel).getByRole("button", { name: "Water" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Ability DB" }));
    expect(screen.getByRole("button", { name: "Weather" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Held Item DB" }));
    expect(screen.getByRole("button", { name: "Berry" })).toHaveAttribute("aria-pressed", "true");
    unmount();
    render(<ChampionsApp />);
    const resetPokemonFilters = document.querySelector<HTMLElement>(".pokemon-advanced-filters")!;
    expect(within(resetPokemonFilters).getByRole("button", { name: "Water" })).toHaveAttribute("aria-pressed", "false");
  }, 60_000);

  it("sorts detail learnsets by the Pokémon database type order before move details", () => {
    const names = ["Swords Dance", "Air Slash", "Assurance", "Aerial Ace", "Sucker Punch"];
    const fixture = names.map((name) => moves.find((move) => move.name === name)!);
    expect([...fixture].sort(compareLearnableMoves).map((move) => move.name)).toEqual(["Swords Dance", "Aerial Ace", "Air Slash", "Sucker Punch", "Assurance"]);
  });

  it("renders every member in a full six-Pokémon scrollable team list", () => {
    const pokemonIds = ["abomasnow", "aerodactyl", "alakazam", "arbok", "arcanine", "garchomp"];
    const members: TeamMember[] = pokemonIds.map((pokemonId, index) => ({ id: `member-${index}`, pokemonId, abilityId: null, itemId: null, moveIds: [], ap: { ...ZERO_STATS }, nature: { name: "Serious", nameZh: "認真", up: null, down: null } }));
    useTeamStore.setState({ teams: { singles: [], doubles: members }, hydrated: true });
    render(<ChampionsApp />);
    const list = openTeamTray().querySelector<HTMLElement>(".team-list")!;
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

  it("shows, filters, and sorts the total base stat in both directions", async () => {
    const user = userEvent.setup();
    const { container } = render(<PokemonTableV2 locale="en" format="doubles" onSelect={() => undefined} />);
    expect(container.querySelector("td[data-stat='total']")).toHaveClass("stat-accent", "stat-total");
    const totalHeader = screen.getByRole("button", { name: /TOT/ });
    await user.click(totalHeader);
    const descending = Array.from(container.querySelectorAll("td[data-stat='total']"), (node) => Number(node.textContent));
    expect(descending).toEqual([...descending].sort((a, b) => b - a));
    await user.click(totalHeader);
    const ascending = Array.from(container.querySelectorAll("td[data-stat='total']"), (node) => Number(node.textContent));
    expect(ascending).toEqual([...ascending].sort((a, b) => a - b));
    await user.type(screen.getByRole("spinbutton", { name: "Minimum TOT" }), "700");
    const filtered = Array.from(container.querySelectorAll("td[data-stat='total']"), (node) => Number(node.textContent));
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every((value) => value >= 700)).toBe(true);
  });

  it("sorts every base-stat column descending on the first click", async () => {
    const user = userEvent.setup();
    render(<PokemonTableV2 locale="en" format="doubles" onSelect={() => undefined} />);
    for (const name of ["HP", "Atk", "Def", "SpA", "SpD", "Spe"]) {
      const header = screen.getByRole("button", { name });
      await user.click(header);
      expect(header.closest("th")).toHaveAttribute("aria-sort", "descending");
    }
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
      singles: { pokemon: "Absol", format: "Singles", season: "Current", date: null, source: "Pokémon Champions Battle Data", rankGaps: [{ category: "move", missingRanks: [1, 2, 3, 4, 5] }], rows: [{ category: "move", rank: 6, name: "Sucker Punch", percentage: "70.0%", percentageValue: 70, statUp: "", statDown: "", ap: null }] },
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
    const typeGroup = Array.from(moveFilters.querySelectorAll<HTMLElement>(".filter-group")).find((group) => group.querySelector("b")?.textContent === "Type")!;
    const absol = pokemon.find((entry) => entry.id === "absol")!;
    const expectedTypes = ALL_TYPES.filter((type) => absol.moveIds.some((id) => moves.find((move) => move.id === id)?.type === type));
    expect(within(typeGroup).getAllByRole("button").map((button) => button.textContent)).toEqual(expectedTypes);
    await user.click(within(moveFilters).getByRole("button", { name: "+ Positive" }));
    await user.click(within(moveFilters).getByRole("button", { name: "Dark" }));
    await user.click(within(moveFilters).getByRole("button", { name: "Physical" }));
    await user.click(within(moveFilters).getByRole("button", { name: "1 target" }));
    expect(within(moveFilters).queryByText(/^Properties$/)).not.toBeInTheDocument();
    const suckerPunchRow = within(dialog).getByRole("button", { name: "Sucker Punch" }).closest("tr")!;
    expect(suckerPunchRow).toHaveTextContent("70");
    expect(suckerPunchRow).toHaveTextContent("100");
    expect(suckerPunchRow).toHaveTextContent("8");
    const learnableTable = suckerPunchRow.closest("table")!;
    expect(within(learnableTable).getByRole("columnheader", { name: /Usable Pokémon/ })).toBeInTheDocument();
    expect(within(learnableTable).queryByRole("columnheader", { name: /Properties/ })).not.toBeInTheDocument();
    const accuracySort = () => within(learnableTable).getByRole("button", { name: /^Acc\./ });
    await user.click(accuracySort());
    expect(within(learnableTable).getByRole("columnheader", { name: /Acc\./ })).toHaveAttribute("aria-sort", "descending");
    await user.click(accuracySort());
    expect(within(learnableTable).getByRole("columnheader", { name: /Acc\./ })).toHaveAttribute("aria-sort", "ascending");
    await user.click(accuracySort());
    expect(within(learnableTable).getByRole("columnheader", { name: /Acc\./ })).toHaveAttribute("aria-sort", "none");
    await user.click(within(learnableTable).getByRole("button", { name: /^View \d+ Pokémon that can use Sucker Punch$/ }));
    const reverseDialog = screen.getByRole("dialog", { name: "Sucker Punch" });
    expect(within(reverseDialog).getByRole("textbox", { name: "Search Pokémon in reverse lookup" })).toBeInTheDocument();
    expect(within(reverseDialog).getByRole("button", { name: "Add to scrapbook Absol" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Sucker Punch" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Absol" })).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Calm Mind" })).not.toBeInTheDocument();
    const mobileFilterToggle = within(dialog).getByRole("button", { name: "Move filters (4)" });
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
    expect(within(singlesUsage).getByText("The official source is missing ranks #1, #2, #3, #4, #5; the original reported ranks are preserved below.")).toBeInTheDocument();
    const usageMove = within(singlesUsage).getByRole("button", { name: "Sucker Punch" });
    expect(usageMove.closest(".usage-row")).toHaveTextContent(/^6/);
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
    fireEvent.change(screen.getByRole("slider", { name: /Atk/ }), { target: { value: "32" } });
    await user.click(screen.getByRole("button", { name: "Build & add" }));
    const tray = openTeamTray();
    expect(within(tray).getByText("Weak")).toBeInTheDocument();
    expect(within(tray).getByText("Immune")).toBeInTheDocument();
    expect(within(tray).getByText("Adamant (Atk ↑ / SpA ↓)")).toHaveAttribute("title", "Adamant (Atk ↑ / SpA ↓)");
    expect(within(tray).getByText("+32")).toBeInTheDocument();
    expect(tray.querySelector(".nature-up")).toHaveTextContent("↑");
    expect(tray.querySelector(".nature-down")).toHaveTextContent("↓");
  });

  it("preselects the dedicated stone but lets a Mega build return to its regular form", async () => {
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), "Mega Absol");
    await user.click(screen.getByRole("button", { name: "Configure Mega Absol" }));
    const item = screen.getByRole("combobox", { name: /Held item/ });
    expect(item).toHaveValue("Absolite");
    await user.click(item);
    const options = within(screen.getByRole("listbox", { name: "Held item options" })).getAllByRole("option").filter((option) => !option.classList.contains("clear-option"));
    expect(options[0]).toHaveTextContent("Absolite");
    await user.clear(item);
    await user.type(item, "Life Orb");
    await user.click(screen.getByRole("option", { name: /Life Orb/ }));
    expect(screen.getByRole("heading", { name: "Absol" })).toBeInTheDocument();
    expect(item).toHaveValue("Life Orb");
  });

  it("edits a saved Mega member into its regular form with an ordinary item", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    const member: TeamMember = {
      id: "mega-absol", pokemonId: "mega-absol", abilityId: "magic-bounce", itemId: "absolite",
      moveIds: ["sucker-punch", "protect"], ap: { ...ZERO_STATS, attack: 32, speed: 32 },
      nature: { name: "Jolly", nameZh: "爽朗", up: "speed", down: "specialAttack" },
    };
    useTeamStore.setState({ teams: { singles: [], doubles: [member] }, hydrated: true });
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.click(within(openTeamTray()).getByRole("button", { name: "Edit Mega Absol" }));
    const item = screen.getByRole("combobox", { name: "Held item" });
    await user.click(item);
    await user.clear(item);
    await user.type(item, "Life Orb");
    await user.click(screen.getByRole("option", { name: /Life Orb/ }));
    expect(screen.getByRole("heading", { name: "Absol" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    expect(useTeamStore.getState().teams.doubles[0]).toMatchObject({ pokemonId: "absol", itemId: "life-orb" });
  });

  it("applies current-format usage and transforms a base Pokémon when its Mega Stone is selected", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      void input;
      return Response.json({ data: {
      singles: { pokemon: "Blastoise", format: "Singles", season: "Current", date: null, source: "test", rows: [{ category: "held_item", rank: 1, name: "Leftovers", percentage: "40%", percentageValue: 40, statUp: "", statDown: "", ap: null }] },
      doubles: { pokemon: "Blastoise", format: "Doubles", season: "Current", date: null, source: "test", rows: [
        { category: "held_item", rank: 1, name: "Blastoisinite", percentage: "80%", percentageValue: 80, statUp: "", statDown: "", ap: null },
        { category: "ability", rank: 1, name: "Mega Launcher", percentage: "100%", percentageValue: 100, statUp: "", statDown: "", ap: null },
        { category: "stat_alignment", rank: 1, name: "Modest", percentage: "75%", percentageValue: 75, statUp: "Sp. Atk", statDown: "Attack", ap: null },
        { category: "stat_points", rank: 1, name: "", percentage: "60%", percentageValue: 60, statUp: "", statDown: "", ap: { hp: 2, attack: 0, defense: 0, specialAttack: 32, specialDefense: 0, speed: 32 } },
        { category: "stat_points", rank: 2, name: "", percentage: "25%", percentageValue: 25, statUp: "", statDown: "", ap: { hp: 32, attack: 0, defense: 32, specialAttack: 0, specialDefense: 2, speed: 0 } },
        ...["Aura Sphere", "Dark Pulse", "Dragon Pulse", "Water Pulse"].map((name, index) => ({ category: "move", rank: index + 1, name, percentage: `${90 - index}%`, percentageValue: 90 - index, statUp: "", statDown: "", ap: null })),
      ] },
      } });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), "Blastoise");
    await user.click(screen.getByRole("button", { name: "Configure Blastoise" }));
    expect(await screen.findByRole("heading", { name: "Mega Blastoise" })).toBeInTheDocument();
    await waitFor(() => expect(fetchMock.mock.calls
      .map(([input]) => new URL(String(input), "https://test.invalid").searchParams.get("pokemonId"))
      .filter(Boolean)).toEqual(["blastoise"]));
    expect(screen.getByRole("combobox", { name: /Held item/ })).toHaveValue("Blastoisinite");
    await waitFor(() => expect(screen.getByRole("combobox", { name: "Ability" })).toHaveValue("Mega Launcher"));
    expect(screen.getByRole("combobox", { name: "Nature" })).toHaveValue("Modest");
    expect(screen.getByRole("option", { name: /Common #1 .*Modest/ })).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Ability" }));
    expect(screen.getByRole("option", { name: /Mega Launcher.*Common #1/ })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("combobox", { name: /Held item/ }));
    expect(screen.getByRole("option", { name: /Blastoisinite.*Common #1/ })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("combobox", { name: "Move 1" }));
    expect(screen.getByRole("option", { name: /Aura Sphere.*Common #1/ })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("slider", { name: /SpA/ })).toHaveValue("32");
    expect(screen.getByRole("slider", { name: /Spe/ })).toHaveValue("32");
    expect(screen.getByText("0 / 66 remaining")).toBeInTheDocument();
    const apSpread = screen.getByRole("combobox", { name: "AP spread" });
    expect(apSpread).toHaveValue("1");
    expect(screen.getByRole("option", { name: /Common #2 .*HP 32 .*Def 32 .*SpD 2 .*25%/ })).toBeInTheDocument();
    await user.selectOptions(apSpread, "2");
    expect(screen.getByRole("slider", { name: /HP/ })).toHaveValue("32");
    expect(screen.getByRole("slider", { name: /Def/ })).toHaveValue("32");
    expect(screen.getByRole("slider", { name: /SpD/ })).toHaveValue("2");
    fireEvent.change(screen.getByRole("slider", { name: /HP/ }), { target: { value: "31" } });
    expect(apSpread).toHaveValue("custom");
    expect(screen.getByText(/current form is Mega Blastoise/)).toBeInTheDocument();
    const moveValues = screen.getAllByRole("combobox", { name: /Move [1-4]/ }).map((entry) => entry.getAttribute("data-move-id"));
    expect(moveValues).toEqual(["aura-sphere", "dark-pulse", "dragon-pulse", "water-pulse"]);
    const buildMode = screen.getAllByRole("group", { name: "Team mode" }).at(-1)!;
    await user.click(within(buildMode).getByRole("button", { name: "Singles" }));
    expect(await screen.findByRole("heading", { name: "Blastoise" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /Held item/ })).toHaveValue("Leftovers");
  });

  it("reuses Gallade recommendations when Galladite changes it into Mega Gallade", async () => {
    const rows = (pokemonName: string, heldItem: string, ability: string, move: string) => ({
      singles: null,
      doubles: { pokemon: pokemonName, format: "Doubles", season: "Current", date: null, source: "key-test", rows: [
        { category: "held_item", rank: 1, name: heldItem, percentage: "90%", percentageValue: 90, statUp: "", statDown: "", ap: null },
        { category: "ability", rank: 1, name: ability, percentage: "80%", percentageValue: 80, statUp: "", statDown: "", ap: null },
        { category: "move", rank: 1, name: move, percentage: "70%", percentageValue: 70, statUp: "", statDown: "", ap: null },
      ] },
    });
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      void input;
      return Response.json({ data: rows("Gallade", "Galladite", "Sharpness", "Sacred Sword") });
    });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), "Gallade");
    await user.click(screen.getByRole("button", { name: "Configure Gallade" }));
    expect(await screen.findByRole("heading", { name: "Mega Gallade" })).toBeInTheDocument();
    await waitFor(() => expect(fetchMock.mock.calls
      .map(([input]) => new URL(String(input), "https://test.invalid").searchParams.get("pokemonId"))
      .filter(Boolean)).toEqual(["gallade"]));
    expect(screen.getByRole("combobox", { name: "Ability" })).toHaveValue("Inner Focus");
  });

  it("does not let a regional form use another form's dedicated Mega Stone", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), "Galarian Slowbro");
    await user.click(screen.getByRole("button", { name: "Configure Galarian Slowbro" }));
    const item = screen.getByRole("combobox", { name: /Held item/ });
    await user.click(item);
    await user.type(item, "Slowbronite");
    await user.click(screen.getByRole("option", { name: /Slowbronite/ }));
    expect(screen.getByRole("heading", { name: "Galarian Slowbro" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Mega Slowbro" })).not.toBeInTheDocument();
  });

  it("keeps independent selectable Singles and Doubles teams", async () => {
    const member = (id: string, pokemonId: string): TeamMember => ({ id, pokemonId, abilityId: null, itemId: null, moveIds: [], ap: { ...ZERO_STATS }, nature: { name: "Serious", up: null, down: null } });
    useTeamStore.setState({ teams: { singles: [member("single", "absol")], doubles: [member("double", "garchomp")] }, hydrated: true });
    const user = userEvent.setup();
    render(<ChampionsApp />);
    const tray = openTeamTray();
    expect(within(tray).getByText("Garchomp")).toBeInTheDocument();
    await user.click(within(tray).getByRole("button", { name: "Singles 1/6" }));
    expect(within(tray).getByText("Absol")).toBeInTheDocument();
    expect(within(tray).queryByText("Garchomp")).not.toBeInTheDocument();
  });

  it("edits an existing team member in place without removing or reordering it", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    const existing: TeamMember = {
      id: "editable-absol",
      pokemonId: "absol",
      abilityId: "pressure",
      itemId: "life-orb",
      moveIds: ["sucker-punch", "protect"],
      ap: { ...ZERO_STATS, attack: 32, speed: 32 },
      nature: { name: "Adamant", nameZh: "固執", up: "attack", down: "specialAttack" },
    };
    const teammate: TeamMember = { ...existing, id: "teammate", pokemonId: "garchomp", abilityId: "rough-skin", itemId: "sitrus-berry", moveIds: ["dragon-claw"] };
    useTeamStore.setState({ teams: { singles: [], doubles: [existing, teammate] }, hydrated: true });
    const user = userEvent.setup();
    render(<ChampionsApp />);
    const tray = openTeamTray();
    await user.click(within(tray).getByRole("button", { name: "Edit Absol" }));
    expect(screen.getByRole("button", { name: "Save changes" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Move 1" })).toHaveValue("Sucker Punch");
    expect(screen.getByRole("combobox", { name: "Nature" })).toHaveValue("Adamant");
    const teamMode = screen.getAllByRole("group", { name: "Team mode" }).at(-1)!;
    expect(within(teamMode).getByRole("button", { name: "Doubles" })).toBeDisabled();
    const firstMove = screen.getByRole("combobox", { name: "Move 1" });
    fireEvent.click(firstMove);
    fireEvent.change(firstMove, { target: { value: "Close Combat" } });
    fireEvent.click(within(screen.getByRole("listbox", { name: "Move 1 options" })).getByText("Close Combat", { selector: "strong" }));
    fireEvent.change(screen.getByRole("combobox", { name: "Nature" }), { target: { value: "Jolly" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    const saved = useTeamStore.getState().teams.doubles;
    expect(saved).toHaveLength(2);
    expect(saved.map((member) => member.id)).toEqual(["editable-absol", "teammate"]);
    expect(saved[0].moveIds[0]).toBe("close-combat");
    expect(saved[0].nature.name).toBe("Jolly");
  }, 60_000);

  it("recognizes a saved AP spread and switches it to Custom after a manual adjustment", async () => {
    const existing: TeamMember = {
      id: "ranked-ap-absol", pokemonId: "absol", abilityId: "pressure", itemId: "life-orb",
      moveIds: ["sucker-punch", "protect"], ap: { ...ZERO_STATS, attack: 32, speed: 32 },
      nature: { name: "Jolly", nameZh: "爽朗", up: "speed", down: "specialAttack" },
    };
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ data: {
      singles: null,
      doubles: { pokemon: "Absol", format: "Doubles", season: "Current", date: null, source: "test", rows: [
        { category: "stat_points", rank: 3, name: "", percentage: "18.5%", percentageValue: 18.5, statUp: "", statDown: "", ap: { ...ZERO_STATS, attack: 32, speed: 32 } },
      ] },
    } })));
    useTeamStore.setState({ teams: { singles: [], doubles: [existing] }, hydrated: true });
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.click(within(openTeamTray()).getByRole("button", { name: "Edit Absol" }));
    const apSpread = await screen.findByRole("combobox", { name: "AP spread" });
    await waitFor(() => expect(apSpread).toHaveValue("3"));
    expect(screen.getByRole("option", { name: /Common #3 .*18.5%/ })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("slider", { name: /Def/ }), { target: { value: "1" } });
    expect(apSpread).toHaveValue("custom");
  });

  it("preserves saved moves and ability when an edited member changes only its ordinary held item", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    const existing: TeamMember = {
      id: "item-edit-absol",
      pokemonId: "absol",
      abilityId: "super-luck",
      itemId: "life-orb",
      moveIds: ["sucker-punch", "protect"],
      ap: { ...ZERO_STATS, attack: 32, speed: 32 },
      nature: { name: "Adamant", nameZh: "固執", up: "attack", down: "specialAttack" },
    };
    useTeamStore.setState({ teams: { singles: [], doubles: [existing] }, hydrated: true });
    const user = userEvent.setup();
    render(<ChampionsApp />);
    const tray = openTeamTray();
    await user.click(within(tray).getByRole("button", { name: "Edit Absol" }));
    const item = screen.getByRole("combobox", { name: /Held item/ });
    await user.click(item);
    await user.clear(item);
    await user.type(item, "Sitrus Berry");
    await user.click(screen.getByRole("option", { name: /Sitrus Berry/ }));
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    const saved = useTeamStore.getState().teams.doubles[0];
    expect(saved.itemId).toBe("sitrus-berry");
    expect(saved.moveIds).toEqual(["sucker-punch", "protect"]);
    expect(saved.abilityId).toBe("super-luck");
  });

  it("closes a resource picker before closing the editor without moving focus", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), "Absol");
    await user.click(screen.getByRole("button", { name: "Configure Absol" }));
    const item = screen.getByRole("combobox", { name: /Held item/ });
    await user.click(item);
    expect(item).toHaveAttribute("aria-expanded", "true");
    await user.keyboard("{Escape}");
    expect(item).toHaveAttribute("aria-expanded", "false");
    expect(item).toHaveFocus();
    expect(screen.getByRole("dialog", { name: "Absol" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Absol" })).not.toBeInTheDocument();
  });

  it("searches learnable moves, prevents duplicates, and lets a second Escape close the editor", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), "Absol");
    await user.click(screen.getByRole("button", { name: "Configure Absol" }));
    const firstMove = screen.getByRole("combobox", { name: "Move 1" });
    await user.click(firstMove);
    fireEvent.change(firstMove, { target: { value: "Me First" } });
    const suckerPunch = screen.getByRole("option", { name: /Sucker Punch/ });
    expect(suckerPunch).toHaveTextContent("Dark");
    expect(suckerPunch).toHaveTextContent("Physical");
    expect(suckerPunch).toHaveTextContent("Power 70");
    expect(suckerPunch).toHaveTextContent("Priority +1");
    await user.click(suckerPunch);
    const secondMove = screen.getByRole("combobox", { name: "Move 2" });
    await user.click(secondMove);
    fireEvent.change(secondMove, { target: { value: "Sucker Punch" } });
    expect(screen.getByRole("option", { name: /Sucker Punch/ })).toBeDisabled();
    expect(screen.getByText("Already selected")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(secondMove).toHaveAttribute("aria-expanded", "false");
    expect(secondMove).toHaveFocus();
    expect(screen.getByRole("dialog", { name: "Absol" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Absol" })).not.toBeInTheDocument();
  });

  it("selects a searched move with arrow keys and Enter while skipping disabled duplicates", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), "Absol");
    await user.click(screen.getByRole("button", { name: "Configure Absol" }));
    const firstMove = screen.getByRole("combobox", { name: "Move 1" });
    await user.click(firstMove);
    fireEvent.change(firstMove, { target: { value: "Sucker Punch" } });
    await user.keyboard("{ArrowDown}{Enter}");
    expect(firstMove).toHaveValue("Sucker Punch");
    expect(firstMove).toHaveAttribute("aria-expanded", "false");

    const secondMove = screen.getByRole("combobox", { name: "Move 2" });
    await user.click(secondMove);
    fireEvent.change(secondMove, { target: { value: "Sucker Punch" } });
    expect(screen.getByRole("option", { name: /Sucker Punch/ })).toBeDisabled();
    await user.keyboard("{ArrowDown}{Enter}");
    expect(secondMove).not.toHaveValue("Sucker Punch");
    expect(secondMove).toHaveFocus();
  });

  it("switches language without losing navigation", async () => {
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.click(screen.getByRole("button", { name: "繁中" }));
    expect(screen.getByRole("button", { name: "招式資料庫" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "寶可夢資料庫" })).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("搜尋寶可夢名稱…"), "Garchomp");
    expect(screen.getByRole("button", { name: "烈咬陸鯊" })).toBeInTheDocument();
  });

  it("restores the user's last language after a remount", async () => {
    const user = userEvent.setup();
    const first = render(<ChampionsApp />);
    await user.click(screen.getByRole("button", { name: "繁中" }));
    expect(localStorage.getItem("champions-lab-locale-v1")).toBe("zh-Hant");
    first.unmount();
    document.documentElement.dataset.locale = "zh-Hant";
    document.documentElement.dataset.localePending = "";
    render(<ChampionsApp />);
    expect(await screen.findByRole("heading", { name: "寶可夢資料庫" })).toBeInTheDocument();
    expect(document.documentElement).not.toHaveAttribute("data-locale-pending");
    expect(document.documentElement).toHaveAttribute("lang", "zh-Hant");
  });

  it("uses the browser language on the first visit", async () => {
    vi.spyOn(window.navigator, "languages", "get").mockReturnValue(["zh-TW", "en-US"]);
    render(<ChampionsApp />);
    expect(await screen.findByRole("heading", { name: "寶可夢資料庫" })).toBeInTheDocument();
    expect(localStorage.getItem("champions-lab-locale-v1")).toBe("zh-Hant");
  });

  it("defaults resource pickers to detailed descriptions and remembers compact choices", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), "Absol");
    await user.click(screen.getByRole("button", { name: "Configure Absol" }));
    const ability = screen.getByRole("combobox", { name: "Ability" });
    await user.click(ability);
    await user.clear(ability);
    await user.type(ability, "Super Luck");
    expect(screen.getByRole("option", { name: /Super Luck/ })).toHaveTextContent("critical hit ratio");
    await user.keyboard("{Escape}");
    const abilityPreference = screen.getByText("ability").parentElement!;
    await user.click(within(abilityPreference).getByRole("button", { name: "Compact" }));
    await user.click(ability);
    await user.clear(ability);
    await user.type(ability, "Super Luck");
    expect(screen.getByRole("option", { name: /Super Luck/ })).not.toHaveTextContent("critical hit ratio");
    expect(JSON.parse(localStorage.getItem("champions-lab-builder-display-v1") ?? "{}")).toMatchObject({ ability: "compact" });
  });

  it("closes detail and build modals with Escape from document focus", async () => {
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), "Absol");
    await user.click(screen.getByRole("button", { name: /^Absol$/ }));
    expect(screen.getByRole("dialog", { name: "Absol" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Absol" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Configure Absol" }));
    expect(screen.getByRole("dialog", { name: "Absol" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Absol" })).not.toBeInTheDocument();
  });

  it("closes only the topmost dialog across detail, reverse lookup, and scrapbook layers", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("offline"))));
    useScrapbookStore.getState().createBook("Existing scrapbook");
    const user = userEvent.setup();
    render(<ChampionsApp />);
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), "Absol");
    await user.click(screen.getByRole("button", { name: /^Absol$/ }));
    const detail = screen.getByRole("dialog", { name: "Absol" });

    await user.click(within(detail).getByRole("button", { name: "Add to another scrapbook" }));
    expect(screen.getByRole("dialog", { name: /Add to scrapbook · Absol/ })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: /Add to scrapbook · Absol/ })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Absol" })).toBeInTheDocument();

    const learnableTable = within(detail).getByRole("button", { name: "Sucker Punch" }).closest("table")!;
    await user.click(within(learnableTable).getByRole("button", { name: /^View \d+ Pokémon that can use Sucker Punch$/ }));
    const reverse = screen.getByRole("dialog", { name: "Sucker Punch" });
    await user.click(within(reverse).getByRole("button", { name: "Add to scrapbook Absol" }));
    expect(screen.getByRole("dialog", { name: /Add to scrapbook · Absol/ })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: /Add to scrapbook · Absol/ })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Sucker Punch" })).toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Absol" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Sucker Punch" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Absol" })).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: "Absol" })).not.toBeInTheDocument();
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
    expect(container.querySelectorAll("colgroup col")).toHaveLength(19);
    const defendingHeader = container.querySelector("thead")!;
    expect(within(defendingHeader).getByText("Normal")).toBeInTheDocument();
    expect(within(defendingHeader).getByText("Fairy")).toBeInTheDocument();
    expect(screen.getAllByLabelText("Normal")).toHaveLength(2);
    expect(container.querySelector(".chart-type-short")).toHaveTextContent("N");
    expect(screen.getByText("Type Matchup Chart")).toBeInTheDocument();
  });

  it("opens as a first-class application tab without a floating control", async () => {
    const user = userEvent.setup();
    render(<ChampionsApp />);
    expect(screen.queryByRole("complementary", { name: /Type chart/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Speed Compare" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Type Chart" }));
    expect(screen.getByLabelText("Type Matchup Chart")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "繁中" }));
    expect(screen.getByRole("button", { name: "屬性相剋" })).toHaveClass("active");
    expect(screen.queryByRole("button", { name: "速度比較" })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "屬性相剋表" })).toBeInTheDocument();
  });

  it("follows the system theme until the user chooses a persistent BD or WP override", async () => {
    let systemIsDark = true;
    const listeners = new Set<(event: MediaQueryListEvent) => void>();
    const mediaQuery = {
      get matches() { return systemIsDark; },
      media: "(prefers-color-scheme: dark)",
      onchange: null,
      addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => true,
    } as MediaQueryList;
    vi.stubGlobal("matchMedia", vi.fn(() => mediaQuery));
    const user = userEvent.setup();
    const first = render(<ChampionsApp />);
    const themeControl = screen.getByRole("group", { name: "Display mode" });
    const bd = await screen.findByRole("button", { name: "Dark mode (current)" });
    const wp = screen.getByRole("button", { name: "Switch to light mode" });
    expect(bd).toHaveTextContent("BD");
    expect(wp).toHaveTextContent("WP");
    expect(bd).toHaveAttribute("title", "Dark mode (current)");
    expect(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(themeControl.previousElementSibling).toHaveClass("segmented");
    expect(themeControl.nextElementSibling).toHaveClass("locale-button");

    systemIsDark = false;
    listeners.forEach((listener) => listener({ matches: false } as MediaQueryListEvent));
    await waitFor(() => expect(document.documentElement).toHaveAttribute("data-theme", "light"));
    expect(screen.getByRole("button", { name: "Light mode (current)" })).toHaveTextContent("WP");

    systemIsDark = true;
    listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
    await waitFor(() => expect(document.documentElement).toHaveAttribute("data-theme", "dark"));

    await user.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem("champions-lab-theme-v1")).toBe("light");

    listeners.forEach((listener) => listener({ matches: true } as MediaQueryListEvent));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");

    first.unmount();
    render(<ChampionsApp />);
    expect(await screen.findByRole("button", { name: "Light mode (current)" })).toHaveTextContent("WP");
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
  });
});
