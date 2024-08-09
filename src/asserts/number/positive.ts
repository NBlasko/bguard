import { panic } from '../../exceptions';

export const positive = () => (received: number, pathToError: string) => {
  if (received <= 0) panic('positive', received, pathToError, 'The received value is not a positive number');
};
