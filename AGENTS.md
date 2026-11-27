# AGENTS.md

Guidance for coding agents working in this repo. The product plan lives in [`PRD.md`](./PRD.md); the roadmap is issue #6.

## What this is

A Tauri v2 desktop app that listens for Forza "Data Out" UDP telemetry, shows a live HUD, and saves per-session summaries ("scrobbles") to disk. Rust does ingestion and session logic; React renders.

## Commands

Run from the repo root. Package manager is **pnpm** (workspace: `desktop`, `packages/*`). Don't use npm or yarn.

| Command | What it does |
| --- | --- |
| `pnpm install` | Install all workspace deps |
| `pnpm dev` | Vite dev server for the frontend only (port 1420, no Tauri, no telemetry) |
| `pnpm build` | `tsc && vite build` for the frontend |
| `pnpm desktop:dev` | Run the full Tauri app (starts Vite, compiles Rust) |
| `pnpm desktop:build` | Package the desktop app |
| `pnpm sim` | Send fake 60 Hz, 324-byte packets to `127.0.0.1:5300` so you can test without a game |
| `cargo check --manifest-path desktop/Cargo.toml` | Type-check the Rust side |

`pnpm check` (frontend `tsc` + `cargo check`) and `pnpm sim` land with PR #7 (until then, run `node sim_telemetry.js` directly). Once #7 is on main, run `pnpm check` before calling a change done.

There are no automated tests yet.

## Layout

```
desktop/                  Tauri v2 app (Rust crate forza_telemetry_app_lib)
  src/lib.rs              App setup, UDP listener thread on 0.0.0.0:5300, session
                          start/end rules, idle-timeout thread, Tauri commands
  src/telemetry.rs        TelemetryPayload struct + byte-offset parser
  src/session.rs          ActiveSession aggregator, SessionSummary, JSON save/load
  tauri.conf.json         Window, dev URL, build hooks
packages/frontend/        React 19 + TypeScript + Vite
  src/App.tsx             Main UI (being split into components/hooks/formatters in #7)
  src/types/telemetry.ts  TS mirrors of the Rust payload and summary types
  src/utils/carDatabase.ts  CarOrdinal -> car name lookup (small sample, see #3)
sim_telemetry.js          UDP packet simulator
PRD.md                    Product plan
```

## Rust ↔ frontend contract

- Events emitted from Rust: `telemetry-data` (`TelemetryPayload`, every packet), `session-started`, `session-ended` (`SessionSummary`).
- Commands: `get_historical_sessions`, `get_active_session`, `delete_all_sessions`.
- Rust structs use `#[serde(rename_all = "camelCase")]`. When you add or rename a field in `telemetry.rs` or `session.rs`, update `packages/frontend/src/types/telemetry.ts` in the same change.
- Sessions are saved as JSON under the app's local data dir in `sessions/`.

## Packet format notes

- All values are little-endian. Offsets in `TelemetryPayload::parse` follow the **Forza Horizon 324-byte** layout (FH4/FH5).
- Bytes 0–231 are the shared "Sled" block. Horizon then has 12 game-specific bytes (232–243; we read `car_category` at 232) before the "Dash" block starting at 244 (`position_x`), so `speed` is at 256.
- Forza Motorsport packets don't have that 12-byte gap: FM7's Dash format is 311 bytes and FM 2023 is 331 (adds tire wear and track ordinal). The listener currently accepts any packet ≥ 311 bytes but always parses with Horizon offsets, so Motorsport packets would be misread. Detect by packet length before choosing offsets (issue #5).
- `PRD.md` section 4 lists older offsets and paths (`src-tauri/`, `speed` at 244). Trust `telemetry.rs` over the PRD for current offsets.
- Inputs are `u8` 0–255 (`accel`, `brake`, ...), `steer` is `i8`, `gear` 0 = R, 1 = N, 2+ = gears. `speed` is m/s.
- Cars are identified only by `car_ordinal`; names come from `carDatabase.ts`.
- If you change offsets, keep `sim_telemetry.js` writing the same layout.

## Conventions

- Keep per-packet work cheap. Packets arrive at 30–60 Hz; aggregate in memory and persist only session summaries, never raw packets (PRD §5).
- Session boundaries live in `lib.rs`: a session ends when `is_race_on` goes false, the car changes, race time jumps back more than 2 s, or no packet arrives for 8 s.
- Vite ignores `desktop/**`; Rust changes trigger a Tauri rebuild, not HMR.
- Track work against the GitHub issues (#1–#6) and reference them in PRs.
