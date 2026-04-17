export const NAV_ORDER_STORAGE_KEY = "tae.bottomNav.order";

export const BOTTOM_NAV_LINKS = [
  { to: "/dashboard", label: "Home", iconKey: "LayoutDashboard" },
  { to: "/profile", label: "Profile", iconKey: "User" },
  { to: "/shop", label: "Shop", iconKey: "Store" },
  { to: "/tasks", label: "Tasks", iconKey: "Clapperboard" },
  { to: "/habits", label: "Habits", iconKey: "CheckSquare" },
  { to: "/books", label: "Books", iconKey: "BookOpen" },
  { to: "/workouts", label: "Workouts", iconKey: "Dumbbell" },
  { to: "/collections", label: "Collections", iconKey: "Boxes" },
  { to: "/pokedex", label: "Pokedex", iconKey: "Image" },
  { to: "/admin/pokemon-editor", label: "Pokemon", iconKey: "PenSquare" },
  { to: "/admin/habbo-rares", label: "Habbo", iconKey: "Boxes" },
  { to: "/admin/snoopys", label: "Snoopy", iconKey: "Boxes" },
  { to: "/admin/badge-collections", label: "Badges", iconKey: "Trophy" },
  { to: "/finance", label: "Finance", iconKey: "DollarSign" },
  { to: "/finance/rich", label: "Rich", iconKey: "DollarSign" },
  { to: "/spotify-stats", label: "Spotify", iconKey: "Music" },
  { to: "/football-tracker", label: "Football", iconKey: "Trophy" },
  { to: "/baseball-tracker", label: "Baseball", iconKey: "Trophy" },
  { to: "/admin/volumes", label: "JSON", iconKey: "Library", adminOnly: true },
  { to: "/admin/volumes-mobile", label: "JSON M", iconKey: "Smartphone", adminOnly: true },
  { to: "/admin/volume-workbench", label: "Workbench", iconKey: "FileSignature", adminOnly: true },
  { to: "/admin/blessings", label: "Blessings", iconKey: "ClipboardList", adminOnly: true },
  { to: "/admin/blessings/usage", label: "Usage", iconKey: "ClipboardList", adminOnly: true },
  { to: "/daily-drafts", label: "Drafts", iconKey: "FileText", adminOnly: true },
  { to: "/admin/exercises", label: "Exercises", iconKey: "Settings", adminOnly: true },
  { to: "/admin/templates", label: "Templates", iconKey: "Settings", adminOnly: true },
  { to: "/admin/users", label: "Users", iconKey: "Users", adminOnly: true },
  { to: "/admin/calendar", label: "Calendar", iconKey: "CalendarDays", adminOnly: true },
  { to: "/settings", label: "Settings", iconKey: "Settings2", adminOnly: true },
  { to: "/terminal", label: "Terminal", iconKey: "Terminal", adminOnly: true },
];

export const getVisibleBottomNavLinks = (userRole) =>
  BOTTOM_NAV_LINKS.filter((link) => !link.adminOnly || userRole === "admin");

export const getSavedBottomNavOrder = () => {
  try {
    const raw = localStorage.getItem(NAV_ORDER_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveBottomNavOrder = (orderedPaths) => {
  localStorage.setItem(NAV_ORDER_STORAGE_KEY, JSON.stringify(orderedPaths));
};

export const clearBottomNavOrder = () => {
  localStorage.removeItem(NAV_ORDER_STORAGE_KEY);
};

export const applyBottomNavOrder = (links, orderedPaths) => {
  if (!Array.isArray(orderedPaths) || orderedPaths.length === 0) return links;

  const byPath = new Map(links.map((link) => [link.to, link]));
  const ordered = [];

  orderedPaths.forEach((path) => {
    const link = byPath.get(path);
    if (link) ordered.push(link);
    byPath.delete(path);
  });

  byPath.forEach((link) => ordered.push(link));
  return ordered;
};
