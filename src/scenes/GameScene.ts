import Phaser from "phaser";
import { PathPiece } from "../game/PathPiece";
import { cellKey, checkPathEscape } from "../game/pathGrid";
import { LEVELS, STORAGE_KEY } from "../levels";
import { DIR_DELTA, type LevelDef } from "../types";

const MAX_HEARTS = 5;
const CELL_ANIM_MS = 55;

export class GameScene extends Phaser.Scene {
  private levelIndex = 0;
  private hearts = MAX_HEARTS;
  private level!: LevelDef;
  private cellSize = 64;
  private boardX = 0;
  private boardY = 0;
  private busy = false;
  private inputLocked = false;
  private paths: PathPiece[] = [];
  private levelText!: Phaser.GameObjects.Text;
  private heartsText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private restartBtn!: Phaser.GameObjects.Text;
  private boardGfx!: Phaser.GameObjects.Graphics;

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
    this.levelText = this.add
      .text(0, 0, "", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "17px",
        color: "#334155",
        fontStyle: "600",
      })
      .setDepth(50)
      .setScrollFactor(0);

    this.heartsText = this.add
      .text(0, 0, "", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "20px",
        color: "#ef4444",
      })
      .setDepth(50)
      .setScrollFactor(0);

    this.hintText = this.add
      .text(0, 0, "Hint", {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "15px",
        color: "#6366f1",
        backgroundColor: "#eef2ff",
        padding: { x: 14, y: 8 },
      })
      .setDepth(50)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.hintText.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, ev?: Event) => {
      ev?.stopPropagation();
      this.showHint();
    });

    this.restartBtn = this.add
      .text(0, 0, "↺", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "26px",
        color: "#64748b",
      })
      .setDepth(50)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.restartBtn.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, ev?: Event) => {
      ev?.stopPropagation();
      this.loadLevel(this.levelIndex);
    });
  }

  private setupInput() {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.busy || this.inputLocked || !this.level) return;
      if (pointer.y < 90 || pointer.y > this.scale.height - 72) return;

      const piece = this.findPathAt(pointer.x, pointer.y);
      if (piece) this.onPathTap(piece);
    });
  }

  /** Occupancy from live on-board paths (not stale level data). */
  private buildLiveOccupied(exclude?: PathPiece): Set<string> {
    const set = new Set<string>();
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
    this.levelIndex = index;
    this.level = LEVELS[index]!;
    this.clearBoard();

    localStorage.setItem(STORAGE_KEY, String(index));
    this.updateHud();
    this.layout();
    this.redrawBoard();
    this.spawnPaths();

    if (index === 0 && !sessionStorage.getItem("arrows-tutorial")) {
      sessionStorage.setItem("arrows-tutorial", "1");
      this.showToast("Tap a path to slide it off the board", 3200);
    }
  }

  private clearBoard() {
    this.paths.forEach((p) => p.destroy());
    this.paths = [];
    this.boardGfx?.destroy();
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
    const topBar = 100;
    const bottomPad = 36;
    const availW = width - pad * 2;
    const availH = height - topBar - bottomPad;

    const { rows, cols } = this.level;
    this.cellSize = Math.floor(Math.min(availW / cols, availH / rows));
    this.cellSize = Phaser.Math.Clamp(this.cellSize, 36, 80);

    const boardW = cols * this.cellSize;
    const boardH = rows * this.cellSize;
    this.boardX = (width - boardW) / 2 + this.cellSize / 2;
    this.boardY = topBar + (availH - boardH) / 2 + this.cellSize / 2;

    this.levelText.setText(`Level ${this.levelIndex + 1}`);
    this.levelText.setPosition(width / 2, 44).setOrigin(0.5, 0);

    this.heartsText.setPosition(width / 2, 72).setOrigin(0.5, 0);
    this.hintText.setPosition(width / 2, height - 44).setOrigin(0.5, 0.5);
    this.restartBtn.setPosition(pad, height - 52);
  }

  private redrawBoard() {
    this.boardGfx?.destroy();
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
      );
      this.add.existing(piece);
      piece.setDepth(10 + i);
      this.paths.push(piece);
    });
  }

  private updateHud() {
    const filled = "♥".repeat(this.hearts);
    const empty = "♡".repeat(MAX_HEARTS - this.hearts);
    this.heartsText.setText(filled + empty);
  }

  private onPathTap(piece: PathPiece) {
    if (this.busy) return;

    const dir = piece.getHeadDir();
    const occupied = this.buildLiveOccupied(piece);
    const result = checkPathEscape(piece.cells, dir, occupied, this.level.rows, this.level.cols);

    if (!result.canEscape) {
      this.onMistake(piece);
      return;
    }

    this.busy = true;
    this.extractPath(piece, result.steps);
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
      piece.setBlockedLook(false);
      this.inputLocked = false;
    });

    if (this.hearts <= 0) {
      this.busy = true;
      this.time.delayedCall(400, () => this.showFailOverlay());
    }
  }

  private showHint() {
    if (this.busy) return;

    let target: PathPiece | null = null;
    for (const piece of this.paths) {
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
      this.showToast("No path can move — try another order", 2000);
      return;
    }

    this.paths.forEach((p) => p.setHintLook(p === target));
    this.time.delayedCall(1200, () => this.paths.forEach((p) => p.setHintLook(false)));
  }

  private onLevelClear() {
    this.busy = true;
    const { width, height } = this.scale;

    const overlay = this.add
      .rectangle(width / 2, height / 2, width, height, 0xffffff, 0.72)
      .setDepth(200)
      .setInteractive();

    const title = this.add
      .text(width / 2, height / 2 - 36, "Cleared!", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "34px",
        color: "#0f172a",
      })
      .setOrigin(0.5)
      .setDepth(201);

    const sub = this.add
      .text(width / 2, height / 2 + 8, "Tap for next level", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "17px",
        color: "#64748b",
      })
      .setOrigin(0.5)
      .setDepth(201);

    const next = () => {
      overlay.destroy();
      title.destroy();
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
    this.add
      .text(width / 2, height / 2, "You cleared every level!\nTap ↺ to replay.", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "22px",
        color: "#0f172a",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(201);
    this.busy = false;
  }

  private showToast(message: string, duration: number) {
    const { width, height } = this.scale;
    const toast = this.add
      .text(width / 2, height * 0.22, message, {
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
