import * as React from 'react';
import Cell from './Cell';
import {
  CellState,
  GameState,
  Level,
  NumThreats,
  Mine,
  GameCell,
  Game,
  Cmd,
  createGame,
  isMine,
  visitNeighbours,
  nextState,
  randomInt,
  OPEN,
  FLAG,
  NONE,
} from '../Game';

type ILevels = {
  [keyof: string]: Level;
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
  const [board, setBoard] = React.useState(() => createGame(level));
  const gameOver = board.state === GameState.GAME_OVER;

  return (
    <div>
      <div>
        <aside>
          <button>{GameState[board.state]}</button>
          <select
            onChange={e => {
              const level = getLevel(e.target.value);
              setLevel(level);
              setBoard(createGame(level));
            }}
          >
            {Object.keys(LEVELS).map(k => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <button onClick={() => setBoard(createGame(level))}>New</button>
        </aside>
      </div>
      <div
        className="Minesweeper"
        style={{
          gridTemplateColumns: `repeat(${cols}, .5em)`,
          gridTemplateRows: `repeat(${rows}, .5em)`,
        }}
        data-state={board.state}
      >
        {board.get('cols').map((cols, col) => {
          return cols.map((cell, row) => {
            if (col !== cell.col || row !== cell.row) {
              throw new Error();
            }
            const { threatCount: threats, state } = cell;

            return (
              <Cell
                key={`${row}-${col}`}
                onPointerUp={
                  gameOver
                    ? undefined
                    : e => {
                        let newBoard = board;
                        if (
                          state === CellState.OPEN &&
                          cell.threatCount > 0 &&
                          !isMine(cell, board)
                        ) {
                          let flaggedNeighbours = 0;
                          visitNeighbours(newBoard, cell, c => {
                            if (c.state === CellState.FLAGGED) {
                              flaggedNeighbours++;
                            }
                          });
                          if (flaggedNeighbours !== threats) {
                            return;
                          }
                          visitNeighbours(newBoard, cell, c => {
                            if (
                              c.state === CellState.NEW ||
                              c.state === CellState.UNCERTAIN
                            ) {
                              [, newBoard] = nextState('OPEN', [c, newBoard]);
                            }
                          });
                          setBoard(newBoard);
                          return;
                        }

                        const [newCell, newGameState] = handlePointerUp(e, [
                          cell.set('state', state),
                          newBoard,
                        ]);
                        newBoard = newGameState;
                        if (
                          newCell.state === state &&
                          newBoard.state === board.state
                        ) {
                          // No change
                          return;
                        }
                        setBoard(newBoard);
                      }
                }
                content={render(state, threats, board.state)}
                state={state}
                disabled={
                  board.state === GameState.GAME_OVER ||
                  board.state === GameState.NOT_INITIALIZED ||
                  board.state === GameState.PAUSED
                }
                threats={threats !== 0xff ? threats : undefined}
              />
            );
          });
        })}
      </div>
    </div>
  );
};

const MINES = ['🤒', '😷', '🤮', '🤢', '🤡', '🧟', '🤥', '🤕'];

function render(
  state: CellState,
  threats: NumThreats | Mine,
  gameState: GameState
): string | NumThreats {
  switch (state) {
    case CellState.FLAGGED:
      return gameState === GameState.GAME_OVER
        ? render(CellState.OPEN, threats, GameState.PLAYING)
        : '🚩';
    case CellState.UNCERTAIN:
      return '❓';
    case CellState.OPEN:
      return threats === 0
        ? '\u00A0'
        : threats === 0xff
        ? MINES[randomInt(MINES.length)]
        : threats;
    case CellState.EXPLODED:
      return '💀';
    default:
      return '\u00A0';
  }
}

function handlePointerUp(
  e: React.MouseEvent,
  [cell, board]: [GameCell, Game]
): [GameCell, Game] {
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

export default Minesweeper;
