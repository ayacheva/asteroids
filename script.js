// Basic contstants and state
const BASE_URL = `https://stardust-be.herokuapp.com/asteroids?size=`;

const GAME = {
    id: 'game',
    size: 900,
    startScreen: 'start',
    endScreen: 'gameOver',
    pause: 'pause',
    new: 'new',
    score: 'score',
    hits: 'hits'
}

const SHIP = {
    size: 30,
    id: 'ship',
}

const asteroids = {
    items: [],
    in_game: [],
    asteroidsFrame: null,
}

const gameState = {
    started: false,
    running: false,
    paused: false,
    over: false,
    playtime: 0,
    score: 0,
    hits: 0,
    keysPressed: [],
    fieldFrame: null,
}

// base setup
function renderStartScreen() {
    let startScreen = `<div id="${GAME.startScreen}">
        Start Game
    </div>`;
    return startScreen;
}
function renderBaseField() {
    let game_field = `
        <div class="stars"></div>
        <div class="stars"></div>
        <div class="stars"></div>
    `;
    return game_field;
}
function renderShip() {
    let ship = `<div id="${SHIP.id}" data-id="ship" style="top:${GAME.size / 2 - SHIP.size / 2}px;left:${GAME.size / 2 - SHIP.size / 2}px;width:${SHIP.size}px;height:${SHIP.size}px;"></div>`;
    return ship;
}
function renderEndScreen() {
    let endScreen = `<div id="${GAME.endScreen}">
        <div>
        GAME OVER <br>
        Your score: ${gameState.score} <br>
        <div id="playAgain">Play again</div>
        </div>
    </div>`;
    return endScreen;
}
function handleError() {
    gameState.started = false;
    gameState.running = false;
}
function renderErrorScreen() {
    handleError();
    let errorScreen = `<div id="overlayError">
        An error occured.<br>
        Please come back later.
    </div>`;
    return errorScreen;
}
function renderPersonalBest() {
    if (localStorage.getItem('asteroids_best_score') !== null) {
        let score_best = `
            <div class="score-best">
                Your Personal Best: ${localStorage.getItem('asteroids_best_score')}
            </div>
        `;
        return score_best;
    }
    return;
}
function renderButton(id, icon) {
    let button = `
        <button id="${id}" type="button"><i class="fa-solid fa-${icon}"></i></button>
    `;
    return button;
}

function renderScoreDetails() {
    let score_details = `
        <div id="score-details">
            <div>Score: <span id="${GAME.score}">0</span></div>
            <div>Hits: <span id="${GAME.hits}">0</span></div>
        </div>
    `;
    return score_details;
}

function renderAsteroid(el) {
    let asteroid = `<div data-id="asteroid" id="${el.id}" style="background-image:url(${randomizeBg()});width:${el.r * 2}px;height:${el.r * 2}px;top:${parseInt(el.y)}px;left:${parseInt(el.x)}px; transform:rotate(${randomizeRotate()}deg)"></div>`;
    return asteroid;
}

function renderAsteroids(items) {
    document.getElementById(GAME.id).insertAdjacentHTML("beforeend", items.map((x, i) => renderAsteroid(x, i)).join(""));
}

function renderGameControls() {
    document.getElementById(GAME.id).innerHTML = renderBaseField();
    document.getElementById(GAME.id).insertAdjacentHTML("beforeend", [renderShip(), renderButton(GAME.pause, 'pause'), renderButton(GAME.new, 'gamepad'), renderScoreDetails(), renderPersonalBest()].join(""));
}

// fetch data
function getMainUrl(count) {
    if (count) {
        return `${BASE_URL}${count}`;
    } else {
        return `${BASE_URL}20`;
    }
}

function setAsteroidsArray(promiseData) {
    promiseData.forEach((el, id) => {
        el.id = 'id_' + id + Date.now();
    });
    asteroids.items = [...asteroids.items, ...promiseData];
}

