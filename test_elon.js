const { db } = require('./src/lib/firebase');

async function testElon() {
    const jobId = 'test_elon_' + Date.now();
    console.log(`🚀 Disparando Job de Teste: ${jobId}`);

    await db.collection('avatar_jobs').doc(jobId).set({
        // Fonte Imgur (Provido pelo usuário)
        photo_url: 'https://i.imgur.com/eO9Buny.jpeg',
        // Áudio de teste (via redirecionador que funciona melhor)
        audio_url: 'https://translate.google.com/translate_tts?ie=UTF-8&q=Ola%20pessoal%20estou%20falando%20do%20seu%20projeto%20ninja&tl=pt&client=tw-ob',
        status: 'pending',
        createdAt: new Date().toISOString()
    });

    console.log('✅ Job enviado! Olhe o seu Google Colab agora...');
}

testElon();
