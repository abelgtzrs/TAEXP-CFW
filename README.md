# The Abel Experience™ CFW (Cognitive Framework) v4.1

## Description

The Abel Experience™ CFW (Cognitive Framework) is a full-stack MERN application for personal productivity and content management. It uses a decoupled API architecture to serve a private admin panel and a public content viewer.

This project combines personal productivity tracking, content management, and gamification elements. The system includes trackers for daily activities (habits, workouts, reading) that earn virtual currencies. These currencies can be spent in a shop to collect digital items.

The main client (`client-admin`) is a web application with a dark interface for registered users. A secondary client (`client-public`) provides a terminal-style interface for viewing published content.

**Version 4.1** includes updated chart architecture, persona theming system, and responsive design with modular widget components.

### Recent Additions (Nov 2025)

- Dashboard layout editing overhaul with persistent per-user layouts
  - Three-column left container with drag/drop, up/down controls, and move-to-adjacent-column
  - Height controls and size presets per widget; width controls removed (requested)
  - Global "Edit Layout & Size" toggle to enable layout edits
  - Server-backed persistence per user (GET/PUT `/api/users/me/dashboard-layout`) with debounce and local fallback
- Persistent Right Sidebar across all pages
  - Extracted `RightSidebar` with glass background; fills from header to page bottom
  - Resizable width via draggable handle, plus collapse/expand; width persisted
  - Clock, Weather, Spotify widgets scaled to 85% for compact design; always match sidebar width; unlimited height; transparent interiors; vertical gaps between widgets
- Header enhancements
  - Pokémon popover (Pokéball button) with 400x300 animated field
  - Daily Drafts popover to write and browse previous days
  - Calendar popover sized to 400px with more prominent “today” highlight
- UX polish
  - Left dashboard columns hide scrollbars, smoother interactions

### What's New in v4.1

- Latest changes (Nov 2025):
  - Dashboard layout editing overhaul with persistent per-user layouts
    - Three-column left container with drag/drop, up/down controls, and move-to-adjacent-column
    - Height controls and size presets per widget; width controls removed
    - Global "Edit Layout & Size" toggle
    - Server-backed persistence per user (GET/PUT `/api/users/me/dashboard-layout`) with debounce and local fallback
  - Persistent Right Sidebar across all pages
    - Extracted `RightSidebar` with glass background; fills from header to page bottom
    - Resizable width via draggable handle, collapse/expand; width persisted
    - Clock, Weather, Spotify widgets scaled to 85%; always match sidebar width; unlimited height; transparent interiors; vertical gaps
  - Header enhancements: Pokémon popover (400x300), Daily Drafts popover, Calendar popover width 400px with stronger "today" highlight
  - UX polish: hidden left-column scrollbars and smoother interactions

- **Updated Chart Architecture**: Data visualization system changes including:
  - **Modular LoreChartWidget**: Split into four independent, reusable chart components
  - **Responsive Chart Containers**: Charts adapt to widget container sizes using flexible layouts
  - **Data Visualization**: Recharts integration with custom styling, theming support, and animations
  - **Individual Chart Components**:
    - **CoherenceChartWidget** (Area Chart): Narrative consistency tracking with gradient fills
    - **AnomalyChartWidget** (Bar Chart): Data irregularity visualization with color-coded indicators
    - **DriftChartWidget** (Line Chart): Timeline stability monitoring with trend analysis
    - **SystemStatusWidget** (Pie Chart): Operational health metrics with interactive segments and tooltips

- **Persona Theming System**: Updated theming architecture including:
  - **Real-time Theme Switching**: Apply persona color schemes across UI components
  - **Dropdown Interface**: Converted PersonaWidget from button grid to dropdown with Portal-based positioning
  - **CSS Custom Properties**: Theming system using CSS variables for color transitions
  - **Chart Theme Integration**: Persona themes apply to all chart components with coordinated color palettes
  - **Database Schema Updates**: Backend integration with proper color and text object structures
  - **Z-index Management**: Portal-based dropdown positioning eliminates stacking issues