function getData(url) {
    return fetch(url)
        .then(x => x.json())
        .then(x => {
            setAsteroidsArray(x); return x;
        })
        .then(renderAsteroids)
        .catch(e => {
            document.getElementById(GAME.id).insertAdjacentHTML("beforeend", renderErrorScreen())
        })
}

// base controls 
const clickMapping = {
    'start': startGame,
    'new': startGame,
    'playAgain': startGame,
    'pause': pauseGame
};

function startGame() {
    if (gameState.started) {
        endGame();
    }

    // starting screen and styles
    renderGameControls();

    asteroids.items = [];
    // animation state back to start
    animationState.stateX = GAME.size / 2 - SHIP.size / 2;
    animationState.stateY = GAME.size / 2 - SHIP.size / 2;
    animationState.direction = [0, 0];
    animationState.moveTo = 'top';

    gameState.playtime = 0;
    gameState.hits = 0;
    gameState.score = 0;
    gameState.started = true;

    getData(getMainUrl());
    asteroids.asteroidsFrame = requestAnimationFrame((time) => {
        moveAsteroids(time, time)
    });
}

function pauseGame() {
    if (gameState.started) {
        if (gameState.running) {
            document.getElementById(GAME.pause).innerHTML = '<i class="fa-solid fa-play"></i>';
            cancelAnimationFrame(asteroids.asteroidsFrame);
            cancelAnimationFrame(gameState.fieldFrame);
            gameState.running = false;
            gameState.paused = true;

        } else {
            document.getElementById(GAME.pause).innerHTML = '<i class="fa-solid fa-pause"></i>';

            gameState.running = true;
            gameState.paused = false;

            asteroids.in_game.forEach(item => {
                item.x = document.getElementById(item.id).offsetLeft;
                item.y = document.getElementById(item.id).offsetTop;
            })

            gameState.fieldFrame = requestAnimationFrame(() => {
                animate(animationState, SHIP.id)
            })
            asteroids.asteroidsFrame = requestAnimationFrame((time) => {
                moveAsteroids(time, time)
            })
        }
    }
}

function endGame() {
    gameState.started = false;
    gameState.running = false;
    gameState.over = true;

    cancelAnimationFrame(asteroids.asteroidsFrame);
    cancelAnimationFrame(gameState.fieldFrame);

    saveGameData();

    document.getElementById(GAME.id).insertAdjacentHTML("beforeend", renderEndScreen());

    document.getElementById(GAME.pause).remove();
    document.getElementById(GAME.new).remove();
}

function saveGameData() {
    clearLocalStorage();

    let today = new Date();
    let localStorageLabel = `asteroids_best_score`;
    let localStorageLabel2 = `asteroids_${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}`;

    if (localStorage.getItem(localStorageLabel) === null || +localStorage.getItem('asteroids_best_score') < gameState.score) {
        localStorage.setItem('asteroids_best_score', gameState.score);
    }

    if (localStorage.getItem(localStorageLabel2) === null || +JSON.parse(localStorage.getItem(localStorageLabel2)).value < gameState.score) {
        localStorage.setItem(localStorageLabel2, JSON.stringify({ value: gameState.score, date: today }));
    }
}

function clearLocalStorage() {
    let today = new Date();
    for (const item in localStorage) {
        if (JSON.parse(localStorage.getItem(item))?.value) {
            let date = JSON.parse(localStorage.getItem(item)).date;
            date = new Date();
            if (date.toDateString() < today.toDateString()) {
                localStorage.removeItem(localStorage.getItem(item));
            }
        }
    }
}

// field and ship animate

const animationState = {
    stateX: GAME.size / 2 - SHIP.size / 2,
    stateY: GAME.size / 2 - SHIP.size / 2,
    direction: [0, 0],
    moveTo: 'top',
    speed: 2,
    stopped: 0
}

const stateDirectionMapping = {
    'top': handleTop,
    'bottom': handleBottom,
    'right': handleRight,
    'left': handleLeft,
    'top-left': handleTopLeft,
    'top-right': handleTopRight,
    'bottom-left': handleBottomLeft,
    'bottom-right': handleBottomRight
}

