// Tiny synthesized sound effects: no audio files, everything is WebAudio.
// The game never depends on sound; every call is guarded so a missing AudioContext is silent.
let ctx = null;
let sizzleNodes = null;

export function ensureAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
  } catch {
    ctx = null;
  }
  return ctx;
}

function tone(freq, dur, type, gain, when = 0) {
  if (!ctx) return;
  try {
    const t0 = ctx.currentTime + when;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  } catch {
    /* silent */
  }
}

function noiseBurst(dur, gain, filterFreq) {
  if (!ctx) return;
  try {
    const len = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.value = gain;
    src.connect(filter);
    filter.connect(g);
    g.connect(ctx.destination);
    src.start();
  } catch {
    /* silent */
  }
}

export const sfx = {
  chop() {
    noiseBurst(0.09, 0.5, 900);
    tone(140, 0.08, 'sine', 0.25);
  },
  pickup() {
    tone(520, 0.07, 'triangle', 0.12);
  },
  place() {
    tone(340, 0.08, 'triangle', 0.14);
    noiseBurst(0.05, 0.2, 1200);
  },
  done() {
    tone(880, 0.12, 'sine', 0.16);
    tone(1174, 0.16, 'sine', 0.14, 0.09);
  },
  serve() {
    tone(1046, 0.1, 'triangle', 0.2);
    tone(1318, 0.1, 'triangle', 0.2, 0.08);
    tone(1568, 0.22, 'triangle', 0.2, 0.16);
  },
  coin() {
    tone(1568, 0.09, 'square', 0.06);
    tone(2093, 0.18, 'square', 0.05, 0.07);
  },
  deny() {
    tone(220, 0.16, 'sawtooth', 0.1);
    tone(180, 0.2, 'sawtooth', 0.1, 0.1);
  },
  trash() {
    noiseBurst(0.16, 0.3, 500);
  },
  burn() {
    tone(196, 0.3, 'sawtooth', 0.12);
    noiseBurst(0.25, 0.25, 400);
  },
  rush() {
    tone(392, 0.12, 'triangle', 0.2);
    tone(523, 0.12, 'triangle', 0.2, 0.11);
    tone(659, 0.24, 'triangle', 0.2, 0.22);
  },
  tick() {
    tone(1200, 0.04, 'square', 0.05);
  },
};

// A soft looping sizzle while anything cooks on the grill or in the fryer.
export function setSizzle(on) {
  if (!ctx) return;
  try {
    if (on && !sizzleNodes) {
      const len = ctx.sampleRate;
      const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 5200;
      filter.Q.value = 0.6;
      const g = ctx.createGain();
      g.gain.value = 0.035;
      src.connect(filter);
      filter.connect(g);
      g.connect(ctx.destination);
      src.start();
      sizzleNodes = { src, g };
    } else if (!on && sizzleNodes) {
      sizzleNodes.src.stop();
      sizzleNodes.g.disconnect();
      sizzleNodes = null;
    }
  } catch {
    sizzleNodes = null;
  }
}
