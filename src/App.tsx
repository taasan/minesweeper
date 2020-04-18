import React from 'react';
import './App.css';
// import Minesweeper, { LEVELS } from './Components/Minesweeper';
import SvgMinesweeper from './Components/SvgMinesweeper';
import { GridType } from './Game';
import { getLevel } from './Components/LevelChooser';
import { Store } from './store';

const App: React.FC<{}> = () => {
  const context = React.useContext(Store);
  return (
    <div className="App">
      <div>
        <Store.Provider value={context}>
          <SvgMinesweeper level={{ ...getLevel(), type: GridType.HEX }} />
        </Store.Provider>
      </div>
    </div>
  );
};

export default App;
