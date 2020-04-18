import React from 'react';
import ThemeContextProvider from './theme';
import FitWindowContextProvider from './fitWindow';
import NumeralSystemContextProvider from './numeralSystem';

// import fp from 'lodash/fp';

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

export default createSettingsContext;
