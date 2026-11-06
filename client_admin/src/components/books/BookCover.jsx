import { useState } from "react";

// Cover image, or a generated cover tinted from the title when there is none (or it fails to load).
export default function BookCover({ book, large = false, className = "" }) {
  const [failed, setFailed] = useState(false);
  const base = `shrink-0 overflow-hidden rounded-md shadow-[0_4px_14px_rgba(0,0,0,0.35)] ring-1 ring-white/10 ${className}`;

  if (book.coverImageUrl && !failed) {
    return (
      <img
        src={book.coverImageUrl}
        alt=""
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${base} object-cover`}
      />
    );
  }

  let hue = 0;
  for (const ch of book.title || "") hue = (hue * 31 + ch.charCodeAt(0)) % 360;

  return (
    <div
      aria-hidden="true"
      className={`${base} flex flex-col justify-between ${large ? "p-3" : "p-1.5"}`}
      style={{ background: `linear-gradient(160deg, hsl(${hue} 32% 30%), hsl(${(hue + 40) % 360} 38% 13%))` }}
    >
      <span
        className={`line-clamp-4 font-semibold leading-tight text-white/90 ${large ? "text-sm" : "text-[8px]"}`}
      >
        {book.title}
      </span>
      {large && <span className="line-clamp-2 text-[11px] text-white/60">{book.author}</span>}
    </div>
  );
}
