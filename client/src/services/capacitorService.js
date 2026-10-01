import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export const isNativePlatform = () => Capacitor.isNativePlatform();
export const getPlatform = () => Capacitor.getPlatform();

/**
 * Initialize native device UI features (Status Bar, Splash Screen)
 */
export const initCapacitor = async () => {
  if (!isNativePlatform()) return;

  try {
    // Hide splash screen smoothly after app initializes
    await SplashScreen.hide();
  } catch (e) {
    console.debug('[Capacitor] SplashScreen init notice:', e);
  }

  try {
    // Configure Status Bar for Android (Dark icons on white background)
    await StatusBar.setStyle({ style: Style.Light });
    await StatusBar.setBackgroundColor({ color: '#FFFFFF' });
    await StatusBar.setOverlaysWebView({ overlay: false });
  } catch (e) {
    console.debug('[Capacitor] StatusBar init notice:', e);
  }
};

/**
 * Register Android hardware back button handler
 * @param {Function} handleBack - callback returning boolean (true if handled, false to allow default/exit)
 */
export const setupHardwareBackButton = (handleBack) => {
  if (!isNativePlatform()) return () => {};

  const listenerPromise = App.addListener('backButton', ({ canGoBack }) => {
    // If our custom handler consumed the back button event (e.g. closed a modal or drawer), stop here
    if (handleBack && handleBack()) {
      return;
    }

    if (canGoBack) {
      window.history.back();
    } else {
      App.minimizeApp();
    }
  });

  return () => {
    listenerPromise.then((handle) => handle.remove()).catch(() => {});
  };
};
