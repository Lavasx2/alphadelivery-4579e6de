/**
 * Order alarm for the courier board.
 *
 * A single soft beep was easy to miss in a noisy shop or out on a bike, and a
 * siren felt too much like an emergency vehicle, so the courier alarm is a
 * loud repeating bell fanfare: bright chime notes with metallic overtones,
 * pushed through a limiter, repeated for several seconds, with phone
 * vibration. Owner/store boards keep a shorter, gentler version of the same
 * melody.
 */

type AudioWindow = {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

function audioContextCtor(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as AudioWindow;
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

function vibrate(pattern: number[]) {
  try {
    const nav = globalThis.navigator as Navigator & {
      vibrate?: (pattern: number[]) => boolean;
    };
    if (typeof nav?.vibrate === "function") nav.vibrate(pattern);
  } catch {
    /* vibration unsupported */
  }
}

type Stopper = { stop: (at?: number) => void };

/** One chime note: frequency in Hz, length in seconds. */
type Note = { freq: number; dur: number };

type Profile = {
  /** How many times the melody repeats. */
  repeats: number;
  /** Gap between melody repeats, in seconds. */
  gap: number;
  /** Master bus level (0..1). */
  master: number;
  /** Per-note peak level. */
  level: number;
  melody: Note[];
};

/**
 * Full fanfare: a bright rising bell phrase (A5 → C#6 → E6 → A6 with a low
 * A4 anchor), repeated 4 times over ~8 seconds, near full volume. The high
 * partials make it cut through street and kitchen noise without sounding
 * like a siren.
 */
const COURIER: Profile = {
  repeats: 4,
  gap: 0.35,
  master: 0.95,
  level: 0.85,
  melody: [
    { freq: 220, dur: 0.5 },
    { freq: 880, dur: 0.35 },
    { freq: 1108.73, dur: 0.35 },
    { freq: 1318.51, dur: 0.35 },
    { freq: 1760, dur: 0.6 },
  ],
};

/** Shorter, softer version for shop owners who just need a nudge. */
const OWNER: Profile = {
  repeats: 1,
  gap: 0,
  master: 0.55,
  level: 0.5,
  melody: [
    { freq: 880, dur: 0.3 },
    { freq: 1318.51, dur: 0.45 },
  ],
};

const VIBRATE_PATTERN = [500, 150, 500, 150, 800, 200, 500, 150, 500];

let active: { stop: () => void } | null = null;

export function isAlarmRinging(): boolean {
  return active !== null;
}

export function stopOrderAlarm(): void {
  active?.stop();
}

export type AlarmOptions = {
  /** Courier boards get the full fanfare; owner/store boards a short chime. */
  loud?: boolean;
  /** Buzz the phone as well (ignored where unsupported). */
  vibrate?: boolean;
  /** Called once the alarm finishes on its own or is stopped early. */
  onEnd?: () => void;
};

/**
 * Schedules one bell note: a sine fundamental plus a metallic partial at
 * ~2.76x, with a fast attack and an exponential decay so it rings like a
 * struck chime rather than a flat tone.
 */
function bellNote(
  ctx: AudioContext,
  dest: AudioNode,
  sources: Stopper[],
  start: number,
  note: Note,
  level: number,
) {
  const partials: { ratio: number; gain: number }[] = [
    { ratio: 1, gain: 1 },
    { ratio: 2.76, gain: 0.35 },
  ];
  for (const partial of partials) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(note.freq * partial.ratio, start);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level * partial.gain, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(start);
    osc.stop(start + note.dur + 0.02);
    sources.push(osc);
  }
}

function melodyDuration(melody: Note[]): number {
  return melody.reduce((sum, n) => sum + n.dur, 0);
}

/**
 * Plays the order alarm and returns a function that silences it early.
 * Starting a new alarm replaces any one already ringing.
 */
export function playOrderAlarm(options: AlarmOptions = {}): () => void {
  const finish = () => {
    active = null;
    options.onEnd?.();
  };

  const Ctx = audioContextCtor();
  if (!Ctx) {
    finish();
    return () => {};
  }

  let ctx: AudioContext;
  try {
    ctx = new Ctx();
    void ctx.resume().catch(() => {});
  } catch {
    finish();
    return () => {};
  }

  stopOrderAlarm();

  const cfg = options.loud ? COURIER : OWNER;
  const sources: Stopper[] = [];
  let done = false;

  const master = ctx.createGain();
  master.gain.setValueAtTime(cfg.master, ctx.currentTime);

  // Limiter keeps the fanfare at a hard, constant loudness without clipping.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.setValueAtTime(-10, ctx.currentTime);
  limiter.knee.setValueAtTime(0, ctx.currentTime);
  limiter.ratio.setValueAtTime(20, ctx.currentTime);
  limiter.attack.setValueAtTime(0.003, ctx.currentTime);
  limiter.release.setValueAtTime(0.05, ctx.currentTime);

  master.connect(limiter);
  limiter.connect(ctx.destination);

  const phrase = melodyDuration(cfg.melody);
  const start = ctx.currentTime + 0.02;
  for (let r = 0; r < cfg.repeats; r += 1) {
    let at = start + r * (phrase + cfg.gap);
    for (const note of cfg.melody) {
      bellNote(ctx, master, sources, at, note, cfg.level);
      at += note.dur;
    }
  }

  const totalMs = (cfg.repeats * phrase + (cfg.repeats - 1) * cfg.gap) * 1000 + 300;
  const timer = setTimeout(() => {
    if (done) return;
    done = true;
    try {
      void ctx.close();
    } catch {
      /* already closed */
    }
    finish();
  }, totalMs);

  const stop = () => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    try {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
    } catch {
      /* context already gone */
    }
    for (const s of sources) {
      try {
        s.stop(ctx.currentTime);
      } catch {
        /* node already stopped */
      }
    }
    try {
      void ctx.close();
    } catch {
      /* already closed */
    }
    finish();
  };

  active = { stop };
  if (options.vibrate) vibrate(VIBRATE_PATTERN);

  return stop;
}
