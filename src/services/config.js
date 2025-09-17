import { resolveSitePath } from './url.js';

const CONFIG_URL = resolveSitePath('.well-known/config.json');

let configPromise;

export function getConfig() {
  if (!configPromise) {
    configPromise = fetch(CONFIG_URL, {
      headers: { 'Cache-Control': 'no-cache' },
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Unable to load configuration (${res.status})`);
        }
        return res.json();
      })
      .catch((error) => {
        console.warn('[config] Fallback to defaults', error);
        return {
          githubClientId: 'YOUR_GITHUB_CLIENT_ID',
          oauthProxyUrl: '',
          staticman: {
            enabled: false,
            endpoint: '',
          },
          bookingIssueFallbackUrl: '',
        };
      });
  }
  return configPromise;
}
