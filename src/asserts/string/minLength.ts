import { panic } from '../../exceptions';

export const minLength = (expected: number) => (received: string, pathToError: string) => {
  if (received.length < expected) panic(expected, received, pathToError, 'The received value is not equal to expected');
};
