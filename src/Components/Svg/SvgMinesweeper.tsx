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
import {
  Action,
  CmdAction,
  FullscreenAction,
  IState,
  LevelAction,
  MenuAction,
  ModalAction,
} from '../../store';
import { NumeralSystem, assertNever } from '../../lib';
import FormatNumber from '../FormatNumber';
import Timer from '../Timer';
import {
  FitWindowContext,
  RotateContext,
  useSettingsContext,
} from '../../store/contexts/settings';
import { Store } from '../../store';
import { Link } from '../../router';

export type IProps = { state: IState; dispatch: React.Dispatch<Action> };

// TODO: Move
const registerEvent = (event: string, callback: (_: any) => void) => {
  window.addEventListener(event, callback);
  return () => window.removeEventListener(event, callback);
};

const SvgMinesweeper: React.FC<IProps> = ({ state, dispatch }) => {
  const { game, containerRef, elapsedTime, showMenu, lives } = state;
  const { board } = game;

  const {
    numeralSystem,
    fitWindow,
    rotate: rotated,
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
        <StatusBar
          remainingLives={lives - board.cellStates[CellState.EXPLODED]}
          gameState={board.state}
          remainingMines={
            board.level.mines -
            board.cellStates[CellState.FLAGGED] -
            board.cellStates[CellState.EXPLODED]
          }
          dispatch={dispatch}
          elapsedTime={elapsedTime}
          numeralSystem={numeralSystem}
          showMenu={showMenu}
        />
        <ErrorBoundary>
          <SvgBoard
            rotated={rotated}
            ref={state.containerRef}
            dispatch={dispatch}
            board={board}
            style={boardStyle}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};

interface ControlsProps {
  gameState: GameState;
  remainingMines: number;
  remainingLives: number;
  dispatch: React.Dispatch<
    ModalAction | CmdAction | LevelAction | MenuAction | FullscreenAction
  >;
  elapsedTime(): number;
  numeralSystem: NumeralSystem;
  showMenu: boolean;
}

const StatusBar = React.memo(
  React.forwardRef<HTMLDivElement, ControlsProps>(
    (
      {
        dispatch,
        elapsedTime,
        numeralSystem,
        showMenu,
        gameState,
        remainingMines: remaining,
        remainingLives,
      },
      ref
    ) => {
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
      const { lives } = React.useContext(Store);
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
        <div className="SvgMinesweeper__Controls" ref={ref}>
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
                          type: fullScreen
                            ? 'exitFullscreen'
                            : 'requestFullscreen',
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
    }
  )
);

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
