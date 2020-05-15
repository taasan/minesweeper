import * as React from 'react';
import './SvgMinesweeper.scss';
import { GameState } from '../../Game';
import ErrorBoundary from '../ErrorBoundary';
import SvgBoard from './Board/SvgBoard';
import { onContextMenu } from '..';
import { useSettingsContext } from '../../store/contexts/settings';
import { Store } from '../../store';
import StatusBar from './StatusBar';
import registerEvent from './registerEvent';
import { BOARD_BORDER_WIDTH } from '../../lib';

const SvgMinesweeper: React.FC<{}> = () => {
  const { state, dispatch } = React.useContext(Store);

  const { game, containerRef } = state;
  const { board } = game;

  const {
    fitWindow,
    rotate: rotated,
    numeralSystem,
  } = useSettingsContext().state;

  React.useEffect(() => {
    dispatch({ type: 'fitWindow' });
    // return registerEvent('resize', () => dispatch({ type: 'fitWindow' }));
  }, [dispatch]);

  React.useEffect(
    () =>
      registerEvent('keyup', (e: KeyboardEvent) => {
        if (e.keyCode === 80) {
          dispatch({
            type: board.state === GameState.PLAYING ? 'PAUSE' : 'UNPAUSE',
          });
        }
      }),

    [board.state, containerRef, dispatch]
  );

  React.useEffect(() => {
    return registerEvent('visibilitychange', () => {
      if (
        document.visibilityState !== 'visible' &&
        board.state === GameState.PLAYING
      ) {
        dispatch({ type: 'PAUSE' });
      }
    });
  }, [board.state, dispatch]);

  React.useEffect(() => {
    return registerEvent('blur', () => {
      dispatch({ type: 'PAUSE' });
    });
  }, [dispatch]);

  const done =
    board.state === GameState.GAME_OVER ||
    board.state === GameState.COMPLETED ||
    board.state === GameState.ERROR;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (done || board.state === GameState.PAUSED) {
      e.preventDefault();
      e.stopPropagation();
    }
  };
  const classes = ['SvgMinesweeper', 'SvgMinesweeper__Container'];
  /*
  if (rotated) {
    classes.push('SvgMinesweeper__rotated');
  }
*/
  const handleRestartGame = React.useCallback(
    e => {
      onContextMenu(e);
      window.navigator.vibrate(300);
      dispatch({
        type: 'setLevel',
        level: board.level,
      });
    },
    [board.level, dispatch]
  );

  const boardStyle: React.CSSProperties = fitWindow
    ? { ...state.maxBoardDimensions }
    : {};
  // boardStyle.pointerEvents = modal != null || showMenu ? 'none' : undefined;

  return (
    <div>
      <div
        className={classes.join(' ')}
        onPointerDown={handlePointerDown}
        onContextMenu={done ? handleRestartGame : onContextMenu}
      >
        <StatusBar />
        <ErrorBoundary>
          <SvgBoard
            rotated={rotated}
            ref={state.containerRef}
            dispatch={dispatch}
            board={board}
            style={{ borderWidth: `${BOARD_BORDER_WIDTH}px`, ...boardStyle }}
            numeralSystem={numeralSystem}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default SvgMinesweeper;
