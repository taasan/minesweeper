import React from 'react';
import './App.css';
// import Minesweeper, { LEVELS } from './Components/Minesweeper';
import StyleSelector from './Components/StyleSelector';
import SvgMinesweeper, { LEVELS } from './Components/SvgMinesweeper';
import Minesweeper from './Components/Minesweeper';
import { GridType } from './Game';

const level = LEVELS.EXPERT;

function App() {
  return (
    <div className="App">
      <div style={{ position: 'fixed', top: 0, right: 0 }}>
        <StyleSelector />
      </div>
      {Math.random() > -1 ? (
        <div>
          <SvgMinesweeper level={{ ...level, type: 0 }} />
          <SvgMinesweeper level={{ ...level, type: 1 }} />
        </div>
      ) : (
        <Minesweeper level={{ ...level, type: GridType.SQUARE }} />
      )}
    </div>
  );
}
export default App;
