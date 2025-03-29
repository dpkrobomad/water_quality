import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini client
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

interface WaterQualityData {
  ph: number | null;
  tds: number | null;
  phosphate: number | null;
  level: number | null;
}

export async function generateWaterQualityAnalysis(data: WaterQualityData): Promise<string> {
  try {
    // Only proceed if we have a valid API key
    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error("Gemini API key not found in environment variables");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `You are a water quality analysis system. Analyze the following water parameters and provide your response as a clean JSON object (no markdown, no code blocks, just the JSON):

pH: ${data.ph?.toFixed(2) ?? 'Not available'} pH
TDS: ${data.tds?.toFixed(2) ?? 'Not available'} ppm
Phosphate: ${data.phosphate?.toFixed(2) ?? 'Not available'} mg/L
Water Level: ${data.level?.toFixed(2) ?? 'Not available'}%

Provide your analysis in this exact JSON structure:

{
  "summary": "2-3 sentences summarizing overall water quality, key concerns, and general system status",
  "parameters": {
    "ph": {
      "reading": "value pH",
      "analysis": {
        "waterPurity": "analysis of water purity and safety",
        "componentImpact": "impact on components",
        "effectiveness": "purification effectiveness",
        "adjustments": "required adjustments"
      }
    },
    "tds": {
      "reading": "value ppm",
      "analysis": {
        "filtrationEfficiency": "filtration efficiency analysis",
        "filterCondition": "filter condition assessment",
        "waterQuality": "water quality analysis",
        "systemPerformance": "system performance evaluation"
      }
    },
    "phosphate": {
      "reading": "value mg/L",
      "analysis": {
        "contamination": "contamination assessment",
        "effectiveness": "removal effectiveness",
        "maintenance": "maintenance needs",
        "impact": "quality impact"
      }
    },
    // "waterLevel": {
    //   "reading": "value%",
    //   "analysis": {
    //     "tankStatus": "tank capacity status",
    //     "efficiency": "cycle efficiency",
    //     "pressure": "pressure and flow analysis",
    //     "refill": "refill assessment"
    //   }
    // }
  },
  "recommendations": [
    {
      "priority": "high/medium/low",
      "action": "specific action",
      "reason": "reason for action"
    }
  ],
  "safetyNotes": {
    "immediateActions": ["action1", "action2"],
    "consumptionGuidelines": "guidelines",
  }
}

Guidelines:
- Summary should highlight the most important findings and overall water quality status
- pH: 6.5-8.5 is safe
- TDS: <300 ppm is optimal
- Phosphate: <0.5 mg/L is normal

Return only the JSON object, no other text or formatting.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating analysis:', error);
    return "Unable to generate analysis at this time. Please try again later.";
  }
} 