import { DIR_DELTA, type Cell, type Direction, type LevelDef } from "../types";

export function cellKey(row: number, col: number): string {
  return `${row},${col}`;
}

export function getHeadDir(cells: Cell[]): Direction {
  if (cells.length < 2) return "right";
  const tail = cells[cells.length - 2]!;
  const head = cells[cells.length - 1]!;
  if (head.row < tail.row) return "up";
  if (head.row > tail.row) return "down";
  if (head.col > tail.col) return "right";
  return "left";
}

export interface EscapeResult {
  canEscape: boolean;
  steps: number;
}

export function buildOccupied(level: LevelDef, excludePathIndex?: number): Set<string> {
  const set = new Set<string>();
  level.paths.forEach((path, i) => {
    if (i === excludePathIndex) return;
    for (const c of path.cells) {
      set.add(cellKey(c.row, c.col));
    }
  });
  return set;
}

/**
 * Snake-style slide: head advances one cell, tail leaves (like the real Arrows game).
 */
export function checkPathEscape(
  cells: Cell[],
  dir: Direction,
  occupied: ReadonlySet<string>,
  rows: number,
  cols: number,
): EscapeResult {
  const { dr, dc } = DIR_DELTA[dir];
  const sim = cells.map((c) => ({ row: c.row, col: c.col }));
  const maxSteps = rows + cols + cells.length + 2;

  for (let step = 1; step <= maxSteps; step++) {
    const head = sim[sim.length - 1]!;
    const nextHead = { row: head.row + dr, col: head.col + dc };

    const inBounds =
      nextHead.row >= 0 && nextHead.row < rows && nextHead.col >= 0 && nextHead.col < cols;
    if (inBounds && occupied.has(cellKey(nextHead.row, nextHead.col))) {
      return { canEscape: false, steps: step };
    }

    sim.push(nextHead);
    sim.shift();

    const allOut = sim.every(
      (c) => c.row < 0 || c.row >= rows || c.col < 0 || c.col >= cols,
    );
    if (allOut) return { canEscape: true, steps: step };
  }

  return { canEscape: false, steps: 0 };
}

/** Squared distance from point to segment */
export function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const ddx = px - x1;
    const ddy = py - y1;
    return ddx * ddx + ddy * ddy;
  }
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  const ddx = px - cx;
  const ddy = py - cy;
  return ddx * ddx + ddy * ddy;
}
