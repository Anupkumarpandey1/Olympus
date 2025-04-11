
import { toast } from "sonner";
import { YoutubeTranscript } from 'youtube-transcript';
import { GEMINI_API_KEY, GEMINI_API_URL, RAPIDAPI_KEY, RAPIDAPI_HOST } from "./config";

export async function getVideoDetails(youtubeUrl: string): Promise<string | null> {
  try {
    if (!youtubeUrl.includes('youtube.com/watch?v=') && !youtubeUrl.includes('youtu.be/')) {
      toast.error('Please enter a valid YouTube URL');
      return null;
    }

    // Extract video ID from URL
    let videoId = '';
    if (youtubeUrl.includes('youtube.com/watch?v=')) {
      const urlObj = new URL(youtubeUrl);
      videoId = urlObj.searchParams.get('v') || '';
    } else if (youtubeUrl.includes('youtu.be/')) {
      videoId = youtubeUrl.split('youtu.be/')[1].split('?')[0];
    }

    if (!videoId) {
      toast.error('Could not extract video ID from URL');
      return null;
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (transcript && transcript.length > 0) {
      const fullText = transcript.map(entry => entry.text).join(' ');
      return fullText;
    } else {
      toast.error('No transcript available for this video');
      return null;
    }
  } catch (error) {
    console.error('Error fetching video details:', error);
    toast.error('Failed to fetch video transcript');
    return null;
  }
}

export async function getVideoSummary(youtubeUrl: string): Promise<string | null> {
  try {
    if (!youtubeUrl.includes('youtube.com/watch?v=') && !youtubeUrl.includes('youtu.be/')) {
      toast.error('Please enter a valid YouTube URL');
      return null;
    }

    // Extract video ID from URL
    let videoId = '';
    if (youtubeUrl.includes('youtube.com/watch?v=')) {
      const urlObj = new URL(youtubeUrl);
      videoId = urlObj.searchParams.get('v') || '';
    } else if (youtubeUrl.includes('youtu.be/')) {
      videoId = youtubeUrl.split('youtu.be/')[1].split('?')[0];
    }

    if (!videoId) {
      toast.error('Could not extract video ID from URL');
      return null;
    }

    console.log("Fetching summary for video ID:", videoId);

    const response = await fetch(`https://${RAPIDAPI_HOST}/api/v1/get-transcript-v2?video_id=${videoId}&platform=youtube`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': RAPIDAPI_HOST
      }
    });

    if (!response.ok) {
      console.error('API error:', response.status, response.statusText);
      throw new Error(`Failed to fetch summary: ${response.status} ${response.statusText}`);
    }

    const data = await response.text();
    console.log("RapidAPI response:", data);
    return data;
  } catch (error) {
    console.error('Error fetching video summary:', error);
    toast.error('Failed to fetch video summary');
    return null;
  }
}

export async function getProcessedSummary(rawApiResponse: string, language: 'english' | 'hindi' | 'hinglish' = 'english'): Promise<string | null> {
  try {
    let transcript = "";
    
    try {
      // Try to parse the API response
      const apiData = JSON.parse(rawApiResponse);
      if (apiData && apiData.transcript) {
        transcript = apiData.transcript;
      } else if (apiData && apiData.summary) {
        return formatSummaryWithGemini(apiData.summary, language);
      } else {
        // If no structured data found, use the raw response
        transcript = rawApiResponse;
      }
    } catch (e) {
      // If parsing fails, use the raw response
      console.error('Error parsing API response:', e);
      transcript = rawApiResponse;
    }

    return formatSummaryWithGemini(transcript, language);
  } catch (error) {
    console.error('Error processing summary:', error);
    toast.error('Failed to process summary');
    return null;
  }
}

async function formatSummaryWithGemini(content: string, language: 'english' | 'hindi' | 'hinglish' = 'english'): Promise<string | null> {
  try {
    let languageInstructions = '';
    if (language === 'hindi') {
      languageInstructions = 'Translate and format the summary in Hindi language.';
    } else if (language === 'hinglish') {
      languageInstructions = 'Translate and format the summary in Hinglish language (mix of Hindi and English words, like "kya kar rhe ho" instead of pure Hindi). Use Roman script with Hindi words rather than Devanagari script.';
    }

    const prompt = `The following is content from a YouTube video transcript or summary. 
    Format it into a well-structured, easy-to-read summary:

    "${content}"

    Format the response with:
    - CAPITALIZED WORDS for main headings
    - CAPITALIZED PHRASES WITH COLON: for subheadings
    - Use bullet points (* or -) for lists where appropriate
    - Use numbered points (1., 2., etc.) for sequential information
    - Use **double asterisks** for important concepts
    - Leave blank lines between paragraphs and sections
    
    ${languageInstructions}
    
    The response should be educational and clearly formatted.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048
        }
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const formattedContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!formattedContent) {
      throw new Error('No content returned from API');
    }

    return formattedContent;
  } catch (error) {
    console.error('Error formatting summary:', error);
    return null;
  }
}
