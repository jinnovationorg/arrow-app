import Phaser from "phaser";
import { getHeadDir } from "./pathGrid";
import type { Cell, Direction } from "../types";
import { DIR_DELTA } from "../types";

type PathStyle = "normal" | "blocked" | "hint";

/** Shaft thickness & head size relative to cell */
const SHAFT_RATIO = 0.17;
const HEAD_WIDTH_RATIO = 1.55;
const HEAD_LENGTH_RATIO = 2.6;

const STYLE = {
  normal: { color: 0x1a1a1a, widthMul: 1, headMul: 1 },
  blocked: { color: 0xdc2626, widthMul: 1.15, headMul: 1.2 },
  hint: { color: 0x4f46e5, widthMul: 1, headMul: 1.08 },
} as const;

export class PathPiece extends Phaser.GameObjects.Container {
  readonly pathIndex: number;
  cells: Cell[];
  private gfx!: Phaser.GameObjects.Graphics;
  private cellSize: number;
  private boardX: number;
  private boardY: number;
  private style: PathStyle = "normal";

  constructor(
    scene: Phaser.Scene,
    pathIndex: number,
    cells: Cell[],
    cellSize: number,
    boardX: number,
    boardY: number,
  ) {
    super(scene, 0, 0);
    this.pathIndex = pathIndex;
    this.cells = cells.map((c) => ({ ...c }));
    this.cellSize = cellSize;
    this.boardX = boardX;
    this.boardY = boardY;

    this.gfx = scene.add.graphics();
    this.add(this.gfx);
    this.redraw();
  }

  getHeadDir() {
    return getHeadDir(this.cells);
  }

  setBoardLayout(cellSize: number, boardX: number, boardY: number) {
    this.cellSize = cellSize;
    this.boardX = boardX;
    this.boardY = boardY;
    this.redraw();
  }

  setBlockedLook(blocked: boolean) {
    this.setStyle(blocked ? "blocked" : "normal");
  }

  setHintLook(active: boolean) {
    if (this.style === "blocked") return;
    this.setStyle(active ? "hint" : "normal");
  }

  private setStyle(style: PathStyle) {
    if (this.style === style) return;
    this.style = style;
    this.redraw();
  }

  private toWorld(row: number, col: number) {
    return {
      x: this.boardX + col * this.cellSize,
      y: this.boardY + row * this.cellSize,
    };
  }

  private drawThickBar(
    g: Phaser.GameObjects.Graphics,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    half: number,
    color: number,
  ) {
    g.fillStyle(color, 1);
    if (Math.abs(x2 - x1) < 0.5) {
      const top = Math.min(y1, y2) - half;
      const h = Math.abs(y2 - y1) + half * 2;
      g.fillRect(x1 - half, top, half * 2, h);
    } else {
      const left = Math.min(x1, x2) - half;
      const w = Math.abs(x2 - x1) + half * 2;
      g.fillRect(left, y1 - half, w, half * 2);
    }
  }

  /** Flat cap at the tail — shows where the path starts */
  private drawTailCap(
    g: Phaser.GameObjects.Graphics,
    tx: number,
    ty: number,
    dir: Direction,
    half: number,
    color: number,
  ) {
    const { dr, dc } = DIR_DELTA[dir];
    const px = -dr;
    const py = dc;
    const cap = half * 0.85;
    g.fillStyle(color, 1);
    g.fillTriangle(
      tx - dc * cap,
      ty - dr * cap,
      tx + px * half,
      ty + py * half,
      tx - px * half,
      ty - py * half,
    );
  }

