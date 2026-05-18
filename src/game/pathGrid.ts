import { DIR_DELTA, type Cell, type Direction, type LevelDef, type PathDef } from "../types";

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

export function buildWallSet(level: LevelDef): Set<string> {
  const set = new Set<string>();
  for (const w of level.walls ?? []) {
    set.add(cellKey(w.row, w.col));
  }
  return set;
}

export function buildOccupied(
  level: LevelDef,
  excludePathIndex?: number,
  extraBlocked?: ReadonlySet<string>,
): Set<string> {
  const set = new Set<string>(extraBlocked);
  for (const w of level.walls ?? []) {
    set.add(cellKey(w.row, w.col));
  }
  level.paths.forEach((path, i) => {
    if (i === excludePathIndex) return;
    for (const c of path.cells) {
      set.add(cellKey(c.row, c.col));
    }
  });
  return set;
}

export function clearedPathCount(initialCount: number, remaining: number): number {
  return initialCount - remaining;
}

export function isPathLocked(
  pathDef: PathDef,
  initialPathCount: number,
  remainingPathCount: number,
): boolean {
  const need = pathDef.requiresClear ?? 0;
  if (need <= 0) return false;
  return clearedPathCount(initialPathCount, remainingPathCount) < need;
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
