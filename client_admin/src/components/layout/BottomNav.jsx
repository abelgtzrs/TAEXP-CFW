import { NavLink } from "react-router-dom";
import { LayoutDashboard, CheckSquare, Clapperboard, Menu, Dumbbell, User, BookOpen, Smartphone } from "lucide-react";

const BottomNavItem = ({ to, icon: Icon, label, onClick }) => {
  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex flex-col items-center justify-center w-full h-full text-text-secondary hover:text-white transition-colors"
      >
        <Icon size={20} />
        <span className="text-[10px] mt-1">{label}</span>
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center w-full h-full transition-colors ${
          isActive ? "text-primary" : "text-text-secondary hover:text-white"
        }`
      }
    >
      <Icon size={20} />
      <span className="text-[10px] mt-1">{label}</span>
    </NavLink>
  );
};

const BottomNav = ({ onMenuClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 h-14 bg-surface/90 backdrop-blur-md border-t border-gray-700/50 flex items-center justify-around z-50 lg:hidden pb-safe">
      <BottomNavItem to="/dashboard" icon={LayoutDashboard} label="Home" />
      <BottomNavItem to="/habits" icon={CheckSquare} label="Habits" />
      <BottomNavItem to="/workouts" icon={Dumbbell} label="Workouts" />
      <BottomNavItem to="/books" icon={BookOpen} label="Books" />
      <BottomNavItem to="/admin/volumes-mobile" icon={Smartphone} label="JSON" />
      <BottomNavItem icon={Menu} label="Menu" onClick={onMenuClick} />
    </div>
  );
};

export default BottomNav;
