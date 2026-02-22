import { startTunnel } from 'untun';

(async function() {
  try {
    const tunnel = await startTunnel({ port: 5173 });
    const url = await tunnel.getURL();
    console.log('------------------------------------------');
    console.log(`🚀 FRONTEND TUNNEL: ${url}`);
    console.log('------------------------------------------');
  } catch (err) {
    console.error('Frontend Tunnel Error:', err);
  }
})();