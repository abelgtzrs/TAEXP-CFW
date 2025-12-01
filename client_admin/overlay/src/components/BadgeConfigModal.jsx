import React, { useState, useEffect } from "react";
import { BADGES } from "../utils/badgeLookup";

const BadgeConfigModal = ({ isOpen, onClose, currentImages, onSave }) => {
  const [localImages, setLocalImages] = useState({});

  useEffect(() => {
    if (isOpen) {
      setLocalImages(currentImages || {});
    }
  }, [isOpen, currentImages]);

  if (!isOpen) return null;

  const handleChange = (name, value) => {
    setLocalImages((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(localImages);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Configure Badge Images</h2>
        <div className="badge-grid-inputs">
          {BADGES.map((badge) => (
            <div key={badge.name} className="badge-input-group">
              <div className="badge-label-row">
                <label>{badge.name}</label>
                {localImages[badge.name] && (
                  <img src={localImages[badge.name]} alt="preview" className="badge-preview-small" />
                )}
              </div>
              <input
                type="text"
                className="badge-url-input"
                value={localImages[badge.name] || ""}
                onChange={(e) => handleChange(badge.name, e.target.value)}
                placeholder="Image URL..."
              />
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-save" onClick={handleSave}>
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default BadgeConfigModal;
