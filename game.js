// Pelin konfiguraatio
const config = {
    type: Phaser.AUTO,  // Valitaan automaattisesti paras renderöintitapa (Canvas/WebGL)
    width: 800,         // Peliruudun leveys
    height: 600,        // Peliruudun korkeus
    parent: 'game-container',  // HTML-elementti johon peli upotetaan
    physics: {
        default: 'arcade',  // Käytetään arcade-fysiikkaa
        arcade: {
            gravity: { y: 800 },  // Painovoima (vaikuttaa pelaajaan)
            debug: false          // Ei näytetä fysiikkakehyksiä
        }
    },
    scene: { preload, create, update }  // Pelin eri vaiheet
};

// Muuttujat pelin elementeille
let player, cursors, attackKey, changeWeaponKey, isAttacking = false;
let enemies, sausages, score = 0, enemyCount = 0, sausageCount = 0;
let sword, gun, currentWeapon = 'sword';
let background;
let sausageCounterText, scoreText;
let jumpSound; // Hyppyääni
let playerY = 450;  // Pelaajan y-koordinaatti, nostetaan ylemmäs

// Luodaan Phaser-pelimoottori
const game = new Phaser.Game(config);

// Ladataan pelissä käytettävät resurssit
function preload() {
    this.load.image('background', 'images/background/background.png');
    this.load.spritesheet('player', 'images/characters/combat_jack_sprite.png', { frameWidth: 48, frameHeight: 64 });
    this.load.spritesheet('enemy', 'images/characters/enemy_sprite.png', { frameWidth: 48, frameHeight: 64 });
    this.load.image('sausage', 'images/weapons/sausage.png');
    this.load.image('sword', 'images/weapons/sword.png');
    this.load.image('gun', 'images/weapons/gun.png');
    this.load.audio('backgroundMusic', 'audio/background_music.mp3');
    this.load.audio('jumpSound', 'audio/jump.mp3');
}

// Luodaan peliin alkutilanteet create-funktiossa
function create() {
    // Tausta
    background = this.add.tileSprite(0, 0, 2400, 600, 'background').setOrigin(0, 0);
    this.cameras.main.setBounds(0, 0, 2400, 600);
    this.physics.world.setBounds(0, 0, 2400, 600);

    // Pelaaja sijoitetaan ylemmäs kentällä
    player = this.physics.add.sprite(100, playerY, 'player').setCollideWorldBounds(true);
    this.cameras.main.startFollow(player);

    // Aseet
    sword = this.add.image(player.x + 30, player.y - 20, 'sword').setVisible(false);
    gun = this.add.image(player.x + 30, player.y - 20, 'gun').setVisible(false);

    // Makkaralaskuri ja pistelaskuri
    sausageCounterText = this.add.text(16, 16, 'Maggarat: 0', { fontSize: '32px', fill: '#000' }).setScrollFactor(0);
    scoreText = this.add.text(500, 16, 'Pisteet: 0', { fontSize: '32px', fill: '#000' }).setScrollFactor(0);

    // Viholliset ja makkarat
    enemies = this.physics.add.group();
    sausages = this.physics.add.group();
    spawnEnemies(this, 10);  // Luo 10 vihollista
    spawnSausages(this, 20); // Luo 20 makkaraa

    // Näppäimistön kuuntelijat
    cursors = this.input.keyboard.createCursorKeys();
    attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    changeWeaponKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

    // Pelaajan törmäysvihollisten ja makkaroiden kanssa
    this.physics.add.overlap(player, enemies, defeatEnemy, null, this);
    this.physics.add.overlap(player, sausages, collectSausage, null, this);

    // Lyöntianimaatio
    this.anims.create({
        key: 'attack',
        frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
        frameRate: 10,
        repeat: 0
    });

    // Taustamusiikki
    this.sound.play('backgroundMusic', { loop: true, volume: 0.3 });

    // Hyppyäänet
    jumpSound = this.sound.add('jumpSound');
}

// Pelin päivitys joka framella update-funktiossa
function update() {
    if (isAttacking) return;  // Ei liikuta kun pelaaja hyökkää

    // Pelaajan liike vasemmalle ja oikealle
    if (!isAttacking) {
        if (cursors.left.isDown) {
            player.setVelocityX(-160);
            player.flipX = true;  // Kääntää pelaajan
            player.anims.play('left', true);
        } else if (cursors.right.isDown) {
            player.setVelocityX(160);
            player.flipX = false;
            player.anims.play('right', true);
        } else {
            player.setVelocityX(0);
            player.anims.stop();
        }
    }

    // Pelaajan hyppy
    if (cursors.up.isDown && player.body.blocked.down) {
        player.setVelocityY(-player.height * 6.25);  // Hyppykorkeus
        jumpSound.play();  // Soitetaan hyppyääni
    }

    // Aseiden sijainti pelaajan mukana
    updateWeaponPosition();

    // Hyökkäys
    if (Phaser.Input.Keyboard.JustDown(attackKey)) {
        isAttacking = true;
        player.anims.play('attack');
        player.once('animationcomplete', () => { isAttacking = false; });
    }

    // Aseenvaihto
    if (Phaser.Input.Keyboard.JustDown(changeWeaponKey)) {
        currentWeapon = currentWeapon === 'sword' ? 'gun' : 'sword';
    }

    // Laskurit
    sausageCounterText.setText('Maggarat: ' + sausageCount);
    scoreText.setText('Pisteet: ' + score);
}

// Päivitetään aseen sijainti pelaajan mukana
function updateWeaponPosition() {
    if (currentWeapon === 'sword') {
        sword.setPosition(player.x + (player.flipX ? -30 : 30), player.y - 20).setVisible(true);
        gun.setVisible(false);
    } else if (currentWeapon === 'gun') {
        gun.setPosition(player.x + (player.flipX ? -30 : 30), player.y - 20).setVisible(true);
        sword.setVisible(false);
    }
}

// Luo vihollisia kentälle
function spawnEnemies(scene, count) {
    for (let i = 0; i < count; i++) {
        let enemy = enemies.create(Phaser.Math.Between(300, 2300), playerY - 32, 'enemy');  // Sijoitetaan viholliset ylemmäs
        enemy.setCollideWorldBounds(true);
        enemy.setVelocityX(-100);  // Vihollinen liikkuu vasemmalle
        enemyCount++;
    }
}

// Luo makkaroita kentälle
function spawnSausages(scene, count) {
    for (let i = 0; i < count; i++) {
        let sausageY = Phaser.Math.Between(300, playerY - 32);  // Sijoitetaan makkarat ylemmäs
        let sausage = sausages.create(Phaser.Math.Between(200, 2300), sausageY, 'sausage');
        sausage.setCollideWorldBounds(true);
    }
}

// Törmäys vihollisen kanssa — vihollinen tuhoutuu ja pisteet kasvaa
function defeatEnemy(player, enemy) {
    enemy.destroy();
    score += 20;
    sendScoreToDatabase();
}

// Törmäys makkaran kanssa — makkara katoaa ja pisteet kasvaa
function collectSausage(player, sausage) {
    sausage.destroy();
    sausageCount++;
    score += 5;
    sendScoreToDatabase();
}

// Lähettää pelaajan pisteet palvelimelle tallennettavaksi
function sendScoreToDatabase() {
    fetch('/save_score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score: score, sausages: sausageCount, enemiesDefeated: enemyCount })
    });
}
