import * as React from 'react';
import './SvgMinesweeper.scss';
import {
  GameState,
  Level,
  GameRecord,
  Cmd,
  createGame,
  NextStateFunction,
  CmdName,
  isCmdName,
  GridType,
  assertNever,
  CellState,
  NumThreats,
  legend,
  // legend,
} from '../Game';
import ErrorBoundary from './ErrorBoundary';
import { useReducer, Dispatch } from 'react';
import SvgBoard from './Board/SvgBoard';
import { onContextMenu } from '.';
import { LevelChooser } from './LevelChooser';
import Modal from './Modal';
import { NumeralSystem, renderThreats } from './Board/getContent';
import StyleSelector from './StyleSelector';
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

type IState = {
  board: GameRecord;
  nextState: NextStateFunction;
  loading: boolean;
  containerRef: React.MutableRefObject<HTMLDivElement>;
  scalingFactor: number;
  modalStack: ModalType[];
  numeralSystem: NumeralSystem;
};

type CmdAction = {
  type: CmdName;
  coordinate: number;
  dispatch: Dispatch<Action>;
};

function isCmdAction(s: Action): s is CmdAction {
  return isCmdName(s.type);
}

enum ModalType {
  SELECT_LEVEL,
  GAME_OVER,
  SETTINGS,
}

interface ISettings {
  numeralSystem: NumeralSystem;
}

export type Action =
  | { type: 'setLevel'; level: Level; dispatch: Dispatch<Action> }
  | {
      type: 'setBoard';
      game: { board: GameRecord; nextState: NextStateFunction };
    }
  | {
      type: 'setScalingFactor';
    }
  | {
      type: 'setNumeralSystem';
      numeralSystem: NumeralSystem;
    }
  | {
      type: 'applySettings';
      settings: ISettings;
    }
  | {
      type: 'showModal';
      modal: ModalType;
    }
  | {
      type: 'closeModal';
    }
  | CmdAction;
/*
function setBoardAction(
  f: () => object,
  state: IState,
  dispatch: Dispatch<Action>
) {
  new Promise<IState>(resolve => resolve({ ...state, ...f() }))
    .then(game => dispatch({ type: 'setBoard', game }))
    .then(() => dispatch({ type: 'setScalingFactor' }))
    .catch(err => ({
      ...state,
      board: state.board.set('error', err).set('state', GameState.ERROR),
    }));
}
*/
function getMaxScalingFactor(
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

function reducer(state: IState, action: Action): IState {
  console.log(action);
  if (isCmdAction(action)) {
    if (
      action.type === 'TOGGLE_PAUSE' &&
      ![GameState.PAUSED, GameState.PLAYING].includes(state.board.state)
    ) {
      return state;
    }

    const board = state.nextState(Cmd[action.type], [
      action.coordinate,
      state.board,
    ]);
    return {
      ...state,
      board,
      modalStack:
        board.state === GameState.GAME_OVER ||
        board.state === GameState.COMPLETED
          ? [ModalType.GAME_OVER]
          : state.modalStack,
    };
  }
  const modalStackSize = state.modalStack.length;

  switch (action.type) {
    case 'setLevel':
      const { board, nextState } = createGame(action.level);
      return {
        ...state,
        board,
        nextState,
        modalStack: [],
        scalingFactor: getMaxScalingFactor(state.containerRef),
      };
    case 'setBoard':
      return {
        ...state,
        ...action.game,
        loading: false,
      };
    case 'setScalingFactor':
      return {
        ...state,
        scalingFactor: getMaxScalingFactor(state.containerRef),
      };
    case 'setNumeralSystem':
      return {
        ...state,
        numeralSystem: action.numeralSystem,
      };
    case 'applySettings':
      return {
        ...state,
        ...action.settings,
        modalStack: [],
      };
    case 'showModal':
      return {
        ...state,
        modalStack: [...state.modalStack].concat([action.modal]),
      };
    case 'closeModal':
      if (modalStackSize === 0) {
        console.warn('Modal stack is empty');
        return state;
      }
      const modalStack = [...state.modalStack];
      modalStack.pop();
      return {
        ...state,
        modalStack,
      };
  }
  assertNever(action);
}

// @ts-ignore
function init({ level, containerRef }: any): IState {
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
    ({
      level: initialLevel,
      containerRef: React.useRef<HTMLDivElement>(null),
    } as unknown) as IState,
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

interface NumeralSystemChooserProps {
  selected: NumeralSystem;
  onChange: (value: NumeralSystem) => void;
}

const NumeralSystemChooser: React.FC<NumeralSystemChooserProps> = ({
  selected,
  onChange,
}) => {
  return (
    <ul
      className="NumeralSystemChooser"
      style={{ listStyleType: 'none', padding: 0 }}
    >
      {Object.keys(NumeralSystem)
        .filter(name => isNaN(Number(name)))
        .map(name => {
          const value = (NumeralSystem[
            name as any
          ] as unknown) as NumeralSystem;
          return (
            <li key={value}>
              <label>
                <input
                  checked={selected === value}
                  type="radio"
                  value={value}
                  onChange={e => {
                    if (e.currentTarget.checked) {
                      onChange(value);
                    }
                  }}
                />
                {name}
                {': '}
                {[...new Array(8)].map((_, n) => (
                  <span
                    key={n}
                    style={{
                      display: 'inline list-item',
                      color: `var(--cell-threats-${n + 1}-color)`,
                    }}
                  >
                    {renderThreats(value, (n + 1) as NumThreats)}
                  </span>
                ))}
              </label>
            </li>
          );
        })}
    </ul>
  );
};

interface SettingsDialogProps {
  dispatch: React.Dispatch<Action>;
  initialState: IState;
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({
  initialState,
  dispatch,
}) => {
  const [numeralSystem, setNumeralSystem] = React.useState(
    initialState.numeralSystem
  );
  return (
    <section>
      <section>
        <header>
          <h1>Numeral system</h1>
        </header>
        <main>
          <NumeralSystemChooser
            selected={numeralSystem}
            onChange={setNumeralSystem}
          />
        </main>
      </section>
      <section>
        <button
          onClick={() => {
            dispatch({
              type: 'applySettings',
              settings: {
                numeralSystem,
              },
            });
          }}
        >
          OK
        </button>
      </section>
      <section>
        <header>
          <h1>Display</h1>
        </header>
        <main>
          <StyleSelector />
          <div
            style={{
              width: '200px',
              height: '200px',
            }}
          >
            <SvgBoard board={legend().board} numeralSystem={numeralSystem} />
          </div>
        </main>
      </section>
    </section>
  );
};

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
