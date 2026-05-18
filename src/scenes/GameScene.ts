import Phaser from "phaser";
import { PathPiece } from "../game/PathPiece";
import { buildWallSet, cellKey, checkPathEscape, isPathLocked } from "../game/pathGrid";
import { LEVELS, STARS_KEY, STORAGE_KEY } from "../levels";
import { DIR_DELTA, type Cell, type LevelDef } from "../types";

const MAX_HEARTS = 5;
const MAX_HINTS = 3;
const MAX_UNDOS = 5;
const CELL_ANIM_MS = 55;

interface BoardSnapshot {
  pieces: { pathIndex: number; cells: Cell[] }[];
}

export class GameScene extends Phaser.Scene {
  private levelIndex = 0;
  private hearts = MAX_HEARTS;
  private hintsLeft = MAX_HINTS;
  private moves = 0;
  private mistakes = 0;
  private initialPathCount = 0;
  private level!: LevelDef;
  private cellSize = 64;
  private boardX = 0;
  private boardY = 0;
  private busy = false;
  private inputLocked = false;
  private paths: PathPiece[] = [];
  private undoStack: BoardSnapshot[] = [];
  private levelText!: Phaser.GameObjects.Text;
  private subText!: Phaser.GameObjects.Text;
  private heartsText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private undoText!: Phaser.GameObjects.Text;
  private levelsBtn!: Phaser.GameObjects.Text;
  private restartBtn!: Phaser.GameObjects.Text;
  private boardGfx!: Phaser.GameObjects.Graphics;
  private wallGfx!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: "GameScene" });
  }

  create() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const n = parseInt(saved, 10);
      if (Number.isFinite(n) && n >= 0 && n < LEVELS.length) {
        this.levelIndex = n;
      }
    }

    this.buildUi();
    this.setupInput();
    this.loadLevel(this.levelIndex);

    this.scale.on("resize", () => this.onResize());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.onResize, this);
    });
  }

  private buildUi() {
    const font = "system-ui, -apple-system, sans-serif";

    this.levelText = this.add
      .text(0, 0, "", { fontFamily: font, fontSize: "17px", color: "#334155", fontStyle: "600" })
      .setDepth(50)
      .setScrollFactor(0);

    this.subText = this.add
      .text(0, 0, "", { fontFamily: font, fontSize: "12px", color: "#94a3b8" })
      .setDepth(50)
      .setScrollFactor(0);

    this.heartsText = this.add
      .text(0, 0, "", { fontFamily: font, fontSize: "20px", color: "#ef4444" })
      .setDepth(50)
      .setScrollFactor(0);

    this.movesText = this.add
      .text(0, 0, "", { fontFamily: font, fontSize: "13px", color: "#64748b" })
      .setDepth(50)
      .setScrollFactor(0);

    this.levelsBtn = this.add
      .text(0, 0, "Levels", {
        fontFamily: font,
        fontSize: "14px",
        color: "#475569",
        backgroundColor: "#f1f5f9",
        padding: { x: 10, y: 6 },
      })
      .setDepth(50)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.levelsBtn.on("pointerdown", (_p, _x, _y, ev?: Event) => {
      ev?.stopPropagation();
      this.showLevelSelect();
    });

    this.hintText = this.add
      .text(0, 0, "Hint", {
        fontFamily: font,
        fontSize: "15px",
        color: "#6366f1",
        backgroundColor: "#eef2ff",
        padding: { x: 14, y: 8 },
      })
      .setDepth(50)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.hintText.on("pointerdown", (_p, _x, _y, ev?: Event) => {
      ev?.stopPropagation();
      this.showHint();
    });

    this.undoText = this.add
      .text(0, 0, "Undo", {
        fontFamily: font,
        fontSize: "15px",
        color: "#0d9488",
        backgroundColor: "#ccfbf1",
        padding: { x: 14, y: 8 },
      })
      .setDepth(50)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.undoText.on("pointerdown", (_p, _x, _y, ev?: Event) => {
      ev?.stopPropagation();
      this.undoMove();
    });

    this.restartBtn = this.add
      .text(0, 0, "↺", { fontFamily: font, fontSize: "26px", color: "#64748b" })
      .setDepth(50)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.restartBtn.on("pointerdown", (_p, _x, _y, ev?: Event) => {
      ev?.stopPropagation();
      this.loadLevel(this.levelIndex);
    });
  }

  private setupInput() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.busy || this.inputLocked || !this.level) return;
      if (pointer.y < 100 || pointer.y > this.scale.height - 80) return;

      const piece = this.findPathAt(pointer.x, pointer.y);
      if (piece) this.onPathTap(piece);
    });
  }

  private wallSet(): Set<string> {
    return buildWallSet(this.level);
  }

  private buildLiveOccupied(exclude?: PathPiece): Set<string> {
    const set = new Set<string>(this.wallSet());
    for (const p of this.paths) {
      if (!p.active || p === exclude) continue;
      for (const c of p.cells) set.add(cellKey(c.row, c.col));
    }
    return set;
  }

  private findPathAt(wx: number, wy: number): PathPiece | null {
    const threshold = this.cellSize * 0.35;
    for (let i = this.paths.length - 1; i >= 0; i--) {
      const p = this.paths[i]!;
      if (p.active && p.hitTest(wx, wy, threshold)) return p;
    }
    return null;
  }

  private loadLevel(index: number) {
    this.busy = false;
    this.inputLocked = false;
    this.hearts = MAX_HEARTS;
    this.hintsLeft = MAX_HINTS;
    this.moves = 0;
    this.mistakes = 0;
    this.undoStack = [];
    this.levelIndex = index;
    this.level = LEVELS[index]!;
    this.initialPathCount = this.level.paths.length;
    this.clearBoard();

    localStorage.setItem(STORAGE_KEY, String(index));
    this.updateHud();
    this.refreshLockedStates();
    this.layout();
    this.redrawBoard();
    this.spawnPaths();

    if (index === 0 && !sessionStorage.getItem("arrows-tutorial")) {
      sessionStorage.setItem("arrows-tutorial", "1");
      this.showToast("Tap a path to slide it off the board", 3200);
    }
    if (index === 15 && !sessionStorage.getItem("arrows-walls-tutorial")) {
      sessionStorage.setItem("arrows-walls-tutorial", "1");
      this.showToast("Gray blocks are walls — paths cannot pass through them", 3500);
    }
    if (index === 18 && !sessionStorage.getItem("arrows-lock-tutorial")) {
      sessionStorage.setItem("arrows-lock-tutorial", "1");
      this.showToast("Locked paths unlock after you clear others first", 3500);
    }
  }

  private clearBoard() {
    this.paths.forEach((p) => p.destroy());
    this.paths = [];
    this.boardGfx?.destroy();
    this.wallGfx?.destroy();
    this.tweens.killAll();
  }

  private onResize() {
    if (!this.level) return;
    this.layout();
    this.redrawBoard();
    this.paths.forEach((p) => p.setBoardLayout(this.cellSize, this.boardX, this.boardY));
  }

  private layout() {
    const { width, height } = this.scale;
    if (width < 10 || height < 10) return;

    const pad = 20;
    const topBar = 108;
    const bottomPad = 40;
    const availW = width - pad * 2;
    const availH = height - topBar - bottomPad;

    const { rows, cols } = this.level;
    this.cellSize = Math.floor(Math.min(availW / cols, availH / rows));
    this.cellSize = Phaser.Math.Clamp(this.cellSize, 32, 72);

    const boardW = cols * this.cellSize;
    const boardH = rows * this.cellSize;
    this.boardX = (width - boardW) / 2 + this.cellSize / 2;
    this.boardY = topBar + (availH - boardH) / 2 + this.cellSize / 2;

    const name = this.level.name ?? `Level ${this.levelIndex + 1}`;
    this.levelText.setText(name);
    this.levelText.setPosition(width / 2, 40).setOrigin(0.5, 0);

    const meta: string[] = [];
    if (this.level.walls?.length) meta.push(`${this.level.walls.length} walls`);
    const locked = this.level.paths.filter((p) => (p.requiresClear ?? 0) > 0).length;
    if (locked) meta.push(`${locked} locked`);
    this.subText.setText(meta.join(" · "));
    this.subText.setPosition(width / 2, 62).setOrigin(0.5, 0);

    this.heartsText.setPosition(width / 2, 84).setOrigin(0.5, 0);
    this.movesText.setPosition(width - pad, 48).setOrigin(1, 0);
    this.levelsBtn.setPosition(pad, 40);
    this.hintText.setPosition(width / 2 - 52, height - 48).setOrigin(0.5, 0.5);
    this.undoText.setPosition(width / 2 + 52, height - 48).setOrigin(0.5, 0.5);
    this.restartBtn.setPosition(pad, height - 52);
  }

  private redrawBoard() {
    this.boardGfx?.destroy();
    this.wallGfx?.destroy();

    const { rows, cols } = this.level;
    const g = this.add.graphics().setDepth(0);
    const boardW = cols * this.cellSize;
    const boardH = rows * this.cellSize;
    const left = this.boardX - this.cellSize / 2;
    const top = this.boardY - this.cellSize / 2;

    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(left - 14, top - 14, boardW + 28, boardH + 28, 16);
    g.lineStyle(1, 0xe5e7eb, 1);
    g.strokeRoundedRect(left - 14, top - 14, boardW + 28, boardH + 28, 16);

    this.boardGfx = g;
    this.drawWalls();
  }

  private drawWalls() {
    const walls = this.level.walls;
    if (!walls?.length) return;

    const g = this.add.graphics().setDepth(5);
    const half = this.cellSize * 0.38;

    for (const w of walls) {
      const { x, y } = this.cellToWorld(w.row, w.col);
      g.fillStyle(0x475569, 1);
      g.fillRoundedRect(x - half, y - half, half * 2, half * 2, 6);
      g.lineStyle(2, 0x334155, 0.5);
      g.strokeRoundedRect(x - half, y - half, half * 2, half * 2, 6);
    }
    this.wallGfx = g;
  }

  private cellToWorld(row: number, col: number) {
    return {
      x: this.boardX + col * this.cellSize,
      y: this.boardY + row * this.cellSize,
    };
  }

  private spawnPaths() {
    this.level.paths.forEach((pathDef, i) => {
      const piece = new PathPiece(
        this,
        i,
        pathDef.cells,
        this.cellSize,
        this.boardX,
        this.boardY,
        pathDef.color,
      );
      this.add.existing(piece);
      piece.setDepth(10 + i);
      this.paths.push(piece);
    });
    this.refreshLockedStates();
  }

  private refreshLockedStates() {
    const remaining = this.paths.filter((p) => p.active).length;
    this.paths.forEach((piece) => {
      const def = this.level.paths[piece.pathIndex]!;
      const locked = isPathLocked(def, this.initialPathCount, remaining);
      piece.setLockedLook(locked);
    });
  }

  private snapshotBoard(): BoardSnapshot {
    return {
      pieces: this.paths
        .filter((p) => p.active)
        .map((p) => ({ pathIndex: p.pathIndex, cells: p.cells.map((c) => ({ ...c })) })),
    };
  }

  private pushUndo() {
    this.undoStack.push(this.snapshotBoard());
    if (this.undoStack.length > MAX_UNDOS) this.undoStack.shift();
    this.updateHud();
  }

  private undoMove() {
    if (this.busy || this.inputLocked || this.undoStack.length === 0) {
      if (this.undoStack.length === 0) this.showToast("Nothing to undo", 1200);
      return;
    }

    const snap = this.undoStack.pop()!;
    this.busy = true;
    this.clearBoard();
    this.moves = Math.max(0, this.moves - 1);

    snap.pieces.forEach(({ pathIndex, cells }) => {
      const def = this.level.paths[pathIndex];
      if (!def) return;
      const piece = new PathPiece(
        this,
        pathIndex,
        cells,
        this.cellSize,
        this.boardX,
        this.boardY,
        def.color,
      );
      this.add.existing(piece);
      piece.setDepth(10 + pathIndex);
      this.paths.push(piece);
    });

    this.refreshLockedStates();
    this.updateHud();
    this.busy = false;
  }

  private updateHud() {
    const filled = "♥".repeat(this.hearts);
    const empty = "♡".repeat(MAX_HEARTS - this.hearts);
    this.heartsText.setText(filled + empty);

    const par = this.level.par;
    const parLabel = par != null ? ` / ${par}` : "";
    this.movesText.setText(`Moves ${this.moves}${parLabel}`);

    this.hintText.setText(this.hintsLeft > 0 ? `Hint (${this.hintsLeft})` : "Hint (−1♥)");
    this.undoText.setAlpha(this.undoStack.length > 0 ? 1 : 0.45);
  }

  private onPathTap(piece: PathPiece) {
    if (this.busy) return;

    const pathDef = this.level.paths[piece.pathIndex]!;
    const remaining = this.paths.filter((p) => p.active).length;
    if (isPathLocked(pathDef, this.initialPathCount, remaining)) {
      this.onLockedTap(piece);
      return;
    }

    const dir = piece.getHeadDir();
    const occupied = this.buildLiveOccupied(piece);
    const result = checkPathEscape(piece.cells, dir, occupied, this.level.rows, this.level.cols);

    if (!result.canEscape) {
      this.onMistake(piece);
      return;
    }

    this.pushUndo();
    this.busy = true;
    this.moves += 1;
    this.updateHud();
    this.extractPath(piece, result.steps);
  }

  private onLockedTap(piece: PathPiece) {
    this.inputLocked = true;
    piece.setBlockedLook(true);
    this.tweens.add({
      targets: piece,
      angle: { from: -4, to: 4 },
      duration: 60,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        piece.setAngle(0);
        piece.setBlockedLook(false);
        piece.setLockedLook(true);
        this.inputLocked = false;
      },
    });
    const need = this.level.paths[piece.pathIndex]?.requiresClear ?? 0;
    const cleared = this.initialPathCount - this.paths.filter((p) => p.active).length;
    this.showToast(`Clear ${need - cleared} more path${need - cleared === 1 ? "" : "s"} first`, 1800);
  }

  private extractPath(piece: PathPiece, totalSteps: number) {
    const dir = piece.getHeadDir();
    const { dr, dc } = DIR_DELTA[dir];
    let step = 0;

    const advance = () => {
      step += 1;
      const head = piece.cells[piece.cells.length - 1]!;
      piece.cells.push({ row: head.row + dr, col: head.col + dc });
      piece.cells.shift();
      piece.redraw();

      if (step >= totalSteps) {
        piece.destroy();
        this.paths = this.paths.filter((p) => p !== piece);
        this.busy = false;
        this.refreshLockedStates();
        if (this.paths.length === 0) this.onLevelClear();
      } else {
        this.time.delayedCall(CELL_ANIM_MS, advance);
      }
    };

    advance();
  }

  private onMistake(piece: PathPiece) {
    this.inputLocked = true;
    this.hearts -= 1;
    this.mistakes += 1;
    this.updateHud();
    piece.setBlockedLook(true);

    this.tweens.add({
      targets: piece,
      scale: 1.04,
      duration: 80,
      yoyo: true,
      repeat: 2,
      ease: "Sine.easeInOut",
    });

    this.cameras.main.shake(120, 0.004);
    this.time.delayedCall(500, () => {
      piece.setScale(1);
      const pathDef = this.level.paths[piece.pathIndex]!;
      const remaining = this.paths.filter((p) => p.active).length;
      const locked = isPathLocked(pathDef, this.initialPathCount, remaining);
      piece.setBlockedLook(false);
      piece.setLockedLook(locked);
      this.inputLocked = false;
    });

    if (this.hearts <= 0) {
      this.busy = true;
      this.time.delayedCall(400, () => this.showFailOverlay());
    }
  }

  private showHint() {
    if (this.busy) return;

    if (this.hintsLeft <= 0) {
      if (this.hearts <= 1) {
        this.showToast("No hints left and not enough hearts", 2000);
        return;
      }
      this.hearts -= 1;
      this.updateHud();
    } else {
      this.hintsLeft -= 1;
      this.updateHud();
    }

    let target: PathPiece | null = null;
    const remaining = this.paths.filter((p) => p.active).length;

    for (const piece of this.paths) {
      const def = this.level.paths[piece.pathIndex]!;
      if (isPathLocked(def, this.initialPathCount, remaining)) continue;

      const occupied = this.buildLiveOccupied(piece);
      const result = checkPathEscape(
        piece.cells,
        piece.getHeadDir(),
        occupied,
        this.level.rows,
        this.level.cols,
      );
      if (result.canEscape) {
        target = piece;
        break;
      }
    }

    if (!target) {
      this.showToast("No movable path — try another order", 2000);
      return;
    }

    this.paths.forEach((p) => p.setHintLook(p === target));
    this.time.delayedCall(1200, () => this.paths.forEach((p) => p.setHintLook(false)));
  }

  private calcStars(): number {
    if (this.mistakes > 0) {
      return this.level.par != null && this.moves <= this.level.par + 2 ? 2 : 1;
    }
    if (this.level.par == null) return 3;
    if (this.moves <= this.level.par) return 3;
    if (this.moves <= this.level.par + 2) return 2;
    return 2;
  }

  private saveStars(stars: number) {
    const key = `${STARS_KEY}-${this.levelIndex}`;
    const prev = parseInt(localStorage.getItem(key) ?? "0", 10);
    if (stars > prev) localStorage.setItem(key, String(stars));
  }

  private getStars(index: number): number {
    return parseInt(localStorage.getItem(`${STARS_KEY}-${index}`) ?? "0", 10);
  }

  private onLevelClear() {
    this.busy = true;
    const stars = this.calcStars();
    this.saveStars(stars);
    const { width, height } = this.scale;
    const starStr = "★".repeat(stars) + "☆".repeat(3 - stars);

    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0xffffff, 0.72)
      .setDepth(200)
      .setInteractive();

    const title = this.add
      .text(width / 2, height / 2 - 52, "Cleared!", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "34px",
        color: "#0f172a",
      })
      .setOrigin(0.5)
      .setDepth(201);

    const starText = this.add
      .text(width / 2, height / 2 - 8, starStr, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        color: "#f59e0b",
      })
      .setOrigin(0.5)
      .setDepth(201);

    const stats = this.add
      .text(width / 2, height / 2 + 28, `${this.moves} moves · ${this.mistakes} mistakes`, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "15px",
        color: "#64748b",
      })
      .setOrigin(0.5)
      .setDepth(201);

    const sub = this.add
      .text(width / 2, height / 2 + 56, "Tap for next level", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "17px",
        color: "#64748b",
      })
      .setOrigin(0.5)
      .setDepth(201);

    const next = () => {
      overlay.destroy();
      title.destroy();
      starText.destroy();
      stats.destroy();
      sub.destroy();
      const nextIndex = this.levelIndex + 1;
      if (nextIndex >= LEVELS.length) {
        this.showWinAll();
      } else {
        this.loadLevel(nextIndex);
      }
    };

    overlay.once("pointerdown", next);
  }

  private showFailOverlay() {
    const { width, height } = this.scale;

    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0xffffff, 0.78)
      .setDepth(200)
      .setInteractive();

    const title = this.add
      .text(width / 2, height / 2 - 40, "Out of hearts", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "28px",
        color: "#0f172a",
      })
      .setOrigin(0.5)
      .setDepth(201);

    const retry = this.add
      .text(width / 2, height / 2 + 16, "Try again", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#6366f1",
        padding: { x: 28, y: 12 },
      })
      .setOrigin(0.5)
      .setDepth(201)
      .setInteractive({ useHandCursor: true });

    retry.on("pointerdown", () => {
      overlay.destroy();
      title.destroy();
      retry.destroy();
      this.loadLevel(this.levelIndex);
    });
  }

  private showWinAll() {
    const { width, height } = this.scale;
    const totalStars = LEVELS.reduce((sum, _, i) => sum + this.getStars(i), 0);
    const maxStars = LEVELS.length * 3;

    this.add
      .text(
        width / 2,
        height / 2,
        `You cleared every level!\n${totalStars} / ${maxStars} stars\nTap ↺ or Levels to replay.`,
        {
          fontFamily: "system-ui, sans-serif",
          fontSize: "20px",
          color: "#0f172a",
          align: "center",
        },
      )
      .setOrigin(0.5)
      .setDepth(201);
    this.busy = false;
  }

  private showLevelSelect() {
    if (this.busy) return;

    const { width, height } = this.scale;
    const cols = 5;
    const cellW = Math.min(64, (width - 48) / cols);
    const cellH = 44;
    const rows = Math.ceil(LEVELS.length / cols);
    const gridH = rows * cellH + 80;

    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0x0f172a, 0.55)
      .setDepth(300)
      .setInteractive();

    const panel = this.add
      .rectangle(width / 2, height / 2, width - 32, Math.min(gridH, height - 120), 0xffffff, 1)
      .setDepth(301)
      .setStrokeStyle(1, 0xe2e8f0);

    const title = this.add
      .text(width / 2, height / 2 - Math.min(gridH, height - 120) / 2 + 28, "Select level", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "20px",
        color: "#0f172a",
        fontStyle: "600",
      })
      .setOrigin(0.5)
      .setDepth(302);

    const startY = height / 2 - Math.min(gridH, height - 120) / 2 + 56;
    const startX = width / 2 - ((cols - 1) * cellW) / 2;
    const buttons: Phaser.GameObjects.Text[] = [];

    const close = () => {
      overlay.destroy();
      panel.destroy();
      title.destroy();
      buttons.forEach((b) => b.destroy());
    };

    LEVELS.forEach((lvl, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const stars = this.getStars(i);
      const starMini = stars > 0 ? "★".repeat(stars) : "·";
      const label = `${i + 1}`;
      const btn = this.add
        .text(startX + col * cellW, startY + row * cellH, `${label}\n${starMini}`, {
          fontFamily: "system-ui, sans-serif",
          fontSize: "14px",
          color: i === this.levelIndex ? "#ffffff" : "#334155",
          backgroundColor: i === this.levelIndex ? "#6366f1" : "#f1f5f9",
          padding: { x: 8, y: 6 },
          align: "center",
        })
        .setOrigin(0.5)
        .setDepth(302)
        .setInteractive({ useHandCursor: true });

      btn.on("pointerdown", () => {
        close();
        this.loadLevel(i);
      });
      buttons.push(btn);
    });

    overlay.on("pointerdown", close);
  }

  private showToast(message: string, duration: number) {
    const { width, height } = this.scale;
    const toast = this.add
      .text(width / 2, height * 0.24, message, {
        fontFamily: "system-ui, sans-serif",
        fontSize: "15px",
        color: "#334155",
        backgroundColor: "#ffffff",
        padding: { x: 16, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(150)
      .setAlpha(0);

    this.tweens.add({
      targets: toast,
      alpha: 1,
      duration: 200,
      hold: duration - 400,
      yoyo: true,
      onComplete: () => toast.destroy(),
    });
  }
}
