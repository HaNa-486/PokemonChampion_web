# Product

## Problem and user

The product owner cannot meaningfully UAT UI changes when the only hosted Sites project is production.

## Desired outcome and success signal

Every checked pull-request candidate is accessible at a stable Champions Lab Dev URL without changing the production site or production data. The owner can approve or reject the candidate before merge.

## Scope and non-goals

In scope: a separate Sites project, isolated D1 binding, durable repository instructions, testable promotion gates, and private Dev deployment. Out of scope: public Dev access, automatic production deployment, and copying production data.

## Critical journey

Implement on branch -> verify -> independent review -> PR checks -> deploy exact PR head to Dev -> UAT -> merge -> explicit production promotion.
