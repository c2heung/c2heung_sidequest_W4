/*
Player.js

A Player stores the avatar position in grid coordinates (row/col)
and knows how to:
- draw itself
- attempt a move (tile-by-tile) with collision rules

The Player does NOT:
- load JSON
- switch levels
Those are "game orchestration" responsibilities that belong in sketch.js. 
*/

class Player {
  constructor(tileSize) {
    this.ts = tileSize;

    // Current grid position (row/col).
    this.r = 0;
    this.c = 0;

    // Movement throttle (so a key press doesn't move 60 tiles per second).
    this.movedAt = 0;
    this.moveDelay = 90; // ms
    // Key collection state
    this.keysCollected = 0;

    // Smooth movement state
    this.moving = false; // true while moving between tiles
    this.targetR = null;
    this.targetC = null;
    this.px = 0; // pixel x position (center)
    this.py = 0; // pixel y position (center)
    this.speed = 130; // pixels per second (faster)
    this.arrivedThisFrame = false;
    // Persistent movement direction: continue moving each tile until blocked
    this.dirR = 0;
    this.dirC = 0;
  }

  // Place the player at a specific grid location (e.g., the level's start).
  setCell(r, c) {
    this.r = r;
    this.c = c;
    // Initialize pixel position to tile center
    this.px = this.c * this.ts + this.ts / 2;
    this.py = this.r * this.ts + this.ts / 2;
    this.arrivedThisFrame = false;
  }

  // Reset key state for a new level
  resetKey() {
    this.keysCollected = 0;
  }

  // Convert grid coords to pixel center (for drawing a circle).
  pixelX() {
    return this.c * this.ts + this.ts / 2;
  }

  pixelY() {
    return this.r * this.ts + this.ts / 2;
  }

  draw() {
    // Update smooth movement (advance towards target if moving)
    this.update();

    // Player as white circle at pixel position
    fill(255);
    circle(this.px, this.py, this.ts * 0.6);
  }

  /*
  Try to move by (dr, dc) tiles.

  Inputs:
  - level: a Level instance, used for bounds + wall collision + goal detection
  - dr/dc: desired movement step, typically -1,0,1

  Returns:
  - true if the move happened
  - false if blocked or throttled
  */
  tryMove(level, dr, dc) {
    // Set persistent direction (will keep moving each tile until blocked).
    this.dirR = dr;
    this.dirC = dc;

    // If already moving, just update direction and return true (queued).
    if (this.moving) return true;

    // Try to start moving immediately.
    const nr = this.r + dr;
    const nc = this.c + dc;

    if (!this.canMoveTo(level, nr, nc)) return false;

    this.targetR = nr;
    this.targetC = nc;
    this.moving = true;
    return true;
  }

  // Check whether a move into (nr,nc) is allowed from current state.
  canMoveTo(level, nr, nc) {
    if (!level.inBounds(nr, nc)) return false;
    if (level.isWall(nr, nc)) return false;
    if (level.isGate(nr, nc) && this.keysCollected === 0) return false;
    return true;
  }

  // Attempt to continue moving in current direction (called after arrival).
  tryContinue(level) {
    if (this.moving) return true;
    if (this.dirR === 0 && this.dirC === 0) return false;

    const nr = this.r + this.dirR;
    const nc = this.c + this.dirC;
    if (!this.canMoveTo(level, nr, nc)) {
      return false;
    }

    this.targetR = nr;
    this.targetC = nc;
    this.moving = true;
    return true;
  }

  // Advance pixel position toward target using p5's deltaTime.
  update() {
    if (!this.moving) return;

    const targetPx = this.targetC * this.ts + this.ts / 2;
    const targetPy = this.targetR * this.ts + this.ts / 2;

    const dx = targetPx - this.px;
    const dy = targetPy - this.py;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) {
      // Already at target
      this.finishMove();
      return;
    }

    // Step size this frame
    const step = this.speed * (deltaTime / 1000);

    if (step >= dist) {
      // Arrive exactly
      this.px = targetPx;
      this.py = targetPy;
      this.finishMove();
    } else {
      // Move along direction vector
      this.px += (dx / dist) * step;
      this.py += (dy / dist) * step;
    }
  }

  // Called when a smooth move completes: update grid coords and handle pickups/gates
  finishMove() {
    // Commit new grid position
    this.r = this.targetR;
    this.c = this.targetC;
    this.moving = false;
    // Signal to the game that we arrived this frame; game will call
    // `handleArrival(level)` so the Player class doesn't need global access.
    this.arrivedThisFrame = true;
  }

  // Handle tile interactions when the game notifies us of arrival.
  handleArrival(level) {
    if (level.isKey(this.r, this.c)) {
      this.keysCollected++;
      level.grid[this.r][this.c] = 0;
    }

    if (level.isGate(this.r, this.c)) {
      this.keysCollected = Math.max(0, this.keysCollected - 1);
      level.grid[this.r][this.c] = 0;
    }
    this.arrivedThisFrame = false;
  }
}
