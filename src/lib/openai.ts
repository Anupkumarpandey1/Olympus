
export async function getTeacherResponse(message: string): Promise<string | null> {
  try {
    const systemPrompt = `You are an expert teacher. Your job is to provide helpful, accurate, and engaging responses to student questions. Keep your answers concise and easy to understand.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API Error Response:", errorText);
      throw new Error(`API call failed with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("OpenAI API Response Data:", data);
    
    if (data.error) {
      console.error("OpenAI API Error:", data.error);
      return null;
    }
    
    if (!data.choices || data.choices.length === 0) {
      console.error("No choices in response");
      return null;
    }

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error getting teacher response:", error);
    return null;
  }
}

export interface QuizData {
  questions: QuizQuestion[];
  title?: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  topic?: string;
}

export interface QuizQuestion {
  question: string;
  options: {
    text: string;
    correct: boolean;
    explanation: string;
  }[];
}

// Function to extract content from YouTube videos
export async function extractFromYouTube(youtubeUrl: string): Promise<string | null> {
  try {
    // Import the YouTube transcript functions from youtube.ts
    const { getVideoDetails } = await import('@/lib/youtube');
    return await getVideoDetails(youtubeUrl);
  } catch (error) {
    console.error("Error extracting from YouTube:", error);
    return null;
  }
}

// Function to get a summary from YouTube
export async function getSummaryFromYouTube(youtubeUrl: string): Promise<string | null> {
  try {
    // Import the YouTube summary functions from youtube.ts
    const { getVideoSummary } = await import('@/lib/youtube');
    return await getVideoSummary(youtubeUrl);
  } catch (error) {
    console.error("Error getting summary from YouTube:", error);
    return null;
  }
}

// Function to process YouTube summary
export async function getProcessedSummaryFromYouTube(rawSummary: string, language: 'english' | 'hindi' | 'hinglish' = 'english'): Promise<string | null> {
  try {
    // Import the YouTube processed summary function from youtube.ts
    const { getProcessedSummary } = await import('@/lib/youtube');
    return await getProcessedSummary(rawSummary, language);
  } catch (error) {
    console.error("Error processing YouTube summary:", error);
    return null;
  }
}

// Function to analyze image with Gemini API
export async function analyzeImageWithGemini(imageBase64: string, language: 'english' | 'hindi' | 'hinglish' = 'english'): Promise<string | null> {
  try {
    // This is a placeholder for Gemini API calls
    // In a real implementation, this would call Google's Gemini API with the image
    console.log("Analyzing image with Gemini API...");
    
    // Simulate API call
    return `This is an image analysis placeholder. In a real implementation, this would be the text extracted from the image using Google's Gemini API in ${language} language.`;
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    return null;
  }
}

// Function to process extracted text
export async function processExtractedText(extractedText: string, language: 'english' | 'hindi' | 'hinglish' = 'english'): Promise<string | null> {
  try {
    // This is a placeholder for text processing
    console.log("Processing extracted text...");
    
    // Simulate processing
    return `Processed text: ${extractedText} (Language: ${language})`;
  } catch (error) {
    console.error("Error processing extracted text:", error);
    return null;
  }
}

