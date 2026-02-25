import { boot } from 'quasar/wrappers';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { api } from './axios';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo: Echo<'pusher'>;
  }
}

window.Pusher = Pusher;

let echo: Echo<'pusher'> | null = null;

export function getEcho(): Echo<'pusher'> | null {
  return echo;
}

export default boot(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('[Echo] No token found, skipping initialization');
    return;
  }

  const baseURL =
    (typeof process !== 'undefined' && process.env?.VITE_API_URL) ||
    import.meta.env.VITE_API_URL ||
    '';

  console.log('[Echo] Initializing with baseURL:', baseURL);
  console.log('[Echo] Auth endpoint:', `${baseURL}/broadcasting/auth`);

  // Pusher 디버그 로그 활성화
  Pusher.logToConsole = true;

  echo = new Echo({
    broadcaster: 'pusher',
    key: '722897ee7121d72dc477',
    cluster: 'ap3',
    forceTLS: true,
    authorizer: (channel: { name: string }) => ({
      authorize: (socketId: string, callback: (error: Error | null, data: { auth: string } | null) => void) => {
        api
          .post('/broadcasting/auth', {
            socket_id: socketId,
            channel_name: channel.name,
          })
          .then((response) => callback(null, response.data))
          .catch((error) => callback(error, null));
      },
    }),
  });

  window.Echo = echo;
  console.log('[Echo] Instance created successfully');
});
