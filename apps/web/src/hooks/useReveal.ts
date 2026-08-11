"use client";

// One-shot IntersectionObserver reveal at 12% threshold (FR-029, research R14 — plain CSS
// transitions driven by React state, zero animation library) — ports app.js's `.rv, .stagger`
// IntersectionObserver block. Shared by Reveal and StaggerGroup.
import { useEffect, useRef, useState } from "react";

export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, inView };
}
