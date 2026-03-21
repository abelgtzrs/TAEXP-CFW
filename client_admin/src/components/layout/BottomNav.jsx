import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard,
  User,
  Store,
  Clapperboard,
  CheckSquare,
  BookOpen,
  Dumbbell,
  Boxes,
  Image,
  PenSquare,
  Trophy,
  DollarSign,
  Music,
  Library,
  Smartphone,
  FileSignature,
  ClipboardList,
  FileText,
  Settings,
  Users,
  CalendarDays,
  Settings2,
  Terminal,
  SlidersHorizontal,
  Menu,
} from "lucide-react";
import { applyBottomNavOrder, getSavedBottomNavOrder, getVisibleBottomNavLinks } from "./bottomNavConfig";

const BottomNavItem = ({ to, icon: Icon, label, onClick }) => {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="shrink-0 min-w-[68px] h-full px-2 flex flex-col items-center justify-center text-text-secondary hover:text-white transition-colors"
      >
        <Icon size={18} />
        <span className="text-[10px] mt-1 whitespace-nowrap">{label}</span>
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `shrink-0 min-w-[68px] h-full px-2 flex flex-col items-center justify-center transition-colors ${
          isActive ? "text-primary" : "text-text-secondary hover:text-white"
        }`
      }
    >
      <Icon size={18} />
      <span className="text-[10px] mt-1 whitespace-nowrap">{label}</span>
    </NavLink>
  );
};

const BottomNav = ({ onMenuClick }) => {
  const { user } = useAuth();

  const iconMap = {
    LayoutDashboard,
    User,
    Store,
    Clapperboard,
    CheckSquare,
    BookOpen,
    Dumbbell,
    Boxes,
    Image,
    PenSquare,
    Trophy,
    DollarSign,
    Music,
    Library,
    Smartphone,
    FileSignature,
    ClipboardList,
    FileText,
    Settings,
    Users,
    CalendarDays,
    Settings2,
    Terminal,
  };

  const visibleLinks = getVisibleBottomNavLinks(user?.role);
  const savedOrder = getSavedBottomNavOrder();
  const links = applyBottomNavOrder(visibleLinks, savedOrder);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface/90 backdrop-blur-md border-t border-gray-700/50 pb-safe">
      <div className="h-14 flex items-stretch">
        <div className="h-full border-r border-gray-700/50 shrink-0">
          <BottomNavItem icon={Menu} label="Menu" onClick={onMenuClick} />
        </div>
        <div className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide">
          <div className="h-full flex items-center w-max min-w-full">
            {links.map((item) => (
              <BottomNavItem
                key={item.to}
                to={item.to}
                icon={iconMap[item.iconKey] || LayoutDashboard}
                label={item.label}
              />
            ))}
            <BottomNavItem to="/settings/bottom-nav-order" icon={SlidersHorizontal} label="Organize" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
