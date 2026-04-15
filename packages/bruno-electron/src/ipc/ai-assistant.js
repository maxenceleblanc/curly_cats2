const { ipcMain } = require('electron');
const axios = require('axios');
const { preferencesUtil } = require('../store/preferences');
const { getCachedSystemProxy } = require('../store/system-proxy');
const { setupProxyAgents } = require('../utils/proxy-util');

const SYSTEM_PREFIX
  = 'J\'utilise l\'outil de test API Bruno et je souhaite que tu m\'assistes dans ce cadre, voici ma demande :';

const DEBUG = process.env.CURLY_AI_DEBUG === '1';

function dbg(label, data) {
  if (!DEBUG) return;
  console.log(`\n[AI DEBUG] ${label}`);
  console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

/**
 * Resolve proxy mode + config from global preferences (same logic as cert-utils.js).
 */
async function getGlobalProxySettings() {
  const globalProxy = preferencesUtil.getGlobalProxyConfig();
  const globalDisabled = (globalProxy?.disabled) ?? false;
  const globalProxySource = globalProxy?.source ?? 'manual';

  if (globalDisabled) {
    return { proxyMode: 'off', proxyConfig: {}, proxyModeReason: 'App-level proxy is disabled' };
  }

  if (globalProxySource === 'pac') {
    return { proxyMode: 'pac', proxyConfig: { pac: globalProxy.pac ?? {} }, proxyModeReason: '' };
  }

  if (globalProxySource === 'inherit') {
    const systemProxy = await getCachedSystemProxy();
    return {
      proxyMode: 'system',
      proxyConfig: systemProxy || { http_proxy: null, https_proxy: null, no_proxy: null },
      proxyModeReason: ''
    };
  }

  // source === 'manual'
  return { proxyMode: 'on', proxyConfig: globalProxy?.config ?? {}, proxyModeReason: '' };
}

/**
 * Build httpsAgent / httpAgent for a given URL using the app's proxy + SSL preferences.
 * Returns an object { httpAgent?, httpsAgent? } ready to spread into axios config.
 */
async function buildAgentsForUrl(url) {
  const rejectUnauthorized = preferencesUtil.shouldVerifyTls();
  const httpsAgentRequestFields = { keepAlive: true, rejectUnauthorized };

  const { proxyMode, proxyConfig, proxyModeReason } = await getGlobalProxySettings();

  dbg('Proxy settings', { proxyMode, proxyModeReason, proxyConfig });

  const requestConfig = { url };

  await setupProxyAgents({
    requestConfig,
    proxyMode,
    proxyModeReason,
    proxyConfig,
    httpsAgentRequestFields,
    interpolationOptions: {}
  });

  const agents = {};
  if (requestConfig.httpsAgent) agents.httpsAgent = requestConfig.httpsAgent;
  if (requestConfig.httpAgent) agents.httpAgent = requestConfig.httpAgent;
  return agents;
}

async function fetchToken() {
  const xcoUrl = process.env.CURLY_XCO_URL;
  const clientId = process.env.CURLY_XCO_CLIENT_ID;
  const clientSecret = process.env.CURLY_XCO_CLIENT_SECRET;

  if (!xcoUrl || !clientId || !clientSecret) {
    throw new Error('Variables CURLY_XCO_URL, CURLY_XCO_CLIENT_ID et CURLY_XCO_CLIENT_SECRET requises.');
  }

  dbg('IDP configuration', { url: xcoUrl, protocol: new URL(xcoUrl).protocol });

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const body = 'grant_type=client_credentials&scope=openid';

  dbg('IDP request', {
    url: xcoUrl,
    method: 'POST',
    headers: { 'Authorization': 'Basic <hidden>', 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });

  const agents = await buildAgentsForUrl(xcoUrl);

  let response;
  try {
    response = await axios.post(xcoUrl, body, {
      ...agents,
      proxy: false,
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      validateStatus: () => true
    });
  } catch (err) {
    dbg('IDP network error', {
      message: err?.message,
      code: err?.code,
      errno: err?.errno
    });
    throw new Error(`IDP erreur réseau : ${err?.message}`);
  }

  dbg('IDP raw response', { status: response.status, statusText: response.statusText, dataLength: response.data?.length });

  if (response.status !== 200) {
    dbg('IDP HTTP error', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    throw new Error(`IDP ${response.status} : ${JSON.stringify(response.data ?? response.statusText)}`);
  }

  dbg('IDP response', { status: response.status, data: response.data });

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

    dbg('LLM request', {
      url: apiUrl,
      method: 'POST',
      headers: { 'Authorization': 'Bearer <token>', 'Content-Type': 'application/json' },
      body: requestBody
    });

    try {
      const agents = await buildAgentsForUrl(apiUrl);

      console.log('[AI] Sending LLM request to:', apiUrl);
      const response = await axios.post(apiUrl, requestBody, {
        ...agents,
        proxy: false,
        responseType: 'stream',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        validateStatus: () => true
      });

      console.log('[AI] LLM response received - Status:', response.status);

      dbg('LLM response headers', { status: response.status, headers: response.headers });

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
      dbg('LLM HTTP error', {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        message: err?.message,
        code: err?.code
      });
      const msg = err?.response?.data?.error?.message || err?.message || 'Erreur inconnue.';
      event.sender.send('ai-response-error', msg);
    }
  });
};

module.exports = { registerAiAssistantIpc };
