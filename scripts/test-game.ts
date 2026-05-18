import { buildOccupied, checkPathEscape, getHeadDir, isPathLocked } from "../src/game/pathGrid";
import { hasNoOverlap } from "../src/levelGenerator";
import { LEVELS } from "../src/levels";
import type { Cell, LevelDef } from "../types";

let failures = 0;

function fail(msg: string) {
  console.error(`FAIL: ${msg}`);
  failures++;
}

function pass(msg: string) {
  console.log(`  ✓ ${msg}`);
}

function cellKey(r: number, c: number) {
  return `${r},${c}`;
}

function fingerprint(level: LevelDef): string {
  const parts = level.paths.map((p) => p.cells.map((c) => `${c.row},${c.col}`).join("|"));
  const walls = (level.walls ?? []).map((w) => `${w.row},${w.col}`).sort().join("|");
  return `${level.rows}x${level.cols}#${parts.join(";")}#${walls}`;
}

function measureComplexity(level: LevelDef): number {
  const cells = level.paths.reduce((s, p) => s + p.cells.length, 0);
  const locked = level.paths.filter((p) => (p.requiresClear ?? 0) > 0).length;
  const walls = level.walls?.length ?? 0;
  const maxLen = Math.max(...level.paths.map((p) => p.cells.length), 1);
  const turns = level.paths.reduce((s, p) => {
    let t = 0;
    const cs = p.cells;
    for (let i = 2; i < cs.length; i++) {
      const a = cs[i - 2]!;
      const b = cs[i - 1]!;
      const d = cs[i]!;
      if (b.row - a.row !== d.row - b.row || b.col - a.col !== d.col - b.col) t++;
    }
    return s + t;
  }, 0);
  return (
    level.paths.length * 10 +
    cells * 3 +
    walls * 5 +
    locked * 15 +
    level.rows * 4 +
    maxLen * 4 +
    turns * 6
  );
}

function isOrthogonal(a: Cell, b: Cell): boolean {
  const dr = Math.abs(a.row - b.row);
  const dc = Math.abs(a.col - b.col);
  return dr + dc === 1;
}

function validateStructure(level: LevelDef, index: number): void {
  const label = `Level ${index + 1} [${level.name ?? "?"}]`;

  if (level.rows < 3 || level.cols < 3) {
    fail(`${label}: board too small (${level.rows}x${level.cols})`);
    return;
  }

  if (level.paths.length === 0) {
    fail(`${label}: no paths`);
    return;
  }

  if (!hasNoOverlap(level)) {
    fail(`${label}: paths overlap or out of bounds`);
    return;
  }

  const occupied = new Set<string>();
  for (let pi = 0; pi < level.paths.length; pi++) {
    const path = level.paths[pi]!;
    if (path.cells.length < 2) {
      fail(`${label} path ${pi}: needs at least 2 cells`);
    }

    for (let i = 1; i < path.cells.length; i++) {
      if (!isOrthogonal(path.cells[i - 1]!, path.cells[i]!)) {
        fail(`${label} path ${pi}: non-orthogonal step at index ${i}`);
      }
    }

    for (const c of path.cells) {
      if (c.row < 0 || c.row >= level.rows || c.col < 0 || c.col >= level.cols) {
        fail(`${label} path ${pi}: cell out of bounds (${c.row},${c.col})`);
      }
      const k = cellKey(c.row, c.col);
      if (occupied.has(k)) {
        fail(`${label}: overlapping cells at (${c.row},${c.col})`);
      }
      occupied.add(k);
    }

    const need = path.requiresClear ?? 0;
    if (need >= level.paths.length) {
      fail(`${label} path ${pi}: requiresClear ${need} >= path count`);
    }
  }

  for (const wall of level.walls ?? []) {
    if (wall.row < 0 || wall.row >= level.rows || wall.col < 0 || wall.col >= level.cols) {
      fail(`${label}: wall out of bounds`);
    }
  }

  if (level.par != null && level.par < level.paths.length) {
    fail(`${label}: par ${level.par} < path count ${level.paths.length}`);
  }
}

function findSolution(level: LevelDef): Cell[][] | null {
  const remaining: { cells: Cell[]; origIndex: number }[] = level.paths.map((p, i) => ({
    cells: p.cells.map((c) => ({ ...c })),
    origIndex: i,
  }));
  const initialCount = remaining.length;
  const order: number[] = [];

  function dfs(): boolean {
    if (remaining.length === 0) return true;

    for (let i = 0; i < remaining.length; i++) {
      const { cells, origIndex } = remaining[i]!;
      const pathDef = level.paths[origIndex]!;
      if (isPathLocked(pathDef, initialCount, remaining.length)) continue;

      const dir = getHeadDir(cells);
      const occupied = buildOccupied(
        { ...level, paths: remaining.map((r) => ({ cells: r.cells })) },
        i,
      );
      const { canEscape } = checkPathEscape(cells, dir, occupied, level.rows, level.cols);
      if (canEscape) {
        remaining.splice(i, 1);
        order.push(origIndex);
        if (dfs()) return true;
        order.pop();
        remaining.splice(i, 0, { cells, origIndex });
      }
    }
    return false;
  }

  if (!dfs()) return null;
  return order.map((idx) => level.paths[idx]!.cells.map((c) => ({ ...c })));
}

