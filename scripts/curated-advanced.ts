/**
 * Levels 26–50 — scaled from proven solvable puzzles; difficulty rises via grid size + template tier.
 */
import type { Cell, LevelDef, PathDef } from "../src/types";
import { HANDCRAFTED_LEVELS } from "./handcrafted-base";

const NAMES = [
  "Horizon", "Braid", "Coil", "Crosshair", "Stairwell",
  "Rampart", "Outpost", "Split keep", "Channel", "Inner ring",
  "Spine key", "Wide chain", "Outer keep", "Deep vault", "Citadel",
  "Grand spiral", "Grand cross", "Grand hall", "Mega ring", "Mega flow",
  "Royal gate", "Royal coil", "Sixfold", "Penultimate", "Infinity",
];

/** 4–5 path curved puzzles only (proven hard + solvable) */
const TEMPLATE_ORDER = [14, 19, 23, 22, 24];

function clonePath(p: PathDef, dr: number, dc: number): PathDef {
  return {
    cells: p.cells.map((c) => ({ row: c.row + dr, col: c.col + dc })),
    color: p.color,
    requiresClear: p.requiresClear,
  };
}

function buildAdvancedLevel(index: number, name: string): LevelDef {
  const cycle = Math.floor(index / TEMPLATE_ORDER.length);
  const tplIdx = TEMPLATE_ORDER[index % TEMPLATE_ORDER.length]!;
  const tpl = HANDCRAFTED_LEVELS[tplIdx]!;
  const pad = 1 + Math.floor(index / 4) + cycle;
  const dr = Math.floor(pad / 2) + (cycle % 2);
  const dc = Math.floor(pad / 2) + ((cycle + index) % 2);

  const paths = tpl.paths.map((p) => clonePath(p, dr, dc));
  const walls = (tpl.walls ?? []).map((w) => ({ row: w.row + dr, col: w.col + dc }));

  return {
    rows: tpl.rows + pad,
    cols: tpl.cols + pad,
    paths,
    name,
    par: paths.length,
    walls: walls.length ? walls : undefined,
  };
}

export const CURATED_ADVANCED: LevelDef[] = NAMES.map((name, i) => buildAdvancedLevel(i, name));
