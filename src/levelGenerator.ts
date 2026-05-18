import type { LevelDef } from "./types";

function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

/** Returns false if any two paths share a cell or any cell is out of bounds. */
export function hasNoOverlap(level: LevelDef): boolean {
  const seen = new Set<string>();
  for (const path of level.paths) {
    for (const c of path.cells) {
      const k = cellKey(c.row, c.col);
      if (seen.has(k)) return false;
      if (c.row < 0 || c.row >= level.rows || c.col < 0 || c.col >= level.cols) return false;
      seen.add(k);
    }
  }
  return true;
}
