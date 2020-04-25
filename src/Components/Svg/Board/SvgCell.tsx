import React, { Dispatch, FC, MouseEvent, memo } from 'react';
import './SvgCell.scss';
import { CellState, GridType, NumThreats, assertNever } from '../../../Game';

import { CmdAction } from '../../../store';
import { onContextMenu } from '../..';
import useAsyncDispatch from '../../../Hooks/useAsyncDispatch';
import {
  Content,
  isSvgDataHref,
  isSvgHref,
  isSvgSymbol,
} from '../../../graphics';

type CellRecordProps = {
  coordinate: number;
  gridType: GridType;
  dispatch?: Dispatch<CmdAction>;
  content: Content;
  state: CellState;
  threats?: NumThreats;
  mined: boolean;
  done?: boolean;
};

export const cellSize = 33;

const SvgCell: FC<CellRecordProps> = props => {
  const {
    dispatch: _dispatch,
    state,
    coordinate,
    threats,
    content,
    mined,
    gridType,
    done,
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

  const render = () => {
    const cover = <use href={`#${GridType[gridType]}`} className="cc" />;

    switch (state) {
      case CellState.NEW:
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        return done ? <Text role={role} content={content} /> : cover;
      case CellState.FLAGGED:
      case CellState.UNCERTAIN:
        return (
          <>
            {cover}
            <Text role="img" content={content} />
          </>
        );
      case CellState.OPEN:
      case CellState.EXPLODED:
        return (
          <>
            <Text
              role={role}
              content={
                state === CellState.OPEN && threats === 0 ? undefined : content
              }
            />
            {cover}
          </>
        );
    }
    assertNever(state);
  };

  return (
    <svg
      viewBox={`0 0 ${cellSize} ${cellSize}`}
      className="c"
      onMouseDown={handleClick}
      onContextMenu={handleContextMenu}
      data-s={state}
      data-t={threats}
      data-m={mined ? true : undefined}
    >
      <use href={`#${GridType[gridType]}`} className="cb" />
      {render()}
      {/**}
      <text
        className="cc"
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
      content?: Content;
    }
  ) => {
    const domProps = {
      ...props,
      content: undefined,
    };
    const { content } = props;
    if (content != null && isSvgSymbol(content)) {
      const size = (cellSize * 2) / 3;
      const center = cellSize / 2;
      const ix = center - size / 2;
      if (isSvgHref(content) && !content.external) {
        return (
          <image
            className="ct"
            x={ix}
            y={ix}
            width={size}
            height={size}
            href={content.href}
          />
        );
      }
      return isSvgDataHref(content) ? (
        <use
          href={`#${content.key}`}
          className="ct"
          x={ix}
          y={ix}
          width={size}
          height={size}
        />
      ) : (
        <use
          href={`${content.href}`}
          className="ct"
          x={ix}
          y={ix}
          width={size}
          height={size}
        />
      );
    }
    return (
      <text
        className="ct"
        x={cellSize / 2}
        y={cellSize / 2}
        dominantBaseline="central"
        textAnchor="middle"
        fill="white"
        fontSize={cellSize / 2}
        {...domProps}
      >
        {content}
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
      data-s={CellState[state]}
      data-t={threats}
      data-m={mined ? true : undefined}
    >
      <use
        href={`#${GridType[gridType]}`}
        scale={cellSize}
        className="cb"
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
        className="cc"
        fillOpacity={1}
        strokeWidth={0}
      />
      {state === CellState.FLAGGED || state === CellState.UNCERTAIN ? (
        <Text role="img" content={content} rotated={rotated} />
      ) : (
        undefined
      )}
      <Text
        className="cc"
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
      className="ct"
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
      data-s={CellState[state]}
      data-t={threats}
      data-m={mined ? true : undefined}
      data-mine-type={mined ? random : undefined}
    >
      <span {...ariaProps}>{content}</span>
      {/*threats === 0 ? undefined : <span {...ariaProps}>{content}</span>* /}
      </div>
*/
export default memo(SvgCell);
