export type Direction = "up" | "right" | "down" | "left";

export interface Cell {
  row: number;
  col: number;
}

export interface PathDef {
  /** Cells from tail to head (orthogonal steps only) */
  cells: Cell[];
  /** Hex color override, e.g. "#2563eb" */
  color?: string;
  /** Other paths that must be cleared before this one can move */
  requiresClear?: number;
}

export interface LevelDef {
  rows: number;
  cols: number;
  paths: PathDef[];
  /** Impassable cells — block sliding paths */
  walls?: Cell[];
  /** Display name in level select */
  name?: string;
  /** Target move count for a 3-star clear */
  par?: number;
}

export const DIR_DELTA: Record<Direction, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  right: { dr: 0, dc: 1 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
};
