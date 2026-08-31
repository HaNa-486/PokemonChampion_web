import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { useScrapbookStore } from "../lib/scrapbook-store";

afterEach(() => {
  cleanup();
  useScrapbookStore.setState({ books: [], hydrated: true });
});
