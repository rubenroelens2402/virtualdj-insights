# VirtualDJ Insights

A lightweight, self-hosted analytics dashboard for exploring your VirtualDJ music library, playing history, and DJ sessions.

Built with **SvelteKit 5, TypeScript, SQLite, Drizzle ORM, Tailwind CSS, and Apache ECharts**.

VirtualDJ Insights transforms locally stored VirtualDJ data into an interactive analytics experience, helping you understand your music collection, discover listening and mixing patterns, and explore your DJ activity over time.

Everything runs locally. No cloud infrastructure or external database service is required.

## Features

### Overview Dashboard

A compact, dark-themed dashboard providing an overview of your DJ activity.

**Key statistics**
- Total tracks in your VirtualDJ library
- Total historical track plays
- Number of recorded DJ sessions
- Number of library tracks marked as played

**Visualizations**
- **Monthly Playing Activity** — Track plays per month
- **Top Played Artists** — Most frequently played artists
- **Playing Hours** — Distribution of track starts across 24 hours
- **Recent Sessions** — Quick access to your latest DJ sessions

The interface uses a responsive layout with subtle glassmorphism styling, interactive charts, and a minimal dark theme.

### Music Library

Explore your VirtualDJ music collection using searchable and paginated tables.

Available metadata includes:

- Artist and track title
- Genre and remix information
- BPM and musical key
- Track duration and bitrate
- First seen and last played timestamps
- VirtualDJ play counts

Where ID3 metadata is missing, the importer attempts to extract artist and title information from filenames.

### Playing History

Browse historical track plays imported from VirtualDJ's `tracklist.txt`.

- Chronological play history
- Artist and track information
- Recorded playback timestamps
- Total plays and unique track labels
- Session associations

History entries are preserved even when they cannot be matched to an existing library track.

### DJ Sessions

Explore individual DJ sessions and their tracklists.

- Session dates and recorded start times
- Number of tracks per session
- Chronological tracklists
- Artist information
- Session statistics
- Dedicated session detail pages

Sessions spanning midnight are supported.

Session time spans are calculated from the first and last recorded track-start timestamps, rather than exact playback durations.

## Technology Stack

| Component | Technology |
|---|---|
| Full-stack framework | SvelteKit |
| Frontend | Svelte 5 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Apache ECharts |
| Database | SQLite |
| ORM | Drizzle ORM |
| Database migrations | Drizzle Kit |
| XML parsing | fast-xml-parser |
| Runtime | Node.js |
| Deployment target | Docker Compose |

SvelteKit provides both the frontend and server-side functionality within a single application.

SQLite is an embedded database stored in a local file, eliminating the need for a separate database server.

## Architecture

```text
VirtualDJ
│
├── database.xml
│
└── History/
    └── tracklist.txt
         │
         ▼
┌─────────────────────────────┐
│ SvelteKit                   │
│                             │
│  Ingestion Services         │
│  ├── XML Parser             │
│  ├── History Parser         │
│  └── Synchronization        │
│                             │
│  Drizzle ORM                │
│       │                     │
│       ▼                     │
│  SQLite Database            │
│       │                     │
│       ▼                     │
│  Server-side Analytics      │
│       │                     │
│       ▼                     │
│  Svelte 5 + ECharts         │
└─────────────────────────────┘
         │
         ▼
   localhost:5173
```

All VirtualDJ source files are treated as read-only. Imported data is stored separately in SQLite.

## Data Sources

### `database.xml`

The VirtualDJ XML database contains music library metadata.

The importer extracts and normalizes:

- File paths and file sizes
- Artist, title, remix, and genre
- BPM and musical key
- Track length and bitrate
- First seen and last modified timestamps
- First play, last play, and play count

VirtualDJ stores BPM information as beat intervals in some XML fields. The importer converts these values into BPM while preserving the original values.

### `History/tracklist.txt`

Contains chronological playback history grouped by session dates.

Example:

```text
VirtualDJ History 2026/06/11
------------------------------
23:57 : Artist A - Track A
23:58 : Artist B - Track B
00:00 : Artist C - Track C
```

The importer identifies sessions, parses individual track entries, preserves their sequence, and handles midnight rollover.

Historical plays are currently imported from `tracklist.txt`. M3U history ingestion and cross-source reconciliation are planned improvements.

## Database Model

The application uses three core SQLite tables.

