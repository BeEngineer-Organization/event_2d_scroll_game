//  画面状態の管理
const START_SCREEN = 0;
const GAME_SCREEN = 1;
const GAMEOVER_SCREEN = 2;

// 画面の大きさを設定
const DISPLAY_HEIGHT = 480;
const DISPLAY_WIDTH = 640;
const DISTANCETOGROUND = 320;

// プレイヤーに関する情報を設定
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 32;
const PLAYER_SPEED_X = 5;
const PLAYER_SPEED_Y = -12;

const CRYSTAL_WIDTH = 32
const CRYSTAL_HEIGHT = 32
const CRYSTAL_X = 50
const CRYSTAL_Y = 300

// 重力の大きさを設定
const GRAVITY = 0.7;

// 的に関する情報を設定
const ENEMY_WIDTH = 32;
const ENEMY_HEIGHT = 32;
const ENEMY_SPEED_X = -2;

// ブロックに関する情報を設定
const BLOCK_HEIGHT = 32;

// 衝突判定において画像の余白が直感よりも遠い距離での当たり判定を生んでいるので、調整するために使用
const COLLISION_MARGIN_X = 8;
const COLLISION_MARGIN_Y = 8;

// ボタンに関数る情報を設定
const BUTTON_WIDTH = 200;
const BUTTON_HEIGHT = 50;

// 敵が出現する座標を設定
const ENEMY_POSITIONS = [800, 950, 1000, 1200, 1300, 1400, 1500,2000,2100];

// 斧に関する情報を設定
const AXE_WIDTH = 32;
const AXE_HEIGHT = 32;
const AXE_SPEED_X = 8;
const AXE_DURATION = 500; // 2秒間直線飛行

// ジャンプ敵に関する情報を設定
const JUMPING_ENEMY_WIDTH = 32;
const JUMPING_ENEMY_HEIGHT = 32;
const JUMPING_ENEMY_SPEED_Y = -12;
const JUMPING_ENEMY_JUMP_INTERVAL = 1500; // ジャンプ間隔（ミリ秒）

// ゴールフラッグに関する情報を設定
const GOAL_FLAG_WIDTH = 32;
const GOAL_FLAG_HEIGHT = 32;
const GOAL_FLAG_X = 1900;
const GOAL_FLAG_Y = 300;

// 槍に関する情報を設定
const SPEAR_WIDTH = 16;
const SPEAR_HEIGHT = 32;
const SPEAR_SPEED_Y = -12;
const SPEAR_SPEED_X_BASE = 3;
const SPEAR_INTERVAL = 800

// 追従敵に関する情報を設定
const CHASE_ENEMY_WIDTH = 32;
const CHASE_ENEMY_HEIGHT = 32;
const CHASE_ENEMY_SPEED_X = 1.5; // ゆっくりのスピード
const CHASE_ENEMY_AXE_INTERVAL = 3000; // 3秒おきに斧を投げる

// HTMLの要素を取得
const canvas = document.getElementById("maincanvas");
const ctx = canvas.getContext("2d");

// 音声データ読み込み
const bgm = new Audio("../sounds/bgm.mp3");
const crushSound = new Audio("../sounds/se-crush.mp3");
const gameOverSound = new Audio("../sounds/se-gameover.mp3");
const jumpSound = new Audio("../sounds/se-jump.mp3");

// ** Block クラス **
// 地面となるブロックに関するコードをまとめたブロック
class Block {
    // 固有のブロックの設定
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.image = new Image();
        this.image.src = "../images/ground.png";
    }

    // ブロックを画面表示するメソッド
    draw() {
        ctx.drawImage(
            this.image,
            this.x - offsetX + DISTANCETOGROUND,
            this.y,
            this.width,
            this.height
        );
    }
}
class Crystal {
    // 固有のブロックの設定
    constructor() {
        this.x = CRYSTAL_X;
        this.y = CRYSTAL_Y;
        this.width = CRYSTAL_WIDTH;
        this.height = CRYSTAL_HEIGHT;
        this.image = new Image();
        this.image.src = "../images/koseki_red.png";
        this.get = false;
    }

