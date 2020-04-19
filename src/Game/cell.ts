import { Record, RecordOf } from 'immutable';

export type NumThreats = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function isNumThreats(n: any): n is NumThreats {
  return Number.isInteger(Number(n)) && n >= 0 && n <= 8;
}

export type Mine = 0xff;

export enum CellState {
  OPEN,
  FLAGGED,
  UNCERTAIN,
  NEW,
  EXPLODED,
}

export const createGameCell: Record.Factory<ICell> = Record<ICell>({
  state: CellState.NEW,
  threatCount: 0,
});

export type CellStateName = keyof typeof CellState;

export type CellStateStats = { [key in CellState]: number };

export type ICell = {
  state: CellState;
  threatCount: NumThreats | Mine;
};

export type CellRecord = RecordOf<ICell>;
