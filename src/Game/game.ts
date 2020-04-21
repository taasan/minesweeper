import log from '../lib/log';
import {
  GameError,
  GameRecord,
  GameState,
  IGame,
  Level,
  assertNever,
  getCell,
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
import produce, { Immutable } from 'immer';

const createLevel = (level?: Partial<Level>) =>
  Object.freeze({
    cols: 0,
    rows: 0,
    mines: 0,
    type: GridType.SQUARE,
    topology: Topology.LIMITED,
    ...level,
  });

const createCellStateStats = (
  stats?: Partial<CellStateStats>
): CellStateStats => ({
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  ...stats,
});

export const createBoard: (game: Partial<IGame>) => Immutable<IGame> = game =>
  produce(game, draft => ({
    cells: new Map(),
    state: GameState.NOT_INITIALIZED,
    level: createLevel(),
    cellStates: createCellStateStats(),
    error: null,
    version: 0,
    onGameOver: () => undefined,
    ...draft,
  }));

type BoardEntry = [number, CellRecord];

function getCellStates(
  cells: Map<number, CellRecord> | BoardEntry[]
): CellStateStats {
  const reducer: (
    result: CellStateStats,
    entry: BoardEntry
  ) => CellStateStats = (result, [, item]) => ({
    ...result,
    [item.state]: result[item.state] + 1,
  });
  const entries = Array.isArray(cells) ? cells : [...cells.entries()];

  return createCellStateStats(
    entries.reduce(reducer, { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 })
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

function mapFromEntries<K, V>(entries: [K, V][]) {
  const map: Map<K, V> = new Map();
  entries.forEach(([k, v]) => map.set(k, v));
  return map;
}

function initialize(
  game: Pick<IGame, 'level' | 'onGameOver'>,
  origin: Coordinate,
  state: GameState.INITIALIZED | GameState.PLAYING
): GameRecord {
  const { level, onGameOver } = game;
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

  const cellRecords = mapFromEntries<number, ICell>(cells);
  cells.forEach(([coord, cell]) => {
    cell.threatCount = countThreats({ level, cells: cellRecords }, coord);
  });

  return createBoard({
    level: createLevel(level),
    cells: cellRecords,
    cellStates: getCellStates(cellRecords),
    state,
    onGameOver,
  });
}

function updateCell(
  board: IGame,
  [coordinate, newCell]: [Coordinate, CellRecord]
): void {
  const oldCell = getCell(board, coordinate);
  if (
    board.state === GameState.PLAYING &&
    oldCell?.threatCount !== newCell.threatCount
  ) {
    throw new Error(
      `Expected ${newCell.threatCount}, got ${oldCell?.threatCount}`
    );
  }
  board.cells.set(calculateIndex(board.level, coordinate), newCell);
}

function countThreats(
  board:
    | Pick<IGame, 'level' | 'cells'>
    | { level: Level; cells: [number, ICell][] },
  p: Coordinate
): NumThreats | Mine {
  if (getCell(board, p)?.threatCount === 0xff) {
    return 0xff;
  }
  let threats: NumThreats = 0;
  visitNeighbours(board.level, p, coordinate => {
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
  PAUSE,
  UNPAUSE,
}

export type CmdName = keyof typeof Cmd;

export const isCmdName = (s: string): s is CmdName => Cmd[s as CmdName] != null;

function openNeighbours(origin: Coordinate, board: IGame): void {
  const cell = getCell(board, origin);
  const { level } = board;
  let flaggedNeighboursCount = 0;
  visitNeighbours(level, origin, coord => {
    const c = getCell(board, coord)!;
    if (c.state === CellState.FLAGGED || c.state === CellState.EXPLODED) {
      flaggedNeighboursCount++;
    }
  });

  if (flaggedNeighboursCount < cell.threatCount) {
    return;
  }

  visitNeighbours(level, origin, coord => {
    const c = getCell(board, coord)!;
    if (c.state === CellState.NEW || c.state === CellState.UNCERTAIN) {
      toggleOpen(coord, board);
    }
  });
}

function expectUnPause(command: Cmd, board: GameRecord): GameRecord {
  if (command !== Cmd.UNPAUSE) {
    throw new Error(`Illegal command: expected ${Cmd[Cmd.UNPAUSE]}`);
  }
  if (board.state !== GameState.PAUSED) {
    throw new Error(`Invalid state: expected ${GameState.PAUSED}`);
  }
  return produce(board, draft => {
    draft.state = GameState.PLAYING;
  });
}

function nextState(
  command: Cmd,
  [coordinate, board]: [Coordinate, GameRecord]
): GameRecord {
  if (board.state === GameState.NOT_INITIALIZED) {
    board = nextState(command, [
      coordinate,
      initialize(board, coordinate, GameState.PLAYING),
    ]);
    return board;
  }

  if (command === Cmd.PAUSE || command === Cmd.UNPAUSE) {
    if (![GameState.PAUSED, GameState.PLAYING].includes(board.state)) {
      return board;
    }

    return produce(board, draft => {
      draft.state =
        command === Cmd.PAUSE ? GameState.PAUSED : GameState.PLAYING;
    });
  }

  return produce(board, mutable => {
    switch (command) {
      case Cmd.POKE:
        toggleOpen(coordinate, mutable);
        break;
      case Cmd.FLAG:
        toggleFlagged(coordinate, mutable);
        break;
      default:
        assertNever(command);
    }

    const stats = getCellStates(mutable.cells);
    mutable.cellStates = stats;
    if (
      mutable.cellStates[CellState.EXPLODED] >
      board.cellStates[CellState.EXPLODED]
    ) {
      mutable.state = GameState.GAME_OVER;
      try {
        board.onGameOver();
      } catch (err) {
        log.warn('Unhandled exception in onGameOver handler', err);
      }
    } else if (getCell(mutable, coordinate)!.state === CellState.OPEN) {
      const openPlusMines = mutable.level.mines + stats[CellState.OPEN];
      const numCells = mutable.level.cols * mutable.level.rows;
      const done = openPlusMines === numCells;
      mutable.state = done ? GameState.COMPLETED : mutable.state;
    }
  });
}

function toggleOpen(coordinate: Coordinate, board: IGame): void {
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
      return;
    default:
      assertNever(board.state);
  }
  const cell: CellRecord = getCell(board, coordinate);
  if (cell.state === CellState.FLAGGED) {
    return;
  }

  if (cell.state === CellState.OPEN) {
    openNeighbours(coordinate, board);
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
      return;

    default:
      assertNever(cell.state);
  }

  updateCell(board, [coordinate, { ...cell, state: newState }]);

  if (cell.threatCount === 0) {
    const predicate = (cellRecord: CellRecord) =>
      cellRecord.state === CellState.NEW ||
      cellRecord.state === CellState.UNCERTAIN;
    const visitor = ([coord, c]: [Coordinate, ICell]) => {
      if (c.threatCount === 0xff) {
        throw new Error(`Expected 0-8 threatCount, got ${c.threatCount}`);
      }
      if (predicate(c)) {
        c.state = CellState.OPEN;
        if (c.threatCount === 0) {
          getNeighbours(board.level, coord).forEach(cc => {
            const cr = board.cells.get(cc)!;
            if (predicate(cr)) {
              visitor([cc, cr]);
            }
          });
        }
      }
    };
    // Must use original cell state to avoid infinite recursion
    // One of the pitfalls of mutability
    visitor([coordinate, cell]);
  }
}

function toggleFlagged(coordinate: Coordinate, board: IGame): void {
  const cell = getCell(board, coordinate);
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
      return;
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
      return;
    default:
      assertNever(cell.state);
  }

  updateCell(board, [
    coordinate,
    createGameCell({ ...cell, state: newCellState }),
  ]);

  return;
}

export type NextStateFunction = (
  cmd: Cmd,
  currentState: [Coordinate, GameRecord],
  currentVersion: number
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
        cells: new Map(),
        onGameOver,
        state: GameState.ERROR,
        error: Object.freeze(new ValidationError('Invalid level', errors)),
      }),
      nextState: (_cmd, [_coordinate, game]) => game,
    };
  }

  const cells = mapFromEntries(
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
      return produce(nextState(cmd, [coordinate, game]), draft => {
        draft.version++;
      });
    } catch (err) {
      console.error(err);
      return produce(game, mutable => {
        mutable.error =
          err instanceof GameError
            ? err
            : new GameError(`Command ${Cmd[cmd]} failed`, err);
        mutable.state = GameState.ERROR;
      });
    }
  };
  return {
    board: createBoard({ level: createLevel(level), cells, onGameOver }),
    nextState: (cmd, [coordinate, game], version) => {
      if (
        game.state !== GameState.NOT_INITIALIZED &&
        version !== game.version
      ) {
        return produce(game, mutable => {
          mutable.error = new GameError('Version mismatch');
          mutable.state = GameState.ERROR;
        });
      }
      return func(cmd, [coordinate, game], version);
    },
  };
}

export const legend: () => {
  board: GameRecord;
  nextState: NextStateFunction;
} = () => {
  const cells = ([
    ...[...new Array(8)].map((_ignore, i) => ({
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
    cells: mapFromEntries(cells.map((c, i) => [i, c])),
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
