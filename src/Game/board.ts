import { OrderedMap, RecordOf } from 'immutable';
import { Coordinate, calculateIndex } from './coordinate';
import { CellRecord, CellStateStats } from './cell';
import { Grid } from './grid';

export function assertNever(x: never): never {
  throw new Error('Unexpected value: ' + x);
}

export class GameError extends Error {
  readonly cause?: Error;
  constructor(msg: string, err?: Error) {
    super(msg);
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

export type IGame = Readonly<{
  cells: OrderedMap<number, CellRecord>;
  state: GameState;
  level: Readonly<Level>;
  cellStates: RecordOf<CellStateStats>;
  error: Readonly<GameError> | null;
  onGameOver(): void;
}>;

export type GameRecord = RecordOf<IGame>;

export const getCell = (board: IGame, coordinate: Coordinate) =>
  board.cells.get(calculateIndex(board.level, coordinate));

export const setCell = (
  board: IGame,
  coordinate: Coordinate,
  cell: CellRecord
) => board.cells.set(calculateIndex(board.level, coordinate), cell);
