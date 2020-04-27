import produce from 'immer';

export type NumThreats = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function isNumThreats(n: any): n is NumThreats {
  return Number.isInteger(Number(n)) && n >= 0 && n <= 8;
}

export type Mine =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15;

export enum CellState {
  NEW,
  OPEN,
  FLAGGED,
  UNCERTAIN,
  EXPLODED,
}

export const createGameCell: (cell: Partial<CellRecord>) => CellRecord = cell =>
  produce(cell, draft => ({
    state: CellState.NEW,
    threatCount: 0,
    mine: 0,
    ...draft,
  }));

export type CellStateName = keyof typeof CellState;

export type CellStateStats = { [key in CellState]: number };

export type CellRecord = {
  state: CellState;
  threatCount: NumThreats;
  mine: Mine;
};
