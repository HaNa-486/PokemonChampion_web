import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddToScrapbookDialog } from "../components/AddToScrapbookDialog";
import { ChampionsApp } from "../components/ChampionsApp";
import { ScrapbookView } from "../components/ScrapbookView";
import { compareScrapbookLearnableMoves } from "../components/PokemonDetailDialog";
import { moveById, pokemon } from "../lib/catalog";
import { migrateSavedScrapbooks, UNTAGGED_GROUP_ID, useScrapbookStore } from "../lib/scrapbook-store";
import { useTeamStore } from "../lib/team-store";

const firstPokemon = pokemon[0];

beforeEach(() => {
  useScrapbookStore.setState({ books: [], activeBookId: "", lastAddBookId: "", uiByBook: {}, hydrated: true });
  useTeamStore.setState({ teams: { singles: [], doubles: [] }, hydrated: true });
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline fixture")));
});

describe("scrapbook persistence model", () => {
  it("orders matching Pokémon types first, then category within each type", () => {
    const learnset = firstPokemon.moveIds.map((id) => moveById.get(id)!).sort((left, right) => compareScrapbookLearnableMoves(firstPokemon.types, left, right));
    const firstNonPreferred = learnset.findIndex((move) => !firstPokemon.types.includes(move.type));
    expect(firstNonPreferred).toBeGreaterThan(0);
    expect(learnset.slice(0, firstNonPreferred).every((move) => firstPokemon.types.includes(move.type))).toBe(true);
    expect(learnset.slice(firstNonPreferred).every((move) => !firstPokemon.types.includes(move.type))).toBe(true);
    for (const type of new Set(learnset.map((move) => move.type))) {
      const categoryRanks = learnset.filter((move) => move.type === type).map((move) => ({ Physical: 0, Special: 1, Status: 2 })[move.category]);
      expect(categoryRanks).toEqual([...categoryRanks].sort((left, right) => left - right));
    }
  });

  it("sanitizes tags, unknown Pokémon, and saved group ordering", () => {
    const saved = migrateSavedScrapbooks({
      version: 1,
      books: [{
        id: "book-1",
        name: "  Drafts  ",
        tags: [{ id: "tag-1", name: " Core " }, { id: "tag-1", name: "Duplicate" }],
        entries: [{ pokemonId: firstPokemon.id, tagIds: ["tag-1", "missing"] }, { pokemonId: "not-real", tagIds: [] }],
        groupOrder: ["missing", "tag-1"],
        pokemonOrderByGroup: { "tag-1": [firstPokemon.id, "not-real"] },
      }],
    });
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({ name: "Drafts", tags: [{ id: "tag-1", name: "Core" }], entries: [{ pokemonId: firstPokemon.id, tagIds: ["tag-1"], moveIds: [], abilityId: null, itemId: null, ordinal: 1 }] });
    expect(saved[0].groupOrder).toEqual(["tag-1", UNTAGGED_GROUP_ID]);
    expect(saved[0].pokemonOrderByGroup["tag-1"]).toEqual([saved[0].entries[0].id]);
  });

  it("creates independent neutral build cards and supports shared and copied tag membership", () => {
    const state = useScrapbookStore.getState();
    const bookId = state.createBook("Candidates");
    const offenseId = useScrapbookStore.getState().createTag(bookId, "Offense")!;
    expect(useScrapbookStore.getState().createTag(bookId, "offense")).toBe(offenseId);
    const firstId = useScrapbookStore.getState().addPokemon(bookId, firstPokemon.id, [])!;
    const secondId = useScrapbookStore.getState().addPokemon(bookId, firstPokemon.id, [offenseId])!;
    const book = useScrapbookStore.getState().books[0];
    expect(book.entries).toHaveLength(2);
    expect(book.entries.map((entry) => entry.ordinal)).toEqual([1, 2]);
    expect(book.entries[0]).toMatchObject({ id: firstId, moveIds: [], abilityId: null, itemId: null, ap: { hp: 0 }, nature: { name: "Serious" } });
    expect(secondId).not.toBe(firstId);
    useScrapbookStore.getState().addEntryToTag(bookId, firstId, offenseId);
    expect(useScrapbookStore.getState().books[0].entries.find((entry) => entry.id === firstId)?.tagIds).toEqual([offenseId]);
    const copyId = useScrapbookStore.getState().duplicateEntry(bookId, firstId, offenseId)!;
    expect(copyId).not.toBe(firstId);
    expect(useScrapbookStore.getState().books[0].entries).toHaveLength(3);
  });

  it("moves builds across tags, duplicates a complete book, and retains remembered UI", () => {
    const state = useScrapbookStore.getState();
    const bookId = state.createBook("Plans");
    const special = useScrapbookStore.getState().createTag(bookId, "Special")!;
    const physical = useScrapbookStore.getState().createTag(bookId, "Physical")!;
    const entryId = useScrapbookStore.getState().addPokemon(bookId, firstPokemon.id, [special])!;
    useScrapbookStore.getState().moveEntryToTag(bookId, entryId, special, physical);
    useScrapbookStore.getState().updateBookUi(bookId, { filtersOpen: true, expandedGroupIds: [physical], openEntryIds: [entryId], finder: { ...useScrapbookStore.getState().uiByBook[bookId].finder, query: firstPokemon.name } });
    const copiedId = useScrapbookStore.getState().duplicateBook(bookId, "Plans copy")!;
    const original = useScrapbookStore.getState().books.find((book) => book.id === bookId)!;
    const copied = useScrapbookStore.getState().books.find((book) => book.id === copiedId)!;
    expect(original.entries[0].tagIds).toEqual([physical]);
    expect(copied.entries[0].pokemonId).toBe(firstPokemon.id);
    expect(copied.entries[0].id).not.toBe(entryId);
    expect(useScrapbookStore.getState().uiByBook[copiedId]).toMatchObject({ filtersOpen: true, finder: { query: firstPokemon.name } });
  });

  it("keeps builds when deleting a tag and falls back to Untagged", () => {
    const bookId = useScrapbookStore.getState().createBook("Tag cleanup");
    const tagId = useScrapbookStore.getState().createTag(bookId, "Temporary")!;
    const entryId = useScrapbookStore.getState().addPokemon(bookId, firstPokemon.id, [tagId])!;
    useScrapbookStore.getState().deleteTag(bookId, tagId);
    const book = useScrapbookStore.getState().books.find((candidate) => candidate.id === bookId)!;
    expect(book.tags).toHaveLength(0);
    expect(book.entries).toHaveLength(1);
    expect(book.entries[0].tagIds).toEqual([]);
    expect(book.pokemonOrderByGroup[UNTAGGED_GROUP_ID]).toContain(entryId);
  });
});

