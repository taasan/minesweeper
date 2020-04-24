import * as React from 'react';
import './SvgBoard.css';
import {
  Coordinate,
  GameRecord,
  GameState,
  GridType,
  ICell,
  Topology,
  ValidationError,
  assertNever,
  calculateCoordinate,
  calculateIndex,
  isNumThreats,
} from '../../../Game';
import { Dispatch } from 'react';
import { CmdAction } from '../../../store';
import { getContent } from './getContent';
import SvgCell, { cellSize } from './SvgCell';
import { onContextMenu } from '../..';
import log from '../../../lib/log';
import { isEqual } from 'lodash';
import { hexOffset, hexagonPoints } from '../../../lib';
import { NumeralSystemContext } from '../../../store/contexts/settings';

// @ts-ignore
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
  rotated: boolean;
  dispatch?: Dispatch<CmdAction>;
  style?: React.CSSProperties;
};

const SvgBoard = React.forwardRef<Readonly<SVGSVGElement>, IProps>(
  (props, ref) => {
    const { dispatch, board, style } = props;
    const { numeralSystem } = React.useContext(NumeralSystemContext);
    const boardState = board.state;
    switch (board.state) {
      case GameState.ERROR:
        const error =
          board.error != null ? board.error.message : 'Unknown error';
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
          log.error(board.error);
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
    const { cols, rows, topology } = board.level;
    const rotated = props.rotated && rows !== cols;

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

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rotate = ({ x, y }: { x: number; y: number }) => {
      const translationx = cols / 2;
      const translationy = rows / 2;
      const cos = 1;
      const sin = 0;
      return {
        x: cos * (x - width / 2) + sin * (y - height / 2) + translationx,
        y: cos * (y - height / 2) - sin * (x - width / 2) + translationy,
      };
    };

    const mapCell = ([coordinate, cell]: [Coordinate, ICell]) => {
      const { row, col } =
        typeof coordinate === 'number'
          ? calculateCoordinate(cols, coordinate)
          : coordinate;

      let x = col * cellSize + ((row & 1) === 1 ? xOffset : 0);
      let y = row * cellSize * yFactor;
      /*
      if (rotated) {
        const p = rotate({ x, y });
        x = p.x;
        y = p.y;
      }
*/
      const additional: JSX.Element[] = [];
      if (topology === Topology.TORUS) {
        if (col === 0) {
          additional.push(mapCell([{ row, col: cols }, cell]));
        } else if (col === cols - 1) {
          additional.push(mapCell([{ row, col: -1 }, cell]));
        }
        if (row === 0) {
          additional.push(mapCell([{ col, row: rows }, cell]));
        } else if (row === rows - 1) {
          additional.push(mapCell([{ col, row: -1 }, cell]));
        }
      }
      const jsx = (
        <SvgCell
          coordinate={calculateIndex(
            { cols },
            { row: (row + rows) % rows, col: (col + cols) % cols }
          )}
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
          done={done}
        />
      );
      const key = { key: `${x},${y}` };
      return additional.length === 0 ? (
        <svg {...key} x={x} y={y} width={cellSize} height={cellSize}>
          {jsx}
        </svg>
      ) : (
        <g {...key}>
          {[...additional]}
          <svg x={x} y={y} width={cellSize} height={cellSize}>
            {jsx}
          </svg>
        </g>
      );
    };

    const v =
      topology === Topology.LIMITED
        ? {
            x: 0,
            y: 0,
            width,
            height,
          }
        : {
            x: -cellSize,
            y: -cellSize,
            width: width + cellSize * 2,
            height: height + cellSize * 2,
          };
    const v2 = rotated
      ? {
          ...v,
          width: v.height,
          height: v.width,
        }
      : v;
    const classes = ['SvgBoard'];
    if (rotated) {
      classes.push('SvgBoard__rotated');
    }
    const viewBox = `${v2.x} ${v2.y} ${v2.width} ${v2.height}`;
    const transform = rotated
      ? `translate(${height} 0) rotate(90 0 0)`
      : undefined;

    return (
      <svg
        ref={ref}
        style={style}
        preserveAspectRatio="xMidYMid meet"
        className={classes.join(' ')}
        pointerEvents={pointerEvents}
        viewBox={viewBox}
        data-grid={GridType[board.level.type]}
        data-s={GameState[boardState]}
        data-r={rotated ? 't' : 'f'}
        data-s2={
          boardState === GameState.DEMO
            ? GameState[GameState.GAME_OVER]
            : GameState[boardState]
        }
        onContextMenu={onContextMenu}
      >
        <g transform={transform}>
          <rect x="0" y="0" width="100%" height="100%" />
          {[...board.cells].map(mapCell)}
        </g>
        <defs>
          <circle
            id="circle"
            cx={cellSize / 2}
            cy={cellSize / 2}
            r={cellSize / 2 - 2}
          />
          <polygon
            id={`${GridType[GridType.HEX]}`}
            points={hexPoints()}
            width={cellSize}
            height={cellSize}
            fillOpacity={1}
            strokeWidth={0}
          />
          <polygon
            id={`${GridType[GridType.SQUARE]}`}
            points={squarePoints()}
            width={cellSize}
            height={cellSize}
            fillOpacity={1}
            strokeWidth={0}
          />
        </defs>
      </svg>
    );
  }
);

export default React.memo(SvgBoard, isEqual);