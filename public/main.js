document.addEventListener("DOMContentLoaded", () => {
    let progress = 0;
    const loadingBar = document.getElementById("loading-bar-fill");
    const loadingPercentage = document.getElementById("loading-percentage");
    const loadingScreen = document.getElementById("loading-screen");

    // Artificial progression to keep the screen looking active
    const loadingInterval = setInterval(() => {
        // Cap the fake load at 90% so it waits for the real assets
        if (progress < 90) {
            progress += Math.floor(Math.random() * 5) + 1;
            if (progress > 90) progress = 90;
            updateLoader(progress);
        }
    }, 150);

    function updateLoader(value) {
        if (loadingBar) loadingBar.style.width = value + "%";
        if (loadingPercentage) loadingPercentage.innerText = value + "%";
    }

    // The browser fires this ONLY when all images/assets are 100% downloaded
    window.addEventListener("load", () => {
        clearInterval(loadingInterval);

        // Snap to 100%
        updateLoader(100);
        document.getElementById("loading-status").innerText = "SYSTEMS ONLINE";
        document.getElementById("loading-status").style.color = "#1cf843";

        // Wait half a second so the user registers the 100%, then fade out
        setTimeout(() => {
            loadingScreen.classList.add("fade-out-loader");
        }, 500);
    });
});

// 🔥 UI ANIMATION ENGINE (Makes the menu characters walk!)
let menuFrame = 0;
setInterval(() => {
    menuFrame = (menuFrame + 1) % 4; // Cycles 0, 1, 2, 3
    const mImg = document.getElementById('preview-male');
    const fImg = document.getElementById('preview-female');
    if (mImg && fImg) {
        mImg.src = `humanoid/male/animations/walking/south-east/frame_00${menuFrame}.png`;
        fImg.src = `humanoid/female/animations/walking/south-east/frame_00${menuFrame}.png`;
    }
}, 150); // 150ms per frame

// 🔥 UPDATED MULTIPLAYER SPAWNER (WITH HTML NAME TAGS)
function spawnMultiplayerWorker(gridX, gridY, isGhost, characterId = 'male_char', playerName = 'Unknown') {
    const item = BUILD_CATALOG.find(i => i.id === characterId);
    if (!item) return null;

    // THE FIX: Smart Pathing for Startup Frames
    let frames;
    if (item.id === 'male_char' || item.id === 'female_char') {
        // Playable characters start with their idle animation
        frames = [
            `${item.animBase}/idle/south-west/frame_000.png`,
            `${item.animBase}/idle/south-west/frame_001.png`,
            `${item.animBase}/idle/south-west/frame_002.png`,
            `${item.animBase}/idle/south-west/frame_003.png`
        ];
    } else {
        // Old robots/workers start with their normal animation!
        frames = [
            `${item.animBase}/south-west/frame_000.png`,
            `${item.animBase}/south-west/frame_001.png`,
            `${item.animBase}/south-west/frame_002.png`,
            `${item.animBase}/south-west/frame_003.png`
        ];
    }

    let worker = window.createDraggable(
        frames, gridX, gridY, item.id, item.scale, item.grabOffset, false, item.hitbox
    );

    if (worker) {
        worker.isMultiplayer = true;
        worker.playerName = playerName;

        // 🔥 1. Build the sleek HTML Name Tag
        const nameTag = document.createElement('div');
        nameTag.innerText = playerName;
        nameTag.style.position = 'absolute';
        nameTag.style.background = 'rgba(0, 0, 0, 0.8)';
        nameTag.style.color = isGhost ? '#aaaaaa' : '#00ff00';
        nameTag.style.border = isGhost ? '1px solid #555555' : '1px solid #00ff00';
        nameTag.style.padding = '4px 10px';
        nameTag.style.borderRadius = '4px';
        nameTag.style.fontFamily = 'monospace';
        nameTag.style.fontSize = '14px';
        nameTag.style.fontWeight = 'bold';
        nameTag.style.pointerEvents = 'none'; // Lets your mouse click right through it!
        nameTag.style.transform = 'translate(-50%, -100%)';
        nameTag.style.zIndex = '1000';
        nameTag.style.display = 'none'; // Hide it until the camera places it

        document.body.appendChild(nameTag);
        worker.nameTag = nameTag; // Link it to the sprite

        // 🔥 2. Make the HTML tag self-destruct when the sprite is deleted
        const originalDestroy = worker.destroy;
        worker.destroy = function (options) {
            if (this.nameTag && this.nameTag.parentNode) {
                this.nameTag.parentNode.removeChild(this.nameTag);
            }
            originalDestroy.call(this, options);
        };
    }

    if (!isGhost && worker) {
        worker.isRealPlayer = true;
        worker.id = 'multiplayer-human';
    } else if (isGhost && worker) {
        worker.alpha = 0.5;
        worker.interactive = false;
        worker.removeAllListeners();
    }

    if (worker && worker.play) worker.play();

    worker.isPlayableCharacter = true;
    return worker;
}

window.checkCollision = function (nextX, nextY) {
    if (!entityLayer || !entityLayer.children) return false;

    for (let i = 0; i < entityLayer.children.length; i++) {
        const entity = entityLayer.children[i];

        // 🛑 THE ULTIMATE IGNORE LIST (Banner & multiplayer ghosts)
        if (
            entity === window.myLocalWorker ||
            !entity.hitbox ||
            entity.isDragging ||
            entity.type === 'banner' ||
            entity.id === 'banner' ||
            entity.isPlayableCharacter
        ) {
            continue;
        }

        // 🔥 YOUR ORIGINAL BOX MATH (Perfectly aligned with your catalog)
        const left = entity.gridX + entity.hitbox.x;
        const right = left + entity.hitbox.w;
        const top = entity.gridY + entity.hitbox.y;
        const bottom = top + entity.hitbox.h;

        // We give the player's coordinate a tiny 0.2 "thickness" on the floor
        const padding = 0.2;

        if (nextX + padding >= left && nextX - padding <= right &&
            nextY + padding >= top && nextY - padding <= bottom) {
            return true;
        }
    }
    return false;
};

function generateRandomFactoryName() {
    const adjectives = ['Rusty', 'Sparky', 'Oily', 'Copper', 'Iron', 'Steel', 'Greasy', 'Volt', 'Scrap', 'Heavy'];
    const nouns = ['Wrench', 'Cog', 'Bolt', 'Piston', 'Gear', 'Engine', 'Wire', 'Rivet', 'Motor', 'Valve'];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 1000); // Adds a number from 0 to 999

    return `${adj}${noun}${num}`;
}

// 🔥 1. KEYBOARD STATE TRACKER
window.keys = { w: false, a: false, s: false, d: false };

window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const key = e.key.toLowerCase();
    if (window.keys.hasOwnProperty(key)) window.keys[key] = true;
});

window.addEventListener('keyup', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    const key = e.key.toLowerCase();
    if (window.keys.hasOwnProperty(key)) window.keys[key] = false;
});

