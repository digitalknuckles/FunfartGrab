// main.js
import { mintPrize } from './walletconnect.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#ffffff',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: { preload, create, update }
};

const game = new Phaser.Game(config);

let claw, clawHitbox, overlay, overlayLeft, overlayRight, prizeGroup, fallingGroup, prizeBox, victory = false;
let clawDropping = false, clawRetracting = false, holdingObject = false;
let attachedPrize = null, moveLeft = false, moveRight = false;
let startMenuImage;

function preload() {
  this.load.image('background', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafybeic345u2ts5tz3u3xcguldwnlg3ye5wzl6o6vew7gnf6mh3du3xpnu');
  this.load.image('claw', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafkreicph5dqmvlsxvn7kbpd3ipf3qaul7sunbm3zhbx5tvf3ofgecljsq');
  this.load.image('prize', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafkreibyehv3juhhr7jgfblaziguedekj7skpqzndbbvd7xnj7isuxhela');
  this.load.image('victoryBg', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafybeie5fzzrljnlnejrhmrqaog3z4edm5hmsncuk4kayj5zyh7edfso5q');
  this.load.image('overlay_idle', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafkreie32rhyvbibeer5minlpijbri5puqq36bafszwyjnhc4ozakew3oy');
  this.load.image('overlay_left', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafkreig6zkwf6swgewwmwdhuiaualqymbfpbsdc4v3j3m47syg26x3uclq');
  this.load.image('overlay_right', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafkreichlj2x2l4ejoyxale7kbfmiszesglm2aftsbdnrchjy4br5q3n2e');
  this.load.image('startMenu', 'https://magenta-broad-orca-873.mypinata.cloud/ipfs/bafkreicexx7almk7jkzgd7up4uibqh2n7v6gkmeimbgoslbclc3dsndhhy');
}

function create() {
  this.add.image(400, 300, 'background');

  prizeGroup = this.physics.add.group();
  fallingGroup = this.physics.add.group();

  for (let x = 200; x < 600; x += 150) {
    const prize = this.physics.add.image(x, 550, 'prize').setImmovable(true);
    prize.body.setSize(16, 24).setOffset(20, 14);
    prize.setDepth(1);
    prizeGroup.add(prize);
  }

  claw = this.add.image(400, 50, 'claw').setDepth(2);
  clawHitbox = this.physics.add.image(400, 50).setImmovable(true).setVisible(false);
  clawHitbox.body.setSize(20, 40).setOffset(-10, -20);

  overlay = this.add.image(400, 300, 'overlay_idle').setDepth(3);

  if (!prizeBox || !prizeBox.body) {
    prizeBox = this.add.rectangle(770, 770, 40, 10, 0x00ff00, 0.2);
    this.physics.add.existing(prizeBox, true);
  }

  startMenuImage = this.add.image(400, 300, 'startMenu').setDepth(20);

  this.input.keyboard.on('keydown-LEFT', () => {
    moveLeft = true;
    overlay.setTexture('overlay_left');
  });
  this.input.keyboard.on('keyup-LEFT', () => {
    moveLeft = false;
    overlay.setTexture('overlay_idle');
  });
  this.input.keyboard.on('keydown-RIGHT', () => {
    moveRight = true;
    overlay.setTexture('overlay_right');
  });
  this.input.keyboard.on('keyup-RIGHT', () => {
    moveRight = false;
    overlay.setTexture('overlay_idle');
  });
  this.input.keyboard.on('keydown-SPACE', () => {
    if (startMenuImage?.visible) {
      startMenuImage.setVisible(false);
      return;
    }
    if (!clawDropping && !clawRetracting && !holdingObject) {
      clawDropping = true;
    } else if (holdingObject) {
      fallingGroup.add(attachedPrize);
      attachedPrize.setVelocityY(300);
      holdingObject = false;
      attachedPrize = null;
    }
  });
}

function update() {
  if (victory) return;

  if (moveLeft && !clawDropping && !clawRetracting) {
    claw.x = clawHitbox.x = Math.max(50, claw.x - 5);
  }
  if (moveRight && !clawDropping && !clawRetracting) {
    claw.x = clawHitbox.x = Math.min(750, claw.x + 5);
  }

  if (clawDropping) {
    claw.y += 4;
    clawHitbox.y += 4;
    prizeGroup.children.iterate((prize) => {
      if (Phaser.Geom.Intersects.RectangleToRectangle(clawHitbox.getBounds(), prize.getBounds())) {
        attachedPrize = prize;
        holdingObject = true;
        clawDropping = false;
        clawRetracting = true;
      }
    });
    if (claw.y >= 500 && !holdingObject) {
      clawDropping = false;
      setTimeout(() => clawRetracting = true, 500);
    }
  } else if (clawRetracting) {
    claw.y -= 3;
    clawHitbox.y -= 3;
    if (claw.y <= 50) clawRetracting = false;
  }

  if (holdingObject && attachedPrize) {
    attachedPrize.x = claw.x;
    attachedPrize.y = claw.y + 190;
  }

  fallingGroup.children.iterate((prize) => {
    if (Phaser.Geom.Intersects.RectangleToRectangle(prize.getBounds(), prizeBox.getBounds())) {
      destroyAllPrizes();
      showVictoryScreen.call(this);
    } else if (prize.y >= 560) {
      prize.setVelocityY(0);
    }
  });
}

function destroyAllPrizes() {
  prizeGroup.clear(true, true);
  fallingGroup.clear(true, true);
}

function showVictoryScreen() {
  victory = true;
  this.add.image(400, 300, 'victoryBg').setDepth(21);
  this.add.text(400, 150, 'You Win!', { fontSize: '64px', color: '#fff' }).setOrigin(0.5).setDepth(22);

  const mintPrizeButton = this.add.text(400, 240, 'Mint Prize', {
    fontSize: '28px', backgroundColor: '#ff0', color: '#000', padding: { x: 10, y: 5 }
  }).setOrigin(0.5).setInteractive().setDepth(22);

  mintPrizeButton.on('pointerdown', () => mintPrize());
}
