import produce, { immerable } from 'immer';
import { Coordinate, calculateCoordinate, calculateIndex } from './coordinate';
import { CellRecord, CellStateStats } from './cell';
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

export type GameRecord = {
  cells: Array<CellRecord>;
  state: GameState;
  level: Readonly<Level>;
  cellStates: CellStateStats;
  error: GameError | null;
  version: number;
  onGameOver: () => void;
};

export const getCell = (
  {
    level,
    cells,
  }:
    | {
        level: Level;
        cells: [number, CellRecord][] | Array<CellRecord>;
      }
    | GameRecord,
  coordinate: Coordinate
): CellRecord => {
  if (typeof cells[0] !== 'number') {
    return cells[calculateIndex(level, coordinate)] as CellRecord;
  }
  const { row, col } = calculateCoordinate(level.cols, coordinate);
  return (cells[row] as CellRecord[])[col] as CellRecord;
};

export const setCell = (
  board: GameRecord,
  coordinate: Coordinate,
  cell: CellRecord
): ReadonlyArray<CellRecord> =>
  produce(board.cells, draft => {
    draft[calculateIndex(board.level, coordinate)] = cell;
  });
