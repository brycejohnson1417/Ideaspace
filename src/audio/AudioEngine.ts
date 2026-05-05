import * as Tone from 'tone';
import type { KnowledgeGraph } from '../ai/gemini';

class SoundscapeEngine {
  private isInitialized = false;
  private synths: Tone.PolySynth[] = [];
  private loop: Tone.Loop | null = null;
  private currentParams: KnowledgeGraph['audioParams'] | null = null;

  // Simple scale mappings relative to base note
  private scaleIntervals: Record<string, number[]> = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10],
    lydian: [0, 2, 4, 6, 7, 9, 11],
    mixolydian: [0, 2, 4, 5, 7, 9, 10],
    locrian: [0, 1, 3, 5, 6, 8, 10],
    pentatonic: [0, 2, 4, 7, 9],
    minor_pentatonic: [0, 3, 5, 7, 10],
  };

  async initialize() {
    if (this.isInitialized) return;
    await Tone.start();
    
    // Create a lush reverb and delay
    const reverb = new Tone.Reverb({
      decay: 8,
      wet: 0.6
    }).toDestination();
    
    const delay = new Tone.FeedbackDelay("8n", 0.4).connect(reverb);
    
    // Create base pad synth
    const padSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 2, decay: 1, sustain: 0.8, release: 4 }
    }).connect(delay);
    padSynth.volume.value = -15;

    // Create arpeggio synth
    const arpSynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "triangle" },
      envelope: { attack: 0.05, decay: 0.2, sustain: 0.2, release: 1.5 }
    }).connect(delay);
    arpSynth.volume.value = -20;

    this.synths = [padSynth, arpSynth];
    this.isInitialized = true;
  }

  private getNoteFrequency(baseFrequency: number, semitones: number) {
    return baseFrequency * Math.pow(2, semitones / 12);
  }

  playNodeInteraction() {
    if (!this.isInitialized || this.synths.length < 2) return;
    
    const baseFreq = Tone.Frequency(this.currentParams?.baseNote || "C4").toFrequency();
    const intervals = this.scaleIntervals[this.currentParams?.scaleType.toLowerCase() || 'minor'] || this.scaleIntervals.minor;
    
    // Pick a random higher note from the scale for the "chime" effect
    const randomInterval = intervals[Math.floor(Math.random() * intervals.length)] + 12; // Octave up
    const chimeFreq = this.getNoteFrequency(baseFreq as number, randomInterval);
    
    this.synths[1].triggerAttackRelease(chimeFreq, "8n", Tone.now());
  }

  applyParams(params: KnowledgeGraph['audioParams']) {
    this.currentParams = params;
    
    if (!this.isInitialized) return;

    // Apply Synth type
    this.synths.forEach(s => {
      s.set({ oscillator: { type: params.synthType }});
    });

    Tone.Transport.bpm.value = params.bpm || 60;

    const baseFreq = Tone.Frequency(params.baseNote).toFrequency();
    const intervals = this.scaleIntervals[params.scaleType.toLowerCase()] || this.scaleIntervals.minor;
    
    const scaleFrequencies = intervals.map(semitone => this.getNoteFrequency(baseFreq as number, semitone));

    // Clear old loop
    if (this.loop) {
      this.loop.stop();
      this.loop.dispose();
    }

    // Play a generative sequence
    let step = 0;
    this.loop = new Tone.Loop((time) => {
      // Play root note occasionally to anchor
      if (step % 8 === 0) {
        this.synths[0].triggerAttackRelease(scaleFrequencies[0], "1m", time);
      }
      
      // Randomly play other notes for atmosphere
      if (Math.random() > 0.6) {
        const randomNote = scaleFrequencies[Math.floor(Math.random() * scaleFrequencies.length)];
        this.synths[0].triggerAttackRelease(randomNote, "2n", time);
      }
      
      step++;
    }, "4n").start(0);

    Tone.Transport.start();
  }

  stop() {
    if (this.loop) {
      this.loop.stop();
    }
    Tone.Transport.stop();
    this.synths.forEach(s => {
      s.releaseAll();
    });
  }
}

export const audioEngine = new SoundscapeEngine();
