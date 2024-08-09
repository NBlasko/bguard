import { panic } from '../../exceptions';

const emailRegExp = /^[^@]+@[^@]+\.[^@]+$/;

export const email = () => (received: string, pathToError: string) => {
  if (!emailRegExp.test(received))
    panic(emailRegExp, received, pathToError, 'The received value does not match the required email pattern');
};
