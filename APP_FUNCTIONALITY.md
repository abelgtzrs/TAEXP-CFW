# Abel Experience Dashboard - Functionality Overview

This document provides a comprehensive description of the functionality and modules within the Abel Experience Dashboard ecosystem.

## 1. System Overview
The **Abel Experience Dashboard** is a multi-faceted personal management system designed to track, organize, and gamify various aspects of life. It serves as a central hub for productivity, fitness, financial tracking, and digital collections.

The system consists of three main client interfaces:
- **Admin Dashboard (Web)**: The primary interface for management and data entry.
- **Mobile App**: A companion app for on-the-go tracking (workouts, habits).
- **Public Site**: A public-facing view of specific collections or data.

## 2. Core Modules

### 2.1. Dashboard & Home
The landing page serves as a command center, featuring:
- **Live Widgets**: Real-time Clock, Weather, and Spotify playback status.
- **Statistics Marquee**: An infinitely scrolling ticker showing daily tasks, budget status, workout counts, and other key metrics.
- **Quick Actions**: Immediate access to common tasks.

### 2.2. Productivity & Finance
Tools to manage daily life and resources.
- **Finance**: Comprehensive budget tracking, monthly bill management, and expense logging.
- **Tasks**: A todo list system to track daily and long-term tasks.
- **Daily Drafts**: A journaling system for capturing daily thoughts and notes with version history.
- **Calendar**: Event scheduling and management.
- **Habits**: A streak-based habit tracker to build consistency.
- **Books**: A library tracker for reading lists and detailed book notes.

### 2.3. Fitness & Health
A robust suite for physical training.
- **Workouts**: Log workout sessions, track sets/reps/weight.
- **Templates**: Create and reuse workout routines.
- **Exercises**: A database of exercises with muscle group targeting.
- **Sports Trackers**: Specialized trackers for Baseball and Football statistics.

### 2.4. Collections (CMS)
A content management system for various digital collectibles and interests.
- **Pokemon**: A custom Pokedex managing sprites (including Gen 5/6 animations) and data.
- **Habbo Rares**: A catalog of rare items from Habbo Hotel.
- **Snoopy Art**: A gallery of Snoopy-themed artwork.
- **Badges**: A system for earning and displaying digital badges.
- **Personas**: Management of different user personas or profiles.
- **Strokes**: (Likely music/album art collection based on "StrokesAlbum").
- **Volumes**: A content organization system for grouping related items.

### 2.5. System & Gamification
Features that add a layer of engagement and administration.
- **Shop**: An internal marketplace (likely using virtual currency or points).
- **Blessings**: A system for managing "buffs" or special statuses.
- **Terminal**: A built-in command-line interface for advanced system interaction.
- **User Management**: Admin tools for managing users and permissions.
- **Settings**: Global application configuration.

## 3. Technical Architecture

### Frontend (Client Admin)
- **Framework**: React (Vite)
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Visualization**: Recharts (for graphs), Framer Motion (for animations)

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose ODM)
- **API**: RESTful endpoints organized by domain (Finance, Fitness, Collections, etc.)

### Mobile
- **Framework**: React Native (Expo)

## 4. Data Flow
1.  **Data Entry**: User inputs data via the Admin Dashboard or Mobile App.
2.  **Processing**: The Node.js server validates and processes requests.
3.  **Storage**: Data is persisted in MongoDB.
4.  **Feedback**: The Dashboard updates in real-time (or on refresh) to reflect new stats (e.g., "Tasks Completed Today" in the marquee).

## 5. Recent Updates
- **Responsive Sidebar**: The right sidebar (Clock, Weather, Spotify) now uses a flexbox layout to perfectly fit any screen height without manual resizing.
- **Infinite Stats Marquee**: The dashboard statistics now scroll infinitely to display more data in a compact space.
