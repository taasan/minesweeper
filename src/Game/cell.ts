export type NumThreats = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export function isNumThreats(n: any): n is NumThreats {
  return Number.isInteger(Number(n)) && n >= 0 && n <= 8;
}

type value =
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

export type Mine = Exclude<value, 0>;

export enum CellState {
  NEW,
  OPEN,
  FLAGGED,
  UNCERTAIN,
  EXPLODED,
}

export type CellStateStats = { [key in CellState]: number };

// ?       | State   | Mine    | Threats
// --------|---------|---------|--------
// 0 0 0 0 | 0 0 0 0 | 0 0 0 0 | 0 0 0 0
// f e d c | b a 9 8 | 7 6 5 4 | 3 2 1 0

// const ?Mask = 12;
const stateMask = 8;
const mineMask = 4;
const threatsMask = 0;

type mask = typeof stateMask | typeof mineMask | typeof threatsMask;

export const setValue = (mask: mask, prev: number, value: value) => {
  if (value < 0 || value > 0b1111) {
    throw new RangeError(`Invalid value: ${value}`);
  }
  return (prev & ~(0xf << mask)) | (value << mask);
};

const getValue = (mask: mask, cell: number): value =>
  ((cell & (0xf << mask)) >> mask) as value;

export const setState = (prev: number, state: CellState) => {
  if (CellState[state] == null) {
    throw new RangeError(`Unknown state ${state}`);
  }
  return setValue(stateMask, prev, state);
};

export const getState = (cell: number): CellState => getValue(stateMask, cell);

export const setMine = (prev: number, mine: value) =>
  setValue(mineMask, prev, mine);

export const getMine = (cell: number): Mine | undefined => {
  const mine = getValue(mineMask, cell);
  return mine !== 0 ? mine : undefined;
};

export const setThreats = (prev: number, threats: NumThreats) => {
  if (!isNumThreats(threats)) {
    throw new RangeError(`Invalid threat count: ${threats}`);
  }

  return setValue(threatsMask, prev, threats);
};

export const getThreats = (cell: number): NumThreats => {
  const threats = getValue(threatsMask, cell);
  if (!isNumThreats(threats)) {
    throw new RangeError(`Invalid threat count: ${threats}`);
  }

  return threats;
};

export const toObject = (cell: number): CellRecordObject => {
  const mine = getMine(cell);
  const threatCount = mine !== undefined ? getThreats(cell) : undefined;
  const state = getState(cell);

  return {
    state,
    threatCount,
    mine,
  };
};

export const fromObject = (o: CellRecordObject) =>
  setThreats(setMine(setState(0, o.state), o.mine ?? 0), o.threatCount ?? 0);

export type CellRecordObject = {
  state: CellState;
  threatCount?: NumThreats;
  mine?: Mine;
};

export type CellRecord = number;
