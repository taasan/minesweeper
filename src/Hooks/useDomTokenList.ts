import { useEffect } from 'react';

const useDomTokenList = (element: HTMLElement, ...tokens: string[]) => {
  // FIXME: Not sure if this the best way
  // We must trick React to prevent re-render every time
  // Values are compared by === so we must convert to string first
  const json = JSON.stringify(tokens);

  useEffect(() => {
    const list = JSON.parse(json);
    // Set up
    element.classList.add(...list);
    // Clean up
    return () => element.classList.remove(...list);
  }, [element, json]);
};

export default useDomTokenList;
