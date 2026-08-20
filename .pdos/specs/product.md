# Product

## Problem and user

Competitive and new Pokémon Champions players need to correct an existing team build without recreating it, and need enough context to choose from a large legal move list.

## Desired outcome and success signal

Every team card can reopen its exact saved configuration and save changes in place. Move selection is searchable and explains the important mechanics before a choice is made.

## Scope and non-goals

In scope: team-member update semantics, builder edit mode, searchable rich move options, duplicate prevention, accessibility, responsive behavior, regression tests, and isolated Dev UAT. Out of scope: strategic move recommendations, drag-reordering, and production deployment without explicit approval.

## Critical journey

Open selected team -> edit a member -> search/read/select moves -> adjust fields -> save -> same member and slot update with the team still legal.