- **Responsive Design**: Updated responsive architecture including:
  - **Flexible Container System**: Charts adjust to any widget container size
  - **Mobile Support**: Improved mobile and tablet compatibility with touch interactions
  - **Grid Layouts**: Dynamic grid systems that respond to screen size changes
  - **Performance**: Efficient rendering with component separation and optimized state management

- **Dashboard Widget Updates**: Widget redesign and optimization including:
  - **LoreChartWidget 2x2 Grid**: Four interconnected charts in responsive grid layout displaying narrative data
  - **HabitTrackerWidget**: Shows up to 10 habits with completed items crossed out but remaining visible
  - **WorkoutTrackerWidget**: 2x2 grid of preset workout template buttons plus custom log option
  - **BookTrackerWidget**: Displays last 4 active books with cover images, year, author, and update controls
  - **WeatherWidget**: 2-column layout with current weather and 5-day forecast
  - **ClockWidget**: Time display with improved alignment
  - **Additional Widgets**: RecentAcquisitionsWidget, SocialSalesWidget, TopProductsWidget, CurrencySourceWidget

- **Profile Collections Updates**:
  - **DisplayedCollection**: Redesigned to show 6 items per row with 20% width-to-height ratio
  - **Responsive Grid**: 3 columns on mobile, 6 on desktop
  - **Height Management**: Middle column no longer forced to align with sidebar heights
  - **Error Handling**: Fallbacks for undefined collection data

- **Pokemon Editor Updates**:
  - **Wider Editor**: Increased editor width by reducing sidebar from 240px to 192px
  - **Better Layout**: More space for forms and content editing
  - **Success Feedback**: Toast notifications positioned in top-right corner
  - **Navigation**: Updated Pokemon selector with better search functionality

- **Persona Theming System Updates**:
  - **UI Theming**: Persona-based theme switching that updates CSS custom properties in real-time
  - **Dropdown Interface**: Converted PersonaWidget from button grid to dropdown with Portal-based positioning
  - **Theme Color Integration**: Each persona applies unique color schemes across UI components including charts
  - **Backend Integration**: Database schema alignment for persona data with corrected color and text object structures

- **Backend Architecture Updates**: Server-side functionality and API improvements:
  - **Function Export Structure**: Updated userController.js with const function patterns
  - **Database Schema Updates**: Corrected AbelPersonaBase schema for proper color and text object structures
  - **API Population**: Improved persona data population in authentication endpoints
  - **Error Resolution**: Fixed setActivePersona function exports and middleware integration

- **Technical Infrastructure Updates**: Codebase modernization including:
  - **Component Modularization**: Split complex widgets into maintainable, reusable components
  - **State Management**: Updated React state handling for better performance
  - **Cross-component Communication**: Improved data flow between chart components and theming system
  - **Code Quality**: Better error handling, type safety, and debugging capabilities

