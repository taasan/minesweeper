import { useCallback, useEffect, useState } from 'react';

export default function useLongPress(callback: (args: any) => any, ms = 300) {
  const [startLongPress, setStartLongPress] = useState(false);

  useEffect(() => {
    if (startLongPress) {
      const timerId = setTimeout(callback, ms);
      // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
      return () => (timerId ? clearTimeout(timerId) : undefined);
    }
    return;
  }, [callback, ms, startLongPress]);

  const start = useCallback(() => {
    setStartLongPress(true);
  }, []);
  const stop = useCallback(() => {
    setStartLongPress(false);
  }, []);

  return {
    start,
    stop,
  };
}
