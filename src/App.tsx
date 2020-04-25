import React from 'react';
import './App.css';
// import Minesweeper, { LEVELS } from './Components/Minesweeper';
import SvgMinesweeper from './Components/Svg/SvgMinesweeper';
import { GridType } from './Game';
import { getLevel } from './Components/LevelChooser';
import { Store } from './store';
import { SYMBOLS } from './graphics/noto-emoji';

const App: React.FC<{}> = () => {
  const context = React.useContext(Store);
  // TODO Lag grafikktema som ligger i context
  const graphics = (
    <svg>
      <defs>
        {[...Object.keys(SYMBOLS)].map(k => (
          <svg id={k} key={k} viewBox="0 0 100 100">
            <image width={100} height={100} href={SYMBOLS[k]} />
          </svg>
        ))}
      </defs>
    </svg>
  );

  return (
    <div className="App">
      <div>
        <Store.Provider value={context}>
          <SvgMinesweeper level={{ ...getLevel(), type: GridType.HEX }} />
        </Store.Provider>
      </div>
      {graphics}
    </div>
  );
};

export default App;
