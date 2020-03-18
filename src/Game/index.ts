import { OrderedMap, Record, RecordOf, ValueObject } from 'immutable';

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
};

const createGameCell: Record.Factory<ICell> = Record<ICell>({
  state: CellState.NEW,
  threatCount: 0,
});

export type GameCell = RecordOf<ICell>;

export class Coordinate implements ValueObject {
  readonly col: number;
  readonly row: number;

  constructor({ row, col }: { row: number; col: number }) {
    this.row = row;
    this.col = col;
  }

  public hashCode() {
    return 31 * this.col + this.row;
  }

  public equals(other: any) {
    if (this === other) {
      return true;
    }
    if (!('row' in other && 'col' in other)) {
      return false;
    }
    return this.row === other.row && this.col === other.col;
  }
}

export enum GameState {
  PAUSED,
  GAME_OVER,
  COMPLETED,
  INITIALIZED,
  PLAYING,
  NOT_INITIALIZED,
}

type IGame = Readonly<{
  cells: OrderedMap<Coordinate, GameCell>;
  state: GameState;
  level: Level;
}>;

export type Game = RecordOf<IGame>;

const createBoard: Record.Factory<IGame> = Record<IGame>({
  cells: OrderedMap(),
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
  return game.cells.entrySeq().reduce(
    (result, [, item]) => ({
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
  const cells: Array<[Coordinate, GameCell]> = [];
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      cells.push([new Coordinate({ row, col }), createGameCell()]);
    }
  }
  board = board.set('cells', OrderedMap(cells));
  let minesSet = 0;
  do {
    const coordinate = new Coordinate({
      col: randomInt(cols),
      row: randomInt(rows),
    });
    if (!isMine(coordinate, board)) {
      const cell = board.cells.get(coordinate)!;
      board = updateCell(board, [coordinate, cell.set('threatCount', 0xff)]);
      minesSet++;
    }
  } while (minesSet < mines);

  if (minesSet !== mines) {
    throw new Error(`Set ${minesSet} mines, expected ${mines}`);
  }

  for (let col = 0; col < cols; col++) {
    for (let row = 0; row < rows; row++) {
      const coordinate = new Coordinate({ row, col });
      if (isMine(coordinate, board)) {
        continue;
      }
      const cell = board.cells.get(coordinate)!;
      board = updateCell(board, [
        coordinate,
        cell.set('threatCount', countThreats(coordinate, board)),
      ]);
    }
  }

  return board.set('state', GameState.INITIALIZED);
}

export function updateCell(
  board: Game,
  [coordinate, newCell]: [Coordinate, GameCell]
): Game {
  const oldCell = board.cells.get(coordinate);
  if (
    board.state === GameState.PLAYING &&
    oldCell?.threatCount !== newCell.threatCount
  ) {
    throw new Error(
      `Expected ${newCell.threatCount}, got ${oldCell?.threatCount}`
    );
  }
  return board.set('cells', board.get('cells').set(coordinate, newCell));
}

function collectSafeCells(
  board: Game,
  origin: Coordinate
): Array<[Coordinate, GameCell]> {
  const visited = new Map<number, [Coordinate, GameCell]>();
  const visitor = ([coordinate, cell]: [Coordinate, GameCell]) => {
    const pos = board.level.cols * coordinate.col + coordinate.row;
    if (visited.has(pos)) {
      return;
    }
    visited.set(pos, [coordinate, cell]);
    if (cell.threatCount === 0) {
      visitNeighbours(board, coordinate, visitor);
    }
  };

  visitNeighbours(board, origin, visitor);
  return [...visited.values()];
}

export function isMine(p: Coordinate, board: Game): boolean {
  return board.cells.get(p)?.threatCount === 0xff;
}

function countThreats(p: Coordinate, immutableBoard: Game): NumThreats | Mine {
  let threats: NumThreats = 0;

  if (isMine(p, immutableBoard)) {
    return 0xff;
  }
  visitNeighbours(immutableBoard, p, ([, cell]) => {
    if (cell.threatCount === 0xff) {
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

export type GameCellCallback = ([coordinate, cell]: [
  Coordinate,
  GameCell
]) => void;

export function visitNeighbours(
  board: Game,
  p: Coordinate,
  ...callbacks: Array<GameCellCallback>
) {
  const width = board.level.cols;
  const height = board.level.rows;

  for (let c = -1; c <= 1; c++) {
    const col = p.col + c;

    if (col >= width || col < 0) {
      continue;
    }

    for (let r = -1; r <= 1; r++) {
      if (c === 0 && r === 0) {
        continue;
      }

      const row = p.row + r;

      if (row >= height || row < 0) {
        continue;
      }
      const coordinate = new Coordinate({ row, col });
      const cell = board.cells.get(coordinate)!;

      callbacks.forEach(cb => cb([coordinate, cell]));
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
  [[coordinate, cell], board]: [[Coordinate, GameCell], Game]
): [GameCell, Game] {
  switch (command) {
    case Cmd.NONE:
      return [cell, board];
    case Cmd.OPEN:
      return toggleOpen([[coordinate, cell], board]);
    case Cmd.FLAG:
      return toggleFlagged([[coordinate, cell], board]);
  }
}

function toggleOpen([[coordinate, cell], board]: [
  [Coordinate, GameCell],
  Game
]): [GameCell, Game] {
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
  newBoard = updateCell(newBoard, [coordinate, newCell]);

  if (newCell.threatCount === 0) {
    collectSafeCells(newBoard, coordinate).forEach(([coord, c]) => {
      if (c.threatCount === 0xff) {
        throw new Error(`Expected 0-8 threatCount, got ${c.threatCount}`);
      }
      if (c.state === CellState.NEW || c.state === CellState.UNCERTAIN) {
        newBoard = updateCell(newBoard, [
          coord,
          c.set('state', CellState.OPEN),
        ]);
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

function toggleFlagged([[coordinate, cell], board]: [
  [Coordinate, GameCell],
  Game
]): [GameCell, Game] {
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
  return [newCell, updateCell(newBoard, [coordinate, newCell])];
}
