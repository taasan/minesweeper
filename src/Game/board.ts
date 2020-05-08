import produce, { immerable } from 'immer';
import { Coordinate, calculateIndex } from './coordinate';
import { CellRecord, CellStateStats } from './cell';
import { Grid } from './grid';

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
        cells: Array<CellRecord>;
      }
    | GameRecord,
  coordinate: Coordinate
): CellRecord => {
  return cells[calculateIndex(level.cols, coordinate)] as CellRecord;
};

export const setCell = (
  board: GameRecord,
  coordinate: Coordinate,
  cell: CellRecord
): ReadonlyArray<CellRecord> =>
  produce(board.cells, draft => {
    draft[calculateIndex(board.level.cols, coordinate)] = cell;
  });
