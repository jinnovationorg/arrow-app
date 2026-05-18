import type { Cell } from "../src/types";

export type Move = "R" | "L" | "U" | "D";

/** Build orthogonal path from start cell following moves (head at last cell). */
export function walk(start: Cell, moves: Move[]): Cell[] {
  const cells: Cell[] = [{ row: start.row, col: start.col }];
  let r = start.row;
  let c = start.col;
  for (const m of moves) {
    if (m === "R") c++;
    else if (m === "L") c--;
    else if (m === "D") r++;
    else r--;
    cells.push({ row: r, col: c });
  }
  return cells;
}

export function countTurns(cells: Cell[]): number {
  if (cells.length < 3) return 0;
  let turns = 0;
  for (let i = 2; i < cells.length; i++) {
    const a = cells[i - 2]!;
    const b = cells[i - 1]!;
    const d = cells[i]!;
    const dr1 = b.row - a.row;
    const dc1 = b.col - a.col;
    const dr2 = d.row - b.row;
    const dc2 = d.col - b.col;
    if (dr1 !== dr2 || dc1 !== dc2) turns++;
  }
  return turns;
}

export function repeat(m: Move, n: number): Move[] {
  return Array.from({ length: Math.max(0, n) }, () => m);
}

/** L / hook — horizontal then vertical */
export function shapeL(horiz: number, vert: number, flipH = false, flipV = false): Move[] {
  const h = flipH ? ("L" as Move) : "R";
  const v = flipV ? ("U" as Move) : "D";
  return [...repeat(h, horiz), ...repeat(v, vert)];
}

/** U / C arc */
export function shapeU(width: number, depth: number): Move[] {
  if (width < 1 || depth < 1) return [];
  return [
    ...repeat("R", width),
    ...repeat("D", depth),
    ...repeat("L", width),
    ...repeat("U", depth - 1),
  ];
}

/** S / serpentine zigzag */
export function shapeS(leg: number, legs = 3): Move[] {
  const out: Move[] = [];
  let dir: Move = "R";
  for (let i = 0; i < legs; i++) {
    out.push(...repeat(dir, leg));
    out.push(...repeat("D", leg));
    dir = dir === "R" ? "L" : "R";
  }
  return out;
}

/** Partial box / spiral corner */
export function shapeCorner(arm: number): Move[] {
  const a = Math.max(2, arm);
  return [...repeat("R", a), ...repeat("D", a), ...repeat("L", a - 1), ...repeat("U", a - 1)];
}

/** Pick a curved template for this slot (always has at least one turn when len >= 3). */
export function pickShape(slot: number, bump: number, minLen: number): Move[] {
  const kind = (slot + bump) % 7;
  const leg = Math.max(2, Math.floor(minLen / 2) + (slot % 2));
  switch (kind) {
    case 0:
      return shapeL(leg, leg, slot % 2 === 0, bump % 2 === 0);
    case 1:
      return shapeL(leg + 1, leg, true, false);
    case 2:
      return shapeU(leg, Math.max(1, leg - 1));
    case 3:
      return shapeS(Math.max(2, leg - 1), 2 + (slot % 2));
    case 4:
      return shapeCorner(leg);
    case 5:
      return [...shapeL(leg, 1), ...repeat("R", 1), ...repeat("D", leg)];
    default:
      return [...repeat("R", leg), ...repeat("D", 1), ...repeat("L", leg - 1), ...repeat("U", 1)];
  }
}

export function translate(cells: Cell[], dr: number, dc: number): Cell[] {
  return cells.map((c) => ({ row: c.row + dr, col: c.col + dc }));
}

export function fitsBoard(cells: Cell[], rows: number, cols: number): boolean {
  for (const c of cells) {
    if (c.row < 0 || c.row >= rows || c.col < 0 || c.col >= cols) return false;
  }
  return cells.length >= 2;
}

export function hasOverlap(cells: Cell[], occupied: Set<string>): boolean {
  for (const c of cells) {
    if (occupied.has(`${c.row},${c.col}`)) return true;
  }
  return false;
}

export function markOccupied(cells: Cell[], occupied: Set<string>): void {
  for (const c of cells) occupied.add(`${c.row},${c.col}`);
}
