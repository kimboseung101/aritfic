import { GoogleGenAI } from '@google/genai';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not set.' });
        }

        const ai = new GoogleGenAI({ apiKey: apiKey });
        const { type, data, image, mimeType } = req.body;

        if (type === 'routine') {
            const { height, weight, age, gender, level, part } = data;
            const prompt = `사용자 프로필: 키 ${height}cm, 몸무게 ${weight}kg, 나이 ${age}세, 성별 ${gender}, 운동 난이도 ${level}, 타겟 부위 ${part}.
이 조건에 맞는 구체적인 ${part} 집중 공략 헬스 루틴을 3~4가지 운동으로 짜주세요.
각 운동마다 정확한 기구 또는 운동 명칭, 세트 수와 횟수, 그리고 옆에 따라하기 쉽도록 상세한 수행 방법을 친절하게 설명해주세요.`;

            const response = await ai.models.generateContent({
                model: 'gemini-3.1-flash-lite',
                contents: prompt
            });

            return res.status(200).json({ text: response.text });
        } 
        else if (type === 'scan') {
            if (!image || !mimeType) {
                return res.status(400).json({ error: 'Image data and mimeType are required for scanning.' });
            }

            const imagePart = {
                inlineData: {
                    data: image,
                    mimeType: mimeType
                }
            };

            const prompt = `이 사진은 헬스장 기구입니다. 이 기구가 어떤 기구인지 식별하고 아래 JSON 포맷으로만 답변해주세요.
{
  "name": "기구 명칭 (예: 랫 풀다운 머신)",
  "usage": "상세한 사용법 설명",
  "caution": "주의사항 및 부상 방지 팁"
}`;

            const response = await ai.models.generateContent({
                model: 'gemini-3.1-flash-lite',
                contents: [prompt, imagePart]
            });

            let text = response.text;
            // Clean markdown code blocks if present
            text = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonResult = JSON.parse(text);

            return res.status(200).json(jsonResult);
        } else {
            return res.status(400).json({ error: 'Invalid request type' });
        }

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
