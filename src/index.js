//  画面状態の管理
const START_SCREEN = 0;
const GAME_SCREEN = 1;
const GAMEOVER_SCREEN = 2;

// 画面の大きさを設定
const DISPLAY_HEIGHT = 480;
const DISPLAY_WIDTH = 640;

// プレイヤーに関する情報を設定
const PLAYER_WIDTH = 32;
const PLAYER_HEIGHT = 32;
const PLAYER_SPEED_X = 5;
const PLAYER_SPEED_Y = -12;

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
const ENEMY_POSITIONS = [800, 950, 1000, 1200, 1300, 1400, 1500];

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
            this.x - offsetX + 320,
            this.y,
            this.width,
            this.height
        );
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
        this.image.src = "../images/character.png";
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
    }

    // プレイヤーの情報を更新するメソッド
    update() {
        const updatedX = this.x + PLAYER_SPEED_X;
        const updatedY = this.y + this.speedY;
        if (keys["ArrowRight"]) {
            this.x += PLAYER_SPEED_X;
            offsetX += PLAYER_SPEED_X;
        } else if (keys["ArrowLeft"]) {
            this.x -= PLAYER_SPEED_X;
            offsetX -= PLAYER_SPEED_X;
        }

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

        if ((keys[" "] || keys["ArrowUp"]) && !player.isJumping) {
            jumpSound.play();
            this.isJumping = true;
            this.speedY = PLAYER_SPEED_Y;
        }
    }
    
    // プレイヤーを画面表示するメソッド
    draw() {
        ctx.drawImage(this.image, 320, this.y, PLAYER_WIDTH, PLAYER_HEIGHT);
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
            this.x - offsetX + 320,
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
            enemy.x + ENEMY_WIDTH - COLLISION_MARGIN_X &&
        player.x + PLAYER_WIDTH - COLLISION_MARGIN_X >
            enemy.x + COLLISION_MARGIN_X &&
        player.y + COLLISION_MARGIN_Y <
            enemy.y + ENEMY_HEIGHT - COLLISION_MARGIN_Y &&
        player.y + PLAYER_HEIGHT - COLLISION_MARGIN_Y >
            enemy.y + COLLISION_MARGIN_Y
    );
}

// 落下や敵との衝突をもとにゲームオーバーかどうかを判定する関数
function isGameOver() {
    const updatedY = player.y + player.speedY;

    if (isFallen(updatedY)) {
        return true;
    }

    for (let i = 0; i < enemies.length; i++) {
        const enemy = enemies[i];

        if (isCollide(player, enemy)) {
            if (player.y + PLAYER_HEIGHT < enemy.y + ENEMY_HEIGHT) {
                enemies.splice(i, 1);
                crushSound.play();
                i--;
                return false;
            }
            return true;
        }
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

// プレイヤー、ブロック、敵の表示メソッドをまとめて実行する関数
function draw() {
    player.draw();
    blocks.forEach((block) => block.draw());
    enemies.forEach((enemy) => enemy.draw());
}

// プレイヤー、敵の情報更新メソッドをまとめて実行する関数
function update() {
    player.update();
    enemies.forEach((enemy) => enemy.update());
}

// ゲーム全体の実行関数
function game() {
    if (isGameOver()) {
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
    }
});

// ステージ上のブロックを設定するリスト
const blocks = [
    new Block(0, 332, 2000, BLOCK_HEIGHT),
    new Block(250, 232, 250, BLOCK_HEIGHT),
    new Block(500, 132, 530, BLOCK_HEIGHT),
];

// 実行
let screenStatus = START_SCREEN;
let offsetX = 0;
const player = new Player();
const enemies = ENEMY_POSITIONS.map((x) => new Enemy(x));
const keys = [];

drawStartScreen();
