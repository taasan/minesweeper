import {
  OrderedMap,
  Record,
  RecordOf,
  ValueObject,
  Collection,
  Set,
} from 'immutable';

export function assertNever(x: never): never {
  throw new Error('Unexpected value: ' + x);
}

export type NumThreats = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export enum CellState {
  OPEN,
  FLAGGED,
  UNCERTAIN,
  NEW,
  EXPLODED,
}

type IMap<K, V> = {
  get: (i: K) => V | undefined;
};

type ICell = {
  state: CellState;
  threatCount: NumThreats | Mine;
};

const createGameCell: Record.Factory<ICell> = Record<ICell>({
  state: CellState.NEW,
  threatCount: 0,
});

export type CellRecord = RecordOf<ICell>;

export class Coordinate implements ValueObject {
  readonly col: number;
  readonly row: number;

  constructor({ row, col }: { row: number; col: number }) {
    this.row = row;
    this.col = col;
  }

  public hashCode() {
    return 31 * this.col + this.row;
  }

  public equals(other: any) {
    if (this === other) {
      return true;
    }
    if (!('row' in other && 'col' in other)) {
      return false;
    }
    return this.row === other.row && this.col === other.col;
  }
}

export enum GameState {
  PAUSED,
  GAME_OVER,
  COMPLETED,
  INITIALIZED,
  PLAYING,
  NOT_INITIALIZED,
  ERROR,
}

type IGame = Readonly<{
  cells: OrderedMap<Coordinate, CellRecord>;
  state: GameState;
  level: Level;
  cellStates: CellStateStats;
}>;

export type GameRecord = RecordOf<IGame>;

const createBoard: Record.Factory<IGame> = Record<IGame>({
  cells: OrderedMap(),
  state: GameState.NOT_INITIALIZED,
  level: { cols: 0, rows: 0, mines: 0 },
  cellStates: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
});

export type Level = {
  cols: number;
  rows: number;
  mines: number;
};

export type Mine = 0xff;

type CellStateStats = { [key in CellState]: number };

function getCellStates(
  cells: Collection<Coordinate, CellRecord>
): CellStateStats {
  return cells.entrySeq().reduce(
    (result, [, item]) => ({
      ...result,
      [item.state]: result[item.state] + 1,
    }),
    { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
  );
}

function initialize(level: Level): GameRecord {
  const { cols, rows, mines } = level;
  const cells: Array<[Coordinate, ICell]> = [];
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      cells.push([
        new Coordinate({ row, col }),
        {
          state: CellState.NEW,
          threatCount: 0,
        },
      ]);
    }
  }

  const mineSet: Set<Coordinate> = Set().asMutable();
  let iterations = 0;
  const pos = (c: Coordinate) => calculateIndex(cols, c);
  do {
    if (iterations++ > mines * 10) {
      return createBoard({ state: GameState.ERROR });
    }
    const col = randomInt(cols);
    const row = randomInt(rows);
    const coordinate = new Coordinate({
      col,
      row,
    });
    if (!mineSet.has(coordinate)) {
      mineSet.add(coordinate);
      cells[pos(coordinate)][1].threatCount = 0xff;
    }
  } while (mineSet.size < mines);

  const cellRecords: OrderedMap<Coordinate, CellRecord> = OrderedMap(
    cells.map(([coord, cell]) => {
      const mappedCell = {
        ...cell,
        threatCount: countThreats({ rows, cols }, coord, {
          get: c1 => cells[pos(c1)][1],
        }),
      };
      return [coord, createGameCell(mappedCell)];
    })
  );

  return createBoard({
    level: { cols, rows, mines },
    cells: cellRecords,
    cellStates: getCellStates(cellRecords),
    state: GameState.INITIALIZED,
  });
}

function updateCell(
  board: GameRecord,
  [coordinate, newCell]: [Coordinate, CellRecord]
): GameRecord {
  const oldCell = board.cells.get(coordinate);
  if (
    board.state === GameState.PLAYING &&
    oldCell?.threatCount !== newCell.threatCount
  ) {
    throw new Error(
      `Expected ${newCell.threatCount}, got ${oldCell?.threatCount}`
    );
  }
  return board.set('cells', board.cells.set(coordinate, newCell));
}

