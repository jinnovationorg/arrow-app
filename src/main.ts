import Phaser from "phaser";
import { GameScene } from "./scenes/GameScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#f8fafc",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844,
  },
  scene: [GameScene],
};

const game = new Phaser.Game(config);

// Re-layout once the canvas has its final size in the DOM
window.addEventListener("load", () => {
  game.scale.refresh();
});
