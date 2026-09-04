import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { get, set } from "idb-keyval";
import { ScrapbookView } from "../components/ScrapbookView";
import { pokemon } from "../lib/catalog";
import { useScrapbookStore } from "../lib/scrapbook-store";

vi.hoisted(() => { vi.resetModules(); });
vi.mock("idb-keyval", () => ({ get: vi.fn(), set: vi.fn() }));

beforeEach(() => {
  vi.mocked(get).mockReset();
  vi.mocked(set).mockReset().mockResolvedValue(undefined);
  useScrapbookStore.setState({ books: [], activeBookId: "", lastAddBookId: "", uiByBook: {}, hydrated: true, hydrationError: false });
});

function savedFixture() {
  const bookId = useScrapbookStore.getState().createBook("Saved book");
  const tagId = useScrapbookStore.getState().createTag(bookId, "Saved tag")!;
  const entryId = useScrapbookStore.getState().addPokemon(bookId, pokemon[0].id, [tagId])!;
  const { books, activeBookId, lastAddBookId, uiByBook } = useScrapbookStore.getState();
  const saved = structuredClone({ version: 2, books, activeBookId, lastAddBookId, uiByBook });
  useScrapbookStore.setState({ hydrated: false, hydrationError: false });
  vi.mocked(set).mockClear();
  return { saved, bookId, tagId, entryId };
}

it("shares a pending read and blocks writes until saved data is loaded", async () => {
  const { saved, bookId, tagId, entryId } = savedFixture();
  let resolve!: (value: unknown) => void;
  vi.mocked(get).mockReturnValue(new Promise((done) => { resolve = done; }));
  const first = useScrapbookStore.getState().hydrate();
  const second = useScrapbookStore.getState().hydrate();
  expect(first).toBe(second);
  await Promise.resolve();
  expect(get).toHaveBeenCalledTimes(1);
  const store = useScrapbookStore.getState();
  expect(store.createBook("Too early")).toBe("");
  expect(store.createTag(bookId, "Too early")).toBeNull();
  expect(store.addPokemon(bookId, pokemon[0].id, [])).toBeNull();
  expect(store.duplicateBook(bookId, "Too early")).toBeNull();
  expect(store.duplicateEntry(bookId, entryId, tagId)).toBeNull();
  store.deleteBook(bookId);
  store.renameTag(bookId, tagId, "Too early");
  store.removeEntry(bookId, entryId);
  store.updateBookUi(bookId, { filtersOpen: true });
  expect(useScrapbookStore.getState().books).toEqual(saved.books);
  expect(set).not.toHaveBeenCalled();
  resolve(saved);
  await Promise.all([first, second]);
  expect(useScrapbookStore.getState()).toMatchObject({ hydrated: true, hydrationError: false, books: saved.books });
  const callsAfterLoad = vi.mocked(set).mock.calls.length;
  expect(useScrapbookStore.getState().createBook("After load")).not.toBe("");
  expect(set).toHaveBeenCalledTimes(callsAfterLoad + 1);
});

it("keeps failed hydration locked and retries without overwriting saved data", async () => {
  const { saved } = savedFixture();
  vi.mocked(get).mockRejectedValueOnce(new Error("read unavailable")).mockResolvedValueOnce(saved);
  await act(async () => { await useScrapbookStore.getState().hydrate(); });
  expect(useScrapbookStore.getState()).toMatchObject({ hydrated: false, hydrationError: true });
  expect(set).not.toHaveBeenCalled();
  expect(useScrapbookStore.getState().createBook("Must not overwrite")).toBe("");
  expect(set).not.toHaveBeenCalled();
  render(<ScrapbookView locale="en" format="doubles" onEditEntry={vi.fn()} onAddToScrapbook={vi.fn()} />);
  expect(screen.queryByRole("button", { name: "Create scrapbook" })).not.toBeInTheDocument();
  await userEvent.setup().click(screen.getByRole("button", { name: /retry/i }));
  expect(await screen.findByRole("button", { name: "Create scrapbook" })).toBeInTheDocument();
  expect(useScrapbookStore.getState()).toMatchObject({ hydrated: true, hydrationError: false, books: saved.books });
  expect(get).toHaveBeenCalledTimes(2);
});
