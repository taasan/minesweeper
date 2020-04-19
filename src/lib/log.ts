/* eslint-disable no-console */
type LogFunction = typeof console.log;

export type Logger = {
  info: LogFunction;
  error: LogFunction;
  log: LogFunction;
  warn: LogFunction;
  debug: LogFunction;
};

const log: Logger = Object.freeze({
  info: console.info,
  error: console.error,
  log: console.log,
  warn: console.warn,
  debug: console.debug,
});

export default log;
