const { ipcMain } = require('electron');
const axios = require('axios');

const SYSTEM_PREFIX
  = 'J\'utilise l\'outil de test API Bruno et je souhaite que tu m\'assistes dans ce cadre, voici ma demande :';

const DEBUG = process.env.CURLY_AI_DEBUG === '1';

function dbg(label, data) {
  if (!DEBUG) return;
  console.log(`\n[AI DEBUG] ${label}`);
  console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

async function fetchToken() {
  const xcoUrl = process.env.CURLY_XCO_URL;
  const clientId = process.env.CURLY_XCO_CLIENT_ID;
  const clientSecret = process.env.CURLY_XCO_CLIENT_SECRET;

  if (!xcoUrl || !clientId || !clientSecret) {
    throw new Error('Variables CURLY_XCO_URL, CURLY_XCO_CLIENT_ID et CURLY_XCO_CLIENT_SECRET requises.');
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = 'grant_type=client_credentials&scope=openid';

  dbg('IDP — requête', {
    url: xcoUrl,
    method: 'POST',
    headers: { 'Authorization': 'Basic <masqué>', 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  let response;
  try {
    response = await axios.post(xcoUrl, body, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  } catch (err) {
    dbg('IDP — erreur HTTP', {
      status: err?.response?.status,
      statusText: err?.response?.statusText,
      data: err?.response?.data
    });
    throw new Error(`IDP ${err?.response?.status ?? ''} : ${JSON.stringify(err?.response?.data ?? err?.message)}`);
  }

  dbg('IDP — réponse', { status: response.status, data: response.data });

  const token = response.data?.access_token || response.data?.token;
  if (!token || typeof token !== 'string') {
    throw new Error('Token introuvable dans la réponse de l\'API d\'authentification.');
  }

  return token;
}

const registerAiAssistantIpc = () => {
  ipcMain.handle('send-ai-message', async (event, { messages, context }) => {
    const apiUrl = process.env.CURLY_AI_API_URL;
    const model = process.env.CURLY_AI_MODEL_SUBSCRIPTION_ID || 'gpt-4o';

    if (!apiUrl) {
      event.sender.send('ai-response-error', 'CURLY_AI_API_URL non configurée.');
      return;
    }

    // Retrieve token from IDP before calling the AI API
    let token;
    try {
      token = await fetchToken();
    } catch (err) {
      event.sender.send('ai-response-error', `Échec de l'authentification : ${err.message}`);
      return;
    }

    // Build context block appended to the last user message
    let contextBlock = '';
    if (context?.url) {
      contextBlock += `\n\n---\nContexte de la requête Bruno :\n- Méthode : ${context.method}\n- URL : ${context.url}`;
      if (context.status != null) {
        contextBlock += `\n- Statut de la réponse : ${context.status}`;
      }
      if (context.responseData) {
        contextBlock += `\n- Corps de la réponse :\n${context.responseData}`;
      }
      contextBlock += '\n---';
    }

    // Prepend system prefix to first user message
    const enrichedMessages = messages.map((msg, i) => {
      if (i === 0 && msg.role === 'user') {
        return { role: 'user', content: `${SYSTEM_PREFIX}\n\n${msg.content}` };
      }
      return msg;
    });

    // Append context to last user message
    const withContext = enrichedMessages.map((msg, i) => {
      if (i === enrichedMessages.length - 1 && msg.role === 'user' && contextBlock) {
        return { role: 'user', content: msg.content + contextBlock };
      }
      return msg;
    });

    const requestBody = { model, messages: withContext, stream: true };

    dbg('LLM — requête', {
      url: apiUrl,
      method: 'POST',
      headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
      body: requestBody
    });

    try {
      const response = await axios.post(apiUrl, requestBody, {
        responseType: 'stream',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      dbg('LLM — réponse headers', { status: response.status, headers: response.headers });

      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n').filter((l) => l.trim());
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.replace(/^data:\s*/, '');
          if (raw === '[DONE]') continue;
          try {
            const json = JSON.parse(raw);
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              event.sender.send('ai-response-chunk', content);
            }
          } catch {
            // ignore malformed chunks
          }
        }
      });

      response.data.on('end', () => {
        event.sender.send('ai-response-end');
      });

      response.data.on('error', (err) => {
        event.sender.send('ai-response-error', err.message);
      });
    } catch (err) {
      dbg('LLM — erreur HTTP', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data
      });
      const msg = err?.response?.data?.error?.message || err?.message || 'Erreur inconnue.';
      event.sender.send('ai-response-error', msg);
    }
  });
};

module.exports = { registerAiAssistantIpc };
