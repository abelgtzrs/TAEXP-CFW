import React from "react";

const PokemonSlot = ({ pokemon }) => {
  if (!pokemon) {
    return (
      <div className="pokemon-slot empty">
        <div className="slot-info">
          <div className="slot-name">Empty</div>
        </div>
        <div className="slot-sprite"></div>
      </div>
    );
  }

  const { species, nickname, level, gender, nature, shiny, stats, sprite, hp } = pokemon;
  const displayName = nickname || species;

  // HP Calculation
  const currentHp = hp?.current || 0;
  const maxHp = hp?.max || 1;
  const hpPercent = Math.min(100, Math.max(0, (currentHp / maxHp) * 100));

  let hpColor = "#4caf50"; // Green
  if (hpPercent <= 20) hpColor = "#f44336"; // Red
  else if (hpPercent <= 50) hpColor = "#ffeb3b"; // Yellow

  return (
    <div className={`pokemon-slot ${shiny ? "shiny" : ""}`}>
      <div className="slot-info">
        <div className="slot-header">
          <div className="slot-name">
            {displayName} {shiny && "✨"}
          </div>
          <div className="slot-meta">
            Lvl {level} {gender === "Male" ? "♂" : gender === "Female" ? "♀" : ""}
          </div>
        </div>

        <div className="hp-container">
          <div className="hp-bar-bg">
            <div className="hp-bar-fill" style={{ width: `${hpPercent}%`, backgroundColor: hpColor }} />
          </div>
          <div className="hp-text">
            {currentHp}/{maxHp}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-item">
            <span>ATK</span> {stats?.atk || "-"}
          </div>
          <div className="stat-item">
            <span>DEF</span> {stats?.def || "-"}
          </div>
          <div className="stat-item">
            <span>SPA</span> {stats?.spa || "-"}
          </div>
          <div className="stat-item">
            <span>SPD</span> {stats?.spd || "-"}
          </div>
          <div className="stat-item">
            <span>SPE</span> {stats?.spe || "-"}
          </div>
          <div className="stat-item">
            <span>BST</span> {stats?.total || "-"}
          </div>
        </div>

        <div className="nature-info">{nature}</div>
      </div>
      <div className="slot-sprite">{sprite && <img src={sprite} alt={species} className="sprite-img" />}</div>
    </div>
  );
};

export default PokemonSlot;
