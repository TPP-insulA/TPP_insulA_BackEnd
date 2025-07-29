import { Request, Response } from 'express';
import { prisma } from '../app';
import { asyncHandler } from '../middleware/error.middleware';

// Gemini API Chat Handler
export const chatWithAI = asyncHandler(async (req: Request, res: Response) => {
  let { contents } = req.body;
  console.log('[Chat] Received contents:', contents);
  if (!Array.isArray(contents) || contents.length === 0) {
    return res.status(400).json({ error: 'contents debe ser un array.' });
  }
  // Permitir ambos formatos: [{parts:[{text:...}]}] o [string]
  let prompt = '';
  if (typeof contents[0] === 'string') {
    prompt = contents.join('\n');
  } else if (typeof contents[0] === 'object' && Array.isArray(contents[0].parts)) {
    // Unir todos los texts de todos los parts de todos los objetos
    prompt = contents.map((c: { parts: { text: string }[] }) => c.parts?.map((p: { text: string }) => p.text).join(' ')).join('\n');
  } else {
    return res.status(400).json({ error: 'Formato de contents no soportado.' });
  }
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada en el entorno.' });
  }
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ]
        }),
      }
    );
    const json: any = await response.json();
    const answer = json.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI';
    console.log('[Chat] Gemini API answer:', answer);
    return res.json(json);
  } catch (err) {
    console.error('[Chat] Gemini API error:', err);
    return res.status(500).json({ error: 'Hubo un error al conectar con el asistente. Intenta más tarde.' });
  }
});

export const getDashboardData = asyncHandler(async (req: Request, res: Response) => {
  // Parse startDate and endDate from query
  const { startDate, endDate } = req.query;

  // Build where clause for glucose readings
  const glucoseWhere: any = { userId: req.user.id };
  if (startDate || endDate) {
    glucoseWhere.timestamp = {};
    if (startDate) glucoseWhere.timestamp.gte = new Date(startDate as string);
    if (endDate) glucoseWhere.timestamp.lte = new Date(endDate as string);
  }

  // Get glucose readings (filtered by date if provided)
  const glucoseReadings = await prisma.glucoseReading.findMany({
    where: glucoseWhere,
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  // Get user profile
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
  });

  // Get activities
  const activities = await prisma.activity.findMany({
    where: { userId: req.user.id },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  // Get insulin prediction history
  const predictionHistory = await prisma.insulinPrediction.findMany({
    where: { userId: req.user.id },
    orderBy: { date: 'desc' },
  });

  res.json({
    glucoseReadings,
    userProfile: user,
    activities,
    predictions: predictionHistory,
  });
});
