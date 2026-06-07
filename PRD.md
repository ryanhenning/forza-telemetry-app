# Project Context: Forza Scrobbler & Live HUD Dashboard

## 1. Project Overview
The objective is to build a lightweight, high-performance desktop application for Windows/PC that interfaces with the *Forza Horizon* and *Forza Motorsport* franchises. The application acts as an in-race telemetry HUD dashboard and a persistent historical race tracker (modeled after the conceptual architecture of "last.fm" but for racing profiles). 

The app will aggregate lifetime driving statistics, calculate unique driving style metrics, and preserve cross-game racing career data.

---

## 2. Technical Stack
* **Desktop Shell & Backend Wrapper:** Tauri v2 (Rust-based native windowing and system utilities)
* **Package Manager:** `pnpm` (Chosen for strict dependency isolation and global content-addressable storage to prevent ghost dependencies)
* **Frontend UI Framework:** React with TypeScript (SPA hosted inside Vite)
* **Data Ingestion:** High-speed asynchronous UDP socket client implemented natively on the Rust backend layer.
* **Inter-process Communication (IPC):** Tauri’s asynchronous native Event Emitter system (`app_handle.emit`) passing structured JSON payloads to the frontend React context at 30-60Hz.

---

## 3. Core Architecture & Telemetry Specs
Forza titles include a native **Data Out** feature that streams a raw 324-byte binary UDP packet sequence to a specified IP and port (`127.0.0.1:5300`) at the current game frame rate. 

### Data Discrepancies to Account For:
1.  **Horizon Standard (FH4, FH5, FH6):** Rigidly standardized 324-byte packet layout tracking engine dynamics, physics vectors, orientation radians, tire slip/angles, and surface rumbles.
2.  **Motorsport Dash (FM 2023):** Extends up to 331+ bytes to incorporate unique fields like individual tire wear percentages.
3.  **The Car ID Bottleneck:** Vehicles are identified solely via an integer called `CarOrdinal`. The system will require a lookup dictionary file to map these ordinals to readable strings (e.g., `"2021 Porsche 911 GT3"`).

---

## 4. Current Implementation State

### Backend Implementation (`src-tauri/src/lib.rs`)
The native Rust code currently boots up a background thread on startup, binds to the UDP port, parses explicit Little-Endian byte slices for essential values, and pushes a structured payload to the webview.
* `buffer[0..4]` -> `is_race_on` (`i32`)
* `buffer[16..20]` -> `engine_rpm` (`f32`)
* `buffer[244..248]` -> `speed_mps` (`f32`)

### Frontend Implementation (`src/App.tsx`)
A simple dashboard utilizing Tauri's `@tauri-apps/api/event` package to open a long-lived event listener (`listen("forza-telemetry")`). It parses incoming metrics, converts meters-per-second to MPH, and updates standard visual state hooks for current speed and engine RPM.

---

## 5. Next Steps & Feature Roadmap
When prompting for new code additions inside this workspace, adhere to the following planned features:

1.  **Complete Packet Parser:** Expand the Rust parser struct to cleanly map out the rest of the 324-byte layout (Inputs like `Throttle`, `Brake`, `Steer`, structural suspension vectors, and coordinates).
2.  **Local "Scrobble" Session Logic:** Implement an aggregator utility that identifies the boundaries of a race session (triggered when `is_race_on` shifts values or race time resets). Instead of logging 60 raw packets per second to a permanent database, compute running totals in local memory:
    * Total session distance
    * Max/Average Speed
    * Driver Style Profiles (e.g., *Lead-Foot Index* based on duration spent at `throttle == 255`).
3.  **Local Storage Cache:** Persist completed session summaries into a local file structure or lightweight embedded database before planning cloud synchronization mechanics.