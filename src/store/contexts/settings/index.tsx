import React from 'react';
import ThemeContextProvider, { ThemeContext } from './theme';
import FitWindowContextProvider, { FitWindowContext } from './fitWindow';
import NumeralSystemContextProvider, {
  NumeralSystemContext,
} from './numeralSystem';

export {
  FitWindowContextProvider,
  ThemeContextProvider,
  NumeralSystemContextProvider,
};
export * from './fitWindow';

export * from './theme';

export * from './numeralSystem';

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
) => (props: T & JSX.IntrinsicAttributes) => JSX.Element = useProviders(
  FitWindowContextProvider,
  ThemeContextProvider,
  NumeralSystemContextProvider
);

type SettingsContext = ThemeContext & NumeralSystemContext & FitWindowContext;

export const useSettingsContext = () => {
  const { theme: initialTheme, setTheme } = React.useContext(ThemeContext);
  const { fitWindow: initialFitWindow, setFitWindow } = React.useContext(
    FitWindowContext
  );
  const {
    numeralSystem: initialNumeralSystem,
    setNumeralSystem,
  } = React.useContext(NumeralSystemContext);

  const state: SettingsContext = {
    fitWindow: initialFitWindow,
    setFitWindow,
    theme: initialTheme,
    setTheme,
    numeralSystem: initialNumeralSystem,
    setNumeralSystem,
  };

  return {
    state,
    setState({
      theme,
      fitWindow,
      numeralSystem,
    }: Pick<SettingsContext, 'theme' | 'fitWindow' | 'numeralSystem'>): void {
      setTheme(theme);
      setFitWindow(fitWindow);
      setNumeralSystem(numeralSystem);
    },
  };
};

export default createSettingsContext;
