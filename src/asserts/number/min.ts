import { panic } from '../../exceptions';

export const min = (expected: number) => (received: number, pathToError: string) => {
  if (expected > received) panic(expected, received, pathToError, 'The received value is less than expected');
};