function handleTop(ship, state) {
    ship.style.transform = 'rotate(0)';
    if (state.stateY <= 0) {
        state.stateY = GAME.size;
    };
}

function handleBottom(ship, state) {
    ship.style.transform = 'rotate(180deg)';
    if (state.stateY >= GAME.size) {
        state.stateY = 0;
    }
}

function handleRight(ship, state) {
    ship.style.transform = 'rotate(90deg)';
    if (state.stateX >= GAME.size) {
        state.stateX = 0;
    }
}

function handleLeft(ship, state) {
    ship.style.transform = 'rotate(-90deg)';
    if (state.stateX <= 0) {
        state.stateX = GAME.size;
    }
}

function handleTopLeft(ship, state) {
    ship.style.transform = 'rotate(-45deg)';
    if (state.stateX <= 0) {
        state.stateX = GAME.size - Math.abs(state.stateY);
        state.stateY = GAME.size;
    } else if (state.stateY <= 0) {
        state.stateY = GAME.size - Math.abs(state.stateX);
        state.stateX = GAME.size;
    }
}

function handleTopRight(ship, state) {
    ship.style.transform = 'rotate(45deg)';
    if (state.stateX >= GAME.size) {
        state.stateX = Math.abs(state.stateY);
        state.stateY = GAME.size;
    } else if (state.stateY <= 0) {
        state.stateY = Math.abs(state.stateX);
        state.stateX = 0;
    }
}

function handleBottomLeft(ship, state) {
    ship.style.transform = 'rotate(-135deg)';
    if (state.stateX <= 0) {
        state.stateX = Math.abs(state.stateY);
        state.stateY = 0;
    } else if (state.stateY >= GAME.size) {
        state.stateY = GAME.size;
        state.stateX = GAME.size - Math.abs(state.stateY);
    }
}

function handleBottomRight(ship, state) {
    ship.style.transform = 'rotate(135deg)';
    if (state.stateX >= GAME.size) {
        state.stateX = GAME.size - Math.abs(state.stateY);
        state.stateY = 0;
    } else if (state.stateY >= GAME.size) {
        state.stateY = GAME.size - Math.abs(state.stateX);
        state.stateX = 0;
    }
}

function checkStateAndChangeField(animationState, ship) {
    let shipDom = document.getElementById(ship);

    if (typeof stateDirectionMapping[animationState.moveTo] === "function") {
        stateDirectionMapping[animationState.moveTo](shipDom, animationState);
    }
}

function direction(stateX, stateY) {
    return {
        x: stateX - GAME.size / 2,
        y: stateY - GAME.size / 2
    }
}

function animate(animationState, ship) {
    cancelAnimationFrame(gameState.fieldFrame)

    const [stars1, stars2, stars3] = document.querySelectorAll(".stars");
    const d = direction(animationState.stateX, animationState.stateY)

    document.getElementById(ship).style.left = `${animationState.stateX}px`;
    document.getElementById(ship).style.top = `${animationState.stateY}px`;

    stars1.style.backgroundPositionX = `${d.x * -0.5}px`;
    stars1.style.backgroundPositionY = `${d.y * -0.5}px`;

    stars2.style.backgroundPositionX = `${d.x * -1}px`;
    stars2.style.backgroundPositionY = `${d.y * -1}px`;

    stars3.style.backgroundPositionX = `${d.x * -1.5}px`;
    stars3.style.backgroundPositionY = `${d.y * -1.5}px`;

    animationState.stateX += animationState.direction[0]
    animationState.stateY += animationState.direction[1]

    checkStateAndChangeField(animationState, ship);

    gameState.fieldFrame = requestAnimationFrame(() => {
        animate(animationState, SHIP.id)
    });
}

const totalTime = 1000;
function tween(from, to) {
    const delta = to - from;
    return function (t) {
        return from + t * delta;
    }
}

