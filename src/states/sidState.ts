import { atom } from 'recoil';

export const sidState = atom({
  key: 'sidState',
  default: null as string | null,
}); 