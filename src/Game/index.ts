import { OrderedMap, Record, RecordOf, Collection } from 'immutable';

export function assertNever(x: never): never {
  throw new Error('Unexpected value: ' + x);
}

export type NumThreats = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function isNumThreats(n: number): n is NumThreats {
  return n >= 0 && n <= 8;
}

export enum CellState {
  OPEN,
  FLAGGED,
  UNCERTAIN,
  NEW,
  EXPLODED,
}
export type CellStateName = keyof typeof CellState;

type IMap<K, V> = {
  get: (i: K) => V | undefined;
};

type ICell = {
  state: CellState;
  threatCount: NumThreats | Mine;
  flaggedNeighboursCount: NumThreats;
};

const createGameCell: Record.Factory<ICell> = Record<ICell>({
  state: CellState.NEW,
  threatCount: 0,
  flaggedNeighboursCount: 0,
});

export type CellRecord = RecordOf<ICell>;

type Coordinate = number;

export enum GameState {
  PAUSED,
  GAME_OVER,
  COMPLETED,
  INITIALIZED,
  PLAYING,
  NOT_INITIALIZED,
  ERROR,
  DEMO,
}

class GameError extends Error {
  readonly cause: Error;
  constructor(msg: string, err: Error) {
    super(msg);
    this.cause = Object.freeze(err);
  }
}

type IGame = Readonly<{
  cells: OrderedMap<Coordinate, CellRecord>;
  state: GameState;
  level: RecordOf<Level>;
  cellStates: RecordOf<CellStateStats>;
  error: Readonly<GameError> | null;
}>;

export type Level = {
  cols: number;
  rows: number;
  mines: number;
};

const createLevel: Record.Factory<Level> = Record<Level>({
  cols: 0,
  rows: 0,
  mines: 0,
});

const createCellStateStats: Record.Factory<CellStateStats> = Record<
  CellStateStats
>({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });

export type GameRecord = RecordOf<IGame>;

const createBoard: Record.Factory<IGame> = Record<IGame>({
  cells: OrderedMap(),
  state: GameState.NOT_INITIALIZED,
  level: createLevel(),
  cellStates: createCellStateStats(),
  error: null,
});

export type Mine = 0xff;

type CellStateStats = { [key in CellState]: number };

