// Granular synthesis AudioWorkletProcessor.
// Self-contained (no ES module imports) so it works in all AudioWorklet contexts.
// Ported from GrainSwift's GrainSource.

const MAX_GRAINS = 2000;
const MAX_SIZE = 44100;
const MAX_JITTER = 11025;
const MAX_ATTACK_TIME = 88200;
const MAX_RELEASE_TIME = 88200;
const MIN_LFO_PERIOD = 441;
const MAX_LFO_PERIOD = 441000;

// ─── LFO ────────────────────────────────────────────────────────────────────

class LFO {
  constructor() {
    this.offset = 0;
    this.period = 22050;
    this.level = 0;
  }
  step() {
    this.level = Math.sin((2 * Math.PI * this.offset) / this.period);
    this.offset = (this.offset + 1) % this.period;
  }
}

// ─── ASR Envelope ───────────────────────────────────────────────────────────

const ENV_IDLE = 0;
const ENV_ATTACK = 1;
const ENV_SUSTAIN = 2;
const ENV_RELEASE = 3;

class ASREnvelope {
  constructor() {
    this.stage = ENV_IDLE;
    this.phasePos = 0;
    this.attackTime = 22050;
    this.releaseTime = 22050;
    this.level = 0;
    this.hold = false;
  }
  step() {
    if (this.hold) return;
    switch (this.stage) {
      case ENV_ATTACK:
        if (this.attackTime <= 0) {
          this.level = 1;
          this.stage = ENV_SUSTAIN;
        } else {
          this.phasePos++;
          this.level = this.phasePos / this.attackTime;
          if (this.level >= 1) {
            this.level = 1;
            this.stage = ENV_SUSTAIN;
          }
        }
        break;
      case ENV_SUSTAIN:
        this.level = 1;
        break;
      case ENV_RELEASE:
        if (this.releaseTime <= 0) {
          this.level = 0;
          this.stage = ENV_IDLE;
        } else {
          this.phasePos++;
          this.level = 1 - this.phasePos / this.releaseTime;
          if (this.level <= 0) {
            this.level = 0;
            this.stage = ENV_IDLE;
          }
        }
        break;
    }
  }
  triggerHold() {
    this.hold = true;
    this.stage = ENV_ATTACK;
    this.phasePos = 0;
    this.level = 0;
  }
  triggerRelease() {
    this.hold = false;
    this.stage = ENV_RELEASE;
    this.phasePos = 0;
  }
}

// ─── Grain ──────────────────────────────────────────────────────────────────

class Grain {
  constructor() {
    this.smoothOffset = 0;
    this.length = 4410;
    this.index = 0;
    this.delay = 0;
    this.ramp = 735;
    this.pitch = 1;
  }

  sample(dataL, dataR, bufferLength) {
    const offset = Math.floor(this.smoothOffset);

    if (offset < this.delay) {
      this._advance();
      return;
    }

    const attackIndex = offset - this.delay;
    const audibleLength = this.length - this.delay;

    let envelope = 1;
    if (this.ramp > 0) {
      const attackFrac = attackIndex / this.ramp;
      const decayFrac = (audibleLength - attackIndex) / this.ramp;
      if (attackFrac < 1) {
        envelope = attackFrac;
      } else if (decayFrac < 1) {
        envelope = decayFrac > 0 ? decayFrac : 0;
      }
    }

    const readIndex = (this.index + offset) % bufferLength;
    this._sampleL = dataL[readIndex] * envelope;
    this._sampleR = dataR[readIndex] * envelope;

    this._advance();
  }

  _advance() {
    const cycleLen = this.length + this.delay;
    if (cycleLen <= 0) {
      this.smoothOffset = 0;
      return;
    }
    this.smoothOffset = (this.smoothOffset + this.pitch) % cycleLen;
    if (this.smoothOffset < 0) this.smoothOffset = 0;
  }

  get atCycleBoundary() {
    return Math.floor(this.smoothOffset) === 0;
  }

