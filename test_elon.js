const { db } = require('./src/lib/firebase');

async function testElon() {
    const jobId = 'test_elon_' + Date.now();
    console.log(`🚀 Disparando Job de Teste: ${jobId}`);

    await db.collection('avatar_jobs').doc(jobId).set({
        photo_url: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Elon_Musk%2C_2018_%28cropped%29.jpg',
        // Áudio de teste (uma frase curta em português)
        audio_url: 'https://translate.google.com/translate_tts?ie=UTF-8&q=Ol%C3%A1%20pessoal%2C%20estou%20falando%20direto%20do%20seu%20projeto%20ninja&tl=pt&client=tw-ob',
        status: 'pending',
        createdAt: new Date().toISOString()
    });

    console.log('✅ Job enviado! Olhe o seu Google Colab agora...');
}

testElon();
