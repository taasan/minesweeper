import React, { useCallback, useEffect, useReducer } from 'react';
import { Gol, next } from '../Game/gol';
import { useTicker } from '../Hooks';
import SvgBoard from './Board/SvgBoard';
import { NumeralSystem } from './Board/getContent';
import {
  CellState,
  GameState,
  GridType,
  Topology,
  createBoard,
  createGameCell,
} from '../Game';
import { OrderedMap } from 'immutable';
import { CmdAction } from './reducer';
import { chunk } from '../lib';
// import { IState } from './reducer';

export type Props = {
  // initialState: Gol;
  onClose(): void;
};

export function rotateArray<T>(
  arr: Array<Array<T>>,
  { rows, cols }: { rows: number; cols: number }
): T[][] {
  let b: any = new Array<T>(cols);
  for (let y = 0; y < cols; y++) {
    b[y] = new Array<T>(rows);
    for (let x = 0; x < rows; x++) {
      const c = arr[rows - 1 - x];
      if (c != null) {
        b[y][x] = c[y];
      }
    }
  }
  return b;
}

const decodeRle = (
  s: string = '24bo11b$22bobo11b$12b2o6b2o12b2o$11bo3bo4b2o12b2o$2o8bo5bo3b2o14b$2o8bo3bob2o4bobo11b$10bo5bo7bo11b$11bo3bo20b$12b2o!'
) =>
  [...s.matchAll(/(?:([0-9]+)([^0-9]))|([ob$!])/g)]
    .map(res => {
      if (res[1] != null) {
        const [, n, c] = res;
        return c.repeat(Number(n));
      }

      return res[0];
    })
    .join('');

const createPattern = (
  { rows, cols }: { rows: number; cols: number },
  pattern: string,
  // eslint-disable-next-line no-shadow
  rot?: boolean,
  offset: { row: number; col: number } = { row: 0, col: 0 }
) => {
  const cells = [...new Array(rows)].map(_ =>
    [...new Array(cols)].map(_ => false)
  );
  let pRows = decodeRle(pattern)
    .split('$')
    .map(s => [...s]);
  // console.log({ pattern, pRows, rot: rotate(pRows, { rows, cols }) });
  if (rot === true) {
    // pRows = rotate(pRows, { rows, cols });
  }
  loop: for (let i = 0; i < pRows.length; i++) {
    const row = pRows[i];
    for (let j = 0; j < row.length; j++) {
      const c = row[j];
      if (c === '!') {
        break loop;
      }
      cells[i + offset.row][j + offset.col] = c === 'o';
    }
  }
  return (rot === true ? rotateArray(cells, { rows, cols }) : cells).flat();
};

const create = ({
  pattern,
  dim,
  offset,
  // eslint-disable-next-line no-shadow
  rotate,
  topology,
}: {
  pattern: string;
  dim: { rows: number; cols: number };
  offset?: { row: number; col: number };
  rotate?: boolean;
  topology?: Topology;
}) => {
  const d = rotate === true ? { rows: dim.cols, cols: dim.rows } : dim;
  return {
    grid: {
      ...d,
      type: GridType.SQUARE,
      topology: topology ?? Topology.LIMITED,
    },
    cells: createPattern(dim, pattern, rotate, offset),
    generation: 0,
  };
};

const rotateGol = (gol: Gol): Gol => ({
  ...gol,
  grid: {
    ...gol.grid,
    rows: gol.grid.cols,
    cols: gol.grid.rows,
  },
  cells: rotateArray(chunk(gol.cells, gol.grid.cols), { ...gol.grid }).flat(),
});

const dim = { rows: 23, cols: 40 };

const x66 = (rotate = false) => {
  const offset = { row: 7, col: 20 };
  const pattern =
    '2bo6b$2o7b$o2b3o2bo$o4b3ob$b3o2b2ob2$b3o2b2ob$o4b3ob$o2b3o2bo$2o7b$2bo!';
  return create({ pattern, dim, offset, rotate });
};

const achimsp4 = (rotate = false) => {
  const offset = { row: 8, col: 15 };
  const pattern =
    '2b2o3b2o2b$bo2bobo2bob$bob2ob2obob$2o7b2o$2bobobobo2b$2o7b2o$bob2ob2obob$bo2bobo2bob$2b2o3b2o!';
  return create({ pattern, dim, offset, rotate });
};

export const achimsp144 = (rotate = false) => {
  // const dim = { rows: 23, cols: 32 };
  const offset = { row: 2, col: 6 };
  // const offset = { row: 2, col: 2 };
  const pattern =
    '2o24b2o$2o24b2o$18b2o8b$17bo2bo7b$18b2o8b$14bo13b$13bobo12b$12bo3bo11b$12bo2bo12b2$12bo2bo12b$11bo3bo12b$12bobo13b$13bo14b$8b2o18b$7bo2bo17b$8b2o18b$2o24b2o$2o24b2o!';
  return create({ pattern, dim, offset, rotate });
};

