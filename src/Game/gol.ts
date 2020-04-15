import { Grid, visitNeighbours } from '.';

export type Gol = {
  grid: Grid;
  cells: ReadonlyArray<boolean>;
  generation: number;
};

export const next = ({ grid, cells, generation }: Gol) => ({
  grid,
  generation: generation + 1,
  cells: cells.map((alive, i) => {
    let liveNeigbours = 0;
    visitNeighbours(grid, i, j => {
      if (cells[j]) liveNeigbours++;
    });
    return alive
      ? liveNeigbours === 2 || liveNeigbours === 3
      : liveNeigbours === 3;
  }),
});
