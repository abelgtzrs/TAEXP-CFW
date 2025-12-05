# App Functionality Diagram

This document outlines the high-level architecture and functionality of the Abel Experience Dashboard application, including its clients, server modules, and data models.

```mermaid
graph TD
    subgraph Clients
        Admin[Admin Dashboard (Web)]
        Mobile[Mobile App]
        Public[Public Site]
    end

    subgraph Server [Node.js Server]
        Auth[Authentication & Users]

        subgraph "Productivity & Life"
            Finance[Finance API]
            Habits[Habits API]
            Tasks[Tasks API]
            Calendar[Calendar API]
            Books[Books API]
        end

        subgraph "Fitness & Health"
            Workouts[Workouts API]
            Exercises[Exercises API]
        end

        subgraph "Content & Collections (CMS)"
            Pokemon[Pokemon API]
            Habbo[Habbo Rares API]
            Snoopy[Snoopy Art API]
            Badges[Badges API]
            Personas[Personas API]
            Strokes[Strokes API]
            Volumes[Volumes API]
        end

        subgraph "Entertainment & Stats"
            Spotify[Spotify API]
            Sports[Sports API]
        end

        subgraph "System & Gamification"
            Shop[Shop API]
            Blessings[Blessings API]
        end
    end

    subgraph Database [MongoDB Models]
        UserModels[User, Profile]
        ProdModels[Budget, MonthlyBill, CalendarEvent, Book, BookNote]
        FitModels[ExerciseDefinition, WorkoutTemplate, Logs]
        CollModels[PokemonBase, HabboRareBase, SnoopyArtBase, BadgeBase, AbelPersonaBase, StrokesAlbum]
        EntModels[SpotifyLogs]
        SysModels[BlessingDefinition, Volume]
    end

    %% Client to Server Connections
    Admin --> Auth
    Admin --> Finance
    Admin --> Habits
    Admin --> Tasks
    Admin --> Calendar
    Admin --> Books
    Admin --> Workouts
    Admin --> Exercises
    Admin --> Pokemon
    Admin --> Habbo
    Admin --> Snoopy
    Admin --> Badges
    Admin --> Personas
    Admin --> Strokes
    Admin --> Volumes
    Admin --> Spotify
    Admin --> Sports
    Admin --> Shop
    Admin --> Blessings

    Mobile --> Auth
    Mobile --> Habits
    Mobile --> Books
    Mobile --> Workouts
    Mobile --> Shop
    Mobile --> Badges

    Public --> Auth

    %% Server to Database Connections
    Auth --> UserModels
    Finance --> ProdModels
    Habits --> ProdModels
    Tasks --> ProdModels
    Calendar --> ProdModels
    Books --> ProdModels
    Workouts --> FitModels
    Exercises --> FitModels
    Pokemon --> CollModels
    Habbo --> CollModels
    Snoopy --> CollModels
    Badges --> CollModels
    Personas --> CollModels
    Strokes --> CollModels
    Volumes --> SysModels
    Spotify --> EntModels
    Blessings --> SysModels
```

## Module Breakdown

### 1. Clients

- **Admin Dashboard**: The primary interface for managing all aspects of the application. It includes comprehensive tools for CMS, fitness tracking, finance, and system settings.
- **Mobile App**: A companion app focused on personal tracking (Workouts, Habits, Books) and viewing collections.
- **Public Site**: A public-facing interface (scope limited based on current file structure).

### 2. Server Modules

- **Authentication**: Handles user registration, login, and role management.
- **Productivity**: Manages personal data like budgets, bills, habits, tasks, calendar events, and reading lists.
- **Fitness**: Tracks exercises, workout templates, and logs.
- **Content Management (CMS)**: Manages various collections like Pokemon, Habbo Rares, Snoopy Art, Badges, and Personas.
- **Entertainment**: Integrates with Spotify and tracks sports statistics.
- **System**: Handles gamification elements (Blessings, Shop) and content organization (Volumes).

### 3. Database

- **MongoDB**: Stores all application data using Mongoose models corresponding to the server modules.
