import type { RefObject } from "react";
import type { GameState, Position, Station } from "./model";
export interface Telemetry extends Position {
  seconds: number;
  near: string | null;
  distance: number;
  boost: number;
}
export type Command =
  | { serial: number; type: "station"; id: string }
  | { serial: number; type: "dash" };
export interface GameBridge {
  hud: RefObject<HTMLDivElement | null>;
  run: number;
  state: GameState;
  running: boolean;
  reduced: boolean;
  overview: boolean;
  position: RefObject<Position>;
  elapsed: RefObject<number>;
  steer: RefObject<Position>;
  stations: Station[];
  command: Command | null;
  onInteract: (id: string) => void;
  onHit: () => void;
  onTelemetry: (value: Telemetry) => void;
}
