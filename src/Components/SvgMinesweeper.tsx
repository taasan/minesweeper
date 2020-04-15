import * as React from 'react';
import './SvgMinesweeper.scss';
import {
  CellState,
  Cmd,
  CmdName,
  GameRecord,
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
import { NumeralSystem } from './Board/getContent';
import SettingsDialog from './Settings/SettingsDialog';
import reducer, { Action, IState, ModalType, onGameOver } from './reducer';
import { defaultTheme } from '../Theme';
import { useTheme, useTicker } from '../Hooks';
import { GameOfLife } from './GameOfLife';
import { log } from '../lib';

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
    numeralSystem: NumeralSystem.BENGALI,
    modalStack: [],
    theme: defaultTheme,
    timingEvents: [],
    elapsedTime: 0,
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
  } = state;

  const elapsedTimeCb = React.useCallback(() => {
    if (board.state !== GameState.PLAYING) {
      return elapsedTime;
    }
    const len = timingEvents.length;
    if ((len & 1) !== 1) {
      log.error('EEP!');
    }
    const lastStart = timingEvents[len - 1];
    const a = elapsedTime + Date.now() - lastStart;
    return a;
  }, [board.state, elapsedTime, timingEvents]);

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
          e.keyCode === 80 && dispatch({ type: 'TOGGLE_PAUSE', coordinate: 0 })
      ),

    [containerRef]
  );

  React.useEffect(() => {
    return registerEvent('visibilitychange', () => {
      if (
        document.visibilityState !== 'visible' &&
        board.state === GameState.PLAYING
      ) {
        dispatch({ type: 'TOGGLE_PAUSE', coordinate: 0 });
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
        <Controls
          board={board}
          dispatch={dispatch}
          elapsedTime={elapsedTimeCb}
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
        />
      </Modal>
      <Modal isOpen={modal === ModalType.SETTINGS} onRequestClose={closeModal}>
        <SettingsDialog initialState={state} dispatch={dispatch} />
      </Modal>
      <Modal isOpen={modal === ModalType.GOL} onRequestClose={closeModal}>
        <GameOfLife onClose={closeModal} />
      </Modal>
    </div>
  );
};

interface ControlsProps {
  board: GameRecord;
  dispatch: React.Dispatch<Action>;
  elapsedTime(): number;
}

const Controls = React.memo(
  React.forwardRef<HTMLDivElement, ControlsProps>(
    ({ board, dispatch, elapsedTime }, ref) => {
      const { level, state } = board;
      const remaining = level.mines - board.cellStates[CellState.FLAGGED];

      // TODO
      const [timer, setTimer] = React.useState(0);

      const timerCb = React.useCallback(() => {
        log.debug('timerCb');
        setTimer(Math.floor(elapsedTime() / 1000));
      }, [elapsedTime]);

      useTicker(1000, state === GameState.PLAYING, timerCb);

      const handleGameStateClick = () => {
        switch (board.state) {
          case GameState.PAUSED:
          case GameState.PLAYING:
            dispatch({
              type: Cmd[Cmd.TOGGLE_PAUSE] as CmdName,
              coordinate: -1,
            });
            break;
          case GameState.COMPLETED:
          case GameState.GAME_OVER:
          case GameState.ERROR:
            dispatch({
              type: 'setLevel',
              level: board.level,
            });
        }
      };

      return (
        <div className="SvgMinesweeper__Controls" ref={ref}>
          <div
            role="button"
            onClick={() =>
              dispatch({ type: 'showModal', modal: ModalType.SELECT_LEVEL })
            }
          >
            {level.cols} x {level.rows} / {level.mines}
          </div>
          <div role="button" onClick={handleGameStateClick}>
            {timer}
          </div>
          <div
            role="button"
            onClick={handleGameStateClick}
            aria-label={`Game state: ${GameState[board.state]}`}
          >
            {renderGameState(board.state)}
          </div>
          <div
            role="button"
            onClick={() =>
              dispatch({ type: 'showModal', modal: ModalType.GOL })
            }
          >
            <span role="img" aria-label="Remaining mines">
              {remaining >= 0 ? '☣️' : '💩'}
            </span>{' '}
            <span>{remaining}</span>
          </div>
          <div
            role="button"
            onClick={() =>
              dispatch({ type: 'showModal', modal: ModalType.SETTINGS })
            }
          >
            <span role="img" aria-label="Settings">
              ⚙️
            </span>
          </div>
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
