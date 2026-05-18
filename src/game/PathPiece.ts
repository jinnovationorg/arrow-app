import Phaser from "phaser";
import { getHeadDir } from "./pathGrid";
import type { Cell, Direction } from "../types";
import { DIR_DELTA } from "../types";

type PathStyle = "normal" | "blocked" | "hint" | "locked";

const PATH_PALETTE = [0x1a1a1a, 0x2563eb, 0x059669, 0xd97706, 0x7c3aed, 0xdb2777];

/** Shaft thickness & head size relative to cell */
const SHAFT_RATIO = 0.17;
const HEAD_WIDTH_RATIO = 1.55;
const HEAD_LENGTH_RATIO = 2.6;

export class PathPiece extends Phaser.GameObjects.Container {
  readonly pathIndex: number;
  cells: Cell[];
  private gfx!: Phaser.GameObjects.Graphics;
  private cellSize: number;
  private boardX: number;
  private boardY: number;
  private style: PathStyle = "normal";
  private baseColor: number;
  locked = false;

  constructor(
    scene: Phaser.Scene,
    pathIndex: number,
    cells: Cell[],
    cellSize: number,
    boardX: number,
    boardY: number,
    colorHex?: string,
  ) {
    super(scene, 0, 0);
    this.pathIndex = pathIndex;
    this.cells = cells.map((c) => ({ ...c }));
    this.cellSize = cellSize;
    this.boardX = boardX;
    this.boardY = boardY;
    this.baseColor = colorHex ? parseInt(colorHex.replace("#", ""), 16) : PATH_PALETTE[pathIndex % PATH_PALETTE.length]!;

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
    if (blocked) {
      this.setStyle("blocked");
    } else {
      this.setStyle(this.locked ? "locked" : "normal");
    }
  }

  setHintLook(active: boolean) {
    if (this.style === "blocked") return;
    this.setStyle(active ? "hint" : this.locked ? "locked" : "normal");
  }

  setLockedLook(locked: boolean) {
    this.locked = locked;
    if (this.style === "blocked" || this.style === "hint") return;
    this.setStyle(locked ? "locked" : "normal");
  }

  private setStyle(style: PathStyle) {
    if (this.style === style) return;
    this.style = style;
    this.redraw();
  }

  private styleParams(): { color: number; widthMul: number; headMul: number; alpha: number } {
    switch (this.style) {
      case "blocked":
        return { color: 0xdc2626, widthMul: 1.15, headMul: 1.2, alpha: 1 };
      case "hint":
        return { color: 0x4f46e5, widthMul: 1, headMul: 1.08, alpha: 1 };
      case "locked":
        return { color: this.baseColor, widthMul: 0.95, headMul: 0.95, alpha: 0.45 };
      default:
        return { color: this.baseColor, widthMul: 1, headMul: 1, alpha: 1 };
    }
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
    alpha: number,
  ) {
    g.fillStyle(color, alpha);
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

  private drawTailCap(
    g: Phaser.GameObjects.Graphics,
    tx: number,
    ty: number,
    dir: Direction,
    half: number,
    color: number,
    alpha: number,
  ) {
    const { dr, dc } = DIR_DELTA[dir];
    const px = -dr;
    const py = dc;
    const cap = half * 0.85;
    g.fillStyle(color, alpha);
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
    const { color, widthMul, headMul, alpha } = this.styleParams();
    const shaftHalf = Math.max(5, cs * SHAFT_RATIO) * widthMul;
    const headHalf = shaftHalf * HEAD_WIDTH_RATIO * headMul;
    const headLen = shaftHalf * HEAD_LENGTH_RATIO * headMul;

    g.clear();
    if (this.cells.length === 0) return;

    const pts = this.cells.map((c) => this.toWorld(c.row, c.col));
    const dir = this.getHeadDir();
    const { dr, dc } = DIR_DELTA[dir];

    if (pts.length === 1) {
      const p = pts[0]!;
      const neck = { x: p.x - dc * headLen, y: p.y - dr * headLen };
      if (this.style === "blocked") this.drawErrorMarker(g, p.x, p.y, headHalf);
      if (this.style === "locked") this.drawLockMarker(g, p.x, p.y, headHalf);
      this.drawThickBar(g, neck.x, neck.y, p.x - dc * shaftHalf * 0.3, p.y - dr * shaftHalf * 0.3, shaftHalf, color, alpha);
      this.drawArrowHead(g, neck.x, neck.y, dir, headHalf, headLen, color, alpha);
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
    if (this.style === "locked") {
      this.drawLockMarker(g, head.x, head.y, headHalf);
    }

    this.drawTailCap(g, tail.x, tail.y, dir, shaftHalf, color, alpha);

    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]!;
      const b = i === pts.length - 1 ? neck : pts[i]!;
      this.drawThickBar(g, a.x, a.y, b.x, b.y, shaftHalf, color, alpha);
    }

    this.drawArrowHead(g, neck.x, neck.y, dir, headHalf, headLen, color, alpha);
  }

  private drawArrowHead(
    g: Phaser.GameObjects.Graphics,
    bx: number,
    by: number,
    dir: Direction,
    headHalf: number,
    headLen: number,
    color: number,
    alpha: number,
  ) {
    const { dr, dc } = DIR_DELTA[dir];
    const px = -dr;
    const py = dc;

    const tip = { x: bx + dc * headLen, y: by + dr * headLen };
    const left = { x: bx + px * headHalf, y: by + py * headHalf };
    const right = { x: bx - px * headHalf, y: by - py * headHalf };

    g.fillStyle(color, alpha);
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

  private drawLockMarker(g: Phaser.GameObjects.Graphics, hx: number, hy: number, half: number) {
    const r = half * 1.6;
    g.fillStyle(0xfef3c7, 0.9);
    g.fillCircle(hx, hy, r);
    g.lineStyle(2, 0xd97706, 1);
    g.strokeCircle(hx, hy, r);
    const w = r * 0.55;
    const h = r * 0.45;
    g.fillStyle(0xd97706, 1);
    g.fillRoundedRect(hx - w, hy - h * 0.2, w * 2, h, 3);
    g.lineStyle(2.5, 0xd97706, 1);
    g.strokeCircle(hx, hy - h * 0.55, w * 0.7);
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
