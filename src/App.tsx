import React from 'react';
import './App.css';
// import Minesweeper, { LEVELS } from './Components/Minesweeper';
import SvgMinesweeper, {
  IProps as MinesweeperProps,
} from './Components/Svg/SvgMinesweeper';
import { LevelAction, Store, initialState, reducer } from './store';
import SettingsContextProvider, {
  ThemeContext,
} from './store/contexts/settings';
import { useTheme } from './Hooks';
import { RouteComponentProps, Router } from '@reach/router';
import SettingsDialog, {
  SettingsDialogProps,
} from './Components/Settings/SettingsDialog';
import { LevelChooser } from './Components/LevelChooser';
import { BASE } from './router';
import { hexagonPoints } from './lib';
import { cellSize } from './Components/Svg/Board/SvgCell';
import { GridType } from './Game';

const Game = (props: MinesweeperProps & RouteComponentProps) => (
  <SvgMinesweeper state={props.state} dispatch={props.dispatch} />
);

const Settings = (_props: SettingsDialogProps & RouteComponentProps) => (
  <SettingsDialog />
);

const Levels = ({
  dispatch,
}: { dispatch: React.Dispatch<LevelAction> } & RouteComponentProps) => (
  <LevelChooser
    onChange={l => {
      dispatch({
        type: 'setLevel',
        level: l,
      });
    }}
  />
);

const hexPoints = () =>
  hexagonPoints()
    .map(({ x, y }) => `${(x * cellSize) / 2},${(y * cellSize) / 2}`)
    .join(' ');

const squarePoints = () => {
  const gap = 2;
  return [
    [gap, gap],
    [gap, cellSize - gap],
    [cellSize - gap, cellSize - gap],
    [cellSize - gap, gap],
  ]
    .map(([x, y]) => `${x},${y}`)
    .join(' ');
};

const App: React.FC<{}> = () => {
  const context = React.useContext(Store);
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const { theme } = React.useContext(ThemeContext);
  useTheme(theme);

  return (
    <div className="App">
      <div>
        <Store.Provider value={context}>
          <Router basepath={BASE}>
            <Game default state={state} dispatch={dispatch} />
            <Settings path="/settings.html" />
            <Levels dispatch={dispatch} path="/level.html" />
          </Router>
        </Store.Provider>
      </div>
      <svg style={{ visibility: 'hidden' }}>
        <defs>
          <circle
            id="circle"
            cx={cellSize / 2}
            cy={cellSize / 2}
            r={cellSize / 2 - 2}
          />
          <polygon
            id={`${GridType[GridType.HEX]}`}
            points={hexPoints()}
            width={cellSize}
            height={cellSize}
            fillOpacity={1}
            strokeWidth={0}
          />
          <polygon
            id={`${GridType[GridType.SQUARE]}`}
            points={squarePoints()}
            width={cellSize}
            height={cellSize}
            fillOpacity={1}
            strokeWidth={0}
          />
        </defs>
      </svg>
    </div>
  );
};

export default SettingsContextProvider(App);
