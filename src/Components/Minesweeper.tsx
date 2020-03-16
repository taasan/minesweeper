import * as React from 'react';
import * as Board from '../Game/Board';
import Cell from './Cell';

export const OPEN = 'OPEN';
export const FLAG = 'FLAG';
export const NONE = 'NONE';

export type Cmd = 'OPEN' | 'FLAG' | 'NONE';

type ILevels = {
  [keyof: string]: Board.Level;
};

const LEVELS: ILevels = {
  BEGINNER: { rows: 10, cols: 10, mines: 10 },
  INTERMEDIATE: { rows: 16, cols: 16, mines: 40 },
  EXPERT: { mines: 99, rows: 16, cols: 30 },
};

const getLevel = (key: string) => {
  const v = LEVELS[key] || undefined;
  return v ? v : LEVELS.BEGINNER;
};

const Minesweeper: React.FC = () => {
  const [level, setLevel] = React.useState(LEVELS.BEGINNER);
  const { rows, cols } = level;
  const [board, setBoard] = React.useState(
    () => new Board.default(level).board
  );
  const gameOver = board.state === 'GAME_OVER';

  return (
    <main>
      <div>
        {' '}
        <aside>
          <button>{board.state}</button>
          <select
            onChange={e => {
              const level = getLevel(e.target.value);
              setLevel(level);
              setBoard(new Board.default(level).board);
            }}
          >
            {Object.keys(LEVELS).map(k => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <button onClick={() => setBoard(new Board.default(level).board)}>
            New
          </button>
        </aside>
      </div>
      <div
        className="Minesweeper"
        style={{
          gridTemplateColumns: `repeat(${cols}, .5em)`,
          gridTemplateRows: `repeat(${rows}, .5em)`,
        }}
      >
        {board.get('cols').map((cols, col) => {
          return cols.map((cell, row) => {
            if (col !== cell.col || row !== cell.row) {
              throw new Error();
            }
            const { threats, state } = cell;
            const isMine = Board.isMine({ col, row }, board);
            const gameOverState =
              gameOver && isMine && state !== 'EXPLODED' ? 'OPEN' : state;

            return (
              <Cell
                key={`${row}-${col}`}
                onPointerUp={
                  gameOver
                    ? undefined
                    : e => {
                        let newBoard = board;
                        if (
                          e.button === 1 &&
                          state === 'OPEN' &&
                          cell.threats > 0 &&
                          !isMine
                        ) {
                          Board.visitNeighbours(newBoard, cell, c => {
                            if (c.state === 'NEW' || c.state === 'UNCERTAIN') {
                              const [newCell, newGameState] = nextState(
                                'OPEN',
                                [c, newBoard]
                              );
                              newBoard = Board.updateCell(
                                newGameState,
                                newCell
                              );
                            }
                          });
                          setBoard(newBoard);
                          return;
                        }

                        const [newCell, newGameState] = handlePointerUp(e, [
                          cell.set('state', gameOverState),
                          newBoard,
                        ]);
                        newBoard = newGameState;
                        if (
                          newCell.state === gameOverState &&
                          newBoard.state === board.state
                        ) {
                          // No change
                          return;
                        }
                        setBoard(newBoard);
                      }
                }
                content={render(gameOverState, threats)}
                state={gameOverState}
                disabled={
                  board.state === 'GAME_OVER' ||
                  board.state === 'NOT_INITIALIZED' ||
                  board.state === 'PAUSED'
                }
                threats={threats !== 0xff ? threats : undefined}
              />
            );
          });
        })}
      </div>
    </main>
  );
};

const MINES = ['🤒', '😷', '🤮', '🤢', '🤡', '🧟', '🤥', '🤕'];

function render(
  state: Board.CellState,
  threats: Board.NumThreats | Board.Mine
) {
  switch (state) {
    case 'FLAGGED':
      return '🚩';
    case 'UNCERTAIN':
      return '❓';
    case 'OPEN':
      return threats === 0
        ? '\u00A0'
        : threats === 0xff
        ? MINES[Board.randomInt(MINES.length)]
        : threats;
    case 'EXPLODED':
      return '💀';
    default:
      return '\u00A0';
  }
}

function handlePointerUp(
  e: React.MouseEvent,
  [cell, board]: [Board.IImmutableCellRecord, Board.IImmutableBoardRecord]
): [Board.IImmutableCellRecord, Board.IImmutableBoardRecord] {
  let command: Cmd;
  switch (e.button) {
    case 0:
      command = OPEN;
      break;
    case 2:
      command = FLAG;
      break;
    default:
      command = NONE;
      break;
  }
  return nextState(command, [cell, board]);
}

function nextState(
  command: Cmd,
  [cell, board]: [Board.IImmutableCellRecord, Board.IImmutableBoardRecord]
): [Board.IImmutableCellRecord, Board.IImmutableBoardRecord] {
  switch (command) {
    case NONE:
      return [cell, board];
    case OPEN:
      return toggleOpen([cell, board]);
    case FLAG:
      return toggleFlagged([cell, board]);
    default:
      throw new Error(command);
  }
}

function toggleOpen([cell, board]: [
  Board.IImmutableCellRecord,
  Board.IImmutableBoardRecord
]): [Board.IImmutableCellRecord, Board.IImmutableBoardRecord] {
  if (!(board.state === 'PLAYING' || board.state === 'INITIALIZED')) {
    return [cell, board];
  }
  const oldCellState = cell.state;
  let newState: Board.CellState = oldCellState;
  if (oldCellState === 'NEW' || oldCellState === 'UNCERTAIN') {
    newState = cell.threats === 0xff ? 'EXPLODED' : 'OPEN';
  }
  let newBoard = board;
  if (board.state === 'INITIALIZED') {
    newBoard = newBoard.set('state', 'PLAYING');
  }
  const newCell = cell.set('state', newState);
  newBoard = Board.updateCell(newBoard, newCell);
  const { col, row } = cell;
  if (newCell.threats === 0) {
    Board.collectZeroes(newBoard, {
      col,
      row,
    }).forEach(c => {
      newBoard = Board.updateCell(newBoard, c.set('state', 'OPEN'));
    });
  }
  return [
    newCell,
    newState === 'EXPLODED' ? newBoard.set('state', 'GAME_OVER') : newBoard,
  ];
}

function toggleFlagged([cell, board]: [
  Board.IImmutableCellRecord,
  Board.IImmutableBoardRecord
]): [Board.IImmutableCellRecord, Board.IImmutableBoardRecord] {
  if (!(board.state === 'PLAYING' || board.state === 'INITIALIZED')) {
    return [cell, board];
  }
  let newCellState: Board.CellState = cell.state;
  switch (cell.state) {
    case 'FLAGGED':
      newCellState = 'UNCERTAIN';
      break;
    case 'UNCERTAIN':
      newCellState = 'NEW';
      break;
    case 'NEW':
      newCellState = 'FLAGGED';
      break;
  }
  const newCell = cell.set('state', newCellState);
  let newBoard = board;
  if (board.state === 'INITIALIZED') {
    newBoard = newBoard.set('state', 'PLAYING');
  }
  return [newCell, Board.updateCell(newBoard, newCell)];
}

export default Minesweeper;
