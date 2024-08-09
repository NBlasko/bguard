import { panic } from '../../exceptions';

export const equalTo = (expected: unknown) => (received: number, pathToError: string) => {
  if (expected !== received) panic(expected, received, pathToError, 'The received value is not equal to expected');
};
