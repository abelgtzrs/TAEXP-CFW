import React from "react";
import PokemonSlot from "./PokemonSlot";

const TeamColumn = ({ team }) => {
  // Ensure we always have 6 slots
  const slots = [...(team || [])];
  while (slots.length < 6) {
    slots.push(null);
  }

  return (
    <div className="team-column">
      {slots.map((pokemon, index) => (
        <PokemonSlot key={index} pokemon={pokemon} />
      ))}
    </div>
  );
};

export default TeamColumn;
