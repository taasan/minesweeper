import { ITheme } from '../Theme/theme';
import { useDomTokenList } from './';

const useTheme = (theme: ITheme) =>
  useDomTokenList(document.body, ...theme.styles.map(s => s.Theme));

export default useTheme;