function getCellStates(
  cells: Collection<Coordinate, CellRecord>
): RecordOf<CellStateStats> {
  return createCellStateStats(
    cells.entrySeq().reduce(
      (result, [, item]) => ({
        ...result,
        [item.state]: result[item.state] + 1,
      }),
      { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
    )
  );
}

function createEmptyCells({ cols, rows }: Level): Array<[Coordinate, ICell]> {
  const cells: Array<[Coordinate, ICell]> = [];
  const dim = rows * cols;
  for (let i = 0; i < dim; i++) {
    cells.push([
      i,
      {
        state: CellState.NEW,
        threatCount: 0,
        flaggedNeighboursCount: 0,
      },
    ]);
  }
  return cells;
}

function initialize(level: Level, origin: Coordinate): GameRecord {
  const cells = createEmptyCells(level);
  const { cols, rows, mines } = level;

  const mineSet = new Set<Coordinate>()
    // Make sure we don't start with a bang
    .add(origin);
  let iterations = 0;
  const dim = cols * rows;
  do {
    if (iterations++ > mines * 10) {
      throw new Error('Infinite loop?');
    }
    const coordinate = randomInt(dim);
    if (!mineSet.has(coordinate)) {
      mineSet.add(coordinate);
      cells[coordinate][1].threatCount = 0xff;
    }
  } while (mineSet.size <= mines);

  const cellRecords: OrderedMap<Coordinate, CellRecord> = OrderedMap(
    cells.map(([coord, cell]) => {
      const mappedCell = {
        ...cell,
        threatCount: countThreats({ rows, cols }, coord, {
          get: c1 => cells[c1][1],
        }),
      };
      return [coord, createGameCell(mappedCell)];
    })
  );

  return createBoard({
    level: createLevel({ cols, rows, mines }),
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
  const visited = new Map<Coordinate, CellRecord>();
  const visitor = ([coordinate, cell]: [Coordinate, CellRecord]) => {
    if (visited.has(coordinate)) {
      return;
    }
    visited.set(coordinate, cell);
    if (cell.threatCount === 0) {
      visitNeighbours(board.level, board.cells, coordinate, visitor);
    }
  };
  visitNeighbours(board.level, board.cells, origin, visitor);
  return [...visited.entries()];
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

export function randomInt(max: number): number {
  return Math.floor(Math.random() * Math.floor(max));
}

export type GameCellCallback<T> = ([coordinate, cell]: [Coordinate, T]) => void;

function visitNeighbours<T>(
  dimension: { rows: number; cols: number },
  cells: IMap<Coordinate, T>,
  ccc: Coordinate,
  ...callbacks: Array<GameCellCallback<T>>
) {
  const { rows, cols } = dimension;

  const calculateCoordinate = (index: number) => {
    const n = cols;
    const col = index % cols;
    const row = (index - col) / n;
    return { col, row };
  };

  const p = calculateCoordinate(ccc);
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
      const coordinate = col + cols * row;
      const cell = cells.get(coordinate)!;

      callbacks.forEach(cb => cb([coordinate, cell]));
    }
  }
}

export enum Cmd {
  POKE,
  FLAG,
  NONE,
  TOGGLE_PAUSE,
}

export type CmdName = keyof typeof Cmd;

export function isCmdName(s: string): s is CmdName {
  return Cmd[s as CmdName] != null;
}

function openNeighbours(
  [coordinate, cell]: [Coordinate, CellRecord],
  board: GameRecord
): GameRecord {
  let newBoard = board;

  if (cell.flaggedNeighboursCount < cell.threatCount) {
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

function expectUnPause(command: Cmd, board: GameRecord): GameRecord {
  if (command !== Cmd.TOGGLE_PAUSE) {
    throw new Error(`Illegal command: expected ${Cmd[Cmd.TOGGLE_PAUSE]}`);
  }
  if (board.state !== GameState.PAUSED) {
    throw new Error(`Invalid state: expected ${GameState.PAUSED}`);
  }
  return board.set('state', GameState.PLAYING);
}

function nextState(
  command: Cmd,
  [coordinate, board]: [Coordinate, GameRecord]
): GameRecord {
  if (board.state === GameState.NOT_INITIALIZED) {
    return nextState(command, [
      coordinate,
      initialize(board.level, coordinate).set('state', GameState.PLAYING),
    ]);
  }

  if (command === Cmd.NONE) {
    return board;
  }
  if (command === Cmd.TOGGLE_PAUSE) {
    return board.set(
      'state',
      board.state === GameState.PAUSED ? GameState.PLAYING : GameState.PAUSED
    );
  }
  const cell = board.cells.get(coordinate)!;
  return board.withMutations(mutable => {
    switch (command) {
      case Cmd.POKE:
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
      if (stats[CellState.EXPLODED] > 0) {
        mutable.set('state', GameState.GAME_OVER);
      } else if (mutable.cells.get(coordinate)!.state === CellState.OPEN) {
        const openPlusMines = mutable.level.mines + stats[CellState.OPEN];
        const numCells = mutable.level.cols * mutable.level.rows;
        const done = openPlusMines === numCells;
        mutable.set('state', done ? GameState.COMPLETED : mutable.state);
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
    case GameState.DEMO:
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
    case GameState.DEMO:
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
    if (board.state === GameState.INITIALIZED) {
      newBoard.set('state', GameState.PLAYING);
    }
    updateCell(newBoard, [coordinate, cell.set('state', newCellState)]);

    // Update flaggedNeighboursCount?
    let delta = 0;
    if (newCellState === CellState.FLAGGED) {
      delta = 1;
    } else if (newCellState === CellState.UNCERTAIN) {
      delta = -1;
    }
    if (delta === 0) {
      return;
    }
    newBoard.set(
      'cells',
      newBoard.cells.withMutations(newCells => {
        visitNeighbours(newBoard.level, newCells, coordinate, ([coord, c]) => {
          const newCount = c.flaggedNeighboursCount + delta;
          if (!isNumThreats(newCount)) {
            throw new Error();
          }
          newCells.set(coord, c.set('flaggedNeighboursCount', newCount));
        });
      })
    );
  });
}

export type NextStateFunction = (
  cmd: Cmd,
  currentState: [Coordinate, GameRecord]
) => GameRecord;

export function createGame(
  level: Level
): { board: GameRecord; nextState: NextStateFunction } {
  const cells = OrderedMap(
    createEmptyCells(level).map(([pos, cell]) => [pos, createGameCell(cell)])
  );

  const func: NextStateFunction = (cmd, [coordinate, game]) => {
    try {
      switch (game.state) {
        case GameState.PAUSED:
          return expectUnPause(cmd, game);
      }
      if (game.state === GameState.ERROR || cmd === Cmd.NONE) {
        return game;
      }
      return nextState(cmd, [coordinate, game]);
    } catch (err) {
      return game.withMutations(mutable => {
        mutable.set(
          'error',
          Object.freeze(
            err instanceof GameError
              ? err
              : new GameError(`Command ${Cmd[cmd]} failed`, err)
          )
        );
        mutable.set('state', GameState.ERROR);
      });
    }
  };
  return {
    board: createBoard({ level: createLevel(level), cells }),
    nextState: func,
  };
}

export const legend = () => {
  const cells = [
    ...[...new Array(8)].map((_, i) =>
      createGameCell({
        state: CellState.OPEN,
        threatCount: (i + 1) as NumThreats,
      })
    ),
    createGameCell({
      state: CellState.NEW,
    }),
    createGameCell({
      state: CellState.OPEN,
      threatCount: 0,
    }),

    createGameCell({
      state: CellState.FLAGGED,
      threatCount: 0xff,
    }),
    createGameCell({
      state: CellState.FLAGGED,
      threatCount: 0,
    }),
    createGameCell({
      state: CellState.UNCERTAIN,
      threatCount: 0xff,
    }),
    createGameCell({
      state: CellState.UNCERTAIN,
      threatCount: 0,
    }),
    createGameCell({
      state: CellState.EXPLODED,
      threatCount: 0xff,
    }),
    createGameCell({
      state: CellState.NEW,
      threatCount: 0xff,
    }),
  ];
  const cols = 4;
  const board = createBoard({
    cells: OrderedMap(cells.map((c, i) => [i, c])),
    level: createLevel({ cols, rows: Math.ceil(cells.length / cols) }),
    state: GameState.DEMO,
  });
  return {
    board,
    nextState: () => board,
  };
};
