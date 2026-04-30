// Web Audio synthesized SFX with separate channels (UI / Combat / Ambient / Voice).
// No assets required.

type Channel = "ui" | "combat" | "ambient" | "voice";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
const channelGains: Record<Channel, GainNode | null> = {
  ui: null,
  combat: null,
  ambient: null,
  voice: null,
};
const channelDefaults: Record<Channel, number> = {
  ui: 0.45,
  combat: 0.5,
  ambient: 0.35,
  voice: 0.6,
};
let muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.4;
      masterGain.connect(ctx.destination);

      (Object.keys(channelDefaults) as Channel[]).forEach((c) => {
        const g = ctx!.createGain();
        g.gain.value = channelDefaults[c];
        g.connect(masterGain!);
        channelGains[c] = g;
      });
    } catch {
      return null;
    }
  }
  return ctx;
}

function getDest(channel: Channel): AudioNode | null {
  if (!getCtx()) return null;
  return channelGains[channel];
}

export function setMuted(v: boolean) {
  muted = v;
  if (masterGain) masterGain.gain.value = v ? 0 : 0.4;
}

export function isMuted() {
  return muted;
}

export function setChannelVolume(channel: Channel, value: number) {
  const g = channelGains[channel];
  if (g) g.gain.value = Math.max(0, Math.min(1, value));
}

// ────────────────────────────────────────────────────────────
// Primitives
// ────────────────────────────────────────────────────────────

function tone(opts: {
  channel?: Channel;
  freq: number;
  endFreq?: number;
  duration: number;
  type?: OscillatorType;
  volume?: number;
  delay?: number;
  attack?: number;
}) {
  const c = getCtx();
  const dest = getDest(opts.channel ?? "ui");
  if (!c || !dest) return;
  const start = c.currentTime + (opts.delay ?? 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opts.type ?? "square";
  osc.frequency.setValueAtTime(opts.freq, start);
  if (opts.endFreq !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(opts.endFreq, 0.01), start + opts.duration);
  }
  const v = opts.volume ?? 0.15;
  const att = opts.attack ?? 0.005;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(v, start + att);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);
  osc.connect(gain).connect(dest);
  osc.start(start);
  osc.stop(start + opts.duration + 0.05);
}

function noise(opts: {
  channel?: Channel;
  duration: number;
  volume?: number;
  lowpass?: number;
  highpass?: number;
  delay?: number;
}) {
  const c = getCtx();
  const dest = getDest(opts.channel ?? "ui");
  if (!c || !dest) return;
  const start = c.currentTime + (opts.delay ?? 0);
  const bufSize = Math.floor(c.sampleRate * opts.duration);
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const gain = c.createGain();
  const v = opts.volume ?? 0.18;
  gain.gain.setValueAtTime(v, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + opts.duration);
  let chain: AudioNode = src;
  if (opts.lowpass) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = opts.lowpass;
    chain.connect(f);
    chain = f;
  }
  if (opts.highpass) {
    const f = c.createBiquadFilter();
    f.type = "highpass";
    f.frequency.value = opts.highpass;
    chain.connect(f);
    chain = f;
  }
  chain.connect(gain).connect(dest);
  src.start(start);
  src.stop(start + opts.duration + 0.05);
}

// ────────────────────────────────────────────────────────────
// Loop manager — stoppable continuous sounds
// ────────────────────────────────────────────────────────────

interface ActiveLoop {
  oscs: OscillatorNode[];
  gains: GainNode[];
  stopAt?: number;
}

const activeLoops = new Map<string, ActiveLoop>();

function startLoop(
  id: string,
  builder: (c: AudioContext, dest: AudioNode) => ActiveLoop
): void {
  if (activeLoops.has(id)) return;
  const c = getCtx();
  if (!c) return;
  const dest = getDest("ambient");
  if (!dest) return;
  const loop = builder(c, dest);
  activeLoops.set(id, loop);
}

function stopLoop(id: string) {
  const c = getCtx();
  const loop = activeLoops.get(id);
  if (!loop || !c) return;
  const now = c.currentTime;
  loop.gains.forEach((g) => {
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
  });
  loop.oscs.forEach((o) => o.stop(now + 0.5));
  activeLoops.delete(id);
}

// ────────────────────────────────────────────────────────────
// Voice line system (SpeechSynthesis with radio-flavor envelope)
// ────────────────────────────────────────────────────────────

let voiceQueue: string[] = [];
let voiceSpeaking = false;

