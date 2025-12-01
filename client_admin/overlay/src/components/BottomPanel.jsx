import React from "react";

const BottomPanel = ({ location, events }) => {
  return (
    <div className="bottom-panel">
      <div className="location-box">
        <div className="location-label">Current Location</div>
        <div className="location-value">{location || "Unknown"}</div>
      </div>
      <div className="events-box">
        {events &&
          events.map((event, index) => (
            <div key={index} className="event-item">
              {index === 0 ? "> " : ""}
              {event}
            </div>
          ))}
      </div>
    </div>
  );
};

export default BottomPanel;
