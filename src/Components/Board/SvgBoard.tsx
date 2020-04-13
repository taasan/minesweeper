import * as React from 'react';
import './SvgBoard.css';
import {
  Coordinate,
  GameRecord,
  GameState,
  GridType,
  ICell,
  ValidationError,
  assertNever,
  calculateCoordinate,
  isNumThreats,
} from '../../Game';
import { Dispatch } from 'react';
import { Action } from '../reducer';
import { NumeralSystem, getContent } from './getContent';
import SvgCell, { cellSize } from './SvgCell';
import { hexOffset, hexagonPoints, onContextMenu } from '..';

const hexPoints = () =>
  hexagonPoints()
    .map(({ x, y }) => `${(x * cellSize) / 2},${(y * cellSize) / 2}`)
    .join(' ');

const squarePoints = () => {
  const gap = 2;
  return [
    [gap, gap],
    [gap, cellSize - gap],
    [cellSize - gap, cellSize - gap],
    [cellSize - gap, gap],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(' ');
};

type IProps = {
  board: GameRecord;
  dispatch?: Dispatch<Action>;
  numeralSystem: NumeralSystem;
  style?: React.CSSProperties;
};

const SvgBoard = React.forwardRef<SVGSVGElement, IProps>((props, ref) => {
  const { dispatch, numeralSystem, board, style } = props;

  const boardState = board.state;
  switch (board.state) {
    case GameState.ERROR:
      const error = board.error != null ? board.error.message : 'Unknown error';
      let content;
      if (board.error instanceof ValidationError) {
        content = (
          <pre style={{ textAlign: 'initial' }}>
            {JSON.stringify(board.error.errors, undefined, 2)}
          </pre>
          /*
          <dl>
            {board.error.errors.map((err, i) => (
              <React.Fragment key={i}>
                <dt>Field: {err.field}</dt>
                <dd>
                  {err.msg}: {err.value}
                </dd>
              </React.Fragment>
            ))}
          </dl>
          */
        );
      }
      const cause =
        board.error != null &&
        board.error.cause != null &&
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        board.error.cause.message ? (
          <p>{board.error.cause.message}</p>
        ) : (
          undefined
        );
      if (board.error != null) {
        console.error(board.error);
      }
      return (
        <main className="Error">
          <header>
            <h1>Error</h1>
            <p>Something went wrong</p>
          </header>
          <p>{error}</p>
          {content}
          <section>
            <h2>Cause</h2>
            {cause ?? 'unknown'}
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
  // const { level } = board;
  const { cols, rows } = board.level;
  /*
    const { cols, rows } = !rotated
    ? board.level
    : { rows: level.cols, cols: level.rows };
*/
  const done =
    boardState === GameState.GAME_OVER ||
    boardState === GameState.COMPLETED ||
    boardState === GameState.DEMO ||
    boardState === GameState.ERROR;
  const pointerEvents =
    done || boardState === GameState.PAUSED ? 'none' : 'revert';

  const getOffsets = () => {
    const { type } = board.level;
    switch (type) {
      case GridType.SQUARE:
        return {
          xOffset: 0,
          yFactor: 1,
          width: cellSize * cols,
          height: cellSize * rows,
        };
      case GridType.HEX:
        const xOffset = cellSize / 2;
        const width = cellSize * cols + xOffset;
        const yFactor = hexOffset;
        // last y + cellSize
        const height = ((rows - 1) * yFactor + 1) * cellSize;
        return { xOffset, yFactor, width, height };
    }
    assertNever(type);
  };
  const { xOffset, yFactor, width, height } = getOffsets();

  const mapCell = ([index, cell]: [Coordinate, ICell]) => {
    const { row, col } = calculateCoordinate(cols, index);

    const x = col * cellSize + ((row & 1) === 1 ? xOffset : 0);
    const y = row * cellSize * yFactor;

    return (
      <svg key={index} x={x} y={y} width={cellSize} height={cellSize}>
        <SvgCell
          coordinate={index}
          gridType={board.level.type}
          dispatch={dispatch}
          content={getContent(
            cell.state,
            cell.threatCount,
            boardState,
            numeralSystem
          )}
          state={cell.state}
          threats={
            isNumThreats(cell.threatCount) ? cell.threatCount : undefined
          }
          mined={cell.threatCount === 0xff}
        />
      </svg>
    );
  };

  const classes = ['SvgBoard'];
  return (
    <svg
      ref={ref}
      style={style}
      preserveAspectRatio="xMidYMid meet"
      className={classes.join(' ')}
      pointerEvents={pointerEvents}
      viewBox={`0 0 ${width} ${height}`}
      data-grid={GridType[board.level.type]}
      data-state={GameState[boardState]}
      data-state2={
        boardState === GameState.DEMO
          ? GameState[GameState.GAME_OVER]
          : GameState[boardState]
      }
      onContextMenu={onContextMenu}
    >
      <rect x="0" y="0" width="100%" height="100%" />
      {[...board.cells].map(mapCell)}
      <defs>
        <polygon id={GridType[GridType.HEX]} points={hexPoints()} />
        <polygon id={GridType[GridType.SQUARE]} points={squarePoints()} />
      </defs>
    </svg>
  );
});

export default React.memo(SvgBoard);
