import { assertNever } from '../lib';

export enum GridType {
  SQUARE,
  HEX,
}

export enum Topology {
  LIMITED,
  TOROIDAL,
}

export type Grid = {
  cols: number;
  rows: number;
  type: GridType;
  topology: Topology;
};

const hexNeighbours = (origin: {
  row: number;
  col: number;
}): Array<{ row: number; col: number }> => {
  const [even, odd] = [
    [
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, -1],
      [-1, 0],
      [0, 1],
    ],
    [
      [1, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
    ],
  ];

  const neighbours = (origin.row & 1) === 0 ? even : odd;
  return neighbours
    .map(([row, col]) => ({
      row: row + origin.row,
      col: col + origin.col,
    }))
    .flat(1);
};

const squareNeighbours = (origin: { row: number; col: number }) =>
  [-1, 0, 1]
    .map(col =>
      [-1, 0, 1].map(row => ({
        row: row + origin.row,
        col: col + origin.col,
      }))
    )
    .flat(1);

export const getNeighbourMatrix = (
  type: GridType
): ((origin: {
  row: number;
  col: number;
}) => Array<{ row: number; col: number }>) => {
  switch (type) {
    case GridType.SQUARE:
      return squareNeighbours;
    case GridType.HEX:
      return hexNeighbours;
  }
  assertNever(type);
};