// ============================================================================
// ️ MASTER BUILD CATALOG - NOW WITH PHYSICAL HEIGHTS FOR STACKING!
// ============================================================================
const BUILD_CATALOG = [
    {
        id: 'male_char', name: 'MALE', type: 'human', scale: 3, grabOffset: 30, physicalHeight: 60,
        hasRotation: true, folder: 'humanoid/male', animatedDirs: ['north-east', 'south-east', 'north-west', 'south-west', 'north', 'east', 'west', 'south'],
        animBase: 'humanoid/male/animations',
        thumb: 'humanoid/male/animations/walking/south-east/frame_000.png',
        hitbox: { x: -0.2, y: -0.9, w: 0.4, h: 0.9 }

    },
    {
        id: 'female_char', name: 'FEMALE', type: 'human', scale: 3, grabOffset: 30, physicalHeight: 60,
        hasRotation: true, folder: 'humanoid/female', animatedDirs: ['north-east', 'south-east', 'north-west', 'south-west', 'north', 'east', 'west', 'south'],
        animBase: 'humanoid/female/animations',
        thumb: 'humanoid/female/animations/walking/south-east/frame_000.png',
        hitbox: { x: -0.2, y: -0.9, w: 0.4, h: 0.9 }

    },
    {
        id: 'robot_base', name: 'WORKER UNIT', type: 'robot', scale: 3, grabOffset: 30, physicalHeight: 60,
        hasRotation: true, folder: 'humanoid/robot', animatedDirs: ['south', 'south-east'],
        animBase: 'humanoid/robot/animations/Breathing_Idle-c693fd1f',
        thumb: 'humanoid/robot/animations/Breathing_Idle-c693fd1f/south-east/frame_000.png',
        hitbox: { x: -0.2, y: -0.9, w: 0.4, h: 0.9 }
    },
    {
        id: 'robot_v1', name: 'SECURITY UNIT', type: 'robot', scale: 3, grabOffset: 30, physicalHeight: 60,
        hasRotation: true, folder: 'humanoid/robot1', animatedDirs: ['south-east'],
        animBase: 'humanoid/robot1/animations/Breathing_Idle-6d37f6f3',
        thumb: 'humanoid/robot1/animations/Breathing_Idle-6d37f6f3/south-east/frame_000.png',
        hitbox: { x: -0.2, y: -0.9, w: 0.4, h: 0.9 }
    },
    {
        id: 'human_worker', name: 'HUMAN OPERATOR', type: 'human', scale: 3, grabOffset: 30, physicalHeight: 60,
        hasRotation: true, folder: 'humanoid/human', animatedDirs: ['north-east', 'south', 'south-west'],
        animBase: 'humanoid/human/animations/Breathing_Idle-c1b5dcec',
        thumb: 'humanoid/human/animations/Breathing_Idle-c1b5dcec/south-west/frame_000.png',
        hitbox: { x: -0.2, y: -0.9, w: 0.4, h: 0.9 }
    },
    {
        id: 'banner', name: 'IBEX BANNER', type: 'structure', scale: 1.1, grabOffset: 450, physicalHeight: 0,
        hasRotation: false, thumb: 'static_assets/new_ibex_banner.png', textureData: 'static_assets/new_ibex_banner.png',
        hitbox: { x: -0.5, y: -1, w: 1, h: 1 }
    },
    {
        id: 'server-rack', name: 'SERVER RACK', type: 'structure', scale: 0.5, grabOffset: 180, physicalHeight: 100,
        hasRotation: false, thumb: 'static_assets/server.png', textureData: 'static_assets/server.png',
        hitbox: { x: -0.5, y: -1, w: 0.9, h: 1 }
    },
    {
        id: 'computer', name: 'COMPUTER DESK', type: 'structure', scale: 0.5, grabOffset: 80, physicalHeight: 40,
        hasRotation: false, thumb: 'static_assets/computer_station.png', textureData: 'static_assets/computer_station.png',
        hitbox: { x: -0.5, y: -1, w: 0.9, h: 1 }
    },
    {
        id: 'computer1', name: 'COMPUTER DESK', type: 'structure', scale: 0.5, grabOffset: 80, physicalHeight: 40,
        hasRotation: false, thumb: 'static_assets/computer_station1.png', textureData: 'static_assets/computer_station1.png',
        hitbox: { x: -0.5, y: -1, w: 0.9, h: 1 }
    },
    {
        id: 'computer-on-wheels', name: 'COMPUTER ON WHEELS', type: 'structure', scale: 0.4, grabOffset: 80, physicalHeight: 45,
        hasRotation: false, thumb: 'static_assets/computer_wheels.png', textureData: 'static_assets/computer_wheels.png',
        hitbox: { x: -0.5, y: -1, w: 0.9, h: 1 }
    },
    {
        id: 'office_floor',
        name: 'Office Grid Canvas',
        textureData: 'static_assets/floor_office.png',
        isEnvironmentLayer: true,
        visibleGridSize: 30,
        hasRotation: false
    },
    {
        id: 'chill_area', name: 'CHILL AREA', type: 'decor', scale: 0.5, grabOffset: 40, physicalHeight: 30,
        hasRotation: false, thumb: 'static_assets/chill_area.png', textureData: 'static_assets/chill_area.png',
        hitbox: { x: -0.3, y: -0.8, w: 0.6, h: 0.8 }
    },
    {
        id: 'arcade', name: 'ARCADE', type: 'decor', scale: 0.5, grabOffset: 40, physicalHeight: 30,
        hasRotation: false, thumb: 'static_assets/arcade.png', textureData: 'static_assets/arcade.png',
        hitbox: { x: -0.3, y: -0.8, w: 0.6, h: 0.8 }
    },
    {
        id: 'coffee', name: 'COFFEE TABLE', type: 'decor', scale: 0.5, grabOffset: 40, physicalHeight: 30,
        hasRotation: false, thumb: 'static_assets/coffee.png', textureData: 'static_assets/coffee.png',
        hitbox: { x: -0.3, y: -0.8, w: 0.6, h: 0.8 }
    },
    {
        id: 'ping-pong', name: 'PING PONG TABLE', type: 'decor', scale: 0.5, grabOffset: 40, physicalHeight: 30,
        hasRotation: false, thumb: 'static_assets/ping-pong.png', textureData: 'static_assets/ping-pong.png',
        hitbox: { x: -0.3, y: -0.8, w: 0.6, h: 0.8 }
    },
    {
        id: 'water', name: 'WATER', type: 'decor', scale: 0.5, grabOffset: 40, physicalHeight: 30,
        hasRotation: false, thumb: 'static_assets/water.png', textureData: 'static_assets/water.png',
        hitbox: { x: -0.3, y: -0.8, w: 0.6, h: 0.8 }
    },
    {
        id: 'plants', name: 'PLANTS', type: 'decor', scale: 0.5, grabOffset: 40, physicalHeight: 30,
        hasRotation: false, thumb: 'static_assets/plants.png', textureData: 'static_assets/plants.png',
        hitbox: { x: -0.3, y: -0.8, w: 0.6, h: 0.8 }
    },
    {
        id: 'conference', name: 'CONFERENCE TABLE', type: 'decor', scale: 0.3, grabOffset: 40, physicalHeight: 30,
        hasRotation: false, thumb: 'static_assets/conference.png', textureData: 'static_assets/conference.png',
        hitbox: { x: -0.3, y: -0.8, w: 0.6, h: 0.8 }
    },



];

let isAnimating = true;
let demolishMode = false;

// --- 1. PIXI INITIALIZATION & LAYERS ---
PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

const app = new PIXI.Application({
    resizeTo: window,
    backgroundColor: 0x0a0a0c,
    resolution: 0.35,
    autoDensity: true
});

PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;

document.getElementById('app-wrapper').appendChild(app.view);

const backgroundLayer = new PIXI.Container();
const entityLayer = new PIXI.Container();
entityLayer.sortableChildren = true;

app.stage.addChild(backgroundLayer);
app.stage.addChild(entityLayer);

// 🔥 ASSET SELECTION ENGINE
window.selectedEntity = null;

// If the user clicks empty floor space, deselect the item!
app.stage.interactive = true;
app.stage.hitArea = new PIXI.Rectangle(-50000, -50000, 100000, 100000);
app.stage.on('pointerdown', (e) => {
    if (e.target === app.stage || e.target === backgroundLayer) {
        window.selectedEntity = null;
    }
});

const colorShader = `
        varying vec2 vTextureCoord;
        uniform sampler2D uSampler;
        uniform float colorSteps;
        void main(void) {
            vec4 color = texture2D(uSampler, vTextureCoord);
            color.r = floor(color.r * colorSteps) / colorSteps;
            color.g = floor(color.g * colorSteps) / colorSteps;
            color.b = floor(color.b * colorSteps) / colorSteps;
            gl_FragColor = color;
        }
    `;

const retroColorFilter = new PIXI.Filter(null, colorShader, { colorSteps: 16.0 });
entityLayer.filters = [retroColorFilter];
backgroundLayer.filters = [retroColorFilter];

// --- 2. DYNAMIC GRID SYSTEM ---
const gridGraphics = new PIXI.Graphics();
backgroundLayer.addChild(gridGraphics);

let TILE_W = 128, TILE_H = 64;
function getOrigin() { return { x: app.screen.width / 2, y: app.screen.height * 0.35 }; }
function toIso(cartX, cartY) { return { x: (cartX - cartY) * (TILE_W / 2) + getOrigin().x, y: (cartX + cartY) * (TILE_H / 2) + getOrigin().y }; }
function toCart(screenX, screenY) {
    let adjX = screenX - getOrigin().x, adjY = screenY - getOrigin().y;
    return { x: (adjX / (TILE_W / 2) + adjY / (TILE_H / 2)) / 2, y: (adjY / (TILE_H / 2) - adjX / (TILE_W / 2)) / 2 };
}

// A dedicated container for the background image, underneath everything else
const environmentLayer = new PIXI.Container();
// Make sure this container is added BEFORE the entityLayer for depth sorting!
app.stage.addChildAt(environmentLayer, 0);

function drawGrid() {
    environmentLayer.removeChildren();
    gridGraphics.clear();

    gridGraphics.lineStyle(2, 0x000000, 0);

    const assetPath = 'static_assets/floor_office.png';

    if (window.textures && window.textures[assetPath]) {
        const bg = new PIXI.Sprite(window.textures[assetPath]);

        // 1. Anchor it slightly higher
        bg.anchor.set(0.5, 0.7);

        // Position at game origin (0,0 center)
        const origin = getOrigin();
        bg.x = origin.x;
        bg.y = origin.y;

        const customScale = 1.5;
        bg.scale.set(customScale);

        // Add to the dedicated layer
        environmentLayer.addChild(bg);
    }

    // 3. Keep invisible dynamic lines for collision/clicking accuracy
    const GRID_SIZE = 10; // This makes a grid from -5 to +5

    for (let i = -GRID_SIZE; i <= GRID_SIZE; i++) {
        // Draw Y lines
        let p1 = toIso(i, -GRID_SIZE);
        let p2 = toIso(i, GRID_SIZE);
        gridGraphics.moveTo(p1.x, p1.y);
        gridGraphics.lineTo(p2.x, p2.y);

        // Draw X lines
        p1 = toIso(-GRID_SIZE, i);
        p2 = toIso(GRID_SIZE, i);
        gridGraphics.moveTo(p1.x, p1.y);
        gridGraphics.lineTo(p2.x, p2.y);
    }
}

// --- 3. RESPONSIVE RESIZE HANDLER ---
function resizeApp() {
    drawGrid();

    // 1. Reposition all standard factory machines
    if (entityLayer) {
        entityLayer.children.forEach(c => {
            if (c.gridX !== undefined && c.gridY !== undefined) {
                const pos = toIso(c.gridX, c.gridY);
                c.baseY = pos.y;
                c.x = pos.x;
                c.y = c.baseY - (c.elevation || 0);
            }
        });
    }
}

