import { useEffect, useRef } from "react";
import { TextScramble } from "../../utils/textScramble";

const ScrambleOutput = ({ phrases, onComplete, fontFamily }) => {
  const elRef = useRef(null);
  const fxRef = useRef(null);

  useEffect(() => {
    if (!elRef.current) {
      return undefined;
    }

    let cancelled = false;
    let timeoutId = null;
    fxRef.current = new TextScramble(elRef.current);

    let counter = 0;
    const next = () => {
      if (cancelled) {
        return;
      }

      if (counter < phrases.length) {
        fxRef.current.setText(phrases[counter]).then(() => {
          timeoutId = setTimeout(() => {
            counter += 1;
            next();
          }, 800);
        });
      } else if (onComplete) {
        onComplete();
      }
    };

    next();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [phrases, onComplete]);

  return <div ref={elRef} className="text-rose-400" style={{ fontFamily }} />;
};

export default ScrambleOutput;
