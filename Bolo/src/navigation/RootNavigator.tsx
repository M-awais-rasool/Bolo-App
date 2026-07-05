import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  WelcomeScreen,
  SignInScreen,
  CreateProfileScreen,
  PickCompanionScreen,
  HatchingScreen,
  SayTheWordScreen,
  MicroConversationScreen,
  SoundPracticeScreen,
  FeedbackScreen,
  GrowthCelebrationScreen,
  ParentGateScreen,
} from '../screens';
import { MainTabNavigator } from './MainTabNavigator';
import { ParentTabNavigator } from './ParentTabNavigator';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Top-level navigation:
 *   Onboarding (Welcome → Sign in → Create profile → Pick companion → Hatching)
 *   → Main app (bottom tabs)
 *   → Speaking-session flow (full-screen, presented above the tabs)
 *   → Parent gate → grown-up area
 */
export function RootNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}
    >
      {/* Onboarding */}
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
      <Stack.Screen name="PickCompanion" component={PickCompanionScreen} />
      <Stack.Screen name="Hatching" component={HatchingScreen} />

      {/* Main app */}
      <Stack.Screen name="Main" component={MainTabNavigator} />

      {/* Speaking session (full-screen over the tabs) */}
      <Stack.Group screenOptions={{ animation: 'slide_from_bottom' }}>
        <Stack.Screen name="SayTheWord" component={SayTheWordScreen} />
        <Stack.Screen name="MicroConversation" component={MicroConversationScreen} />
        <Stack.Screen name="SoundPractice" component={SoundPracticeScreen} />
        <Stack.Screen name="Feedback" component={FeedbackScreen} />
        <Stack.Screen name="GrowthCelebration" component={GrowthCelebrationScreen} />
      </Stack.Group>

      {/* Parent area */}
      <Stack.Screen name="ParentGate" component={ParentGateScreen} />
      <Stack.Screen name="ParentArea" component={ParentTabNavigator} />
    </Stack.Navigator>
  );
}
