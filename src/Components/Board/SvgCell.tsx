import React, { Dispatch, FC, MouseEvent, memo } from 'react';
import './SvgCell.scss';
import {
  CellState,
  CmdName,
  Coordinate,
  GridType,
  NumThreats,
} from '../../Game';

import { CmdAction } from '../reducer';

type ICellProps = {
  coordinate: Coordinate;
  gridType: GridType;
  dispatch?: Dispatch<CmdAction>;
  content: string | NumThreats;
  state: CellState;
  threats?: NumThreats;
  mined: boolean;
};

export const cellSize = 33;

const SvgCell: FC<ICellProps> = props => {
  const {
    dispatch,
    state,
    coordinate,
    threats,
    content,
    mined,
    gridType,
  } = props;

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
      });
    }
  };
  const role = /^\p{Number}$/u.test(content.toString()) ? undefined : 'img';

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
      <use
        href={`#${GridType[gridType]}`}
        scale={cellSize}
        className="SvgCell__Background"
        fillOpacity={1}
      />
      <text
        role={role}
        className="SvgCell__Text"
        x={cellSize / 2}
        y={cellSize / 2}
        dominantBaseline="central"
        textAnchor="middle"
        fill="white"
        fontSize={fontSize}
      >
        {// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        (state === CellState.OPEN && threats === 0) || content}
      </text>
      <use
        href={`#${GridType[gridType]}`}
        scale={cellSize}
        className="SvgCell__Cover"
        fillOpacity={1}
        strokeWidth={0}
      />
      {(state === CellState.FLAGGED || state === CellState.UNCERTAIN) && (
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        <text
          role={role}
          className="SvgCell__Text"
          x={cellSize / 2}
          y={cellSize / 2}
          dominantBaseline="central"
          textAnchor="middle"
          fill="white"
          fontSize={fontSize}
        >
          {content}
        </text>
      )}
      {/*}
      <text
        className="SvgCell__Cover"
        x={cellSize / 2}
        y={cellSize / 2}
        dominantBaseline="central"
        textAnchor="middle"
        fill="white"
        fontSize={fontSize}
        stroke={'black'}
        strokeWidth={0.3}
        fontFamily="monospace"
        fillOpacity={1}
      >
        {coordinate}
      </text>
        {*/}
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
