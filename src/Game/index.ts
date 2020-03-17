import { List, Record, RecordOf } from 'immutable';

export type NumThreats = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export enum CellState {
  OPEN,
  FLAGGED,
  UNCERTAIN,
  NEW,
  EXPLODED,
}

export type ICell = {
  readonly state: CellState;
  readonly threatCount: NumThreats | Mine;
} & Coordinate;

const createGameCell: Record.Factory<ICell> = Record<ICell>({
  state: CellState.NEW,
  threatCount: 0,
  col: 0,
  row: 0,
});

export type GameCell = RecordOf<ICell>;

export type Coordinate = {
  readonly col: number;
  readonly row: number;
};

export enum GameState {
  PAUSED,
  GAME_OVER,
  COMPLETED,
  INITIALIZED,
  PLAYING,
  NOT_INITIALIZED,
}

type IGame = Readonly<{
  cells: List<List<GameCell>>;
  state: GameState;
  level: Level;
}>;

export type Game = RecordOf<IGame>;

export function* getCellGenerator(game: Game) {
  const cols = game.cells.size;
  const rows = game.cells.get(0)!.size;
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const c = game.cells.get(col)!.get(row) as GameCell;
      yield c;
    }
  }
}

const createBoard: Record.Factory<IGame> = Record<IGame>({
  cells: List.of(),
  state: GameState.NOT_INITIALIZED,
  level: { cols: 0, rows: 0, mines: 0 },
});

export type Level = {
  cols: number;
  rows: number;
  mines: number;
};

export type Mine = 0xff;

type CellStateStats = { [key in CellState]: number };

export function getCellStates(game: Game): CellStateStats {
  return [...getCellGenerator(game)].reduce(
    (result, item) => ({
      ...result,
      [item.state]: result[item.state] + 1,
    }),
    {
      [CellState.OPEN]: 0,
      [CellState.FLAGGED]: 0,
      [CellState.UNCERTAIN]: 0,
      [CellState.NEW]: 0,
      [CellState.EXPLODED]: 0,
    }
  );
}

export function createGame({ cols, rows, mines }: Level): Game {
  let board: Game = createBoard().set('level', { cols, rows, mines });

  for (let col = 0; col < cols; col++) {
    let cells: List<GameCell> = List.of();
    for (let row = 0; row < rows; row++) {
      cells = cells.push(createGameCell({ row, col }));
    }
    board = board.set('cells', board.get('cells').push(cells));
  }
  let minesSet = 0;
  do {
    const { row, col }: Coordinate = {
      col: randomInt(cols),
      row: randomInt(rows),
    };
    if (!isMine({ row, col }, board)) {
      board = updateCell(
        board,
        board
          .get('cells')
          .get(col)!
          .get(row)!
          .set('threatCount', 0xff)
      );
      minesSet++;
    }
  } while (minesSet < mines);

  if (minesSet !== mines) {
    throw new Error(`Set ${minesSet} mines, expected ${mines}`);
  }

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      if (isMine({ col: col, row: row }, board)) {
        continue;
      }
      const cells = board.get('cells').get(col)!;
      const cell = cells.get(row)!;
      board = updateCell(
        board,
        cell.set('threatCount', countThreats({ row, col }, board))
      );
    }
  }

  return board.set('state', GameState.INITIALIZED);
}

export function updateCell(board: Game, newCell: GameCell): Game {
  const { row, col } = newCell;
  const cols = board.get('cells');
  const cells = cols.get(col)!;
  const newCells = cells.set(row, newCell);
  return board.set('cells', cols.set(col, newCells));
}

function collectSafeCells(board: Game, origin: Coordinate): Set<GameCell> {
  const visited: Set<GameCell> = new Set();
  const visitor = (cell: GameCell) => {
    if (visited.has(cell)) {
      return;
    }
    visited.add(cell);
    if (cell.threatCount === 0) {
      visitNeighbours(board, cell, visitor);
    }
  };

  visitNeighbours(board, origin, visitor);
  return visited;
}

export function isMine(p: Coordinate, board: Game): boolean {
  return (
    board
      .get('cells')
      .get(p.col)
      ?.get(p.row)?.threatCount === 0xff
  );
}

