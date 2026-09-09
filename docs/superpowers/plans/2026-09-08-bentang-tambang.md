# Bentang Tambang Implementation Plan

> Execute inline using executing-plans. User has approved implementation.

**Goal:** Deliver a responsive 3D environmental regulation learning application with genuine regulation backups.
**Architecture:** Next.js serves the UI and a validated Pasal.id proxy. Server-side JSON snapshots persist successful responses and bundled snapshots bootstrap outage recovery. React Three Fiber renders a procedural landscape; HTML exposes all learning and reading interactions.
**Tech Stack:** Next.js, TypeScript, React, Three.js, React Three Fiber, Drei, Node test runner.
**Spec:** docs/superpowers/specs/2026-09-08-bentang-tambang-design.md

## Global constraints

Indonesian interface; token server-only; no fabricated regulations; backup timestamp always visible; responsive and keyboard-accessible; no deployment. Workspace is an empty project with a managed read-only .git directory, so no branch or commit operations are applicable.

## Tasks

- [x] Data integration: implemented `lib/pasal.ts`, `lib/types.ts`, `app/api/regulations/route.ts`, `scripts/snapshot.ts`, and `tests/pasal.test.ts`. Validated persistent fallback, query isolation, corrupt responses, regional FRBR identifiers, and empty-detail overwrite protection.
- [x] Experience: implemented `components/Explorer.tsx`, `components/Landscape.tsx`, `components/Regulations.tsx`, `lib/topics.ts`, and app layout/styles. Stage/location selection, search, detail reader, responsive layout, reduced motion, and WebGL fallback are available.
- [x] Verification and delivery: 9 unit/integration tests, 3 Chrome browser tests, and production build passed. Desktop/mobile/reader screenshots inspected. No token string found in client assets. Setup and backup refresh documented in README.

## Verified backup coverage

Five search snapshots and 38 unique regulation detail responses were saved from Pasal.id. 32 contain article content (5,359 structural nodes); six contain metadata only because the source has no text. UI explicitly identifies missing source text. Entire bundled coverage was tested with an intentionally failing upstream client. Live search and detail were also exercised through the browser.

Workspace is not an initialized Git repository; files remain in the user workspace. No commit, push, or deployment performed. Development server runs on http://localhost:3000.