window.addEventListener('resize', resizeApp);

// --- 4. KEYBOARD LOGIC ---
window.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') {
        entityLayer.children.forEach(c => { if (c.type === 'structure') { c.interactive = false; c.alpha = 0.4; } });
    }
    if (e.key === 'Escape') { window.closeAllMonitors(); return; }
    if (document.querySelector('.portal-menu')) {
        switch (e.key) {
            case '1': loadPortalPage('COMPANY INFO'); break;
            case '2': loadPortalPage('TALENT SOLUTIONS'); break;
            case '3': loadPortalPage('CONTACT'); break;
            case '4': loadPortalPage('CUSTOMER CARE'); break;
            case '5': loadPortalPage('BLOG'); break;
            case '6': startHackingGame(); break;
        }
    } else if (document.querySelector('.portal-content') && e.key === 'Backspace') {
        showIntranetMenu();
    }
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') { entityLayer.children.forEach(c => { if (c.type === 'structure') { c.interactive = true; c.alpha = 1.0; } }); }
});

// --- 5. MONITORS ---
const monitors = [];
function createMonitor(id, label, contentHTML) {
    const div = document.createElement('div');
    div.className = 'monitor-overlay';
    div.id = id;

    div.innerHTML = `
            <div class="hardware-bezel">
                <div class="close-x-btn" onclick="closeAllMonitors()">[X]</div>
                <div class="monitor-body">${contentHTML}</div>
            </div>
            <div class="hardware-controls">
                <div class="hw-logo">IBEX // ${label}</div>
                <div style="display: flex; align-items: center; gap: 15px; margin-left: auto;">
                <div class="led-indicator"></div>
                <button class="desk-btn btn-red" onclick="closeAllMonitors()">PWR</button>
            </div>
            </div>
        `;
    document.getElementById('app-wrapper').appendChild(div);
    monitors.push({ id: id, element: div });
}

createMonitor("mon-terminal", "FACTORY", `
        <div class="retro-wrapper"><div class="retro-title">FABRICATION & DEPLOYMENT</div>
            <div class="build-grid" id="build-grid-container"></div>
            <div style="padding-top: 15px; margin-top: auto; z-index: 2; position: relative;">
                <div id="rotation-container" style="display: none; justify-content: space-between; align-items: center; margin-bottom: 15px; font-size: 1.2em; font-weight: bold;">
                    <span>ORIENTATION:</span>
                    <select id="rotation-select" style="background: #040c04; color: #1cf843; border: 2px solid #1cf843; font-family: 'Courier New', monospace; font-weight: bold; font-size: 1em; padding: 6px; outline: none; cursor: pointer;">
                        <option value="south-east">SOUTH-EAST</option>
                        <option value="south">SOUTH</option>
                        <option value="south-west">SOUTH-WEST</option>
                        <option value="west">WEST</option>
                        <option value="north-west">NORTH-WEST</option>
                        <option value="north">NORTH</option>
                        <option value="north-east">NORTH-EAST</option>
                        <option value="east">EAST</option>
                    </select>
                </div>
                <div class="fab-footer-flex" style="display: flex; justify-content: space-between; align-items: center;">
                    <div id="fabrication-status" style="font-size: 1em;">STATUS: SELECT AN ASSET</div>
                    <div class="deploy-btn disabled" id="deploy-btn" onclick="deployItem()">DEPLOY TO FLOOR</div>
                </div>
            </div>
        </div>
    `);

createMonitor("mon-web", "WEBSITE", `<iframe src="https://goibex.it" style="width: 100%; height: 100%; flex-grow: 1; border: none; display: block; background: #fff;"></iframe>`);
createMonitor("mon-security", "SECURITY", `<div class="retro-wrapper"><div class="retro-title">RESTRICTED AREA // PASSWORD REQUIRED</div><div id="security-content" style="flex-grow: 1; position: relative;"></div></div>`);

window.toggleMonitor = function (targetId) {
    const target = document.getElementById(targetId);

    // Check if the monitor we just clicked is ALREADY open
    const isAlreadyOpen = target && target.classList.contains('is-centered');

    // 1. Close all monitors & turn off all button lights
    document.querySelectorAll('.monitor-overlay').forEach(m => m.classList.remove('is-centered'));
    document.querySelectorAll('.desk-btn').forEach(btn => btn.classList.remove('active-monitor'));

    // 2. If it wasn't already open, open it and run its logic!
    if (target && !isAlreadyOpen) {
        target.classList.add('is-centered');

        // 🔥 THE FIX: Removed "window." so it doesn't crash the hacking game!
        if (targetId === 'mon-security' && !document.getElementById('hack-container-id')) {
            startHackingGame();
        }

        if (targetId === 'mon-terminal') {
            if (document.getElementById('build-grid-container').innerHTML.trim() === '') window.populateBuildGrid();
            if (typeof currentBuildIndex !== 'undefined' && currentBuildIndex !== -1) {
                const deployBtn = document.getElementById('deploy-btn');
                if (deployBtn) deployBtn.classList.remove('disabled');
                const statusLabel = document.getElementById('fabrication-status');
                if (statusLabel) statusLabel.innerText = `STATUS: READY TO DEPLOY`;
            }
        }

        // 3. Light up the specific button safely
        try {
            const activeBtn = document.querySelector(`.desk-btn[onclick*="${targetId}"]`);
            if (activeBtn) activeBtn.classList.add('active-monitor');
        } catch (error) {
            // Fails silently without breaking the rest of your game if a button isn't found
            console.warn("Could not find button for " + targetId);
        }
    }
};
window.closeAllMonitors = function () {
    document.querySelectorAll('.monitor-overlay').forEach(m => m.classList.remove('is-centered'));
    document.querySelectorAll('.hack-row').forEach(row => { row.style.visibility = 'visible'; row.style.pointerEvents = 'auto'; });
    document.querySelectorAll('.desk-btn').forEach(btn => btn.classList.remove('active-monitor'));
};

// --- 6. SANDBOX BUILDER ---
let currentBuildIndex = -1;
window.populateBuildGrid = function () {
    document.getElementById('build-grid-container').innerHTML = BUILD_CATALOG.map((item, index) => `
            <div class="build-item" id="build-item-${index}" onclick="selectBuildItem(${index})">
                <div class="build-item-thumb" style="background-image: url('${item.thumb}')"></div>
                <div class="build-item-name">${item.name}</div>
            </div>
        `).join('');
};

window.selectBuildItem = function (index) {
    currentBuildIndex = index;
    document.querySelectorAll('.build-item').forEach(el => el.classList.remove('selected'));
    document.getElementById(`build-item-${index}`).classList.add('selected');
    document.getElementById('rotation-container').style.display = BUILD_CATALOG[index].hasRotation ? 'flex' : 'none';
    document.getElementById('fabrication-status').innerText = `STATUS: READY TO DEPLOY`;
    document.getElementById('deploy-btn').classList.remove('disabled');
};

window.deployItem = function () {
    if (currentBuildIndex === -1) return;
    const item = BUILD_CATALOG[currentBuildIndex];
    let textureToSpawn = item.textureData;

    if (item.hasRotation) {
        const rot = document.getElementById('rotation-select').value;
        if (item.animatedDirs.includes(rot)) {
            textureToSpawn = [`${item.animBase}/${rot}/frame_000.png`, `${item.animBase}/${rot}/frame_001.png`, `${item.animBase}/${rot}/frame_002.png`, `${item.animBase}/${rot}/frame_003.png`];
        } else { textureToSpawn = `${item.folder}/rotations/${rot}.png`; }
    }

    document.getElementById('fabrication-status').innerText = `STATUS: DEPLOYED SECURELY.`;
    document.getElementById('deploy-btn').classList.add('disabled');

    const randomX = Math.floor(Math.random() * 15) + 1;
    const randomY = Math.floor(Math.random() * 15) + 1;

    window.createDraggable(textureToSpawn, randomX, randomY, item.id, item.scale, item.grabOffset, false, item.hitbox);

    setTimeout(() => { window.closeAllMonitors(); }, 400);
}

window.updateContextMenu = function (entity) {
    const menu = document.getElementById('asset-context-menu');
    menu.style.display = 'flex'; // Turn it on

    // Generate a cool dynamic serial number for the UI
    const serial = Math.abs(Math.floor(entity.x + entity.y)).toString(16).toUpperCase();
    document.getElementById('ctx-id').innerText = `${serial}-${entity.type.substring(0, 3).toUpperCase()}`;

    // Hide the ROTATE button if the object (like a PC) can't rotate!
    const catalogItem = BUILD_CATALOG.find(i => i.id === entity.type);
    document.getElementById('ctx-btn-rotate').style.display = (catalogItem && catalogItem.hasRotation) ? 'block' : 'none';
};

window.deleteSelectedAsset = function () {
    if (window.selectedEntity && window.selectedEntity.type !== 'banner') {
        window.selectedEntity.destroy({ children: true });
        window.selectedEntity = null; // Clear selection
    }
};

