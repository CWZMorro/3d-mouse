import ngrok from 'ngrok';

(async function() {
  try {
    const url = await ngrok.connect(5173); 
    console.log('------------------------------------------');
    console.log(`🚀 FRONTEND TUNNEL: ${url}`);
    console.log('------------------------------------------');
  } catch (err) {
    console.error('Ngrok Frontend Error:', err);
  }
})();