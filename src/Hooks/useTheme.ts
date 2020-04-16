import { ITheme } from '../Theme/theme';
import { useBodyClass } from './';

const useTheme = (theme: ITheme) =>
  useBodyClass(theme.styles.map(s => s.Theme));

export default useTheme;