window.rotateSelectedAsset = function () {
    if (!window.selectedEntity) return;
    const item = BUILD_CATALOG.find(i => i.id === window.selectedEntity.type);
    if (!item || !item.hasRotation) return;

    // Figure out what direction we are currently facing, and grab the next one
    if (!window.selectedEntity.currentRot) window.selectedEntity.currentRot = item.animatedDirs[0];
    let idx = item.animatedDirs.indexOf(window.selectedEntity.currentRot);
    let nextRot = item.animatedDirs[(idx + 1) % item.animatedDirs.length];
    window.selectedEntity.currentRot = nextRot;

    // Fetch the new textures from the pre-loaded engine cache
    const searchPath = `${item.animBase}/${nextRot}/`;
    let frames = [];
    for (let key in PIXI.utils.TextureCache) {
        if (key.includes(searchPath)) frames.push(PIXI.utils.TextureCache[key]);
    }

    // Apply the new rotation to the live object
    if (frames.length > 0 && window.selectedEntity instanceof PIXI.AnimatedSprite) {
        window.selectedEntity.textures = frames;
        window.selectedEntity.play();
    }
};

// --- 7. HACKING MINIGAME ---
let hackAttempts = 4; const targetWord = "IBEX";
const decoyWords = ["CODE", "DATA", "HIRE", "WORK", "JOBS", "TEAM", "TECH", "CORE", "SYNC", "PLAN", "ROOT", "BOOT", "USER", "FILE", "NODE", "PORT", "NULL"];
const garbageChars = "!@#$%^&*()_+-=[]{}|;':,./<>?`~";