describe("scrapbook user journey", () => {
  it("creates a new scrapbook and tag while adding a Pokémon", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<AddToScrapbookDialog pokemon={firstPokemon} locale="en" onClose={onClose} />);
    await user.type(screen.getByLabelText("Scrapbook name"), "Tournament ideas");
    await user.type(screen.getByLabelText("New tag"), "Lead");
    await user.click(screen.getByRole("button", { name: "Add tag" }));
    await user.click(screen.getByRole("button", { name: "Add to scrapbook" }));
    const book = useScrapbookStore.getState().books[0];
    expect(book.name).toBe("Tournament ideas");
    expect(book.tags[0].name).toBe("Lead");
    expect(book.entries[0]).toMatchObject({ pokemonId: firstPokemon.id, tagIds: [book.tags[0].id], moveIds: [], abilityId: null, itemId: null, ordinal: 1 });
    expect(useScrapbookStore.getState().lastAddBookId).toBe(book.id);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("preselects the active scrapbook ahead of the last add target", () => {
    const firstBookId = useScrapbookStore.getState().createBook("First");
    const activeBookId = useScrapbookStore.getState().createBook("Currently viewing");
    useScrapbookStore.getState().markLastAddBook(firstBookId);
    useScrapbookStore.getState().setActiveBook(activeBookId);
    render(<AddToScrapbookDialog pokemon={firstPokemon} locale="en" onClose={vi.fn()} />);
    expect(screen.getByLabelText("Choose scrapbook")).toHaveValue(activeBookId);
  });

  it("keeps quick-find empty until a condition is supplied and expands saved groups", async () => {
    const user = userEvent.setup();
    const state = useScrapbookStore.getState();
    const bookId = state.createBook("Compare");
    useScrapbookStore.getState().addPokemon(bookId, firstPokemon.id, []);
    render(<ScrapbookView locale="en" format="doubles" onEditEntry={vi.fn()} onAddToScrapbook={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Quick-find Pokémon to add/ }));
    expect(screen.getByText("Add at least one condition before candidate Pokémon appear.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: new RegExp(firstPokemon.name) })).not.toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), firstPokemon.name);
    expect(screen.getAllByRole("button", { name: new RegExp(firstPokemon.name) }).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Expand all tags" }));
    const group = document.querySelector(".scrapbook-group-toggle")!.closest("section")!;
    expect(within(group).getByRole("button", { expanded: false })).toHaveClass("scrapbook-pokemon-main");
  });

  it("localizes quick-find type and form choices in Traditional Chinese", async () => {
    const user = userEvent.setup();
    useScrapbookStore.getState().createBook("中文畫本");
    render(<ScrapbookView locale="zh-Hant" format="doubles" onEditEntry={vi.fn()} onAddToScrapbook={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /快速找寶可夢加入/ }));
    expect(screen.getByRole("button", { name: "水" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Water" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "全部" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "一般" })).toHaveLength(2);
  });

  it("auto-saves scrapbook Workbench changes without adding a team member unless explicitly requested", async () => {
    const user = userEvent.setup();
    const bookId = useScrapbookStore.getState().createBook("Editable");
    const entryId = useScrapbookStore.getState().addPokemon(bookId, firstPokemon.id, [])!;
    render(<ChampionsApp />);
    await user.click(screen.getByRole("button", { name: "Scrapbooks" }));
    await user.click(screen.getByRole("button", { name: "Expand all tags" }));
    await user.click(screen.getByRole("button", { name: new RegExp(firstPokemon.name) }));
    await user.click(await screen.findByRole("button", { name: "Edit scrapbook build" }));
    await user.selectOptions(screen.getByLabelText("Nature"), "Adamant");
    await waitFor(() => expect(useScrapbookStore.getState().books.find((book) => book.id === bookId)?.entries.find((entry) => entry.id === entryId)?.nature.name).toBe("Adamant"));
    expect(useScrapbookStore.getState().books[0].entries[0].abilityId).toBeNull();
    await user.click(screen.getByRole("button", { name: "Save scrapbook build" }));
    expect(useTeamStore.getState().teams.doubles).toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Edit scrapbook build" }));
    await user.click(screen.getByRole("button", { name: "Add to selected team" }));
    expect(useTeamStore.getState().teams.doubles).toHaveLength(1);
  });

  it("shows saved AP and nature directions while omitting duplicate base stats from inline detail", async () => {
    const user = userEvent.setup();
    const bookId = useScrapbookStore.getState().createBook("Visible build");
    const entryId = useScrapbookStore.getState().addPokemon(bookId, firstPokemon.id, [])!;
    const saved = useScrapbookStore.getState().books[0].entries[0];
    useScrapbookStore.getState().updateEntry(bookId, entryId, { ...saved, ap: { hp: 2, attack: 32, defense: 0, specialAttack: 0, specialDefense: 0, speed: 32 }, nature: { name: "Adamant", nameZh: "固執", up: "attack", down: "specialAttack" } });
    render(<ScrapbookView locale="en" format="doubles" onEditEntry={vi.fn()} onAddToScrapbook={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Expand all tags" }));
    expect(screen.getAllByText("AP +32")).toHaveLength(2);
    expect(screen.getAllByText("AP +32").every((entry) => entry.classList.contains("ap-invested"))).toBe(true);
    expect(screen.getAllByText("AP +0").every((entry) => entry.classList.contains("ap-zero"))).toBe(true);
    expect(document.querySelector(".scrapbook-final-stats .nature-up")).toHaveTextContent("↑");
    expect(document.querySelector(".scrapbook-final-stats .nature-down")).toHaveTextContent("↓");
    expect(document.querySelector(".scrapbook-final-stats .nature-raised")).toBeInTheDocument();
    expect(document.querySelector(".scrapbook-final-stats .nature-lowered")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: new RegExp(firstPokemon.name) }));
    expect(document.querySelector(".scrapbook-inline-detail .detail-stats")).not.toBeInTheDocument();
  });

  it("uses the sortable move-database columns for inline learnable moves without the properties column", async () => {
    const user = userEvent.setup();
    const bookId = useScrapbookStore.getState().createBook("Move comparison");
    useScrapbookStore.getState().addPokemon(bookId, firstPokemon.id, []);
    render(<ScrapbookView locale="en" format="doubles" onEditEntry={vi.fn()} onAddToScrapbook={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Expand all tags" }));
    await user.click(screen.getByRole("button", { name: new RegExp(firstPokemon.name) }));
    const table = document.querySelector(".scrapbook-inline-detail .learnable-move-table")!;
    expect(within(table as HTMLElement).getByRole("columnheader", { name: /Usable Pokémon/ })).toBeInTheDocument();
    expect(within(table as HTMLElement).queryByRole("columnheader", { name: /Properties/ })).not.toBeInTheDocument();
    await user.click(within(table as HTMLElement).getByRole("button", { name: /^Power/ }));
    expect(within(table as HTMLElement).getByRole("columnheader", { name: /Power/ })).toHaveAttribute("aria-sort", "descending");
    const powers = [...table.querySelectorAll("tbody tr")].map((row) => row.children[3]?.textContent).filter((value) => value && value !== "—").map(Number);
    expect(powers).toEqual([...powers].sort((left, right) => right - left));
  });
});
