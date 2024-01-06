class GameOver extends Phaser.Scene {
  constructor() {
    super("gameOver");
  }

  preload() {}

  create() {
    this.lastScore = 0;
    this.records = JSON.parse(localStorage.getItem("records")) || [];
    this.renderLastScore();
    this.renderTable();

    this.input.on("pointerdown", (pointer) => {
      this.scene.start("playGame");
    });
  }

  renderLastScore() {
    this.lastScore = JSON.parse(localStorage.getItem("lastScore")) || 0;
    this.add.bitmapText(
      config.width / 2 - 40,
      15,
      "pixelFont",
      `YOUR SCORE IS: \n      ${this.zeroPad(this.lastScore)}`,
      16
    );
  }

  renderTable() {
    const renderText = (index, score) => {
      this.add.bitmapText(
        config.width / 2 - 30,
        50 + 15 * index,
        "pixelFont",
        `${index}: ${score}`,
        16
      );
    };

    this.records.push(this.lastScore);

    this.records = this.records.sort(function (a, b) {
      return b - a;
    });

    if (this.records.length > 10) {
      this.records = this.records.slice(0, 10);
    }

    localStorage.setItem("records", JSON.stringify(this.records));

    for (let i = 0; i < this.records.length; i++) {
      const record = this.records[i];
      renderText(i + 1, this.zeroPad(record));
    }

    this.add.bitmapText(
      config.width / 2 - 50,
      config.height - 30,
      "pixelFont",
      `CLICK TO RESTART`,
      16
    );
  }

  zeroPad(number) {
    let stringNumer = String(number);
    while (stringNumer.length < 6) {
      stringNumer = "0" + stringNumer;
    }
    return stringNumer;
  }
}
