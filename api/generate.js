import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다.' });
    }

    // 요청으로 들어온 데이터가 무엇이든 간에 무조건 문자열화해서 프롬프트로 사용합니다.
    let userPrompt = '';
    
    if (typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        userPrompt = parsed.prompt || parsed.message || parsed.text || req.body;
      } catch (e) {
        userPrompt = req.body;
      }
    } else if (req.body && typeof req.body === 'object') {
      userPrompt = req.body.prompt || req.body.message || req.body.text || JSON.stringify(req.body);
    }

    if (!userPrompt || userPrompt.trim() === '') {
      // 프롬프트가 끝내 안 들어오면 기본 루틴 생성 요청으로 대체하여 에러를 원천 차단합니다.
      userPrompt = "헬스 루틴을 추천해줘. 4분할 루틴으로 짜줘.";
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    const result = await model.generateContent(String(userPrompt));
    const response = await result.response;
    const text = response.text();

    return res.status(200).json({ text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    return res.status(500).json({ error: error.message || '서버 내부 오류가 발생했습니다.' });
  }
}
