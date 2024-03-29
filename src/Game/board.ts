import { immerable } from 'immer';
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
  NOT_INITIALIZED,
  INITIALIZED,
  PLAYING,
  PAUSED,
  COMPLETED,
  GAME_OVER,
  ERROR,
  DEMO,
}

export type Level = Grid & {
  mines: number;
};

export type CellArray = Uint16Array;

export type GameRecord = {
  cells: CellArray;
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
        cells: CellArray;
      }
    | GameRecord,
  coordinate: Coordinate
): CellRecord => {
  return cells[calculateIndex(level.cols, coordinate)] as CellRecord;
};
