import { GoogleGenAI } from "@google/genai";
import { InstagramProfile, SearchFilters } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper function to fetch a single batch of profiles using a specific query variation.
 */
async function fetchBatch(searchQuery: string, filters?: SearchFilters): Promise<InstagramProfile[]> {
  try {
    let filterInstruction = "";
    
    if (filters?.minFollowers || filters?.maxFollowers) {
      filterInstruction += `
        FOLLOWER REQUIREMENT: The user wants profiles with a follower count range between ${filters.minFollowers || '0'} and ${filters.maxFollowers || 'any'}.
        Prioritize search results that indicate follower counts within this range (e.g. "5k followers", "10.5k followers").
      `;
    }

    if (filters?.bioKeyword) {
      filterInstruction += `
        BIO KEYWORD FILTER:
        - The user explicitly wants profiles that contain the word/phrase "${filters.bioKeyword}" in their bio or description.
        - CRITICAL: Prioritize returning profiles that mention "${filters.bioKeyword}".
      `;
    }

    // We ask for ~15 profiles per batch to ensure we hit the total target after deduplication.
    const prompt = `
      Perform a Google Search to find 12 to 15 REAL, ACTIVE, and PUBLIC Instagram profiles related to: "${searchQuery}".
      
      GEOLOCATION STRICT FILTER:
      - RETURN ONLY PROFILES FROM BRAZIL.
      - Look for: Portuguese text in bio, Brazilian cities (São Paulo, Rio, Curitiba, etc.), or +55 phone codes.
      - DISCARD any profile that appears to be from outside Brazil.

      NICHE & RELEVANCE ENFORCEMENT:
      - The user is looking for specific "clients" or "professionals" in the niche defined by the keyword.
      - STRICTLY FILTER results to match this niche.
      - If searching for a profession (e.g., "Manicure", "Advogado"), return service providers/professionals, NOT students, fan pages, or personal blogs just discussing the topic.
      - If searching for a business (e.g., "Pet Shop", "Hamburgueria"), return actual business profiles.
      - EXCLUDE: Aggregator pages, meme pages, or profiles that just randomly mention the keyword without being part of the niche.

      ${filterInstruction}
      
      For each profile found, extract the following details into a JSON object:
      - name: The display name (e.g., "João Silva | Tatuador").
      - username: The handle without @ (e.g., "joaosilva_tattoo").
      - bio: A short summary of their bio (Must be in Portuguese if the profile is Brazilian).
      - followers: SEARCH for "X followers" in the snippet. If found, use it (e.g. "12.5k", "1M"). If NOT explicitly found, YOU MUST ESTIMATE a realistic number string based on the profile's niche authority and context found (e.g., "Celebrity/Influencer" -> "500k", "Established Pro" -> "20k", "Local Business" -> "3k"). Do NOT return null.
      - profile_pic: A URL to their image if found, otherwise null.
      - instagram_url: The full URL to their profile.
      - whatsapp: CRITICAL - SEARCH DIRECTLY IN THE BIO TEXT/SNIPPET. 
        1. Look for Brazilian mobile phone patterns like: "(XX) 9XXXX-XXXX", "XX 9XXXX-XXXX", "XX 9XXXXXXXX", "11999999999".
        2. Look for keywords like "Orçamentos", "Agendamento", "Whats", "Zap", "Pedidos".
        3. If a number is found, CLEAN IT (remove non-digits) and format strictly as "https://wa.me/55[DDD][NUMBER]" (e.g., https://wa.me/5511999998888).
        4. If a "wa.me" or "bit.ly" link is present in the snippet, use it.
        5. If NO number/link is found in the text, return null.

      RETURN format: A raw JSON array of objects. Do not wrap in markdown code blocks. Just the raw JSON string.
      RETURN ONLY THE JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text;

    if (!text) return [];

    // Clean up response for JSON parsing
    let cleanJson = text.trim();
    cleanJson = cleanJson.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    
    const arrayStart = cleanJson.indexOf('[');
    const arrayEnd = cleanJson.lastIndexOf(']');
    
    if (arrayStart !== -1 && arrayEnd !== -1) {
      cleanJson = cleanJson.substring(arrayStart, arrayEnd + 1);
    }

    try {
      const parsedData: InstagramProfile[] = JSON.parse(cleanJson);
      return Array.isArray(parsedData) ? parsedData : [];
    } catch (parseError) {
      console.warn(`JSON Parse Error for query "${searchQuery}":`, parseError);
      return [];
    }

  } catch (error) {
    console.warn(`Batch failed for query "${searchQuery}":`, error);
    return [];
  }
}

export const searchProfiles = async (keyword: string, filters?: SearchFilters): Promise<InstagramProfile[]> => {
  // To reach a minimum of 50 profiles, we generate multiple search variations
  // and run them in parallel. 
  // ADDED: Niche-specific search variations to improve relevance.
  
  // Refinement: If a bio keyword is present, append it to some queries to enforce it in search results
  const bioSuffix = filters?.bioKeyword ? ` "${filters.bioKeyword}"` : "";

  const variations = [
    `site:instagram.com "${keyword}"${bioSuffix} brasil`,
    `site:instagram.com "${keyword}" "são paulo" OR "rio de janeiro" serviços${bioSuffix}`, // "serviços" ensures professional intent
    `"${keyword}" instagram brasil contato orçamentos${bioSuffix}`, // Focused on profiles with contact info (leads)
    `melhores "${keyword}" instagram brasil${bioSuffix}`,
    `"${keyword}" profissional instagram brasil${bioSuffix}`,
    `"${keyword}" especialista instagram brasil${bioSuffix}`,
    `"${keyword}" agenda aberta instagram brasil${bioSuffix}`, // High intent service providers
    `estúdio ou clínica "${keyword}" instagram brasil${bioSuffix}` // Catches physical businesses
  ];

  try {
    console.log(`Starting massive search for: ${keyword} in Brazil with ${variations.length} variations. Filters:`, filters);
    
    // Execute all batches in parallel
    const batchResults = await Promise.all(
      variations.map(query => fetchBatch(query, filters))
    );

    // Flatten results
    const allProfiles = batchResults.flat();

    // Deduplicate logic
    const uniqueProfiles = new Map<string, InstagramProfile>();

    allProfiles.forEach(p => {
      if (p.username) {
        // Normalize username
        let cleanUser = p.username.trim().toLowerCase();
        cleanUser = cleanUser.replace('@', '');
        
        // Extract username from URL if necessary
        if (cleanUser.includes('instagram.com/')) {
          const parts = cleanUser.split('instagram.com/');
          if (parts[1]) cleanUser = parts[1].replace(/\/$/, '');
        }

        // Basic validation to ensure it looks like a username
        if (cleanUser.length > 1 && !cleanUser.includes(' ')) {
          // Store clean username back to object
          p.username = cleanUser;
          
          if (!uniqueProfiles.has(cleanUser)) {
            uniqueProfiles.set(cleanUser, p);
          }
        }
      }
    });

    const finalResults = Array.from(uniqueProfiles.values());

    if (finalResults.length === 0) {
      throw new Error("Não foram encontrados perfis suficientes no Brasil para este nicho. Tente especificar melhor o nicho (ex: 'Tatuador Realista' em vez de apenas 'Tatuador') ou remover filtros muito restritivos.");
    }

    return finalResults;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};