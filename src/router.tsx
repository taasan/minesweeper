import {
  LinkProps,
  NavigateOptions,
  Link as ReachLink,
  navigate as reachNavigate,
} from '@reach/router';
import React from 'react';

// Workaround to use homepage='.'
// Can't use subdirectories in route

function base() {
  const b = (process.env.PUBLIC_URL === '.'
    ? window.location.pathname.substring(
        0,
        window.location.pathname.lastIndexOf('/') + 1
      )
    : process.env.PUBLIC_URL ?? '/'
  )
    .split(/[/]+/)
    .join('/');
  return b === '' ? '/' : b;
}

export const BASE = base();

export const Link = React.memo<React.PropsWithChildren<LinkProps<{}>>>(
  ({ to = '', children, ...props }) => {
    if (to[0] === '/') {
      to = BASE + to;
    }
    return (
      <ReachLink {...props} to={to} ref={undefined}>
        {children}
      </ReachLink>
    );
  }
);

export const navigate = (
  to: string,
  options?: NavigateOptions<{}> | undefined
) => {
  if (to === '/' || to === '' || to == null) {
    to = BASE;
  } else if (to[0] === '/') {
    to = BASE + to;
  }
  return reachNavigate(to, options);
};
