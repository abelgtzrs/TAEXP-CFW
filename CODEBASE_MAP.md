# Codebase Map & Interaction Guide

This document provides a comprehensive overview of the file structure across the entire **Abel Experience Dashboard** ecosystem and explains how the different parts interact.

## 1. High-Level Architecture

The project is a monorepo-style workspace containing:
- **`server/`**: The Node.js/Express backend API and MongoDB database connection.
- **`client_admin/`**: The React-based web dashboard for administration and desktop use.
- **`client_mobile/`**: The React Native mobile application.
- **`client_public/`**: A public-facing web view (limited scope).

---

## 2. Server (`/server`)

The server is the brain of the operation, handling data persistence, authentication, and business logic.

### Key Directories & Files
- **`server.js`**: The entry point. Initializes Express, connects to MongoDB, and mounts routes.
- **`routes/`**: Defines API endpoints (e.g., `GET /api/tasks`). Maps URLs to Controller functions.
- **`controllers/`**: Contains the business logic. Receives requests, talks to Models, and sends responses.
- **`models/`**: Mongoose schemas defining the data structure (e.g., User, Task, Workout).

### Interaction Flow (Backend)
1.  **Request**: `GET /api/workouts` hits `server.js`.
2.  **Route**: `server.js` delegates to `routes/workoutLogRoutes.js`.
3.  **Controller**: Route calls `getWorkouts` in `controllers/workoutLogController.js`.
4.  **Model**: Controller queries `models/userSpecific/WorkoutLog.js`.
5.  **Response**: Data is returned as JSON.

---

## 3. Client Admin (`/client_admin`)

The primary interface for managing the system. Built with React and Vite.

### Key Directories & Files
- **`src/main.jsx`**: Entry point. Wraps the app in Providers (Auth, Theme).
- **`src/App.jsx`**: The Router. Maps URLs (`/dashboard`, `/finance`) to Page components.
- **`src/services/api.js`**: The Axios instance. Configured with base URL and interceptors (for JWT tokens).
- **`src/context/`**: Global state management (AuthContext for user session).
- **`src/pages/`**: Full-page views (e.g., `DashboardPage.jsx`, `FinancePage.jsx`).
- **`src/components/`**: Reusable UI elements.
    - **`layout/`**: `AdminLayout.jsx` (Sidebar + Header), `RightSidebar.jsx` (Widgets).
    - **`dashboard/`**: Specific widgets like `StatBoxRow.jsx`, `ClockWidget.jsx`.

### Interaction Flow (Frontend -> Backend)
1.  **User Action**: User clicks "Save Task" on `TasksPage.jsx`.
2.  **Service Call**: Component calls `createTask(data)` from `services/taskService.js` (or direct `api.post`).
3.  **API Request**: `api.js` sends HTTP POST to `http://localhost:5000/api/tasks`.
4.  **State Update**: On success, the component updates local state or refetches data to show the new task.

---

## 4. Client Mobile (`/client_mobile`)

The mobile companion app for on-the-go tracking.

### Key Directories
- **`src/navigation/`**: Handles screen transitions (Stack/Tab navigators).
- **`src/screens/`**: Mobile-optimized views (e.g., `WorkoutScreen.js`).
- **`src/services/`**: Similar to the web client, handles API communication.

---

## 5. Key Interaction Patterns

### Authentication
1.  **Login**: User submits credentials on `LoginPage.jsx`.
2.  **Server**: `authController.js` verifies password and issues a JWT.
3.  **Client**: `AuthContext.jsx` saves the JWT in localStorage.
4.  **Subsequent Requests**: `api.js` automatically attaches `Authorization: Bearer <token>` to every request.

### Dashboard Data Loading
1.  **Mount**: `DashboardPage.jsx` mounts.
2.  **Fetch**: Calls `userController.getDashboardStats`.
3.  **Aggregation**: Server aggregates data from `Task`, `Budget`, `WorkoutLog` models.
4.  **Display**: Data is passed to `StatBoxRow.jsx` (marquee) and `RightSidebar.jsx` (widgets).

### Real-time / Polling
- **Widgets**: Components like `SpotifyWidget.jsx` or `ClockWidget.jsx` may use internal intervals (`setInterval`) to update their display or poll the server for fresh status.

---

## 6. File-Specific Roles (Examples)

| File | Role | Interaction |
| :--- | :--- | :--- |
| `server/models/User.js` | Defines User schema | Used by `authController` for login/register. |
| `client_admin/src/context/LayoutContext.jsx` | Manages UI state | Toggles Sidebar/RightSidebar visibility across all pages. |
| `server/controllers/pokemonController.js` | Pokedex logic | Fetches data from `PokemonBase` model for the Pokedex page. |
| `client_admin/src/components/layout/RightSidebar.jsx` | Widget Container | Hosts Clock, Weather, Spotify. Uses Flexbox for responsive layout. |