function collectSafeCells(
  board: GameRecord,
  origin: Coordinate
): Array<[Coordinate, CellRecord]> {
  const visited = new Map<number, [Coordinate, CellRecord]>();
  const visitor = ([coordinate, cell]: [Coordinate, CellRecord]) => {
    const pos = calculateIndex(board.level.cols, coordinate);
    if (visited.has(pos)) {
      return;
    }
    visited.set(pos, [coordinate, cell]);
    if (cell.threatCount === 0) {
      visitNeighbours(board.level, board.cells, coordinate, visitor);
    }
  };

  visitNeighbours(board.level, board.cells, origin, visitor);
  return [...visited.values()];
}

function countThreats(
  dimension: { cols: number; rows: number },
  p: Coordinate,
  cells: IMap<Coordinate, ICell>
): NumThreats | Mine {
  if (cells.get(p)?.threatCount === 0xff) {
    return 0xff;
  }
  let threats: NumThreats = 0;
  visitNeighbours<ICell>(dimension, cells, p, ([, cell]) => {
    if (cell.threatCount === 0xff) {
      threats++;
    }
  });
  if (threats < 0 || threats > 8) {
    throw new Error(`Unexpected threat number: ${threats}`);
  }

  return threats;
}

export function randomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

export type GameCellCallback<T> = ([coordinate, cell]: [Coordinate, T]) => void;

function visitNeighbours<T>(
  dimension: { rows: number; cols: number },
  cells: IMap<Coordinate, T>,
  p: Coordinate,
  ...callbacks: Array<GameCellCallback<T>>
) {
  const { rows, cols } = dimension;
  for (let c = -1; c <= 1; c++) {
    const col = p.col + c;

    if (col >= cols || col < 0) {
      continue;
    }

    for (let r = -1; r <= 1; r++) {
      if (c === 0 && r === 0) {
        continue;
      }

      const row = p.row + r;

      if (row >= rows || row < 0) {
        continue;
      }
      const coordinate = new Coordinate({ row, col });
      const cell = cells.get(coordinate)!;

      callbacks.forEach(cb => cb([coordinate, cell]));
    }
  }
}

export enum Cmd {
  OPEN,
  FLAG,
  NONE,
}

function openNeighbours(
  [coordinate, cell]: [Coordinate, CellRecord],
  board: GameRecord
): GameRecord {
  let newBoard = board;

  let flaggedNeighbours = 0;
  visitNeighbours(board.level, board.cells, coordinate, ([, c]) => {
    if (c.state === CellState.FLAGGED) {
      flaggedNeighbours++;
    }
  });
  if (flaggedNeighbours !== cell.threatCount) {
    return board;
  }
  visitNeighbours<CellRecord>(
    board.level,
    board.cells,
    coordinate,
    ([coord, c]) => {
      if (c.state === CellState.NEW || c.state === CellState.UNCERTAIN) {
        newBoard = toggleOpen([[coord, c], newBoard]);
      }
    }
  );

  return newBoard;
}

function nextState(
  command: Cmd,
  [[coordinate, cell], board]: [[Coordinate, CellRecord], GameRecord]
): GameRecord {
  if (command === Cmd.NONE) {
    return board;
  }
  return board.withMutations(mutable => {
    switch (command) {
      case Cmd.OPEN:
        toggleOpen([[coordinate, cell], mutable]);
        break;
      case Cmd.FLAG:
        toggleFlagged([[coordinate, cell], mutable]);
        break;
      default:
        assertNever(command);
    }

    if (mutable !== board) {
      const stats = getCellStates(mutable.cells);
      mutable.set('cellStates', stats);
      const newCell = mutable.cells.get(coordinate)!;
      const newState = newCell.state;
      if (stats[CellState.EXPLODED] > 0) {
        mutable.set('state', GameState.GAME_OVER);
      } else if (newState === CellState.OPEN) {
        mutable.set(
          'state',
          mutable.level.mines + stats[CellState.OPEN] ===
            mutable.level.cols * mutable.level.rows
            ? GameState.COMPLETED
            : mutable.state
        );
      }
    }
  });
}

