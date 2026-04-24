import { useRef, useCallback, useEffect } from "react";
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

const BottomNavItem = ({ to, icon: Icon, label, onClick, dragging }) => {
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
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onClick={(e) => { if (dragging.current) e.preventDefault(); }}
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

  // Drag-to-scroll with momentum
  const scrollRef = useRef(null);
  const dragging = useRef(false);
  const drag = useRef({ active: false, startX: 0, scrollLeft: 0, lastX: 0, lastT: 0, velocity: 0 });
  const momentumRef = useRef(null);

  const cancelMomentum = () => {
    if (momentumRef.current) {
      cancelAnimationFrame(momentumRef.current);
      momentumRef.current = null;
    }
  };

  const onPointerDown = useCallback((e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const el = scrollRef.current;
    if (!el) return;
    cancelMomentum();
    dragging.current = false;
    drag.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft, lastX: e.clientX, lastT: performance.now(), velocity: 0 };
    el.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, []);

  const onPointerMove = useCallback((e) => {
    if (!drag.current.active) return;
    const now = performance.now();
    const dx = e.clientX - drag.current.startX;
    const dt = now - drag.current.lastT;
    // Track instantaneous velocity (px/ms), smoothed slightly
    if (dt > 0) {
      const instant = (drag.current.lastX - e.clientX) / dt;
      drag.current.velocity = drag.current.velocity * 0.6 + instant * 0.4;
    }
    drag.current.lastX = e.clientX;
    drag.current.lastT = now;
    if (Math.abs(dx) > 4) dragging.current = true;
    scrollRef.current.scrollLeft = drag.current.scrollLeft - dx;
  }, []);

  const onPointerUp = useCallback(() => {
    drag.current.active = false;
    setTimeout(() => { dragging.current = false; }, 0);
    // Launch momentum animation
    let velocity = drag.current.velocity; // px/ms
    const friction = 0.92; // multiplied each frame (~60fps → decays nicely)
    const el = scrollRef.current;
    if (!el || Math.abs(velocity) < 0.05) return;
    const step = () => {
      velocity *= friction;
      el.scrollLeft += velocity * 16; // ~16ms per frame
      if (Math.abs(velocity) > 0.01) {
        momentumRef.current = requestAnimationFrame(step);
      } else {
        momentumRef.current = null;
      }
    };
    momentumRef.current = requestAnimationFrame(step);
  }, []);

  // Wheel → smooth horizontal scroll (non-passive so we can preventDefault)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      e.preventDefault();
      cancelMomentum();
      // Launch a short momentum burst in the wheel direction
      let velocity = e.deltaY * 0.04; // scale wheel delta to px/ms
      const friction = 0.88;
      const step = () => {
        velocity *= friction;
        el.scrollLeft += velocity * 16;
        if (Math.abs(velocity) > 0.01) {
          momentumRef.current = requestAnimationFrame(step);
        } else {
          momentumRef.current = null;
        }
      };
      momentumRef.current = requestAnimationFrame(step);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md border-t border-gray-700/50 pb-safe">
      <div className="h-14 flex items-stretch">
        <div className="h-full border-r border-gray-700/50 shrink-0">
          <BottomNavItem icon={Menu} label="Menu" onClick={onMenuClick} />
        </div>
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-hide cursor-grab active:cursor-grabbing select-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <div className="h-full flex items-center w-max min-w-full">
            {links.map((item) => (
              <BottomNavItem
                key={item.to}
                to={item.to}
                icon={iconMap[item.iconKey] || LayoutDashboard}
                label={item.label}
                dragging={dragging}
              />
            ))}
            <BottomNavItem to="/settings/bottom-nav-order" icon={SlidersHorizontal} label="Organize" dragging={dragging} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;
