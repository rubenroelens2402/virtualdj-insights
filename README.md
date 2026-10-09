# VirtualDJ Insights

A lightweight, locally hosted analytics dashboard for exploring your **VirtualDJ music library, playing history, DJ sessions, and harmonic mixing possibilities**.

Built with **SvelteKit (Svelte 5), TypeScript, SQLite, Drizzle ORM, Tailwind CSS v4, and Apache ECharts**.

VirtualDJ Insights turns data from your local VirtualDJ installation into a compact, interactive DJ analytics workspace. Your library and history are stored in a local SQLite database; no external database or cloud analytics service is required.

## Features

### Overview

A viewport-friendly dashboard with four key metrics:

- Library tracks
- Historical plays
- DJ sessions
- Played library tracks

Visualizations include **monthly playing activity** (bar chart), **top played artists**, a **24-hour distribution of track starts**, and **recent sessions** linked to their detail pages.

### Music Library

Search and explore tracks imported from `database.xml` using a paginated, sortable table with independently scrolling rows and sticky column headings.

- Artist, title, genre, BPM, key, duration, and VirtualDJ play count
- First-seen and last-played dates
- Search across track names, artists, file paths, genres, and remix labels
- Filters for genre, musical key, minimum/maximum BPM, play status, and last-played date
- Server-side sorting and pagination across the complete library

Library play counts and `firstPlay`/`lastPlay` metadata come from the **VirtualDJ library database**; they are distinct from parsed `tracklist.txt` history events.

### Playing History

Explore plays imported from VirtualDJ's `History/tracklist.txt`.

- Search artist, title, and original history text
- Filter by date range and session ID
- Sort by play timestamp, artist, title, or session date
- Paginated history table with links to session details
- Counts of total plays, distinct original track labels, and sessions

Unmatched historical plays are retained even if no corresponding library track is found.

### DJ Sessions

Browse dated sessions with track counts and recorded start/end timestamps. The session listing supports date-range filtering, minimum-track counts, sorting, and pagination. When history plays are linked to library tracks, session summaries can include matched-track counts and average BPM.

Session detail pages show chronological tracklists, unique artists, library matches, and—when a link exists—library-derived BPM, musical key, and genre.

Session duration shown as a *span* is the time between the first and last recorded track-start timestamps, not necessarily the full performance duration. History parsing handles plays crossing midnight.

### Harmonic Wheel

An interactive **24-key Camelot wheel** for exploring library tracks by musical key.

- Click any major (**B**) or minor (**A**) segment to filter the track list
- Highlight compatible keys: the selected key, its two adjacent Camelot numbers in the same mode, and its relative major/minor
- Subtle color-coded segment outlines, compatibility legend, and matching key indicators in results
- Search and sort tracks by artist, BPM, play count, or recent play date
- Wheel counts and results reflect available keyed library tracks and any configured play-count eligibility rules

For example, selecting **2A** highlights:

- **2A** — Selected key
- **1A** — Previous compatible key
- **3A** — Next compatible key
- **2B** — Relative major

Tracks from all four keys appear together in the results, with subtle colors distinguishing each compatibility relationship.

The wheel uses `tracks.musicalKey` from the library database, **not** inferred keys from unmatched history text.

In the current configured query, tracks must have a non-null/non-empty key and `tracks.playCount > 0`. Additional play-count eligibility controls can be applied in the interface.

The wheel maps supported key spellings, including common enharmonic equivalents, to Camelot notation.

### Synchronization Controls

The sidebar offers **Sync Library** and **Sync History** actions using the existing server routes. Buttons provide loading/error feedback and refresh SvelteKit data after a successful import.

- `POST /api/sync`: Import/update library metadata from `database.xml`
- `POST /api/sync/history`: Import sessions and plays from `History/tracklist.txt`

Library and history imports are independent.

Matching historical plays to library entries through `plays.trackId` is a separate reconciliation concern; the presence of BPM/key values in session details depends on successful matching.

### User Interface

- Dark navy, subtle glassmorphism design with reusable CSS classes for KPIs, panels, and typography
- Sidebar navigation for Overview, Library, History, Sessions, and Harmonic Wheel
- Viewport-contained desktop pages, with internal table/list scrolling and sticky headings/pagination
- Scroll fallback for smaller displays
- Compact dashboard components
- Consistent search, filtering, and sorting controls

Additional theme palettes and a persistent theme selector are an optional enhancement. Full theme-aware styling, particularly chart colors and hardcoded utility colors, may require further work.

## Technology Stack

| Area | Technology |
|---|---|
| Full-stack framework | SvelteKit |
| UI and reactivity | Svelte 5 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 and custom CSS tokens |
| Charts | Apache ECharts |
| Database | SQLite |
| ORM and migrations | Drizzle ORM / Drizzle Kit |
| XML ingestion | fast-xml-parser |
| Runtime | Node.js |
| Planned packaging | Docker / Docker Compose |

## Architecture

```text
VirtualDJ installation
│
├── database.xml
│   └── Library parser
│       └── tracks
│
└── History/
    └── tracklist.txt
        └── History parser
            ├── sessions
            └── plays
                │
                └── Optional matching
                    plays.track_id → tracks.id

                    │
                    ▼
             SQLite Database
                    │
                    ▼
           Drizzle ORM Queries
                    │
                    ▼
             SvelteKit Pages
                    │
                    ▼
           Svelte 5 + ECharts
                    │
                    ▼
              localhost:5173
```

VirtualDJ source files are read, not modified. Imported records are held in a separate local SQLite database.

## Data Model

The application uses three core SQLite tables.

