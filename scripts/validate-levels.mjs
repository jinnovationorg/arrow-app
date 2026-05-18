const DIR_DELTA = {
  up: { dr: -1, dc: 0 },
  right: { dr: 0, dc: 1 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
};

function path(cells) {
  return { cells: cells.map(([row, col]) => ({ row, col })) };
}
function level(rows, cols, paths) {
  return { rows, cols, paths };
}

const LEVELS = [
  level(3, 3, [path([[1, 0], [1, 1], [1, 2]])]),
  level(3, 4, [path([[0, 0], [0, 1]]), path([[2, 0], [2, 1], [2, 2]])]),
  level(3, 4, [path([[0, 0], [0, 1], [1, 1], [1, 2]])]),
  level(4, 4, [path([[0, 0], [0, 1], [0, 2]]), path([[2, 0], [2, 1], [2, 2]])]),
  level(5, 5, [path([[0, 0], [0, 1], [0, 2], [0, 3]]), path([[2, 0], [2, 1], [2, 2], [2, 3]])]),
  level(5, 5, [path([[0, 1], [1, 1], [2, 1], [2, 0]]), path([[0, 3], [1, 3], [1, 2]])]),
  level(5, 5, [path([[1, 0], [1, 1], [1, 2], [0, 2]]), path([[3, 0], [3, 1], [3, 2], [3, 3]])]),
  level(6, 6, [
    path([[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]]),
    path([[4, 0], [4, 1], [4, 2]]),
    path([[2, 4], [3, 4], [4, 4]]),
  ]),
  level(6, 6, [
    path([[1, 1], [1, 2], [1, 3], [2, 3], [3, 3]]),
    path([[3, 1], [3, 2], [2, 2], [2, 1], [2, 0]]),
  ]),
  level(6, 6, [
    path([[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]]),
    path([[0, 2], [0, 1], [1, 1], [1, 2]]),
    path([[4, 0], [4, 1], [4, 2], [3, 2]]),
  ]),
  level(7, 7, [
    path([[0, 0], [0, 1], [0, 2], [0, 3]]),
    path([[6, 0], [6, 1], [6, 2], [6, 3]]),
  ]),
  level(7, 7, [
    path([[0, 0], [0, 1], [0, 2]]),
    path([[3, 3], [3, 4], [3, 5], [3, 6]]),
    path([[6, 6], [6, 5], [6, 4], [6, 3]]),
  ]),
  level(7, 7, [
    path([[0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [1, 0]]),
    path([[4, 2], [4, 3], [4, 4], [3, 4], [2, 4]]),
    path([[6, 0], [6, 1], [5, 1]]),
  ]),
  level(8, 8, [
    path([[1, 1], [1, 2], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1]]),
    path([[1, 5], [2, 5], [3, 5], [3, 6], [3, 7]]),
    path([[5, 1], [5, 2], [5, 3], [4, 3]]),
  ]),
  level(8, 8, [
    path([[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0]]),
    path([[0, 4], [1, 4], [2, 4], [2, 5], [2, 6], [1, 6], [0, 6]]),
    path([[4, 0], [5, 0], [6, 0], [6, 1], [6, 2]]),
    path([[4, 6], [5, 6], [6, 6], [6, 5], [6, 4], [5, 4], [4, 4]]),
  ]),
];

function cellKey(r, c) {
  return `${r},${c}`;
}

function getHeadDir(cells) {
  if (cells.length < 2) return "right";
  const tail = cells[cells.length - 2];
  const head = cells[cells.length - 1];
  if (head.row < tail.row) return "up";
  if (head.row > tail.row) return "down";
  if (head.col > tail.col) return "right";
  return "left";
}

function checkPathEscape(cells, dir, occupied, rows, cols) {
  const { dr, dc } = DIR_DELTA[dir];
  const maxSteps = rows + cols + cells.length + 2;
  for (let step = 1; step <= maxSteps; step++) {
    const translated = cells.map((c) => ({ row: c.row + dr * step, col: c.col + dc * step }));
    if (translated.every((c) => c.row < 0 || c.row >= rows || c.col < 0 || c.col >= cols)) return true;
    if (
      translated.some((c) => {
        if (c.row < 0 || c.row >= rows || c.col < 0 || c.col >= cols) return false;
        return occupied.has(cellKey(c.row, c.col));
      })
    ) {
      return false;
    }
  }
  return false;
}

function buildOccupied(pathList, exclude) {
  const set = new Set();
  pathList.forEach((path, i) => {
    if (i === exclude) return;
    for (const c of path.cells) set.add(cellKey(c.row, c.col));
  });
  return set;
}

function solvable(level) {
  const remaining = level.paths.map((p) => p.cells.map((c) => ({ ...c })));

  function dfs() {
    if (remaining.length === 0) return true;
    for (let i = 0; i < remaining.length; i++) {
      const cells = remaining[i];
      const dir = getHeadDir(cells);
      const occupied = buildOccupied(
        remaining.map((cells) => ({ cells })),
        i,
      );
      if (checkPathEscape(cells, dir, occupied, level.rows, level.cols)) {
        remaining.splice(i, 1);
        if (dfs()) return true;
        remaining.splice(i, 0, cells);
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
  console.log(`Level ${i + 1}: ${ok ? "OK" : "UNSOLVABLE"} (${l.paths.length} paths)`);
});
process.exit(bad ? 1 : 0);
