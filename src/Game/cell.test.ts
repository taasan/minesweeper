import {
  CellState,
  fromObject,
  getMine,
  getState,
  getThreats,
  setMine,
  setState,
  setValue,
  toObject,
} from './cell';

// ?       | State   | Mine    | Threats
// --------|---------|---------|--------
// 0 0 0 0 | 0 0 0 0 | 0 0 0 0 | 0 0 0 0
// f e d c | b a 9 8 | 7 6 5 4 | 3 2 1 0

const a = 0b0000010000110010;
const aObj = {
  threatCount: 2,
  mine: 3,
  state: 4,
};

test('a', () => {
  expect(getThreats(a)).toBe(2);
  expect(getMine(a)).toBe(3);
  expect(getState(a)).toBe(4);
  expect(toObject(a)).toEqual(aObj);
  expect(fromObject(aObj as any)).toBe(a);
});

test('setState', () => {
  expect(getState(setState(a, CellState.EXPLODED))).toBe(CellState.EXPLODED);
});

test('setMine', () => {
  const mine = 0b1111;
  expect(setMine(0, mine).toString(16)).toBe((0b11110000).toString(16));
});

test('setValue', () => {
  expect(setValue(0, 0, 10)).toBe(10);
  expect(setValue(4, 0, 0b1)).toBe(0b10000);
  expect(setValue(4, 0, 0b1101)).toBe(0b11010000);
});
