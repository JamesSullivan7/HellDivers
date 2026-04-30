"use client";

import { CardType } from "@/lib/types";
import { StratagemIcon } from "@/lib/icons";
import { getCardArt } from "@/lib/artManifest";

const TYPE_TINT: Record<CardType, string> = {
  eagle: "from-accent-yellow/15 to-bg-tertiary",
  orbital: "from-accent-red/15 to-bg-tertiary",
  sentry: "from-accent-green/15 to-bg-tertiary",
  support: "from-accent-cyan/15 to-bg-tertiary",
  backpack: "from-accent-purple/15 to-bg-tertiary",
  utility: "from-bg-secondary to-bg-tertiary",
};

const TYPE_TEXT: Record<CardType, string> = {
  eagle: "text-accent-yellow",
  orbital: "text-accent-red",
  sentry: "text-accent-green",
  support: "text-accent-cyan",
  backpack: "text-accent-purple",
  utility: "text-text-secondary",
};

interface Props {
  type: CardType;
  /** Card id used to resolve a portrait/illustration. */
  cardId?: string;
  /** Render the image cell at a smaller height (used for compact cards). */
  small?: boolean;
}

export default function CardImage({ type, cardId, small }: Props) {
  const art = cardId ? getCardArt(cardId) : null;
  const height = small ? "120px" : "180px";

  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-b ${TYPE_TINT[type]}`}
      style={{ height }}
    >
      {art ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={art}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-center"
            draggable={false}
            loading="lazy"
          />
          {/* Type-tinted top-left wash so the icon stays readable */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.45), transparent 45%, transparent 70%, rgba(0,0,0,0.55))",
            }}
          />
          {/* Type icon top-left */}
          <div
            className={`absolute top-2 left-2 ${TYPE_TEXT[type]} drop-shadow-[0_0_6px_currentColor]`}
            style={{ width: "20px", height: "20px", opacity: 0.95 }}
          >
            <StratagemIcon type={type} className="w-full h-full" />
          </div>
        </>
      ) : (
        <>
          {/* Type icon top-left */}
          <div
            className={`absolute top-2 left-2 ${TYPE_TEXT[type]} drop-shadow-[0_0_6px_currentColor]`}
            style={{ width: "20px", height: "20px", opacity: 0.9 }}
          >
            <StratagemIcon type={type} className="w-full h-full" />
          </div>

          {/* Center icon (placeholder when no art) */}
          <div className={`absolute inset-0 flex items-center justify-center ${TYPE_TEXT[type]} opacity-90 drop-shadow-[0_0_18px_currentColor]`}>
            <StratagemIcon type={type} className={small ? "w-14 h-14" : "w-20 h-20"} />
          </div>

          {/* Bottom fade overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.6))",
            }}
          />
        </>
      )}
    </div>
  );
}
