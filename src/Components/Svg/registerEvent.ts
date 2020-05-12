// TODO: How to type this function correctly
const registerEvent: typeof window.addEventListener = (
  event: string,
  callback: any
) => {
  window.addEventListener(event, callback);
  return () => window.removeEventListener(event, callback);
};

export default registerEvent;
