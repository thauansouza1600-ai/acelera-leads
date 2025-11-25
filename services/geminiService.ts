import { GoogleGenAI } from "@google/genai";
import { InstagramProfile, SearchFilters } from "../types";

// Initialize Gemini Client
// NOTE: On Vercel, ensure you add API_KEY to your Environment Variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper function to fetch a single batch of profiles using a specific query variation.
 */
async function fetchBatch(searchQuery: string, filters?: SearchFilters): Promise<InstagramProfile[]> {
  try {
    let filterInstruction = "";
    
    if (filters?.minFollowers || filters?.maxFollowers) {
      filterInstruction += `
        FOLLOWER REQUIREMENT: User wants follower count between ${filters.minFollowers || '0'} and ${filters.maxFollowers || 'any'}.
        Prioritize results indicating followers within this range.
      `;
    }

    if (filters?.bioKeyword) {
      filterInstruction += `
        BIO KEYWORD FILTER:
        - The user specifically wants profiles containing: "${filters.bioKeyword}".
        - Prioritize these profiles heavily.
      `;
    }

    // Adjusted prompt for stability and strictly JSON output
    const prompt = `
      Perform a Google Search to find 12 REAL, ACTIVE, and PUBLIC Instagram profiles related to: "${searchQuery}".
      
      GEOLOCATION: BRAZIL ONLY. (Look for Portuguese bios, +55 numbers, BR cities).
      NICHE: Return PROFESSIONAL profiles (service providers, businesses), NOT random people.
      ${filterInstruction}
      
      Extract details into a JSON object:
      - name: Display name.
      - username: Handle without @.
      - bio: Short summary in Portuguese.
      - followers: Extract exact number (e.g. "10k") or ESTIMATE based on context (e.g. "5k" for local pro).
      - profile_pic: URL if found, else null.
      - instagram_url: Full URL.
      - whatsapp: Search snippet/bio for +55 numbers. Format as "https://wa.me/55[DDD][NUMBER]". If none, return null.

      OUTPUT FORMAT:
      Return ONLY a raw JSON array. No markdown code blocks. No explanations.
      Example: [{"name": "...", ...}]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        temperature: 0.1, // Lower temperature for more deterministic JSON
      },
    });

    const text = response.text;
    if (!text) return [];

    // Robust JSON Extraction
    let cleanJson = text.trim();
    // Remove markdown blocks if present
    cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '');
    
    // Find the outer array brackets to ignore any preamble text
    const firstBracket = cleanJson.indexOf('[');
    const lastBracket = cleanJson.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1) {
      cleanJson = cleanJson.substring(firstBracket, lastBracket + 1);
    }

    try {
      const parsedData = JSON.parse(cleanJson);
      
      if (!Array.isArray(parsedData)) return [];

      // Validate structure matches interface
      return parsedData.filter((p: any) => p.name && p.username && p.instagram_url) as InstagramProfile[];
    } catch (parseError) {
      console.warn(`JSON Parse Error for query "${searchQuery}"`, parseError);
      return [];
    }

  } catch (error) {
    console.warn(`Batch failed for query "${searchQuery}":`, error);
    return [];
  }
}

export const searchProfiles = async (keyword: string, filters?: SearchFilters): Promise<InstagramProfile[]> => {
  // Optimization: Reduce concurrent variations to 3 to avoid hitting API Rate Limits (429) on Vercel/Free Tier.
  // We use high-intent search queries.
  
  const bioSuffix = filters?.bioKeyword ? ` "${filters.bioKeyword}"` : "";

  const variations = [
    // 1. General Niche Search
    `site:instagram.com "${keyword}"${bioSuffix} brasil`,
    
    // 2. Commercial Intent (Services/Quotes)
    `"${keyword}" instagram brasil orçamentos contato${bioSuffix}`,
    
    // 3. Authority/Specialist Search
    `"${keyword}" especialista profissional instagram brasil${bioSuffix}`
  ];

  try {
    console.log(`Searching for: ${keyword} with ${variations.length} variations.`);
    
    // Execute batches in parallel
    const batchResults = await Promise.all(
      variations.map(query => fetchBatch(query, filters))
    );

    // Flatten and Deduplicate
    const allProfiles = batchResults.flat();
    const uniqueProfiles = new Map<string, InstagramProfile>();

    allProfiles.forEach(p => {
      if (p.username) {
        let cleanUser = p.username.trim().toLowerCase().replace('@', '');
        
        // Clean URL params if stuck to username
        if (cleanUser.includes('/')) cleanUser = cleanUser.split('/')[0];
        if (cleanUser.includes('?')) cleanUser = cleanUser.split('?')[0];

        // Basic validation
        if (cleanUser.length > 2 && !cleanUser.includes(' ')) {
          p.username = cleanUser;
          if (!uniqueProfiles.has(cleanUser)) {
            uniqueProfiles.set(cleanUser, p);
          }
        }
      }
    });

    const finalResults = Array.from(uniqueProfiles.values());

    if (finalResults.length === 0) {
      throw new Error("Nenhum perfil encontrado. Tente termos mais abrangentes.");
    }

    return finalResults;

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Handle Quota/Rate Limit Errors specifically
    if (error.toString().includes('429') || error.toString().includes('Quota')) {
      throw new Error("Muitas requisições simultâneas. Aguarde um momento e tente novamente.");
    }
    
    throw error;
  }
};