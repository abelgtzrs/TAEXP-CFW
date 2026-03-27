// Core server dependencies
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");

// Auth middleware for protected routes
const { protect, authorize } = require("./middleware/authMiddleware");

// Pre-load all models to ensure they're available when routes need them
// Base models (shared data)
require("./models/User");
require("./models/PokemonBase");
require("./models/SnoopyArtBase");
require("./models/BadgeBase");
require("./models/TitleBase");
require("./models/HabboRareBase");
require("./models/YugiohCardBase");
require("./models/AbelPersonaBase");
require("./models/ExerciseDefinition");
require("./models/SpotifyLogs");
require("./models/Volume");
require("./models/WorkoutTemplate");
// Calendar models
require("./models/CalendarEvent");
require("./models/MonthlyBill");
require("./models/YearlyEvent");

// Finance models
require("./models/finance/FinancialCategory");
require("./models/finance/FinancialTransaction");
require("./models/finance/RecurringBill");
require("./models/finance/Budget");
require("./models/finance/Debt");
require("./models/finance/DebtAccount");
require("./models/finance/FinancialGoal");
require("./models/finance/FinancialActionLog");

// User-specific models (personal collections)
require("./models/userSpecific/userPokemon");
require("./models/userSpecific/userSnoopyArt");
require("./models/userSpecific/userBadge");
require("./models/userSpecific/userTitle");
require("./models/userSpecific/userHabboRare");
require("./models/userSpecific/userYugiohCard");

// Strokes models (music)
require("./models/StrokesAlbum");
require("./models/StrokesSong");

const strokesRoutes = require("./routes/strokesRoutes");
const User = require("./models/User");
const { syncRecentTracksForUser } = require("./controllers/spotifyController");
// Initialize app and database connection
dotenv.config();
const app = express();
connectDB();

const SPOTIFY_AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;
let spotifyAutoSyncRunning = false;

const runSpotifyAutoSync = async () => {
  if (spotifyAutoSyncRunning) {
    console.log("[Spotify AutoSync] Previous cycle still running, skipping this tick.");
    return;
  }

  spotifyAutoSyncRunning = true;
  try {
    const connectedUsers = await User.find({ spotifyConnected: true, spotifyRefreshToken: { $exists: true, $ne: null } })
      .select("_id username")
      .lean();

    if (!connectedUsers.length) {
      console.log("[Spotify AutoSync] No connected Spotify users to sync.");
      return;
    }

    let totalNewTracks = 0;
    for (const user of connectedUsers) {
      try {
        const result = await syncRecentTracksForUser(user._id);
        totalNewTracks += result.newTracks || 0;
      } catch (error) {
        console.error(
          `[Spotify AutoSync] User ${user.username || user._id} sync failed:`,
          error.response?.data || error.message || error,
        );
      }
    }

    console.log(
      `[Spotify AutoSync] Synced ${connectedUsers.length} user(s), ${totalNewTracks} new track(s) logged at ${new Date().toISOString()}`,
    );
  } catch (error) {
    console.error("[Spotify AutoSync] Cycle failed:", error.message || error);
  } finally {
    spotifyAutoSyncRunning = false;
  }
};

// Essential middleware stack
const rawOrigins = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS;
let allowedOrigins;
if (rawOrigins) {
  allowedOrigins = rawOrigins
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
} else {
  allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    // Expo / Metro typical dev origins
    "http://localhost:8081", // Metro dev server (native)
    "http://localhost:19006", // Expo web dev server
    // Deployed origins
    "https://taexp3-0.onrender.com", // API self
    "https://taexp-3-0.vercel.app", // Deployed frontend
    "https://taexp.netlify.app", // Netlify public site
  ];
}

// Helper: allow any localhost/127.0.0.1 port in dev to ease Expo + web testing
const isDevLocalOrigin = (origin) => /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser or same-origin requests (like server-to-server without origin header)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || isDevLocalOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions)); // Removed explicit app.options("*", ...) to avoid path-to-regexp v6 wildcard error under Express 5
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Parse form data

