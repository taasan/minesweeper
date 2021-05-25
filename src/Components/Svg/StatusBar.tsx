import React from 'react';
import { Store } from '../../store';
import { CellState, GameState } from '../../Game';
import {
  FitWindowContext,
  NumeralSystemContext,
  RotateContext,
} from '../../store/contexts/settings';
import Timer from '../Timer';
import FormatNumber from '../FormatNumber';
import { DISARMED_MINE, EXPLODED_MINE, getFlag } from '../../graphics';
import { Link } from '../../router';
import registerEvent from './registerEvent';
import { assertNever } from '../../lib';

const StatusBar = () => {
  const { state, dispatch, containerRef } = React.useContext(Store);

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
  const [fullScreen, setFullScreen] = React.useState(
    document.fullscreenElement != null
  );

  const itemsProps = { className: 'SvgMinesweeper__Controls__Item' };

  React.useEffect(() => {
    return registerEvent('fullscreenchange', () =>
      setFullScreen(document.fullscreenElement != null)
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
                    (e: React.SyntheticEvent<HTMLInputElement>) => {
                      setFitWindow(e.currentTarget?.checked);
                      dispatch({ type: 'fitWindow', ref: containerRef });
                    },
                    [containerRef, dispatch, setFitWindow]
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
};

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

export default StatusBar;
