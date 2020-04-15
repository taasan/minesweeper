/* eslint-disable no-console */
type LogFunction = (...args: any[]) => void;

export type Logger = {
  error: LogFunction;
  log: LogFunction;
  warn: LogFunction;
  debug: LogFunction;
};

const log: Logger = {
  error: console.error,
  log: console.log,
  warn: console.warn,
  debug: console.debug,
};

export default log;
