export type CoordinateObject = { row: number; col: number };
export type Coordinate = number | CoordinateObject;

export const calculateCoordinate = (cols: number, index: Coordinate) => {
  if (typeof index === 'object') {
    return index;
  }
  const col = index % cols;
  const row = (index - col) / cols;
  return { col, row };
};

export const calculateIndex = (cols: number, coordinate: Coordinate): number =>
  typeof coordinate === 'number'
    ? coordinate
    : coordinate.col + cols * coordinate.row;
