import React, { useCallback } from 'react';
import { useTicker } from '../Hooks';
import FormatNumber from './FormatNumber';
import { NumeralSystem } from '../lib';

interface Props {
  elapsedTime(): number;
  running: boolean;
  numeralSystem: NumeralSystem;
}

const Timer: React.FC<Props> = React.memo(
  ({ running, elapsedTime, numeralSystem }) => {
    const [timer, setTimer] = React.useState(0);

    const cb = useCallback(() => setTimer(Math.floor(elapsedTime() / 1000)), [
      elapsedTime,
    ]);

    useTicker(1000, running, cb);

    return (
      <span
        role="timer"
        aria-live={running ? 'polite' : 'off'}
        className="Timer"
        title={timer.toString()}
      >
        <FormatNumber numeralSystem={numeralSystem} n={timer} asTime={true} />
      </span>
    );
  }
);

export default Timer;
