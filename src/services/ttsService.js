const axios = require('axios');
const googleTTS = require('google-tts-api');

class TTSService {
  constructor() {
    this.elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    this.elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Default Bella
    this.openAIKey = process.env.OPENAI_API_KEY;
    this.azureKey = process.env.AZURE_TTS_KEY;
    this.azureRegion = process.env.AZURE_TTS_REGION || 'eastus';
  }

  async generateAudio(text, options = {}) {
    const provider = options.provider || 
      (this.elevenLabsKey ? 'elevenlabs' : 
       this.azureKey ? 'azure' :
       this.openAIKey ? 'openai' : 'google');

    console.log(`[TTSService] Generating audio. Provider: ${provider}, Requested VoiceId: ${options.voiceId}, Default VoiceId: ${this.elevenLabsVoiceId}`);

    switch (provider) {
      case 'azure':
        return this.generateAzure(text, options);
      case 'elevenlabs':
        return this.generateElevenLabs(text, options);
      case 'openai':
        return this.generateOpenAI(text, options);
      case 'google':
      default:
        return this.generateGoogle(text, options);
    }
  }

  async generateAzure(text, options) {
    if (!this.azureKey) throw new Error('AZURE_TTS_KEY not configured');
    
    // Default Portuguese Neural Voice
    const voice = options.voice || 'pt-BR-AntonioNeural'; 
    const url = `https://${this.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

    const ssml = `
      <speak version='1.0' xml:lang='pt-BR'>
        <voice xml:lang='pt-BR' xml:gender='Male' name='${voice}'>
          ${text}
        </voice>
      </speak>`;

    const response = await axios.post(url, ssml, {
      headers: {
        'Ocp-Apim-Subscription-Key': this.azureKey,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        'User-Agent': 'TSP-Backend'
      },
      responseType: 'arraybuffer'
    });

    return Buffer.from(response.data);
  }

  async generateGoogle(text, options) {
    // google-tts-api has a limit of 200 characters per request.
    // We split into chunks of ~180 to be safe with punctuation.
    const chunks = text.match(/[^.!?]+[.!?]+|.{1,180}/g) || [text];
    const buffers = [];

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;
      const url = googleTTS.getAudioUrl(chunk.trim(), {
        lang: options.lang || 'pt',
        slow: false,
        host: 'https://translate.google.com'
      });
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      buffers.push(Buffer.from(response.data));
    }

    return Buffer.concat(buffers);
  }

  async generateElevenLabs(text, options) {
    if (!this.elevenLabsKey) throw new Error('ELEVENLABS_API_KEY not configured');
    
    // Use the instance property if no specific option provided
    const voiceId = options.voiceId || this.elevenLabsVoiceId;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    try {
      const response = await axios.post(url, {
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      }, {
        headers: {
          'xi-api-key': this.elevenLabsKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error(`[TTSService] ElevenLabs failed for voice ${voiceId}:`, error.response?.data?.toString() || error.message);
      
      // If we already tried the default, fall back to Google
      if (voiceId === this.elevenLabsVoiceId) {
        console.log('[TTSService] Default ElevenLabs voice also failed. Falling back to Google TTS...');
        return this.generateGoogle(text, options);
      }

      // Try the default ElevenLabs voice first
      console.log(`[TTSService] Trying default ElevenLabs voice (${this.elevenLabsVoiceId})...`);
      return this.generateElevenLabs(text, { ...options, voiceId: this.elevenLabsVoiceId });
    }
  }

  async generateOpenAI(text, options) {
    if (!this.openAIKey) throw new Error('OPENAI_API_KEY not configured');

    const response = await axios.post('https://api.openai.com/v1/audio/speech', {
      model: 'tts-1',
      input: text,
      voice: options.voice || 'alloy' // alloy, echo, fable, onyx, nova, shimmer
    }, {
      headers: {
        'Authorization': `Bearer ${this.openAIKey}`,
        'Content-Type': 'application/json'
      },
      responseType: 'arraybuffer'
    });

    return Buffer.from(response.data);
  }
}

module.exports = new TTSService();