    // ブロックを画面表示するメソッド
    draw() {
        if(this.get === false){
            ctx.drawImage(
                this.image,
                this.x - offsetX + DISTANCETOGROUND,
                this.y,
                this.width,
                this.height
            );
        }
    }
}

// ** Player クラス **
// プレイヤーに関するコードをまとめたブロック
class Player {
    // 固有のプレイヤーの設定
    constructor() {
        this.x = 0;
        this.y = 300;
        this.speedY = 0;
        this.isJumping = false;
        this.image = new Image();
        this.image.src = "../images/character_default.png";
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.lastDirection = 1; // 最後の移動方向（1:右, -1:左）
    }

    // プレイヤーの情報を更新するメソッド
    update() {
        const updatedX = this.x + PLAYER_SPEED_X;
        const updatedY = this.y + this.speedY;

        // ここに右キーを押したら右に、左キーを押したら左に移動するコードを記述
        if (keys["ArrowRight"]) {
            this.x += PLAYER_SPEED_X;
            this.lastDirection = 1; // 右方向に更新
        } else if (keys["ArrowLeft"]) {
            this.x -= PLAYER_SPEED_X;
            this.lastDirection = -1; // 左方向に更新
        }

        offsetX = this.x

        const ceilingY = getCeilingY(blocks, this, updatedX, updatedY);
        if (ceilingY) {
            this.speedY = 0;
            this.y = ceilingY;
        }

        const groundY = getGroundY(
            this.x,
            this.y,
            this.width,
            this.height,
            updatedY
        );
        if (!groundY) {
            this.y += this.speedY;
            this.speedY += GRAVITY;
        } else {
            this.y = groundY - PLAYER_HEIGHT;
            this.isJumping = false;
        }

        // ＊＊＊＊＊ここに上キーもしくはスペースキーを押したらジャンプするコードを記述＊＊＊＊＊
        if ((keys[" "] || keys["ArrowUp"]) && !player.isJumping) {
            jumpSound.play();
            this.isJumping = true;
            this.speedY = PLAYER_SPEED_Y;
        }

        // クリスタル取得後のみ斧を投げられる
        if ((keys["f"] || keys["F"]) && crystal.get === true) {
            axes.push(new Axe(player.x, player.y, this.lastDirection));
            keys["f"] = false; // 1回だけ発火するように
            keys["F"] = false;
        }

    }
    
    // プレイヤーを画面表示するメソッド
    draw() {
        ctx.drawImage(this.image, DISTANCETOGROUND, this.y, PLAYER_WIDTH, PLAYER_HEIGHT);
    }
}

// =============== 斧クラス ===============
class Axe {
    constructor(playerX, playerY, direction) {
        this.x = playerX + (direction === 1 ? 32 : 0);
        this.y = playerY + 16;
        this.speedX = AXE_SPEED_X * direction; // direction: 1 or -1
        this.speedY = 0;
        this.direction = direction;
        this.image = new Image();
        this.image.src = "../images/ono.png";
        this.width = AXE_WIDTH;
        this.height = AXE_HEIGHT;
        this.createdTime = Date.now();
        this.rotation = 0;
    }

    update() {
        const elapsedTime = Date.now() - this.createdTime;
        
        this.x += this.speedX;
        // 2秒以内は直線飛行
        if (elapsedTime > AXE_DURATION) {
            // 2秒後は重力で下降
            this.y += this.speedY;
            this.speedY += GRAVITY;
        } 
        
        // 回転アニメーション
        this.rotation += 0.3;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - offsetX + DISTANCETOGROUND + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.drawImage(
            this.image,
            -this.width / 2,
            -this.height / 2,
            this.width,
            this.height
        );
        ctx.restore();
    }

    isActive() {
        // 画面外に出たら削除
        return this.x - offsetX + DISTANCETOGROUND > -50 && this.x - offsetX + DISTANCETOGROUND < DISPLAY_WIDTH + 50 && this.y < DISPLAY_HEIGHT + 50;
    }
}