| Table | Purpose |
|---|---|
| `tracks` | Library metadata: file path, artist/title, genre, BPM, key, duration, VirtualDJ play count, first/last played, first seen, sync time |
| `sessions` | Session date, first/last track-start timestamp, source file, and source position |
| `plays` | Individual history events: timestamp, sequence, original artist/title text, session relationship, optional library `trackId` |

A session contains many plays.

A play may optionally reference one library track; unmatched plays are preserved.

**Important:** VirtualDJ `tracks.playCount` is not interchangeable with the number of matched `plays` rows.

The former is library metadata, while the latter represents actual imported historical play records linked to a library track.

## Getting Started

### Prerequisites

- Node.js and npm
- A VirtualDJ installation with a readable `database.xml` and `History` folder
- Filesystem access to those files, including Windows-mounted paths when developing in WSL

### 1. Clone the Repository

```bash
git clone https://github.com/rubenroelens2402/virtualdj-insights.git
cd virtualdj-insights
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Configure `.env`:

```dotenv
DATABASE_PATH=./data/virtualdj.sqlite
VIRTUALDJ_PATH=/path/to/VirtualDJ
```

For WSL development, the VirtualDJ path might resemble:

```dotenv
VIRTUALDJ_PATH=/mnt/c/Users/YourUser/AppData/Local/VirtualDJ
```

The configured directory should contain `database.xml` and the `History` directory.

### 4. Initialize the Database

```bash
mkdir -p data
npx drizzle-kit migrate
```

### 5. Start the Application

```bash
npm run dev
```

Open **http://localhost:5173**.

### 6. Synchronize Data

Use the two synchronization buttons in the sidebar, or run:

```bash
# Import music library
curl -X POST http://localhost:5173/api/sync

# Import playing history
curl -X POST http://localhost:5173/api/sync/history
```

For key-enriched session data, ensure the optional historical-play matching process has populated valid `plays.trackId` references.

A conservative matching strategy can link uniquely identified artist/title pairs while leaving ambiguous or missing matches unresolved.

## Application Routes

| Route | Description |
|---|---|
| `/` | Overview dashboard |
| `/library` | Searchable, sortable, filterable library |
| `/history` | Searchable, filterable playing history |
| `/sessions` | Sessions directory |
| `/sessions/[id]` | Session detail with tracklist |
| `/harmonic-wheel` | Interactive Camelot wheel and keyed-track explorer |
| `POST /api/sync` | Import/synchronize library |
| `POST /api/sync/history` | Import/synchronize history |

## Development

### Drizzle Studio

Inspect the local SQLite database:

```bash
npx drizzle-kit studio
```

### Type Checking

```bash
npx svelte-kit sync
npx svelte-check --tsconfig ./tsconfig.json
```

### Database Migrations

After modifying the Drizzle schema:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Project Structure

```text
src/
├── layout.css
├── lib/
│   ├── components/
│   │   └── charts/
│   │       └── Chart.svelte
│   └── server/
│       ├── analytics/
│       ├── db/
│       │   ├── index.ts
│       │   └── schema.ts
│       └── ingestion/
│
└── routes/
    ├── +layout.svelte
    ├── +page.svelte
    ├── +page.server.ts
    │
    ├── library/
    ├── history/
    ├── sessions/
    │   └── [id]/
    ├── harmonic-wheel/
    │
    └── api/
        └── sync/
            └── history/

drizzle/              # Database migrations
data/                 # Local SQLite files (Git-ignored)
drizzle.config.ts      # Database configuration
```

## Roadmap

### Implemented / Available

- [x] SvelteKit + Svelte 5 application foundation
- [x] SQLite and Drizzle schema
- [x] VirtualDJ library XML ingestion
- [x] Historical `tracklist.txt` ingestion
- [x] DJ session parsing
- [x] Overview analytics with ECharts
- [x] Library sorting, filters, and pagination
- [x] History sorting, filters, and pagination
- [x] Sessions and session detail pages
- [x] Session-level statistics and optional library enrichment
- [x] Interactive Camelot wheel
- [x] Harmonic compatibility highlighting
- [x] Keyed track discovery and play-count eligibility
- [x] Sidebar synchronization actions
- [x] Compact glassmorphism UI and internal scrolling

### Next Major Upgrade — Activity Calendar

Build an interactive activity calendar to explore historical DJ activity by date.

- [ ] GitHub-style calendar heatmap of recorded plays per day
- [ ] Year selector
- [ ] Daily tooltips displaying date and track-play count
- [ ] Select a day to view recorded tracks and associated sessions
- [ ] Navigate from a selected day to filtered Playing History
- [ ] Activity statistics: total plays, active days, longest streak, busiest day
- [ ] Weekday activity distribution
- [ ] Handle zero-activity dates and leap years
- [ ] Support sessions spanning midnight
- [ ] Add a compact activity calendar to the Overview

### Later Improvements

- [ ] Improve and verify history-to-library matching coverage
- [ ] BPM progression across individual DJ sessions
- [ ] Musical-key progression and harmonic transitions
- [ ] More detailed harmonic compatibility analysis
- [ ] Persistent, fully theme-aware theme selector and ECharts palette
- [ ] Automatic background synchronization with locking
- [ ] Stable session identifiers across reimports
- [ ] M3U history ingestion and cross-source reconciliation
- [ ] Yearly DJ Wrapped summaries
- [ ] Containerized deployment

## Privacy and Security

VirtualDJ Insights is intended for local use.

- No cloud database is required.
- No third-party analytics service is required.
- VirtualDJ source files are read, not modified.
- Imported information remains in the local SQLite database.
- Local database files and `.env` configuration should not be committed to Git.
- Sync endpoints should be protected before exposing the application on an untrusted network.

## License

No license has been selected yet.