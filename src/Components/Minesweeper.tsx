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
  getCellStates,
  Coordinate,
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
  const cellStates = getCellStates(board);
  return (
    <div>
      <div>
        <aside>
          <button>{cellStates[CellState.FLAGGED]}</button>
          <button>{board.level.mines - cellStates[CellState.FLAGGED]}</button>
          <button>{GameState[board.state]}</button>
          <select
            onChange={e => {
              const l = getLevel(e.target.value);
              setLevel(l);
              setBoard(createGame(l));
            }}
          >
            {Object.keys(LEVELS).map(k => (
              <option key={k}>{k}</option>
            ))}
          </select>
          <button onClick={() => setBoard(createGame(level))}>New</button>
        </aside>
      </div>
      <div>
        <div
          className="Minesweeper"
          style={{
            gridTemplateColumns: `repeat(${cols}, .5em)`,
            gridTemplateRows: `repeat(${rows}, .5em)`,
          }}
          data-state={GameState[board.state]}
        >
          {[...board.cells.entries()].map(([coordinate, cell]) => {
            const { threatCount: threats, state } = cell;

            return (
              <Cell
                key={`${coordinate.row}-${coordinate.col}`}
                onPointerUp={
                  gameOver
                    ? undefined
                    : e => {
                        let newBoard = board;
                        if (
                          state === CellState.OPEN &&
                          cell.threatCount > 0 &&
                          !isMine(coordinate, board)
                        ) {
                          let flaggedNeighbours = 0;
                          visitNeighbours(newBoard, coordinate, ([, c]) => {
                            if (c.state === CellState.FLAGGED) {
                              flaggedNeighbours++;
                            }
                          });
                          if (flaggedNeighbours !== threats) {
                            return;
                          }
                          visitNeighbours(
                            newBoard,
                            coordinate,
                            ([coord, c]) => {
                              if (
                                c.state === CellState.NEW ||
                                c.state === CellState.UNCERTAIN
                              ) {
                                [, newBoard] = nextState(Cmd.OPEN, [
                                  [coord, c],
                                  newBoard,
                                ]);
                              }
                            }
                          );
                          setBoard(newBoard);
                          return;
                        }

                        const [[, newCell], newGameState] = handlePointerUp(e, [
                          [coordinate, cell.set('state', state)],
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
                state={[state, board.state]}
                disabled={
                  board.state === GameState.COMPLETED ||
                  board.state === GameState.GAME_OVER ||
                  board.state === GameState.NOT_INITIALIZED ||
                  board.state === GameState.PAUSED
                }
                threats={threats}
              />
            );
          })}
        </div>
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
  if (gameState === GameState.COMPLETED && state !== CellState.EXPLODED) {
    return render(CellState.OPEN, threats, GameState.PLAYING);
  }
  switch (state) {
    case CellState.FLAGGED:
      return gameState === GameState.GAME_OVER && threats !== 0xff
        ? '❌'
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
  [cell, board]: [[Coordinate, GameCell], Game]
): [[Coordinate, GameCell], Game] {
  let command: Cmd;
  switch (e.button) {
    case 0:
      command = Cmd.OPEN;
      break;
    case 2:
      command = Cmd.FLAG;
      break;
    default:
      command = Cmd.NONE;
      break;
  }
  return nextState(command, [cell, board]);
}

export default Minesweeper;
