/* eslint-disable @typescript-eslint/strict-boolean-expressions */
import { useCallback } from 'react';

type Handlers<T> = {
  onfulfilled?: (action: T) => void;
  onrejected?: (action: T, err: Error) => void;
  onfinally?: (action: T) => void;
};

const useAsyncDispatch = <T extends unknown>(
  dispatch?: React.Dispatch<T>,
  handlers?: Handlers<T>
) => {
  return useCallback(
    (action: T) => {
      const promise = (async () =>
        dispatch != null ? dispatch(action) : undefined)();
      if (handlers != null) {
        const { onfinally, onfulfilled, onrejected } = handlers;

        promise
          .then(onfulfilled && (() => onfulfilled(action)))
          .catch(onrejected && (err => onrejected(action, err)))
          .finally(onfinally && (() => onfinally(action)));
      }
    },
    [handlers, dispatch]
  );
};

export default useAsyncDispatch;
/*
export default <T extends unknown>(
  dispatch?: React.Dispatch<T>,
  onfulfilled?: () => void,
  onrejected?: (err: Error) => void,
  onfinally?: () => void
) =>
  useCallback(
    (action: T) =>
      (async () => (dispatch != null ? dispatch(action) : undefined))()
        .then(onfulfilled)
        .catch(onrejected)
        .finally(onfinally),
    [dispatch, onfinally, onrejected, onfulfilled]
  );
*/
