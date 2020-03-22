import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import Minesweeper from './Components/Minesweeper';

function App() {
  return (
    <div
      className="App"
      onContextMenu={e => {
        e.preventDefault();
        e.stopPropagation();
        //return false;
      }}
    >
      <CssSelector />
      <Minesweeper />
    </div>
  );
}
/*
type TMap<T> = {
  [keyof: string]: T[] | undefined;
};

function groupBy<T extends { [key: string]: any }>(
  items: T[],
  keyProvider: (item: T) => string
): TMap<T> {
  return items.reduce((result, item) => {
    const groupName = keyProvider(item);
    const oldValues = result[groupName];
    const newValues = oldValues !== undefined ? oldValues : [];
    return {
      ...result,
      [groupName]: [...newValues, item],
    };
  }, {} as TMap<T>);
}
type StyleSheetWithTitle = StyleSheet & {
  title: string;
  ownerNode: StyleElement;
};
*/

// Chrome fikser ikke å sette disabled direkte på stylesheet-objektet
type StyleElement = (HTMLLinkElement | HTMLStyleElement) & {
  title: string;
  disabled: boolean;
};

const DEFAULT_STYLESHEET = '__DEFAULT_STYLESHEET__';
const NO_STYLESHEET = '__NO_STYLESHEET__';

function CssSelector() {
  const [styleSheetMap, setStylesheetMap] = useState<
    | Readonly<{
        map: ReadonlyMap<string, StyleElement[]>;
        titles: readonly string[];
        isDefault: (title?: string) => boolean;
      }>
    | undefined
  >(undefined);

  const [css, setCss] = useState<string | undefined>();

  const handleOnLoad = useCallback(() => {
    console.log('handleOnLoad');

    /*
    // Experimental status
    const stylesheets: StyleSheetWithTitle[] = [...document.styleSheets].filter(
      e => e.title != null
    ) as StyleSheetWithTitle[];
    */

    const links = document.head.querySelectorAll<StyleElement>(
      'link[rel*=style][title],style[title]'
    );
    const stylesheets: StyleElement[] = [];
    for (let i = 0; i < links.length; i++) {
      if (
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        !links[i].media ||
        links[i].media === 'all' ||
        links[i].media === 'screen'
      ) {
        stylesheets.push(links[i]);
      }
    }
    const map: Map<string, StyleElement[]> = new Map();
    const defaultTitles: string[] = [];

    map.set(DEFAULT_STYLESHEET, []);

    stylesheets.forEach(e => {
      const getList: (k: string) => StyleElement[] = k => {
        const val = map.get(k);
        if (val == null) {
          const arr: StyleElement[] = [];
          map.set(k, arr);
          return arr;
        } else {
          return val;
        }
      };
      const elts = getList(e.title);
      elts.push(e);
      if (e instanceof HTMLLinkElement && !/alt/.test(e.rel)) {
        defaultTitles.push(e.title);
        getList(DEFAULT_STYLESHEET).push(e);
      }
    });
    console.log('# stylesheets:', map.size);
    const isDefault = (title?: string) => defaultTitles.includes(title!);
    const titles = Object.freeze([...map.keys()]);
    setStylesheetMap({ map, isDefault, titles });
  }, []);

  useEffect(() => {
    console.debug('Adding listener');
    window.addEventListener('load', handleOnLoad);
    return () => {
      console.debug('Removing listener');
      window.removeEventListener('load', handleOnLoad);
    };
  }, [handleOnLoad]);

  useEffect(() => {
    console.log('Changing stylesheet?');
    function disable(title: string, disabled: boolean) {
      const ss = styleSheetMap?.map.get(title);
      ss?.forEach(s => {
        s.disabled = true; // workaround
        s.disabled = disabled;
      });
    }

    if (css !== undefined) {
      console.debug('Yes');
      // Disable everyone else
      styleSheetMap?.titles
        .filter(t => t !== css)
        .forEach(t => disable(t, true));
      // Enable
      disable(css, false);
    } else {
      console.debug('No');
    }
  }, [css, styleSheetMap]);

  // const defaultTitles = [...new Set(defaultStylesheets.map(s => s.title))];
  return styleSheetMap?.map.size! <= 2 ? (
    <></>
  ) : (
    <select
      defaultValue={DEFAULT_STYLESHEET}
      onChange={e => {
        const title = e.currentTarget.value;
        setCss(title);
      }}
    >
      <option value={DEFAULT_STYLESHEET}>Default</option>
      <option value={NO_STYLESHEET}>No styling</option>
      {styleSheetMap?.titles
        .filter(t => t !== DEFAULT_STYLESHEET)
        .map(title => {
          return (
            <option key={title} value={title}>
              {title}
              {styleSheetMap?.isDefault(title) ? ' (default)' : undefined}
            </option>
          );
        })}
    </select>
  );
}

export default App;
