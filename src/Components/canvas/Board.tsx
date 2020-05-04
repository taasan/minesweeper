import React, { Dispatch } from 'react';
import {
  CellState,
  GameRecord,
  GameState,
  GridType,
  calculateCoordinate,
  calculateIndex,
  //  getMine,
  getState,
  getThreats,
  toObject,
} from '../../Game';
import { CmdAction } from '../../store';
//import { assertNever, hexOffset } from '../../lib';
import { Layout, OffsetCoord, Point } from '../../3rdparty/hex';
import { getContent } from '../Svg/Board/getContent';
import { registerEvent } from '../Svg/SvgMinesweeper';
import { useSettingsContext } from '../../store/contexts/settings';
import { onContextMenu } from '..';

type Props = {
  board: GameRecord;
  prev?: GameRecord;
  rotated: boolean;
  dispatch?: Dispatch<CmdAction>;
  style?: React.CSSProperties;
};

const minCellSize = 32;

const Board: React.FC<Props> = ({ board, dispatch /*, prev*/ }) => {
  const { cols, rows, type } = board.level;
  const [cellSize, setCellSize] = React.useState(67);
  const [maxWidth, setMaxWidth] = React.useState(window.innerWidth);
  const { state } = useSettingsContext();

  const offScreenCanvasRef = React.useRef(document.createElement('canvas'));
  const offScreenCanvas = offScreenCanvasRef.current;

  const ctx = offScreenCanvas.getContext('2d')!;

  React.useEffect(() => {
    const m =
      type === GridType.HEX
        ? (maxWidth / (1 + cols * Math.sqrt(3))) * 2
        : maxWidth / cols;

    setCellSize(Math.floor(Math.max(minCellSize, m - 2)));
  }, [cols, maxWidth, type]);

  React.useEffect(() => {
    return registerEvent('resize', () => {
      setMaxWidth(window.innerWidth);
    });
  }, []);

  const getCoordinate = (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    const { top, left } = canvas.getBoundingClientRect();
    const { clientX, clientY } = e;
    const x = clientX - left;
    const y = clientY - top;
    return type === GridType.HEX
      ? OffsetCoord.roffsetFromCube(
          -1,
          layout.pixelToHex(new Point(x, y)).round()
        )
      : { col: Math.floor(x / cellSize), row: Math.floor(y / cellSize) };
  };

  const handleOnClick = (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (board.state === GameState.PAUSED) {
      return;
    }
    dispatch!({
      type: 'POKE',
      coordinate: calculateIndex({ cols }, getCoordinate(e)),
    });
  };

  const handleOnContextMenu = (
    e: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    onContextMenu(e);
    if (board.state === GameState.PAUSED) {
      return;
    }
    window.navigator.vibrate(100);
    dispatch!({
      type: 'FLAG',
      coordinate: calculateIndex({ cols }, getCoordinate(e)),
    });
  };

  const canvasRef = React.useRef<HTMLCanvasElement>(
    document.createElement('canvas')
  );

  const canvas = canvasRef.current!;

  const width =
    type === GridType.HEX
      ? (cellSize * (1 + cols * Math.sqrt(3))) / 2 + 2
      : cellSize * cols;
  const height =
    type === GridType.HEX
      ? rows * cellSize * 0.75 + cellSize * 0.25
      : cellSize * rows;

  const layout = new Layout(
    Layout.pointy,
    new Point(cellSize / 2, cellSize / 2),
    new Point(cellSize / 2, cellSize / 2)
  );
  canvas.height = height;
  canvas.width = width;

  offScreenCanvas.width = canvas.width;
  offScreenCanvas.height = canvas.height;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const fontSize = cellSize * (type === GridType.HEX ? 0.5 : 0.75);
  // ctx.strokeRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  const boardState = board.state;

  const done =
    boardState === GameState.GAME_OVER ||
    boardState === GameState.COMPLETED ||
    boardState === GameState.DEMO ||
    boardState === GameState.ERROR;

  const $base02 = '#073642';
  const $base0 = '#839496';

  const getPoint = ({ row, col }: { row: number; col: number }) => {
    if (type === GridType.HEX) {
      const hex = OffsetCoord.roffsetToCube(
        (row & 1) === 1 ? OffsetCoord.ODD : OffsetCoord.EVEN,
        new OffsetCoord(col, row)
      );
      return layout.hexToPixel(hex);
    }
    return {
      x: col * cellSize + cellSize / 2,
      y: row * cellSize + cellSize / 2,
    };
  };

  const drawPolygon = (
    coordinate: number,
    style: string,
    fill: boolean
  ): void => {
    const { row, col } = calculateCoordinate(cols, coordinate);
    const getPoints = () => {
      if (type === GridType.HEX) {
        const hex = OffsetCoord.roffsetToCube(
          (row & 1) === 1 ? OffsetCoord.ODD : OffsetCoord.EVEN,
          new OffsetCoord(col, row)
        );
        return layout.polygonCorners(hex);
      } else {
        const x = col * cellSize;
        const y = row * cellSize;
        return [
          { x, y },
          { x, y: y + cellSize },
          { x: x + cellSize, y: y + cellSize },
          { x: x + cellSize, y },
        ];
      }
    };
    const points = getPoints();
    ctx.beginPath();
    points.forEach((point, i) => {
      const x = Math.floor(point.x);
      const y = Math.floor(point.y);
      if (i === 0) {
        ctx.moveTo(x, y);
      }
      ctx.lineTo(x, y);
    });
    ctx.closePath();

    if (fill) {
      ctx.fillStyle = style;
      ctx.fill();
    } else {
      ctx.strokeStyle = '#002b36';
      ctx.lineWidth = 1; // Math.max(1, cellSize / 20);
      ctx.stroke();
    }
  };

  const cells = board.cells.map((cell, coordinate) => ({ cell, coordinate }));

  if (boardState === GameState.PAUSED) {
    cells.forEach(({ coordinate }) => {
      drawPolygon(coordinate, $base0, true);
    });
  } else {
    const rendered = new Set<number>();

    const drawCover = (ss: CellState) =>
      ss === CellState.NEW ||
      (!done && ss === CellState.FLAGGED) ||
      ss === CellState.UNCERTAIN;

    // Cover
    cells
      .filter(({ cell }) => drawCover(getState(cell)))
      .forEach(({ coordinate }) => {
        rendered.add(coordinate);
        drawPolygon(coordinate, $base0, true);
      });

    const badBg = (cell: number) => {
      const ss = getState(cell);
      const t = getThreats(cell);
      const res =
        (done && t !== undefined && ss === CellState.FLAGGED) ||
        ss === CellState.EXPLODED;
      if (res && drawCover(ss)) {
        console.error(toObject(cell));
      }
      return res;
    };
    // Bad bg
    cells
      .filter(
        ({ cell, coordinate }) => !rendered.has(coordinate) && badBg(cell)
      )
      .forEach(({ coordinate }) => {
        rendered.add(coordinate);
        drawPolygon(coordinate, '#dc322f', true);
      });

    // The rest
    cells
      .filter(({ coordinate }) => !rendered.has(coordinate))
      .forEach(({ coordinate }) => drawPolygon(coordinate, $base02, true));

    rendered.clear();

    const renderThreats = (threatCount: number, coordinate: number) => {
      rendered.add(coordinate);
      ctx.save();
      ctx.font = `bolder ${fontSize}px monospace`;

      const colors = [
        'rgb(0,0,0,0)',
        '#268bd2',
        '#859900',
        '#dc322f',
        '#6c71c4',
        '#d33682',
        '#2aa198',
        '#b58900',
        '#cb4b16',
      ];
      ctx.fillStyle = colors[threatCount];
      const p = getPoint(calculateCoordinate(cols, coordinate));

      ctx.fillText(threatCount.toString(), p.x, p.y);
      ctx.restore();
    };

    // Open with threat count
    for (let i = 0; i <= 8; i++) {
      cells
        .filter(
          ({ cell }) =>
            getState(cell) === CellState.OPEN && getThreats(cell) === i
        )
        .forEach(({ coordinate }) => renderThreats(i, coordinate));
    }

    // The rest
    cells
      .filter(({ coordinate }) => !rendered.has(coordinate))
      .forEach(({ cell, coordinate }) => {
        if (true) {
          rendered.add(coordinate);

          const content = getContent(
            cell,
            boardState,
            state.numeralSystem,
            k => k
          ) as string;

          if (content !== '\u00A0') {
            ctx.save();
            ctx.font = `${fontSize}px color-emoji`;
            const p = getPoint(calculateCoordinate(cols, coordinate));
            ctx.fillText(content, p.x, p.y);
            ctx.restore();
          }
        }
      });
  }
  // Cell outline
  cells.forEach(({ coordinate }) => drawPolygon(coordinate, $base0, false));

  canvas.getContext('2d')!.drawImage(offScreenCanvas, 0, 0);

  return (
    <div className="SvgBoard" style={{ overflow: 'scroll' }}>
      <canvas
        ref={canvasRef}
        onClick={handleOnClick}
        onContextMenu={handleOnContextMenu}
      />
    </div>
  );
};

export default Board;
