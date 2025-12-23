# Detailed Codebase Guide

This document provides an in-depth reference for every key file, component, and page in the **Abel Experience Dashboard** ecosystem.

---

## 1. Client Admin (`client_admin/src`)

The primary web interface for the system.

### 1.1. Core Configuration
- **`main.jsx`**: Application entry point. Mounts the React app to the DOM and wraps it in `AuthProvider` and `ThemeProvider`.
- **`App.jsx`**: The main router definition. Defines all URL routes (e.g., `/dashboard`, `/finance`) and maps them to Page components.
- **`index.css`**: Global CSS styles, including Tailwind directives and custom scrollbar styling.

### 1.2. Context Providers (`context/`)
- **`AuthContext.jsx`**: Manages user authentication state (login/logout, JWT token storage, user profile data).
- **`LayoutContext.jsx`**: Controls global layout state, such as the visibility of the Sidebar and Right Sidebar.

### 1.3. Services (`services/`)
- **`api.js`**: The central Axios instance. Handles base URL configuration and attaches the JWT token to every request.
- **`adminUserService.js`**: API calls for user management (admin only).
- **`blessingsService.js`**: API calls for managing "Blessings" (buffs/perks).
- **`bookNotes.js`**: API calls for creating and retrieving book notes.
- **`calendarService.js`**: API calls for calendar events.
- **`dailyDraftsService.js`**: LocalStorage-based service for the Daily Drafts journaling feature.
- **`layoutService.js`**: API calls for saving/loading dashboard layout preferences.
- **`personaService.js`**: API calls for managing user personas.
- **`snoopyService.js`**: API calls for the Snoopy Art collection.
- **`sportsService.js`**: API calls for Baseball/Football tracking.

### 1.4. Pages (`pages/`)
Each file corresponds to a specific route in the application.

#### Dashboard & General
- **`DashboardPage.jsx`**: The main landing page. Displays the widget grid, marquee, and quick actions.
- **`LoginPage.jsx`**: User login form.
- **`RegisterPage.jsx`**: New user registration form.
- **`SettingsPage.jsx`**: Application settings (theme, preferences).
- **`ProfilePage.jsx`**: User profile view, showing stats, badges, and collections.
- **`TerminalPage.jsx`**: A CLI-style interface for interacting with the system.

#### Productivity & Finance
- **`FinancePage.jsx`**: Legacy finance view.
- **`RichFinancePage.jsx`**: The modern, feature-rich finance dashboard (Budget, Bills, Expenses).
- **`TasksPage.jsx`**: Todo list management.
- **`HabitsPage.jsx`**: Habit tracking and streak visualization.
- **`BooksPage.jsx`**: Library management (Reading list, Finished books).
- **`BookNotesPage.jsx`**: Detailed note-taking interface for specific books.
- **`DailyDraftsPage.jsx`**: A daily journaling interface with version history.
- **`CalendarAdminPage.jsx`**: Interface for managing calendar events.

#### Fitness
- **`WorkoutPage.jsx`**: Main fitness dashboard.
- **`LogWorkoutPage.jsx`**: Interface for recording a new workout session.
- **`AdminExercisesPage.jsx`**: CRUD interface for the Exercise database.
- **`AdminTemplatesPage.jsx`**: CRUD interface for Workout Templates.
- **`SelectTemplatePage.jsx`**: Screen to choose a template before logging a workout.
- **`BulkWorkoutImportPage.jsx`**: Tool for importing workout data in bulk.
- **`BaseballTrackerPage.jsx`**: Specialized tracker for baseball stats.
- **`FootballTrackerPage.jsx`**: Specialized tracker for football stats.

#### Collections (CMS)
- **`CollectionsPage.jsx`**: Overview of all collection types.
- **`CollectionDetailPage.jsx`**: Generic view for a specific collection.
- **`PokedexPage.jsx`**: The Pokemon collection viewer.
- **`PokemonEditorPage.jsx`**: Admin tool for editing Pokemon data.
- **`AdminEditPokemonPage.jsx`**: Specific edit form for a Pokemon.
- **`HabboRareManagement.jsx`**: Admin tool for the Habbo Rares collection.
- **`SnoopyAdminPage.jsx`**: Admin tool for Snoopy Art.
- **`AdminBadgeCollectionsPage.jsx`**: Admin tool for managing Badges.
- **`VolumesPage.jsx`**: Viewer for "Volumes" (content groups).
- **`EditVolumePage.jsx`**: Editor for Volumes.
- **`VolumeWorkbenchPage.jsx`**: Advanced workspace for Volume management.