export const gliderGun = (rotate = false) => {
  // const dim = { rows: 20, cols: 20 };
  const offset = { row: 1, col: 10 };
  const pattern =
    '10b2o8b$10bo9b$4b2ob2obo4b2o3b$2bo2bobobo5bo4b$2b2o4bo8bo2b$16b2o2b2$16b2o2b$o10bo3bobo2b$3o7b3o3bo3b$3bo6bobo4b3o$2bobo14bo$2b2o16b2$2b2o16b$2bo8bo4b2o2b$4bo5bobobo2bo2b$3b2o4bob2ob2o4b$9bo10b$8b2o!';
  return create({ pattern, dim, offset, rotate });
};

export const glider = (rotate = false) => {
  // const dim = { rows: 8, cols: 20 };
  const topology = Topology.TORUS;
  const offset = { row: 3, col: 7 };
  const pattern = 'bo$2bo$3o';
  return create({ pattern, dim, topology, offset, rotate });
};

const gols = [x66, achimsp4, glider, gliderGun, achimsp144];

const mapGol = (gol: Gol) => {
  return createBoard({
    state: GameState.GAME_OVER,
    level: { ...gol.grid, mines: 0 },
    cells: OrderedMap(
      gol.cells.map((alive, i) => {
        return [
          i,
          createGameCell({
            state: alive ? CellState.EXPLODED : CellState.NEW,
            threatCount: alive ? 0xff : 0,
          }),
        ];
      })
    ),
  });
};

type Action =
  | CmdAction
  | {
      type: 'nextGol';
    }
  | {
      type: 'tick';
    }
  | {
      type: 'rotate';
    }
  | {
      type: 'reset';
    }
  | {
      type: 'toggleActive';
    }
  | {
      type: 'activate';
    }
  | {
      type: 'deactivate';
    };

const init = (): IState => ({
  golNo: 0,
  gol: gols[0](),
  isActive: false,
  totalTicks: 0,
  rotated: false,
});

const reducer = (state: IState, action: Action): IState => {
  const { generation } = state.gol;
  switch (action.type) {
    case 'nextGol':
      const golNo = (state.golNo + 1) % gols.length;
      return {
        ...state,
        golNo,
        gol: gols[golNo](state.rotated),
      };
    case 'tick':
      return {
        ...state,
        gol: next(state.gol),
        totalTicks: state.totalTicks + 1,
      };
    case 'rotate':
      return {
        ...state,
        gol: rotateGol(state.gol),
        rotated: !state.rotated,
      };
    case 'activate':
      return {
        ...state,
        isActive: true,
      };
    case 'deactivate':
      return {
        ...state,
        isActive: false,
      };
    case 'TOGGLE_PAUSE':
    case 'toggleActive':
      return {
        ...state,
        isActive: !state.isActive,
      };
    case 'NONE':
      return state;
    case 'FLAG':
    case 'POKE':
      const cells = [...state.gol.cells];
      cells[action.coordinate] = !cells[action.coordinate];
      return {
        ...state,
        gol: { ...state.gol, generation: generation + 1, cells },
      };
    case 'reset':
      return init();
  }
  // assertNever(action.type);
};

type IState = {
  gol: Gol;
  golNo: number;
  isActive: boolean;
  totalTicks: number;
  rotated: boolean;
};

export const GameOfLife: React.FC<Props> = ({ onClose }) => {
  const [state, dispatch] = useReducer(reducer, init());

  const { isActive, gol, totalTicks } = state;
  const { generation } = gol;

  const setIsActive = (active: boolean) =>
    dispatch({ type: active ? 'activate' : 'deactivate' });

  useEffect(() => {
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState !== 'visible') {
        setIsActive(false);
      }
    });
  }, []);

  function toggle() {
    setIsActive(!isActive);
  }

  function reset() {
    dispatch({ type: 'reset' });
  }
  function step() {
    setIsActive(false);
    golCb();
  }

  const generations = 30;
  useEffect(() => {
    if (totalTicks > gols.length * 3 * generations) {
      setIsActive(false);
    } else if (generation % generations === generations - 1) {
      dispatch({ type: 'nextGol' });
    }
  }, [generation, totalTicks]);
  /*
  const golCb = useCallback(() => {
    if (totalTicks > gols.length * 3 * generations) {
      setIsActive(false);
    } else if (generation % generations === generations - 1) {
      dispatch({ type: 'nextGol' });
    } else {
      dispatch({ type: 'tick' });
    }
  }, [generation, totalTicks]);
*/
  const golCb = useCallback(() => dispatch({ type: 'tick' }), []);

  useTicker(500, isActive, golCb);

  return (
    <div>
      <div className="GameOfLife SvgMinesweeper SvgMinesweeper__Container">
        <button onClick={toggle}>{isActive ? 'Stop' : 'Start'}</button>
        <button onClick={reset}>Reset</button>
        <button onClick={step}>Step {totalTicks}</button>
        <button
          onClick={() => {
            setIsActive(false);
            onClose();
          }}
        >
          Close
        </button>
        <button onClick={() => dispatch({ type: 'nextGol' })}>
          Next pattern
        </button>
        <button onClick={() => dispatch({ type: 'rotate' })}>Rotate</button>
        <SvgBoard
          dispatch={dispatch}
          board={mapGol(gol)}
          ref={React.useRef<SVGSVGElement>(null)}
          numeralSystem={NumeralSystem.BENGALI}
        />
      </div>
    </div>
  );
};
