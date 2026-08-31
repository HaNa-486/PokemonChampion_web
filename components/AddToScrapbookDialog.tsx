"use client";

import { useState } from "react";
import { useScrapbookStore } from "../lib/scrapbook-store";
import type { Pokemon } from "../lib/types";
import { useDialogEscape } from "../lib/use-dialog-escape";
import { TypeBadge } from "./TypeBadge";

type Locale = "en" | "zh-Hant";

export function AddToScrapbookDialog({ pokemon, locale, onClose }: { pokemon: Pokemon | null; locale: Locale; onClose: () => void }) {
  const books = useScrapbookStore((state) => state.books);
  const createBook = useScrapbookStore((state) => state.createBook);
  const createTag = useScrapbookStore((state) => state.createTag);
  const addPokemon = useScrapbookStore((state) => state.addPokemon);
  const [bookMode, setBookMode] = useState<"existing" | "new">(books.length ? "existing" : "new");
  const [bookId, setBookId] = useState(books[0]?.id ?? "");
  const [bookName, setBookName] = useState("");
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [newTags, setNewTags] = useState<string[]>([]);
  const [tagName, setTagName] = useState("");
  const [error, setError] = useState("");
  useDialogEscape(onClose);
  if (!pokemon) return null;
  const effectiveBookId = books.some((book) => book.id === bookId) ? bookId : books[0]?.id ?? "";
  const selectedBook = books.find((book) => book.id === effectiveBookId) ?? null;
  const copy = locale === "zh-Hant"
    ? { title: "加入畫本", existing: "既有畫本", create: "新建畫本", book: "選擇畫本", bookName: "畫本名稱", tags: "標籤（可複選）", newTag: "新增標籤", addTag: "加入標籤", save: "加入畫本", close: "關閉", unnamed: "請輸入畫本名稱。" }
    : { title: "Add to scrapbook", existing: "Existing scrapbook", create: "New scrapbook", book: "Choose scrapbook", bookName: "Scrapbook name", tags: "Tags (select any)", newTag: "New tag", addTag: "Add tag", save: "Add to scrapbook", close: "Close", unnamed: "Enter a scrapbook name." };
  const appendTag = () => {
    const value = tagName.trim().slice(0, 60);
    if (!value || newTags.some((tag) => tag.toLocaleLowerCase() === value.toLocaleLowerCase())) return;
    setNewTags((current) => [...current, value]);
    setTagName("");
  };
  const submit = () => {
    let targetBookId = effectiveBookId;
    if (bookMode === "new") {
      if (!bookName.trim()) { setError(copy.unnamed); return; }
      targetBookId = createBook(bookName);
    }
    if (!targetBookId) { setError(copy.unnamed); return; }
    const createdTagIds = newTags.flatMap((name) => {
      const id = createTag(targetBookId, name);
      return id ? [id] : [];
    });
    addPokemon(targetBookId, pokemon.id, [...tagIds, ...createdTagIds]);
    onClose();
  };
  return <div className="scrapbook-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="scrapbook-add-dialog" role="dialog" aria-modal="true" aria-labelledby="scrapbook-add-title">
      <button className="close-button" onClick={onClose} aria-label={copy.close}>×</button>
      <header className="scrapbook-add-identity"><img src={pokemon.imageUrl} alt="" width="74" height="74" /><div><p className="eyebrow">SCRAPBOOK</p><h2 id="scrapbook-add-title">{copy.title} · {locale === "zh-Hant" ? pokemon.nameZh : pokemon.name}</h2><div className="badge-row compact">{pokemon.types.map((type) => <TypeBadge key={type} type={type} locale={locale} />)}</div></div></header>
      <div className="segmented scrapbook-mode" role="group" aria-label={copy.title}><button className={bookMode === "existing" ? "active" : ""} disabled={!books.length} onClick={() => { setBookMode("existing"); setTagIds([]); setNewTags([]); }}>{copy.existing}</button><button className={bookMode === "new" ? "active" : ""} onClick={() => { setBookMode("new"); setTagIds([]); setNewTags([]); }}>{copy.create}</button></div>
      {bookMode === "existing" ? <label>{copy.book}<select value={effectiveBookId} onChange={(event) => { setBookId(event.target.value); setTagIds([]); setNewTags([]); }}>{books.map((book) => <option key={book.id} value={book.id}>{book.name}</option>)}</select></label> : <label>{copy.bookName}<input autoFocus value={bookName} maxLength={60} onChange={(event) => setBookName(event.target.value)} /></label>}
      {bookMode === "existing" && selectedBook?.tags.length ? <fieldset className="scrapbook-tag-picker"><legend>{copy.tags}</legend>{selectedBook.tags.map((tag) => <label key={tag.id}><input type="checkbox" checked={tagIds.includes(tag.id)} onChange={() => setTagIds((current) => current.includes(tag.id) ? current.filter((id) => id !== tag.id) : [...current, tag.id])} /><span>{tag.name}</span></label>)}</fieldset> : null}
      <div className="scrapbook-new-tag"><label>{copy.newTag}<input value={tagName} maxLength={60} onChange={(event) => setTagName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); appendTag(); } }} /></label><button className="secondary-button" type="button" onClick={appendTag}>{copy.addTag}</button></div>
      {newTags.length > 0 && <div className="scrapbook-pending-tags">{newTags.map((tag) => <button key={tag} className="selected-filter" onClick={() => setNewTags((current) => current.filter((entry) => entry !== tag))}>{tag} ×</button>)}</div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button scrapbook-submit" onClick={submit}>{copy.save}</button>
    </section>
  </div>;
}
