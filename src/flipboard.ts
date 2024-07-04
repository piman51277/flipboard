const flipCellHTML = `<div class="flip-cell-elem"><div class="flip-cell-front"></div><div class="flip-cell-back"></div></div>`;

/**
 * Waits for a certain amount of time
 * @param {number} ms duration in milliseconds
 * @returns {Promise<void>} Promise
 */
async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class FlipElement {
  private elem: HTMLDivElement;
  public state: boolean;
  public xpos: number;
  public ypos: number;

  /**
   * Constructor, FlipElement
   * @param {HTMLDivElement} parent Parent element
   * @param {number} xpos X position
   * @param {number} ypos Y position
   */
  constructor(parent: HTMLDivElement, xpos: number, ypos: number) {
    this.elem = document.createElement("div");
    this.elem.className = "flip-cell";
    this.elem.innerHTML = flipCellHTML;
    this.state = false;

    this.setPosition(xpos, ypos);
    parent.appendChild(this.elem);
  }

  /**
   * Sets the grid position of the element
   * @param {number} xpos X position
   * @param {number} ypos Y position
   */
  public setPosition(xpos: number, ypos: number): void {
    this.xpos = xpos;
    this.ypos = ypos;
    this.elem.style.gridColumnStart = (this.xpos + 1).toString();
    this.elem.style.gridRowStart = (this.ypos + 1).toString();
  }

  /**
   * Sets the state of the element
   * @param {boolean} state new state
   * @returns {boolean} Whether the state was changed
   */
  public set(state: boolean): boolean {
    const isChanged = state !== this.state;
    this.state = state;
    this.elem.classList.toggle("flip-cell-active", this.state);
    return isChanged;
  }

  /**
   * Flips the state of the element
   */
  public flip(): void {
    this.set(!this.state);
  }

  /**
   * Destroys the element
   */
  public destroy(): void {
    this.elem.remove();
  }
}

export class FlipBoard {
  private parent: HTMLDivElement;
  private board: FlipElement[];
  private width: number;
  private height: number;
  private displayMatrix: boolean[][];
  private gridWidth: number;
  private gridHeight: number;
  private cellSize = 30;

