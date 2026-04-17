"use client";

import { useEffect, useState } from "react";

const PERSONAS: { verb: string; accent: string }[] = [
  { verb: "Umów sparing", accent: "w 2 minuty" },
  { verb: "Znajdź klub", accent: "w swoim regionie" },
  { verb: "Prowadź nabory", accent: "jak profesjonalista" },
  { verb: "Trenuj z trenerem", accent: "dopasowanym do Ciebie" },
];

const INTERVAL_MS = 3200;

export function RotatingHeadline() {
  const [idx, setIdx] = useState(0);
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    const swap = setInterval(() => {
      setEntering(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % PERSONAS.length);
        setEntering(true);
      }, 220);
    }, INTERVAL_MS);
    return () => clearInterval(swap);
  }, []);

  const current = PERSONAS[idx];

  return (
    <h1 className="mb-6 text-[clamp(2.25rem,5vw,4rem)] font-bold leading-[1.08] tracking-tight">
      <span
        key={`${idx}-verb`}
        className={`inline-block transition-all duration-200 ${entering ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
      >
        {current.verb}
      </span>{" "}
      <span
        key={`${idx}-accent`}
        className={`inline-block bg-gradient-to-r from-violet-400 to-orange-400 bg-clip-text text-transparent transition-all duration-200 ${entering ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-1"}`}
      >
        {current.accent}
      </span>
    </h1>
  );
}
