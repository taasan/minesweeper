import React, { createContext } from 'react';
import useLocalStorage from './useLocalStorage';
import _ from 'lodash';

export type IFitWindowContext = {
  fitWindow: boolean;
  setFitWindow: (fitWindow: boolean) => void;
};
const defaultFitWindow = false;

export const FitWindowContext = createContext<IFitWindowContext>({
  fitWindow: defaultFitWindow,
  setFitWindow: _.noop,
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
