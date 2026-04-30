"use client";

import { ReactNode } from "react";

const STATUS_KEYWORDS = new Set([
  "BURN",
  "STUN",
  "SHIELD",
  "BLOCK",
  "POISON",
  "ARMOR",
  "EXHAUST",
  "CHAIN",
  "RANDOM",
  "AOE",
]);

const HEAL_KEYWORDS = new Set(["HEAL", "HEALED", "REGEN"]);

function highlight(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\d+(?:\.\d+)?)|([A-Z]{2,})/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(
        <span key={key++} className="text-accent-yellow font-bold">
          {match[1]}
        </span>
      );
    } else if (match[2]) {
      const word = match[2];
      if (HEAL_KEYWORDS.has(word)) {
        parts.push(
          <span key={key++} className="text-accent-green font-bold">
            {word}
          </span>
        );
      } else if (STATUS_KEYWORDS.has(word) || /^[A-Z]{4,}$/.test(word)) {
        parts.push(
          <span key={key++} className="text-accent-cyan font-bold">
            {word}
          </span>
        );
      } else {
        parts.push(
          <span key={key++} className="text-text-primary font-bold">
            {word}
          </span>
        );
      }
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

interface Props {
  text: string;
}

export default function CardDescription({ text }: Props) {
  return (
    <div
      className="px-tok-3 text-text-secondary leading-snug overflow-hidden"
      style={{
        fontSize: "var(--text-sm)",
        lineHeight: 1.4,
        height: "90px",
        paddingTop: "var(--space-2)",
      }}
    >
      {highlight(text)}
    </div>
  );
}
