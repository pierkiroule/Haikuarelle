export const ANALYSIS_RATE = 16000;
export const EXCERPT_SECONDS = 15;
export const FEATURE_RATE = 30;

export interface AudioFrame {
  time: number;
  rms: number;
  energy: number;
  bass: number;
  mid: number;
  treble: number;
  brightness: number;
  flux: number;
  width: number;
  balance: number;
  active: boolean;
}
export interface AudioAnalysis {
  version: 1;
  seed: number;
  duration: number;
  frames: AudioFrame[];
  waveform: number[];
  onsets: number[];
  summary: {
    energy: number;
    bass: number;
    treble: number;
    brightness: number;
    width: number;
    silence: number;
    contrast: number;
  };
}
export interface AnalysisInput {
  left: Float32Array;
  right?: Float32Array;
  sampleRate: number;
}
