import { GoogleGenAI } from "@google/genai";
import { GameStats } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const generateBattleReport = async (stats: GameStats): Promise<string> => {
  const client = getClient();
  if (!client) {
    return "API Key bulunamadı. Savaş raporu oluşturulamıyor.";
  }

  const prompt = `
    Kullanıcı az önce bir zombi hayatta kalma oyunu oynadı ve öldü.
    Ona alaycı, esprili veya aşırı dramatik bir askeri "Ölüm Raporu" veya "Otopsi Raporu" yaz.
    
    İstatistikler:
    - Hayatta Kalma Süresi: ${stats.timeSurvived.toFixed(1)} saniye
    - Öldürülen Zombi: ${stats.kills}
    - Atılan Mermi: ${stats.shotsFired}
    - İsabet Oranı: ${Math.floor(stats.accuracy * 100)}%
    - Alınan Hasar: ${stats.damageTaken}

    Rapor kısa, vurucu ve eğlenceli olsun. Markdown formatı kullanma, sadece düz metin.
    Dili Türkçe kullan.
  `;

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Rapor oluşturulamadı.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "İletişim hatası. Zombiler raporu yedi.";
  }
};