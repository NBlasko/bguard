import { panic } from '../../exceptions';

export const regExp = (expected: RegExp) => (received: string, pathToError: string) => {
  if (!expected.test(received))
    panic(expected, received, pathToError, 'The received value does not match the required text pattern');
};
