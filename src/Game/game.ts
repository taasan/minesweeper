import { Collection, OrderedMap, Record, RecordOf } from 'immutable';
import log from '../lib/log';
import {
  GameError,
  GameRecord,
  GameState,
  IGame,
  Level,
  assertNever,
  getCell,
  setCell,
} from './board';
import { Coordinate, calculateCoordinate, calculateIndex } from './coordinate';
import {
  CellRecord,
  CellState,
  CellStateStats,
  ICell,
  Mine,
  NumThreats,
  createGameCell,
} from './cell';
import { Grid, GridType, Topology, getNeighbourMatrix } from './grid';

const createLevel = (level?: Partial<Level>) =>
  Object.freeze({
    cols: 0,
    rows: 0,
    mines: 0,
    type: GridType.SQUARE,
    topology: Topology.LIMITED,
    ...level,
  });

const createCellStateStats: Record.Factory<CellStateStats> = Record<
  CellStateStats
>({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 });

export const createBoard: Record.Factory<IGame> = Record<IGame>({
  cells: OrderedMap(),
  state: GameState.NOT_INITIALIZED,
  level: createLevel(),
  cellStates: createCellStateStats(),
  error: null,
  onGameOver: () => undefined,
});

function getCellStates(
  cells: Collection<number, CellRecord>
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

function createEmptyCells({ cols, rows }: Level): Array<[number, ICell]> {
  const cells: Array<[number, ICell]> = [];
  const dim = rows * cols;
  for (let i = 0; i < dim; i++) {
    cells.push([
      i,
      {
        state: CellState.NEW,
        threatCount: 0,
      },
    ]);
  }
  return cells;
}

function initialize(
  level: Level,
  origin: Coordinate,
  onGameOver: () => void
): GameRecord {
  const cells = createEmptyCells(level);
  const { cols, rows, mines } = level;

  const mineSet = new Set<number>()
    // Make sure we don't start with a bang
    .add(calculateIndex({ cols }, origin));
  let iterations = 0;
  const dim = cols * rows;
  while (mineSet.size <= mines) {
    if (iterations++ > mines * 10) {
      throw new Error('Infinite loop?');
    }
    const coordinate = randomInt(dim);
    if (!mineSet.has(coordinate)) {
      mineSet.add(coordinate);
      cells[coordinate][1].threatCount = 0xff;
    }
  }

  const cellRecords: OrderedMap<number, CellRecord> = OrderedMap(
    cells.map(([coord, cell]) => {
      return [coord, createGameCell(cell)];
    })
  );

  return createBoard({
    level: createLevel(level),
    cells: cellRecords,
    cellStates: getCellStates(cellRecords),
    state: GameState.INITIALIZED,
    onGameOver,
  }).withMutations(board => {
    board.set(
      'cells',
      board.cells.mapEntries(([coordinate, cell]) => [
        coordinate,
        cell.set('threatCount', countThreats(board, coordinate)),
      ])
    );
  });
}

function updateCell(
  board: GameRecord,
  [coordinate, newCell]: [Coordinate, CellRecord]
): GameRecord {
  const oldCell = getCell(board, coordinate);
  if (
    board.state === GameState.PLAYING &&
    oldCell?.threatCount !== newCell.threatCount
  ) {
    throw new Error(
      `Expected ${newCell.threatCount}, got ${oldCell?.threatCount}`
    );
  }
  return board.set('cells', setCell(board, coordinate, newCell));
}

function countThreats(board: GameRecord, p: Coordinate): NumThreats | Mine {
  const { level } = board;
  if (getCell(board, p)?.threatCount === 0xff) {
    return 0xff;
  }
  let threats: NumThreats = 0;
  visitNeighbours(level, p, coordinate => {
    const cell = getCell(board, coordinate)!;
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

export type GameCellCallback = (coordinate: Coordinate) => void;

export const getNeighbours = (
  { rows, cols, type, topology }: Grid,
  origin: Coordinate
) => {
  let neighbours = getNeighbourMatrix(type)(calculateCoordinate(cols, origin));

  const torusAdjust = (n: number, max: number) =>
    n === -1 ? max - 1 : n === max ? 0 : n;
  switch (topology) {
    case Topology.TORUS:
      neighbours = neighbours.map(({ row, col }) => ({
        row: torusAdjust(row, rows),
        col: torusAdjust(col, cols),
      }));

      break;
    case Topology.LIMITED:
      neighbours = neighbours.filter(
        ({ row, col }) => !(col >= cols || col < 0 || row >= rows || row < 0)
      );

      break;

    default:
      assertNever(topology);
  }

  return neighbours
    .map(({ row, col }) => col + cols * row)
    .filter(c => c !== origin);
};

export function visitNeighbours(
  level: Grid,
  origin: Coordinate,
  ...callbacks: Array<GameCellCallback>
) {
  if (callbacks.length === 0) {
    return;
  }

  getNeighbours(level, origin).forEach(coordinate =>
    callbacks.forEach(cb => cb(coordinate))
  );
}

export enum Cmd {
  POKE,
  FLAG,
  TOGGLE_PAUSE,
}

export type CmdName = keyof typeof Cmd;

export const isCmdName = (s: string): s is CmdName => Cmd[s as CmdName] != null;

function openNeighbours(
  [origin, cell]: [Coordinate, CellRecord],
  board: GameRecord
): GameRecord {
  const { level } = board;
  let flaggedNeighboursCount = 0;
  visitNeighbours(level, origin, coord => {
    const c = getCell(board, coord)!;
    if (c.state === CellState.FLAGGED || c.state === CellState.EXPLODED) {
      flaggedNeighboursCount++;
    }
  });

  if (flaggedNeighboursCount < cell.threatCount) {
    return board;
  }
  return board.withMutations(mutable =>
    visitNeighbours(level, origin, coord => {
      const c = getCell(board, coord)!;
      if (c.state === CellState.NEW || c.state === CellState.UNCERTAIN) {
        toggleOpen([[coord, c], mutable]);
      }
    })
  );
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
      initialize(board.level, coordinate, board.onGameOver).set(
        'state',
        GameState.PLAYING
      ),
    ]);
  }

  if (command === Cmd.TOGGLE_PAUSE) {
    if (![GameState.PAUSED, GameState.PLAYING].includes(board.state)) {
      return board;
    }
    return board.set(
      'state',
      board.state === GameState.PAUSED ? GameState.PLAYING : GameState.PAUSED
    );
  }
  const cell = getCell(board, coordinate)!;
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
      if (
        mutable.cellStates[CellState.EXPLODED] >
        board.cellStates[CellState.EXPLODED]
      ) {
        mutable.set('state', GameState.GAME_OVER);
        try {
          board.onGameOver();
        } catch (err) {
          log.warn('Unhandled exception in onGameOver handler', err);
        }
      } else if (getCell(mutable, coordinate)!.state === CellState.OPEN) {
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

  if (cell.state === CellState.FLAGGED) {
    return board;
  }

  return board.withMutations(mutable => {
    if (cell.state === CellState.OPEN) {
      openNeighbours([coordinate, cell], mutable);
      return;
    }

    let newState: CellState = cell.state;
    switch (cell.state) {
      case CellState.NEW:
      case CellState.UNCERTAIN:
        newState =
          cell.threatCount === 0xff ? CellState.EXPLODED : CellState.OPEN;
        break;
      case CellState.EXPLODED:
      case CellState.FLAGGED:
        return;

      default:
        assertNever(cell.state);
    }

    if (board.state === GameState.INITIALIZED) {
      mutable.set('state', GameState.PLAYING);
    }
    const newCell = cell.set('state', newState);
    updateCell(mutable, [coordinate, newCell]);

    if (newCell.threatCount === 0) {
      const predicate = (cellRecord: CellRecord) =>
        cellRecord.state === CellState.NEW ||
        cellRecord.state === CellState.UNCERTAIN;
      const visitor = ([coord, c]: [Coordinate, CellRecord]) => {
        if (c.threatCount === 0xff) {
          throw new Error(`Expected 0-8 threatCount, got ${c.threatCount}`);
        }
        if (predicate(c)) {
          mutable = updateCell(mutable, [
            coord,
            c.set('state', CellState.OPEN),
          ]);
          if (c.threatCount === 0) {
            getNeighbours(mutable.level, coord).forEach(cc => {
              const cr = mutable.cells.get(cc)!;
              if (predicate(cr)) {
                visitor([cc, cr]);
              }
            });
          }
        }
      };
      visitor([coordinate, cell]);
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
      return board;
    default:
      assertNever(cell.state);
  }
  return board.withMutations(mutable => {
    if (board.state === GameState.INITIALIZED) {
      mutable.set('state', GameState.PLAYING);
    }
    updateCell(mutable, [coordinate, cell.set('state', newCellState)]);
  });
}

export type NextStateFunction = (
  cmd: Cmd,
  currentState: [Coordinate, GameRecord]
) => GameRecord;

export type IValidationError = {
  field: string;
  value: any;
  msg: string;
};

export const MAX_LEVEL = 30;
export const MIN_LEVEL = 3;

export const maxMines = ({ rows, cols }: { rows: number; cols: number }) =>
  Math.floor(rows * cols * 0.5);

export const minMines = ({ rows, cols }: { rows: number; cols: number }) =>
  Math.ceil(rows * cols * 0.1);

export const validateLevel = ({
  rows,
  cols,
  mines,
}: Level): IValidationError[] => {
  const errors = [];
  if (rows < MIN_LEVEL) {
    errors.push({ field: 'rows', value: rows, msg: 'Too small' });
  } else if (rows > MAX_LEVEL) {
    errors.push({ field: 'rows', value: rows, msg: 'Too large' });
  }
  if (cols < MIN_LEVEL) {
    errors.push({ field: 'cols', value: cols, msg: 'Too small' });
  } else if (rows > MAX_LEVEL) {
    errors.push({ field: 'cols', value: cols, msg: 'Too large' });
  }
  if (mines < minMines({ rows, cols })) {
    errors.push({ field: 'mines', value: mines, msg: 'Too small' });
  } else if (mines > maxMines({ rows, cols })) {
    errors.push({ field: 'mines', value: mines, msg: 'Too large' });
  }

  return errors;
};

export class ValidationError extends GameError {
  public readonly errors: ReadonlyArray<IValidationError>;
  constructor(msg: string, errors: IValidationError[]) {
    super(msg);
    this.errors = Object.freeze(errors.map(e => Object.freeze(e)));
  }
}

export function createGame(
  level: Level,
  onGameOver: () => void
): { board: GameRecord; nextState: NextStateFunction } {
  const errors = validateLevel(level);

  if (errors.length > 0) {
    return {
      board: createBoard({
        level: createLevel(level),
        cells: OrderedMap(),
        onGameOver,
        state: GameState.ERROR,
        error: Object.freeze(new ValidationError('Invalid level', errors)),
      }),
      nextState: (_cmd, [_coordinate, game]) => game,
    };
  }

  const cells = OrderedMap(
    createEmptyCells(level).map(([pos, cell]) => [pos, createGameCell(cell)])
  );

  const func: NextStateFunction = (cmd, [coordinate, game]) => {
    try {
      switch (game.state) {
        case GameState.PAUSED:
          return expectUnPause(cmd, game);
      }
      if (game.state === GameState.ERROR) {
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
    board: createBoard({ level: createLevel(level), cells, onGameOver }),
    nextState: func,
  };
}

export const legend: () => {
  board: GameRecord;
  nextState: NextStateFunction;
} = () => {
  const cells = ([
    ...[...new Array(8)].map((_, i) => ({
      state: CellState.OPEN,
      threatCount: (i + 1) as NumThreats,
    })),
    {
      state: CellState.NEW,
    },
    { state: CellState.OPEN, threatCount: 0 },

    {
      state: CellState.FLAGGED,
      threatCount: 0xff,
    },
    {
      state: CellState.FLAGGED,
      threatCount: 0,
    },
    {
      state: CellState.UNCERTAIN,
      threatCount: 0xff,
    },
    {
      state: CellState.UNCERTAIN,
      threatCount: 0,
    },
    {
      state: CellState.EXPLODED,
      threatCount: 0xff,
    },
    {
      state: CellState.OPEN,
      threatCount: 0xff,
    },
  ] as ICell[]).map(createGameCell);

  const cols = 4;
  const board = createBoard({
    cells: OrderedMap(cells.map((c, i) => [i, c])),
    level: createLevel({
      cols,
      rows: Math.ceil(cells.length / cols),
      type: GridType.HEX,
    }),
    state: GameState.DEMO,
  });
  return {
    board,
    nextState: () => {
      throw new Error();
    },
  };
};
