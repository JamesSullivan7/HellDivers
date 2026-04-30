"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useGame } from "@/lib/store";
import { sfx } from "@/lib/sfx";
import { VOICE_LINES } from "@/lib/voiceLines";

interface Props {
  squadCode: string;
  compact?: boolean;
}

export default function SquadChatBox({ squadCode, compact }: Props) {
  const { account } = useGame();
  const messages = useQuery(api.squads.recentChat, { code: squadCode, limit: compact ? 12 : 50 });
  const sendChat = useMutation(api.squads.sendChat);
  const sendVoiceLine = useMutation(api.squads.sendVoiceLine);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSeenIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (!messages || messages.length === 0) return;
    const latest = messages[messages.length - 1];
    if (latest && lastSeenIdRef.current !== latest._id) {
      if (lastSeenIdRef.current !== null && latest.helldiverName !== account.helldiverName) {
        if (latest.isVoiceLine) sfx.beacon();
        else if (!latest.isSystem) sfx.draw();
      }
      lastSeenIdRef.current = latest._id;
    }
  }, [messages, account.helldiverName]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sfx.click();
    sendChat({
      code: squadCode,
      helldiverName: account.helldiverName ?? "Anonymous",
      text: trimmed,
    });
    setText("");
  };

  const handleVoiceLine = (id: string, t: string) => {
    sfx.beacon();
    sendVoiceLine({
      code: squadCode,
      helldiverName: account.helldiverName ?? "Anonymous",
      voiceLineId: id,
      text: t,
    });
  };

  return (
    <div className={clsx(
      "border-2 border-helldiver-yellow/40 bg-black/70 backdrop-blur-sm flex flex-col",
      compact ? "h-64" : "h-96"
    )}>
      <div className="px-3 py-1 border-b border-helldiver-yellow/30 text-[10px] uppercase tracking-[0.3em] text-helldiver-yellow flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-blink" />
        Squad Comms · {squadCode}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 py-2 text-[11px] leading-relaxed font-mono">
        {!messages && <div className="text-helldiver-dim italic">Connecting...</div>}
        {messages && messages.length === 0 && (
          <div className="text-helldiver-dim italic text-center py-4">No comms traffic yet.</div>
        )}
        <AnimatePresence initial={false}>
          {messages?.map((m) => {
            const own = m.helldiverName === account.helldiverName;
            return (
              <motion.div
                key={m._id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                className={clsx(
                  "mb-0.5",
                  m.isSystem && "text-helldiver-dim italic",
                  m.isVoiceLine && !m.isSystem && "text-helldiver-yellow font-bold",
                  !m.isSystem && !m.isVoiceLine && "text-gray-200"
                )}
              >
                {m.isSystem ? (
                  <span>› {m.text}</span>
                ) : m.isVoiceLine ? (
                  <span>
                    <span className="text-emerald-400">▶</span>{" "}
                    <span className={own ? "text-helldiver-yellow" : "text-emerald-300"}>
                      [{m.helldiverName}]
                    </span>{" "}
                    <span className="font-display tracking-wider">{m.text}</span>
                  </span>
                ) : (
                  <span>
                    <span className={own ? "text-helldiver-yellow" : "text-emerald-300"}>
                      [{m.helldiverName}]
                    </span>{" "}
                    <span>{m.text}</span>
                  </span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Voice lines */}
      <div className="border-t border-helldiver-yellow/30 px-2 py-2">
        <div className="text-[9px] uppercase tracking-[0.3em] text-helldiver-dim mb-1.5">
          Quick Comms
        </div>
        <div className="flex flex-wrap gap-1">
          {VOICE_LINES.map((vl) => (
            <button
              key={vl.id}
              onClick={() => handleVoiceLine(vl.id, vl.text)}
              className="px-2 py-1 border border-helldiver-yellow/40 text-helldiver-yellow text-[10px] tracking-wider font-display font-bold hover:bg-helldiver-yellow hover:text-black transition-colors"
            >
              {vl.text}
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-helldiver-yellow/30 px-2 py-2 flex gap-1">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          maxLength={200}
          placeholder="Comms message..."
          className="flex-1 px-2 py-1 bg-black border border-helldiver-steel text-white text-xs font-mono focus:outline-none focus:border-helldiver-yellow"
        />
        <button
          onClick={handleSend}
          className="px-3 py-1 bg-helldiver-yellow text-black text-[10px] tracking-widest font-display font-bold hover:bg-yellow-300"
        >
          SEND
        </button>
      </div>
    </div>
  );
}
