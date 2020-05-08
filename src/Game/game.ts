import log from '../lib/log';
import {
  CellArray,
  GameError,
  GameRecord,
  GameState,
  Level,
  getCell,
} from './board';
import { Coordinate, calculateIndex } from './coordinate';
import {
  CellRecord,
  CellRecordObject,
  CellState,
  CellStateStats,
  Mine,
  NumThreats,
  fromObject,
  getMine,
  getState,
  getThreats,
  setMine,
  setState,
  setThreats,
} from './cell';
import {
  Grid,
  GridType,
  Topology,
  getNeighbourMatrix,
  isGridType,
  isTopology,
} from './grid';
import produce from 'immer';
import _ from 'lodash';
import { assertNever, zero } from '../lib';
import { saveValue } from '../store/contexts/settings';

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
  [CellState.NEW]: 0,
  [CellState.OPEN]: 0,
  [CellState.FLAGGED]: 0,
  [CellState.UNCERTAIN]: 0,
  [CellState.EXPLODED]: 0,
  ...stats,
});

export const createBoard: (game: Partial<GameRecord>) => GameRecord = game =>
  produce(game, (draft: Partial<GameRecord>) => ({
    cells: new Uint16Array(),
    state: GameState.NOT_INITIALIZED,
    level: createLevel(),
    cellStates: createCellStateStats(),
    error: null,
    version: 0,
    onGameOver: _.noop,
    ...draft,
  }));

const getCellStates = (cells: CellArray) =>
  createCellStateStats(_.countBy(cells, cell => getState(cell)));

const createEmptyCells = ({ cols, rows }: Level): CellArray =>
  new Uint16Array(rows * cols);

function initialize(
  game: Pick<GameRecord, 'level' | 'onGameOver'>,
  origin: Coordinate,
  state: GameState.INITIALIZED | GameState.PLAYING
): GameRecord {
  const { level, onGameOver } = game;
  const cells = createEmptyCells(level);
  const { cols, rows, mines } = level;

  const mineSet = new Set<number>()
    // Make sure we don't start with a bang
    .add(calculateIndex(cols, origin));
  let iterations = 0;
  const dim = cols * rows;
  while (mineSet.size <= mines) {
    if (iterations++ > mines * 10) {
      throw new Error('Infinite loop?');
    }
    const coordinate = randomInt(dim);
    if (!mineSet.has(coordinate)) {
      mineSet.add(coordinate);
      cells[coordinate] = setMine(
        cells[coordinate],
        (randomInt(14) + 1) as Mine
      );
    }
  }

  return createBoard({
    level: createLevel(level),
    cells: cells.map((cell, coord) => {
      const threatCount = countThreats({ level, cells }, coord);
      return threatCount !== undefined ? setThreats(cell, threatCount) : cell;
    }),
    cellStates: createCellStateStats({ [CellState.NEW]: mines }),
    state,
    onGameOver,
  });
}

function updateCell(
  board: GameRecord,
  [coordinate, newCell]: [Coordinate, CellRecord]
): void {
  const oldCell = getCell(board, coordinate);
  const oldThreatCount = getThreats(oldCell);
  const newThreatCount = getThreats(newCell);
  if (board.state === GameState.PLAYING && oldThreatCount !== newThreatCount) {
    throw new Error(`Expected ${newThreatCount}, got ${oldThreatCount}`);
  }
  board.cells[calculateIndex(board.level.cols, coordinate)] = newCell;
}

