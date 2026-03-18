// This file replaces the Next.js Server Actions to work with Capacitor (Static Export).
// It acts as an HTTP client connecting to the Fastify backend.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// MOCK USER: We use a fresh email to ensure we are registering a brand new user with correctly hashed password.
const MOCK_EMAIL = 'agent_tester_01@symbiosis.ai';
const MOCK_PASS = 'tsp_secure_agent_2026';

// MVP: Auto-login/register strategy
async function getAuthToken() {
  if (typeof window === 'undefined') return '';
  let token = localStorage.getItem('tsp_token');
  if (token) return token;

  console.log('[Auth] No token found. Attempting to login/register mock user:', MOCK_EMAIL);

  // Try to login mock user
  try {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: MOCK_EMAIL, password: MOCK_PASS })
    });
    
    if (loginRes.ok) {
      const data = await loginRes.json();
      token = data.data.token;
      if (token) {
        localStorage.setItem('tsp_token', token);
        console.log('[Auth] Login successful.');
        return token;
      }
    } else {
      console.warn('[Auth] Login failed (status ' + loginRes.status + '). Trying registration...');
    }

    // If login fails, try register
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: MOCK_EMAIL, password: MOCK_PASS, onboardingAnswers: [] })
    });
    
    if (regRes.ok) {
      const data = await regRes.json();
      token = data.data.token;
      if (token) {
        localStorage.setItem('tsp_token', token);
        console.log('[Auth] Registration successful.');
        return token;
      }
    } else {
      const errorData = await regRes.json();
      console.error('[Auth] Registration failed:', errorData);
    }
  } catch (e) {
    console.warn('[Auth] Backend connection failed. Is Fastify running on 3001?', e);
  }
  return '';
}

async function fetchAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = await getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {}),
  };

  let res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  
  // If unauthorized, clear token and retry once
  if (res.status === 401 && typeof window !== 'undefined') {
    console.warn('[API] Unauthorized (401). Clearing token and retrying endpoint:', endpoint);
    localStorage.removeItem('tsp_token');
    const newToken = await getAuthToken();
    const retryHeaders = {
      'Content-Type': 'application/json',
      ...(newToken && { Authorization: `Bearer ${newToken}` }),
      ...(options.headers || {}),
    };
    res = await fetch(`${API_URL}${endpoint}`, { ...options, headers: retryHeaders });
  }

  if (!res.ok) {
    const errText = `API Error ${res.status}: ${res.statusText}`;
    console.error(`[API] ${endpoint} failed:`, errText);
    throw new Error(errText);
  }
  const json = await res.json();
  return json.data;
}

export async function getOrCreateUser() {
  try {
    const user = await fetchAPI('/auth/me');
    // Se 'onboarding' for uma string (JSON), avaliamos se está preenchida.
    // No nosso caso, o onboarding é considerado completo se houver dados lá.
    const onboardingComplete = user.onboarding && user.onboarding !== '[]';
    return { ...user, onboarding: onboardingComplete };
  } catch (e) {
    console.warn('[API] Could not fetch user status, defaulting to incomplete onboarding.');
    return { id: 'guest', onboarding: false };
  }
}

export async function saveOnboarding(answers: string[]) {
  // 1. Salva as respostas como entradas no banco (retrocomputação)
  const types = ['ORIGEM', 'PERMANÊNCIA', 'DECISÃO', 'TRANSFORMAÇÃO', 'ESSÊNCIA'];
  for (let i = 0; i < answers.length; i++) {
    if (answers[i].trim()) {
      await addEntry(answers[i], types[i] || 'REFLEXÃO');
    }
  }

  // 2. Marca o onboarding como concluído no modelo do usuário
  await fetchAPI('/auth/onboarding', {
    method: 'POST',
    body: JSON.stringify({ answers })
  });
}

export async function getEntries() {
  try {
    const data = await fetchAPI('/entries');
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function addEntry(content: string, type: string) {
  return fetchAPI('/entries', {
    method: 'POST',
    body: JSON.stringify({ content, type })
  });
}

export async function removeEntry(id: string) {
  return fetchAPI(`/entries/${id}`, {
    method: 'DELETE'
  });
}

export async function getGraphData() {
  try {
    const data = await fetchAPI('/graph');
    return data || { nodes: [], edges: [] };
  } catch (e) {
    return { nodes: [], edges: [] };
  }
}

export async function updateGraph(newNodes: any[], newEdges: any[]) {
  console.log('[API] Graph update requested (client), but handled by Fastify backend via entry creation.');
}

export async function getPatterns() {
  try {
    const data = await fetchAPI('/patterns');
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function savePatterns(patterns: any[]) {
  console.log('[API] Patterns update requested (client), but handled by Fastify backend via analyzer.');
}

export async function getTwinProfile() {
  return await fetchAPI('/twin/profile');
}

export async function* sendTwinMessage(message: string) {
  const token = await getAuthToken();
  const response = await fetch(`${API_URL}/twin/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ message })
  });

  if (!response.ok) throw new Error('Failed to connect to Twin');
  
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');
    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const dataStr = line.replace('data: ', '').trim();
        if (dataStr === '[DONE]') return;
        try {
          const { content } = JSON.parse(dataStr);
          if (content) yield content;
        } catch (e) {}
      }
    }
  }
}
