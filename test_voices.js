const axios = require('axios');
const API_KEY = 'sk_734f3079294734584513b23af321fd0fb730b7dc60056b66';

// More voice IDs to test
const VOICE_IDS = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },           // ✅ already confirmed
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Elli' },
  { id: 'jBpfAFp2xqE2cFPMNq3a', name: 'Aria' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilda' },
  { id: 'pFZP5JQG7iQjIQuCbCPq', name: 'Lily' },
  { id: 'nPczCuBb7mlhJGdQfW1o', name: 'Brian' },
  { id: 'bIHbv24MWmeRgsZsLLAx', name: 'Will' },
  { id: 'cgSgLvCH8yXMm7GcPvIR', name: 'Jessica' },
  { id: '9BWtsTj5x2vIvI3aTR5t', name: 'Aria2' },
  { id: 'cjVigY5qzO86Huf0OWal', name: 'Eric' },
  { id: 'iP95p4xoKVk53GoZYPWA', name: 'Chris' },
  { id: 'onwK4e9ZLuTAKqzv09b6', name: 'Daniel' },
  { id: 'JBFqnCBsd6RMkjVDRZhf', name: 'George' },
  { id: 'N2lVS1w4EtoT3dr4dDz1', name: 'Callum' },
  { id: 'TX3LPaxmHKxFOn773SBA', name: 'Liam' },
  { id: 'SAz9YHcvj6GT2AGvN67O', name: 'River' },
  { id: 'Zlb1dXrM653N07WRdFJ1', name: 'Thomas' },
];

async function testVoice(voiceId, name) {
  try {
    const res = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      text: 'Olá.',
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    }, {
      headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
      responseType: 'arraybuffer'
    });
    console.log(`✅ ${name} (${voiceId}): OK - ${res.data.length} bytes`);
    return true;
  } catch (err) {
    const msg = err.response?.data ? JSON.parse(Buffer.from(err.response.data).toString()).detail?.code : err.message;
    console.log(`❌ ${name} (${voiceId}): ${msg}`);
    return false;
  }
}

async function main() {
  console.log('Testing ElevenLabs voices...\n');
  for (const v of VOICE_IDS) {
    await testVoice(v.id, v.name);
  }
}

main();
