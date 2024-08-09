import { panic } from '../../exceptions';

export const maxExcluded = (expected: number) => (received: number, pathToError: string) => {
  if (expected <= received)
    panic(expected, received, pathToError, 'The received value is greater than or equal to expected');
};