Future iterations may explore native desktop (C# or C++) and mobile UI clients that connect to the same backend API.

## Table of Contents

1.  [Installation](#installation)
    - [Prerequisites](#prerequisites)
    - [Backend Setup (Server)](#backend-setup-server)
    - [Frontend Setup (client-admin & client-public)](#frontend-setup-client-admin--client-public)
2.  [Usage](#usage)
    - [Running the Application](#running-the-application)
    - [Seeding Initial Data](#seeding-initial-data)
3.  [Features](#features)
    - [Backend & API](#backend--api)
    - [Admin & User Panel (`client-admin`)](#admin--user-panel-client-admin)
    - [Public Terminal Viewer (`client-public`)](#public-terminal-viewer-client-public)
4.  [Walkthrough](#walkthrough)
    - [First Time Setup (Admin)](#first-time-setup-admin)
    - [Daily User Flow](#daily-user-flow)
5.  [Screenshot](#screenshot)
6.  [License](#license)
7.  [Contributors and Questions](#contributors-and-questions)

---

## Developer Notes

If you want my behind-the-scenes notes on how this codebase is wired and how I approach changes, see:

- docs/DEVELOPER_NOTES.md — repo-wide overview and conventions
- client_admin/DEVELOPER_NOTES.md — admin dashboard specifics (widgets, theming, header sprites)
- client_public/DEVELOPER_NOTES.md — public terminal viewer shape
- server/DEVELOPER_NOTES.md — API layout, scripts, static assets
- mobile/DEVELOPER_NOTES.md — Expo app layout

---

## Installation

### Prerequisites

- Node.js (v18.x or later)
- npm (v9.x or later)
- MongoDB (A local instance or a free cloud cluster from MongoDB Atlas)
- Git

### Backend Setup (Server)

The server is located in the `server/` directory.

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create an Environment File:**
    Create a `.env` file in the `server/` root and populate it with the necessary variables. See the `Environment Variables` section in the project's full documentation for a complete list.
    **Crucial variables:**
    - `MONGO_URI`: Your MongoDB connection string.
    - `JWT_SECRET`: A long, random string for signing tokens.
    - `PORT`: The port for the backend server (e.g., 5000).
    - `MLB_API_BASE_URL`: MLB API base URL. Defaults to `https://statsapi.mlb.com/api/v1`.
    - `MLB_API_KEY`: Optional RapidAPI key if you route MLB requests through RapidAPI.
    - `MLB_API_HOST`: Optional RapidAPI host value, such as `api-baseball.p.rapidapi.com`.
    - `MLB_SEASON`: Optional override for the season year (defaults to the current year).

### Frontend Setup (client-admin & client-public)

The setup process is identical for both the `client-admin` and `client-public` directories.

1.  **Navigate to the client directory:**
    ```bash
    cd client-admin  # or client-public
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **(Optional) Create Local Environment File:**
    For local development, you can create a `.env.local` file in the client's root to specify the backend API URL.
    ```env
    VITE_API_BASE_URL=http://localhost:5000/api
    ```

---

## Usage

### Running the Application

To run the full application, you will need to open three separate terminal windows.

1.  **Start the Backend Server:**

    ```bash
    cd server
    npm run dev
    ```

    _The server will typically run on `http://localhost:5000`._

2.  **Start the Admin Panel Frontend:**

    ```bash
    cd client-admin
    npm run dev
    ```

    _This client will typically run on `http://localhost:5173` or the next available port._

3.  **Start the Public Terminal Frontend:**
    ```bash
    cd client-public
    npm run dev
    ```
    _This client will typically run on the next available port after the admin panel (e.g., `5174`)._

### Seeding Initial Data

After setting up the project, the first step is to populate the database with the foundational "Base" data for collectibles and definitions.

1.  **Review Data Files:** Ensure the JSON files in `server/data/` are configured as desired.
2.  **Run the Import Script:**
    ```bash
    cd server
    npm run data:import
    ```
    _This command will clear the relevant collections and insert the data from your JSON files._

---

## Features

### Backend & API

- **Authentication:** Secure user registration and login system using JSON Web Tokens (JWT).
- **Middleware:** Role-based access control (`admin`, `special_user`, `member`) and route protection.
- **Decoupled Architecture:** RESTful API designed to serve multiple clients (web, future native desktop/mobile).
- **Gamified Economy:** Logic for awarding three distinct currencies (`TemuTokens`, `GatillaGold`, `WendyHearts`) based on user activities.
- **Gacha System:** A robust API endpoint for handling randomized "pulls" of collectibles, deducting currency, and handling duplicates.
- **Content Parsing:** A server-side parser to convert raw "greentext" block text into a structured JSON format for storage.
- **Data Seeding:** A script to populate the database with foundational data for all collectible types.
- **Per-user Dashboard Layout Persistence:**
  - New `dashboardLayout` field on `User`
  - Endpoints: `GET /api/users/me/dashboard-layout`, `PUT /api/users/me/dashboard-layout`
  - Client saves layout on edits (debounced) and loads on login; localStorage fallback retained

### Admin & User Panel (`client-admin`)

- **Responsive Design:** Works on both desktop and mobile devices with mobile layouts.
- **HUD Dashboard:** A professional, data-focused dashboard with a dark aesthetic, featuring:
  - **Widget Grid**: Dashboard widgets displayed in a 6-column grid layout
  - **LoreChartWidget**: Four responsive, connected charts displaying narrative data with real-time theming:
    - **Narrative Coherence Index** (Area Chart): Tracks story consistency metrics with gradient fills
    - **Anomaly Detection Events** (Bar Chart): Visualizes data irregularities and system alerts with color coding
    - **Temporal Drift Analysis** (Line Chart): Monitors timeline stability with trend indicators
    - **System Status Overview** (Pie Chart): Displays operational health metrics with interactive segments and tooltips
  - **Tracker Widgets**: Habit, Book, and Workout trackers with responsive layouts
  - **Weather & Clock**: Real-time weather data and clock display
  - **Analytics**: Recent acquisitions, sales data, and currency tracking widgets with live updates
- **Abel Persona Theming:** A system for Admin and Wendy to unlock and equip "Personas" that change the UI color scheme:
  - **Real-time Theme Switching**: Apply persona color schemes across all components
  - **CSS Custom Properties**: Theming system using CSS variables for color transitions
  - **Chart Integration**: Persona themes apply to all chart components with coordinated color palettes
  - **Dropdown Interface**: Persona selection dropdown with Portal-based positioning to avoid z-index conflicts
- **Full-Featured Trackers:**
  - **Habit Tracker:** CRUD for personal habits with completion status persistence and visual feedback.
  - **Book Tracker:** Track reading progress, ratings, and library with cover image support and detailed metadata.
  - **Workout Tracker:** Log detailed workouts with exercises, sets, reps, and weight. Includes support for "clean" sessions and "prebuilt templates" with 2x2 preset button layout.
  - **Task Manager:** With support for sub-task checklists.
  - **Note Manager:** For personal notes and ideas.
- **Collection Management:** UI to view all collected items (Pokémon, Snoopys, Habbo Rares, Yu-Gi-Oh! Cards, Badges, Titles) with grid layouts.
- **Profile Customization:**
  - **Display Collections**: Show 6 items per collection in a compact, responsive grid
  - **Height Management**: Collections maintain their optimal aspect ratio (20% width-to-height)
  - **Selection Interface**: Interface for selecting displayed items from collections
- **Admin-Specific Panels:**

#### Dashboard Layout System (New)

- Left area uses a responsive 1→3 column grid
- Edit controls:
  - Reorder within a column (↑/↓)
  - Move to previous/next column (←/→)
  - Adjust widget height (-5px/+5px) and jump presets (SM/MD/LG/XL)
  - Per-widget width controls were removed per request to simplify editing
- Global toggle: "Edit Layout & Size" enables layout edits and right sidebar resizing
- Persistence:
  - Per-user layout saved and loaded via `/api/users/me/dashboard-layout`
  - Debounced saves with localStorage fallback for offline/unauthenticated use

#### Right Sidebar (New)

- Persistent across all pages (moved into `AdminLayout`)
- Glassmorphism container; occupies the right side from header to bottom
- Resizable width via draggable handle; collapsible; state persisted
- Widgets inside: Clock, Weather, Spotify
  - Internals scaled to 85% for a tighter look
  - Always span the sidebar width; unlimited natural height
  - Transparent widget interiors (no card backgrounds); vertical spacing between widgets

#### Header Popovers (New)

- Pokémon popover: 400x300 animation field shown from a Pokéball button
- Daily Drafts popover: write drafts and browse history (uses `dailyDraftsService`)
- Calendar popover: fixed width 400px with enhanced “today” highlight

#### Additional Widgets and Registry

- Quick Notes, Quick Links, Focus Timer, Daily Quote, and Countdown integrated in the widget registry and default/migrated layout
  - **Volume Manager:** Create, edit, publish, and delete Greentext Volumes using a form with a live JSON preview.
  - **Pokemon Database Editor:** Editor with wider layout, improved navigation, and success feedback.
  - **Base Data Manager:** CRUD interfaces for managing the foundational data of all collectibles (e.g., adding a new exercise to the system, defining a new Snoopy collectible).

### Public Terminal Viewer (`client-public`)

- **Terminal Interface:** A retro, full-screen terminal aesthetic.
- **Typewriter Animation:** Greentext Volumes are displayed character-by-character with randomized, subtle glitch effects.
- **Command-Line Navigation:** Users interact with the system by typing commands like `catalogue`, `random`, `view [id]`, `next`, etc.

---

## Walkthrough

### First Time Setup (Admin)

1.  After installation, run `npm run data:import` in the `server` directory to seed the database.
2.  Start all three services (`server`, `client-admin`, `client-public`).
3.  Navigate to the `client-admin` application and register your primary `admin` account.
4.  Using the admin-only links in the sidebar, navigate to "Exercise Definitions" and "Workout Templates" to create the foundational data for the Workout Tracker.
5.  Navigate to the "Volume Manager," paste a complete raw greentext into the form, set the status to "published," and create the volume.
6.  Navigate to the `client-public` URL to see the published volume available for viewing.

### Daily User Flow

1.  Log in to the `client-admin` application. You are greeted by your personalized HUD Dashboard featuring all widgets in a grid layout.
2.  Navigate to the **Habit Tracker** and mark several habits as complete. Completed habits remain visible but crossed out. Observe your `TemuTokens` balance increase.
3.  Go to the **Book Tracker** and update your `pagesRead` for a book you are currently reading. View cover images and detailed book information. See your `WendyHearts` balance increase.
4.  Visit the **Workout Tracker** and log a session using one of the four preset template buttons in the 2x2 grid, or create a custom workout. Your `GatillaGold` balance will increase based on the number of sets completed.
5.  Check the **Weather Widget** for current conditions and 5-day forecast, and view the time on the **Clock Widget**.
6.  Review the **LoreChartWidget** to see data visualizations across four charts:
    - Monitor **Narrative Coherence** trends with the area chart visualization
    - Analyze **Anomaly Detection Events** using the interactive bar chart with recent data highlights
    - Track **Temporal Drift** patterns through the line chart with data point markers
    - Check **System Status** at a glance with the pie chart breakdown
7.  Experiment with **Persona Theming** by selecting different personas from the dropdown to see real-time theme changes across all dashboard components and charts.
8.  With your newly earned currency, navigate to the **Shop (Gacha)** page and perform a "pull" for a new Pokémon or Snoopy.
9.  Visit your **Profile** page to see your updated level/XP, currency balances, and manage which collectibles are displayed in the 6-item-per-row collections with improved spacing and visual hierarchy.

The dashboard now provides a view of your digital sanctuary with responsive charts that adapt to any screen size, persona-based theming that reflects your current aesthetic preferences, and analytics that help you track your progress across all areas of the system.

---

## Pages and modules reference

This section lists the primary pages/screens and the functional modules across the app. Names reflect file names; brief descriptions are provided for orientation.

### Admin web app pages (`client_admin/src/pages`)

- Auth and profile
  - `LoginPage.jsx` — Sign in
  - `RegisterPage.jsx` — Create account
  - `ProfilePage.jsx` — User profile, avatar/banner, displayed collections
  - `SettingsPage.jsx` — App/user settings
  - `AdminUserManagementPage.jsx` — Admin user list and moderation
- Dashboard & layout
  - `DashboardPage.jsx` — Main dashboard with widgets and persistent right sidebar
  - `DashboardGridLayout.js` — Layout utilities/demo for grid-based arrangement
  - `DailyDraftsPage.jsx` — Daily writing drafts and history
- Habits, books, tasks
  - `HabitsPage.jsx` — Habit tracker
  - `BooksPage.jsx` — Reading tracker and library
  - `TasksPage.jsx` — Tasks with checklists
- Fitness and sports
  - `WorkoutPage.jsx` — Workout overview
  - `LogWorkoutPage.jsx` — Log a workout session
  - `SelectTemplatePage.jsx` — Choose a workout template
  - `AdminTemplatesPage.jsx` — Manage workout templates
  - `BulkWorkoutImportPage.jsx` — Import workouts/templates in bulk
  - `AdminExercisesPage.jsx` — Exercise definitions
  - `BaseballTrackerPage.jsx` — Baseball stats tracker
  - `FootballTrackerPage.jsx` — Football stats tracker
- Finance
  - `FinancePage.jsx` — Personal finance overview
  - `RichFinancePage.jsx` — Extended finance analytics/tools
- Calendars & blessings
  - `CalendarAdminPage.jsx` — Calendar data management
  - `BlessingsAdminPage.jsx` — Blessing definitions admin
  - `BlessingsUsagePage.jsx` — Blessings usage/reporting
- Collections and shop
  - `CollectionsPage.jsx` — All collections grid
  - `CollectionDetailPage.jsx` — Collection detail view
  - `ShopPage.jsx` — Gacha/shop pulls
- Pokémon and media
  - `PokedexPage.jsx` — Pokedex browsing
  - `PokemonEditorPage.jsx` — Editor for Pokemon base data
  - `AdminEditPokemonPage.jsx` — Admin edit utilities for pokemon
  - `SnoopyAdminPage.jsx` — Snoopy collectibles admin
  - `HabboRareManagement.jsx` — Habbo rares admin
  - `SpotifyStatsPage.jsx` — Spotify activity and stats
- Volumes (greentext)
  - `VolumesPage.jsx` — Volumes list
  - `VolumeWorkbenchPage.jsx` — Create/edit with live preview
  - `EditVolumePage.jsx` — Edit volume content and metadata
  - `volumeFunctionality/` — Helper utilities for volumes

### Public web app (terminal viewer) (`client_public`)

- Single-page terminal UI with components under `src/components`, started by `App.jsx`.
- Displays volumes with typewriter effects and command-style navigation.

### Mobile app screens (`mobile/src/screens`)

- `DashboardScreen.jsx` — Mobile dashboard
- `CollectionsScreen.jsx` — Collections on mobile
- `FinanceScreen.jsx` — Finance features on mobile
- `LoginScreen.jsx` — Mobile login
- `MoreScreen.jsx` — Additional mobile options
- `VolumeListScreen.jsx`, `VolumeDetailScreen.jsx` — Volume browsing and details

### Admin client services (`client_admin/src/services`)

- `api.js` — Axios instance and auth header injection
- `adminUserService.js` — Admin user operations
- `blessingsService.js` — Blessings API calls
- `calendarService.js` — Calendar API calls
- `dailyDraftsService.js` — Drafts persistence
- `layoutService.js` — Per-user dashboard layout (GET/PUT)
- `personaService.js` — Persona data
- `snoopyService.js` — Snoopy API
- `sportsService.js` — Sports endpoints

### Server API areas (`server/controllers` → `server/routes`)

- Auth: `authController.js` / `authRoutes.js` — Register, login, me
- Users: `userController.js` / `userRoutes.js` — Profile, displayed items, streaks, dashboard stats, profile media, per-user dashboard layout (GET/PUT `/api/users/me/dashboard-layout`)
- Habits: `habitController.js` — Habit CRUD and completion
- Books: `bookController.js` — Book CRUD and progress
- Tasks: `taskController.js` — Tasks and checklists
- Workout Templates: `workoutTemplateController.js` — Template CRUD
- Workout Logs: `workoutLogController.js` — Log sessions and sets
- Exercise Definitions: `exerciseDefinitionController.js` — Exercise catalog
- Finance: `financeController.js` — Finance data and operations
- Badges: `badgeController.js` — Badge system
- Blessings: `blessingDefinitionController.js` — Blessings data
- Calendar: `calendarController.js` — Calendar entries
- Pokémon: `pokemonController.js`, `pokemonAdminController.js` — Pokémon public and admin endpoints
- Persona Admin: `personaAdminController.js` — Persona admin features
- Shop/Gacha: `shopController.js` — Gacha pulls and currency handling
- Spotify: `spotifyController.js` — Connect, sync, currently playing, recently played
- Sports: `sportsController.js` — Sports data (e.g., baseball/football trackers)
- Strokes: `strokesController.js` — Drawing/strokes utilities
- Volumes: `volumeController.js` — Greentext volumes CRUD and publishing
- Public: `publicController.js` — Public content endpoints

If you need endpoint-level detail, see each file under `server/routes/` for route paths mapped to the controllers above.

---

## Screenshot

<img width="1201" height="1221" alt="Screenshot 2025-07-25 010747" src="https://github.com/user-attachments/assets/98c78e88-8d93-495d-8ce9-2f3e7bba88ae" />

---

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

---

## Contributors

This is a personal project developed and maintained by Abel Gutierrez.
For any questions, you can reach me at:

- GitHub: [abelgtzrs](https://github.com/abelgtzrs)
- Email: abelgtzrs@gmail.com
