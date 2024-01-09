class Scene2 extends Phaser.Scene {
  constructor() {
    super("playGame");
  }

  create() {
    this.background = this.add.tileSprite(
      0,
      0,
      config.width,
      config.height,
      "background"
    );
    this.background.setOrigin(0, 0);

    this.ship1 = this.add.sprite(config.width / 2 - 50, 0, "ship");
    this.ship2 = this.add.sprite(config.width / 2, 0, "ship2");
    this.ship3 = this.add.sprite(config.width / 2 + 50, 0, "ship3");

    this.enemies = this.physics.add.group();
    this.enemies.add(this.ship1);
    this.enemies.add(this.ship2);
    this.enemies.add(this.ship3);

    for (let i = 0; i < this.enemies.getChildren().length; i++) {
      const enemy = this.enemies.getChildren()[i];
      enemy.play(`ship${i + 1}_anim`);
      enemy.setInteractive();
      enemy.score = (i + 1) * gameSettings.scoreByShip;
      enemy.speed = i + 1;
    }

    this.physics.world.setBoundsCollision();

    this.powerUps = this.physics.add.group();

    this.player = this.physics.add.sprite(
      config.width / 2 - 8,
      config.height - 64,
      "player"
    );
    this.player.play("thrust");
    this.moveKeys = {
      ...this.input.keyboard.addKeys("W,A,S,D"),
      ...this.input.keyboard.createCursorKeys(),
    };

    this.player.setCollideWorldBounds(true);

    this.fireKeys = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.SPACE
    );
    this.input.on("pointerdown", (pointer) => {
      if (this.player.active) {
        this.shootBeam();
      }
    });

    this.projectiles = this.add.group();

    this.physics.add.collider(
      this.projectiles,
      this.powerUps,
      function (projectile, powerUp) {
        projectile.destroy();
      }
    );

    this.physics.add.overlap(
      this.player,
      this.powerUps,
      this.pickPowerUp,
      null,
      this
    );
    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.hurtPlayer,
      null,
      this
    );
    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      this.hitEnemy,
      null,
      this
    );

    var graphics = this.add.graphics();
    graphics.fillStyle(0x000000, 1);
    graphics.beginPath();
    graphics.moveTo(0, 0);
    graphics.lineTo(config.width, 0);
    graphics.lineTo(config.width, 20);
    graphics.lineTo(0, 20);
    graphics.lineTo(0, 0);
    graphics.closePath();
    graphics.fillPath();

    this.score = 0;
    this.scoreLabel = this.add.bitmapText(
      10,
      5,
      "pixelFont",
      `SCORE ${this.zeroPad(0, 6)}`,
      16
    );

    this.lives = 3;
    this.livesLabel = this.add.bitmapText(
      config.width / 2,
      5,
      "pixelFont",
      `LIVES: ${this.lives}`,
      16
    );

    this.level = 1;
    this.levelLabel = this.add.bitmapText(
      config.width - 50,
      5,
      "pixelFont",
      `LEVEL: ${this.level}`,
      16
    );

    this.beamSound = this.sound.add("audio_beam");
    this.explosionSound = this.sound.add("audio_explosion");
    this.pickupSound = this.sound.add("audio_pickup");

    this.music = this.sound.add("music");
    let musicConfig = {
      mute: false,
      volume: 0.02,
      rate: 1,
      detune: 0,
      seek: 0,
      loop: true,
      delay: 0,
    };
    this.music.play(musicConfig);
  }

  createPowerUp() {
    var powerUp = this.physics.add.sprite(16, 16, "power-up");
    this.powerUps.add(powerUp);
    powerUp.setRandomPosition(0, 0, game.config.width, game.config.height);

    if (Math.random() > 0.5) {
      powerUp.play("red");
    } else {
      powerUp.play("gray");
    }

    powerUp.setVelocity(gameSettings.boostSpeed, gameSettings.boostSpeed);
    powerUp.setCollideWorldBounds(true);
    powerUp.setBounce(1);
  }

  pickPowerUp(player, powerUp) {
    powerUp.disableBody(true, true);
    this.updateLives(1);
    this.pickupSound.play({ volume: 0.02 });
  }

  updateLives(count) {
    this.lives += count;
    this.livesLabel.text = `LIVES: ${this.lives}`;
  }

  updateLevel() {
    this.level += 1;
    this.levelLabel.text = `LEVEL: ${this.level}`;
    this.createPowerUp();
    for (let i = 0; i < this.enemies.getChildren().length; i++) {
      const enemie = this.enemies.getChildren()[i];
      enemie.speed += 1;
    }
  }

  hurtPlayer(player, enemy) {
    this.resetShipPos(enemy);
    if (this.player.alpha < 1) return;

    new Explosion(this, player.x, player.y);
    player.disableBody(true, true);

    this.time.addEvent({
      delay: 1000,
      callback: this.resetPlayer,
      callbackScope: this,
      loop: false,
    });
    this.updateLives(-1);
  }

  resetPlayer() {
    if (this.lives <= 0) {
      localStorage.setItem("lastScore", this.score);
      return this.scene.start("gameOver");
    }

    let x = config.width / 2 - 8;
    let y = config.height + 64;
    this.player.enableBody(true, x, y, true, true);

    this.player.alpha = 0.5;

    let tween = this.tweens.add({
      targets: this.player,
      y: config.height - 64,
      ease: "Power1",
      duration: 1500,
      repeat: 0,
      onComplete: function () {
        this.player.alpha = 1;
      },
      callbackScope: this,
    });
  }

  hitEnemy(projectile, enemy) {
    new Explosion(this, enemy.x, enemy.y);
    projectile.destroy();
    this.resetShipPos(enemy);

    this.score += enemy.score;
    let scoreFormated = this.zeroPad(this.score);
    this.scoreLabel.text = "SCORE " + scoreFormated;
    this.explosionSound.play({ volume: 0.02 });

    if (this.level * 1000 > this.score) return;
    else this.updateLevel();
  }

  zeroPad(number) {
    let stringNumer = String(number);
    while (stringNumer.length < 6) {
      stringNumer = "0" + stringNumer;
    }
    return stringNumer;
  }

  update() {
    this.moveShip(this.ship1);
    this.moveShip(this.ship2);
    this.moveShip(this.ship3);

    this.background.tilePositionY -= 0.5;

    this.movePlayerManager();

    if (Phaser.Input.Keyboard.JustDown(this.fireKeys)) {
      if (this.player.active) {
        this.shootBeam();
      }
    }

    for (let i = 0; i < this.projectiles.getChildren().length; i++) {
      var beam = this.projectiles.getChildren()[i];
      beam.update();
    }
  }

  shootBeam() {
    let beam = new Beam(this);
    this.beamSound.play({ volume: 0.02 });
  }

  movePlayerManager() {
    this.player.setVelocity(0);

    if (this.moveKeys.left.isDown || this.moveKeys.A.isDown) {
      this.player.setVelocityX(-gameSettings.playerSpeed);
    } else if (this.moveKeys.right.isDown || this.moveKeys.D.isDown) {
      this.player.setVelocityX(gameSettings.playerSpeed);
    }

    if (this.moveKeys.up.isDown || this.moveKeys.W.isDown) {
      this.player.setVelocityY(-gameSettings.playerSpeed);
    } else if (this.moveKeys.down.isDown || this.moveKeys.S.isDown) {
      this.player.setVelocityY(gameSettings.playerSpeed);
    }
  }

  moveShip(ship) {
    ship.y += ship.speed;
    if (ship.y > config.height) {
      this.resetShipPos(ship);
    }
  }

  resetShipPos(ship) {
    ship.y = 0;
    let randomX = Phaser.Math.Between(0, config.width);
    ship.x = randomX;
  }
}
