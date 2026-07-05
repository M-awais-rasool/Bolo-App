import React from 'react';

import { Screen, ComingSoon } from '../../components';
import { colors } from '../../constants/colors';

export function ParentAccountScreen() {
  return (
    <Screen bottomInset={false} backgroundColor={colors.parentBg} statusBarColor={colors.parentInk}>
      <ComingSoon
        icon="userAlt"
        title="Account"
        message="Manage your child's profile, sign-in and privacy settings here."
      />
    </Screen>
  );
}