// =============== ジャンプ敵クラス ===============
class JumpingEnemy {
    constructor(x) {
        this.x = x;
        this.y = 0;
        this.speedY = 0;
        this.isJumping = true;
        this.image = new Image();
        this.image.src = "../images/enemy_gobrin.png";
        this.width = JUMPING_ENEMY_WIDTH;
        this.height = JUMPING_ENEMY_HEIGHT;
        this.lastJumpTime = Date.now();
        this.lastSpearTime = Date.now();
    }
    
    update() {
        const updatedY = this.y + this.speedY;
        
        // 地面との衝突判定
        const blockY = getGroundY(
            this.x,
            this.y,
            this.width,
            this.height,
            updatedY
        );
        
        if (!blockY) {
            this.y += this.speedY;
            this.speedY += GRAVITY;
            
            // ジャンプ中に槍を投げる
            const currentTime = Date.now();
            if (currentTime - this.lastSpearTime > SPEAR_INTERVAL) { // 0.8秒ごとに投げる
                spears.push(this.throwSpear());
                this.lastSpearTime = currentTime;
            }

        } else {
            this.y = blockY - JUMPING_ENEMY_HEIGHT;
            this.isJumping = false;
            
            // 定期的にジャンプ
            const currentTime = Date.now();
            if (currentTime - this.lastJumpTime > JUMPING_ENEMY_JUMP_INTERVAL) {
                this.speedY = JUMPING_ENEMY_SPEED_Y;
                this.isJumping = true;
                this.lastJumpTime = currentTime;
            }
        }
    }

    draw() {
        ctx.drawImage(
            this.image,
            this.x - offsetX + DISTANCETOGROUND,
            this.y,
            JUMPING_ENEMY_WIDTH,
            JUMPING_ENEMY_HEIGHT
        );
    }

    throwSpear() {
        // プレイヤーの位置に向かって槍を投げる
        return new Spear(this.x, this.y, player.x, player.y);
    }
}

// =============== 槍クラス ===============
class Spear {
    constructor(enemyX, enemyY, targetX, targetY) {
        this.x = enemyX + SPEAR_WIDTH;
        this.y = enemyY;
        this.targetX = targetX;
        this.targetY = targetY;
        
        // ターゲットまでの距離を計算
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // x方向の速度を計算（プレイヤーが敵より右か左かで判定）
        this.speedX = (dx > 0) ? SPEAR_SPEED_X_BASE : -SPEAR_SPEED_X_BASE;
        this.speedY = SPEAR_SPEED_Y; // 上に投げられる
        
        this.image = new Image();
        this.image.src = "../images/yari.png";
        this.width = SPEAR_WIDTH;
        this.height = SPEAR_HEIGHT;
        this.rotation = Math.atan2(dy, dx);
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.speedY += GRAVITY; // 重力で加速
        
        // 速度方向に回転角度を更新
        this.rotation = Math.atan2(this.speedY, this.speedX);
    }

    draw() {
        ctx.save();
        ctx.translate(this.x - offsetX + DISTANCETOGROUND, this.y);
        ctx.rotate(this.rotation);
        ctx.drawImage(
            this.image,
            0,
            -this.height / 2,
            this.width,
            this.height
        );
        ctx.restore();
    }

    isActive() {
        return this.x - offsetX + DISTANCETOGROUND > -50 && this.x - offsetX + DISTANCETOGROUND < DISPLAY_WIDTH + 50 && this.y < DISPLAY_HEIGHT + 50;
    }
}

// =============== 追従敵クラス（プレイヤーに近づいて斧を投げる） ===============
class ChaseEnemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speedY = 0;
        this.image = new Image();
        this.image.src = "../images/white_ghost.png";
        this.width = CHASE_ENEMY_WIDTH;
        this.height = CHASE_ENEMY_HEIGHT;
        this.lastAxeTime = Date.now();
    }

    update() {
        // プレイヤーに向かってx方向に移動
        if (this.x > player.x) {
            this.x -= CHASE_ENEMY_SPEED_X; // 左へ移動
        } else if (this.x < player.x) {
            this.x += CHASE_ENEMY_SPEED_X; // 右へ移動
        }

        // y軸はプレイヤーと全く同じ動きをする
        this.speedY = player.speedY;
        this.y = player.y;

        // 3秒おきに斧を投げる
        const currentTime = Date.now();
        if (currentTime - this.lastAxeTime > CHASE_ENEMY_AXE_INTERVAL) {
            const direction = this.x > player.x ? -1 : 1; // プレイヤーに向かう方向
            chaseEnemyAxes.push(new Axe(this.x, this.y, direction));
            this.lastAxeTime = currentTime;
        }
    }

    draw() {
        ctx.drawImage(
            this.image,
            this.x - offsetX + DISTANCETOGROUND,
            this.y,
            CHASE_ENEMY_WIDTH,
            CHASE_ENEMY_HEIGHT
        );
    }
}

