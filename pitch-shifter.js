class FishPitchShifter extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'semitones', defaultValue: 0, minValue: -12, maxValue: 12, automationRate: 'k-rate' }];
  }

  constructor() {
    super();
    this.bufferSize = 8192;
    this.delaySamples = Math.round(sampleRate * 0.06);
    this.buffers = [];
    this.writeIndex = 0;
    this.phase = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!output.length) return true;
    const frameCount = output[0].length;
    const semitones = parameters.semitones[0] || 0;
    const ratio = 2 ** (semitones / 12);
    const shifting = Math.abs(semitones) > 0.001;
    const phaseStep = shifting ? Math.abs(1 - ratio) / this.delaySamples : 0;

    for (let channel = 0; channel < output.length; channel++) {
      if (!this.buffers[channel]) this.buffers[channel] = new Float32Array(this.bufferSize);
    }
    
    for (let frame = 0; frame < frameCount; frame++) {
      const writePosition = (this.writeIndex + frame) % this.bufferSize;
      const secondPhase = (this.phase + 0.5) % 1;
      
      for (let channel = 0; channel < output.length; channel++) {
        const ring = this.buffers[channel];
        const source = input[channel] || input[0];
        const destination = output[channel];
        const sample = source?.[frame] || 0;
        ring[writePosition] = sample;
        
        if (!shifting) {
          destination[frame] = sample;
          continue;
        }

        let mixed = 0;
        for (const phase of [this.phase, secondPhase]) {
          const delay = ratio > 1 ? (1 - phase) * this.delaySamples : phase * this.delaySamples;
          const readPosition = (writePosition - delay + this.bufferSize) % this.bufferSize;
          const lower = Math.floor(readPosition);
          const upper = (lower + 1) % this.bufferSize;
          const fraction = readPosition - lower;
          const grain = ring[lower] * (1 - fraction) + ring[upper] * fraction;
          const weight = Math.sin(Math.PI * phase) ** 2;
          mixed += grain * weight;
        }

        // Apply soft clipping (tanh) to tame constructive interference volume spikes naturally
        destination[frame] = Math.tanh(mixed);
      }
      
      if (shifting) this.phase = (this.phase + phaseStep) % 1;
    }

    this.writeIndex = (this.writeIndex + frameCount) % this.bufferSize;
    return true;
  }
}

registerProcessor('fish-pitch-shifter', FishPitchShifter);
