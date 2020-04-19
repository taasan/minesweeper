import { useEffect } from 'react';
import log from '../lib/log';
const useDomTokenList = (
  element?: HTMLElement,
  tokens?: string[] | Readonly<string[]>
) => {
  useEffect(() => {
    log.debug('useDomTokenList.useEffect');
    // Set up
    element?.classList?.add(...tokens);
    // Clean up
    return () => element?.classList?.remove(...tokens);
  }, [element, tokens]);
};

export default useDomTokenList;
