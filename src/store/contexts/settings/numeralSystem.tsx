import React, { createContext, useState } from 'react';
import { NumeralSystem } from '../../../lib';

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
  const [numeralSystem, setNumeralSystem] = useState(defaultNumeralSystem);
  return (
    <NumeralSystemContext.Provider value={{ numeralSystem, setNumeralSystem }}>
      {props.children}
    </NumeralSystemContext.Provider>
  );
};

export default NumeralSystemContextProvider;
