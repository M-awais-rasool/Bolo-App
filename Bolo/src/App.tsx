import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';

import { hydrateContentPack } from './content/remote';
import { RootNavigator } from './navigation/RootNavigator';
import { CompanionProvider } from './context/CompanionContext';
import { ProgressProvider } from './context/ProgressContext';
import { useAppFonts } from './hooks/useAppFonts';
import { BoloMark } from './components';
import { colors } from './constants/colors';

/** Navigation theme so the container background matches our cream backdrop. */
const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.creamDeep,
    card: colors.surface,
    text: colors.ink,
    primary: colors.purple,
  },
};

export default function App() {
  const fontsLoaded = useAppFonts();
  // Newest local pack (bundled or cached) is active before first render; the
  // CDN refresh continues in the background and never blocks the child.
  const [packReady, setPackReady] = useState(false);
  useEffect(() => {
    hydrateContentPack().finally(() => setPackReady(true));
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar hidden />
      <CompanionProvider>
        <ProgressProvider>
          {fontsLoaded && packReady ? (
            <NavigationContainer theme={navTheme}>
              <RootNavigator />
            </NavigationContainer>
          ) : (
            <View style={styles.loading}>
              <BoloMark size={64} />
            </View>
          )}
        </ProgressProvider>
      </CompanionProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
