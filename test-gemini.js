import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ No API key found. Check your .env file.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const prompt = `Generate a business card design as JSON for: "Modern minimalist business card for a software consultant."
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

async function run() {
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('✅ Gemini responded:\n');
    console.log(text);
  } catch (err) {
    console.error('❌ Error calling Gemini:', err.message);
  }
}

run();