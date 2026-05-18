/**
 * Builds 50 unique, solvable levels with strictly increasing complexity.
 * Run: npx tsx scripts/build-campaign-levels.ts
 */
import { writeFileSync } from "fs";
import { buildOccupied, checkPathEscape, getHeadDir, isPathLocked } from "../src/game/pathGrid";
import type { Cell, LevelDef, PathDef } from "../src/types";

const PALETTE = ["#1a1a1a", "#2563eb", "#059669", "#d97706", "#7c3aed", "#db2777", "#0ea5e9", "#e11d48"];
const NAMES = [
  "Awakening", "Twin paths", "First bend", "Cross lanes", "Long march",
  "Hook pair", "Split routes", "Three-way", "Interlock", "Weave",
  "North star", "River bend", "Serpent", "Ring road", "Four winds",
  "Stone gap", "Pillars", "Barrier", "Key", "Chain",
  "Fortress", "Vault", "Spiral", "Crossroads", "Master",
  "Horizon", "Braid", "Coil", "Crosshair", "Stairwell",
  "Rampart", "Outpost", "Split keep", "Channel", "Inner ring",
  "Spine key", "Wide chain", "Outer keep", "Deep vault", "Citadel",
  "Grand spiral", "Grand cross", "Grand hall", "Mega ring", "Mega flow",
  "Royal gate", "Royal coil", "Sixfold", "Penultimate", "Infinity",
];

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
  return level.paths.length * 10 + cells * 3 + walls * 5 + locked * 15 + level.rows * 4 + maxLen * 4;
}

function solvable(level: LevelDef): boolean {
  const remaining = level.paths.map((p, i) => ({
    cells: p.cells.map((c) => ({ ...c })),
    origIndex: i,
  }));
  const initialCount = remaining.length;

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
      if (checkPathEscape(cells, dir, occupied, level.rows, level.cols).canEscape) {
        remaining.splice(i, 1);
        if (dfs()) return true;
        remaining.splice(i, 0, { cells, origIndex });
      }
    }
    return false;
  }
  return dfs();
}

function buildLevel(index: number, prevScore: number, usedFp: Set<string>): LevelDef {
  const n = index;

  for (let bump = 0; bump < 120; bump++) {
    const pathCount = Math.min(22, 5 + Math.floor(n / 2.5) + Math.floor(bump / 15));
    let size = Math.min(16, 6 + Math.floor(n / 3.5) + Math.floor(bump / 12));
    if (size < pathCount + 2) size = pathCount + 3;
    const segLen = Math.min(size - 1, 3 + Math.floor(n / 5) + (n % 3) + Math.floor(bump / 8));
    const wallCount =
      n < 8 ? 0 : Math.min(size, 2 + Math.floor((n - 8) / 1.5) + Math.floor(bump / 20));
    const lockCount = n < 16 ? 0 : n < 32 ? 1 : 2;

    const paths: PathDef[] = [];
    for (let i = 0; i < pathCount; i++) {
      const row = i % size;
      const color = PALETTE[i % PALETTE.length];
      const cells: Cell[] =
        i % 2 === 0
          ? Array.from({ length: segLen }, (_, c) => ({ row, col: c }))
          : Array.from({ length: segLen }, (_, k) => ({ row, col: size - 1 - k }));
      paths.push({ cells, color });
    }

    const occupied = new Set<string>();
    for (const p of paths) for (const c of p.cells) occupied.add(cellKey(c.row, c.col));

    const walls: Cell[] = [];
    for (let w = 0; w < wallCount; w++) {
      const band = Math.max(1, size - pathCount - 1);
      const r = pathCount + (w % band);
      const c = 1 + ((w * 2 + n + bump) % Math.max(1, size - 2));
      const k = cellKey(r, c);
      if (!occupied.has(k)) {
        walls.push({ row: r, col: c });
        occupied.add(k);
      }
    }

    if (lockCount > 0) {
      for (let li = 0; li < lockCount; li++) {
        const p = paths[paths.length - 1 - li]!;
        p.requiresClear = Math.max(2, pathCount - 2 - li);
        p.color = "#db2777";
      }
    }

    const level: LevelDef = {
      rows: size,
      cols: size,
      paths,
      name: NAMES[n] ?? `Stage ${n + 1}`,
      par: pathCount,
      walls: walls.length ? walls : undefined,
    };

    const fp = fingerprint(level);
    if (usedFp.has(fp)) continue;
    if (!solvable(level)) continue;

    const score = measureComplexity(level);
    if (score <= prevScore + 2) continue;

    usedFp.add(fp);
    return level;
  }

  throw new Error(`Could not build level ${n + 1}`);
}

const levels: LevelDef[] = [];
const usedFp = new Set<string>();
let prevScore = 0;

for (let i = 0; i < 50; i++) {
  const level = buildLevel(i, prevScore, usedFp);
  const score = measureComplexity(level);
  levels.push(level);
  prevScore = score;
  console.log(
    `L${i + 1} score=${score} paths=${level.paths.length} ${level.rows}x${level.cols} walls=${level.walls?.length ?? 0}`,
  );
}

function emitPath(p: PathDef, indent: string): string {
  const cells = p.cells.map((c) => `[${c.row}, ${c.col}]`).join(", ");
  const opts: string[] = [];
  if (p.color && p.color !== "#1a1a1a") opts.push(`color: "${p.color}"`);
  if (p.requiresClear) opts.push(`requiresClear: ${p.requiresClear}`);
  const optStr = opts.length ? `, { ${opts.join(", ")} }` : "";
  return `${indent}path([${cells}]${optStr}),`;
}

function emitLevel(level: LevelDef): string {
  const pathsStr = level.paths.map((p) => emitPath(p, "      ")).join("\n");
  const walls = level.walls ?? [];
  const opts: string[] = [`name: "${level.name}"`, `par: ${level.par}`];
  if (walls.length > 0) {
    opts.push(`walls: wall(${walls.map((w) => `[${w.row}, ${w.col}]`).join(", ")})`);
  }
  return `  level(
    ${level.rows},
    ${level.cols},
    [
${pathsStr}
    ],
    { ${opts.join(", ")} },
  ),`;
}

const body = levels.map(emitLevel).join("\n");

const file = `import type { Cell, LevelDef, PathDef } from "./types";

function path(
  cells: [number, number][],
  opts?: { color?: string; requiresClear?: number },
): PathDef {
  return {
    cells: cells.map(([row, col]) => ({ row, col })),
    ...opts,
  };
}

function wall(...cells: [number, number][]): Cell[] {
  return cells.map(([row, col]) => ({ row, col }));
}

function level(
  rows: number,
  cols: number,
  paths: PathDef[],
  opts?: { walls?: Cell[]; name?: string; par?: number },
): LevelDef {
  return { rows, cols, paths, ...opts };
}

/** 50 unique campaign levels — complexity rises every stage */
export const LEVELS: LevelDef[] = [
${body}
];

export const STORAGE_KEY = "arrows-puzzle-level";
export const STARS_KEY = "arrows-puzzle-stars";
`;

writeFileSync(new URL("../src/levels.ts", import.meta.url).pathname, file);
console.log("\nWrote src/levels.ts");
