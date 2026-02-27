const { callGemini } = require('../services/aiService');

async function chat(req, res) {
  try {
    const { message, context } = req.body;

    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const systemPrompt = 'You are a helpful solar advisor for non-technical users. Explain solar terms simply, provide practical guidance, and include a short note to verify final subsidy/cost details with official portals and installers.';

    const fullPrompt = context
      ? `Context: ${JSON.stringify(context)}\n\nUser question: ${message}`
      : `User question: ${message}`;

    const aiResponse = await callGemini(`${systemPrompt}\n\n${fullPrompt}`);

    if (!aiResponse) {
      return res.json({
        response: 'I can explain solar sizing, kW meaning, ROI, and smart appliance timing in plain language. Add GEMINI_API_KEY for real-time AI responses. Please verify final costs/subsidies with official portals.'
      });
    }

    return res.json({ response: aiResponse });
  } catch (error) {
    console.error('Error with Gemini API:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to get AI response' });
  }
}

module.exports = { chat };
