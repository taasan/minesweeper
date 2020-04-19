import { ITheme } from '../Theme/theme';
import { useDomTokenList } from './';

const useTheme = (theme: ITheme) =>
  useDomTokenList(document.body, theme.classNames);

export default useTheme;
