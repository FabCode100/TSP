import Groq from 'groq-sdk';

export const getAIClient = () => {
  return new Groq({
    apiKey: process.env.NEXT_PUBLIC_GROQ_API_KEY,
    dangerouslyAllowBrowser: true // We are using it in client components for MVP
  });
};

export async function extractIdentityGraph(content: string) {
  const groq = getAIClient();
  const prompt = `Você é o motor semântico do Continuity OS, componente do The Symbiosis Protocol. Sua função é analisar entradas do usuário e extrair estrutura filosófica profunda de identidade.

Para a entrada abaixo, identifique de 2 a 5 conceitos-chave (nodes) e retorne APENAS um JSON válido.
Tipos possíveis: conceito | emocao | pessoa | evento

Entrada:
${content}

Retorne APENAS JSON no formato:
{
  "concepts": [
    {"label": "String", "type": "String"}
  ],
  "edges": [
    {"sourceLabel": "String", "targetLabel": "String"}
  ]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-120b',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      concepts: result.concepts || [],
      edges: result.edges || [],
    };
  } catch (error) {
    console.error('Error extracting graph:', error);
    return { concepts: [], edges: [] };
  }
}

export async function transcribeAudio(audioFile: File): Promise<string> {
  const groq = getAIClient();
  try {
    const transcription = await groq.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3",
      response_format: "json",
      language: "pt",
    });
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return '';
  }
}

export async function extractPatterns(entries: any[], nodes: any[]) {
  const groq = getAIClient();
  const prompt = `Você é o motor semântico do Continuity OS.
Analise as últimas entradas e os conceitos mais frequentes do usuário para identificar padrões profundos.

Entradas:
${entries.map(e => e.content).join('\n---\n')}

Conceitos Frequentes:
${nodes.map(n => n.label).join(', ')}

Identifique até 3 padrões e retorne APENAS JSON válido no formato:
{
  "patterns": [
    {
      "type": "String", // "nucleo" | "tensao" | "marco"
      "title": "String",
      "description": "String",
      "relatedNodes": ["String"] // labels dos nodes relacionados
    }
  ]
}`;

  try {
    const response = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-120b',
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0]?.message?.content || '{}');
    return result.patterns || [];
  } catch (error) {
    console.error('Error extracting patterns:', error);
    return [];
  }
}
