import React from 'react';
import './App.css';
import Minesweeper from './Components/Minesweeper';

function App() {
  return (
    <div
      className="App"
      onContextMenu={e => {
        e.preventDefault();
        e.stopPropagation();
        //return false;
      }}
    >
      <Minesweeper />
    </div>
  );
}

export default App;
