export type Direction = "up" | "right" | "down" | "left";

export interface Cell {
  row: number;
  col: number;
}

export interface PathDef {
  /** Cells from tail to head (orthogonal steps only) */
  cells: Cell[];
}

export interface LevelDef {
  rows: number;
  cols: number;
  paths: PathDef[];
}

export const DIR_DELTA: Record<Direction, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  right: { dr: 0, dc: 1 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
};
