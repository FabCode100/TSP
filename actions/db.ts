// This file replaces the Next.js Server Actions to work with Capacitor (Static Export).
// It acts as an HTTP client connecting to the Fastify backend.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// MOCK USER: We use a fresh email to ensure we are registering a brand new user with correctly hashed password.
const MOCK_EMAIL = 'agent_tester_01@symbiosis.ai';
const MOCK_PASS = 'tsp_secure_agent_2026';

// MVP: Auto-login/register strategy
export async function getAuthToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('tsp_token') || '';
}

export async function clearAuthToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('tsp_token');
}
export async function loginWithGoogleMock() {
  console.log('[Auth] Attempting Google Auth via CapGo Social Login');

  try {
    // Dynamic import to avoid build errors when not running in Capacitor
    const { SocialLogin } = await import('@capgo/capacitor-social-login');

    // 1. Inicializa o plugin (necessário para configurar o client ID)
    if (typeof window !== 'undefined') {
      await SocialLogin.initialize({
        google: {
          webClientId: '373842633648-jdjblnkhroppt9rgk4j7bltdb13uivou.apps.googleusercontent.com',
        },
      });
    }

    // 2. Abre o popup/modal nativo de contas do Google
    const { result } = await SocialLogin.login({
      provider: 'google',
      options: {
        scopes: ['profile', 'email'],
      },
    });

    console.log('[Auth] Google Auth Result:', result);

    if (result && 'profile' in result && result.profile) {
      const idToken = result.idToken;

      // 3. Envia o token verdadeiro para o nosso Fastify validar
      const loginRes = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          email: result.profile.email,
          name: result.profile.name
        })
      });

      if (loginRes.ok) {
        const data = await loginRes.json();
        const token = data.data.token;
        if (token) {
          localStorage.setItem('tsp_token', token);
          return token;
        }
      }
    }
  } catch (e) {
    console.error('[Auth] Google Auth Failed:', e);
  }
  return null;
}

export async function forceMockLogin() {
  console.log('[Auth] Attempting Bypass Mock Login');
  try {
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: MOCK_EMAIL, password: MOCK_PASS })
    });

    if (loginRes.ok) {
      const data = await loginRes.json();
      const token = data.data.token;
      if (token) {
        localStorage.setItem('tsp_token', token);
        return token;
      }
    } else {
      console.log('[Auth] Mock user not found, registering...');
      const regRes = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: MOCK_EMAIL, password: MOCK_PASS, onboardingAnswers: [] })
      });
      
      if (regRes.ok) {
        const regData = await regRes.json();
        const token = regData.data.token;
        if (token) {
          localStorage.setItem('tsp_token', token);
          return token;
        }
      }
    }
  } catch (e) {
    console.error('[Auth] Bypass Mock Login Failed:', e);
  }
  return null;
}

export async function handleGoogleRedirect() {
  try {
    const { SocialLogin } = await import('@capgo/capacitor-social-login');
    console.log('[Auth] Checking for redirect callback...');
    const result = await SocialLogin.handleRedirectCallback() as any;
    console.log('[Auth] Redirect Callback Result:', result);

    let idToken = result?.result?.idToken;
    let email = result?.result && 'profile' in result.result ? result.result.profile?.email : null;
    let name = result?.result && 'profile' in result.result ? result.result.profile?.name : null;

    // Manual fallback if plugin didn't parse it (happens on some Web flows)
    if (!idToken && typeof window !== 'undefined' && window.location.hash) {
      console.log('[Auth] Plugin didn\'t parse fragment, attempting manual parse...');
      const params = new URLSearchParams(window.location.hash.substring(1));
      idToken = params.get('id_token');
      // We don't have the profile here yet, but the backend will verify the idToken and get the email anyway.
    }

    if (idToken) {
      console.log('[Auth] ID Token found, sending to backend...');
      const loginRes = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          email,
          name
        })
      });

      if (loginRes.ok) {
        const data = await loginRes.json();
        const token = data.data.token;
        if (token) {
          console.log('[Auth] Backend login success, saving token.');
          localStorage.setItem('tsp_token', token);
          return token;
        }
      } else {
          console.error('[Auth] Backend validation failed:', await loginRes.text());
      }
    }
  } catch (e) {
    console.error('[Auth] Redirect Callback Error:', e);
  }
  return null;
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
    return { ...user, onboarding: onboardingComplete, photoUrl: user.photoUrl, voiceId: user.voiceId };
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

export async function updateProfile(data: { photoUrl?: string, voiceId?: string }) {
  return fetchAPI('/auth/profile', {
    method: 'POST',
    body: JSON.stringify(data)
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

export async function generateAvatar(text: string, photoUrl: string, voiceId?: string) {
  return await fetchAPI('/twin/avatar/generate', {
    method: 'POST',
    body: JSON.stringify({ text, photoUrl, voiceId })
  });
}

export async function pollAvatarStatus(jobId: string) {
  return await fetchAPI(`/twin/avatar/status/${jobId}`);
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
        } catch (e) { }
    }
  }
}
}

// =============================================
// TWIN SHARING API
// =============================================

export async function createShareToken(permissionLevel: string, role: string, roleInstruction: string, expiresAt?: string) {
  return fetchAPI('/twin/share', {
    method: 'POST',
    body: JSON.stringify({ permissionLevel, role, roleInstruction, expiresAt }),
  });
}

export async function listShareTokens() {
  return fetchAPI('/twin/share/tokens');
}

export async function revokeShareToken(tokenId: string) {
  return fetchAPI(`/twin/share/tokens/${tokenId}`, { method: 'DELETE' });
}

export async function getShareLogs() {
  return fetchAPI('/twin/share/logs');
}

export async function getConnections() {
  return fetchAPI('/twin/share/connections');
}

export async function validateShareToken(token: string) {
  const res = await fetch(`${API_URL}/twin/share/validate/${token}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export async function getSharedTwinProfile(token: string) {
  const res = await fetch(`${API_URL}/twin/share/explore/${token}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export async function* sendSharedTwinMessage(token: string, message: string) {
  const response = await fetch(`${API_URL}/twin/share/explore/${token}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) throw new Error('Failed to connect to shared Twin');

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
        } catch (e) { }
      }
    }
  }
}

export async function endSharedSession(token: string, accessorName: string, duration: number, messageCount: number) {
  const res = await fetch(`${API_URL}/twin/share/explore/${token}/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accessorName, duration, messageCount }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

// =============================================
// PUBLIC TWINS API
// =============================================

export async function getPublicTwinProfile(figureId: string) {
  const res = await fetch(`${API_URL}/twin/public/profile/${figureId}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.data;
}

export async function* sendPublicTwinMessage(figureId: string, message: string) {
  const response = await fetch(`${API_URL}/twin/public/chat/${figureId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) throw new Error('Failed to connect to Public Twin');

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
        } catch (e) { }
      }
    }
  }
}
