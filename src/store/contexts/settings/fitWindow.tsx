import React, { createContext, useState } from 'react';

export type FitWindowContext = {
  fitWindow: boolean;
  setFitWindow: (titWindow: boolean) => void;
};
const defaultFitWindow = false;

export const FitWindowContext = createContext<FitWindowContext>({
  fitWindow: defaultFitWindow,
  setFitWindow: () => undefined,
});

export const FitWindowContextProvider = (props: {
  children?: React.ReactNode;
}) => {
  const [fitWindow, setFitWindow] = useState(defaultFitWindow);
  return (
    <FitWindowContext.Provider value={{ fitWindow, setFitWindow }}>
      {props.children}
    </FitWindowContext.Provider>
  );
};

export default FitWindowContextProvider;
