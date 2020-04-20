import React, { createContext } from 'react';
import useLocalStorage from './useLocalStorage';

export type FitWindowContext = {
  fitWindow: boolean;
  setFitWindow: (fitWindow: boolean) => void;
};
const defaultFitWindow = false;

export const FitWindowContext = createContext<FitWindowContext>({
  fitWindow: defaultFitWindow,
  setFitWindow: () => undefined,
});

export const FitWindowContextProvider = (props: {
  children?: React.ReactNode;
}) => {
  const [fitWindow, setFitWindow] = useLocalStorage(
    'fitWindow',
    defaultFitWindow as boolean
  );
  return (
    <FitWindowContext.Provider value={{ fitWindow, setFitWindow }}>
      {props.children}
    </FitWindowContext.Provider>
  );
};

export default FitWindowContextProvider;