  resample(bufferLength, bufferIndex, grainLength, grainDelay, grainRamp, grainPitch, indexJitter, lengthJitter, delayJitter, pitchJitter) {
    this.index = Math.floor(bufferIndex + (Math.random() * 2 - 1) * indexJitter);
    if (this.index < 0) this.index += bufferLength;
    this.index = this.index % bufferLength;

    this.length = Math.max(1, Math.floor(grainLength + (Math.random() * 2 - 1) * lengthJitter));
    this.delay = Math.max(0, Math.floor(grainDelay + (Math.random() * 2 - 1) * delayJitter));

    const maxRamp = Math.floor(this.length / 2);
    this.ramp = Math.min(Math.floor(grainRamp), maxRamp);
    this.pitch = Math.max(0.05, grainPitch + (Math.random() * 2 - 1) * pitchJitter);
  }
}

// ─── Processor ──────────────────────────────────────────────────────────────

class GranularProcessor extends AudioWorkletProcessor {

  static get parameterDescriptors() {
    return [
      { name: "density",        defaultValue: 0.1,  minValue: 0.01, maxValue: 1,    automationRate: "k-rate" },
      { name: "position",       defaultValue: 0.5,  minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "size",           defaultValue: 0.1,  minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "spread",         defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "ramp",           defaultValue: 0.5,  minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "pitch",          defaultValue: 0.5,  minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "volume",         defaultValue: 0.8,  minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "positionJitter", defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "sizeJitter",     defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "spreadJitter",   defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "pitchJitter",    defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "lfo1Period",     defaultValue: 0.5,  minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "lfo1Position",   defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "lfo1Size",       defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "lfo1Spread",     defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "lfo1Pitch",      defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "lfo2Period",     defaultValue: 0.5,  minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "lfo2Position",   defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "lfo2Size",       defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "lfo2Spread",     defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "lfo2Pitch",      defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "env1Attack",     defaultValue: 0.25, minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "env1Release",    defaultValue: 0.25, minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "env1Position",   defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "env1Size",       defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "env1Spread",     defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
      { name: "env1Pitch",      defaultValue: 0,    minValue: 0,    maxValue: 1,    automationRate: "k-rate" },
    ];
  }

  constructor() {
    super();
    this.grains = [];
    for (let i = 0; i < MAX_GRAINS; i++) {
      this.grains.push(new Grain());
    }
    this.grainCount = 0;
    this.dataL = new Float32Array(0);
    this.dataR = new Float32Array(0);
    this.bufferLength = 0;
    this.lfo1 = new LFO();
    this.lfo2 = new LFO();
    this.env1 = new ASREnvelope();

    this.port.onmessage = (e) => {
      const { type } = e.data;
      switch (type) {
        case "loadBuffer": {
          const { channelData } = e.data;
          this.dataL = channelData[0] || new Float32Array(0);
          this.dataR = channelData[1] || channelData[0] || new Float32Array(0);
          this.bufferLength = this.dataL.length;
          break;
        }
        case "envHold":
          this.env1.triggerHold();
          break;
        case "envRelease":
          this.env1.triggerRelease();
          break;
        case "envReset":
          this.env1.stage = ENV_IDLE;
          this.env1.phasePos = 0;
          this.env1.level = 0;
          this.env1.hold = false;
          break;
      }
    };
  }

  _p(params, name) {
    const arr = params[name];
    return arr ? arr[0] : 0;
  }

  process(_inputs, outputs, parameters) {
    const output = outputs[0];
    if (!output) return true;
    const outL = output[0];
    const outR = output[1] || output[0];
    if (!outL || !outR) return true;
    if (this.bufferLength === 0) return true;

    const density = this._p(parameters, "density");
    const position = this._p(parameters, "position");
    const size = this._p(parameters, "size");
    const spread = this._p(parameters, "spread");
    const ramp = this._p(parameters, "ramp");
    const pitch = this._p(parameters, "pitch");
    const volume = this._p(parameters, "volume");
    const positionJitter = this._p(parameters, "positionJitter");
    const sizeJitter = this._p(parameters, "sizeJitter");
    const spreadJitter = this._p(parameters, "spreadJitter");
    const pitchJitter = this._p(parameters, "pitchJitter");

    const lfo1Period = this._p(parameters, "lfo1Period");
    const lfo1Position = this._p(parameters, "lfo1Position");
    const lfo1Size = this._p(parameters, "lfo1Size");
    const lfo1Spread = this._p(parameters, "lfo1Spread");
    const lfo1Pitch = this._p(parameters, "lfo1Pitch");
    const lfo2Period = this._p(parameters, "lfo2Period");
    const lfo2Position = this._p(parameters, "lfo2Position");
    const lfo2Size = this._p(parameters, "lfo2Size");
    const lfo2Spread = this._p(parameters, "lfo2Spread");
    const lfo2Pitch = this._p(parameters, "lfo2Pitch");

    const env1Attack = this._p(parameters, "env1Attack");
    const env1Release = this._p(parameters, "env1Release");
    const env1Position = this._p(parameters, "env1Position");
    const env1Size = this._p(parameters, "env1Size");
    const env1Spread = this._p(parameters, "env1Spread");
    const env1Pitch = this._p(parameters, "env1Pitch");

    this.lfo1.period = Math.max(MIN_LFO_PERIOD, Math.floor(lfo1Period * MAX_LFO_PERIOD));
    this.lfo2.period = Math.max(MIN_LFO_PERIOD, Math.floor(lfo2Period * MAX_LFO_PERIOD));
    this.env1.attackTime = Math.floor(env1Attack * MAX_ATTACK_TIME);
    this.env1.releaseTime = Math.floor(env1Release * MAX_RELEASE_TIME);

    const bufLen = this.bufferLength;
    const maxGrainLength = Math.min(MAX_SIZE, bufLen);

    const baseIndex = Math.floor(position * (bufLen - 1));
    const baseLength = Math.max(441, Math.floor(size * maxGrainLength));
    const baseDelay = Math.floor(spread * MAX_SIZE);
    const maxRamp = Math.floor(baseLength / 2);
    const baseRamp = Math.floor(ramp * maxRamp);
    const basePitch = pitch * 2;
    const baseIndexJitter = positionJitter * MAX_JITTER;
    const baseLengthJitter = sizeJitter * MAX_JITTER;
    const baseDelayJitter = spreadJitter * MAX_JITTER;
    const basePitchJitter = pitchJitter;

    const targetCount = Math.floor(density * MAX_GRAINS);

    for (let s = 0; s < outL.length; s++) {
      if (this.grainCount < targetCount) this.grainCount++;
      else if (this.grainCount > targetCount) this.grainCount--;

      const n = this.grainCount;
      if (n <= 0) {
        outL[s] = 0;
        outR[s] = 0;
        this.lfo1.step();
        this.lfo2.step();
        this.env1.step();
        continue;
      }

      const amp = 1 / Math.sqrt(n);
      let sumL = 0;
      let sumR = 0;

      const lfo1L = this.lfo1.level;
      const lfo2L = this.lfo2.level;
      const envL = this.env1.level;

      const modIndex = baseIndex
        + lfo1L * lfo1Position * MAX_JITTER
        + lfo2L * lfo2Position * MAX_JITTER
        + envL * env1Position * MAX_JITTER;
      const modLength = baseLength
        + lfo1L * lfo1Size * MAX_JITTER
        + lfo2L * lfo2Size * MAX_JITTER
        + envL * env1Size * MAX_JITTER;
      const modDelay = baseDelay
        + lfo1L * lfo1Spread * MAX_JITTER
        + lfo2L * lfo2Spread * MAX_JITTER
        + envL * env1Spread * MAX_JITTER;
      const modPitch = basePitch
        + lfo1L * lfo1Pitch
        + lfo2L * lfo2Pitch
        + envL * env1Pitch;

      for (let g = 0; g < n; g++) {
        const grain = this.grains[g];

        if (grain.atCycleBoundary) {
          grain.resample(
            bufLen,
            modIndex,
            Math.max(1, modLength),
            Math.max(0, modDelay),
            baseRamp,
            modPitch,
            baseIndexJitter,
            baseLengthJitter,
            baseDelayJitter,
            basePitchJitter,
          );
        }

        grain._sampleL = 0;
        grain._sampleR = 0;
        grain.sample(this.dataL, this.dataR, bufLen);
        sumL += grain._sampleL;
        sumR += grain._sampleR;
      }

      const envVolume = volume - (1 - envL);
      const finalVol = Math.max(0, envVolume) * amp;

      outL[s] = sumL * finalVol;
      outR[s] = sumR * finalVol;

      this.lfo1.step();
      this.lfo2.step();
      this.env1.step();
    }

    return true;
  }
}

registerProcessor("granular-processor", GranularProcessor);