function speakVoice(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  // Radio chirp before
  tone({ channel: "voice", freq: 1400, duration: 0.04, type: "square", volume: 0.06 });
  tone({ channel: "voice", freq: 800, duration: 0.04, type: "square", volume: 0.05, delay: 0.05 });

  setTimeout(() => {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 0.6;
    u.volume = muted ? 0 : 0.85;
    u.onend = () => {
      voiceSpeaking = false;
      noise({ channel: "voice", duration: 0.12, volume: 0.08, lowpass: 1200 });
      flushVoiceQueue();
    };
    voiceSpeaking = true;
    try {
      window.speechSynthesis.speak(u);
    } catch {
      voiceSpeaking = false;
    }
  }, 140);
}

function flushVoiceQueue() {
  if (voiceSpeaking) return;
  const next = voiceQueue.shift();
  if (next) speakVoice(next);
}

export function voice(text: string) {
  if (muted) return;
  voiceQueue.push(text.toUpperCase());
  if (!voiceSpeaking) flushVoiceQueue();
}

// ────────────────────────────────────────────────────────────
// SFX library
// ────────────────────────────────────────────────────────────

export const sfx = {
  // ── UI ──
  click: () => tone({ channel: "ui", freq: 900, endFreq: 600, duration: 0.05, type: "square", volume: 0.08 }),
  hover: () => tone({ channel: "ui", freq: 1400 + (Math.random() * 80 - 40), duration: 0.04, type: "sine", volume: 0.04 }),
  cardSelect: () => tone({ channel: "ui", freq: 600, endFreq: 1100, duration: 0.06, type: "square", volume: 0.1 }),
  cardPlay: () => {
    tone({ channel: "ui", freq: 200, endFreq: 80, duration: 0.18, type: "sawtooth", volume: 0.12 });
    tone({ channel: "ui", freq: 800, duration: 0.04, type: "square", volume: 0.08, delay: 0.02 });
  },
  draw: () => tone({ channel: "ui", freq: 1800, endFreq: 1400, duration: 0.04, type: "triangle", volume: 0.06 }),
  beacon: () => {
    tone({ channel: "ui", freq: 1000, duration: 0.04, type: "square", volume: 0.08 });
    tone({ channel: "ui", freq: 1000, duration: 0.04, type: "square", volume: 0.08, delay: 0.1 });
  },
  alert: () => {
    tone({ channel: "ui", freq: 880, duration: 0.1, type: "square", volume: 0.1 });
    tone({ channel: "ui", freq: 660, duration: 0.1, type: "square", volume: 0.1, delay: 0.12 });
  },

  // ── COMBAT ──
  hit: () => {
    noise({ channel: "combat", duration: 0.12, volume: 0.16, lowpass: 800 });
    tone({ channel: "combat", freq: 120, endFreq: 60, duration: 0.08, type: "square", volume: 0.1 });
  },
  // Layered metallic ring on top of impact
  crit: () => {
    noise({ channel: "combat", duration: 0.16, volume: 0.18, lowpass: 1200 });
    tone({ channel: "combat", freq: 110, endFreq: 50, duration: 0.1, type: "sawtooth", volume: 0.14 });
    tone({ channel: "combat", freq: 1800, duration: 0.18, type: "triangle", volume: 0.07, delay: 0.02 });
    tone({ channel: "combat", freq: 2400, duration: 0.22, type: "sine", volume: 0.05, delay: 0.06 });
  },
  weakHit: () => {
    noise({ channel: "combat", duration: 0.08, volume: 0.08, lowpass: 400 });
  },
  explosion: () => {
    noise({ channel: "combat", duration: 0.5, volume: 0.22, lowpass: 1200 });
    tone({ channel: "combat", freq: 80, endFreq: 30, duration: 0.4, type: "sawtooth", volume: 0.12 });
    tone({ channel: "combat", freq: 200, endFreq: 60, duration: 0.3, type: "square", volume: 0.08, delay: 0.04 });
  },
  bigExplosion: () => {
    noise({ channel: "combat", duration: 0.9, volume: 0.28, lowpass: 1800 });
    tone({ channel: "combat", freq: 60, endFreq: 20, duration: 0.7, type: "sawtooth", volume: 0.18 });
    tone({ channel: "combat", freq: 180, endFreq: 40, duration: 0.5, type: "square", volume: 0.1, delay: 0.05 });
  },
  laser: () => tone({ channel: "combat", freq: 1600, endFreq: 200, duration: 0.18, type: "sawtooth", volume: 0.1 }),
  sentryDeploy: () => {
    tone({ channel: "combat", freq: 1200, duration: 0.05, type: "square", volume: 0.08 });
    tone({ channel: "combat", freq: 800, duration: 0.05, type: "square", volume: 0.08, delay: 0.06 });
    noise({ channel: "combat", duration: 0.25, volume: 0.12, lowpass: 600, delay: 0.12 });
  },
  shield: () => {
    tone({ channel: "combat", freq: 400, endFreq: 800, duration: 0.15, type: "sine", volume: 0.1 });
    tone({ channel: "combat", freq: 600, endFreq: 1200, duration: 0.15, type: "sine", volume: 0.06, delay: 0.04 });
  },
  // Glassy shield hum (one-shot, used for "shield is up" emphasis)
  shieldGlassy: () => {
    tone({ channel: "combat", freq: 1100, duration: 0.6, type: "sine", volume: 0.05 });
    tone({ channel: "combat", freq: 1640, duration: 0.6, type: "sine", volume: 0.04, delay: 0.04 });
  },
  shatter: () => {
    noise({ channel: "combat", duration: 0.35, volume: 0.18, highpass: 1500 });
    tone({ channel: "combat", freq: 2200, endFreq: 800, duration: 0.2, type: "triangle", volume: 0.06 });
  },
  heal: () => {
    tone({ channel: "combat", freq: 660, duration: 0.08, type: "sine", volume: 0.1 });
    tone({ channel: "combat", freq: 880, duration: 0.08, type: "sine", volume: 0.1, delay: 0.06 });
    tone({ channel: "combat", freq: 1320, duration: 0.1, type: "sine", volume: 0.08, delay: 0.12 });
  },
  endTurn: () => {
    tone({ channel: "ui", freq: 220, duration: 0.12, type: "square", volume: 0.1 });
    tone({ channel: "ui", freq: 165, duration: 0.12, type: "square", volume: 0.08, delay: 0.05 });
  },

  victory: () => {
    [261.63, 329.63, 392, 523.25].forEach((f, i) =>
      tone({ channel: "combat", freq: f, duration: 0.18, type: "triangle", volume: 0.12, delay: i * 0.12 })
    );
  },
  defeat: () => {
    [220, 175, 130, 98].forEach((f, i) =>
      tone({ channel: "combat", freq: f, duration: 0.25, type: "sawtooth", volume: 0.12, delay: i * 0.18 })
    );
  },
  combatStart: () => {
    tone({ channel: "combat", freq: 110, duration: 0.4, type: "sawtooth", volume: 0.18 });
    tone({ channel: "combat", freq: 220, duration: 0.4, type: "square", volume: 0.1, delay: 0.05 });
    noise({ channel: "combat", duration: 0.3, volume: 0.1, lowpass: 400, delay: 0.2 });
  },

  // ── BOSS ──
  // One-shot bass drop for enrage trigger (a distinct cue)
  bossEnrage: () => {
    tone({ channel: "combat", freq: 200, endFreq: 25, duration: 0.7, type: "sawtooth", volume: 0.28 });
    tone({ channel: "combat", freq: 880, duration: 0.1, type: "square", volume: 0.12 });
    tone({ channel: "combat", freq: 660, duration: 0.1, type: "square", volume: 0.12, delay: 0.15 });
    tone({ channel: "combat", freq: 880, duration: 0.1, type: "square", volume: 0.12, delay: 0.3 });
    noise({ channel: "combat", duration: 0.6, volume: 0.18, lowpass: 800 });
  },

  // Continuous boss presence loop — low-frequency rumble while boss alive
  bossRumbleStart: () =>
    startLoop("boss_rumble", (c, dest) => {
      const oscA = c.createOscillator();
      oscA.type = "sawtooth";
      oscA.frequency.value = 50;
      const oscB = c.createOscillator();
      oscB.type = "sine";
      oscB.frequency.value = 75;
      const filter = c.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 90;
      const gain = c.createGain();
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.07, c.currentTime + 0.6);
      oscA.connect(filter);
      oscB.connect(filter);
      filter.connect(gain).connect(dest);
      oscA.start();
      oscB.start();
      return { oscs: [oscA, oscB], gains: [gain] };
    }),
  bossRumbleStop: () => stopLoop("boss_rumble"),

  // Ambient combat hum — fills silence with low-grade tension
  ambientStart: () =>
    startLoop("ambient", (c, dest) => {
      const oscA = c.createOscillator();
      oscA.type = "sine";
      oscA.frequency.value = 90;
      const oscB = c.createOscillator();
      oscB.type = "sine";
      oscB.frequency.value = 120;
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 300;
      const gain = c.createGain();
      gain.gain.value = 0;
      gain.gain.linearRampToValueAtTime(0.04, c.currentTime + 1.2);
      oscA.connect(lp);
      oscB.connect(lp);
      lp.connect(gain).connect(dest);
      oscA.start();
      oscB.start();
      return { oscs: [oscA, oscB], gains: [gain] };
    }),
  ambientStop: () => stopLoop("ambient"),

  // ── VOICE ──
  voice,

  // call this once on first user input (browser policy)
  unlock: () => {
    const c = getCtx();
    if (c && c.state === "suspended") c.resume();
  },
};
