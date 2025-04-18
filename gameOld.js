        
// Pelin konfiguraatio, määrittää pelin asetukset kuten koko, fysiikka ja näkymä.
const config = {
type: Phaser.AUTO, // Määrittää, että Phaser valitsee automaattisesti parhaan rendererin (WebGL tai Canvas).
width: 800, // Pelin leveys
height: 600, // Pelin korkeus
parent: 'game-container', // Tämä mahdollistaa pelin upottamisen HTML-elementtiin id:llä 'game-container'
physics: {
 default: 'arcade', // Käytetään Phaserin arcade-fysiikkamoottoria
 arcade: { gravity: { y: 500 }, debug: false } // Määritetään painovoima (gravity) ja debug-tila (false)
},
scene: { preload, create, update } // Scene-funktiot (preload, create ja update)
};

// Pelin globaalit muuttujat.
let player, cursors, attackKey, isAttacking = false; // Pelaaja, ohjaimet, hyökkäysnäppäin ja hyökkäyslogiikka
let enemies, sausages, score = 0, enemyCount = 0, sausageCount = 0; // Viholliset, makkarat, pisteet ja laskurit
let sword, gun, currentWeapon = 'sword'; // Aseet ja nykyinen ase
let background; // Tausta
let sausageCounterText, scoreText; // Makkaralaskuri ja pistelaskuri
const game = new Phaser.Game(config); // Pelin alustaminen Phaser-konfiguraation avulla

// Lataa resurssit, kuten kuvat ja spritet
function preload() {
this.load.image('background', 'images/background/background.png');
this.load.image('ground', 'images/background/ground.png'); 
this.load.spritesheet('player', 'images/characters/combat_jack_sprite.png', { frameWidth: 48, frameHeight: 64 }); // Pelaaja (Combat Jack)
this.load.spritesheet('enemy', 'images/characters/enemy_sprite.png', { frameWidth: 48, frameHeight: 64 }); // Vihollinen
this.load.image('sausage', 'images/weapons/sausage.png'); // Makkara
this.load.image('sword', 'images/weapons/sword.png'); // Miekka
this.load.image('gun', 'images/weapons/gun.png'); // Pyssy
this.load.audio('backgroundMusic', 'audio/background_music.mp3'); // Taustamusiikki
}

// Luodaan pelin aloitustilanne, kuten pelaaja, tausta, maahanmenot jne.
function create() {
background = this.add.tileSprite(0, 0, 2400, 600, 'background').setOrigin(0, 0);
this.cameras.main.setBounds(0, 0, 2400, 600);
this.physics.world.setBounds(0, 0, 2400, 600);

let ground = this.physics.add.staticGroup();
ground.create(1200, 580, 'ground').setScale(2).refreshBody();

player = this.physics.add.sprite(100, 450, 'player');
player.setCollideWorldBounds(true);
this.physics.add.collider(player, ground);
this.cameras.main.startFollow(player);

// Aseiden luominen ja asettaminen oikeaan sijaintiin pelaajan kanssa
sword = this.add.image(player.x - 30, player.y - 40, 'sword').setOrigin(0.5, 0.5).setVisible(false); 
gun = this.add.image(player.x + 30, player.y - 310, 'gun').setOrigin(0.5, 0.1).setVisible(false); 

// Makkaralaskuri
sausageCounterText = this.add.text(16, 16, 'Maggarat: 0', {
 fontSize: '32px',
 fill: '#000'
}).setDepth(1);  // Varmistaa, että tekstin taso on korkein, jotta se ei mene muiden objektien alle

// Pistelaskuri
scoreText = this.add.text(500, 16, 'Pisteet: 0', {
 fontSize: '32px',
 fill: '#000'
}).setDepth(1);

// Asetetaan makkaralaskuri kiinteästi vasempaan yläkulmaan
sausageCounterText.setScrollFactor(0); // Tämä varmistaa, että teksti ei liiku kameran mukana
scoreText.setScrollFactor(0); // Sama pistelaskurille



// Lisäämme vihollisia ja makkaroita
enemies = this.physics.add.group();
sausages = this.physics.add.group();
spawnEnemies(this, 10);  // Luo 10 vihollista
spawnSausages(this, 20);  // Luo 20 makkaraa

cursors = this.input.keyboard.createCursorKeys();
attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
changeWeaponKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W); // Vaihda ase 'W' näppäimellä

