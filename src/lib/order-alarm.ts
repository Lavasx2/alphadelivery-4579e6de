/**
 * Order alarm for the courier board.
 *
 * A single soft beep was easy to miss in a noisy shop or out on a bike, so the
 * courier alarm is a loud two-tone siren (sawtooth + square + noise burst)
 * pushed through a limiter, repeated for several seconds, with phone vibration.
 * Owner/store boards keep a shorter, gentler version of the same sound.
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

type Layer = {
  type: OscillatorType;
  low: number;
  high: number;
  level: number;
};

type Profile = {
  cycles: number;
  sweep: number;
  gap: number;
  master: number;
  layers: Layer[];
  noise: number;
};

/** Full siren: 9 rising/falling sweeps over ~8 seconds, near full volume. */
const COURIER: Profile = {
  cycles: 9,
  sweep: 0.72,
  gap: 0.16,
  master: 0.95,
  noise: 0.32,
  layers: [
    { type: "sawtooth", low: 620, high: 1250, level: 0.9 },
    { type: "square", low: 930, high: 1875, level: 0.4 },
  ],
};

/** Shorter, softer version for shop owners who just need a nudge. */
const OWNER: Profile = {
  cycles: 3,
  sweep: 0.45,
  gap: 0.12,
  master: 0.55,
  noise: 0.08,
  layers: [{ type: "triangle", low: 660, high: 880, level: 0.8 }],
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
  /** Courier boards get the full siren; owner/store boards a short chime. */
  loud?: boolean;
  /** Buzz the phone as well (ignored where unsupported). */
  vibrate?: boolean;
  /** Called once the alarm finishes on its own or is stopped early. */
  onEnd?: () => void;
};

function noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
  return buffer;
}

function sweepLayer(
  ctx: AudioContext,
  dest: AudioNode,
  sources: Stopper[],
  start: number,
  cfg: Profile,
  layer: Layer,
) {
  const osc = ctx.createOscillator();
  osc.type = layer.type;
  osc.frequency.setValueAtTime(layer.low, start);
  osc.frequency.linearRampToValueAtTime(layer.high, start + cfg.sweep * 0.5);
  osc.frequency.linearRampToValueAtTime(layer.low, start + cfg.sweep);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(layer.level, start + 0.03);
  gain.gain.setValueAtTime(layer.level, start + cfg.sweep - 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + cfg.sweep);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(start);
  osc.stop(start + cfg.sweep + 0.02);
  sources.push(osc);
}

function noiseHit(
  ctx: AudioContext,
  dest: AudioNode,
  sources: Stopper[],
  start: number,
  buffer: AudioBuffer,
  level: number,
) {
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(level, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
  src.connect(gain);
  gain.connect(dest);
  src.start(start);
  src.stop(start + 0.22);
  sources.push(src);
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

  // Limiter keeps the siren at a hard, constant loudness without clipping.
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.setValueAtTime(-10, ctx.currentTime);
  limiter.knee.setValueAtTime(0, ctx.currentTime);
  limiter.ratio.setValueAtTime(20, ctx.currentTime);
  limiter.attack.setValueAtTime(0.003, ctx.currentTime);
  limiter.release.setValueAtTime(0.05, ctx.currentTime);

  master.connect(limiter);
  limiter.connect(ctx.destination);

  const noise = noiseBuffer(ctx, 0.25);
  const start = ctx.currentTime + 0.02;
  for (let i = 0; i < cfg.cycles; i += 1) {
    const at = start + i * (cfg.sweep + cfg.gap);
    for (const layer of cfg.layers) sweepLayer(ctx, master, sources, at, cfg, layer);
    noiseHit(ctx, master, sources, at, noise, cfg.noise);
  }

  const totalMs = (cfg.cycles * (cfg.sweep + cfg.gap)) * 1000 + 250;
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