function removeAsteroid(item) {
    asteroids.items = asteroids.items.filter(x => x.id !== item.id);
    document.getElementById(item.id).remove();

    if (asteroids.in_game.length < 20) {
        getData(getMainUrl(50));
    }
}

function checkOverlapping(ship, item) {
    const SHIP = document.getElementById(ship);
    const asteroid = document.getElementById(item.id);

    if (isOverlapping(SHIP, asteroid)) {
        fadeShip(SHIP);
        countHits(gameState);
        removeAsteroid(item);
    }
}

function checkOutOfField(x, y, item) {
    if (x < -100 || x > 1000 || y < -100 || y > 1000) {
        removeAsteroid(item);
    }
}

function updatePath(x, y, item) {
    item.x = x + item.v[0];
    item.y = y + item.v[1];
}

function renderMove(item, left, top) {
    document.getElementById(item.id).style.left = `${left}px`
    document.getElementById(item.id).style.top = `${top}px`
}

function moveAsteroids(start, timestamp) {
    cancelAnimationFrame(asteroids.asteroidsFrame)
    let elapsed = timestamp - start;
    let delta = elapsed / totalTime;

    if (elapsed > totalTime) {
        delta = 1;
        countScore(gameState);
        asteroids.asteroidsFrame = requestAnimationFrame((time) => {
            moveAsteroids(time, time)
        })
    } else {
        asteroids.asteroidsFrame = requestAnimationFrame((time) => {
            moveAsteroids(start, time)
        })
    }
    asteroids.in_game = asteroids.items.slice(0, 20);
    asteroids.in_game.forEach((a, i) => {
        let twx, twy;
        let left = a.x;
        let top = a.y;

        if (delta < 1) {
            twx = tween(left, left + a.v[0]);
            twy = tween(top, top + a.v[1]);
            left = twx(delta);
            top = twy(delta);

            renderMove(a, left, top);
            checkOverlapping('ship', a);
            checkOutOfField(left, top, a);
        }

        if (delta === 1) {
            updatePath(left, top, a);
        }
    })
}

// helpers
function fadeShip(ship) {
    let shipDom = document.getElementById(ship.id);
    shipDom.classList.add('fade');
    setTimeout(() => {
        shipDom.classList.remove('fade');
    }, 1000)
}

function isOverlapping(obj1, obj2) {
    let obj1Rect = obj1.getBoundingClientRect();
    let obj2Rect = obj2.getBoundingClientRect();

    return !(obj1Rect.right < obj2Rect.left + 10 ||
        obj1Rect.left + 10 > obj2Rect.right ||
        obj1Rect.bottom < obj2Rect.top + 10 ||
        obj1Rect.top + 10 > obj2Rect.bottom);
}

function getRandomNum(min, max) {
    return Math.random() * (max - min) + min;
}

function randomizeRotate() {
    let random = getRandomNum(0, 360);
    return random;
}

function randomizeBg() {
    let randomGen = Math.random();

    let randomBg = '';
    if (randomGen < 0.5) {
        randomBg = '/assets/asteroid.png';
    } else {
        randomBg = '/assets/asteroid-2.png';
    }
    return randomBg;
}

// scoring

function countScore(gameState) {
    let state = gameState;
    state.playtime++; state.score++;
    document.getElementById(GAME.score).innerText = state.score;
    return state;
}

function countHits(gameState) {
    let state = gameState;
    state.hits += 1;
    document.getElementById(GAME.hits).innerText = state.hits;
    state.score = parseInt(state.playtime / (state.hits + 1));
    document.getElementById(GAME.score).innerText = parseInt(state.score);

    // game over
    if (state.hits >= 10) {
        endGame();
    }

    return state;
}


const keyMapping = {
    'ArrowDown': moveDown,
    'ArrowUp': moveUp,
    'ArrowLeft': moveLeft,
    'ArrowRight': moveRight,
    'Space': startMoving
}

