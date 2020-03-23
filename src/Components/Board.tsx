import * as React from 'react';
import './Board.css';
import Cell from './Cell';
import {
  CellState,
  GameState,
  NumThreats,
  Mine,
  GameRecord,
  assertNever,
  calculateIndex,
} from '../Game';
import { Dispatch } from 'react';
import { Action } from './Minesweeper';

type IProps = {
  board: GameRecord;
  dispatch: Dispatch<Action>;
};

const Board: React.FC<IProps> = (props: IProps) => {
  const { board, dispatch } = props;

  const boardState = board.state;
  const gameOver = boardState === GameState.GAME_OVER;
  switch (board.state) {
    case GameState.ERROR:
      return (
        <main>
          <header>
            <h1>Error</h1>
            <p>Something went wrong</p>
          </header>
          {board.error != null ? board.error.message : 'Unknown error'}
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
  const { cols, rows } = board.level;
  return (
    <div
      className="Board"
      style={{
        ['--board-columns' as any]: cols,
        ['--board-rows' as any]: rows,
      }}
      data-state={GameState[board.state]}
      onPointerDown={e => e.preventDefault()}
    >
      {[...board.cells.entries()].map(
        ([coordinate, { threatCount: threats, state: cellState }]) => {
          return (
            <Cell
              coordinate={calculateIndex(board.level.cols, coordinate)}
              key={`${coordinate.row}-${coordinate.col}`}
              dispatch={dispatch}
              content={getContent(cellState, threats, boardState)}
              state={cellState}
              threats={threats}
              done={
                (threats === 0xff ||
                  (cellState !== CellState.NEW &&
                    cellState !== CellState.OPEN)) &&
                (gameOver || boardState === GameState.COMPLETED)
              }
            />
          );
        }
      )}
    </div>
  );
};

function getContent(
  state: CellState,
  threats: NumThreats | Mine,
  gameState: GameState
): string | NumThreats {
  const [disarmedMine, explodedMine] = ['💣', '💥'];
  const isMined = threats === 0xff;
  const gameWon = gameState === GameState.COMPLETED;
  const gameOver = gameState === GameState.GAME_OVER;
  const done = gameOver || gameWon;
  const isFlagged = state === CellState.FLAGGED;
  const isDisarmed = done && isMined && (gameWon || (gameOver && isFlagged));

  if (isDisarmed) {
    return disarmedMine;
  }
  if (gameOver && state !== CellState.EXPLODED && threats === 0xff) {
    return explodedMine;
  }
  if (gameState === GameState.COMPLETED && state !== CellState.EXPLODED) {
    return getContent(CellState.OPEN, threats, GameState.PLAYING);
  }
  switch (state) {
    case CellState.FLAGGED:
      return gameOver && !isMined ? '❌' : '🚩';
    case CellState.UNCERTAIN:
      return '❓';
    case CellState.OPEN:
      return threats === 0xff ? disarmedMine : threats;
    case CellState.EXPLODED:
      return '💀';
    default:
      return '\u00A0';
  }
}

export default Board;
