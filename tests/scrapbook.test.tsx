import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddToScrapbookDialog } from "../components/AddToScrapbookDialog";
import { ScrapbookView } from "../components/ScrapbookView";
import { compareScrapbookLearnableMoves } from "../components/PokemonDetailDialog";
import { moveById, pokemon } from "../lib/catalog";
import { migrateSavedScrapbooks, UNTAGGED_GROUP_ID, useScrapbookStore } from "../lib/scrapbook-store";

const firstPokemon = pokemon[0];

beforeEach(() => {
  useScrapbookStore.setState({ books: [], hydrated: true });
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
    expect(saved[0]).toMatchObject({ name: "Drafts", tags: [{ id: "tag-1", name: "Core" }], entries: [{ pokemonId: firstPokemon.id, tagIds: ["tag-1"] }] });
    expect(saved[0].groupOrder).toEqual(["tag-1", UNTAGGED_GROUP_ID]);
    expect(saved[0].pokemonOrderByGroup["tag-1"]).toEqual([firstPokemon.id]);
  });

  it("creates a book, reuses a same-name tag, and merges tags on duplicate adds", () => {
    const state = useScrapbookStore.getState();
    const bookId = state.createBook("Candidates");
    const offenseId = useScrapbookStore.getState().createTag(bookId, "Offense")!;
    expect(useScrapbookStore.getState().createTag(bookId, "offense")).toBe(offenseId);
    useScrapbookStore.getState().addPokemon(bookId, firstPokemon.id, []);
    useScrapbookStore.getState().addPokemon(bookId, firstPokemon.id, [offenseId]);
    const book = useScrapbookStore.getState().books[0];
    expect(book.entries).toEqual([{ pokemonId: firstPokemon.id, tagIds: [offenseId] }]);
    expect(book.pokemonOrderByGroup[offenseId]).toEqual([firstPokemon.id]);
    expect(book.pokemonOrderByGroup[UNTAGGED_GROUP_ID]).toEqual([]);
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
    expect(book.entries[0]).toEqual({ pokemonId: firstPokemon.id, tagIds: [book.tags[0].id] });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("keeps quick-find empty until a condition is supplied and expands saved groups", async () => {
    const user = userEvent.setup();
    const state = useScrapbookStore.getState();
    const bookId = state.createBook("Compare");
    useScrapbookStore.getState().addPokemon(bookId, firstPokemon.id, []);
    render(<ScrapbookView locale="en" format="doubles" onBuild={vi.fn()} onAddToScrapbook={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: /Quick-find Pokémon to add/ }));
    expect(screen.getByText("Add at least one condition before candidate Pokémon appear.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: new RegExp(firstPokemon.name) })).not.toBeInTheDocument();
    await user.type(screen.getByPlaceholderText("Search Pokémon name…"), firstPokemon.name);
    expect(screen.getAllByRole("button", { name: new RegExp(firstPokemon.name) }).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Expand all tags" }));
    const group = document.querySelector(".scrapbook-group-toggle")!.closest("section")!;
    expect(within(group).getByRole("button", { expanded: false })).toHaveClass("scrapbook-pokemon-main");
  });
});
