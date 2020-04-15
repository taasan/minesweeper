import { useEffect } from 'react';
import log from '../lib/log';

function useTicker(timeout: number, isActive: boolean, cb: () => any) {
  useEffect(() => {
    if (isActive) {
      const id = setInterval(cb, timeout);
      log.debug('Create ticker', { id, timeout });
      return () => {
        log.debug('Cleanup ticker', { id });
        clearInterval(id);
      };
    }
    return;
  }, [cb, isActive, timeout]);
}

export default useTicker;
