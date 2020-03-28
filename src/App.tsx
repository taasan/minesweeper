import React from 'react';
import './App.css';
// import Minesweeper, { LEVELS } from './Components/Minesweeper';
import StyleSelector from './Components/StyleSelector';
import SvgMinesweeper, { LEVELS } from './Components/SvgMinesweeper';
import Minesweeper from './Components/Minesweeper';
import { hexagonPoints, hexOffset } from './Components';

const level = LEVELS.BEGINNER;

function App() {
  // viewBox="0 0 2 2"
  const { rows, cols } = level;
  const offset = hexOffset;
  return (
    <div className="App">
      <div style={{ position: 'fixed', top: 0, right: 0 }}>
        <StyleSelector />
      </div>
      <svg
        viewBox={`0 0 ${cols * 2} ${cols * 2}`}
        width={cols * 2 * 32}
        height={rows * 2 * 32}
      >
        {[...new Array(rows)].map((_a, row) => {
          return [...new Array(cols)].map((_b, col) => {
            const x1 = offset * col * 2 + ((row & 1) === 1 ? offset : 0);
            const y1 = offset * row * Math.sqrt(3);

            return (
              <g key={`${row}x${col}`}>
                <polygon
                  points={[...hexagonPoints()]
                    .map(({ x, y }) => `${y + x1},${x + y1}`)
                    .join(' ')}
                  style={{
                    fill: 'lime',
                    strokeWidth: 1,
                  }}
                />
              </g>
            );
          });
        })}
      </svg>
      {Math.random() > 0.5 ? (
        <SvgMinesweeper level={level} />
      ) : (
        <Minesweeper level={level} />
      )}
    </div>
  );
}
export default App;
