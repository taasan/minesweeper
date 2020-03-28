import * as React from 'react';
import './Board.css';
import {
  CellState,
  GameState,
  NumThreats,
  Mine,
  GameRecord,
  assertNever,
  isNumThreats,
  randomInt,
} from '../../Game';
import { Dispatch } from 'react';
import { Action } from '../Minesweeper';
import Row from './Row';

type IProps = {
  board: GameRecord;
  rotated: boolean;
  dispatch: Dispatch<Action>;
};

const Board: React.FC<IProps> = (props: IProps) => {
  console.log('Render board');
  const { board, dispatch, rotated } = props;

  const boardState = board.state;
  switch (board.state) {
    case GameState.ERROR:
      const error = board.error != null ? board.error.message : 'Unknown error';
      const cause =
        board.error != null &&
        board.error.cause != null &&
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        board.error.cause.message ? (
          <p>{board.error.cause.message}</p>
        ) : (
          undefined
        );
      return (
        <main className="Error">
          <header>
            <h1>Error</h1>
            <p>Something went wrong</p>
          </header>
          <p>{error}</p>
          <section>
            <h2>Cause</h2>
            {/* eslint-disable-next-line @typescript-eslint/strict-boolean-expressions*/}
            {cause || 'unknown'}
          </section>
        </main>
      );
    case GameState.NOT_INITIALIZED:
    case GameState.COMPLETED:
    case GameState.GAME_OVER:
    case GameState.INITIALIZED:
    case GameState.PLAYING:
    case GameState.PAUSED:
    case GameState.DEMO:
      break;
    default:
      return assertNever(board.state);
  }
  const { cols, rows } = board.level;
  const done =
    boardState === GameState.GAME_OVER ||
    boardState === GameState.COMPLETED ||
    boardState === GameState.DEMO ||
    boardState === GameState.ERROR;
  const pointerEvents = done ? 'none' : 'initial';
  return (
    <div
      onContextMenu={e => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className="Board"
      style={{
        pointerEvents,
        ['--board-columns' as any]: rotated ? rows : cols,
        ['--board-rows' as any]: rotated ? cols : rows,
        gridAutoFlow: rotated ? 'column' : 'row',
      }}
      data-state={
        boardState === GameState.DEMO
          ? GameState[GameState.GAME_OVER]
          : GameState[board.state]
      }
    >
      {[...new Array(rows)].map((_, row) => {
        const from = row + row * (cols - 1);
        const to = from + cols;
        return (
          <Row
            key={row}
            getContent={getContent}
            cells={[...board.cells.slice(from, to)]}
            dispatch={dispatch}
            gameState={boardState}
          />
        );
      })}
    </div>
  );
};

function getContent(
  state: CellState,
  threats: NumThreats | Mine,
  gameState: GameState
): string | NumThreats {
  const mines = [
    '🤒',
    '😷',
    '🤮',
    '🤢',
    '🤡',
    '🧟',
    '🤥',
    '🤕',
    '🤧',
    '👻',
    '🥵',
    '🥶',
    '👺',
  ];

  const disarmedMine = '🥰';
  const isMined = threats === 0xff;
  const gameWon = gameState === GameState.COMPLETED;
  const gameOver = gameState === GameState.GAME_OVER;
  const demo = gameState === GameState.DEMO;
  const done = gameOver || gameWon || demo;
  const isFlagged = state === CellState.FLAGGED;
  const isDisarmed = done && isMined && isFlagged && (gameWon || gameOver);

  if (gameWon && isMined && state !== CellState.FLAGGED) {
    return '🥺';
  }

  if (isDisarmed) {
    return disarmedMine;
  }
  if ((gameOver || demo) && state !== CellState.EXPLODED && threats === 0xff) {
    return mines[randomInt(mines.length)];
  }
  if (gameState === GameState.COMPLETED && state !== CellState.EXPLODED) {
    return getContent(CellState.OPEN, threats, GameState.PLAYING);
  }
  switch (state) {
    case CellState.FLAGGED:
      return (demo || gameOver) && !isMined ? '💩' : '🚩';
    case CellState.UNCERTAIN:
      return '❓';
    case CellState.OPEN:
      return isNumThreats(threats) ? threats : '\u00A0';
    case CellState.EXPLODED:
      return '💀';
    default:
      return '\u00A0';
  }
}

export default React.memo(Board);
