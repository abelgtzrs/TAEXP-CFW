import { useEffect, useMemo, useRef, useState } from "react";

const PokemonPopover = ({ displayedPokemon = [], serverBaseUrl }) => {
  const [pokemonOpen, setPokemonOpen] = useState(false);
  const [useGen6Sprites, setUseGen6Sprites] = useState(false);
  const teamHoverTimer = useRef(null);
  const spriteSize = 72;
  const containerRef = useRef(null);
  const rafRef = useRef(0);
  const [actors, setActors] = useState([]);

  const displayedTeam = useMemo(() => (displayedPokemon || []).slice(0, 6), [displayedPokemon]);

  const getPokemonSprite = (basePokemon) => {
    if (!basePokemon) return null;
    const firstForm = basePokemon.forms?.[0];
    const sprite = useGen6Sprites
      ? firstForm?.spriteGen6Animated || firstForm?.spriteGen5Animated || null
      : firstForm?.spriteGen5Animated || firstForm?.spriteGen6Animated || null;
    return sprite ? `${serverBaseUrl}${sprite}` : null;
  };

  useEffect(() => {
    const team = displayedTeam;
    const el = containerRef.current;
    if (!pokemonOpen || !el || team.length === 0) return;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const padding = 8;
    const groundY = Math.max(height - spriteSize - padding, 0);
    const init = team.map((p, i) => {
      const x = Math.random() * Math.max(width - spriteSize, 0);
      const jitter = (Math.random() - 0.5) * 6;
      const y = Math.max(groundY + jitter, 0);
      const speed = 0.6 + Math.random() * 1.0;
      const dir = Math.random() < 0.5 ? -1 : 1;
      const vx = dir * speed;
      const vy = 0;
      const hopStrength = 4.4 + Math.random() * 2.2;
      const hopCooldown = 45 + Math.random() * 210;
      return { key: p?._id || p?.basePokemon?._id || `${i}`, x, y, vx, vy, groundY, hopStrength, hopCooldown };
    });
    setActors(init);

    let lastTs = performance.now();
    const step = (ts) => {
      const dt = Math.min((ts - lastTs) / (1000 / 60), 2);
      lastTs = ts;
      setActors((prev) => {
        if (!el) return prev;
        const { width: w, height: h } = el.getBoundingClientRect();
        const rightLimit = Math.max(w - spriteSize, 0);
        const gravity = 0.24;
        const next = prev.map((a) => ({ ...a }));

        for (const a of next) {
          a.x += a.vx * dt;

          if (a.x < 0) {
            a.x = 0;
            a.vx = Math.abs(a.vx);
          } else if (a.x > rightLimit) {
            a.x = Math.max(rightLimit, 0);
            a.vx = -Math.abs(a.vx);
          }

          const pad = 8;
          a.groundY = Math.max(h - spriteSize - pad, 0);
          a.hopCooldown -= dt;

          const onGround = a.y >= a.groundY - 0.1;
          if (onGround && a.hopCooldown <= 0) {
            a.vy = -Math.abs(a.hopStrength || 4.8);
            a.hopCooldown = 120 + Math.random() * 260;
          }

          if (!onGround || a.vy < 0) {
            a.vy += gravity * dt;
            a.y += a.vy * dt;
          }

          if (a.y >= a.groundY) {
            a.y = a.groundY;
            a.vy = 0;
          }

          if (a.y < pad) {
            a.y = pad;
            a.vy = Math.max(a.vy, 0);
          }
        }

        return next;
      });
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [pokemonOpen, displayedTeam]);

  return (
    <div
      className="relative"
      onMouseEnter={() => {
        if (teamHoverTimer.current) {
          clearTimeout(teamHoverTimer.current);
          teamHoverTimer.current = null;
        }
      }}
      onMouseLeave={() => {
        teamHoverTimer.current = setTimeout(() => setPokemonOpen(false), 150);
      }}
    >
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={pokemonOpen}
        onClick={() => setPokemonOpen((v) => !v)}
        onKeyDown={(e) => e.key === "Escape" && setPokemonOpen(false)}
        title={pokemonOpen ? "Hide Pokemon team" : "Show Pokemon team"}
        className={`p-2 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
          pokemonOpen
            ? "bg-primary/20 text-primary hover:bg-primary/30"
            : "text-white/70 hover:bg-white/10 hover:text-white"
        }`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M12 3a9 9 0 0 0-8.485 6h4.146a4.5 4.5 0 0 1 8.678 0h4.146A9 9 0 0 0 12 3Zm0 18a9 9 0 0 0 8.485-6h-4.146a4.5 4.5 0 0 1-8.678 0H3.515A9 9 0 0 0 12 21Zm0-12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
            fill="currentColor"
          />
        </svg>
      </button>
      {pokemonOpen && (
        <>
          <button
            type="button"
            aria-label="Close Pokemon team modal"
            className="fixed inset-0 z-40 bg-black/55 sm:hidden"
            onClick={() => setPokemonOpen(false)}
          />
          <div
            role="dialog"
            aria-label="Pokemon Team"
            className="fixed inset-x-0 top-[calc(env(safe-area-inset-top)+56px)] z-50 px-3 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:px-0"
            onMouseEnter={() => {
              if (teamHoverTimer.current) {
                clearTimeout(teamHoverTimer.current);
                teamHoverTimer.current = null;
              }
            }}
            onMouseLeave={() => {
              teamHoverTimer.current = setTimeout(() => setPokemonOpen(false), 150);
            }}
          >
            <div className="mx-auto w-[min(94vw,420px)] rounded-l bg-black/85 backdrop-blur-xl border border-white/15 shadow-2xl p-2">
              <div className="mb-1 flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/65">
                  {useGen6Sprites ? "Gen 6 sprites" : "Gen 5 sprites"}
                </span>
                <button
                  type="button"
                  onClick={() => setUseGen6Sprites((v) => !v)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/20 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  title={useGen6Sprites ? "Switch to Gen 5 sprites" : "Switch to Gen 6 sprites"}
                  aria-label={useGen6Sprites ? "Switch to Gen 5 sprites" : "Switch to Gen 6 sprites"}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M16 3l4 4-4 4M20 7H9a5 5 0 0 0-5 5m0 9l-4-4 4-4m-4 4h11a5 5 0 0 0 5-5"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="relative w-full h-[300px] overflow-hidden" ref={containerRef}>
                {displayedTeam.map((p, idx) => {
                  const base = p?.basePokemon;
                  const sprite = getPokemonSprite(base);
                  if (!sprite) return null;
                  const actor = actors[idx];
                  const x = actor?.x ?? 0;
                  const y = actor?.y ?? 50;
                  const vx = actor?.vx ?? 0.8;
                  const mirrorOnRight = vx > 0;
                  return (
                    <img
                      key={actor?.key || p?._id || base?._id || idx}
                      src={sprite}
                      alt={base?.name || "Pokemon"}
                      height={spriteSize}
                      className="pointer-events-none"
                      style={{
                        position: "absolute",
                        left: x,
                        top: y,
                        height: spriteSize,
                        width: "auto",
                        transform: mirrorOnRight ? "scaleX(-1)" : "none",
                        transformOrigin: "center",
                        imageRendering: "auto",
                        filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.5))",
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PokemonPopover;
