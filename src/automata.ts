type AutomataNeighborhood = "moore" | "von-neumann";

export class Automata {
  /**
   * 1-8. Value is OR between 1 = s, 2 = b
   */
  private ruleset: number[];

  /**
   * Accepted:
   * - "moore"
   * - "von-neumann"
   */
  private neighborhood: AutomataNeighborhood;
  private grid: boolean[][];

  /**
   * Constructor, Automata
   * @param {number[9]} ruleset Ruleset, each element is OR of 1 = s, 2 = b
   * @param {AutomataNeighborhood} neighborhood "moore" or "von-neumann
   * @param {number} width Width
   * @param {number} height Height
   * @param {boolean} initRand Enable random initialization
   * @param {number} density Density of random initialization
   */
  constructor(
    ruleset: number[],
    neighborhood: AutomataNeighborhood,
    width: number,
    height: number,
    initRand = false,
    density = 0.1
  ) {
    this.ruleset = ruleset;
    this.neighborhood = neighborhood;
    this.grid = new Array(height)
      .fill(0)
      .map(() => new Array(width).fill(false));

    if (initRand) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          //seed density of 10%
          this.grid[y][x] = Math.random() > 1 - density;
        }
      }
    } else {
      const x = Math.floor(width / 2);
      const y = Math.floor(height / 2);

      this.grid[y][x] = true;
    }
  }

  /**
   * Gets the neighborhood of a cell
   * @param {number} x X coordinate
   * @param {number} y Y coordinate
   * @returns {number} number of alive neighbors
   */
  private getNeighbors(x: number, y: number): number {
    const offsets = [
      [0, -1],
      [-1, 0],
      [1, 0],
      [0, 1],
    ];

    if (this.neighborhood === "moore") {
      offsets.push([-1, -1], [1, -1], [-1, 1], [1, 1]);
    }

    let count = 0;
    for (const offset of offsets) {
      const nx = x + offset[0];
      const ny = y + offset[1];

      if (
        nx >= 0 &&
        nx < this.grid[0].length &&
        ny >= 0 &&
        ny < this.grid.length &&
        this.grid[ny][nx]
      ) {
        count++;
      }
    }

    return count;
  }

  /**
   * Updates the grid
   */
  public update(): void {
    const newGrid = new Array(this.grid.length)
      .fill(0)
      .map(() => new Array(this.grid[0].length).fill(false));

    //clear the grid
    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[0].length; x++) {
        newGrid[y][x] = false;
      }
    }

    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[0].length; x++) {
        const neighbors = this.getNeighbors(x, y);

        if (this.grid[y][x]) {
          //survival
          newGrid[y][x] = (this.ruleset[neighbors] & 1) == 1;
        } else {
          //birth
          newGrid[y][x] = (this.ruleset[neighbors] & 2) == 2;
        }
      }
    }

    this.grid = newGrid;
  }

  /**
   * Resizes the grid, preserving content
   * @param {number} width new width
   * @param {number} height new height
   */
  public resize(width: number, height: number): void {
    if (width < 1 || height < 1) return;
    if (width === this.grid[0].length && height === this.grid.length) return;

    if (width < this.grid[0].length) {
      this.grid = this.grid.map((row) => row.slice(0, width));
    } else if (width > this.grid[0].length) {
      for (let i = 0; i < this.grid.length; i++) {
        this.grid[i].push(
          ...new Array(width - this.grid[i].length).fill(false)
        );
      }
    }

    if (height < this.grid.length) {
      this.grid = this.grid.slice(0, height);
    } else if (height > this.grid.length) {
      for (let i = 0; i < height - this.grid.length; i++) {
        this.grid.push(new Array(width).fill(false));
      }
    }
  }

  /**
   * Gets the grid
   * @returns {boolean[][]} The grid
   */
  public get board(): boolean[][] {
    return this.grid;
  }
}