export async function generateQuiz(
  prompt: string, 
  numQuestions: number = 5, 
  numOptions: number = 4,
  difficultyOrLanguage: 'easy' | 'medium' | 'hard' | 'english' | 'hindi' | 'hinglish' = 'medium'
): Promise<QuizData | null> {
  try {
    // Determine if the parameter is a difficulty level or a language
    const isDifficulty = ['easy', 'medium', 'hard'].includes(difficultyOrLanguage);
    const difficulty = isDifficulty ? difficultyOrLanguage as 'easy' | 'medium' | 'hard' : 'medium';
    const language = !isDifficulty ? difficultyOrLanguage : 'english';
    
    // Adjust the system prompt based on language
    let languageInstruction = '';
    if (language === 'hindi') {
      languageInstruction = 'Generate the quiz in Hindi language.';
    } else if (language === 'hinglish') {
      languageInstruction = 'Generate the quiz in Hinglish (mix of Hindi and English).';
    }

    console.log("Generating quiz with prompt:", prompt);
    console.log("Using difficulty:", difficulty);
    console.log("Using language:", language);

    // Build the prompt for Gemini API
    const geminiPrompt = `You are an expert AI Quiz Generator. Create a quiz based on the following topic or content: "${prompt}". 
    
    The quiz should be ${difficulty} difficulty level with ${numQuestions} multiple-choice questions, each having ${numOptions} answer options. For each question:
      
    1. Only ONE option should be correct
    2. Provide clear explanations for why the correct answer is right
    3. Make wrong answers plausible but clearly incorrect
    4. Format your response as a valid JSON object with this structure:
    {
      "questions": [
        {
          "question": "Question text goes here?",
          "options": [
            {"text": "First option", "correct": false, "explanation": ""},
            {"text": "Second option", "correct": true, "explanation": "Detailed explanation why this is correct"},
            {"text": "Third option", "correct": false, "explanation": ""},
            {"text": "Fourth option", "correct": false, "explanation": ""}
          ]
        }
        // More questions...
      ]
    }
    
    ${languageInstruction}
    
    The explanations should only be provided for correct answers. Make sure all JSON is properly formatted with no errors.`;

    // Using Gemini API to generate the quiz
    const response = await fetch(`${import.meta.env.VITE_GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'}?key=${import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyAkufDKqoXYUuYupmKxeJ3z36p4Y0Wwr04'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: geminiPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2500,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error Response:", errorText);
      throw new Error(`API call failed with status: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Gemini API Response Data:", data);
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error("No candidates in response");
      return null;
    }
    
    const content = data.candidates[0].content.parts[0].text;
    console.log("Raw content:", content);
    
    try {
      // Parse the JSON string to extract the quiz object
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        console.error("Could not find valid JSON in response");
        return null;
      }
      
      const jsonString = content.substring(jsonStart, jsonEnd);
      
      const quiz = JSON.parse(jsonString);
      console.log("Parsed quiz data:", quiz);
      
      // Add difficulty to the quiz data
      quiz.difficulty = difficulty;
      
      return quiz;
    } catch (err) {
      console.error("Error parsing quiz JSON:", err);
      console.error("Content:", content);
      return null;
    }
  } catch (error) {
    console.error("Error generating quiz:", error);
    
    // Fallback to OpenAI if Gemini fails
    console.log("Falling back to OpenAI for quiz generation");
    
    try {
      // Using OpenAI as fallback
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: `You are an expert AI Quiz Generator. Create a quiz based on the following topic or content. The quiz should be ${difficultyOrLanguage} difficulty level with ${numQuestions} multiple-choice questions, each having ${numOptions} answer options. For each question:
              
              1. Only ONE option should be correct
              2. Provide clear explanations for why the correct answer is right
              3. Make wrong answers plausible but clearly incorrect
              4. Format your response as a valid JSON object with this structure:
              {
                "questions": [
                  {
                    "question": "Question text goes here?",
                    "options": [
                      {"text": "First option", "correct": false, "explanation": ""},
                      {"text": "Second option", "correct": true, "explanation": "Detailed explanation why this is correct"},
                      {"text": "Third option", "correct": false, "explanation": ""},
                      {"text": "Fourth option", "correct": false, "explanation": ""}
                    ]
                  }
                  // More questions...
                ]
              }
              
              The explanations should only be provided for correct answers. Make sure all JSON is properly formatted with no errors.` 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2500
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API Error Response:", errorText);
        throw new Error(`API call failed with status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log("OpenAI API Response Data:", data);
      
      if (data.error) {
        console.error("OpenAI API Error:", data.error);
        return null;
      }
      
      if (!data.choices || data.choices.length === 0) {
        console.error("No choices in response");
        return null;
      }
      
      const content = data.choices[0].message.content;
      console.log("Raw content:", content);
      
      // Parse the JSON string to extract the quiz object
      const jsonStart = content.indexOf('{');
      const jsonEnd = content.lastIndexOf('}') + 1;
      
      if (jsonStart === -1 || jsonEnd === 0) {
        console.error("Could not find valid JSON in response");
        return null;
      }
      
      const jsonString = content.substring(jsonStart, jsonEnd);
      
      const quiz = JSON.parse(jsonString);
      console.log("Parsed quiz data:", quiz);
      
      // Add difficulty to the quiz data
      const isDifficulty = ['easy', 'medium', 'hard'].includes(difficultyOrLanguage);
      const difficulty = isDifficulty ? difficultyOrLanguage as 'easy' | 'medium' | 'hard' : 'medium';
      quiz.difficulty = difficulty;
      
      return quiz;
    } catch (fallbackError) {
      console.error("Error in OpenAI fallback:", fallbackError);
      return null;
    }
  }
}