function countThreats(
  board:
    | Pick<GameRecord, 'level' | 'cells'>
    | { level: Level; cells: [number, CellRecord][] },
  p: number
): NumThreats | undefined {
  if (getMine(board.cells[p]! as number) !== undefined) {
    return undefined;
  }
  let threats: NumThreats = 0;
  visitNeighbours(board.level, p, coordinate => {
    const cell = board.cells[coordinate]! as number;
    if (getMine(cell) !== undefined) {
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

export type GameCellCallback = (coordinate: number) => void;

export const getNeighbours = (
  { rows, cols, type, topology }: Grid,
  origin: Coordinate
) => {
  let neighbours = getNeighbourMatrix(type)(cols, calculateIndex(cols, origin));
  const torusAdjust = (n: number, max: number) =>
    n === -1 ? max - 1 : n === max ? 0 : n;
  switch (topology) {
    case Topology.TOROIDAL:
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

function openNeighbours(origin: Coordinate, board: GameRecord): void {
  const cell = getCell(board, origin);
  const { level } = board;
  let flaggedNeighboursCount = 0;
  visitNeighbours(level, origin, coord => {
    const c = getCell(board, coord)!;
    const state = getState(c);
    if (state === CellState.FLAGGED || state === CellState.EXPLODED) {
      flaggedNeighboursCount++;
    }
  });
  if (flaggedNeighboursCount < getThreats(cell)!) {
    return;
  }

  visitNeighbours(level, origin, coord => {
    const c = getCell(board, coord)!;
    const state = getState(c);
    if (state === CellState.NEW || state === CellState.UNCERTAIN) {
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

  return produce(board, (mutable: GameRecord) => {
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
    } else if (getState(getCell(mutable, coordinate)!) === CellState.OPEN) {
      const openPlusMines = mutable.level.mines + stats[CellState.OPEN];
      const numCells = mutable.level.cols * mutable.level.rows;
      const done = openPlusMines === numCells;
      mutable.state = done ? GameState.COMPLETED : mutable.state;
    }
  });
}

function toggleOpen(coordinate: Coordinate, board: GameRecord): void {
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
  const state = getState(cell);
  if (state === CellState.FLAGGED) {
    return;
  }

  if (state === CellState.OPEN) {
    openNeighbours(coordinate, board);
    return;
  }

  let newState: CellState = state;
  const mine = getMine(cell);
  switch (state) {
    case CellState.NEW:
    case CellState.UNCERTAIN:
      newState = mine !== undefined ? CellState.EXPLODED : CellState.OPEN;
      break;
    case CellState.EXPLODED:
      return;

    default:
      assertNever(state);
  }

  updateCell(board, [coordinate, setState(cell, newState)]);

  if (getThreats(cell) === 0 && newState !== CellState.EXPLODED) {
    const predicate = (cellRecord: CellRecord) => {
      const s = getState(cellRecord);
      return s === CellState.NEW || s === CellState.UNCERTAIN;
    };
    const visitor = ([coord, c]: [Coordinate, CellRecord]) => {
      if (getMine(c) !== undefined) {
        throw new Error(`Expected cell not to be mined`);
      }
      if (predicate(c)) {
        updateCell(board, [coord, setState(c, CellState.OPEN)]);
        if (getThreats(c) === 0) {
          getNeighbours(board.level, coord).forEach(cc => {
            const cr = board.cells[cc]!;
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

function toggleFlagged(coordinate: Coordinate, board: GameRecord): void {
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

  const state = getState(cell);
  let newCellState: CellState = state;
  switch (state) {
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
      assertNever(state);
  }

  updateCell(board, [coordinate, setState(cell, newCellState)]);

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
  topology,
  type,
}: Level): void => {
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
  if (!isTopology(topology)) {
    errors.push({ field: 'topology', value: topology, msg: 'Invalid' });
  }
  if (!isGridType(type)) {
    errors.push({ field: 'type', value: type, msg: 'Invalid' });
  }

  if (errors.length > 0) {
    throw new ValidationError('Invalid level', errors);
  }
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
  try {
    validateLevel(level);
    saveValue('object', 'level', level);

    const cells = createEmptyCells(level).map(zero);

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
  } catch (err) {
    if (err instanceof ValidationError) {
      return {
        board: createBoard({
          level: createLevel(level),
          cells: new Uint16Array(),
          onGameOver,
          state: GameState.ERROR,
          error: err,
        }),
        nextState: (_cmd, [_coordinate, game]) => game,
      };
    }
    throw err;
  }
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
      mine: 1,
    },
    {
      state: CellState.FLAGGED,
      threatCount: 0,
    },
    {
      state: CellState.UNCERTAIN,
      mine: 1,
    },
    {
      state: CellState.UNCERTAIN,
      threatCount: 0,
    },
    {
      state: CellState.EXPLODED,
      mine: 2,
    },
    {
      state: CellState.OPEN,
      mine: 3,
    },
  ] as CellRecordObject[]).map(fromObject);

  const cols = 4;
  const board = createBoard({
    cells: new Uint16Array(cells),
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
