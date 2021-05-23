import React, { createContext } from 'react';
import useLocalStorage from './useLocalStorage';
import _ from 'lodash';

export type IRotateContext = {
  rotate: boolean;
  setRotate: (rotate: boolean) => void;
};
const defaultRotate = false;

export const RotateContext = createContext<IRotateContext>({
  rotate: defaultRotate,
  setRotate: _.noop,
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
