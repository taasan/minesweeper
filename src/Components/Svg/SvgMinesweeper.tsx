import * as React from 'react';
import './SvgMinesweeper.scss';
import {
  CellState,
  GameState,
  // legend,
} from '../../Game';
import ErrorBoundary from '../ErrorBoundary';
import SvgBoard from './Board/SvgBoard';
import { onContextMenu } from '..';
import { DISARMED_MINE, EXPLODED_MINE, getFlag } from '../../graphics';
import { assertNever } from '../../lib';
import FormatNumber from '../FormatNumber';
import Timer from '../Timer';
import {
  FitWindowContext,
  NumeralSystemContext,
  RotateContext,
  useSettingsContext,
} from '../../store/contexts/settings';
import { Store } from '../../store';
import { Link } from '../../router';

// TODO: Move
const registerEvent = (event: string, callback: (_: any) => void) => {
  window.addEventListener(event, callback);
  return () => window.removeEventListener(event, callback);
};

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
            style={boardStyle}
            numeralSystem={numeralSystem}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};

const StatusBar = React.memo(() => {
  const { state, dispatch } = React.useContext(Store);

  const { elapsedTime, showMenu, lives } = state;
  const board = state.game.board;
  const gameState = board.state;
  const remaining =
    board.level.mines -
    board.cellStates[CellState.FLAGGED] -
    board.cellStates[CellState.EXPLODED];

  const remainingLives = lives - board.cellStates[CellState.EXPLODED];
  const { numeralSystem } = React.useContext(NumeralSystemContext);
  const handleGameStateClick = React.useCallback(() => {
    switch (gameState) {
      case GameState.PAUSED:
        dispatch({
          type: 'UNPAUSE',
        });
        break;
      case GameState.PLAYING:
        dispatch({
          type: 'PAUSE',
        });
        break;
      case GameState.COMPLETED:
      case GameState.GAME_OVER:
      case GameState.ERROR:
        dispatch({
          type: 'setLevel',
        });
    }
  }, [dispatch, gameState]);
  const { rotate, setRotate } = React.useContext(RotateContext);
  const { fitWindow, setFitWindow } = React.useContext(FitWindowContext);
  const [fullScreen, setFullScreen] = React.useState(document.fullscreen);

  const itemsProps = { className: 'SvgMinesweeper__Controls__Item' };

  React.useEffect(() => {
    return registerEvent('fullscreenchange', () =>
      setFullScreen(document.fullscreen)
    );
  }, []);

  return (
    <div className="SvgMinesweeper__Controls">
      <div role="button" onClick={handleGameStateClick} {...itemsProps}>
        <Timer
          numeralSystem={numeralSystem}
          elapsedTime={elapsedTime}
          running={gameState === GameState.PLAYING}
        />
      </div>
      <div
        {...itemsProps}
        role="button"
        onClick={handleGameStateClick}
        aria-label={`Game state: ${GameState[gameState]}`}
      >
        {renderGameState(gameState, lives, remainingLives)}
      </div>
      <div {...itemsProps} role="button">
        <FormatNumber numeralSystem={numeralSystem} n={remaining} />
        <span role="img" aria-label="Remaining mines">
          {remaining >= 0 ? getFlag() : '💩'}
        </span>{' '}
      </div>
      <details open={showMenu}>
        <summary
          onClick={e => {
            e.preventDefault();
            dispatch({ type: 'toggleMenu' });
          }}
          {...itemsProps}
        >
          <span role="img" aria-label="menu">
            🍔
          </span>
        </summary>
        <nav>
          <ul role="menu" className="Menu__List">
            <li role="menuitem">
              <Link to="level.html">Select level</Link>
            </li>
            <li role="menuitem">
              <Link to="settings.html">Settings</Link>
            </li>
            <li role="menuitemcheckbox" aria-checked={fitWindow}>
              <label>
                <input
                  onChange={React.useCallback(
                    (e: React.SyntheticEvent<HTMLInputElement>) =>
                      setFitWindow(e.currentTarget?.checked),
                    [setFitWindow]
                  )}
                  type="checkbox"
                  checked={fitWindow}
                />
                Fit to window
              </label>
            </li>
            <li role="menuitemcheckbox" aria-checked={rotate}>
              <label>
                <input
                  onChange={React.useCallback(
                    (e: React.SyntheticEvent<HTMLInputElement>) =>
                      setRotate(e.currentTarget?.checked),
                    [setRotate]
                  )}
                  type="checkbox"
                  checked={rotate}
                />
                Rotate
              </label>
            </li>
            <li role="menuitemcheckbox" aria-checked={fullScreen}>
              <label>
                <input
                  onChange={() =>
                    dispatch({
                      type: fullScreen ? 'exitFullscreen' : 'requestFullscreen',
                    })
                  }
                  type="checkbox"
                  checked={fullScreen}
                />
                Fullscreen
              </label>
            </li>
          </ul>
        </nav>
      </details>
    </div>
  );
});

function renderGameState(state: GameState, lives: number, remaining: number) {
  switch (state) {
    case GameState.PAUSED:
      return '🧘';
    case GameState.COMPLETED:
    case GameState.PLAYING:
      return (
        EXPLODED_MINE.repeat(lives - remaining) +
        DISARMED_MINE.repeat(remaining + 1)
      );
    case GameState.ERROR:
      return '🤔';
    case GameState.GAME_OVER:
      return '🤬';
    case GameState.DEMO:
    case GameState.INITIALIZED:
    case GameState.NOT_INITIALIZED:
      return '🎯';
  }
  assertNever(state);
}

export default SvgMinesweeper;
