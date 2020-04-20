import { SettingsContextValues } from '.';
import React from 'react';
import { log } from '../../../lib';

const SETTINGS_STORAGE_KEY = 'SvgMinesweeper.settings';

function validateType(type: string) {
  if (!['string', 'number', 'boolean', 'object'].includes(type)) {
    throw new TypeError(`Unable to save value of type '${type}`);
  }
}

function loadValue(type: string, key: keyof SettingsContextValues) {
  const nskey = `${SETTINGS_STORAGE_KEY}.${key}`;
  try {
    validateType(type);
    const json = localStorage.getItem(nskey);
    switch (type) {
      case 'number': {
        const v = Number(json);
        return isNaN(v) ? undefined : v;
      }
      case 'string':
        return json;
      case 'boolean':
      case 'object': {
        const parsed = json != null ? JSON.parse(json) : undefined;
        if (type === 'boolean') {
          return parsed === true;
        }
        return typeof parsed === 'object' ? parsed : undefined;
      }
      default:
        log.warn(`Unhandled type ${type}`);
    }
  } catch (err) {
    try {
      localStorage.removeItem(nskey);
    } catch (_err) {}
    log.warn({ err, type, key });
  }
  return;
}

function saveValue(type: string, key: keyof SettingsContextValues, value: any) {
  try {
    validateType(type);
    localStorage.setItem(
      `${SETTINGS_STORAGE_KEY}.${key}`,
      type === 'object' ? JSON.stringify(value) : value
    );
  } catch (err) {
    log.warn(err);
  }
}
type Primitive = number | string | boolean;

function useLocalStorage<T extends Primitive>(
  key: keyof SettingsContextValues,
  defaultValue: T
): [T, (value: T) => void] {
  const type = typeof defaultValue;
  const fromLocalStorage = loadValue(type, key);
  const [value, setValue] = React.useState(fromLocalStorage ?? defaultValue);

  return [
    value,
    React.useCallback(
      v => {
        setValue(v);
        saveValue(type, key, v);
      },
      [key, type]
    ),
  ];
}

export default useLocalStorage;
