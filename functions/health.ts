import { handleOptions, jsonResponse } from './shared/store';

export const onRequestOptions = () => handleOptions();

export const onRequestGet = () => {
  return jsonResponse({
    status: 'ok',
    uptime: 100,
  });
};