  redraw() {
    const g = this.gfx;
    const cs = this.cellSize;
    const s = STYLE[this.style];
    const color = s.color;
    const shaftHalf = Math.max(5, cs * SHAFT_RATIO) * s.widthMul;
    const headHalf = shaftHalf * HEAD_WIDTH_RATIO * s.headMul;
    const headLen = shaftHalf * HEAD_LENGTH_RATIO * s.headMul;

    g.clear();
    if (this.cells.length === 0) return;

    const pts = this.cells.map((c) => this.toWorld(c.row, c.col));
    const dir = this.getHeadDir();
    const { dr, dc } = DIR_DELTA[dir];

    if (pts.length === 1) {
      const p = pts[0]!;
      const neck = { x: p.x - dc * headLen, y: p.y - dr * headLen };
      if (this.style === "blocked") this.drawErrorMarker(g, p.x, p.y, headHalf);
      this.drawThickBar(g, neck.x, neck.y, p.x - dc * shaftHalf * 0.3, p.y - dr * shaftHalf * 0.3, shaftHalf, color);
      this.drawArrowHead(g, neck.x, neck.y, dir, headHalf, headLen, color);
      return;
    }

    const head = pts[pts.length - 1]!;
    const tail = pts[0]!;
    const neck = {
      x: head.x - dc * headLen,
      y: head.y - dr * headLen,
    };

    if (this.style === "blocked") {
      this.drawErrorMarker(g, head.x, head.y, headHalf);
    }

    // Tail cap (blunt end — direction is toward the head)
    this.drawTailCap(g, tail.x, tail.y, dir, shaftHalf, color);

    // Shaft through every bend, ending at arrow base
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!;
      const b = i === pts.length - 1 ? neck : pts[i]!;
      this.drawThickBar(g, a.x, a.y, b.x, b.y, shaftHalf, color);
    }

    // Pointed head (wider + longer than shaft — clear “going →” look)
    this.drawArrowHead(g, neck.x, neck.y, dir, headHalf, headLen, color);
  }

  /**
   * Arrowhead: base at (bx,by), tip extends `headLen` pixels in `dir`.
   * `headHalf` = half-width of base (wider than shaft).
   */
  private drawArrowHead(
    g: Phaser.GameObjects.Graphics,
    bx: number,
    by: number,
    dir: Direction,
    headHalf: number,
    headLen: number,
    color: number,
  ) {
    const { dr, dc } = DIR_DELTA[dir];
    const px = -dr;
    const py = dc;

    const tip = { x: bx + dc * headLen, y: by + dr * headLen };
    const left = { x: bx + px * headHalf, y: by + py * headHalf };
    const right = { x: bx - px * headHalf, y: by - py * headHalf };

    g.fillStyle(color, 1);
    g.fillTriangle(tip.x, tip.y, left.x, left.y, right.x, right.y);
  }

  private drawErrorMarker(g: Phaser.GameObjects.Graphics, hx: number, hy: number, half: number) {
    const r = half * 2.4;
    g.fillStyle(0xfecaca, 0.55);
    g.fillCircle(hx, hy, r);
    g.lineStyle(2.5, 0xdc2626, 0.9);
    g.strokeCircle(hx, hy, r);

    const x = half * 0.85;
    g.lineStyle(3, 0xffffff, 1);
    g.lineBetween(hx - x, hy - x, hx + x, hy + x);
    g.lineBetween(hx - x, hy + x, hx + x, hy - x);
  }

  hitTest(wx: number, wy: number, threshold: number): boolean {
    const pts = this.cells.map((c) => this.toWorld(c.row, c.col));
    const t2 = threshold * threshold;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i]!;
      const ddx = wx - p.x;
      const ddy = wy - p.y;
      if (ddx * ddx + ddy * ddy < t2) return true;
    }

    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!;
      const b = pts[i]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const lenSq = dx * dx + dy * dy;
      let t = lenSq === 0 ? 0 : ((wx - a.x) * dx + (wy - a.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const cx = a.x + t * dx;
      const cy = a.y + t * dy;
      const ddx = wx - cx;
      const ddy = wy - cy;
      if (ddx * ddx + ddy * ddy < t2) return true;
    }
    return false;
  }
}
