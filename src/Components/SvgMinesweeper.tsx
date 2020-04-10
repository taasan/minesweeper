import * as React from 'react';
import './SvgMinesweeper.scss';
import {
  GameState,
  Level,
  GameRecord,
  Cmd,
  createGame,
  CmdName,
  GridType,
  assertNever,
  CellState,
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
import { reducer, IState, ModalType, Action } from './reducer';
//
/*
enum TimingEventType {
  START,
  STOP,
}

type TimingEvent = {
  type: TimingEventType;
  timestamp: number;
};
*/

type ILevels = {
  [keyof: string]: Level;
};
const type = GridType.HEX;

export const LEVELS: ILevels = {
  BEGINNER: { rows: 6, cols: 10, mines: 10, type },
  INTERMEDIATE: { rows: 16, cols: 16, mines: 40, type },
  EXPERT: { mines: 99, rows: 16, cols: 30, type },
};

export function getMaxScalingFactor(
  _containerRef: React.RefObject<HTMLElement>
): number {
  return 1;
  /*
  if (containerRef != null && containerRef.current != null) {
    const { current } = containerRef;
    const boardElement = current.querySelector('.SvgBoard');

    if (boardElement == null) {
      return 1;
    }
    // const { clientWidth, clientHeight } = current;
    const { clientWidth, clientHeight } = document.documentElement;
    const width = !rotated
      ? boardElement.clientWidth
      : boardElement.clientHeight;
    const height = !rotated
      ? boardElement.clientHeight
      : boardElement.clientWidth;
    if (height === 0 || width === 0) {
      return 1;
    }
    const a = Math.min(clientHeight, current.clientHeight) / height;
    const b = Math.min(clientWidth, current.clientWidth) / width;
    console.log({ clientHeight, clientWidth, height, width, a, b, current });
    return Math.min(a, b);
  }

  return 1;
  */
}

type IStateInit = Pick<IState, 'containerRef'> & {
  level: Level;
};

function init({ level, containerRef }: IStateInit): IState {
  return {
    //...legend(), // ...createGame(level),
    ...createGame(level),
    loading: false,
    containerRef,
    scalingFactor: 1,
    numeralSystem: NumeralSystem.beng,
    modalStack: [],
  };
}

type IProps = { level: Level };

const SvgMinesweeper: React.FC<IProps> = ({ level: initialLevel }) => {
  console.log('Render', 'SvgMinesweeper');
  const [state, dispatch] = useReducer(
    reducer,
    {
      level: initialLevel,
      containerRef: React.useRef<HTMLDivElement>(null),
    },
    init
  );

  const registerEvent = (event: string, callback: (_: any) => void) => {
    window.addEventListener(event, callback);
    return () => window.removeEventListener(event, callback);
  };

  React.useEffect(() => {
    return registerEvent('resize', () =>
      dispatch({ type: 'setScalingFactor' })
    );
  }, []);

  const {
    board,
    scalingFactor,
    modalStack,
    numeralSystem,
    containerRef,
  } = state;
  const { level } = board;
  const modal = modalStack[modalStack.length - 1];
  React.useEffect(() => {
    console.log('useEffect register keyup');
    return registerEvent('keyup', (e: KeyboardEvent) => {
      if (e.keyCode === 80) {
        dispatch({ type: 'TOGGLE_PAUSE', dispatch, coordinate: 0 });
      }
    });
  }, [containerRef]);

  React.useEffect(() => {
    dispatch({ type: 'setScalingFactor' });
  }, [level]);

  const closeModal = () => dispatch({ type: 'closeModal' });
  const showModal = (m: ModalType) => dispatch({ type: 'showModal', modal: m });

  const done =
    board.state === GameState.GAME_OVER ||
    board.state === GameState.COMPLETED ||
    board.state === GameState.ERROR;

  const handlePointerDown = (e: React.PointerEvent) => {
    if (done || board.state === GameState.PAUSED) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (done) {
      dispatch({
        type: 'setLevel',
        level: board.level,
        dispatch,
      });
    }
  };
  const classes = ['SvgMinesweeper'];
  /*
  if (rotated) {
    classes.push('SvgMinesweeper__rotated');
  }
*/
  return (
    <div
      style={{
        display: 'block',
      }}
    >
      <div
        style={{
          ['--board-scaling-factor' as any]: `${scalingFactor}`,
        }}
        className={classes.join(' ')}
        ref={state.containerRef}
        onPointerDown={handlePointerDown}
        onContextMenu={onContextMenu}
      >
        <Controls board={board} dispatch={dispatch} />
        <ErrorBoundary>
          <SvgBoard
            dispatch={dispatch}
            board={board}
            numeralSystem={numeralSystem}
          />
        </ErrorBoundary>
      </div>
      <Modal
        isOpen={modal === ModalType.SELECT_LEVEL}
        onRequestClose={closeModal}
      >
        <LevelChooser
          onChange={l => {
            closeModal();
            dispatch({
              type: 'setLevel',
              level: l,
              dispatch,
            });
          }}
          open={true}
        />
      </Modal>
      <Modal isOpen={modal === ModalType.SETTINGS} onRequestClose={closeModal}>
        <SettingsDialog initialState={state} dispatch={dispatch} />
      </Modal>

      <Modal
        isOpen={modal === ModalType.GAME_OVER}
        onRequestClose={closeModal}
        shouldCloseOnOverlayClick={true}
        shouldCloseOnEsc={true}
      >
        <h1>{GameState[state.board.state]}</h1>
        <button onClick={() => showModal(ModalType.SELECT_LEVEL)}>
          Select level
        </button>
        <button
          onClick={() =>
            dispatch({
              type: 'setLevel',
              level: board.level,
              dispatch,
            })
          }
        >
          Nytt spill
        </button>
      </Modal>
    </div>
  );
};

interface ControlsProps {
  board: GameRecord;
  dispatch: React.Dispatch<Action>;
}

const Controls: React.FC<ControlsProps> = React.memo(({ board, dispatch }) => {
  console.log('Render', 'Controls');
  const { level } = board;
  const remaining = level.mines - board.cellStates[CellState.FLAGGED];

  const togglePause = () => {
    switch (board.state) {
      case GameState.PAUSED:
      case GameState.PLAYING:
        dispatch({
          type: Cmd[Cmd.TOGGLE_PAUSE] as CmdName,
          coordinate: -1,
          dispatch,
        });
        break;
    }
  };

  return (
    <div className="SvgMinesweeper__Controls">
      <div
        role="button"
        onClick={() =>
          dispatch({ type: 'showModal', modal: ModalType.SELECT_LEVEL })
        }
      >
        {level.cols} x {level.rows} / {level.mines}
      </div>
      <div
        role="button"
        onClick={togglePause}
        aria-label={`Game state: ${GameState[board.state]}`}
      >
        {renderGameState(board.state)}
      </div>
      <div>
        <span role="img" aria-label="Remaining mines">
          {remaining >= 0 ? '🚩' : '💩'}
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
});

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
      return '💀';
    case GameState.DEMO:
    case GameState.INITIALIZED:
    case GameState.NOT_INITIALIZED:
      return '🎯';
  }
  assertNever(state);
}

export default SvgMinesweeper;
