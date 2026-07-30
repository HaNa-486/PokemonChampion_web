"use client";

import { get, set as setValue } from "idb-keyval";
import { create } from "zustand";
import type { TeamMember } from "./types";

const STORAGE_KEY = "champions-lab-team-v1";

type TeamState = {
  members: TeamMember[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (member: TeamMember) => void;
  remove: (memberId: string) => void;
  clear: () => void;
};

const persist = (members: TeamMember[]) => {
  if (typeof indexedDB !== "undefined") void setValue(STORAGE_KEY, { version: 1, members });
};

export const useTeamStore = create<TeamState>((set, getState) => ({
  members: [],
  hydrated: false,
  hydrate: async () => {
    if (getState().hydrated) return;
    try {
      const saved = await get<{ version: number; members: TeamMember[] }>(STORAGE_KEY);
      set({ members: saved?.version === 1 && Array.isArray(saved.members) ? saved.members.slice(0, 6) : [], hydrated: true });
    } catch {
      set({ members: [], hydrated: true });
    }
  },
  add: (member) => {
    const next = [...getState().members, member];
    set({ members: next });
    persist(next);
  },
  remove: (memberId) => {
    const next = getState().members.filter((member) => member.id !== memberId);
    set({ members: next });
    persist(next);
  },
  clear: () => {
    set({ members: [] });
    persist([]);
  },
}));
