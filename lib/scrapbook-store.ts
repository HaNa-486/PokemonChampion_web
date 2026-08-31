"use client";

import { get, set as setValue } from "idb-keyval";
import { create } from "zustand";
import { pokemonById } from "./catalog";

const STORAGE_KEY = "champions-lab-scrapbooks-v1";
export const UNTAGGED_GROUP_ID = "__untagged__";

export type ScrapbookTag = { id: string; name: string };
export type ScrapbookEntry = { pokemonId: string; tagIds: string[] };
export type Scrapbook = {
  id: string;
  name: string;
  tags: ScrapbookTag[];
  entries: ScrapbookEntry[];
  groupOrder: string[];
  pokemonOrderByGroup: Record<string, string[]>;
};

type SavedScrapbooks = { version: 1; books: Scrapbook[] };

type ScrapbookState = {
  books: Scrapbook[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  createBook: (name: string) => string;
  renameBook: (bookId: string, name: string) => void;
  deleteBook: (bookId: string) => void;
  createTag: (bookId: string, name: string) => string | null;
  addPokemon: (bookId: string, pokemonId: string, tagIds: string[]) => void;
  removePokemon: (bookId: string, pokemonId: string) => void;
  moveGroup: (bookId: string, groupId: string, direction: -1 | 1) => void;
  movePokemon: (bookId: string, groupId: string, pokemonId: string, direction: -1 | 1) => void;
};

const createId = () => globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const normalizedName = (name: unknown) => typeof name === "string" ? name.trim().slice(0, 60) : "";
const unique = (values: string[]) => [...new Set(values)];

function sanitizeBook(value: unknown): Scrapbook | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<Scrapbook>;
  const name = normalizedName(candidate.name);
  if (typeof candidate.id !== "string" || !candidate.id || !name) return null;
  const tags = Array.isArray(candidate.tags) ? candidate.tags.flatMap((tag) => {
    if (!tag || typeof tag !== "object") return [];
    const typed = tag as Partial<ScrapbookTag>;
    const tagName = normalizedName(typed.name);
    return typeof typed.id === "string" && typed.id && tagName ? [{ id: typed.id, name: tagName }] : [];
  }).filter((tag, index, all) => all.findIndex((other) => other.id === tag.id) === index) : [];
  const tagIds = new Set(tags.map((tag) => tag.id));
  const entries = Array.isArray(candidate.entries) ? candidate.entries.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const typed = entry as Partial<ScrapbookEntry>;
    if (typeof typed.pokemonId !== "string" || !pokemonById.has(typed.pokemonId)) return [];
    const entryTags = Array.isArray(typed.tagIds) ? unique(typed.tagIds.filter((id): id is string => typeof id === "string" && tagIds.has(id))) : [];
    return [{ pokemonId: typed.pokemonId, tagIds: entryTags }];
  }).filter((entry, index, all) => all.findIndex((other) => other.pokemonId === entry.pokemonId) === index) : [];
  const validGroups = [UNTAGGED_GROUP_ID, ...tags.map((tag) => tag.id)];
  const requestedGroupOrder = Array.isArray(candidate.groupOrder) ? candidate.groupOrder.filter((id): id is string => typeof id === "string" && validGroups.includes(id)) : [];
  const groupOrder = unique([...requestedGroupOrder, ...validGroups]);
  const pokemonOrderByGroup = Object.fromEntries(validGroups.map((groupId) => {
    const members = entries.filter((entry) => groupId === UNTAGGED_GROUP_ID ? entry.tagIds.length === 0 : entry.tagIds.includes(groupId)).map((entry) => entry.pokemonId);
    const requested = candidate.pokemonOrderByGroup && Array.isArray(candidate.pokemonOrderByGroup[groupId]) ? candidate.pokemonOrderByGroup[groupId].filter((id) => members.includes(id)) : [];
    return [groupId, unique([...requested, ...members])];
  }));
  return { id: candidate.id, name, tags, entries, groupOrder, pokemonOrderByGroup };
}

export function migrateSavedScrapbooks(saved: unknown): Scrapbook[] {
  if (!saved || typeof saved !== "object") return [];
  const value = saved as Partial<SavedScrapbooks>;
  if (value.version !== 1 || !Array.isArray(value.books)) return [];
  return value.books.map(sanitizeBook).filter((book): book is Scrapbook => Boolean(book));
}

const persist = (books: Scrapbook[]) => {
  if (typeof indexedDB !== "undefined") void setValue(STORAGE_KEY, { version: 1, books } satisfies SavedScrapbooks);
};

