import React from 'react';
import './App.css';
import Minesweeper, { LEVELS } from './Components/Minesweeper';
import StyleSelector from './Components/StyleSelector';

function App() {
  return (
    <div className="App">
      <div style={{ position: 'fixed', top: 0, right: 0 }}>
        <StyleSelector />
      </div>
      <Minesweeper level={LEVELS.BEGINNER} />
    </div>
  );
}
export default App;
