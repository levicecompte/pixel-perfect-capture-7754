import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";

export function NeonCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const hx = useSpring(x, { stiffness: 120, damping: 18, mass: 0.6 });
  const hy = useSpring(y, { stiffness: 120, damping: 18, mass: 0.6 });
  const [fine, setFine] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setFine(true);
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, [x, y]);

  if (!fine) return null;

  return (
    <>
      <motion.div
        className="pointer-events-none fixed z-[100] h-2 w-2 rounded-full"
        style={{
          x,
          y,
          translateX: "-50%",
          translateY: "-50%",
          background: "var(--neon-cyan)",
          boxShadow: "0 0 12px rgba(0,229,255,0.9)",
        }}
      />
      <motion.div
        className="pointer-events-none fixed z-[99] h-10 w-10 rounded-full blur-xl"
        style={{
          x: hx,
          y: hy,
          translateX: "-50%",
          translateY: "-50%",
          background: "rgba(0,229,255,0.45)",
        }}
      />
    </>
  );
}
