import React from 'react';
import './App.css';
import Minesweeper from './Components/Minesweeper';
import StyleSelector from './Components/StyleSelector';

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
      <StyleSelector />
      <Minesweeper />
    </div>
  );
}
export default App;
