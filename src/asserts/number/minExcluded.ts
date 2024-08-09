import { panic } from '../../exceptions';

export const minExcluded = (expected: number) => (received: number, pathToError: string) => {
  if (expected >= received)
    panic(expected, received, pathToError, 'The received value is less than or equal to expected');
};
