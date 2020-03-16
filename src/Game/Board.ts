import { List, Record, RecordOf } from 'immutable';

export type NumThreats = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type CellState = 'OPEN' | 'FLAGGED' | 'UNCERTAIN' | 'NEW' | 'EXPLODED';

export type ICell = {
  readonly state: CellState;
  readonly threats: NumThreats | Mine;
} & Coordinate;

type IImmutableCellFactory = Record.Factory<ICell>;

export const ImmutableCell: IImmutableCellFactory = Record<ICell>({
  state: 'NEW',
  threats: 0,
  col: 0,
  row: 0,
});

export type IImmutableCellRecord = RecordOf<ICell>;

export type Coordinate = {
  readonly col: number;
  readonly row: number;
};

export type GameState =
  | 'PAUSED'
  | 'GAME_OVER'
  | 'INITIALIZED'
  | 'PLAYING'
  | 'NOT_INITIALIZED';

export type IBoard = {
  cols: List<List<IImmutableCellRecord>>;
  state: GameState;
};

export type IImmutableBoardRecord = RecordOf<IBoard>;

export const ImmutableBoard = Record<IBoard>({
  cols: List.of(),
  state: 'NOT_INITIALIZED',
});

export type Level = {
  cols: number;
  rows: number;
  mines: number;
};

export type Mine = 0xff;

export default class Board {
  public get cols(): number {
    return this.board.cols.size;
  }

  public get rows(): number {
    return this.board.cols.get(0)?.size || 0;
  }

  public readonly num: number;

  public readonly board: IImmutableBoardRecord;

  constructor({ cols, rows, mines }: Level) {
    let board: IImmutableBoardRecord = ImmutableBoard();
    this.num = mines;

    for (let col = 0; col < cols; col++) {
      let cells: List<IImmutableCellRecord> = List.of();
      for (let row = 0; row < rows; row++) {
        cells = cells.push(ImmutableCell({ row, col }));
      }
      board = board.set('cols', board.get('cols').push(cells));
    }
    let minesSet = 0;
    do {
      const { row, col }: Coordinate = {
        col: randomInt(cols),
        row: randomInt(rows),
      };
      if (!isMine({ row, col }, board)) {
        board = updateCell(
          board,
          board
            .get('cols')
            .get(col)!
            .get(row)!
            .set('threats', 0xff)
        );
        minesSet++;
      }
    } while (minesSet < mines);

    if (minesSet !== mines) {
      throw new Error(`Set ${minesSet} mines, expected ${mines}`);
    }

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        if (isMine({ col: col, row: row }, board)) {
          continue;
        }
        const cells = board.get('cols').get(col)!;
        const cell = cells.get(row)!;
        board = updateCell(
          board,
          cell.set('threats', countThreats({ row, col }, board))
        );
      }
    }

    this.board = board.set('state', 'INITIALIZED');
  }
}

export function updateCell(
  board: IImmutableBoardRecord,
  newCell: IImmutableCellRecord
): IImmutableBoardRecord {
  const { row, col } = newCell;
  const cols = board.get('cols');
  const cells = cols.get(col)!;
  const newCells = cells.set(row, newCell);
  return board.set('cols', cols.set(col, newCells));
}

export function collectZeroes(
  board: IImmutableBoardRecord,
  p: Coordinate
): Set<IImmutableCellRecord> {
  const visited: Set<IImmutableCellRecord> = new Set();
  const visitor = (cell: IImmutableCellRecord) => {
    if (visited.has(cell)) {
      return;
    }
    visited.add(cell);
    if (cell.threats === 0) {
      visitNeighbours(board, { row: cell.row, col: cell.col }, visitor);
    }
  };

  visitNeighbours(board, p, visitor);
  return visited;
}

export function isMine(p: Coordinate, board: IImmutableBoardRecord): boolean {
  return (
    board
      .get('cols')
      .get(p.col)
      ?.get(p.row)?.threats === 0xff
  );
}

function countThreats(
  p: Coordinate,
  immutableBoard: IImmutableBoardRecord
): NumThreats | Mine {
  let threats: NumThreats = 0;

  if (isMine(p, immutableBoard)) {
    return 0xff;
  }
  visitNeighbours(immutableBoard, p, cell => {
    if (isMine(cell, immutableBoard)) {
      threats++;
    }
  });
  if (threats < 0 || threats > 8) {
    throw new Error(`Unexpected threat number: ${threats}`);
  }

  return threats as NumThreats;
}

export function randomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

export function visitNeighbours(
  board: IImmutableBoardRecord,
  p: Coordinate,
  callback: (cell: IImmutableCellRecord) => void
) {
  const width = board.get('cols').size;
  const height = board.get('cols').get(0)!.size;

  for (let col = -1; col <= 1; col++) {
    const col1 = p.col + col;

    if (col1 >= width || col1 < 0) {
      continue;
    }

    for (let row = -1; row <= 1; row++) {
      if (col === 0 && row === 0) {
        continue;
      }

      const row1 = p.row + row;

      if (row1 >= height || row1 < 0) {
        continue;
      }

      const cell = board
        .get('cols')
        .get(col1)!
        .get(row1)!;

      callback(cell);
    }
  }
}