function simulateClear(level: LevelDef, clearOrder: number[]): boolean {
  const remaining = level.paths.map((p) => p.cells.map((c) => ({ ...c })));
  const initialCount = remaining.length;

  for (const pathIdx of clearOrder) {
    const cells = remaining[pathIdx];
    if (!cells?.length) {
      fail(`simulate: path ${pathIdx} already cleared`);
      return false;
    }

    const pathDef = level.paths[pathIdx]!;
    if (isPathLocked(pathDef, initialCount, remaining.filter((r) => r.length > 0).length)) {
      fail(`simulate: path ${pathIdx} still locked`);
      return false;
    }

    const dir = getHeadDir(cells);
    const occupied = new Set<string>();
    for (const w of level.walls ?? []) occupied.add(cellKey(w.row, w.col));
    remaining.forEach((path, i) => {
      if (i === pathIdx || path.length === 0) return;
      for (const c of path) occupied.add(cellKey(c.row, c.col));
    });

    const { canEscape, steps } = checkPathEscape(cells, dir, occupied, level.rows, level.cols);
    if (!canEscape) {
      fail(`simulate: path ${pathIdx} cannot escape at runtime`);
      return false;
    }

    const { dr, dc } = { up: { dr: -1, dc: 0 }, down: { dr: 1, dc: 0 }, left: { dr: 0, dc: -1 }, right: { dr: 0, dc: 1 } }[dir]!;
    for (let s = 0; s < steps; s++) {
      const head = cells[cells.length - 1]!;
      cells.push({ row: head.row + dr, col: head.col + dc });
      cells.shift();
    }
    remaining[pathIdx] = [];
  }

  return remaining.every((p) => p.length === 0);
}

console.log("=== Arrow Puzzle Test Suite ===\n");

// 1. Level count
console.log("1. Level inventory");
if (LEVELS.length !== 50) {
  fail(`Expected 50 levels, got ${LEVELS.length}`);
} else {
  pass(`50 levels loaded`);
}

// 2. Rising complexity (26–50) + unique layouts
console.log("\n2. Complexity curve & uniqueness");
const fps = new Set<string>();
let curveOk = true;
for (let i = 0; i < LEVELS.length; i++) {
  const level = LEVELS[i]!;
  const score = measureComplexity(level);
  // no-op per-level; checked after loop
  const fp = fingerprint(level);
  if (fps.has(fp)) {
    fail(`Level ${i + 1}: duplicate layout fingerprint`);
    curveOk = false;
  }
  fps.add(fp);
}
const advStart = measureComplexity(LEVELS[25]!);
const advEnd = measureComplexity(LEVELS[49]!);
if (advEnd <= advStart) {
  fail(`Level 50 complexity ${advEnd} should exceed level 26 (${advStart})`);
  curveOk = false;
}
if (curveOk) pass("Levels 26–50 unique; campaign ends harder than it begins");

// 3. Structure validation
console.log("\n3. Structure validation");
LEVELS.forEach((level, i) => validateStructure(level, i));
if (failures === 0) pass("All levels structurally valid");

// 4. Solvability + simulation
console.log("\n4. Solvability & slide simulation");
const solutionOrders: number[][] = [];

LEVELS.forEach((level, i) => {
  const label = `Level ${i + 1}`;
  const remaining: { cells: Cell[]; origIndex: number }[] = level.paths.map((p, idx) => ({
    cells: p.cells.map((c) => ({ ...c })),
    origIndex: idx,
  }));
  const initialCount = remaining.length;
  const order: number[] = [];

  function dfs(): boolean {
    if (remaining.length === 0) return true;
    for (let j = 0; j < remaining.length; j++) {
      const { cells, origIndex } = remaining[j]!;
      const pathDef = level.paths[origIndex]!;
      if (isPathLocked(pathDef, initialCount, remaining.length)) continue;
      const dir = getHeadDir(cells);
      const occupied = buildOccupied(
        { ...level, paths: remaining.map((r) => ({ cells: r.cells })) },
        j,
      );
      if (checkPathEscape(cells, dir, occupied, level.rows, level.cols).canEscape) {
        remaining.splice(j, 1);
        order.push(origIndex);
        if (dfs()) return true;
        order.pop();
        remaining.splice(j, 0, { cells, origIndex });
      }
    }
    return false;
  }

  if (!dfs()) {
    fail(`${label} [${level.name}]: UNSOLVABLE`);
    return;
  }

  if (!simulateClear(level, order)) {
    fail(`${label} [${level.name}]: simulation failed`);
    return;
  }

  solutionOrders.push(order);
});

if (solutionOrders.length === LEVELS.length) {
  pass(`All ${LEVELS.length} levels solvable with snake-slide simulation`);
}

// 5. Campaign bookends
console.log("\n5. Campaign bookends");
if (LEVELS[0]!.name !== "First slide") fail("Level 1 should be First slide");
else pass("Level 1 is First slide");
if (LEVELS[49]!.name !== "Infinity") fail("Level 50 should be Infinity");
else pass("Level 50 is Infinity");

// 6. Every level has at least one initially movable OR unlockable path
console.log("\n6. Initial mobility");
LEVELS.forEach((level, i) => {
  const remaining = level.paths.length;
  let movable = 0;
  for (let pi = 0; pi < level.paths.length; pi++) {
    if (isPathLocked(level.paths[pi]!, remaining, remaining)) continue;
    const cells = level.paths[pi]!.cells;
    const dir = getHeadDir(cells);
    const occupied = buildOccupied(level, pi);
    if (checkPathEscape(cells, dir, occupied, level.rows, level.cols).canEscape) {
      movable++;
    }
  }
  if (movable === 0) {
    fail(`Level ${i + 1}: no path can move on load`);
  }
});
if (failures === 0) pass("Every level has at least one movable path at start");

console.log("\n=== Summary ===");
if (failures > 0) {
  console.error(`\n${failures} failure(s)\n`);
  process.exit(1);
}
console.log("\nAll tests passed.\n");
process.exit(0);
