import React, { Dispatch, FC, MouseEvent, memo } from 'react';
import './SvgCell.scss';
import { CellState, GridType, NumThreats } from '../../Game';

import { CmdAction } from '../../store';
import { onContextMenu } from '..';
import useAsyncDispatch from '../../Hooks/useAsyncDispatch';

type ICellProps = {
  coordinate: number;
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
    // onfulfilled: action => console.log('fulfilled', { action }),
    onrejected: (action, err) => console.error('rejected', { action, err }),
    // onfinally: action => console.log('finally', { action }),
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
      <Text
        role={role}
        content={
          state === CellState.OPEN && threats === 0 ? undefined : content
        }
      />
      <use
        href={`#${GridType[gridType]}`}
        width={cellSize}
        height={cellSize}
        className="SvgCell__Cover"
        fillOpacity={1}
        strokeWidth={0}
      />
      {state === CellState.FLAGGED || state === CellState.UNCERTAIN ? (
        <Text role="img" content={content} />
      ) : (
        undefined
      )}
      {/*}
      {state === CellState.FLAGGED || state === CellState.UNCERTAIN ? (
        <text
          role={role}
          x={cellSize / 2}
          y={cellSize / 2}
          dominantBaseline="central"
          textAnchor="middle"
          fill="white"
          fontSize={fontSize}
          transform={transform}
        >
          <tspan className="SvgCell__Text">{content}</tspan>
        </text>
      ) : (
        undefined
      )}
      {/*}
      <Text
        className="SvgCell__Cover SvgCell__Text"
        stroke={'black'}
        strokeWidth={0.3}
        fontFamily="monospace"
        fillOpacity={1}
        content={coordinate}
      />
      {/**}
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
        transform={transform}
      >
        {coordinate}
      </text>
      {/**/}
    </svg>
  );
};

const Text = React.memo(
  (
    props: React.SVGProps<SVGTextElement> & {
      content?: string | number;
    }
  ) => {
    const domProps = {
      ...props,
      content: undefined,
    };
    return (
      <text
        className="SvgCell__Text"
        x={cellSize / 2}
        y={cellSize / 2}
        dominantBaseline="central"
        textAnchor="middle"
        fill="white"
        fontSize={cellSize / 2}
        {...domProps}
      >
        {props.content}
      </text>
    );
  }
);

/*



  const role = /^\p{Number}$/u.test(content.toString()) ? undefined : 'img';

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
      <Text
        role={role}
        rotated={rotated}
        content={
          state === CellState.OPEN && threats === 0 ? undefined : content
        }
      />
      <use
        href={`#${GridType[gridType]}`}
        scale={cellSize}
        className="SvgCell__Cover"
        fillOpacity={1}
        strokeWidth={0}
      />
      {state === CellState.FLAGGED || state === CellState.UNCERTAIN ? (
        <Text role="img" content={content} rotated={rotated} />
      ) : (
        undefined
      )}
      <Text
        className="SvgCell__Cover"
        stroke={'black'}
        strokeWidth={0.3}
        fontFamily="monospace"
        fillOpacity={1}
        rotated={rotated}
        content={coordinate}
      />
    </svg>
  );
};

const Text = (
  props: React.SVGProps<SVGTextElement> & {
    rotated: boolean;
    content?: string | number;
  }
) => {
  const domProps = {
    ...props,
    rotated: undefined,
    content: undefined,
  };
  return (
    <text
      className="SvgCell__Text"
      x={cellSize / 2}
      y={cellSize / 2}
      dominantBaseline="central"
      textAnchor="middle"
      fill="white"
      fontSize={cellSize / 2}
      writingMode={
        props.rotated ? 'sideways-lr' : 'sideways-lr'
        //? 'sideways-lr' : 'horizontal-tb'
      }
      {...domProps}
    >
      {props.content}
    </text>
  );
};




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
