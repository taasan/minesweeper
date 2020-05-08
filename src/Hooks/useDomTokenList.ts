import { useEffect } from 'react';
const useDomTokenList = (
  element?: HTMLElement,
  tokens?: string[] | Readonly<string[]>
) => {
  useEffect(() => {
    if (element == null || tokens == null) {
      return;
    }
    console.debug('useDomTokenList.useEffect');
    // Set up
    element.classList.add(...tokens);
    // Clean up
    return () => element.classList.remove(...tokens);
  }, [element, tokens]);
};

export default useDomTokenList;