function toggleOpen([[coordinate, cell], board]: [
  [Coordinate, CellRecord],
  GameRecord
]): GameRecord {
  switch (board.state) {
    case GameState.PLAYING:
      break;
    case GameState.INITIALIZED:
    case GameState.PAUSED:
    case GameState.GAME_OVER:
    case GameState.COMPLETED:
    case GameState.NOT_INITIALIZED:
    case GameState.ERROR:
      return board;
    default:
      assertNever(board.state);
  }

  return board.withMutations(mutable => {
    if (cell.state === CellState.OPEN) {
      openNeighbours([coordinate, cell], mutable);
    }

    const oldCellState = cell.state;
    let newState: CellState = oldCellState;
    switch (oldCellState) {
      case CellState.NEW:
      case CellState.UNCERTAIN:
        newState =
          cell.threatCount === 0xff ? CellState.EXPLODED : CellState.OPEN;
        break;
      case CellState.EXPLODED:
      case CellState.OPEN:
      case CellState.FLAGGED:
        break;

      default:
        assertNever(oldCellState);
    }

    if (board.state === GameState.INITIALIZED) {
      mutable.set('state', GameState.PLAYING);
    }
    const newCell = cell.set('state', newState);
    updateCell(mutable, [coordinate, newCell]);

    if (newCell.threatCount === 0) {
      collectSafeCells(mutable, coordinate).forEach(([coord, c]) => {
        if (c.threatCount === 0xff) {
          throw new Error(`Expected 0-8 threatCount, got ${c.threatCount}`);
        }
        if (c.state === CellState.NEW || c.state === CellState.UNCERTAIN) {
          mutable = updateCell(mutable, [
            coord,
            c.set('state', CellState.OPEN),
          ]);
        }
      });
    }
  });
}

function toggleFlagged([[coordinate, cell], board]: [
  [Coordinate, CellRecord],
  GameRecord
]): GameRecord {
  switch (board.state) {
    case GameState.PLAYING:
      break;
    case GameState.INITIALIZED:
    case GameState.PAUSED:
    case GameState.GAME_OVER:
    case GameState.COMPLETED:
    case GameState.NOT_INITIALIZED:
    case GameState.ERROR:
      return board;
    default:
      assertNever(board.state);
  }

  let newCellState: CellState = cell.state;
  switch (cell.state) {
    case CellState.FLAGGED:
      newCellState = CellState.UNCERTAIN;
      break;
    case CellState.UNCERTAIN:
      newCellState = CellState.NEW;
      break;
    case CellState.NEW:
      newCellState = CellState.FLAGGED;
      break;
    case CellState.EXPLODED:
    case CellState.OPEN:
      break;
    default:
      assertNever(cell.state);
  }
  return board.withMutations(newBoard => {
    const newCell = cell.set('state', newCellState);
    if (board.state === GameState.INITIALIZED) {
      newBoard = newBoard.set('state', GameState.PLAYING);
    }
    updateCell(newBoard, [coordinate, newCell]);
  });
}

export type NextStateFunction = (
  cmd: Cmd,
  [[coordinate, GameCell], Game]: [[Coordinate, CellRecord], GameRecord]
) => GameRecord;

export function createGame(level: Level): [GameRecord, NextStateFunction] {
  const newGame = initialize(level);

  return [
    newGame,
    (
      cmd = Cmd.NONE,
      game: [[Coordinate, CellRecord], GameRecord] = [
        [new Coordinate({ row: 0, col: 0 }), createGameCell()],
        newGame,
      ]
    ) => nextState(cmd, game),
  ];
}

function calculateIndex(cols: number, { row, col }: Coordinate) {
  return col + cols * row;
}
