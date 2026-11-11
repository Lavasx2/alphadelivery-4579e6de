import { afterEach, describe, expect, it, vi } from "vitest";
import { isAlarmRinging, playOrderAlarm, stopOrderAlarm } from "./order-alarm";

class Param {
  value = 0;
  ramps: number[] = [];
  setValueAtTime(v: number) {
    this.value = v;
    return this;
  }
  linearRampToValueAtTime(v: number) {
    this.ramps.push(v);
    return this;
  }
  exponentialRampToValueAtTime(v: number) {
    this.ramps.push(v);
    return this;
  }
  cancelScheduledValues() {
    return this;
  }
}

class FakeNode {
  type = "";
  buffer: unknown = null;
  started: number[] = [];
  stopped: number[] = [];
  frequency = new Param();
  gain = new Param();
  threshold = new Param();
  knee = new Param();
  ratio = new Param();
  attack = new Param();
  release = new Param();
  connect() {
    return this;
  }
  start(at = 0) {
    this.started.push(at);
  }
  stop(at = 0) {
    this.stopped.push(at);
  }
}

const contexts: FakeCtx[] = [];

class FakeCtx {
  currentTime = 0;
  sampleRate = 44100;
  destination = new FakeNode();
  closed = false;
  resumed = false;
  gains: FakeNode[] = [];
  oscillators: FakeNode[] = [];
  buffers: FakeNode[] = [];
  compressors: FakeNode[] = [];
  constructor() {
    contexts.push(this);
  }
  createGain() {
    const n = new FakeNode();
    this.gains.push(n);
    return n;
  }
  createOscillator() {
    const n = new FakeNode();
    this.oscillators.push(n);
    return n;
  }
  createBufferSource() {
    const n = new FakeNode();
    this.buffers.push(n);
    return n;
  }
  createDynamicsCompressor() {
    const n = new FakeNode();
    this.compressors.push(n);
    return n;
  }
  createBuffer(_ch: number, length: number) {
    return { length, getChannelData: () => new Float32Array(length) };
  }
  resume() {
    this.resumed = true;
    return Promise.resolve();
  }
  close() {
    this.closed = true;
    return Promise.resolve();
  }
}

function lastCtx(): FakeCtx {
  return contexts[contexts.length - 1]!;
}

function setup(vibrate = vi.fn(() => true)) {
  contexts.length = 0;
  vi.stubGlobal("window", { AudioContext: FakeCtx });
  vi.stubGlobal("navigator", { vibrate });
  return vibrate;
}

afterEach(() => {
  stopOrderAlarm();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("order alarm", () => {
  it("gives the courier a repeating bell fanfare, not a siren", () => {
    setup();
    playOrderAlarm({ loud: true });
    const ctx = lastCtx();
    // 4 repeats x 5 notes x 2 partials (fundamental + metallic overtone).
    expect(ctx.oscillators).toHaveLength(40);
    expect(new Set(ctx.oscillators.map((o) => o.type))).toEqual(new Set(["sine"]));
    // The melody climbs to a bright 1760 Hz peak so it cuts through noise.
    const freqs = ctx.oscillators.flatMap((o) => o.frequency.ramps.concat(o.frequency.value));
    expect(Math.max(...freqs)).toBeGreaterThanOrEqual(1760);
    // No noise bursts: it reads as a chime, not an alarm siren.
    expect(ctx.buffers).toHaveLength(0);
    expect(ctx.resumed).toBe(true);
  });

  it("runs the courier fanfare near full volume through a limiter", () => {
    setup();
    playOrderAlarm({ loud: true });
    const ctx = lastCtx();
    expect(ctx.compressors).toHaveLength(1);
    expect(ctx.compressors[0]!.ratio.value).toBe(20);
    // First gain node is the master bus: loud, and far above the old 0.35 beep.
    expect(ctx.gains[0]!.gain.value).toBe(0.95);
    expect(ctx.gains[0]!.gain.value).toBeGreaterThan(0.35);
  });

  it("keeps the shop-owner board a short 2-note chime", () => {
    setup();
    playOrderAlarm({});
    const ctx = lastCtx();
    // 1 repeat x 2 notes x 2 partials.
    expect(ctx.oscillators).toHaveLength(4);
    expect(ctx.gains[0]!.gain.value).toBe(0.55);
  });

  it("buzzes the courier's phone and leaves the owner's phone silent", () => {
    const vibrate = setup();
    playOrderAlarm({ loud: true, vibrate: true });
    expect(vibrate).toHaveBeenCalledWith([500, 150, 500, 150, 800, 200, 500, 150, 500]);
    vibrate.mockClear();
    playOrderAlarm({ loud: true });
    expect(vibrate).not.toHaveBeenCalled();
  });

  it("rings for about 8 seconds, then reports itself finished", () => {
    vi.useFakeTimers();
    setup();
    const onEnd = vi.fn();
    playOrderAlarm({ loud: true, onEnd });
    expect(isAlarmRinging()).toBe(true);
    vi.advanceTimersByTime(8000);
    expect(onEnd).not.toHaveBeenCalled();
    vi.advanceTimersByTime(500);
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(isAlarmRinging()).toBe(false);
    expect(lastCtx().closed).toBe(true);
  });

  it("silences immediately when the courier stops it", () => {
    setup();
    const onEnd = vi.fn();
    const stop = playOrderAlarm({ loud: true, onEnd });
    const ctx = lastCtx();
    stop();
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(isAlarmRinging()).toBe(false);
    expect(ctx.closed).toBe(true);
    // Every scheduled tone is cancelled rather than left ringing.
    for (const osc of ctx.oscillators) expect(osc.stopped.length).toBe(2);
    expect(ctx.gains[0]!.gain.value).toBeCloseTo(0.0001);
  });

  it("replaces a ringing alarm when a second order lands", () => {
    setup();
    playOrderAlarm({ loud: true });
    const first = lastCtx();
    playOrderAlarm({ loud: true });
    expect(first.closed).toBe(true);
    expect(isAlarmRinging()).toBe(true);
    expect(lastCtx()).not.toBe(first);
    expect(contexts).toHaveLength(2);
  });

  it("does nothing where the browser has no audio engine", () => {
    contexts.length = 0;
    vi.stubGlobal("window", {});
    const onEnd = vi.fn();
    expect(playOrderAlarm({ loud: true, onEnd })).toBeTypeOf("function");
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(isAlarmRinging()).toBe(false);
    expect(contexts).toHaveLength(0);
  });
});
