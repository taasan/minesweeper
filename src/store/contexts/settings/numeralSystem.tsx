import React, { createContext } from 'react';
import { NumeralSystem, isNumeralSystem } from '../../../lib';
import useLocalStorage from './useLocalStorage';

export type NumeralSystemContext = {
  numeralSystem: NumeralSystem;
  setNumeralSystem: (NumeralSystem: NumeralSystem) => void;
};
const defaultNumeralSystem = NumeralSystem.ascii;

export const NumeralSystemContext = createContext<NumeralSystemContext>({
  numeralSystem: defaultNumeralSystem,
  setNumeralSystem: () => undefined,
});

export const NumeralSystemContextProvider = (props: {
  children?: React.ReactNode;
}) => {
  let [numeralSystem, setNumeralSystem] = useLocalStorage(
    'numeralSystem',
    defaultNumeralSystem
  );
  if (!isNumeralSystem(numeralSystem)) {
    numeralSystem = defaultNumeralSystem;
  }
  return (
    <NumeralSystemContext.Provider value={{ numeralSystem, setNumeralSystem }}>
      {props.children}
    </NumeralSystemContext.Provider>
  );
};

export default NumeralSystemContextProvider;
