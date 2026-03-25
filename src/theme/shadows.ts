import { Platform, ViewStyle } from 'react-native';

const webCard =
  Platform.OS === 'web'
    ? ({
        boxShadow: '0 4px 24px rgba(15, 23, 42, 0.08)',
      } as ViewStyle)
    : {};

/** Layered depth for cards / floating chrome */
export const shadowFloat: ViewStyle = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0.14,
  shadowRadius: 20,
  elevation: Platform.OS === 'android' ? 10 : 0,
  ...webCard,
};

export const shadowCard: ViewStyle = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 10,
  elevation: 3,
  ...(Platform.OS === 'web'
    ? ({ boxShadow: '0 2px 12px rgba(15, 23, 42, 0.06)' } as ViewStyle)
    : {}),
};

export const shadowSoft: ViewStyle = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
  ...(Platform.OS === 'web'
    ? ({ boxShadow: '0 1px 8px rgba(15, 23, 42, 0.05)' } as ViewStyle)
    : {}),
};
