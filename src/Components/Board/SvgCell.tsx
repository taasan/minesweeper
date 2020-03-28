import React, { FC, Dispatch, memo, MouseEvent } from 'react';
import './SvgCell.scss';
import { NumThreats, CellState, CmdName, Coordinate } from '../../Game';

import { Action } from '../SvgMinesweeper';

type ICellProps = {
  cellSize: number;
  coordinate: Coordinate;
  dispatch: Dispatch<Action>;
  content: string | NumThreats;
  state: CellState;
  threats?: NumThreats;
  mined: boolean;
};

const SvgCell: FC<ICellProps> = props => {
  const {
    dispatch,
    state,
    coordinate,
    threats,
    content,
    mined,
    cellSize,
  } = props;
  const x = 0,
    y = 0;
  const getCommand = (e: MouseEvent): CmdName => {
    if (state === CellState.OPEN) {
      return 'POKE';
    } else {
      switch (e.button) {
        case 0:
          return 'POKE';
        case 2:
          return 'FLAG';
        default:
          return 'NONE';
      }
    }
  };

  const handleClick = (e: MouseEvent) => {
    if (dispatch != null) {
      dispatch({
        type: getCommand(e),
        coordinate,
        dispatch,
      });
    }
  };

  const fontSize = cellSize * 0.6;
  return (
    <svg
      viewBox={`0 0 ${cellSize} ${cellSize}`}
      className="SvgCell"
      pointerEvents="all"
      onMouseDown={handleClick}
      data-state={CellState[state]}
      data-threats={threats}
      data-mined={mined ? true : undefined}
    >
      <rect
        className="SvgCell__Background"
        x={x + 2}
        y={y + 2}
        width={cellSize - 4}
        height={cellSize - 4}
        fillOpacity={1}
      />
      <text
        className="SvgCell__Text"
        x={x + cellSize / 2}
        y={y + cellSize / 2}
        dominantBaseline="central"
        textAnchor="middle"
        fill="white"
        fontSize={fontSize}
      >
        {// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        (state === CellState.OPEN && threats === 0) || content}
      </text>
      <rect
        className="SvgCell__Cover"
        x={x + 3}
        y={y + 3}
        width={cellSize - 6}
        height={cellSize - 6}
        fillOpacity={1}
        strokeOpacity={0}
      />
    </svg>
  );
};
/*

    <div
      role="button"
      onMouseDown={handleClick}
      className="Cell"
      data-state={CellState[state]}
      data-threats={threats}
      data-mined={mined ? true : undefined}
      data-mine-type={mined ? random : undefined}
    >
      <span {...ariaProps}>{content}</span>
      {/*threats === 0 ? undefined : <span {...ariaProps}>{content}</span>* /}
      </div>
*/
export default memo(SvgCell);
