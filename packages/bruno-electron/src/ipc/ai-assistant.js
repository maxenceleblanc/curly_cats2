const { ipcMain } = require('electron');
const axios = require('axios');

const SYSTEM_PREFIX
  = 'J\'utilise l\'outil de test API Bruno et je souhaite que tu m\'assistes dans ce cadre, voici ma demande :';

const registerAiAssistantIpc = () => {
  ipcMain.handle('send-ai-message', async (event, { messages, context }) => {
    const apiUrl = process.env.BRUNO_AI_API_URL;
    const apiKey = process.env.BRUNO_AI_API_KEY;
    const model = process.env.BRUNO_AI_MODEL || 'gpt-4o';

    if (!apiUrl) {
      event.sender.send('ai-response-error', 'BRUNO_AI_API_URL non configurée.');
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

    try {
      const response = await axios.post(
        apiUrl,
        { model, messages: withContext, stream: true },
        {
          responseType: 'stream',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {})
          }
        }
      );

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
      const msg = err?.response?.data?.error?.message || err?.message || 'Erreur inconnue.';
      event.sender.send('ai-response-error', msg);
    }
  });
};

module.exports = { registerAiAssistantIpc };
