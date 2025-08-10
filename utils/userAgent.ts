import { Platform } from 'react-native';

export const getUserAgent = (): string => {
  const platform = Platform.OS;
  const version = Platform.Version;
  
  switch (platform) {
    case 'ios':
      return `SmileFood/1.0 iOS/${version}`;
    case 'android':
      return `SmileFood/1.0 Android/${version}`;
    case 'web':
      return `SmileFood/1.0 Web`;
    default:
      return `SmileFood/1.0 ${platform}/${version}`;
  }
};
