import * as React from 'react';
import Cell from './Cell';
import {
  CellState,
  GameState,
  Level,
  NumThreats,
  Mine,
  GameRecord,
  Cmd,
  createGame,
  randomInt,
  Coordinate,
  NextStateFunction,
  assertNever,
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
  const [[board, nextState], setBoard] = React.useState(() =>
    createGame(level)
  );

  return (
    <div>
      <div>
        <aside>
          <button>
            {board.level.cols * board.level.rows -
              board.level.mines -
              board.cellStates[CellState.OPEN]}
          </button>
          <button>{board.cellStates[CellState.OPEN]}</button>
          <button>
            {board.level.mines -
              board.cellStates[CellState.FLAGGED] -
              board.cellStates[CellState.UNCERTAIN]}
          </button>
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
      <div>{renderBoard(board, nextState, setBoard)}</div>
    </div>
  );
};

const MINES = ['🤒', '😷', '🤮', '🤢', '🤡', '🧟', '🤥', '🤕'];

function renderBoard(
  board: GameRecord,
  nextState: NextStateFunction,
  setBoard: ([b, n]: [GameRecord, NextStateFunction]) => void
): JSX.Element {
  const { rows, cols } = board.level;
  const gameOver = board.state === GameState.GAME_OVER;
  switch (board.state) {
    case GameState.ERROR:
      return (
        <main>
          <header>
            <h1>Error</h1>
            <p>Something went wrong</p>
          </header>
          {board.error ? board.error.message : 'Unknown error'}
        </main>
      );
    case GameState.NOT_INITIALIZED:
    case GameState.COMPLETED:
    case GameState.GAME_OVER:
    case GameState.INITIALIZED:
    case GameState.PLAYING:
    case GameState.PAUSED:
      break;
    default:
      return assertNever(board.state);
  }

  return (
    <div
      className="Minesweeper"
      style={{
        gridTemplateColumns: `repeat(${cols}, .5em)`,
        gridTemplateRows: `repeat(${rows}, .5em)`,
      }}
      data-state={GameState[board.state]}
    >
      {gameOver ? (
        <header
          className="overlay"
          onClick={() => setBoard(createGame(board.level))}
        >
          Game over
        </header>
      ) : (
        <></>
      )}
      {[...board.cells.entries()].map(
        ([coordinate, { threatCount: threats, state }]) => {
          return (
            <Cell
              key={`${coordinate.row}-${coordinate.col}`}
              onPointerUp={
                gameOver
                  ? undefined
                  : e => {
                      let newBoard: GameRecord = board;
                      const newGameState = handlePointerUp(
                        e,
                        [coordinate, newBoard],
                        nextState
                      );
                      newBoard = newGameState;
                      setBoard([newBoard, nextState]);
                    }
              }
              content={render(state, threats, board.state)}
              state={[state, board.state]}
              disabled={
                board.state === GameState.COMPLETED ||
                board.state === GameState.GAME_OVER ||
                board.state === GameState.PAUSED
              }
              threats={threats}
            />
          );
        }
      )}
    </div>
  );
}
function render(
  state: CellState,
  threats: NumThreats | Mine,
  gameState: GameState
): string | NumThreats {
  if (
    gameState === GameState.GAME_OVER &&
    state !== CellState.EXPLODED &&
    threats === 0xff
  ) {
    return MINES[randomInt(MINES.length)];
  }
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
  [coordinate, board]: [Coordinate, GameRecord],
  nextState: NextStateFunction
): GameRecord {
  const cell = board.cells.get(coordinate)!;
  let command: Cmd;
  if (cell.state === CellState.OPEN) {
    command = Cmd.POKE;
  } else {
    switch (e.button) {
      case 0:
        command = Cmd.POKE;
        break;
      case 2:
        command = Cmd.FLAG;
        break;
      default:
        command = Cmd.NONE;
        break;
    }
  }

  return nextState(command, [coordinate, board]);
}

export default Minesweeper;
