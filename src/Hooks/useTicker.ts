import { useEffect } from 'react';

function useTicker(timeout: number, isActive: boolean, cb: () => any) {
  useEffect(() => {
    if (isActive) {
      const id = setInterval(cb, timeout);
      console.debug('Create ticker', { id, timeout });
      return () => {
        console.debug('Cleanup ticker', { id });
        clearInterval(id);
      };
    }
    return;
  }, [cb, isActive, timeout]);
}

export default useTicker;
