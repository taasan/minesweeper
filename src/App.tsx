import React from 'react';
import './App.css';
// import Minesweeper, { LEVELS } from './Components/Minesweeper';
import SvgMinesweeper from './Components/SvgMinesweeper';
import { GridType } from './Game';
import { getLevel } from './Components/LevelChooser';

function App() {
  return (
    <div className="App">
      <div>
        <SvgMinesweeper level={{ ...getLevel(), type: GridType.HEX }} />
      </div>
    </div>
  );
}
export default App;
