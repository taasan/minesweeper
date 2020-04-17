import React, { Dispatch, FC, MouseEvent, memo } from 'react';
import './SvgCell.scss';
import { CellState, Coordinate, GridType, NumThreats } from '../../Game';

import { CmdAction } from '../reducer';
import { onContextMenu } from '..';
import useAsyncDispatch from '../../Hooks/useAsyncDispatch';

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
    dispatch: _dispatch,
    state,
    coordinate,
    threats,
    content,
    mined,
    gridType,
  } = props;

  const dispatch = useAsyncDispatch(_dispatch, {
    onfulfilled: action => console.log('fulfilled', { action }),
    onrejected: (action, err) => console.error('rejected', { action, err }),
    onfinally: action => console.log('finally', { action }),
  });

  const handleClick = (e: MouseEvent) => {
    if (dispatch != null && (state === CellState.OPEN || e.button === 0))
      dispatch({
        type: 'POKE',
        coordinate,
      });
  };

  const handleContextMenu = (e: MouseEvent) => {
    onContextMenu(e);
    if (dispatch != null) {
      switch (state) {
        case CellState.NEW:
        case CellState.FLAGGED:
        case CellState.UNCERTAIN:
          window.navigator.vibrate(100);
          return dispatch({
            type: 'FLAG',
            coordinate,
          });
      }
    }
  };

  const role = /^\p{Number}$/u.test(content.toString()) ? undefined : 'img';

  const fontSize = cellSize * 0.6;
  return (
    <svg
      viewBox={`0 0 ${cellSize} ${cellSize}`}
      className="SvgCell"
      onMouseDown={handleClick}
      onContextMenu={handleContextMenu}
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
        {state === CellState.OPEN && threats === 0 ? undefined : content}
      </text>
      <use
        href={`#${GridType[gridType]}`}
        scale={cellSize}
        className="SvgCell__Cover"
        fillOpacity={1}
        strokeWidth={0}
      />
      {state === CellState.FLAGGED || state === CellState.UNCERTAIN ? (
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
      ) : (
        undefined
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
