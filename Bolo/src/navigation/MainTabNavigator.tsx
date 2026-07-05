import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { KidTabBar } from '../components';
import { VocabularyJournalScreen, CompanionRoomScreen } from '../screens';
import { TalkStackNavigator } from './TalkStackNavigator';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

/** The child-facing app shell: Talk / Journal / Room bottom tabs. */
export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: 'transparent' } }}
      tabBar={(props) => <KidTabBar {...props} />}
    >
      <Tab.Screen name="TalkTab" component={TalkStackNavigator} />
      <Tab.Screen name="JournalTab" component={VocabularyJournalScreen} />
      <Tab.Screen name="RoomTab" component={CompanionRoomScreen} />
    </Tab.Navigator>
  );
}
