"use client";

import { get, set as setValue } from "idb-keyval";
import { create } from "zustand";
import { pokemonById } from "./catalog";
import { sanitizeTeamMembers } from "./domain";
import type { BattleFormat, TeamMember } from "./types";

const STORAGE_KEY = "champions-lab-team-v1";

type TeamState = {
  teams: Record<BattleFormat, TeamMember[]>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (format: BattleFormat, member: TeamMember) => void;
  update: (format: BattleFormat, member: TeamMember) => void;
  remove: (format: BattleFormat, memberId: string) => void;
  clear: (format: BattleFormat) => void;
};

const emptyTeams = (): Record<BattleFormat, TeamMember[]> => ({ singles: [], doubles: [] });

export function migrateSavedTeams(saved: unknown): Record<BattleFormat, TeamMember[]> {
  if (!saved || typeof saved !== "object") return emptyTeams();
  const value = saved as { version?: number; members?: TeamMember[]; teams?: Partial<Record<BattleFormat, TeamMember[]>> };
  if (value.version === 2 && value.teams) return {
    singles: Array.isArray(value.teams.singles) ? sanitizeTeamMembers(value.teams.singles, pokemonById) : [],
    doubles: Array.isArray(value.teams.doubles) ? sanitizeTeamMembers(value.teams.doubles, pokemonById) : [],
  };
  if (value.version === 1 && Array.isArray(value.members)) return { singles: [], doubles: sanitizeTeamMembers(value.members, pokemonById) };
  return emptyTeams();
}

const persist = (teams: Record<BattleFormat, TeamMember[]>) => {
  if (typeof indexedDB !== "undefined") void setValue(STORAGE_KEY, { version: 2, teams });
};

export const useTeamStore = create<TeamState>((set, getState) => ({
  teams: emptyTeams(),
  hydrated: false,
  hydrate: async () => {
    if (getState().hydrated) return;
    try {
      const saved = await get<unknown>(STORAGE_KEY);
      set({ teams: migrateSavedTeams(saved), hydrated: true });
    } catch {
      set({ teams: emptyTeams(), hydrated: true });
    }
  },
  add: (format, member) => {
    const teams = getState().teams;
    const next = { ...teams, [format]: sanitizeTeamMembers([...teams[format], member], pokemonById) };
    set({ teams: next });
    persist(next);
  },
  update: (format, member) => {
    const teams = getState().teams;
    const nextMembers = teams[format].map((current) => current.id === member.id ? member : current);
    const next = { ...teams, [format]: sanitizeTeamMembers(nextMembers, pokemonById) };
    set({ teams: next });
    persist(next);
  },
  remove: (format, memberId) => {
    const teams = getState().teams;
    const next = { ...teams, [format]: teams[format].filter((member) => member.id !== memberId) };
    set({ teams: next });
    persist(next);
  },
  clear: (format) => {
    const next = { ...getState().teams, [format]: [] };
    set({ teams: next });
    persist(next);
  },
}));
