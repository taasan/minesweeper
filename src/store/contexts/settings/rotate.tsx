import React, { createContext } from 'react';
import useLocalStorage from './useLocalStorage';

export type RotateContext = {
  rotate: boolean;
  setRotate: (rotate: boolean) => void;
};
const defaultRotate = false;

export const RotateContext = createContext<RotateContext>({
  rotate: defaultRotate,
  setRotate: () => undefined,
});

export const RotateContextProvider = (props: {
  children?: React.ReactNode;
}) => {
  const [rotate, setRotate] = useLocalStorage(
    'rotate',
    defaultRotate as boolean
  );
  return (
    <RotateContext.Provider value={{ rotate, setRotate }}>
      {props.children}
    </RotateContext.Provider>
  );
};

export default RotateContextProvider;
