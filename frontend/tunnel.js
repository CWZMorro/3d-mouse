import localtunnel from 'localtunnel';

(async function() {
  try {
    const tunnel = await localtunnel({ port: 5173, subdomain: '3d-mouse-ui' }); 
    console.log('------------------------------------------');
    console.log(`🚀 FRONTEND TUNNEL: ${tunnel.url}`);
    console.log('------------------------------------------');

    tunnel.on('close', () => {
      console.log('Tunnel closed.');
    });
  } catch (err) {
    console.error('Localtunnel Frontend Error:', err);
  }
})();