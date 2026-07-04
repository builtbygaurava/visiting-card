import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const POST: RequestHandler = async ({ request }) => {
  const { prompt } = await request.json();

  if (!prompt || prompt.trim().length === 0) {
    return json({ error: 'Prompt is required' }, { status: 400 });
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const fullPrompt = `Generate a business card design as JSON for: "${prompt}".
Return ONLY valid JSON, no markdown, no code fences, with this structure:
{
  "name": "string",
  "title": "string",
  "company": "string",
  "tagline": "string",
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "font": "string",
  "layoutStyle": "string"
}`;

  try {
    const result = await model.generateContent(fullPrompt);
    let text = result.response.text();

    // Sometimes Gemini wraps JSON in markdown fences, strip them if present
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const cardData = JSON.parse(text);
    return json(cardData);
  } catch (err) {
    console.error('Gemini error:', err);
    return json({ error: 'Failed to generate card' }, { status: 500 });
  }
};