this.physics.add.overlap(player, enemies, defeatEnemy, null, this);
this.physics.add.overlap(player, sausages, collectSausage, null, this);

// Play that funky music, Combat Jack!
this.sound.play('backgroundMusic', { loop: true, volume: 0.5 }); // Toistetaan muzakit loopilla ja 50 volalla.



}



// Päivittää pelin logiikan joka ruudulla
function update() {
if (isAttacking) return;

// Pelaajan liikkuminen vasemmalle ja oikealle
if (cursors.left.isDown) {
 player.setVelocityX(-160);
 background.tilePositionX -= 2;
 player.anims.play('left', true);
} else if (cursors.right.isDown) {
 player.setVelocityX(160);
 background.tilePositionX += 2;
 player.anims.play('right', true);
} else {
 player.setVelocityX(0);
 player.anims.stop();
}

// Hyppy
if (cursors.up.isDown) {
 player.setVelocityY(-50);  // Hyppää ylöspäin
}

 // Aseiden sijainnin päivitys pelaajan kanssa
 if (currentWeapon === 'sword') {
 sword.setPosition(player.x + 30, player.y - 70); // Miekka pelaajan vasemmalle puolelle
 sword.setVisible(true); // Näytä miekka
 gun.setVisible(false); // Piilota ase
} else if (currentWeapon === 'gun') {
 gun.setPosition(player.x + 30, player.y - 70); // Ase pelaajan oikealle puolelle
 gun.setVisible(true); // Näytä ase
 sword.setVisible(false); // Piilota miekka
}

// Hyökkäys
if (Phaser.Input.Keyboard.JustDown(attackKey)) {
 isAttacking = true;
 player.anims.play('attack', true);
 player.once('animationcomplete', () => { isAttacking = false; });
}

// Vaihda ase
if (Phaser.Input.Keyboard.JustDown(changeWeaponKey)) {
 currentWeapon = currentWeapon === 'sword' ? 'gun' : 'sword'; // Vaihda miekan ja aseen välillä
}

// Aseiden vaikutus pelaajan animaatioihin ja niiden sijainti
if (currentWeapon === 'sword') {
 sword.setPosition(player.x + 30, player.y - 20); // Miekka pelaajan oikealle puolelle
 sword.setVisible(true); // Näytä miekka
 gun.setVisible(false); // Piilota pyssy
} else if (currentWeapon === 'gun') {
 gun.setPosition(player.x + 30, player.y - 20); // Pyssy pelaajan oikealle puolelle
 gun.setVisible(true); // Näytä pyssy
 sword.setVisible(false); // Piilota miekka
}

// Päivitä makkaralaskuri ja pistelaskuri
sausageCounterText.setText('Maggarat: ' + sausageCount);
scoreText.setText('Pisteet: ' + score);
}

// Funktio vihollisten luomiseen (useampi vihollinen)
function spawnEnemies(scene, count) {
for (let i = 0; i < count; i++) {
 let enemy = enemies.create(Phaser.Math.Between(300, 2300), 450, 'enemy');
 enemy.setCollideWorldBounds(true);
 enemy.setVelocityX(-100);
 enemyCount++;
}
}

// Funktio makkaroiden luomiseen (useampi makkara)
function spawnSausages(scene, count) {
for (let i = 0; i < count; i++) {
 let sausageY = Phaser.Math.Between(300, 450); // Satunnainen korkeus
 let sausage = sausages.create(Phaser.Math.Between(200, 2300), sausageY, 'sausage');
 sausage.setCollideWorldBounds(true);

}
}

// Funktio vihollisen voittamiseen
function defeatEnemy(player, enemy) {
enemy.destroy();
score += 20; // Vihollisesta 20 pistettä
sendScoreToDatabase();
}

// Funktio makkaran keräämiseen
function collectSausage(player, sausage) {
sausage.destroy();
sausageCount++; // Lisätään makkaran laskuri
score += 5; // Makkarasta 5 pistettä
sendScoreToDatabase();
}

// Funktio pisteiden lähettämiseen tietokantaan
function sendScoreToDatabase() {
fetch('/save_score', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ score: score, sausages: sausageCount, enemiesDefeated: enemyCount })
});
}
