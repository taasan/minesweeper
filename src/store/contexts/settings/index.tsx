import React from 'react';
import ThemeContextProvider, { IThemeContext, ThemeContext } from './theme';
import FitWindowContextProvider, {
  FitWindowContext,
  IFitWindowContext,
} from './fitWindow';
import NumeralSystemContextProvider, {
  INumeralSystemContext,
  NumeralSystemContext,
} from './numeralSystem';
import RotateContextProvider, { IRotateContext, RotateContext } from './rotate';
import { OmitByValueType } from '../../../lib';

export {
  FitWindowContextProvider,
  ThemeContextProvider,
  NumeralSystemContextProvider,
};
export * from './fitWindow';

export * from './theme';

export * from './numeralSystem';

export * from './rotate';

export * from './useLocalStorage';

type Provider<P extends object> = (
  props: React.PropsWithChildren<P>
) => JSX.Element;
const useProviders = <T extends object>(
  ...Providers: Provider<React.Props<T>>[]
) => (Child: React.FC<T>) => (props: T & JSX.IntrinsicAttributes) =>
  Providers.reduce(
    (acc, Provider) => <Provider>{acc}</Provider>,
    <Child {...props} />
  );

export const createSettingsContext: <T extends object>(
  Child: React.FC<T>
) => // eslint-disable-next-line react-hooks/rules-of-hooks
(props: T & JSX.IntrinsicAttributes) => JSX.Element = useProviders(
  FitWindowContextProvider,
  ThemeContextProvider,
  NumeralSystemContextProvider,
  RotateContextProvider
);

export type SettingsContext = IThemeContext &
  INumeralSystemContext &
  IFitWindowContext &
  IRotateContext;

export type SettingsContextValues = OmitByValueType<SettingsContext, Function>;

export const useSettingsContext = () => {
  const { theme: initialTheme, setTheme } = React.useContext(ThemeContext);
  const { fitWindow: initialFitWindow, setFitWindow } = React.useContext(
    FitWindowContext
  );
  const {
    numeralSystem: initialNumeralSystem,
    setNumeralSystem,
  } = React.useContext(NumeralSystemContext);

  const { rotate: initialRotate, setRotate } = React.useContext(RotateContext);

  const state: SettingsContext = {
    fitWindow: initialFitWindow,
    setFitWindow,
    theme: initialTheme,
    setTheme,
    numeralSystem: initialNumeralSystem,
    setNumeralSystem,
    rotate: initialRotate,
    setRotate,
  };

  return {
    state,
    setState({
      theme,
      fitWindow,
      numeralSystem,
      rotate,
    }: SettingsContextValues): void {
      setTheme(theme);
      setFitWindow(fitWindow);
      setNumeralSystem(numeralSystem);
      setRotate(rotate);
    },
  };
};

export default createSettingsContext;
