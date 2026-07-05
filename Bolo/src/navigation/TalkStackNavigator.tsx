import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { CompanionHubScreen, LessonMapScreen, StreakScreen } from '../screens';
import type { TalkStackParamList } from './types';

const Stack = createNativeStackNavigator<TalkStackParamList>();

/**
 * The "Talk" tab is itself a stack: the companion hub is home, and the lesson
 * map / streak screens push on top while keeping the bottom tab bar visible
 * (exactly as those artboards show it).
 */
export function TalkStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <Stack.Screen name="CompanionHub" component={CompanionHubScreen} />
      <Stack.Screen name="LessonMap" component={LessonMapScreen} />
      <Stack.Screen name="Streak" component={StreakScreen} />
    </Stack.Navigator>
  );
}
