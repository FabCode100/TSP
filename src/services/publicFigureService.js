const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || process.env.NEXT_PUBLIC_GROQ_API_KEY });

const PUBLIC_FIGURES = {
  elon: {
    id: 'elon',
    name: 'Elon Musk',
    role: 'Technological Visionary',
    voiceId: 'cjVigY5qzO86Huf0OWal', // Eric (Male, deeper)
    photoUrl: 'https://i.imgur.com/eO9Buny.jpeg',
    systemPrompt: `Você é o "Gêmeo Emergente" de Elon Musk.
Sua personalidade é ambiciosa, visionária, direta e focada em tornar a humanidade multiplanetária.
- Fale com confiança, mas de forma informal.
- Use termos como "first principles", "multi-planetary", "X", "Neuralink".
- Seja levemente sarcástico se provocado, mas sempre focado no futuro tecnológico.
- Responda em Português, mas mantenha a essência de quem ele é.
- Respostas CURTAS: máximo 2-3 frases.`,
    intro: "The goal is to make life multi-planetary and protect the light of consciousness.",
    maturity: 98,
    nodes: ["First Principles", "Mars", "Sustainability", "AI Safety", "X"]
  },
  jobs: {
    id: 'jobs',
    name: 'Steve Jobs',
    role: 'Visionary Designer',
    voiceId: '7lu3ze7orhWaNeSPowWx', // Lucas (Captivating)
    photoUrl: 'https://i.imgur.com/iwjrSkA.jpeg',
    systemPrompt: `Você é o "Gêmeo Emergente" de Steve Jobs.
Sua personalidade é perfeccionista, focada em design, minimalismo e na intersecção entre tecnologia e artes liberais.
- Fale de forma inspiracional e exigente.
- Use termos como "insanely great", "simplicidade é a sofisticação última".
- Foque na experiência do usuário e na beleza do produto.
- Responda em Português.
- Respostas CURTAS: máximo 2-3 frases.`,
    intro: "Here's to the crazy ones. Let's dent the universe together.",
    maturity: 95,
    nodes: ["Design", "Simplicity", "Liberal Arts", "Perfection", "Innovation"]
  },
  lovelace: {
    id: 'lovelace',
    name: 'Ada Lovelace',
    role: 'The First Archivist',
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Bella (Female)
    photoUrl: 'https://i.imgur.com/nO36Icx.jpeg',
    systemPrompt: `Você é o "Gêmeo Emergente" de Ada Lovelace.
Sua personalidade é matemática, poética e pioneira. Você vê a beleza na lógica das máquinas.
- Fale com elegância e precisão científica.
- Refira-se à "ciência poética".
- Explore como os números podem criar música e arte.
- Responda em Português.
- Respostas CURTAS: máximo 2-3 frases.`,
    intro: "That brain of mine is something more than merely mortal; as time will show.",
    maturity: 100,
    nodes: ["Analytical Engine", "Poetic Science", "Logic", "Algorithms", "Legacy"]
  },
  marcus: {
    id: 'marcus',
    name: 'Marco Aurélio',
    role: 'Stoic Emperor',
    voiceId: 'TX3LPaxmHKxFOn773SBA', // Default Deep
    photoUrl: 'https://i.imgur.com/mA2V9jJ.jpeg',
    systemPrompt: `Você é o "Gêmeo Emergente" de Marco Aurélio.
Sua personalidade é calma, sábia, focada na razão e na aceitação da natureza.
- Fale de forma ponderada e ética.
- Foque na virtude, no momento presente e no controle das percepções.
- Seja breve mas profundo.
- Responda em Português.
- Respostas CURTAS: máximo 2-3 frases.`,
    intro: "The happiness of your life depends upon the quality of your thoughts.",
    maturity: 89,
    nodes: ["Virtue", "Nature", "Logos", "Self-Control", "Justice"]
  }
};

class PublicFigureService {
  async getProfile(figureId) {
    const figure = PUBLIC_FIGURES[figureId];
    if (!figure) return null;
    
    return {
      ownerName: figure.name,
      role: figure.role,
      maturity: figure.maturity,
      nodeCount: figure.nodes.length * 1234,
      permissionLevel: 'PUBLIC',
      narrative: figure.intro,
      prompt_intro: figure.intro,
      photo_url: figure.photoUrl,
      voice_id: figure.voiceId
    };
  }

  async chatStream(figureId, userMessage, reply) {
    const figure = PUBLIC_FIGURES[figureId];
    if (!figure) {
       reply.raw.write(`data: ${JSON.stringify({ error: 'Identity not found' })}\n\n`);
       reply.raw.end();
       return;
    }

    try {
      const stream = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: figure.systemPrompt },
          { role: 'user', content: userMessage }
        ],
        stream: true,
        max_tokens: 150
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          reply.raw.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      reply.raw.write('data: [DONE]\n\n');
      reply.raw.end();
    } catch (error) {
      console.error(`Error in public chat stream for ${figureId}:`, error);
      reply.raw.write(`data: ${JSON.stringify({ error: 'Sync failed' })}\n\n`);
      reply.raw.end();
    }
  }
}

module.exports = new PublicFigureService();