function startHackingGame() {
    const container = document.getElementById('security-content');
    hackAttempts = 4;
    let shuffledDecoys = decoyWords.sort(() => 0.5 - Math.random()).slice(0, 14);
    let allWords = [...shuffledDecoys, targetWord].sort(() => 0.5 - Math.random());
    let html = `<div class="hack-container" id="hack-container-id"><div class="hack-main"><div class="hack-column" id="hack-col-1"></div><div class="hack-column" id="hack-col-2"></div></div><div class="hack-log-panel"><div class="hack-attempts">ATTEMPTS: <span id="hack-attempt-count">4</span> <span id="hack-blocks">■ ■ ■ ■</span></div><div class="hack-output" id="hack-output-log">> INITIATING LOGIN...<br>> ENTER PASSWORD.<br></div><div class="hack-hover-display" id="hack-hover-display">> <span class="cursor-block">█</span></div></div></div>`;
    container.innerHTML = html;

    const col1 = document.getElementById('hack-col-1'); const col2 = document.getElementById('hack-col-2');
    let wordIndex = 0;
    for (let i = 0; i < 40; i++) {
        const hex = "0x" + Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
        let rowStr = ""; for (let j = 0; j < 14; j++) rowStr += garbageChars.charAt(Math.floor(Math.random() * garbageChars.length));

        if (wordIndex < allWords.length && Math.random() > 0.4) {
            const word = allWords[wordIndex]; const insertPos = Math.floor(Math.random() * (14 - word.length));
            const pre = rowStr.substring(0, insertPos).replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const post = rowStr.substring(insertPos + word.length).replace(/</g, "&lt;").replace(/>/g, "&gt;");
            rowStr = `${pre}<span class="hack-word" onmouseenter="document.getElementById('hack-hover-display').innerHTML = '> ${word} <span class=\\'cursor-block\\'>█</span>'" onmouseleave="document.getElementById('hack-hover-display').innerHTML = '> <span class=\\'cursor-block\\'>█</span>'" onclick="handleHackAttempt(this, '${word}')">${word}</span>${post}`;
            wordIndex++;
        } else { rowStr = rowStr.replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
        let delay = (i < 20 ? i : i - 20) * 0.03;
        const rowHtml = `<div class="hack-row" style="animation-delay: ${delay}s"><span class="hack-hex">${hex}</span> <span>${rowStr}</span></div>`;
        if (i < 20) col1.innerHTML += rowHtml; else col2.innerHTML += rowHtml;
    }
}

window.handleHackAttempt = function (element, word) {
    if (hackAttempts <= 0) return;
    const log = document.getElementById('hack-output-log');
    log.innerHTML += `> ${word}<br>`;

    if (word === targetWord) {
        log.innerHTML += `<span style="color:#fff; text-shadow: 0 0 10px #fff;">> EXACT MATCH!</span><br>> ACCESS GRANTED.<br>`;
        setTimeout(() => { showIntranetMenu(); }, 1200); return;
    }

    let likeness = 0; for (let i = 0; i < 4; i++) { if (word[i] === targetWord[i]) likeness++; }

    const row = element.closest('.hack-row');
    if (row) { row.style.visibility = 'hidden'; row.style.pointerEvents = 'none'; }

    document.querySelectorAll('.hack-word').forEach(span => {
        if (span.innerText === targetWord) {
            const targetRow = span.closest('.hack-row');
            if (targetRow) {
                targetRow.classList.remove('hint-blink-row');
                void targetRow.offsetWidth;
                targetRow.classList.add('hint-blink-row');
            }
        }
    });

    hackAttempts--;
    log.innerHTML += `> ENTRY DENIED.<br>> LIKENESS=${likeness}<br>`;
    document.getElementById('hack-attempt-count').innerText = hackAttempts;
    document.getElementById('hack-blocks').innerText = "■ ".repeat(hackAttempts);

    if (hackAttempts <= 0) {
        log.innerHTML += `<span style="color:red; text-shadow: 0 0 10px red;">> TERMINAL LOCKED.</span><br>> REBOOTING...<br>`;
        setTimeout(() => { startHackingGame(); }, 2000);
    }
    log.scrollTop = log.scrollHeight;
};

function showIntranetMenu() {
    document.getElementById('security-content').innerHTML = `
            <div class="portal-menu">
                <div style="margin-bottom: 20px; border-bottom: 1px dashed #1cf843; padding-bottom: 10px;">WELCOME TO THE IBEX SECURE INTRANET.<br>PLEASE SELECT A MODULE OR USE KEYBOARD (1-6):</div>
                <div class="portal-item" onclick="loadPortalPage('COMPANY INFO')">[1] COMPANY INFO</div>
                <div class="portal-item" onclick="loadPortalPage('TALENT SOLUTIONS')">[2] TALENT SOLUTIONS</div>
                <div class="portal-item" onclick="loadPortalPage('CONTACT')">[3] CONTACT</div>
                <div class="portal-item" style="margin-top:20px; color:#aaa;" onclick="startHackingGame()">[6] LOGOUT</div>
            </div>`;
}

const portalData = {
    'COMPANY INFO': { text: "IBEX Staffing Solutions.<br><br>Founded on the principle that the right talent unlocks exponential growth.", art: `       /\\\n      // \\\n     //   \\\n    //IBEX \\\n   //_______\\\n  /          \\` },
    'TALENT SOLUTIONS': { text: "Whether you need temporary contractors for immediate project scaling or long-term executive placements, IBEX delivers.", art: `    _____     _____\n   /     \\   /     \\\n  |  ___  |_|  ___  |\n  | |   |__ __|   | |\n  |_|      V      |_|\n   Handshake Protocol\n      Engaged.` },
    'CONTACT': { text: "REACH THE IBEX HUB:<br><br>Direct Line: 555-IBEX-HIRE<br>Encrypted Mail: secure@goibex.it", art: `   _________________\n  / \\             / \\\n |   \\           /   |\n |    \\_________/    |\n |      S E C U R E  |\n  \\_________________/` }
};

window.loadPortalPage = function (pageId) {
    const data = portalData[pageId];
    document.getElementById('security-content').innerHTML = `
            <div class="portal-content">
                <div style="border-bottom: 1px dashed #1cf843; padding-bottom: 10px;">MODULE :: ${pageId}</div>
                <div class="portal-body"><div class="portal-text">${data.text}</div><div class="portal-art">${data.art}</div></div>
                <div class="portal-back" onclick="showIntranetMenu()">[ < RETURN TO MENU (BACKSPACE) ]</div>
            </div>`;
};

// --- 8. ASSET PRE-LOADING & TRUE ELEVATION DRAGGING ---
const directions = ['east', 'north-east', 'north-west', 'north', 'south-east', 'south-west', 'south', 'west'];
let allAssetsToLoad = ['static_assets/hook-remove.png', 'static_assets/ibex-banner.png'];

BUILD_CATALOG.forEach(item => {
    if (item.hasRotation) {

        // 1. Load the rotations (Original logic)
        if (typeof directions !== 'undefined' && item.folder) {
            directions.forEach(dir => allAssetsToLoad.push(`${item.folder}/rotations/${dir}.png`));
        }

        // 2. Load animations
        if (item.animatedDirs) {
            item.animatedDirs.forEach(animDir => {
                for (let i = 0; i <= 3; i++) {

                    // 🔥 THE FIX: Only split the paths for the playable characters!
                    if (item.id === 'male_char' || item.id === 'female_char') {
                        allAssetsToLoad.push(`${item.animBase}/idle/${animDir}/frame_00${i}.png`);
                        allAssetsToLoad.push(`${item.animBase}/walking/${animDir}/frame_00${i}.png`);
                    } else {
                        // 🔥 Old workers and robots load exactly as they used to!
                        allAssetsToLoad.push(`${item.animBase}/${animDir}/frame_00${i}.png`);
                    }

                }
            });
        }
    } else if (item.textureData) {
        allAssetsToLoad.push(item.textureData);
    }
});

allAssetsToLoad = [...new Set(allAssetsToLoad)];


PIXI.Assets.load(allAssetsToLoad).then((textures) => {
    window.textures = textures;
    const hookTex = textures['static_assets/hook-remove.png'];
    const frameW = hookTex.width / 4; const frameH = hookTex.height / 2;
    const openClawTex = new PIXI.Texture(hookTex.baseTexture, new PIXI.Rectangle(0, 0, frameW, frameH));
    const closedClawTex = new PIXI.Texture(hookTex.baseTexture, new PIXI.Rectangle(frameW, 0, frameW, frameH));

    const chain = new PIXI.Graphics();
    chain.id = 'chain';
    entityLayer.addChild(chain);

    const claw = new PIXI.Sprite(openClawTex);
    claw.id = 'claw';
    claw.anchor.set(0.6, 1.2); claw.scale.set(1.5); claw.visible = false;
    claw.mode = 'idle'; claw.targetY = 0; claw.baseY = 0;
    entityLayer.addChild(claw);

    window.createDraggable = function (textureData, gridX, gridY, catalogId, scale = 1, grabOffset = 30, isUndeletable = false, customHitbox = null) {
        let entity; let tex;

        // Get physical properties from catalog
        const catalogData = BUILD_CATALOG.find(i => i.id === catalogId);
        const pHeight = catalogData ? (catalogData.physicalHeight || 0) : 0;

        if (Array.isArray(textureData)) {
            // 🔥 THE FIX: Safely pull textures and filter out any that are undefined!
            const safeTextures = textureData
                .map(p => PIXI.utils.TextureCache[p] || (typeof textures !== 'undefined' ? textures[p] : undefined))
                .filter(t => t !== undefined);

            if (safeTextures.length === 0) {
                console.error("CRITICAL: Textures completely missing for:", textureData[0]);
                safeTextures.push(PIXI.Texture.EMPTY); // Failsafe so the engine never crashes!
            }

            tex = safeTextures[0];
            entity = new PIXI.AnimatedSprite(safeTextures);
            entity.animationSpeed = 0.1;
            if (typeof isAnimating !== 'undefined' && isAnimating) entity.play();
        } else {
            tex = textures[textureData] || PIXI.utils.TextureCache[textureData] || PIXI.Texture.EMPTY;
            entity = new PIXI.Sprite(tex);
        }

        entity.anchor.set(0.5, 1); entity.scale.set(scale);

        // Hitbox assignment
        if (customHitbox && Array.isArray(customHitbox)) {
            const points = customHitbox.map(p => new PIXI.Point(p.x * tex.width, p.y * tex.height));
            entity.hitArea = new PIXI.Polygon(points);
        } else if (customHitbox) {
            entity.hitArea = new PIXI.Rectangle(tex.width * customHitbox.x, tex.height * customHitbox.y, tex.width * customHitbox.w, tex.height * customHitbox.h);
        } else {
            entity.hitArea = new PIXI.Rectangle(-tex.width / 2, -tex.height, tex.width, tex.height);
        }

        entity.hitbox = customHitbox;

        // Isometric Properties
        entity.initialGridX = gridX; entity.initialGridY = gridY;
        entity.gridX = gridX; entity.gridY = gridY;
        entity.type = catalogId; entity.grabOffset = grabOffset;
        entity.physicalHeight = pHeight;
        entity.elevation = 0;

        // Decoupling logical baseY from visual PIXI Y
        const pos = toIso(gridX, gridY);
        entity.baseY = pos.y;
        entity.x = pos.x;

        entityLayer.addChild(entity);

        // Initial render
        entity.y = entity.baseY - entity.elevation;

        entity.interactive = true; entity.cursor = 'grab';
        let dragging = false, dragOffset = { x: 0, y: 0 };

        entity.on('pointerdown', (e) => {
            if (entity.destroyed) return;

            if (entity.isLocked || entity.type === 'banner' || entity.id === 'banner') {
                return;
            }

            if (entity.isPlayableCharacter) {
                return;
            }

            if (demolishMode) {
                if (isUndeletable || entity.isDemolishing) return;
                entity.isDemolishing = true; entity.interactive = false;
                let blinkTimer = 0;
                const blinkAnim = () => {
                    blinkTimer++;
                    if (blinkTimer % 4 === 0) { entity.alpha = entity.alpha === 1 ? 0 : 1; }
                    if (blinkTimer > 24) { app.ticker.remove(blinkAnim); entity.destroy(); }
                };
                app.ticker.add(blinkAnim);
                return;
            }

            if (claw.mode !== 'idle' && claw.visible) return;

            dragging = true; entity.isDragging = true;
            entity.cursor = 'grabbing'; entity.alpha = 0.8;

            dragOffset.x = entity.x - e.data.global.x;
            dragOffset.y = entity.y - e.data.global.y;

            claw.texture = openClawTex; claw.visible = true;
            claw.x = entity.x; claw.y = -300;
            claw.targetY = entity.y - entity.grabOffset;
            claw.baseY = entity.baseY;
            claw.mode = 'manual_dropping';

            window.selectedEntity = entity;
            window.updateContextMenu(entity);
        });

        const endDrag = () => {

            if (entity.destroyed) return;
            if (!dragging) return;
            dragging = false; entity.isDragging = false;
            entity.cursor = 'grab'; entity.alpha = 1;
            claw.texture = openClawTex; claw.mode = 'manual_retracting'; claw.targetY = -300;
        };

        entity.on('pointerup', endDrag);
        entity.on('pointerupoutside', endDrag);

        entity.on('globalpointermove', (e) => {
            if (entity.destroyed) return;
            if (dragging && !demolishMode) {
                let rawX = e.data.global.x + dragOffset.x;
                let rawY = e.data.global.y + dragOffset.y;

                let bestSupport = null;
                let targetElevation = 0;

                // Instead of using rawX/rawY (the dangling feet of the sprite),
                // we fire the collision check directly from the tip of your mouse pointer!
                const basePoint = new PIXI.Point(e.data.global.x, e.data.global.y);

                entityLayer.children.forEach(other => {
                    if (other === entity || !other.type || demolishMode || !other.physicalHeight || !other.interactive) return;

                    const localPoint = other.toLocal(basePoint);

                    if (other.hitArea && other.hitArea.contains(localPoint.x, localPoint.y)) {
                        const isPolygon = other.hitArea instanceof PIXI.Polygon;
                        const roofY = other.y - other.physicalHeight;

                        // Keep the height check intact so things don't clip through the floor
                        if (isPolygon || rawY <= roofY + 60) {
                            const elevationHere = (other.elevation || 0) + other.physicalHeight;
                            if (elevationHere > targetElevation) {
                                targetElevation = elevationHere;
                                bestSupport = other;
                            }
                        }
                    }
                });


                // Link the object to its new parent
                entity.supportedBy = bestSupport;
                entity.elevation = targetElevation;

                // Logic Projection
                let adjustedFloorY = rawY + targetElevation;
                const cart = toCart(rawX, adjustedFloorY);
                entity.gridX = cart.x; entity.gridY = cart.y;

                // Visual Updates
                const logicalPos = toIso(entity.gridX, entity.gridY);
                entity.baseY = logicalPos.y;
                entity.x = rawX;
                entity.y = rawY;

                // Claw logic
                claw.x = entity.x; claw.baseY = entity.baseY;
                if (claw.mode === 'manual_dropping') claw.targetY = entity.y - entity.grabOffset;
                else claw.y = entity.y - entity.grabOffset;

                document.getElementById('coords-display').innerText = `X: ${entity.gridX.toFixed(1)} | Y: ${entity.gridY.toFixed(1)}`;
            }
        });

        return entity;
    }

    // --- INITIAL SCENE SETUP ---
    const bannerItem = BUILD_CATALOG.find(i => i.id === 'banner');
    window.createDraggable(bannerItem.textureData, 2.5, 2.5, bannerItem.id, bannerItem.scale, bannerItem.grabOffset, true, bannerItem.hitbox);

    const arcade = BUILD_CATALOG.find(i => i.id === 'arcade');
    window.createDraggable(arcade.textureData, -1.8, 9.5, arcade.id, arcade.scale, arcade.grabOffset, false, arcade.hitbox);
    window.createDraggable(arcade.textureData, 1.1, -18.7, arcade.id, arcade.scale, arcade.grabOffset, false, arcade.hitbox);

    const chill_area = BUILD_CATALOG.find(i => i.id === 'chill_area');
    window.createDraggable(chill_area.textureData, 3.4, 14, chill_area.id, chill_area.scale, chill_area.grabOffset, false, chill_area.hitbox);
    window.createDraggable(chill_area.textureData, 1.2, -11.3, chill_area.id, chill_area.scale, chill_area.grabOffset, false, chill_area.hitbox);


    const ping_pong = BUILD_CATALOG.find(i => i.id === 'ping-pong');
    window.createDraggable(ping_pong.textureData, 6.2, -8.1, ping_pong.id, ping_pong.scale, ping_pong.grabOffset, false, ping_pong.hitbox);
    window.createDraggable(ping_pong.textureData, 12.1, -8.1, ping_pong.id, ping_pong.scale, ping_pong.grabOffset, false, ping_pong.hitbox);

    const coffee = BUILD_CATALOG.find(i => i.id === 'coffee');
    window.createDraggable(coffee.textureData, -7.1, -19.2, coffee.id, coffee.scale, coffee.grabOffset, false, coffee.hitbox);
    window.createDraggable(coffee.textureData, 5.8, -19.3, coffee.id, coffee.scale, coffee.grabOffset, false, coffee.hitbox);

    const water = BUILD_CATALOG.find(i => i.id === 'water');
    window.createDraggable(water.textureData, -11.1, -21.0, water.id, water.scale, water.grabOffset, false, water.hitbox);
    window.createDraggable(water.textureData, -3.7, 14.9, water.id, water.scale, water.grabOffset, false, water.hitbox);


    const plants = BUILD_CATALOG.find(i => i.id === 'plants');
    window.createDraggable(plants.textureData, -18.1, -20.3, plants.id, plants.scale, plants.grabOffset, false, plants.hitbox);
    window.createDraggable(plants.textureData, 9.5, -20.2, plants.id, plants.scale, plants.grabOffset, false, plants.hitbox);


    const conference = BUILD_CATALOG.find(i => i.id === 'conference');
    window.createDraggable(conference.textureData, -14.1, -13.7, conference.id, conference.scale, conference.grabOffset, false, conference.hitbox);

    const compEast = BUILD_CATALOG.find(i => i.id === 'computer');
    const maleChar = BUILD_CATALOG.find(i => i.id === 'male_char');
    const femaleChar = BUILD_CATALOG.find(i => i.id === 'female_char');

    if (compEast && maleChar && femaleChar) {
        const startX = -18.5;
        const startY = 9.6;
        const ySpacing = 4.5; // Distance between computers going UP

        const numRows = 3;    // Number of aisles
        const xSpacing = 4.0; // Distance between the aisles

        // Adjust these to perfectly seat the new 3.0 scale humans
        const humanOffsetX = 0.5;
        const humanOffsetY = 0;

        for (let row = 0; row < numRows; row++) {
            const currentX = startX + (row * xSpacing);

            for (let i = 0; i < 4; i++) {
                const currentY = startY - (i * ySpacing);

                // 1. Spawn the Computer
                window.createDraggable(
                    compEast.textureData,
                    currentX,
                    currentY,
                    compEast.id,
                    compEast.scale,
                    compEast.grabOffset,
                    false,
                    compEast.hitbox
                );

                // 2. 🔥 Randomly choose between Male and Female!
                const selectedChar = Math.random() > 0.5 ? maleChar : femaleChar;

                // 3. 🔥 Generate the array of 4 animation frames for the North-West Idle state
                const nwAnimTextures = [0, 1, 2, 3].map(frameNum =>
                    `${selectedChar.animBase}/idle/north-west/frame_00${frameNum}.png`
                );

                // 4. Spawn the Animated Human
                window.createDraggable(
                    nwAnimTextures,
                    currentX + humanOffsetX,
                    currentY + humanOffsetY,
                    selectedChar.id,
                    selectedChar.scale,
                    selectedChar.grabOffset || 30,
                    false,
                    selectedChar.hitbox
                );
            }
        }
    }

    // --- 10. GLOBAL TICKER FOR TRUE Z-SORTING & CLAW PHYSICS ---
    app.ticker.add(() => {

        // 🔥 THE HTML CONTEXT UI & BOUNDING BOX ENGINE
        const htmlBox = document.getElementById('asset-bounding-box');
        const htmlMenu = document.getElementById('asset-context-menu');

        if (window.selectedEntity && !window.selectedEntity.destroyed) {

            window.selectedEntity.updateTransform();

            let bx, by, bw, bh;

            // 🔥 THE FIX: Use the precise hitArea to calculate the box size instead of visual bounds
            if (window.selectedEntity.hitArea && window.selectedEntity.hitArea instanceof PIXI.Rectangle) {
                const ha = window.selectedEntity.hitArea;
                const wt = window.selectedEntity.worldTransform;

                // Map the local hitArea corners to global screen coordinates
                const tlX = wt.a * ha.x + wt.c * ha.y + wt.tx;
                const tlY = wt.b * ha.x + wt.d * ha.y + wt.ty;
                const brX = wt.a * (ha.x + ha.width) + wt.c * (ha.y + ha.height) + wt.tx;
                const brY = wt.b * (ha.x + ha.width) + wt.d * (ha.y + ha.height) + wt.ty;

                bx = Math.min(tlX, brX);
                by = Math.min(tlY, brY);
                bw = Math.abs(brX - tlX);
                bh = Math.abs(brY - tlY);
            } else {
                // Fallback to standard visual bounds if no custom rectangular hitbox exists
                const b = window.selectedEntity.getBounds();
                bx = b.x;
                by = b.y;
                bw = b.width;
                bh = b.height;
            }

            // Prevent the "0-size glitch" when dropping items
            if (bw < 10 || bh < 10) {
                htmlBox.style.display = 'none';
                htmlMenu.style.display = 'none';
                return;
            }

            const pad = 10;
            bx = bx - pad;
            by = by - pad;
            bw = bw + (pad * 2);
            bh = bh + (pad * 2);

            // 🟩 MAP THE HTML BOX
            htmlBox.style.display = 'block';
            htmlBox.style.left = bx + 'px';
            htmlBox.style.top = by + 'px';
            htmlBox.style.width = bw + 'px';
            htmlBox.style.height = bh + 'px';

            // 💻 MAP THE HTML MENU (Glued to the right side of the box)
            htmlMenu.style.display = 'flex';
            htmlMenu.style.left = (bx + bw + 15) + 'px';
            htmlMenu.style.top = by + 'px';

        } else {
            htmlBox.style.display = 'none';
            htmlMenu.style.display = 'none';
        }

        // PASS 1: Base Floor Sorting
        entityLayer.children.forEach(c => {
            if (c.baseY !== undefined) {
                c.zIndex = c.baseY;
            }
        });

        // PASS 2: Linked Stacking
        entityLayer.children.forEach(c => {
            // If this object is sitting on a machine, force it to render IN FRONT of that machine!
            if (c.supportedBy && c.supportedBy.zIndex !== undefined) {
                // We add a tiny fraction of its own baseY so multiple humans 
                // standing on the SAME belt will still sort correctly amongst themselves!
                c.zIndex = c.supportedBy.zIndex + 10 + (c.baseY * 0.001);
            }
        });

        entityLayer.sortChildren(); // Force engine to apply new layers

        // (Keep your existing claw physics below...)
        if (claw.visible && claw.mode !== 'idle') {
            claw.zIndex = Math.floor(claw.baseY + 1000);
            chain.zIndex = Math.floor(claw.baseY + 1000);

            if (claw.mode === 'manual_dropping') {
                claw.y += (claw.targetY - claw.y) * 0.6;
                if (Math.abs(claw.targetY - claw.y) < 5) { claw.y = claw.targetY; claw.mode = 'manual_holding'; claw.texture = closedClawTex; }
            } else if (claw.mode === 'manual_retracting') {
                claw.y += (claw.targetY - claw.y) * 0.3;
                if (claw.y < -100) { claw.mode = 'idle'; claw.visible = false; chain.clear(); }
            }

            if (claw.visible) {
                chain.clear(); const chainX = claw.x - 12;
                for (let cy = -300; cy < claw.y - 280; cy += 14) {
                    chain.beginFill(0xaaaaaa); chain.drawRect(chainX - 3, cy, 6, 10);
                    chain.beginFill(0x1a1a1a); chain.drawRect(chainX - 1, cy + 2, 2, 6); chain.endFill();
                    chain.beginFill(0x333333); chain.drawRect(chainX - 5, cy + 8, 10, 4);
                    chain.beginFill(0x777777); chain.drawRect(chainX - 5, cy + 8, 10, 2); chain.endFill();
                }
            }
        }
    });
    resizeApp();
});

// ==========================================
// 🔥 ASYNC TRUE-RETRO SCREENSHOT ENGINE
// ==========================================
let generatedImageData = null;

window.captureFactoryScreenshot = async function () {
    try {
        let bounds = entityLayer.getBounds();

        //FORCE THE CAMERA TO INCLUDE THE BANNER
        backgroundLayer.children.forEach(c => {
            if (c.type === 'banner') {
                const bannerBounds = c.getBounds();
                // Stretch the camera's view box upward to encompass the logo
                bounds.x = Math.min(bounds.x, bannerBounds.x);
                bounds.y = Math.min(bounds.y, bannerBounds.y);
                bounds.width = Math.max(bounds.x + bounds.width, bannerBounds.x + bannerBounds.width) - bounds.x;
                bounds.height = Math.max(bounds.y + bounds.height, bannerBounds.y + bannerBounds.height) - bounds.y;
            }
        });

        const padding = 120;
        const cropRegion = new PIXI.Rectangle(
            bounds.x - padding,
            bounds.y - padding,
            bounds.width + padding * 2,
            bounds.height + padding * 2
        );

        const croppedTexture = app.renderer.generateTexture(app.stage, {
            region: cropRegion,
            resolution: 0.3
        });

        const rawBase64 = await app.renderer.extract.base64(croppedTexture);
        croppedTexture.destroy();

        // 2. 🔥 BAKE IN THE PIXELS & CRT EFFECTS
        generatedImageData = await new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                const scaleFactor = 3;
                canvas.width = img.width * scaleFactor;
                canvas.height = img.height * scaleFactor;

                ctx.imageSmoothingEnabled = false;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

                ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                for (let y = 0; y < canvas.height; y += 4) { // 2px line, 2px gap
                    ctx.fillRect(0, y, canvas.width, 2);
                }

                const gradient = ctx.createRadialGradient(
                    canvas.width / 2, canvas.height / 2, canvas.width * 0.4,
                    canvas.width / 2, canvas.height / 2, canvas.width
                );
                gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0.75)');
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL('image/png'));
            };
            img.src = rawBase64;
        });

    } catch (e) {
        console.error("Renderer extract failed:", e);
        return;
    }

    const screen = document.getElementById('monitor-screen-capture');

    const existingImg = screen.querySelector('.capture-result');
    if (existingImg) existingImg.remove();

    const img = new Image();
    img.src = generatedImageData;
    img.className = 'capture-result';

    screen.insertBefore(img, screen.firstChild);
    window.toggleMonitor('mon-design');
};