function countThreats(p: Coordinate, immutableBoard: Game): NumThreats | Mine {
  let threats: NumThreats = 0;

  if (isMine(p, immutableBoard)) {
    return 0xff;
  }
  visitNeighbours(immutableBoard, p, cell => {
    if (isMine(cell, immutableBoard)) {
      threats++;
    }
  });
  if (threats < 0 || threats > 8) {
    throw new Error(`Unexpected threat number: ${threats}`);
  }

  return threats as NumThreats;
}

export function randomInt(max: number) {
  return Math.floor(Math.random() * Math.floor(max));
}

export function visitNeighbours(
  board: Game,
  p: Coordinate,
  callback: (cell: GameCell) => void
) {
  const width = board.get('cells').size;
  const height = board.get('cells').get(0)!.size;

  for (let col = -1; col <= 1; col++) {
    const col1 = p.col + col;

    if (col1 >= width || col1 < 0) {
      continue;
    }

    for (let row = -1; row <= 1; row++) {
      if (col === 0 && row === 0) {
        continue;
      }

      const row1 = p.row + row;

      if (row1 >= height || row1 < 0) {
        continue;
      }

      const cell = board
        .get('cells')
        .get(col1)!
        .get(row1)!;

      callback(cell);
    }
  }
}

export enum Cmd {
  OPEN,
  FLAG,
  NONE,
}

export function nextState(
  command: Cmd,
  [cell, board]: [GameCell, Game]
): [GameCell, Game] {
  switch (command) {
    case Cmd.NONE:
      return [cell, board];
    case Cmd.OPEN:
      return toggleOpen([cell, board]);
    case Cmd.FLAG:
      return toggleFlagged([cell, board]);
  }
}

function toggleOpen([cell, board]: [GameCell, Game]): [GameCell, Game] {
  if (
    !(
      board.state === GameState.PLAYING || board.state === GameState.INITIALIZED
    )
  ) {
    return [cell, board];
  }
  const oldCellState = cell.state;
  let newState: CellState = oldCellState;
  if (oldCellState === CellState.NEW || oldCellState === CellState.UNCERTAIN) {
    newState = cell.threatCount === 0xff ? CellState.EXPLODED : CellState.OPEN;
  }
  let newBoard = board;
  if (board.state === GameState.INITIALIZED) {
    newBoard = newBoard.set('state', GameState.PLAYING);
  }
  const newCell = cell.set('state', newState);
  newBoard = updateCell(newBoard, newCell);
  const { col, row } = cell;
  if (newCell.threatCount === 0) {
    collectSafeCells(newBoard, {
      col,
      row,
    }).forEach(c => {
      if (c.threatCount === 0xff) {
        throw new Error(`Expected 0-8 threatCount, got ${c.threatCount}`);
      }
      if (c.state === CellState.NEW || c.state === CellState.UNCERTAIN) {
        newBoard = updateCell(newBoard, c.set('state', CellState.OPEN));
      }
    });
  }
  const stats = getCellStates(newBoard);
  return [
    newCell,
    newState === CellState.EXPLODED
      ? newBoard.set('state', GameState.GAME_OVER)
      : newState === CellState.OPEN
      ? newBoard.set(
          'state',
          newBoard.level.mines + stats[CellState.OPEN] ===
            newBoard.level.cols * newBoard.level.rows
            ? GameState.COMPLETED
            : newBoard.state
        )
      : newBoard,
  ];
}

function toggleFlagged([cell, board]: [GameCell, Game]): [GameCell, Game] {
  if (
    !(
      board.state === GameState.PLAYING || board.state === GameState.INITIALIZED
    )
  ) {
    return [cell, board];
  }
  let newCellState: CellState = cell.state;
  switch (cell.state) {
    case CellState.FLAGGED:
      newCellState = CellState.UNCERTAIN;
      break;
    case CellState.UNCERTAIN:
      newCellState = CellState.NEW;
      break;
    case CellState.NEW:
      newCellState = CellState.FLAGGED;
      break;
  }
  const newCell = cell.set('state', newCellState);
  let newBoard = board;
  if (board.state === GameState.INITIALIZED) {
    newBoard = newBoard.set('state', GameState.PLAYING);
  }
  return [newCell, updateCell(newBoard, newCell)];
}
