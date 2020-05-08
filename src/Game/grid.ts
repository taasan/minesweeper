import { assertNever } from '../lib';
import { calculateCoordinate } from './coordinate';
import _ from 'lodash';

export enum GridType {
  SQUARE,
  HEX,
}

export const isGridType = (c: any): c is GridType =>
  typeof c === 'number' && GridType[c] != null;

export enum Topology {
  LIMITED,
  TOROIDAL,
}

export const isTopology = (c: any): c is Topology =>
  typeof c === 'number' && Topology[c] != null;

export type Grid = {
  cols: number;
  rows: number;
  type: GridType;
  topology: Topology;
};

const resolver = (a: number, b: number) => (a << 16) | b;

const hexNeighbours = (
  cols: number,
  origo: number
): Array<{
  row: number;
  col: number;
}> => {
  const origin = calculateCoordinate(cols, origo);
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

const hexNeighboursMemoized = _.memoize(hexNeighbours, resolver);

const squareNeighbours = (
  cols: number,
  origo: number
): Array<{
  row: number;
  col: number;
}> => {
  const origin = calculateCoordinate(cols, origo);
  return [-1, 0, 1]
    .map(col =>
      [-1, 0, 1].map(row => ({
        row: row + origin.row,
        col: col + origin.col,
      }))
    )
    .flat(1);
};

const squareNeighboursMemoized = _.memoize(squareNeighbours, resolver);

export const getNeighbourMatrix = (
  type: GridType
): ((cols: number, origo: number) => Array<{ row: number; col: number }>) => {
  switch (type) {
    case GridType.SQUARE:
      return squareNeighboursMemoized;
    case GridType.HEX:
      return hexNeighboursMemoized;
  }
  assertNever(type);
};
