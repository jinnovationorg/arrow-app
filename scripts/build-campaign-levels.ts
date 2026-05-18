/**
 * Assembles campaign: handcrafted 1–25 + curated curved 26–50.
 * Run: npm run build-levels
 */
import { writeFileSync } from "fs";
import type { LevelDef, PathDef } from "../src/types";
import { CURATED_ADVANCED } from "./curated-advanced";
import { HANDCRAFTED_LEVELS } from "./handcrafted-base";

const levels: LevelDef[] = [...HANDCRAFTED_LEVELS, ...CURATED_ADVANCED];

if (levels.length !== 50) {
  throw new Error(`Expected 50 levels, got ${levels.length}`);
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

/** 50 campaign levels — handcrafted 1–25, curved puzzles 26–50 */
export const LEVELS: LevelDef[] = [
${body}
];

export const STORAGE_KEY = "arrows-puzzle-level";
export const STARS_KEY = "arrows-puzzle-stars";
`;

writeFileSync(new URL("../src/levels.ts", import.meta.url).pathname, file);
console.log("Wrote src/levels.ts (50 levels)");
