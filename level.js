/*
Level.js

A Level represents ONE maze grid loaded from levels.json. 

Tile legend: 
0 = floor
1 = wall
2 = start
3 = goal
4 = key
5 = gate

Responsibilities:
- Store the grid
- Find the start tile
- Provide collision/meaning queries (isWall, isGoal, inBounds)
- Draw the tiles (including a goal highlight)
*/

class Level {
  constructor(grid, tileSize) {
    // Store the tile grid and tile size (pixels per tile).
    this.grid = grid;
    this.ts = tileSize;

    // Start position in grid coordinates (row/col).
    // We compute this by scanning for tile value 2.
    this.start = this.findStart();

    // Optional: if you don't want the start tile to remain "special"
    // after you’ve used it to spawn the player, you can normalize it
    // to floor so it draws like floor and behaves like floor.
    if (this.start) {
      this.grid[this.start.r][this.start.c] = 0;
    }
  }

  // ----- Size helpers -----

  rows() {
    return this.grid.length;
  }

  cols() {
    return this.grid[0].length;
  }

  pixelWidth() {
    return this.cols() * this.ts;
  }

  pixelHeight() {
    return this.rows() * this.ts;
  }

  // ----- Semantic helpers -----

  inBounds(r, c) {
    return r >= 0 && c >= 0 && r < this.rows() && c < this.cols();
  }

  tileAt(r, c) {
    // Caller should check inBounds first.
    return this.grid[r][c];
  }

  isWall(r, c) {
    return this.tileAt(r, c) === 1;
  }

  isGoal(r, c) {
    return this.tileAt(r, c) === 3;
  }

  isKey(r, c) {
    return this.tileAt(r, c) === 4;
  }

  isGate(r, c) {
    return this.tileAt(r, c) === 5;
  }

  // ----- Start-finding -----

  findStart() {
    // Scan entire grid to locate the tile value 2 (start).
    for (let r = 0; r < this.rows(); r++) {
      for (let c = 0; c < this.cols(); c++) {
        if (this.grid[r][c] === 2) {
          return { r, c };
        }
      }
    }

    // If a level forgets to include a start tile, return null.
    // (Then the game can choose a default spawn.)
    return null;
  }

  // ----- Drawing -----

  draw() {
    /*
    Draw each tile as a rectangle.

    Visual rules (matches your original logic): 
    - Walls (1): dark teal
    - Everything else: light floor
    - Goal tile (3): add a highlighted inset rectangle
    */
    for (let r = 0; r < this.rows(); r++) {
      for (let c = 0; c < this.cols(); c++) {
        const v = this.grid[r][c];

        // Base tile fill
        // Walls: very light blue; Floors: very dark blue
        if (v === 1) fill(200, 220, 255);
        else fill(10, 10, 40);

        rect(c * this.ts, r * this.ts, this.ts, this.ts);

        // Goal highlight overlay (only on tile 3).
        if (v === 3) {
          noStroke();
          // Distinct green goal with slight transparency
          fill(60, 200, 80, 220);
          rect(c * this.ts + 4, r * this.ts + 4, this.ts - 8, this.ts - 8, 6);
          // Subtle inner highlight
          fill(255, 255, 255, 60);
          rect(c * this.ts + 8, r * this.ts + 8, this.ts - 16, this.ts - 16, 4);
        }

        // Key overlay (tile 4)
        if (v === 4) {
          fill(255, 215, 0);
          circle(
            c * this.ts + this.ts / 2,
            r * this.ts + this.ts / 2,
            this.ts * 0.4,
          );
        }

        // Gate overlay (tile 5)
        if (v === 5) {
          // Bright red gate
          fill(220, 20, 20);
          rect(c * this.ts, r * this.ts, this.ts, this.ts);
          fill(255, 80, 80);
          rect(c * this.ts + 2, r * this.ts + 2, this.ts - 4, this.ts - 4);
        }
      }
    }
  }
}
