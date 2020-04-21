import produce, { Immutable, immerable } from 'immer';
import { Coordinate, calculateCoordinate, calculateIndex } from './coordinate';
import { CellRecord, CellStateStats, ICell } from './cell';
import { Grid } from './grid';

export function assertNever(x: never): never {
  throw new Error('Unexpected value: ' + x);
}

export class GameError {
  readonly cause?: Error;
  readonly message: string;
  [immerable] = true;
  constructor(msg: string, err?: Error) {
    this.message = msg;
    this.cause = Object.freeze(err);
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
  DEMO,
}

export type Level = Grid & {
  mines: number;
};

export type IGame = {
  cells: Map<number, CellRecord>;
  state: GameState;
  level: Readonly<Level>;
  cellStates: CellStateStats;
  error: GameError | null;
  version: number;
  onGameOver: () => void;
};

export type GameRecord = Immutable<IGame>;

export const getCell = (
  {
    level,
    cells,
  }:
    | {
        level: Level;
        cells: [number, ICell][] | Map<number, ICell>;
      }
    | GameRecord,
  coordinate: Coordinate
): ICell => {
  if (Array.isArray(cells)) {
    const { row, col } = calculateCoordinate(level.cols, coordinate);
    return cells[row][col] as ICell;
  }
  return cells.get(calculateIndex(level, coordinate))!;
};

export const setCell = (
  board: IGame,
  coordinate: Coordinate,
  cell: ICell
): ReadonlyMap<number, CellRecord> =>
  produce(board.cells, draft => {
    draft.set(calculateIndex(board.level, coordinate), cell);
  });