const move = <T,>(values: T[], index: number, direction: -1 | 1) => {
  const target = index + direction;
  if (index < 0 || target < 0 || target >= values.length) return values;
  const next = [...values];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

export const useScrapbookStore = create<ScrapbookState>((set, getState) => {
  const updateBooks = (updater: (books: Scrapbook[]) => Scrapbook[]) => {
    const books = updater(getState().books);
    set({ books });
    persist(books);
  };
  return {
    books: [],
    hydrated: false,
    hydrate: async () => {
      if (getState().hydrated) return;
      try {
        const saved = await get<unknown>(STORAGE_KEY);
        set({ books: migrateSavedScrapbooks(saved), hydrated: true });
      } catch {
        set({ books: [], hydrated: true });
      }
    },
    createBook: (name) => {
      const id = createId();
      const book: Scrapbook = { id, name: normalizedName(name) || "Untitled", tags: [], entries: [], groupOrder: [UNTAGGED_GROUP_ID], pokemonOrderByGroup: { [UNTAGGED_GROUP_ID]: [] } };
      updateBooks((books) => [...books, book]);
      return id;
    },
    renameBook: (bookId, name) => {
      const nextName = normalizedName(name);
      if (!nextName) return;
      updateBooks((books) => books.map((book) => book.id === bookId ? { ...book, name: nextName } : book));
    },
    deleteBook: (bookId) => updateBooks((books) => books.filter((book) => book.id !== bookId)),
    createTag: (bookId, name) => {
      const nextName = normalizedName(name);
      const book = getState().books.find((entry) => entry.id === bookId);
      if (!book || !nextName) return null;
      const existing = book.tags.find((tag) => tag.name.toLocaleLowerCase() === nextName.toLocaleLowerCase());
      if (existing) return existing.id;
      const id = createId();
      updateBooks((books) => books.map((entry) => entry.id === bookId ? {
        ...entry,
        tags: [...entry.tags, { id, name: nextName }],
        groupOrder: [...entry.groupOrder, id],
        pokemonOrderByGroup: { ...entry.pokemonOrderByGroup, [id]: [] },
      } : entry));
      return id;
    },
    addPokemon: (bookId, pokemonId, requestedTagIds) => updateBooks((books) => books.map((book) => {
      if (book.id !== bookId || !pokemonById.has(pokemonId)) return book;
      const validTagIds = new Set(book.tags.map((tag) => tag.id));
      const tagIds = unique(requestedTagIds.filter((id) => validTagIds.has(id)));
      const current = book.entries.find((entry) => entry.pokemonId === pokemonId);
      const entries = current
        ? book.entries.map((entry) => entry.pokemonId === pokemonId ? { ...entry, tagIds: unique([...entry.tagIds, ...tagIds]) } : entry)
        : [...book.entries, { pokemonId, tagIds }];
      const effectiveTags = current ? unique([...current.tagIds, ...tagIds]) : tagIds;
      const groupIds = effectiveTags.length ? effectiveTags : [UNTAGGED_GROUP_ID];
      const pokemonOrderByGroup = { ...book.pokemonOrderByGroup };
      for (const groupId of groupIds) pokemonOrderByGroup[groupId] = unique([...(pokemonOrderByGroup[groupId] ?? []), pokemonId]);
      if (effectiveTags.length) pokemonOrderByGroup[UNTAGGED_GROUP_ID] = (pokemonOrderByGroup[UNTAGGED_GROUP_ID] ?? []).filter((id) => id !== pokemonId);
      return { ...book, entries, pokemonOrderByGroup };
    })),
    removePokemon: (bookId, pokemonId) => updateBooks((books) => books.map((book) => book.id === bookId ? {
      ...book,
      entries: book.entries.filter((entry) => entry.pokemonId !== pokemonId),
      pokemonOrderByGroup: Object.fromEntries(Object.entries(book.pokemonOrderByGroup).map(([groupId, ids]) => [groupId, ids.filter((id) => id !== pokemonId)])),
    } : book)),
    moveGroup: (bookId, groupId, direction) => updateBooks((books) => books.map((book) => book.id === bookId ? { ...book, groupOrder: move(book.groupOrder, book.groupOrder.indexOf(groupId), direction) } : book)),
    movePokemon: (bookId, groupId, pokemonId, direction) => updateBooks((books) => books.map((book) => book.id === bookId ? {
      ...book,
      pokemonOrderByGroup: { ...book.pokemonOrderByGroup, [groupId]: move(book.pokemonOrderByGroup[groupId] ?? [], (book.pokemonOrderByGroup[groupId] ?? []).indexOf(pokemonId), direction) },
    } : book)),
  };
});
