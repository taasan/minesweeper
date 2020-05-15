export const BOARD_BORDER_WIDTH = 7;

export default function getFitWindowCss(board: React.RefObject<SVGSVGElement>) {
  if (board.current == null) {
    return {
      maxHeight: 'revert',
      maxWidth: 'revert',
    };
  }
  const { top } = board.current.getBoundingClientRect();
  return {
    maxWidth: '100vw',
    // Must add 3-5 px to prevent scrollbars
    maxHeight: `calc(100vh - ${BOARD_BORDER_WIDTH * 2 + top + 5}px)`,
  };
}
