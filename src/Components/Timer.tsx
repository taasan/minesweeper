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
    const [timer, setTimer] = React.useState(elapsedTime());
    React.useEffect(() => setTimer(elapsedTime()), [elapsedTime]);

    const cb = useCallback(() => setTimer(elapsedTime()), [elapsedTime]);

    useTicker(1000, running, cb);

    return (
      <span
        role="timer"
        aria-live={running ? 'polite' : 'off'}
        className="Timer"
        title={timer.toString()}
      >
        <FormatNumber
          numeralSystem={numeralSystem}
          n={Math.floor(timer / 1000)}
          asTime={true}
        />
      </span>
    );
  }
);

export default Timer;
