import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ParentTabBar } from '../components';
import { ParentDashboardScreen, ParentAccountScreen, ParentPlanScreen } from '../screens';
import type { ParentTabParamList } from './types';

const Tab = createBottomTabNavigator<ParentTabParamList>();

/** Grown-up area behind the parent gate: Progress / Account / Plan. */
export function ParentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <ParentTabBar {...props} />}
    >
      <Tab.Screen name="Progress" component={ParentDashboardScreen} />
      <Tab.Screen name="Account" component={ParentAccountScreen} />
      <Tab.Screen name="Plan" component={ParentPlanScreen} />
    </Tab.Navigator>
  );
}
