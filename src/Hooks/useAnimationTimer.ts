import { useEffect, useState } from 'react';
import log from '../lib/log';

const useAnimationTimer = (duration = 1000, delay = 0) => {
  const [elapsed, setTime] = useState(0);

  useEffect(
    () => {
      let animationFrame: number,
        timerStop: ReturnType<typeof setTimeout>,
        start: number;

      // Function to be executed on each animation frame
      function onFrame() {
        setTime(Date.now() - start);
        loop();
      }

      // Call onFrame() on next animation frame
      function loop() {
        log.debug('useAnimationTimer.loop()');

        animationFrame = requestAnimationFrame(onFrame);
      }

      function onStart() {
        // Set a timeout to stop things when duration time elapses
        timerStop = setTimeout(() => {
          cancelAnimationFrame(animationFrame);
          setTime(Date.now() - start);
        }, duration);

        // Start the loop
        start = Date.now();
        loop();
      }

      // Start after specified delay (defaults to 0)
      const timerDelay = setTimeout(onStart, delay);

      // Clean things up
      return () => {
        log.debug('useAnimationTimer.cleanUp()');
        clearTimeout(timerStop);
        clearTimeout(timerDelay);
        cancelAnimationFrame(animationFrame);
      };
    },
    [duration, delay] // Only re-run effect if duration or delay changes
  );

  return elapsed;
};

export default useAnimationTimer;
