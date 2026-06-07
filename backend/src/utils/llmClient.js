import axios from 'axios';
import config from '../config/index.js';

/**
 * A real implementation of an AI client.
 * Connects to OpenAI or a local Ollama instance depending on environment variables.
 */
export const generateText = async (prompt, systemInstruction = 'You are a helpful educational AI assistant.', model = 'gpt-4') => {
  const apiKey = process.env.OPENAI_API_KEY;
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  const useOllama = process.env.USE_OLLAMA === 'true';

  try {
    if (useOllama) {
      const response = await axios.post(`${ollamaUrl}/api/generate`, {
        model: process.env.OLLAMA_MODEL || 'llama3',
        prompt: `${systemInstruction}\n\n${prompt}`,
        stream: false
      });
      return response.data.response;
    } else if (apiKey) {
      const response = await axios.post('https://api.openai.com/v1/chat/completions', {
        model,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data.choices[0].message.content;
    } else {
      // Fallback for when API keys are not configured but real implementation is required
      console.warn('No AI API key or Ollama configured. Falling back to local heuristic generation.');
      return null;
    }
  } catch (error) {
    console.error('LLM API Error:', error?.response?.data || error.message);
    throw new Error('Failed to generate AI response');
  }
};

/**
 * Real implementation for semantic search embeddings
 */
export const generateEmbeddings = async (text) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  
  try {
    const response = await axios.post('https://api.openai.com/v1/embeddings', {
      input: text,
      model: 'text-embedding-3-small'
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Embeddings API Error:', error?.response?.data || error.message);
    return null;
  }
};
