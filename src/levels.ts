import type { Cell, LevelDef, PathDef } from "./types";

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

interface LevelOpts {
  walls?: Cell[];
  name?: string;
  par?: number;
}

function level(rows: number, cols: number, paths: PathDef[], opts?: LevelOpts): LevelDef {
  return { rows, cols, paths, ...opts };
}

/** Path-based levels — run `npm run validate-levels` after edits */
export const LEVELS: LevelDef[] = [
  level(3, 3, [path([[1, 0], [1, 1], [1, 2]])], { name: "First slide", par: 1 }),
  level(3, 4, [path([[0, 0], [0, 1]]), path([[2, 0], [2, 1], [2, 2]], { color: "#2563eb" })], {
    name: "Two lanes",
    par: 2,
  }),
  level(3, 4, [path([[0, 0], [0, 1], [1, 1], [1, 2]])], { name: "Corner", par: 1 }),
  level(4, 4, [
    path([[0, 0], [0, 1], [0, 2]]),
    path([[2, 0], [2, 1], [2, 2]], { color: "#059669" }),
  ], { name: "Parallel", par: 2 }),
  level(5, 5, [
    path([[0, 0], [0, 1], [0, 2], [0, 3]]),
    path([[2, 0], [2, 1], [2, 2], [2, 3]], { color: "#d97706" }),
  ], { name: "Long pair", par: 2 }),
  level(5, 5, [
    path([[0, 1], [1, 1], [2, 1], [2, 0]]),
    path([[0, 3], [1, 3], [1, 2]], { color: "#7c3aed" }),
  ], { name: "L shapes", par: 2 }),
  level(5, 5, [
    path([[1, 0], [1, 1], [1, 2], [0, 2]]),
    path([[3, 0], [3, 1], [3, 2], [3, 3]], { color: "#db2777" }),
  ], { name: "Hooked", par: 2 }),
  level(6, 6, [
    path([[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]]),
    path([[4, 0], [4, 1], [4, 2]], { color: "#2563eb" }),
    path([[2, 4], [3, 4], [4, 4]], { color: "#059669" }),
  ], { name: "Three-way", par: 3 }),
  level(6, 6, [
    path([[1, 1], [1, 2], [1, 3], [2, 3], [3, 3]]),
    path([[3, 1], [3, 2], [2, 2], [2, 1], [2, 0]], { color: "#d97706" }),
  ], { name: "Crossing", par: 2 }),
  level(6, 6, [
    path([[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]]),
    path([[0, 2], [0, 1], [1, 1], [1, 2]], { color: "#7c3aed" }),
    path([[4, 0], [4, 1], [4, 2], [3, 2]], { color: "#db2777" }),
  ], { name: "Weave", par: 3 }),
  level(7, 7, [
    path([[0, 0], [0, 1], [0, 2], [0, 3]]),
    path([[6, 0], [6, 1], [6, 2], [6, 3]], { color: "#2563eb" }),
  ], { name: "Bookends", par: 2 }),
  level(7, 7, [
    path([[0, 0], [0, 1], [0, 2]]),
    path([[3, 3], [3, 4], [3, 5], [3, 6]], { color: "#059669" }),
    path([[6, 6], [6, 5], [6, 4], [6, 3]], { color: "#d97706" }),
  ], { name: "Diagonal trio", par: 3 }),
  level(7, 7, [
    path([[0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [1, 0]]),
    path([[4, 2], [4, 3], [4, 4], [3, 4], [2, 4]], { color: "#7c3aed" }),
    path([[6, 0], [6, 1], [5, 1]], { color: "#db2777" }),
  ], { name: "Serpentine", par: 3 }),
  level(8, 8, [
    path([[1, 1], [1, 2], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1]]),
    path([[1, 5], [2, 5], [3, 5], [3, 6], [3, 7]], { color: "#2563eb" }),
    path([[5, 1], [5, 2], [5, 3], [4, 3]], { color: "#059669" }),
  ], { name: "Triple ring", par: 3 }),
  level(8, 8, [
    path([[0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0]]),
    path([[0, 4], [1, 4], [2, 4], [2, 5], [2, 6], [1, 6], [0, 6]], { color: "#d97706" }),
    path([[4, 0], [5, 0], [6, 0], [6, 1], [6, 2]], { color: "#7c3aed" }),
    path([[4, 6], [5, 6], [6, 6], [6, 5], [6, 4], [5, 4], [4, 4]], { color: "#db2777" }),
  ], { name: "Four corners", par: 4 }),

  // --- New mechanics: walls ---
  level(
    5,
    5,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[4, 2], [4, 1], [4, 0]], { color: "#2563eb" }),
    ],
    {
      name: "Wall gap",
      par: 2,
      walls: wall([2, 2], [2, 1], [2, 3]),
    },
  ),
  level(
    6,
    6,
    [
      path([[0, 0], [1, 0], [2, 0]]),
      path([[5, 5], [4, 5], [3, 5]], { color: "#2563eb" }),
      path([[0, 5], [0, 4], [0, 3]], { color: "#059669" }),
    ],
    {
      name: "Maze pillars",
      par: 3,
      walls: wall([2, 2], [3, 2], [2, 3]),
    },
  ),
  level(
    5,
    5,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[4, 0], [4, 1], [4, 2]], { color: "#2563eb" }),
    ],
    {
      name: "Cross wall",
      par: 2,
      walls: wall([2, 0], [2, 1], [2, 2]),
    },
  ),

  // --- Locked paths ---
  level(
    5,
    5,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[4, 0], [4, 1], [4, 2]], { color: "#2563eb" }),
      path([[2, 0], [2, 1], [2, 2], [2, 3], [2, 4]], { color: "#db2777", requiresClear: 2 }),
    ],
    { name: "Key path", par: 3 },
  ),
  level(
    6,
    6,
    [
      path([[0, 0], [0, 1], [1, 1], [1, 2]]),
      path([[5, 5], [5, 4], [4, 4]], { color: "#059669" }),
      path([[1, 5], [2, 5], [3, 5], [4, 5], [5, 5]], { color: "#d97706", requiresClear: 1 }),
      path([[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3]], { color: "#7c3aed", requiresClear: 2 }),
    ],
    { name: "Chain unlock", par: 4 },
  ),

  // --- Walls + locked + colors ---
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
      name: "Fortress",
      par: 3,
      walls: wall([1, 3], [2, 3], [4, 3], [5, 3], [3, 1], [3, 2], [3, 4], [3, 5]),
    },
  ),
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
      name: "Grand lock",
      par: 3,
      walls: wall([1, 3], [2, 3], [4, 3], [5, 3]),
    },
  ),

  // --- Expert puzzles ---
  level(
    8,
    8,
    [
      path([[1, 1], [1, 2], [1, 3], [2, 3], [3, 3], [3, 2], [3, 1], [2, 1]]),
      path([[1, 5], [2, 5], [3, 5], [3, 6], [3, 7], [2, 7], [1, 7], [1, 6]], { color: "#2563eb" }),
      path([[5, 1], [5, 2], [5, 3], [6, 3], [7, 3], [7, 2], [7, 1], [6, 1]], { color: "#059669" }),
      path([[5, 5], [5, 6], [5, 7], [6, 7], [7, 7], [7, 6], [7, 5], [6, 5]], { color: "#d97706" }),
    ],
    {
      name: "Four spirals",
      par: 4,
      walls: wall([4, 4], [4, 3], [3, 4]),
    },
  ),
  level(
    6,
    6,
    [
      path([[0, 0], [1, 0], [2, 0]]),
      path([[5, 5], [4, 5], [3, 5]], { color: "#2563eb" }),
      path([[0, 5], [0, 4], [0, 3]], { color: "#059669" }),
      path([[5, 0], [5, 1], [5, 2]], { color: "#d97706" }),
    ],
    {
      name: "Hub",
      par: 4,
      walls: wall([2, 2], [3, 3]),
    },
  ),
  level(
    8,
    8,
    [
      path([[0, 0], [0, 1], [0, 2]]),
      path([[7, 0], [7, 1], [7, 2]], { color: "#2563eb" }),
      path([[0, 7], [0, 6], [0, 5]], { color: "#059669" }),
      path([[7, 7], [7, 6], [7, 5]], { color: "#d97706" }),
      path([[2, 4], [3, 4], [4, 4], [5, 4]], {
        color: "#db2777",
        requiresClear: 3,
      }),
    ],
    {
      name: "Master",
      par: 5,
      walls: wall([4, 3], [4, 5]),
    },
  ),
];

export const STORAGE_KEY = "arrows-puzzle-level";
export const STARS_KEY = "arrows-puzzle-stars";
