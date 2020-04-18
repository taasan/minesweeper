import * as React from 'react';
import './SvgMinesweeper.scss';
import {
  CellState,
  GameState,
  Level,
  assertNever,
  // legend,
} from '../Game';
import ErrorBoundary from './ErrorBoundary';
import { useReducer } from 'react';
import SvgBoard from './Board/SvgBoard';
import { onContextMenu } from '.';
import { LevelChooser } from './LevelChooser';
import Modal from './Modal';
import { getFlag } from './Board/getContent';
import SettingsDialog from './Settings/SettingsDialog';
import {
  CmdAction,
  LevelAction,
  MenuAction,
  ModalAction,
  ModalType,
  initialState,
  reducer,
} from '../store';
import { useTheme } from '../Hooks';
import { NumeralSystem, log } from '../lib';
import FormatNumber from './FormatNumber';
import Timer from './Timer';
import SettingsContextProvider, {
  NumeralSystemContext,
  ThemeContext,
} from '../store/contexts/settings';

export type IProps = { level: Level };

const SvgMinesweeper: React.FC<IProps> = () => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const registerEvent = (event: string, callback: (_: any) => void) => {
    window.addEventListener(event, callback);
    return () => window.removeEventListener(event, callback);
  };

  const {
    game,
    settings,
    modalStack,
    containerRef,
    elapsedTime,
    timingEvents,
    showMenu,
  } = state;
  const { board } = game;
  const { fitWindow } = settings;
  const elapsedTimeCb = React.useCallback(() => {
    const len = timingEvents.length;
    if ((len & 1) !== 1) {
      log.error('EEP!');
    }
    const lastStart = timingEvents[len - 1];
    const a = elapsedTime + Date.now() - lastStart;
    return a;
  }, [elapsedTime, timingEvents]);

  const { theme } = React.useContext(ThemeContext);
  const { numeralSystem } = React.useContext(NumeralSystemContext);
  useTheme(theme);

  React.useEffect(() => {
    dispatch({ type: 'fitWindow' });
    // return registerEvent('resize', () => dispatch({ type: 'fitWindow' }));
  }, []);

  const modal = modalStack[modalStack.length - 1];
  React.useEffect(
    () =>
      registerEvent(
        'keyup',
        (e: KeyboardEvent) =>
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          e.keyCode === 80 && dispatch({ type: 'TOGGLE_PAUSE' })
      ),

    [containerRef]
  );

  React.useEffect(() => {
    return registerEvent('visibilitychange', () => {
      if (
        document.visibilityState !== 'visible' &&
        board.state === GameState.PLAYING
      ) {
        dispatch({ type: 'TOGGLE_PAUSE' });
      }
    });
  }, [board.state]);

  const closeModal = () => dispatch({ type: 'closeModal' });
  // const showModal = (m: ModalType) => dispatch({ type: 'showModal', modal: m });

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
    [board.level]
  );

  return (
    <div>
      <div
        className={classes.join(' ')}
        onPointerDown={handlePointerDown}
        onContextMenu={done ? handleRestartGame : onContextMenu}
      >
        <StatusBar
          gameState={board.state}
          remainingMines={
            board.level.mines -
            board.cellStates[CellState.FLAGGED] -
            board.cellStates[CellState.EXPLODED]
          }
          dispatch={dispatch}
          elapsedTime={elapsedTimeCb}
          numeralSystem={numeralSystem}
          showMenu={showMenu}
        />
        <ErrorBoundary>
          <SvgBoard
            ref={state.containerRef}
            dispatch={dispatch}
            board={board}
            numeralSystem={numeralSystem}
            style={
              fitWindow === true ? { ...state.maxBoardDimensions } : undefined
            }
          />
        </ErrorBoundary>
      </div>
      <Modal
        isOpen={modal === ModalType.SELECT_LEVEL}
        onRequestClose={closeModal}
      >
        <LevelChooser
          onCancel={closeModal}
          onChange={l => {
            closeModal();
            dispatch({
              type: 'setLevel',
              level: l,
            });
          }}
          level={board.level}
          numeralSystem={numeralSystem}
        />
      </Modal>
      <Modal isOpen={modal === ModalType.SETTINGS} onRequestClose={closeModal}>
        <SettingsDialog dispatch={dispatch} />
      </Modal>
    </div>
  );
};

interface ControlsProps {
  gameState: GameState;
  remainingMines: number;
  dispatch: React.Dispatch<ModalAction | CmdAction | LevelAction | MenuAction>;
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
      },
      ref
    ) => {
      const handleGameStateClick = React.useCallback(() => {
        switch (gameState) {
          case GameState.PAUSED:
          case GameState.PLAYING:
            dispatch({
              type: 'TOGGLE_PAUSE',
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

      const itemsProps = { className: 'SvgMinesweeper__Controls__Item' };
      return (
        <div className="SvgMinesweeper__Controls" ref={ref}>
          <div role="button" onClick={handleGameStateClick} {...itemsProps}>
            {gameState === GameState.NOT_INITIALIZED ? (
              <FormatNumber numeralSystem={numeralSystem} n={0} />
            ) : (
              <Timer
                numeralSystem={numeralSystem}
                elapsedTime={elapsedTime}
                running={gameState === GameState.PLAYING}
              />
            )}
          </div>
          <div
            {...itemsProps}
            role="button"
            onClick={handleGameStateClick}
            aria-label={`Game state: ${GameState[gameState]}`}
          >
            {renderGameState(gameState)}
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
                <li
                  role="menuitem"
                  onClick={() =>
                    dispatch({
                      type: 'showModal',
                      modal: ModalType.SELECT_LEVEL,
                    })
                  }
                >
                  Select level
                </li>
                <li
                  role="menuitem"
                  onClick={() =>
                    dispatch({ type: 'showModal', modal: ModalType.SETTINGS })
                  }
                >
                  Settings
                </li>
              </ul>
            </nav>
          </details>
        </div>
      );
    }
  )
);

function renderGameState(state: GameState) {
  switch (state) {
    case GameState.PAUSED:
      return '🧘';
    case GameState.PLAYING:
      return '🎮';
    case GameState.COMPLETED:
      return '🥇';
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

const ConnectedMinesweeper = SettingsContextProvider(SvgMinesweeper);

export default ConnectedMinesweeper;