function moveDown(animationState, gameState) {
    animationState.direction[1] = animationState.speed;
    animationState.direction[0] = animationState.stopped;
    animationState.moveTo = 'bottom';

    if (gameState.keysPressed[gameState.keysPressed.length - 2] === 'ArrowLeft') {
        animationState.direction[1] = animationState.speed
        animationState.direction[0] = -animationState.speed
        animationState.moveTo = 'bottom-left';
        gameState.keysPressed = [];
    }
    if (gameState.keysPressed[gameState.keysPressed.length - 2] === 'ArrowRight') {
        animationState.direction[1] = animationState.speed
        animationState.direction[0] = animationState.speed
        animationState.moveTo = 'bottom-right';
        gameState.keysPressed = [];
    }
}

function moveUp(animationState, gameState) {
    animationState.direction[1] = -animationState.speed
    animationState.direction[0] = animationState.stopped
    animationState.moveTo = 'top';

    if (gameState.keysPressed[gameState.keysPressed.length - 2] === 'ArrowLeft') {
        animationState.direction[1] = -animationState.speed
        animationState.direction[0] = -animationState.speed
        animationState.moveTo = 'top-left';
        gameState.keysPressed = [];
    }
    if (gameState.keysPressed[gameState.keysPressed.length - 2] === 'ArrowRight') {
        animationState.direction[1] = -animationState.speed
        animationState.direction[0] = animationState.speed
        animationState.moveTo = 'top-right';
        gameState.keysPressed = [];
    }
}

function moveLeft(animationState, gameState) {
    animationState.direction[1] = animationState.stopped
    animationState.direction[0] = -animationState.speed
    animationState.moveTo = 'left';

    if (gameState.keysPressed[gameState.keysPressed.length - 2] === 'ArrowDown') {
        animationState.direction[1] = animationState.speed
        animationState.direction[0] = -animationState.speed
        animationState.moveTo = 'bottom-left';
        gameState.keysPressed = [];
    }
    if (gameState.keysPressed[gameState.keysPressed.length - 2] === 'ArrowUp') {
        animationState.direction[1] = -animationState.speed
        animationState.direction[0] = -animationState.speed
        animationState.moveTo = 'top-left';
        gameState.keysPressed = [];
    }
}

function moveRight(animationState, gameState) {
    animationState.direction[1] = animationState.stopped
    animationState.direction[0] = animationState.speed
    animationState.moveTo = 'right'

    if (gameState.keysPressed[gameState.keysPressed.length - 2] === 'ArrowDown') {
        animationState.direction[1] = animationState.speed
        animationState.direction[0] = animationState.speed
        animationState.moveTo = 'bottom-right';
        gameState.keysPressed = [];
    }
    if (gameState.keysPressed[gameState.keysPressed.length - 2] === 'ArrowUp') {
        animationState.direction[1] = -animationState.speed
        animationState.direction[0] = animationState.speed
        animationState.moveTo = 'top-right';
        gameState.keysPressed = [];
    }
}

function startMoving(animationState, gameState) {
    if (gameState.started && !gameState.paused) {
        if (gameState.running) {
            gameState.running = false
            cancelAnimationFrame(gameState.fieldFrame)
        } else {
            gameState.running = true
            if (animationState.moveTo === 'top') {
                animationState.direction[1] = -animationState.speed
                animationState.direction[0] = animationState.stopped
            }
            gameState.fieldFrame = requestAnimationFrame(() => {
                animate(animationState, SHIP.id)
            })
        }
    }
}


function keyHandlers(gameState, animationState, { code }) {
    gameState.keysPressed.push(code);

    if (typeof keyMapping[code] === "function") {
        keyMapping[code](animationState, gameState);
    }
}
function clickHandlers(e) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof clickMapping[e.target.id] === "function") {
        clickMapping[e.target.id]();
        e.target.blur();
    }
}

function main() {

    const target = document.getElementById(GAME.id);

    target.insertAdjacentHTML("beforeend", [renderBaseField(), renderStartScreen()].join(""));
    target.addEventListener('click', clickHandlers);

    document.addEventListener("keyup", keyHandlers.bind(this, gameState, animationState));
}

window.addEventListener('load', main);