// =============== ゴールフラッグクラス ===============
class GoalFlag {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = GOAL_FLAG_WIDTH;
        this.height = GOAL_FLAG_HEIGHT;
        this.image = new Image();
        this.image.src = "../images/goal_flag.png";
        this.collected = false;
    }

    draw() {
        if (!this.collected) {
            ctx.drawImage(
                this.image,
                this.x - offsetX + DISTANCETOGROUND,
                this.y,
                this.width,
                this.height
            );
        }
    }
}


// ** Enemy クラス **
// 敵に関するコードをまとめたブロック
class Enemy {
    // 固有の敵の設定
    constructor(x) {
        this.x = x;
        this.y = 0;
        this.speedY = 0;
        this.isJumping = true;
        this.image = new Image();
        this.image.src = "../images/enemy.png";
        this.width = ENEMY_WIDTH;
        this.height = ENEMY_HEIGHT;
    }
    
    // 敵の情報を更新するメソッド
    update() {
        const updatedY = this.y + this.speedY;

        this.x += ENEMY_SPEED_X;

        const blockY = getGroundY(
            this.x,
            this.y,
            this.width,
            this.height,
            updatedY
        );
        if (!blockY) {
            this.y += this.speedY;
            this.speedY += GRAVITY;
        } else {
            this.y = blockY - ENEMY_HEIGHT;
        }
    }

    // 敵を画面表示するメソッド
    draw() {
        ctx.drawImage(
            this.image,
            this.x - offsetX + DISTANCETOGROUND,
            this.y,
            ENEMY_WIDTH,
            ENEMY_HEIGHT
        );
    }
}

// プレイヤーが下方向の移動でブロックにめり込む場合、ブロックの上にとどまり続けるよう座標を返す関数
function getGroundY(x, y, width, height, updatedY) {
    let groundY = null;
    blocks.forEach((block) => {
        if (y + height <= block.y && updatedY + height >= block.y) {
            if (block.x <= x + width && x <= block.x + block.width) {
                groundY = block.y;
            }
        }
    });
    return groundY;
}

// プレイヤーが上方向の移動でブロックにめり込む場合、ブロックの下にとどまり、それ以上上にめり込まないようにする関数
function getCeilingY(blocks, player, updatedX, updatedY) {
    let ceilingY = null;
    blocks.forEach((block) => {
        if (
            block.x <= updatedX + player.width &&
            updatedX <= block.x + block.width
        ) {
            if (
                updatedY <= block.y + block.height &&
                player.y >= block.y + block.height
            ) {
                ceilingY = block.y + block.height;
            }
        }
    });
    return ceilingY;
}

// 落下して画面外に落ちたことを判定する関数
function isFallen(updatedY) {
    return updatedY + PLAYER_HEIGHT > DISPLAY_HEIGHT;
}

// プレイヤーと敵との衝突を判定する関数
function isCollide(player, enemy) {
    return (
        player.x + COLLISION_MARGIN_X <
            enemy.x + enemy.width - COLLISION_MARGIN_X &&
        player.x + player.width - COLLISION_MARGIN_X >
            enemy.x + COLLISION_MARGIN_X &&
        player.y + COLLISION_MARGIN_Y <
            enemy.y + enemy.height - COLLISION_MARGIN_Y &&
        player.y + player.height - COLLISION_MARGIN_Y >
            enemy.y + COLLISION_MARGIN_Y
    );
}

// 武器とターゲットの衝突
function isWeaponCollide(weapon, target) {
    return (
        weapon.x < target.x + target.width &&
        weapon.x + weapon.width > target.x &&
        weapon.y < target.y + target.height &&
        weapon.y + weapon.height > target.y
    );
}