  /**
   * Constructor, FlipBoard
   * @param {HTMLDivElement} parent Parent element
   */
  constructor(parent: HTMLDivElement) {
    this.parent = parent;
    this.setCellSize();
    this.board = [];
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    this.gridWidth = Math.ceil(this.width / this.cellSize);
    this.gridHeight = Math.ceil(this.height / this.cellSize);
    this.displayMatrix = new Array(this.gridWidth)
      .fill(0)
      .map(() => new Array(this.gridHeight).fill(false));

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        this.board.push(new FlipElement(parent, x, y));
      }
    }

    this.reformatCells();

    //bind event on size change
    window.addEventListener("resize", this.reformatCells.bind(this));
  }

  /**
   * Getter for dimensions
   * @returns {[number, number]} [width, height]
   * @readonly
   */
  public get dimensions(): [number, number] {
    return [this.gridWidth, this.gridHeight];
  }

  /**
   * Sets the cell size
   */
  private setCellSize(): void {
    const width = this.parent.clientWidth;
    const height = this.parent.clientHeight;

    //compute the aspect ratio
    const aspect = width / height;

    //if the aspect ratio is not between 0.5 and 2
    //we are dealing with bad users or esoteric devices
    const badAspect = aspect < 0.5 || aspect > 2;

    //we want roughly 1-2k cells
    const widthCand = Math.floor(width / 30);
    const heightCand = Math.floor(height / 30);

    //take whichever is smaller if the aspect ratio is good
    //otherwise, play it safe and take the larger one
    this.cellSize = !badAspect
      ? Math.min(widthCand, heightCand)
      : Math.max(widthCand, heightCand);

    //round down up to nearest 10
    this.cellSize = Math.floor(this.cellSize / 10) * 10;
  }

  /**
   * Reorganizes cells to account for window resize
   */
  private reformatCells(): void {
    //get the width and height of the parent again
    const newWidth = this.parent.clientWidth;
    const newHeight = this.parent.clientHeight;

    this.setCellSize();

    //set the --flip-cell-size css variable
    document.documentElement.style.setProperty(
      "--flip-cell-size",
      `${this.cellSize}px`
    );

    //is there isn't a mismatch, we don't need to do anything
    if (newWidth === this.width && newHeight === this.height) {
      return;
    }

    //compute how many cells we need for the new width and height
    const newGridWidth = Math.ceil(newWidth / this.cellSize);
    const newGridHeight = Math.ceil(newHeight / this.cellSize);

    const oldCellCount = this.gridWidth * this.gridHeight;
    const newCellCount = newGridWidth * newGridHeight;

    //case 1: more cells
    if (oldCellCount < newCellCount) {
      //add new cells
      for (let i = 0; i < newCellCount - oldCellCount; i++) {
        this.board.push(new FlipElement(this.parent, 0, 0));
      }
    }

    //case 2: less cells
    else if (oldCellCount > newCellCount) {
      //remove cells
      for (let i = 0; i < oldCellCount - newCellCount; i++) {
        this.board.pop()?.destroy();
      }
    }

    //update each cell
    for (let i = 0; i < this.board.length; i++) {
      const xPos = i % newGridWidth;
      const yPos = Math.floor(i / newGridWidth);
      this.board[i].setPosition(xPos, yPos);

      //checks whether the cell exists
      const state =
        xPos < this.gridWidth &&
        yPos < this.gridHeight &&
        this.displayMatrix[xPos][yPos];
      this.board[i].set(state);
    }

    //remake the display matrix

    //adjust width
    if (newGridWidth > this.gridWidth) {
      for (let x = this.gridWidth; x < newGridWidth; x++) {
        this.displayMatrix.push(new Array(this.gridHeight).fill(false));
      }
    } else if (newGridWidth < this.gridWidth) {
      this.displayMatrix = this.displayMatrix.slice(0, newGridWidth);
    }

    //adjust height
    if (newGridHeight > this.gridHeight) {
      for (let x = 0; x < newGridWidth; x++) {
        this.displayMatrix[x].push(
          ...new Array(newGridHeight - this.gridHeight).fill(false)
        );
      }
    } else if (newGridHeight < this.gridHeight) {
      for (let x = 0; x < newGridWidth; x++) {
        this.displayMatrix[x] = this.displayMatrix[x].slice(0, newGridHeight);
      }
    }

    //set new values
    this.width = newWidth;
    this.height = newHeight;
    this.gridWidth = newGridWidth;
    this.gridHeight = newGridHeight;
  }

  /**
   * Sets the state of a cell.
   * @param {number} x X position
   * @param {number} y Y position
   * @param {boolean} state New state
   * @param {boolean?} updateMatrix Whether to update the display matrix
   */
  public setOne(
    x: number,
    y: number,
    state: boolean,
    updateMatrix = false
  ): void {
    if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
    this.board[y * this.gridWidth + x].set(state);
    if (updateMatrix) this.displayMatrix[x][y] = state;
  }

  /**
   * Flips the state of a cell
   * @param {number} x X position
   * @param {number} y Y position
   */
  public flipOne(x: number, y: number): void {
    this.setOne(x, y, !this.displayMatrix[x][y], true);
  }

  /**
   * Applies a matrix to the display
   * @param {boolean[][]} matrix Matrix to apply
   * @param {boolean} transposed true if column major
   */
  public setMatrix(matrix: boolean[][], transposed = false): void {
    if (transposed) {
      for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[0].length; x++) {
          this.setOne(x, y, matrix[y][x], true);
        }
      }
    } else {
      for (let x = 0; x < matrix.length; x++) {
        for (let y = 0; y < matrix[0].length; y++) {
          this.setOne(x, y, matrix[x][y], true);
        }
      }
    }
  }

  /**
   * Applies a matrix to the display with a ripple effect
   * @param {boolean[][]} matrix Matrix to apply
   * @param {boolean} transposed true if column major
   */
  public async setMatrixRipple(
    matrix: boolean[][],
    transposed = false
  ): Promise<void> {
    if (transposed) {
      for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[0].length; x++) {
          this.setOne(x, y, matrix[y][x], true);
        }
        await wait(12);
      }
    } else {
      for (let x = 0; x < matrix.length; x++) {
        for (let y = 0; y < matrix[0].length; y++) {
          this.setOne(x, y, matrix[x][y], true);
        }
        await wait(12);
      }
    }
  }
}
