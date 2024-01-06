var config = {
  width: 244,
  height: 320,
  backgroundColor: 0x000000,
  scene: [Scene1, Scene2, GameOver],
  pixelArt: true,
  physics: {
    default: "arcade",
    arcade: { debug: false, debugShowVelocity: false },
  },
};
var gameSettings = { playerSpeed: 200, boostSpeed: 50, scoreByShip: 11 };
let game = new Phaser.Game(config);
