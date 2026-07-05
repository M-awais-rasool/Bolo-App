import React from 'react';

import { Screen, ComingSoon } from '../../components';
import { colors } from '../../constants/colors';

export function ParentPlanScreen() {
  return (
    <Screen bottomInset={false} backgroundColor={colors.parentBg} statusBarColor={colors.parentInk}>
      <ComingSoon
        icon="lock"
        title="Plan"
        message="Review your subscription and unlock every lesson pack for your family."
      />
    </Screen>
  );
}