#### System
- **`AdminUserManagementPage.jsx`**: Admin panel for managing system users.
- **`BlessingsAdminPage.jsx`**: Admin panel for defining Blessings.
- **`BlessingsUsagePage.jsx`**: User view for active Blessings.
- **`ShopPage.jsx`**: The internal item shop.
- **`SpotifyStatsPage.jsx`**: Detailed Spotify listening statistics.

### 1.5. Components (`components/`)

#### Layout (`components/layout/`)
- **`AdminLayout.jsx`**: The master layout wrapper. Contains the Sidebar, Header, and Main Content Area.
- **`Header.jsx`**: Top navigation bar containing the page title and user menu.
- **`RightSidebar.jsx`**: The collapsible sidebar on the right. Hosts the Clock, Weather, and Spotify widgets.
- **`BottomNav.jsx`**: Mobile-only bottom navigation bar.

#### Dashboard Widgets (`components/dashboard/`)
- **`StatBoxRow.jsx`**: The infinite scrolling marquee at the top of the dashboard.
- **`ClockWidget.jsx`**: Analog/Digital clock with timezone support.
- **`WeatherWidget.jsx`**: Current weather display.
- **`SpotifyWidget.jsx`**: Now Playing display with playback controls.
- **`Widget.jsx`**: A generic wrapper for dashboard widgets.
- **`GlobeWidget.jsx`**: 3D Globe visualization.
- **`HabitTrackerWidget.jsx`**: Mini-view of habit streaks.
- **`SystemStatusWidget.jsx`**: Server health and uptime monitor.
- **`RecentAcquisitionsWidget.jsx`**: Showcase of recently earned items/badges.

#### UI Elements (`components/ui/`)
- **`Button.jsx` / `StyledButton.jsx`**: Standardized button components.
- **`input.jsx` / `StyledInput.jsx`**: Standardized text inputs.
- **`StyledToggle.jsx`**: Toggle switch.
- **`PageHeader.jsx`**: Consistent header for page titles and actions.
- **`GlobalToastHost.jsx`**: Container for toast notifications.

---

## 2. Server (`server/`)

The Node.js/Express backend.

### 2.1. Core
- **`server.js`**: Application entry point. Connects to MongoDB, configures middleware (CORS, JSON), and mounts routes.

### 2.2. Models (`models/`)
Mongoose schemas defining the data structure.

#### User & System
- **`User.js`**: User account data (username, password hash, roles).
- **`AbelPersonaBase.js`**: Definitions for user personas.
- **`BlessingDefinition.js`**: Rules for system "Blessings".

#### Productivity
- **`Budget.js`**: Financial budget categories and limits.
- **`MonthlyBill.js`**: Recurring bill definitions.
- **`CalendarEvent.js`**: Calendar entries.
- **`finance/`**: Directory containing specific finance transaction models.

#### Fitness
- **`ExerciseDefinition.js`**: Database of available exercises (name, muscle group).
- **`WorkoutTemplate.js`**: Saved workout routines.
- **`userSpecific/WorkoutLog.js`**: (Inferred) Records of completed workouts.

#### Collections
- **`PokemonBase.js`**: The master Pokedex database.
- **`HabboRareBase.js`**: Habbo item definitions.
- **`SnoopyArtBase.js`**: Snoopy art metadata.
- **`BadgeBase.js`**: Badge definitions.
- **`StrokesAlbum.js` / `StrokesSong.js`**: Music collection data.
- **`Volume.js`**: Volume definitions.

### 2.3. Controllers (`controllers/`)
Business logic handlers.

- **`authController.js`**: Handles Login, Register, and Token Refresh.
- **`userController.js`**: Fetches user profile and dashboard stats.
- **`taskController.js`**: CRUD for Tasks.
- **`financeController.js`**: Logic for Budgets, Bills, and Expenses.
- **`workoutLogController.js`**: Logic for logging and retrieving workouts.
- **`pokemonController.js`**: Logic for Pokedex viewing and management.
- **`spotifyController.js`**: Interacts with the Spotify Web API.

### 2.4. Routes (`routes/`)
API Endpoint definitions.

- **`authRoutes.js`**: `/api/auth/*`
- **`userRoutes.js`**: `/api/users/*`
- **`taskRoutes.js`**: `/api/tasks/*`
- **`financeRoutes.js`**: `/api/finance/*`
- **`workoutLogRoutes.js`**: `/api/workouts/*`
- **`pokemonRoutes.js`**: `/api/pokemon/*`

---

## 3. Client Mobile (`client_mobile/src`)

The React Native mobile app.

- **`screens/`**: Individual screens (Home, Workout, Habits).
- **`navigation/`**: Stack and Tab navigators.
- **`components/`**: Mobile-specific UI components.
- **`services/`**: API client (mirrors the web client's service layer).