function ResolveCollision(enemies,is_weapon=false){
    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];
        if(!is_weapon){
            if (isCollide(player, enemy)) {
                if (player.y + PLAYER_HEIGHT < enemy.y + ENEMY_HEIGHT) {
                    enemies.splice(i, 1);
                    crushSound.play();
                    i--;
                    return false;
                }
                return true;
            }
        }else{
            return isWeaponCollide(enemy,player)
        }
    }
}

// 落下や敵との衝突をもとにゲームオーバーかどうかを判定する関数
function isGameOver() {
    const updatedY = player.y + player.speedY;

    if (isFallen(updatedY)) return true;

    if(ResolveCollision(enemies) || 
    ResolveCollision(jumpingEnemies)||
    ResolveCollision(spears,is_weapon=true)||
    ResolveCollision(chaseEnemies)||
    ResolveCollision(chaseEnemyAxes,is_weapon=true)) return true;

    if (isCollide(player,crystal)){
        crystal.get = true
        player.image.src = "../images/character.png";
        ctx.clearRect(CRYSTAL_X,CRYSTAL_Y,CRYSTAL_WIDTH,CRYSTAL_HEIGHT)
        return false;
    }

    // ゴールフラッグとの衝突判定
    if (isWeaponCollide(player,goalFlag)) {
        goalFlag.collected = true;
        return "goal";
    }

    return false;
}

// BGMの再生を開始するための関数
function startBGM() {
    bgm.loop = true;
    bgm.volume = 0.5;
    bgm.play();
}

// BGMの再生を終了するための関数
function stopBGM() {
    bgm.pause();
    bgm.currentTime = 0;
}

// ゲーム開始画面を表示する関数
function drawStartScreen() {
    // 画面をクリア
    ctx.clearRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

    // ボタンの背景
    ctx.fillStyle = "#4CAF50";

    // ボタンのサイズ
    const buttonWidth = BUTTON_WIDTH;
    const buttonHeight = BUTTON_HEIGHT;
    const buttonX = (DISPLAY_WIDTH - buttonWidth) / 2;
    const buttonY = (DISPLAY_HEIGHT - buttonHeight) / 2;
    ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

    // ボタンのテキスト
    ctx.fillStyle = "white";
    ctx.font = "24px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
        "ゲーム開始",
        buttonX + buttonWidth / 2,
        buttonY + buttonHeight / 2
    );
}

// ゲームオーバー画面を表示する関数
function drawGameOverScreen() {
    ctx.clearRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

    // 背景を黒に
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

    // ゲームオーバーのテキストを赤色で
    ctx.fillStyle = "red";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ゲームオーバー", DISPLAY_WIDTH / 2, DISPLAY_HEIGHT / 2);

    // リスタートメッセージ
    ctx.font = "24px Arial";
    ctx.fillText(
        "クリックでリスタート",
        DISPLAY_WIDTH / 2,
        DISPLAY_HEIGHT / 2 + 50
    );
}

// ゴール画面を表示する関数
function drawGoalScreen() {
    ctx.clearRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

    // 背景をゴールドに
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);

    // ゴールのテキストをオレンジ色で
    ctx.fillStyle = "#FFA500";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("ゴール！", DISPLAY_WIDTH / 2, DISPLAY_HEIGHT / 2);

    // リスタートメッセージ
    ctx.font = "24px Arial";
    ctx.fillText(
        "クリックでリスタート",
        DISPLAY_WIDTH / 2,
        DISPLAY_HEIGHT / 2 + 50
    );
}

function attackCollision(weapons,index,enemies){
    for (let i = enemies.length - 1; i >= 0; i--) {
        console.log(weapons)
        console.log(weapons[index])
        if (isWeaponCollide(weapons[index], enemies[i])) {
            enemies.splice(i, 1);
            weapons.splice(index, 1);
            crushSound.play();
            return true;
        }
    }
    return false;
}

