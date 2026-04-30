"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";

interface Props {
  className?: string;
  variant?: "fixed" | "inline";
  label?: string;
  onClick?: () => void;
}

export default function HQReturnButton({ className, variant = "fixed", label = "Return to HQ", onClick }: Props) {
  const { goToMenu } = useGame();
  const handle = () => {
    sfx.click();
    if (onClick) onClick();
    else goToMenu();
  };

  return (
    <motion.button
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.96 }}
      onClick={handle}
      className={clsx(
        "group flex items-center gap-2 px-4 py-2.5 font-display font-black text-xs tracking-[0.3em] uppercase",
        "border-2 border-helldiver-yellow text-black bg-helldiver-yellow",
        "shadow-[0_0_20px_rgba(255, 211, 77,0.45)] hover:shadow-[0_0_30px_rgba(255, 211, 77,0.7)]",
        "transition-all duration-200 backdrop-blur-sm",
        variant === "fixed" && "fixed top-4 left-4 z-50",
        className
      )}
    >
      <span className="text-base group-hover:-translate-x-0.5 transition-transform">◀</span>
      <span>{label}</span>
    </motion.button>
  );
}
