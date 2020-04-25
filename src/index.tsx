import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import ReactModal from 'react-modal';
/*
import _ from 'lodash';

type Address = { row: number; col: number };

const translate = (
  { row, col }: Address,
  { row: dRow, col: dCol }: Address
): Address => ({ row: row + dRow, col: col + dCol });

const calculateCoordinate = (cols: number, index: number) => {
  //if (index < 0) {
  //  throw new Error();
  //}
  const col = index % cols;
  const row = (index - col) / cols;
  return { col, row };
};

const calculateIndex = (
  { cols, rows }: { cols: number; rows: number },
  { row, col }: Address
) => {
  let dRow = 0;
  let dCol = 0;
  if (row < 0) {
    dRow = rows + row;
  }
  if (col < 0) {
    dCol = cols + col;
  }
  if (row < 0 || col < 0) {
    const nc = calculateIndex(
      { cols, rows },
      translate({ row, col }, { row: dRow, col: dCol })
    );
    console.log({ nc, row, col });
  }
  return col + cols * row;
};

function formatCoordinate({ row, col }: Address) {
  return (
    <pre>
      {col}, {row}
    </pre>
  );
}

const renderCell = (
  { cols, rows }: { cols: number; rows: number },
  coordinate: Address
) => {
  const index = calculateIndex({ cols, rows }, coordinate);
  const newCoordinate = calculateCoordinate(cols, index);
  const newIndex = calculateIndex({ cols, rows }, newCoordinate);
  return (
    <ul>
      <li>{index}</li>
      <li
        style={{
          backgroundColor: index === newIndex ? 'green' : 'red',
        }}
      >
        {newIndex}
      </li>
      <li>{formatCoordinate(coordinate)}</li>
      <li
        style={{
          backgroundColor: _.isEqual(coordinate, newCoordinate)
            ? 'green'
            : 'red',
        }}
      >
        {formatCoordinate(newCoordinate)}
      </li>
    </ul>
  );
};

const Test = () => {
  const cols = 16;
  const rows = 14;
  return (
    <table>
      <tbody>
        {[...new Array(rows)].map((_i, row) => (
          <tr key={row}>
            {[...new Array(cols)].map((_j, col) => (
              <td key={col}>
                {renderCell(
                  { cols, rows },
                  { row: row - rows / 2, col: col - cols / 2 }
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
*/
ReactDOM.render(<App />, document.getElementById('root'));
ReactModal.setAppElement('#root');

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.register();
