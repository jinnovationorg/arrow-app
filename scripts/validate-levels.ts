import { buildOccupied, checkPathEscape, getHeadDir, isPathLocked } from "../src/game/pathGrid";
import { LEVELS } from "../src/levels";
import type { Cell, LevelDef } from "../src/types";

interface RemainingPath {
  cells: Cell[];
  origIndex: number;
}

function solvable(level: LevelDef): boolean {
  const remaining: RemainingPath[] = level.paths.map((p, i) => ({
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
        {
          ...level,
          paths: remaining.map((r) => ({ cells: r.cells })),
        },
        i,
      );

      const { canEscape } = checkPathEscape(cells, dir, occupied, level.rows, level.cols);
      if (canEscape) {
        remaining.splice(i, 1);
        if (dfs()) return true;
        remaining.splice(i, 0, { cells, origIndex });
      }
    }
    return false;
  }

  return dfs();
}

let bad = 0;
LEVELS.forEach((l, i) => {
  const ok = solvable(l);
  if (!ok) bad++;
  const extras: string[] = [];
  if (l.walls?.length) extras.push(`${l.walls.length} walls`);
  if (l.paths.some((p) => (p.requiresClear ?? 0) > 0)) extras.push("locked");
  const tag = extras.length ? ` (${extras.join(", ")})` : "";
  console.log(`Level ${i + 1} [${l.name ?? "?"}]: ${ok ? "OK" : "UNSOLVABLE"} — ${l.paths.length} paths${tag}`);
});
process.exit(bad ? 1 : 0);
