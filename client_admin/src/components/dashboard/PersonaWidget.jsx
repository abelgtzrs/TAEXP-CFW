import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import Widget from "../ui/Widget";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const PersonaWidget = () => {
  const { user, setUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // The unlockedPersonas array should now be populated with full objects
  const unlockedPersonas = user?.unlockedAbelPersonas || [];
  const activePersona = user?.activeAbelPersona || null;
  const activePersonaId = activePersona?._id || null;

  // Debug logging
  console.log("PersonaWidget - unlockedPersonas:", unlockedPersonas);
  console.log("PersonaWidget - activePersona:", activePersona);

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + window.scrollY + 4,
        left: buttonRect.left + window.scrollX,
        width: buttonRect.width,
      });
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPersona = async (personaId) => {
    if (personaId === activePersonaId) {
      setIsOpen(false);
      return;
    }

    try {
      const response = await api.put("/users/me/profile/active-persona", { personaId });
      setUser(response.data.data);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to set active persona:", error);
      alert("Could not set active Archetype.");
    }
  };

  const getDisplayName = () => {
    return activePersona ? activePersona.name : "Standard Issue";
  };

  const getDisplayDescription = () => {
    return activePersona ? activePersona.description : "Default theme";
  };

  const DropdownMenu = () => (
    <div
      ref={dropdownRef}
      className="fixed bg-surface border-2 border-gray-700 rounded-lg shadow-lg z-[9999] max-h-60 overflow-y-auto"
      style={{
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
      }}
    >
      {/* Default/Standard Issue Option */}
      <button
        onClick={() => handleSelectPersona(null)}
        className={`w-full p-3 text-left hover:bg-gray-700 transition-all duration-200 border-b border-gray-700 last:border-b-0
          ${!activePersonaId ? "bg-primary/20" : ""}`}
      >
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-text-main">Standard Issue</span>
          {!activePersonaId && <span className="text-primary text-xs">●</span>}
        </div>
        <p className="text-xs text-text-secondary mt-1">Default theme.</p>
      </button>

      {/* Map over unlocked personas */}
      {unlockedPersonas.map((persona) => {
        const isActive = activePersonaId === persona._id;
        return (
          <button
            key={persona._id}
            onClick={() => handleSelectPersona(persona._id)}
            className={`w-full p-3 text-left hover:bg-gray-700 transition-all duration-200 border-b border-gray-700 last:border-b-0
              ${isActive ? "bg-opacity-20" : ""}`}
            style={{
              backgroundColor: isActive ? `${persona.colors?.primary}20` : "",
            }}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-text-main">{persona.name}</span>
              {isActive && (
                <span className="text-xs" style={{ color: persona.colors?.primary || "#2DD4BF" }}>
                  ●
                </span>
              )}
            </div>
            <p className="text-xs text-text-secondary mt-1 truncate">{persona.description}</p>
          </button>
        );
      })}
    </div>
  );

  return (
    <Widget title="Active Archetype">
      <div className="relative">
        {/* Dropdown Button */}
        <button
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-3 rounded-lg border-2 border-gray-700 hover:border-gray-500 bg-surface text-left transition-all duration-200 flex items-center justify-between"
          style={{
            borderColor: activePersona?.colors?.primary || "",
            backgroundColor: activePersona?.colors?.primary ? `${activePersona.colors.primary}20` : "",
          }}
        >
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-text-main">{getDisplayName()}</span>
              <ChevronDown
                size={16}
                className={`text-primary transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                style={{ color: activePersona?.colors?.primary || "" }}
              />
            </div>
            <p className="text-xs text-text-secondary mt-1 truncate">{getDisplayDescription()}</p>
          </div>
        </button>

        {/* Dropdown Menu rendered as Portal */}
        {isOpen && createPortal(<DropdownMenu />, document.body)}
      </div>
    </Widget>
  );
};

export default PersonaWidget;
