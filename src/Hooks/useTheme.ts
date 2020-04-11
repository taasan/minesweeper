import { ITheme } from '../Theme';
import useBodyClass from './useBodyClass';

const useTheme = (theme: ITheme) =>
  useBodyClass(theme.styles.map(s => s.Theme));

export default useTheme;