| Table | Description |
|---|---|
| `tracks` | Music library metadata imported from `database.xml` |
| `sessions` | DJ sessions identified from history headers |
| `plays` | Individual historical track-play events |

Relationships:

```text
tracks
  │
  │ 1:N
  ▼
plays ───────► sessions
                  N:1
```

A historical play can exist without a matching library track. The original artist, title, and history text are preserved for later reconciliation.

### Synchronization

Library ingestion uses upserts based on file paths to prevent duplicate library records.

History synchronization replaces records imported from `tracklist.txt` within a database transaction, preventing duplicate plays during repeated imports.

Currently, synchronization is triggered manually through server endpoints.

## Getting Started

### Prerequisites

- Node.js and npm
- A local VirtualDJ installation
- Access to VirtualDJ's `database.xml` and `History` directory

### 1. Clone the repository

```bash
git clone https://github.com/rubenroelens2402/virtualdj-insights.git
cd virtualdj-insights
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the local paths:

```env
DATABASE_PATH=./data/virtualdj.sqlite
VIRTUALDJ_PATH=/path/to/VirtualDJ
```

For development with WSL, the VirtualDJ path might look like:

```env
VIRTUALDJ_PATH=/mnt/c/Users/YourUser/AppData/Local/VirtualDJ
```

The specified directory must contain `database.xml` and the `History` folder.

### 4. Initialize SQLite

Create the database directory:

```bash
mkdir -p data
```

Apply Drizzle migrations:

```bash
npx drizzle-kit migrate
```

### 5. Start the development server

```bash
npm run dev
```

Open:

**http://localhost:5173**

### 6. Import the VirtualDJ music library

```bash
curl -X POST http://localhost:5173/api/sync
```

This parses `database.xml` and imports the music library into SQLite.

### 7. Import playing history

```bash
curl -X POST http://localhost:5173/api/sync/history
```

This imports historical sessions and individual track plays.

Refresh the dashboard to explore the imported data.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/sync` | Synchronize the music library |
| POST | `/api/sync/history` | Synchronize historical plays and sessions |

These endpoints are intended for local development. Authentication and synchronization locking should be implemented before exposing the application to other devices or networks.

## Project Structure

```text
src/
├── lib/
│   ├── components/
│   │   └── charts/
│   │       └── Chart.svelte
│   │
│   └── server/
│       ├── analytics/
│       │   └── overview.ts
│       │
│       ├── db/
│       │   ├── index.ts
│       │   └── schema.ts
│       │
│       └── ingestion/
│           ├── database-parser.ts
│           ├── history-parser.ts
│           └── sync-service.ts
│
├── routes/
│   ├── +layout.svelte
│   ├── +page.svelte
│   ├── +page.server.ts
│   │
│   ├── library/
│   ├── history/
│   ├── sessions/
│   │   └── [id]/
│   │
│   └── api/
│       └── sync/
│           └── history/
│
└── layout.css

drizzle/              # SQL migrations
data/                 # Local SQLite database (Git-ignored)
drizzle.config.ts     # Database tooling configuration
```

## Development Tools

### Drizzle Studio

Inspect the SQLite database using:

```bash
npx drizzle-kit studio
```

### Database migrations

After modifying the Drizzle schema:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

### Type checking

```bash
npx svelte-kit sync
npx svelte-check --tsconfig ./tsconfig.json
```

## Roadmap

- [x] SvelteKit application foundation
- [x] SQLite and Drizzle integration
- [x] VirtualDJ XML library ingestion
- [x] Playing history ingestion
- [x] DJ session parsing
- [x] Library, History, and Sessions pages
- [x] Overview dashboard with interactive analytics
- [x] Compact dark-themed dashboard styling
- [ ] Activity calendar and weekday/hour heatmap
- [ ] Historical play-to-library track matching
- [ ] BPM and musical key progression per session
- [ ] Advanced date filtering and analytics
- [ ] Automatic background synchronization
- [ ] Stable session identifiers across imports
- [ ] M3U history ingestion and reconciliation
- [ ] Yearly DJ Wrapped summaries
- [ ] Single-container Docker deployment

## Privacy and Local Data

VirtualDJ Insights is designed for local use.

- No cloud database is required.
- No third-party analytics service is required.
- VirtualDJ source files are read, not modified.
- Imported library and playback information remains in the local SQLite database.
- Database files and local `.env` configuration should not be committed to Git.

## License

No license has been selected yet.
