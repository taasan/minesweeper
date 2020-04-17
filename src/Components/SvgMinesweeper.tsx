import * as React from 'react';
import './SvgMinesweeper.scss';
import {
  CellState,
  GameState,
  GridType,
  Level,
  Topology,
  assertNever,
  createGame,
  // legend,
} from '../Game';
import ErrorBoundary from './ErrorBoundary';
import { useReducer } from 'react';
import SvgBoard from './Board/SvgBoard';
import { onContextMenu } from '.';
import { LevelChooser } from './LevelChooser';
import Modal from './Modal';
import { NumeralSystem, getFlag } from './Board/getContent';
import SettingsDialog from './Settings/SettingsDialog';
import reducer, {
  CmdAction,
  IState,
  LevelAction,
  MenuAction,
  ModalAction,
  ModalType,
  onGameOver,
} from './reducer';
import { defaultTheme } from '../Theme';
import { useTheme } from '../Hooks';
import { log } from '../lib';
import FormatNumber from './FormatNumber';
import Timer from './Timer';

type ILevels = {
  [keyof: string]: Level;
};
const type = GridType.HEX;
const topology = Topology.LIMITED;

export const LEVELS: ILevels = {
  BEGINNER: { rows: 6, cols: 10, mines: 10, type, topology },
  INTERMEDIATE: { rows: 16, cols: 16, mines: 40, type, topology },
  EXPERT: { mines: 99, rows: 16, cols: 30, type, topology },
};

type IStateInit = Pick<IState, 'containerRef'> & {
  level: Level;
};

function init({ level, containerRef }: IStateInit): IState {
  return {
    ...createGame(level, onGameOver),
    loading: false,
    containerRef,
    fitWindow: true,
    maxBoardDimensions: {
      maxHeight: 'revert',
      maxWidth: 'revert',
    },
    numeralSystem: NumeralSystem.HANGZHOU_NUMERAL,
    modalStack: [],
    theme: defaultTheme,
    timingEvents: [],
    elapsedTime: 0,
    showMenu: false,
    lives: 2,
  };
}

type IProps = { level: Level };

const SvgMinesweeper: React.FC<IProps> = ({ level: initialLevel }) => {
  const [state, dispatch] = useReducer(
    reducer,
    {
      level: initialLevel,
      containerRef: React.useRef<SVGSVGElement>(null),
    },
    init
  );

  const registerEvent = (event: string, callback: (_: any) => void) => {
    window.addEventListener(event, callback);
    return () => window.removeEventListener(event, callback);
  };

  const {
    board,
    modalStack,
    numeralSystem,
    containerRef,
    theme,
    elapsedTime,
    timingEvents,
    showMenu,
  } = state;

  const elapsedTimeCb = React.useCallback(() => {
    const len = timingEvents.length;
    if ((len & 1) !== 1) {
      log.error('EEP!');
    }
    const lastStart = timingEvents[len - 1];
    const a = elapsedTime + Date.now() - lastStart;
    return a;
  }, [elapsedTime, timingEvents]);

  useTheme(theme);

  React.useEffect(() => {
    dispatch({ type: 'fitWindow' });
    // return registerEvent('resize', () => dispatch({ type: 'fitWindow' }));
  }, [dispatch]);

  const modal = modalStack[modalStack.length - 1];
  React.useEffect(
    () =>
      registerEvent(
        'keyup',
        (e: KeyboardEvent) =>
          // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
          e.keyCode === 80 && dispatch({ type: 'TOGGLE_PAUSE' })
      ),

    [containerRef, dispatch]
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
  }, [board.state, dispatch]);

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
    [board.level, dispatch]
  );

  return (
    <div>
      <div
        className={classes.join(' ')}
        onPointerDown={handlePointerDown}
        onContextMenu={done ? handleRestartGame : onContextMenu}
      >
        <Controls
          gameState={board.state}
          level={board.level}
          flaggedCells={board.cellStates[CellState.FLAGGED]}
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
              state.fitWindow ? { ...state.maxBoardDimensions } : undefined
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
        <SettingsDialog initialState={state} dispatch={dispatch} />
      </Modal>
    </div>
  );
};

interface ControlsProps {
  gameState: GameState;
  level: Level;
  flaggedCells: number;
  dispatch: React.Dispatch<ModalAction | CmdAction | LevelAction | MenuAction>;
  elapsedTime(): number;
  numeralSystem: NumeralSystem;
  showMenu: boolean;
}

const Controls = React.memo(
  React.forwardRef<HTMLDivElement, ControlsProps>(
    (
      {
        dispatch,
        elapsedTime,
        numeralSystem,
        showMenu,
        gameState,
        level,
        flaggedCells,
      },
      ref
    ) => {
      const remaining = level.mines - flaggedCells;

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
              level,
            });
        }
      }, [dispatch, gameState, level]);

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
              <ul className="Menu__List">
                <li
                  role="button"
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
                  role="button"
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

export default SvgMinesweeper;
