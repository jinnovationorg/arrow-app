import type { Cell, LevelDef, PathDef } from "./types";

function path(
  cells: [number, number][],
  opts?: { color?: string; requiresClear?: number },
): PathDef {
  return { cells: cells.map(([row, col]) => ({ row, col })), ...opts };
}

function wall(...cells: [number, number][]): Cell[] {
  return cells.map(([row, col]) => ({ row, col }));
}

interface LevelOpts {
  walls?: Cell[];
  name?: string;
  par?: number;
}

function level(rows: number, cols: number, paths: PathDef[], opts?: LevelOpts): LevelDef {
  return { rows, cols, paths, ...opts };
}

/**
 * Levels 26–50: handcrafted extensions of the level 1–25 design language.
 * Each group scales a proven puzzle pattern with more paths, larger grids,
 * walls, and locks introduced in the same order as the original campaign.
 */
export const ADVANCED_LEVELS: LevelDef[] = [
  // 26–30: extend early-mid puzzles (3–5 paths, 8×8–9×9)
  level(
    8,
    8,
    [
      path([[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]]),
      path([[4, 0], [4, 1], [4, 2]], { color: "#2563eb" }),
      path([[2, 4], [3, 4], [4, 4], [5, 4]]),
      path([[6, 0], [6, 1], [6, 2], [7, 2]], { color: "#059669" }),
    ],
    { name: "Wide three-way", par: 4 },
  ),
  level(
    8,
    8,
    [
      path([[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]]),
      path([[0, 2], [0, 1], [1, 1], [1, 2]], { color: "#7c3aed" }),
      path([[4, 0], [4, 1], [4, 2], [3, 2]], { color: "#db2777" }),
      path([[6, 0], [6, 1], [7, 1], [7, 2], [7, 3]], { color: "#d97706" }),
    ],
    { name: "Wide weave", par: 4 },
  ),
  level(
    9,
    9,
    [
      path([[0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [1, 0]]),
      path([[4, 2], [4, 3], [4, 4], [3, 4], [2, 4]], { color: "#7c3aed" }),
      path([[8, 0], [8, 1], [7, 1]], { color: "#db2777" }),
      path([[0, 6], [1, 6], [2, 6], [2, 7], [2, 8], [1, 8]]),
    ],
    { name: "Long serpent", par: 4 },
  ),
  level(
    9,
    9,
    [
      path([[0, 0], [0, 1], [0, 2], [0, 3]]),
      path([[6, 0], [6, 1], [6, 2], [6, 3]], { color: "#2563eb" }),
      path([[0, 5], [0, 6], [0, 7], [0, 8]], { color: "#059669" }),
      path([[1, 1], [1, 2], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1]]),
      path([[6, 5], [6, 6], [6, 7], [6, 8]], { color: "#d97706" }),
    ],
    { name: "Bookends plus", par: 5 },
  ),
  level(
    9,
    9,
    [
      path([[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0]]),
      path([[0, 6], [1, 6], [2, 6], [2, 7], [2, 8], [1, 8], [0, 8]], { color: "#d97706" }),
      path([[6, 0], [7, 0], [8, 0], [8, 1], [8, 2]], { color: "#7c3aed" }),
      path([[6, 8], [7, 8], [8, 8], [8, 7], [8, 6], [7, 6], [6, 6]], { color: "#db2777" }),
    ],
    { name: "Wide corners", par: 4 },
  ),

  // 31–35: wall puzzles (from levels 16–18 style)
  level(
    8,
    8,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[7, 2], [7, 1], [7, 0]], { color: "#2563eb" }),
      path([[0, 5], [0, 6], [0, 7]]),
      path([[7, 5], [7, 6], [7, 7]], { color: "#059669" }),
    ],
    {
      name: "Four gap",
      par: 4,
      walls: wall([3, 3], [3, 4], [4, 3], [4, 4]),
    },
  ),
  // Same layout as level 17 "Maze pillars" (proven)
  level(
    6,
    6,
    [
      path([[0, 0], [1, 0], [2, 0]]),
      path([[5, 5], [4, 5], [3, 5]], { color: "#2563eb" }),
      path([[0, 5], [0, 4], [0, 3]], { color: "#059669" }),
    ],
    {
      name: "Far pillars",
      par: 3,
      walls: wall([2, 2], [3, 2], [2, 3]),
    },
  ),
  level(
    8,
    8,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[7, 0], [7, 1], [7, 2]], { color: "#2563eb" }),
      path([[0, 5], [0, 6], [0, 7]]),
      path([[7, 5], [7, 6], [7, 7]], { color: "#d97706" }),
    ],
    {
      name: "Split wall",
      par: 4,
      walls: wall([3, 0], [3, 1], [3, 2], [4, 0], [4, 1], [4, 2]),
    },
  ),
  level(
    9,
    9,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[0, 6], [0, 7], [0, 8]], { color: "#2563eb" }),
      path([[8, 0], [8, 1], [8, 2]], { color: "#059669" }),
      path([[8, 6], [8, 7], [8, 8]], { color: "#d97706" }),
    ],
    {
      name: "Wall channels",
      par: 4,
      walls: wall([4, 4], [3, 4]),
    },
  ),
  level(
    9,
    9,
    [
      path([[1, 1], [1, 2], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1]]),
      path([[1, 5], [2, 5], [3, 5], [3, 6], [3, 7], [2, 7], [1, 7]], { color: "#2563eb" }),
      path([[5, 1], [5, 2], [5, 3], [6, 3], [7, 3], [7, 2], [7, 1]], { color: "#059669" }),
      path([[5, 5], [5, 6], [5, 7], [6, 7], [7, 7], [7, 6], [7, 5]], { color: "#d97706" }),
    ],
    {
      name: "Ring walls",
      par: 4,
      walls: wall([4, 4], [4, 3], [3, 4]),
    },
  ),

  // 36–40: locked paths (from levels 19–22 style)
  // Same layout as level 19 "Key path" (proven)
  level(
    5,
    5,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[4, 0], [4, 1], [4, 2]], { color: "#2563eb" }),
      path([[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]], { color: "#db2777", requiresClear: 2 }),
    ],
    { name: "Column key", par: 3 },
  ),
  level(
    9,
    9,
    [
      path([[0, 0], [0, 1], [1, 1], [1, 2]]),
      path([[8, 8], [8, 7], [7, 7], [7, 6]], { color: "#059669" }),
      path([[1, 5], [2, 5], [3, 5], [4, 5], [5, 5]], { color: "#d97706", requiresClear: 1 }),
      path([[0, 3], [1, 3], [2, 3], [3, 3], [4, 3]], { color: "#7c3aed", requiresClear: 2 }),
    ],
    { name: "Wide chain", par: 4 },
  ),
  // Same layout as level 21 "Fortress" (proven)
  level(
    7,
    7,
    [
      path([[0, 0], [0, 1], [0, 2], [0, 3]]),
      path([[6, 3], [6, 2], [6, 1], [6, 0]], { color: "#2563eb" }),
      path([[3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6]], {
        color: "#db2777",
        requiresClear: 2,
      }),
    ],
    {
      name: "Outer fortress",
      par: 3,
      walls: wall([1, 3], [2, 3], [4, 3], [5, 3], [3, 1], [3, 2], [3, 4], [3, 5]),
    },
  ),
  // Same layout as level 22 "Grand lock" (proven)
  level(
    7,
    7,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[6, 0], [6, 1], [6, 2]], { color: "#2563eb" }),
      path([[3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6]], {
        color: "#db2777",
        requiresClear: 2,
      }),
    ],
    {
      name: "Grand spine",
      par: 3,
      walls: wall([1, 3], [2, 3], [4, 3], [5, 3]),
    },
  ),
  level(
    9,
    9,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[0, 6], [0, 7], [0, 8]], { color: "#2563eb" }),
      path([[8, 0], [8, 1], [8, 2]], { color: "#059669" }),
      path([[8, 6], [8, 7], [8, 8]], { color: "#d97706" }),
      path([[4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8]], {
        color: "#db2777",
        requiresClear: 2,
      }),
    ],
    {
      name: "Citadel lock",
      par: 5,
      walls: wall([2, 4], [3, 4], [5, 4], [6, 4]),
    },
  ),

  // 41–45: expert combos (from levels 23–25 style)
  level(
    9,
    9,
    [
      path([[1, 1], [1, 2], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [2, 1]]),
      path([[1, 5], [2, 5], [3, 5], [3, 6], [3, 7], [3, 8], [2, 8], [1, 8]], { color: "#2563eb" }),
      path([[5, 1], [5, 2], [5, 3], [6, 3], [7, 3], [7, 2], [7, 1], [6, 1]], { color: "#059669" }),
      path([[5, 5], [5, 6], [5, 7], [6, 7], [7, 7], [7, 6], [7, 5], [6, 5]], { color: "#d97706" }),
    ],
    {
      name: "Grand spirals",
      par: 4,
      walls: wall([4, 4], [4, 3], [3, 4]),
    },
  ),
  level(
    9,
    9,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[0, 3], [0, 4], [0, 5]], { color: "#2563eb" }),
      path([[8, 0], [8, 1], [8, 2]], { color: "#059669" }),
      path([[8, 3], [8, 4], [8, 5]], { color: "#d97706" }),
    ],
    {
      name: "Grand hub",
      par: 4,
      walls: wall([4, 4], [3, 4], [4, 3], [4, 5], [5, 4]),
    },
  ),
  level(
    10,
    10,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[0, 3], [0, 4], [0, 5]], { color: "#2563eb" }),
      path([[9, 0], [9, 1], [9, 2]], { color: "#059669" }),
      path([[9, 3], [9, 4], [9, 5]], { color: "#d97706" }),
      path([[4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9]], {
        color: "#db2777",
        requiresClear: 2,
      }),
    ],
    {
      name: "Grand master",
      par: 5,
      walls: wall([2, 4], [3, 4], [5, 4], [6, 4], [4, 2], [4, 3], [4, 5], [4, 6]),
    },
  ),
  level(
    10,
    10,
    [
      path([[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0]]),
      path([[0, 7], [1, 7], [2, 7], [2, 8], [2, 9], [1, 9], [0, 9]], { color: "#d97706" }),
      path([[7, 0], [8, 0], [9, 0], [9, 1], [9, 2]], { color: "#7c3aed" }),
      path([[7, 9], [8, 9], [9, 9], [9, 8], [9, 7], [8, 7], [7, 7]], { color: "#db2777" }),
    ],
    { name: "Mega corners", par: 4 },
  ),
  level(
    10,
    10,
    [
      path([[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0]]),
      path([[0, 7], [1, 7], [2, 7], [2, 8], [2, 9], [1, 9], [0, 9]], { color: "#d97706" }),
      path([[7, 0], [8, 0], [9, 0], [9, 1], [9, 2]], { color: "#7c3aed" }),
      path([[7, 9], [8, 9], [9, 9], [9, 8], [9, 7], [8, 7], [7, 7]], { color: "#db2777" }),
    ],
    { name: "Mega weave", par: 4 },
  ),

  // 46–50: capstones
  level(
    10,
    10,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[0, 3], [0, 4], [0, 5]], { color: "#2563eb" }),
      path([[9, 0], [9, 1], [9, 2]], { color: "#059669" }),
      path([[9, 3], [9, 4], [9, 5]], { color: "#d97706" }),
      path([[5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [5, 9]], {
        color: "#db2777",
        requiresClear: 2,
      }),
    ],
    {
      name: "Royal hall",
      par: 5,
      walls: wall([2, 4], [3, 4], [6, 4], [7, 4]),
    },
  ),
  level(
    10,
    10,
    [
      path([[1, 1], [1, 2], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [2, 1]]),
      path([[1, 6], [2, 6], [3, 6], [3, 7], [3, 8], [3, 9], [2, 9], [1, 9]], { color: "#2563eb" }),
      path([[6, 1], [6, 2], [6, 3], [7, 3], [8, 3], [8, 2], [8, 1], [7, 1]], { color: "#059669" }),
      path([[6, 6], [6, 7], [6, 8], [7, 8], [8, 8], [8, 7], [8, 6], [7, 6]], { color: "#d97706" }),
    ],
    {
      name: "Royal coils",
      par: 4,
      walls: wall([5, 4], [4, 5], [5, 5]),
    },
  ),
  level(
    10,
    10,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[0, 3], [0, 4], [0, 5]], { color: "#2563eb" }),
      path([[0, 6], [0, 7], [0, 8], [0, 9]]),
      path([[9, 0], [9, 1], [9, 2]], { color: "#059669" }),
      path([[9, 3], [9, 4], [9, 5]], { color: "#d97706" }),
      path([[9, 6], [9, 7], [9, 8], [9, 9]], { color: "#0ea5e9" }),
    ],
    {
      name: "Six gates",
      par: 6,
      walls: wall([4, 4], [4, 5], [5, 4], [5, 5]),
    },
  ),
  level(
    10,
    10,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[0, 3], [0, 4], [0, 5]], { color: "#2563eb" }),
      path([[9, 0], [9, 1], [9, 2]], { color: "#059669" }),
      path([[9, 3], [9, 4], [9, 5]], { color: "#d97706" }),
      path([[5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [5, 9]], {
        color: "#db2777",
        requiresClear: 3,
      }),
    ],
    {
      name: "Penultimate",
      par: 5,
      walls: wall([2, 4], [3, 4], [6, 4], [7, 4]),
    },
  ),
  level(
    10,
    10,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[0, 3], [0, 4], [0, 5]], { color: "#2563eb" }),
      path([[9, 0], [9, 1], [9, 2]], { color: "#059669" }),
      path([[9, 3], [9, 4], [9, 5]], { color: "#d97706" }),
      path([[4, 0], [4, 1], [4, 2], [4, 3], [4, 4], [4, 5], [4, 6], [4, 7], [4, 8], [4, 9]], {
        color: "#db2777",
        requiresClear: 2,
      }),
    ],
    {
      name: "Infinity",
      par: 5,
      walls: wall([1, 1], [1, 8], [8, 1], [8, 8]),
    },
  ),
];
