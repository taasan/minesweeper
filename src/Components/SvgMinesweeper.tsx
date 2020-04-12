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
import reducer, { IState, ModalType, Action } from './reducer';
import { defaultTheme } from '../Theme';
import { useTheme } from '../Hooks';
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

type IStateInit = Pick<IState, 'containerRef'> & {
  level: Level;
};

function init({ level, containerRef }: IStateInit): IState {
  return {
    ...createGame(level),
    loading: false,
    containerRef,
    fitWindow: true,
    maxBoardDimensions: {
      maxHeight: 'revert',
      maxWidth: 'revert',
    },
    numeralSystem: NumeralSystem.beng,
    modalStack: [],
    theme: defaultTheme,
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

  const { board, modalStack, numeralSystem, containerRef, theme } = state;
  useTheme(theme);

  React.useEffect(() => {
    dispatch({ type: 'fitWindow' });
    // return registerEvent('resize', () => dispatch({ type: 'fitWindow' }));
  }, []);

  const modal = modalStack[modalStack.length - 1];
  React.useEffect(() => {
    return registerEvent('keyup', (e: KeyboardEvent) => {
      if (e.keyCode === 80) {
        dispatch({ type: 'TOGGLE_PAUSE', coordinate: 0 });
      }
    });
  }, [containerRef]);

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
    if (done) {
      dispatch({
        type: 'setLevel',
        level: board.level,
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
        className={classes.join(' ')}
        onPointerDown={handlePointerDown}
        onContextMenu={onContextMenu}
      >
        <Controls board={board} dispatch={dispatch} />
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
          onChange={l => {
            closeModal();
            dispatch({
              type: 'setLevel',
              level: l,
            });
          }}
          open={true}
        />
      </Modal>
      <Modal isOpen={modal === ModalType.SETTINGS} onRequestClose={closeModal}>
        <SettingsDialog initialState={state} dispatch={dispatch} />
      </Modal>
    </div>
  );
};

interface ControlsProps {
  board: GameRecord;
  dispatch: React.Dispatch<Action>;
}

const Controls = React.memo(
  React.forwardRef<HTMLDivElement, ControlsProps>(
    ({ board, dispatch }, ref) => {
      const { level } = board;
      const remaining = level.mines - board.cellStates[CellState.FLAGGED];

      const togglePause = () => {
        switch (board.state) {
          case GameState.PAUSED:
          case GameState.PLAYING:
            dispatch({
              type: Cmd[Cmd.TOGGLE_PAUSE] as CmdName,
              coordinate: -1,
            });
            break;
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
          <div
            role="button"
            onClick={togglePause}
            aria-label={`Game state: ${GameState[board.state]}`}
          >
            {renderGameState(board.state)}
          </div>
          <div>
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
