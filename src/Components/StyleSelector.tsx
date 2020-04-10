import React, { useState, useEffect } from 'react';

// Chrome fikser ikke å sette disabled direkte på stylesheet-objektet
type StyleElement = (HTMLLinkElement | HTMLStyleElement) & {
  title: string;
  disabled: boolean;
};

const DEFAULT_STYLESHEET = '__DEFAULT_STYLESHEET__';
const NO_STYLESHEET = '__NO_STYLESHEET__';

const StyleSelector: React.FC<any> = () => {
  const [styleSheetMap, setStylesheetMap] = useState<
    | Readonly<{
        map: ReadonlyMap<string, StyleElement[]>;
        titles: readonly string[];
        isDefault: (title?: string) => boolean;
      }>
    | undefined
  >(undefined);

  const [css, setCss] = useState<string | undefined>();

  useEffect(() => {
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
    links.forEach(link => {
      if (
        // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
        !link.media ||
        link.media === 'all' ||
        link.media === 'screen'
      ) {
        stylesheets.push(link);
      }
    });

    console.log({ stylesheets });

    const map: Map<string, StyleElement[]> = new Map();
    const defaultTitles: string[] = [];

    map.set(DEFAULT_STYLESHEET, []);

    stylesheets.forEach(e => {
      const getList: (k: string) => StyleElement[] = k => {
        const val = map.get(k);
        if (val == null) {
          return map.set(k, []).get(k)!;
        } else {
          return val;
        }
      };
      const elts = getList(e.title);
      elts.push(e);
      if (
        (e instanceof HTMLLinkElement && !/alt/.test(e.rel)) ||
        e instanceof HTMLStyleElement
      ) {
        defaultTitles.push(e.title);
        getList(DEFAULT_STYLESHEET).push(e);
      }
    });
    const isDefault = (title?: string) => defaultTitles.includes(title!);
    const titles = Object.freeze([...map.keys()]);
    setStylesheetMap({ map, isDefault, titles });
  }, []);

  useEffect(() => {
    function disable(title: string, disabled: boolean) {
      const ss = styleSheetMap?.map.get(title);
      ss?.forEach(s => {
        s.disabled = true; // workaround
        s.disabled = disabled;
      });
    }

    if (css != null && styleSheetMap != null) {
      // Disable everyone else
      styleSheetMap.titles
        .filter(t => t !== css)
        .forEach(t => disable(t, true));
      // Enable
      disable(css, false);
    }
  }, [css, styleSheetMap]);

  return (
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
};

export default StyleSelector;