// プレイヤー、ブロック、敵の表示メソッドをまとめて実行する関数
function draw() {
    player.draw();
    blocks.forEach((block) => block.draw());
    enemies.forEach((enemy) => enemy.draw());
    crystal.draw();
    goalFlag.draw();

    // プレイヤー投げの斧
    axes.forEach((axe, index) => {
        if (axe.isActive()) {
            axe.draw();
        
            // 敵との衝突判定
            attackCollision(axes,index,enemies,)||
            attackCollision(axes,index,jumpingEnemies)||
            attackCollision(axes,index,chaseEnemies);
        } else {
            axes.splice(index, 1);
        }
    });

    // 追従敵が投げた斧
    chaseEnemyAxes.forEach((axe, index) => {
        axe.update();
        if (axe.isActive()) {
            axe.draw();
        } else {
            chaseEnemyAxes.splice(index, 1);
        }
    });

    // 槍の更新と描画
    spears.forEach((spear, index) => {
        if (spear.isActive()) {
            spear.draw();
        } else {
            spears.splice(index, 1);
        }
    });

    // ジャンプ敵の描画
    jumpingEnemies.forEach((enemy) => {enemy.draw();});
    
    // 追従敵の描画
    chaseEnemies.forEach((enemy) => {enemy.draw();});
}

// プレイヤー、敵の情報更新メソッドをまとめて実行する関数
function update() {
    player.update();
    enemies.forEach((enemy) => enemy.update());
    jumpingEnemies.forEach((enemy)=>{enemy.update()});
    chaseEnemies.forEach((enemy) => {enemy.update()});
    spears.forEach((spear)=>{spear.update()});
    axes.forEach((axe)=>{axe.update()});
}

// ゲーム全体の実行関数
function game() {
    const gameOverResult = isGameOver();
    if (gameOverResult === "goal") {
        stopBGM();
        screenStatus = "GOAL_SCREEN";
        drawGoalScreen();
        return;
    }
    if (gameOverResult) {
        stopBGM();
        gameOverSound.play();
        screenStatus = GAMEOVER_SCREEN;
        drawGameOverScreen();
        return;
    }
    ctx.clearRect(0, 0, DISPLAY_WIDTH, DISPLAY_HEIGHT);
    draw();
    update();

    requestAnimationFrame(game);
}

// ゲーム開始時に実行することをまとめた関数
function start() {
    document.addEventListener("keydown", function (e) {
        keys[e.key] = true;
    });
    document.addEventListener("keyup", function (e) {
        keys[e.key] = false;
    });
    startBGM();
    game();
}

// 音声を再生するにはUserからのなんらかの操作がトリガーになる必要があるため、
// canvasをクリックしてから開始するように変更
// Chrome自動再生ポリシー（https://developer.chrome.com/blog/autoplay?hl=en）
canvas.addEventListener("click", () => {
    switch (screenStatus) {
        case START_SCREEN:
            screenStatus = GAME_SCREEN;
            start();
            break;
        case GAME_SCREEN:
            break;
        case GAMEOVER_SCREEN:
            screenStatus = START_SCREEN;
            window.location.reload();
            break;
        case "GOAL_SCREEN":
            screenStatus = START_SCREEN;
            window.location.reload();
            break;
    }
});

const axes = []; // 飛んでいる斧を管理
const spears = []; // 飛んでいる槍を管理
const chaseEnemyAxes = []; // 追従敵が投げた斧を管理
const jumpingEnemies = [
    new JumpingEnemy(150),
    new JumpingEnemy(1000),
    new JumpingEnemy(1200),
    new JumpingEnemy(1400),
]; // ジャンプ敵を管理

// ステージ上のブロックを設定するリスト
const blocks = [
    new Block(0, 332, 2000, BLOCK_HEIGHT),
    new Block(250, 232, 250, BLOCK_HEIGHT),
    new Block(500, 132, 530, BLOCK_HEIGHT),
];

const crystal = new Crystal()
const goalFlag = new GoalFlag(GOAL_FLAG_X, GOAL_FLAG_Y);

// 追従敵を配置
const chaseEnemies = [
    new ChaseEnemy(1300, 300),
];

// 実行
let screenStatus = START_SCREEN;
let offsetX = 0;
const player = new Player();
const enemies = ENEMY_POSITIONS.map((x) => new Enemy(x));

const keys = [];

drawStartScreen();
