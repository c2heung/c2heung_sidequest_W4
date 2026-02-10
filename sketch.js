/*
Week 4 — Example 4: Playable Maze (JSON + Level class + Player class)
Course: GBDA302
Instructors: Dr. Karen Cochrane and David Han
Date: Feb. 5, 2026

This is the "orchestrator" file:
- Loads JSON levels (preload)
- Builds Level objects
- Creates/positions the Player
- Handles input + level switching

It is intentionally light on "details" because those are moved into:
- Level.js (grid + drawing + tile meaning)
- Player.js (position + movement rules)

Based on the playable maze structure from Example 3
*/

const TS = 32;

// Raw JSON data (from levels.json).
let levelsData;

// Array of Level instances.
let levels = [];

// Current level index.
let li = 0;

// Player instance (tile-based).
let player;

// Win state
let hasWon = false;
// Show start screen until dismissed
let showStart = true;

function preload() {
  // Ensure level data is ready before setup runs.
  levelsData = loadJSON("levels.json");
}

function setup() {
  /*
  Convert raw JSON grids into Level objects.
  levelsData.levels is an array of 2D arrays. 
  */
  levels = levelsData.levels.map((grid) => new Level(copyGrid(grid), TS));

  // Create a player.
  player = new Player(TS);

  // Load the first level (sets player start + canvas size).
  loadLevel(0);

  noStroke();
  textFont("sans-serif");
  textSize(14);
}

function draw() {
  background(240);

  // Start screen
  if (showStart) {
    drawStartScreen();
    return;
  }

  // If won, show win screen instead of normal gameplay
  if (hasWon) {
    drawWinScreen();
    return;
  }

  // Draw current level then player on top.
  levels[li].draw();
  player.draw();
  drawHUD();

  // If player just arrived on a tile this frame, handle pickups/gates
  if (player.arrivedThisFrame) {
    player.handleArrival(levels[li]);
    // If arrival landed on the goal, trigger win
    if (levels[li].isGoal(player.r, player.c)) {
      hasWon = true;
    }
    // If we haven't won, attempt to continue moving in the same direction
    if (!hasWon) {
      player.tryContinue(levels[li]);
    }
  }
}

function drawHUD() {
  // Left side: control hint
  textAlign(LEFT);
  fill(0);
  text("WASD/arrow keys to move", 10, 16);

  // Right side: gate count
  textAlign(RIGHT);
  fill(0);
  const gatesRemaining = 3 - player.gatesPassed;
  text(`Gates: ${gatesRemaining}/3`, width - 10, 16);
}

function drawStartScreen() {
  background(20, 20, 40);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(28);
  text(
    "Collect the keys to unlock the gates and reach the goal",
    width / 2,
    height / 2 - 20,
  );
  textSize(16);
  text("Press any key to begin", width / 2, height / 2 + 30);
  // reset alignment and size for HUD
  textAlign(LEFT);
  textSize(14);
}

function drawWinScreen() {
  // Semi-transparent overlay
  fill(0, 0, 0, 100);
  rect(0, 0, width, height);

  // Win text
  fill(255, 215, 0);
  textAlign(CENTER, CENTER);
  textSize(48);
  text("YOU WIN!", width / 2, height / 2 - 60);

  // Restart instruction
  fill(255);
  textSize(24);
  text("Press SPACE to restart", width / 2, height / 2 + 40);

  // Reset text alignment
  textAlign(LEFT);
  textSize(14);
}

function keyPressed() {
  // If showing the start screen, dismiss it on any key.
  if (showStart) {
    showStart = false;
    return;
  }

  /*
  If player has won, only respond to SPACE to restart
  */
  if (hasWon) {
    if (key === " ") {
      restartGame();
    }
    return;
  }

  /*
  Convert key presses into a movement direction. (WASD + arrows)
  */
  let dr = 0;
  let dc = 0;

  if (keyCode === LEFT_ARROW || key === "a" || key === "A") dc = -1;
  else if (keyCode === RIGHT_ARROW || key === "d" || key === "D") dc = 1;
  else if (keyCode === UP_ARROW || key === "w" || key === "W") dr = -1;
  else if (keyCode === DOWN_ARROW || key === "s" || key === "S") dr = 1;
  else return; // not a movement key

  // Try to move. If blocked, nothing happens.
  player.tryMove(levels[li], dr, dc);
}

// ----- Level switching -----

function loadLevel(idx) {
  li = idx;

  const level = levels[li];

  // Reset player state for new level
  player.resetKey();

  // Place player at the level's start tile (2), if present.
  if (level.start) {
    player.setCell(level.start.r, level.start.c);
  } else {
    // Fallback spawn: top-left-ish (but inside bounds).
    player.setCell(1, 1);
  }

  // Ensure movement state is fully reset when loading a level.
  player.moving = false;
  player.dirR = 0;
  player.dirC = 0;
  player.arrivedThisFrame = false;

  // Ensure the canvas matches this level's dimensions.
  resizeCanvas(level.pixelWidth(), level.pixelHeight());
}

function restartGame() {
  // Reset win state and reload the first level
  hasWon = false;
  // Show the start screen again when restarting
  showStart = true;
  loadLevel(0);
}

// ----- Utility -----

function copyGrid(grid) {
  /*
  Make a deep-ish copy of a 2D array:
  - new outer array
  - each row becomes a new array

  Why copy?
  - Because Level constructor may normalize tiles (e.g., replace 2 with 0)
  - And we don’t want to accidentally mutate the raw JSON data object. 
  */
  return grid.map((row) => row.slice());
}