window.downloadScreenshot = function () {
    if (!generatedImageData) return;
    const link = document.createElement('a');
    link.download = `IBEX-Factory-Design-${Date.now()}.png`;
    link.href = generatedImageData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// DEFINE GLOBALLY
window.myLocalWorker = null;
window.networkPlayers = {};
window.ws = null; // <-- ADD THIS

window.isWalkable = function (x, y) {
    // 1. Main Rectangular Box
    if (x < -22 || x > 15 || y < -22 || y > 18) return false;

    // 2. The Slanted Cutoffs (Geometry rules)
    if (y > x + 32.5) return false;      // Left Slant
    if (x + y > 22.5) return false;      // Right Slant
    if (x - y > 32.5) return false;      // Top-Right Slant

    // 3. Physical Object Collision
    if (window.checkCollision && window.checkCollision(x, y)) return false;

    return true;
};

// 🔥 DELAY NETWORK UNTIL ENGINE IS BUILT AND PLAYER IS SELECTED
window.addEventListener('load', () => {

    let chosenCharId = 'male_char'; // Default choice

    // 1. UI Selection Logic
    const maleCard = document.getElementById('card-male_char');
    const femaleCard = document.getElementById('card-female_char');

    if (maleCard && femaleCard) {
        maleCard.addEventListener('click', () => {
            chosenCharId = 'male_char';
            maleCard.style.borderColor = '#00ff00';
            femaleCard.style.borderColor = 'gray';
        });

        femaleCard.addEventListener('click', () => {
            chosenCharId = 'female_char';
            femaleCard.style.borderColor = '#00ff00';
            maleCard.style.borderColor = 'gray';
        });
    }

    // 2. Start Game Button
    const joinBtn = document.getElementById('join-game-btn');
    if (joinBtn) {
        joinBtn.addEventListener('click', () => {

            // 🔥 THE FIX: Remember our name across page refreshes!
            let finalName = sessionStorage.getItem('ibex_playerName');
            if (!finalName) {
                finalName = generateRandomFactoryName();
                sessionStorage.setItem('ibex_playerName', finalName);
            }

            // Hide the screen
            document.getElementById('character-selection').style.display = 'none';

            // NOW WE CONNECT TO THE SERVER
            connectToServer(chosenCharId, finalName);
        });
    }

    // 🔥 THE FIX: Instantly kill the connection when you hit the refresh button
    window.addEventListener('beforeunload', () => {
        if (window.ws && window.ws.readyState === WebSocket.OPEN) {
            window.ws.close();
        }
    });

    // 3. The Deferred Network Engine
    function connectToServer(charId, playerName) {
        window.ws = new WebSocket(`ws://${window.location.host}/ws`);

        window.ws.onopen = () => {
            // 🔥 1. Tell the server our name and character choice!
            window.ws.send(JSON.stringify({
                type: 'join',
                payload: { name: playerName, avatar: charId }
            }));

            window.myLocalWorker = spawnMultiplayerWorker(0, 0, false, charId, playerName);
        };

        window.ws.onmessage = (event) => {
            const msg = JSON.parse(event.data);

            if (msg.type === 'currentPlayers') {
                for (let id in msg.payload) {
                    const p = msg.payload[id];
                    // 🔥 THE FIX: Don't spawn a ghost if the incoming name is OUR name!
                    if (!window.networkPlayers[id] && p.name !== playerName) {
                        window.networkPlayers[id] = spawnMultiplayerWorker(p.gridX, p.gridY, true, p.avatar, p.name);
                    }
                }
            }
            else if (msg.type === 'playerJoined') {
                const p = msg.payload;
                // 🔥 THE FIX: Ignore the server echoing our own join event!
                if (!window.networkPlayers[p.id] && p.name !== playerName) {
                    window.networkPlayers[p.id] = spawnMultiplayerWorker(p.gridX, p.gridY, true, p.avatar, p.name);
                }
            }
            else if (msg.type === 'playerMoved') {
                const p = msg.payload;
                let ghost = window.networkPlayers[p.id];

                // If it's us, "ghost" will be undefined, and it will safely do nothing!
                if (ghost) {
                    const newPos = toIso(p.gridX, p.gridY);
                    ghost.gridX = p.gridX;
                    ghost.gridY = p.gridY;
                    ghost.x = newPos.x;
                    ghost.y = newPos.y - (ghost.elevation || 0);

                    // Trigger the ghost's animation and rotation
                    updateWorkerAnimation(ghost, p.dir || 'south-east', 'walking');

                    // Reset the idle timer for the ghost
                    if (ghost.idleTimer) clearTimeout(ghost.idleTimer);
                    ghost.idleTimer = setTimeout(() => {
                        if (!ghost.destroyed) updateWorkerAnimation(ghost, p.dir || 'south-east', 'idle');
                    }, 300);
                }
            }
            else if (msg.type === 'playerLeft') {
                if (window.networkPlayers[msg.payload]) {
                    window.networkPlayers[msg.payload].destroy({ children: true });
                    delete window.networkPlayers[msg.payload];
                }
            }
        };
    }

    // 🔥 THE DEFINITIVE ANIMATION SWAPPER (With Smart Direction Mapping)
    function updateWorkerAnimation(worker, direction, state) {
        if (!worker || worker.destroyed) return;

        const item = BUILD_CATALOG.find(i => i.id === (worker.type || worker.id));
        if (!item || !item.animBase) return;

        // 🔥 THE FIX: Smart Direction Mapping
        // Check if the requested direction actually exists for this character
        let safeDirection = direction;
        const availableDirs = item.animatedDirs || [];

        if (availableDirs.length > 0 && !availableDirs.includes(safeDirection)) {
            // Map straight directions to the closest available diagonal
            if (safeDirection === 'north') safeDirection = 'north-west';
            else if (safeDirection === 'south') safeDirection = 'south-west';
            else if (safeDirection === 'east') safeDirection = 'south-east';
            else if (safeDirection === 'west') safeDirection = 'south-west';

            // Failsafe: if it somehow STILL doesn't exist, just use their default first direction
            if (!availableDirs.includes(safeDirection)) {
                safeDirection = availableDirs[0];
            }
        }

        // Prevent reloading if we are already playing this exact state and direction
        if (worker.currentDir === safeDirection && worker.currentState === state) return;

        worker.currentDir = safeDirection;
        worker.currentState = state;

        let frames = [
            `${item.animBase}/${state}/${safeDirection}/frame_000.png`,
            `${item.animBase}/${state}/${safeDirection}/frame_001.png`,
            `${item.animBase}/${state}/${safeDirection}/frame_002.png`,
            `${item.animBase}/${state}/${safeDirection}/frame_003.png`
        ];

        let newTextures = frames.map(p =>
            PIXI.utils.TextureCache[p] || (typeof textures !== 'undefined' ? textures[p] : undefined)
        ).filter(t => t !== undefined);

        let usedFallback = false;

        if (newTextures.length === 0) {
            let fallbackFrames = [
                `${item.animBase}/${safeDirection}/frame_000.png`,
                `${item.animBase}/${safeDirection}/frame_001.png`,
                `${item.animBase}/${safeDirection}/frame_002.png`,
                `${item.animBase}/${safeDirection}/frame_003.png`
            ];
            newTextures = fallbackFrames.map(p =>
                PIXI.utils.TextureCache[p] || (typeof textures !== 'undefined' ? textures[p] : undefined)
            ).filter(t => t !== undefined);
            usedFallback = true;
        }

        if (newTextures.length > 0) {
            worker.textures = newTextures;
            worker.animationSpeed = 0.1;

            if (state === 'idle' && usedFallback) {
                worker.gotoAndStop(0);
            } else {
                worker.play();
            }
        }
    }

    // 🔥 3. THE MASTER GAME LOOP (Movement, Camera, Animation, Network)
    let lastNetworkBroadcast = 0;
    const NETWORK_TICK_RATE = 100; // Broadcast coordinates every 100ms
    const MOVEMENT_SPEED = 0.08; // Tweak this decimal to make them walk faster or slower!

    app.ticker.add(() => {

        // ==========================================
        // A. SMOOTH 8-WAY LOCAL MOVEMENT
        // ==========================================
        if (window.myLocalWorker && !window.myLocalWorker.destroyed && !window.myLocalWorker.isDemolishing) {
            let dx = 0;
            let dy = 0;

            if (window.keys.w) dy -= MOVEMENT_SPEED;
            if (window.keys.s) dy += MOVEMENT_SPEED;
            if (window.keys.a) dx -= MOVEMENT_SPEED;
            if (window.keys.d) dx += MOVEMENT_SPEED;

            // Diagonal Normalization
            if (dx !== 0 && dy !== 0) {
                dx *= 0.707;
                dy *= 0.707;
            }

            const isMoving = dx !== 0 || dy !== 0;
            let newDir = window.myLocalWorker.currentDir || 'south-east';

            if (isMoving) {
                // 1. Calculate where they WANT to go
                let nextX = window.myLocalWorker.gridX + dx;
                let nextY = window.myLocalWorker.gridY + dy;

                // Test X and Y independently for "wall sliding"
                let canMoveX = !window.checkCollision(nextX, window.myLocalWorker.gridY);
                let canMoveY = !window.checkCollision(window.myLocalWorker.gridX, nextY);

                // Diagonal Corner-Clipping Protection
                if (canMoveX && canMoveY) {
                    if (window.checkCollision(nextX, nextY)) {
                        canMoveX = false;
                        canMoveY = false;
                    }
                }

                if (!canMoveX) nextX = window.myLocalWorker.gridX;
                if (!canMoveY) nextY = window.myLocalWorker.gridY;

                const MIN_GRID_X = -22;
                const MAX_GRID_X = 15;
                const MIN_GRID_Y = -22;
                const MAX_GRID_Y = 18;

                if (nextX < MIN_GRID_X) nextX = MIN_GRID_X;
                if (nextX > MAX_GRID_X) nextX = MAX_GRID_X;
                if (nextY < MIN_GRID_Y) nextY = MIN_GRID_Y;
                if (nextY > MAX_GRID_Y) nextY = MAX_GRID_Y;

                // 3. Apply the approved, safe coordinates to the live character
                window.myLocalWorker.gridX = nextX;
                window.myLocalWorker.gridY = nextY;

                const pos = toIso(window.myLocalWorker.gridX, window.myLocalWorker.gridY);
                window.myLocalWorker.x = pos.x;
                window.myLocalWorker.y = pos.y - (window.myLocalWorker.elevation || 0);

                // 🔥 THE 8-WAY ISOMETRIC COMPASS
                if (dx < 0 && dy < 0) newDir = 'north';               // W + A (Up)
                else if (dx > 0 && dy > 0) newDir = 'south';          // S + D (Down)
                else if (dx > 0 && dy < 0) newDir = 'east';           // W + D (Right)
                else if (dx < 0 && dy > 0) newDir = 'west';           // S + A (Left)
                else if (dy < 0) newDir = 'north-east';               // W Only
                else if (dy > 0) newDir = 'south-west';               // S Only
                else if (dx < 0) newDir = 'north-west';               // A Only
                else if (dx > 0) newDir = 'south-east';               // D Only

                // Play walking animation
                updateWorkerAnimation(window.myLocalWorker, newDir, 'walking');

                // Throttle Network Broadcasts
                const now = Date.now();
                if (window.ws && window.ws.readyState === WebSocket.OPEN && now - lastNetworkBroadcast > NETWORK_TICK_RATE) {
                    window.ws.send(JSON.stringify({
                        type: 'move',
                        payload: { gridX: window.myLocalWorker.gridX, gridY: window.myLocalWorker.gridY, dir: newDir }
                    }));
                    lastNetworkBroadcast = now;
                }

            } else {
                // Play idle animation facing the last direction they moved
                updateWorkerAnimation(window.myLocalWorker, newDir, 'idle');
            }


            // ==========================================
            // B. CAMERA FOLLOW
            // ==========================================
            const lerp = 0.1;
            const targetX = (app.screen.width / 2) - window.myLocalWorker.x;
            const targetY = (app.screen.height / 2) - window.myLocalWorker.y;

            app.stage.x += (targetX - app.stage.x) * lerp;
            app.stage.y += (targetY - app.stage.y) * lerp;
        }

        // ==========================================
        // C. CONTINUOUS DEPTH SORTING (Prevents walking through walls)
        // ==========================================
        if (typeof entityLayer !== 'undefined' && entityLayer.children) {
            entityLayer.children.sort((a, b) => (a.y || 0) - (b.y || 0));
        }

        // ==========================================
        // D. HTML NAME TAG TRACKER
        // ==========================================
        const canvasBounds = app.view.getBoundingClientRect();
        entityLayer.children.forEach(c => {
            if (c.nameTag && !c.destroyed) {
                const screenPos = c.getGlobalPosition();
                c.nameTag.style.display = 'block';
                c.nameTag.style.left = (screenPos.x + canvasBounds.left) + 'px';
                c.nameTag.style.top = (screenPos.y + canvasBounds.top - 180) + 'px';
            }
        });
    });
});

let activeWorkforce = [];
let activeTimeouts = [];

document.addEventListener('DOMContentLoaded', () => {
    const fteInput = document.getElementById('fte-input');
    const budgetInput = document.getElementById('budget-input');
    const roiPanel = document.getElementById('roi-panel');

    // Elements to update
    const roiSavings = document.getElementById('roi-savings');
    const roiHires = document.getElementById('roi-hires');
    const roiHours = document.getElementById('roi-hours');

    function calculateROI() {
        const fteCount = parseFloat(fteInput.value) || 0;
        // Strip commas for math
        const avgBudget = parseFloat(budgetInput.value.replace(/,/g, '')) || 0;

        if (fteCount > 0) {
            // Show the panel
            roiPanel.classList.add('visible');

            // --- THE MATH ---
            // Savings (70% based on your HTML note)
            const totalSavings = fteCount * avgBudget * 0.70;
            // Additional Hires (Total Savings / Original Budget)
            const extraHires = Math.floor(totalSavings / avgBudget);
            // Labor Hours (174 per month)
            const totalHours = fteCount * 174;

            // Update UI
            roiSavings.innerText = `$${totalSavings.toLocaleString()}`;
            roiHires.innerText = extraHires;
            roiHours.innerText = totalHours.toLocaleString();
        } else {
            roiPanel.classList.remove('visible');
        }
    }

    fteInput.addEventListener('input', function (e) {
        const realCount = parseInt(e.target.value) || 0;
        const spawnCount = Math.min(realCount, 30);

        // --- PART 1: INSTANT ROI MATH ---
        const budgetVal = document.getElementById('budget-input').value || "25,000";
        const avgBudget = parseFloat(budgetVal.replace(/,/g, '')) || 0;

        if (realCount > 0) {
            roiPanel.classList.add('visible');
            document.getElementById('roi-savings').innerText = `$${(realCount * avgBudget * 0.70).toLocaleString()}`;
            document.getElementById('roi-hires').innerText = Math.floor((realCount * avgBudget * 0.70) / avgBudget);
            document.getElementById('roi-hours').innerText = (realCount * 174).toLocaleString();
        } else {
            roiPanel.classList.remove('visible');
        }

        // --- PART 2: THE WAVE SPAWNING ---

        // A. CLEAR EVERYTHING: Old workers and pending timeouts
        activeWorkforce.forEach(obj => {
            if (obj && obj.destroy) obj.destroy({ children: true });
        });
        activeWorkforce = [];

        activeTimeouts.forEach(t => clearTimeout(t));
        activeTimeouts = [];

        const cObj = BUILD_CATALOG.find(i => i.id === 'computer');
        const mChar = BUILD_CATALOG.find(i => i.id === 'male_char');
        const fChar = BUILD_CATALOG.find(i => i.id === 'female_char');

        if (cObj && mChar && fChar && spawnCount > 0) {
            const startX = -18.5;
            const startY = 9.6;
            const ySpacing = 5.5;
            const xSpacing = 4.0;
            const maxItemsPerRow = 4;
            const humanOffsetX = 0.5;

            for (let i = 0; i < spawnCount; i++) {
                // We wrap the spawning in a Timeout to create the "Wave"
                const tId = setTimeout(() => {
                    const row = Math.floor(i / maxItemsPerRow);
                    const col = i % maxItemsPerRow;
                    const currentX = startX + (row * xSpacing);
                    const currentY = startY - (col * ySpacing);

                    // 1. Create Computer
                    const computer = window.createDraggable(
                        cObj.textureData, currentX, currentY, cObj.id, cObj.scale, cObj.grabOffset, false, cObj.hitbox
                    );

                    // 2. Setup Human
                    const selectedChar = Math.random() > 0.5 ? mChar : fChar;
                    const nwAnimTextures = [0, 1, 2, 3].map(f =>
                        `${selectedChar.animBase}/idle/north-west/frame_00${f}.png`
                    );

                    // 3. Create Human
                    const human = window.createDraggable(
                        nwAnimTextures, currentX + humanOffsetX, currentY, selectedChar.id, selectedChar.scale, selectedChar.grabOffset || 30, false, selectedChar.hitbox
                    );

                    // 4. Initial Alpha for Fade
                    computer.alpha = 0;
                    human.alpha = 0;

                    // 5. Run Fade Animation
                    const fadeSpeed = 0.08;
                    const animateFade = () => {
                        if (computer.alpha < 1) {
                            computer.alpha += fadeSpeed;
                            human.alpha += fadeSpeed;
                            requestAnimationFrame(animateFade);
                        } else {
                            computer.alpha = 1;
                            human.alpha = 1;
                        }
                    };
                    animateFade();

                    activeWorkforce.push(computer, human);

                }, i * 80);

                activeTimeouts.push(tId);
            }
        }
    });
    budgetInput.addEventListener('input', calculateROI);

    // Simple Slider Logic
    document.querySelectorAll('.slider-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.slider-option').forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
        });
    });
});