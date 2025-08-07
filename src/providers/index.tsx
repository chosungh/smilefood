import ErrorBoundary from 'react-native-error-boundary';
import FallbackComponent from 'react-native-error-boundary/lib/ErrorBoundary/FallbackComponent';
import {ActionSheetProvider} from '@expo/react-native-action-sheet';
import type {ThemeType} from 'dooboo-ui';
import {DoobooProvider} from 'dooboo-ui';

import {theme} from '../theme';
import {handleErrorConsole} from '../utils/error';
import {RecoilProvider} from './RecoilProvider';

interface Props {
  initialThemeType?: ThemeType;
  children?: JSX.Element;
}

function RootProvider({initialThemeType, children}: Props): JSX.Element {
  return (
    <RecoilProvider>
      <DoobooProvider
        themeConfig={{
          initialThemeType: initialThemeType ?? undefined,
          customTheme: theme,
        }}
      >
        <ErrorBoundary
          FallbackComponent={FallbackComponent}
          onError={handleErrorConsole}
        >
          <ActionSheetProvider>{children}</ActionSheetProvider>
        </ErrorBoundary>
      </DoobooProvider>
    </RecoilProvider>
  );
}

export default RootProvider;
