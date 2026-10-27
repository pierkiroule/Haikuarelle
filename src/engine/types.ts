/** Public facade. Coordinates are normalized, with the origin at the top left. */
export interface WatercolorEngine {
  generate(seed: number): void;
  deposit(x: number, y: number, pigment: string): void;
  addWater(x: number, y: number, amount: number): void;
  setWetness(value: number): void;
  setGranulation(value: number): void;
  pause(): void;
  resume(): void;
  exportPNG(): Promise<Blob>;
  destroy(): void;
}
export interface EngineSettings { palette: string; granulation: number; wetness: number; complexity: number; ink?: number; resonance?:number; sharpness?:number; dryingThreshold?:number; format?: 'portrait'|'landscape'|'a4' }
export type Phase = 'idle' | 'wetting' | 'wash' | 'meeting' | 'bloom' | 'ink' | 'drying' | 'complete';
export interface EngineStatus { seed: number; progress: number; phase: Phase; paused: boolean; fps: number; ticks: number; wetStrokes?:number; hasPigment?:boolean }
export interface Point { x: number; y: number }
export type GestureKind = 'water' | 'deposit' | 'wash' | 'run' | 'meeting' | 'bloom' | 'lift';
export interface Gesture {
  kind: GestureKind;
  start: number;
  duration: number;
  points: Point[];
  radius: number;
  load: number;
  ink: number;
  flow: number;
  phase: number;
  /** Absolute score time at which an interrupted live voice stops depositing. */
  stop?: number;
}
export interface InkStroke {
  points: Point[];
  start: number;
  duration: number;
  width: number;
  opacity: number;
  seed: number;
  stop?: number;
  /** A live line has its width already shaped by pressure and speed. */
  continuous?: boolean;
}
export interface Composition {
  title: string;
  gestures: Gesture[];
  duration: number;
  seed: number;
  ink?: InkStroke[];
  source?: {duration: number; fingerprint: number; activeSeconds: number};
}