// Additional permissive CORS just for public read-only endpoints (no credentials)
app.use(
  "/api/public",
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      // Reuse the allowedOrigins list plus allow any localhost for dev convenience
      if (
        allowedOrigins.includes(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS public blocked for origin: ${origin}`));
    },
    credentials: false,
    // Allow simple GET plus HEAD for curl -I tests and OPTIONS for any future preflights
    methods: ["GET", "HEAD", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
  })
);

// --- Serve static files from multiple directories ---
// Profile pictures and user uploads
app.use("/uploads", express.static("public/uploads"));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// General static assets
app.use(express.static("public")); // Serve uploaded files (avatars, etc.)
app.use(express.static(path.join(__dirname, "../public"))); // Serve public assets (habbo rares, pokemon, etc.)

// Serve built client applications
app.use(express.static(path.join(__dirname, "../client_admin/dist")));
app.use(express.static(path.join(__dirname, "../client_public/dist")));

// Health check endpoint
app.get("/", (req, res) => {
  res.send("The Abel Experience™ API is running...");
});

// API route configuration
// Auth & user management
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

// Activity tracking (habits, books, workouts)
app.use("/api/habits", require("./routes/habitRoutes"));
app.use("/api/books", require("./routes/bookRoutes"));
app.use("/api/workouts", require("./routes/workoutLogRoutes"));
app.use("/api/exercises", require("./routes/exerciseDefinitionRoutes"));
app.use("/api/workout-templates", require("./routes/workoutTemplateRoutes"));
app.use("/api/tasks", require("./routes/taskRoutes"));

// Shop & collections system
app.use("/api/shop", require("./routes/shopRoutes"));
app.use("/api/pokemon", require("./routes/pokemonRoutes"));
app.use("/api/badges", require("./routes/badgeRoutes"));

// Public content & volumes
app.use("/api/public", require("./routes/publicRoutes"));

// Admin-only routes (protected with middleware)
app.use("/api/admin/volumes", require("./routes/volumeRoutes"));
app.use("/api/admin/workout-templates", require("./routes/workoutTemplateRoutes"));
app.use("/api/admin/exercises", protect, authorize("admin"), require("./routes/exerciseAdminRoutes"));
app.use("/api/admin/pokemon", protect, authorize("admin"), require("./routes/pokemonAdminRoutes"));
app.use("/api/admin/habbo-rares", require("./routes/habboRareAdminRoutes"));
app.use("/api/admin/snoopys", require("./routes/snoopyAdminRoutes"));
app.use("/api/admin/blessings", require("./routes/blessingDefinitionRoutes"));
app.use("/api/admin/personas", require("./routes/personaAdminRoutes"));
app.use("/api/admin/badge-collections", require("./routes/badgeAdminRoutes"));
app.use("/api/admin", require("./routes/adminUserRoutes"));

// External integrations & additional features
app.use("/api/spotify", require("./routes/spotifyRoutes"));
app.use("/api/finance", require("./routes/financeRoutes"));
app.use("/api/strokes", strokesRoutes);
app.use("/api/sports", require("./routes/sportsRoutes"));
app.use("/api/calendar", require("./routes/calendarRoutes"));

// Catch-all middleware: send back React's index.html file for client-side routing
app.use((req, res, next) => {
  // If the request is for an API route that doesn't exist, return 404
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: "API route not found" });
  }

  // For all other routes, serve the React app
  res.sendFile(path.join(__dirname, "../client_admin/dist/index.html"));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Welcome to the T43XP API!
The Abel Experience™ API is now operational.
Temporal Sync Initialized @ ${new Date().toLocaleTimeString()}
Listening on http://localhost:${PORT}
`);

  if (process.env.SPOTIFY_AUTO_SYNC_DISABLED !== "true") {
    console.log("[Spotify AutoSync] Enabled (every 5 minutes).");
    setTimeout(runSpotifyAutoSync, 60 * 1000);
    setInterval(runSpotifyAutoSync, SPOTIFY_AUTO_SYNC_INTERVAL_MS);
  } else {
    console.log("[Spotify AutoSync] Disabled via SPOTIFY_AUTO_SYNC_DISABLED=true");
  }
});
