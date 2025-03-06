// Super Combat Jack X: The Doomsday Syndicate (Phaser.js)

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container', // Tämä mahdollistaa upottamisen HTML-elementtiin
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 500 }, debug: false }
    },
    scene: { preload, create, update }
};

let player, cursors, attackKey, isAttacking = false;
let enemies, sausages, score = 0, enemyCount = 0, sausageCount = 0;
let weapons, currentWeapon = 'sword';

const game = new Phaser.Game(config);

function preload() {
    this.load.image('background', 'images/background/background.png');
    this.load.image('ground', 'images/background/ground.png');
    this.load.spritesheet('player', 'images/characters/combat_jack_sprite.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('enemy', 'images/characters/enemy_sprite.png', { frameWidth: 48, frameHeight: 64 });
    this.load.image('sausage', 'images/weapons/sausage.png');
    this.load.image('sword', 'images/weapons/sword.png');
    this.load.image('gun', 'images/weapons/gun.png');
}

function create() {
    this.add.image(400, 300, 'background');
    let ground = this.physics.add.staticGroup();
    ground.create(400, 580, 'ground').setScale(2).refreshBody();

    player = this.physics.add.sprite(100, 450, 'player');
    player.setCollideWorldBounds(true);
    this.physics.add.collider(player, ground);

    enemies = this.physics.add.group();
    sausages = this.physics.add.group();

    spawnEnemy(this);
    spawnSausage(this);

    weapons = this.physics.add.group();

    cursors = this.input.keyboard.createCursorKeys();
    attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.physics.add.overlap(player, enemies, defeatEnemy, null, this);
    this.physics.add.overlap(player, sausages, collectSausage, null, this);
}

function update() {
    if (isAttacking) return;

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.stop();
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-350);
    }

    if (Phaser.Input.Keyboard.JustDown(attackKey)) {
        isAttacking = true;
        player.anims.play('attack', true);
        player.once('animationcomplete', () => { isAttacking = false; });
    }
}

function spawnEnemy(scene) {
    let enemy = enemies.create(Phaser.Math.Between(300, 700), 450, 'enemy');
    enemy.setCollideWorldBounds(true);
    enemy.setVelocityX(-100);
    enemyCount++;
}

function spawnSausage(scene) {
    let sausage = sausages.create(Phaser.Math.Between(200, 700), 450, 'sausage');
    sausage.setCollideWorldBounds(true);
    sausageCount++;
}

function defeatEnemy(player, enemy) {
    enemy.destroy();
    score += 10;
    sendScoreToDatabase();
}

function collectSausage(player, sausage) {
    sausage.destroy();
    score += 5;
    sendScoreToDatabase();
}

function sendScoreToDatabase() {
    fetch('/save_score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: score, sausages: sausageCount, enemiesDefeated: enemyCount })
    });
}