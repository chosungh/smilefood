import React from 'react';
import { Slot } from 'expo-router';
import { RecoilRoot } from 'recoil';

export default function Layout() {
  return (
    <RecoilRoot>
      <Slot /> 
    </RecoilRoot>
  );
}