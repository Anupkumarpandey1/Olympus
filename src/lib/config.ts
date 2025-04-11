
// API Keys (in a real app, these should be environment variables)
export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'sk-example-key-replace-with-your-own'; // Kept for backward compatibility
export const GEMINI_API_KEY = 'AIzaSyAkufDKqoXYUuYwpmKxzxfaxFAzafeJ3z3as6p4Y0Wwr04'; // For Gemini API
// export const YOUTUBE_API_KEY = 'your-youtube-api-key-here'; // For YouTube Data API
// export const RAPIDAPI_KEY = '88e9d73b57msh9982c179daafdb7efwfep1d1688jsn6d4186f6ca5a'; // For RapidAPI
// export const RAPIDAPI_HOST = 'youtube-video-summarizer-gpt-ai.p.rapidapi.com'; // For RapidAPI

// API URLs
export const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'; // Kept for backward compatibility
export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateConntent';
// export const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';
// export const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || 'sk-example-key-replace-with-your-own'; // Kept for backward compatibility
// export const GEMINI_API_KEY = 'AIzaSyAkufDKqoXYUuYupmKxeJ3z36p4Y0Wwr04'; // For Gemini API
export const YOUTUBE_API_KEY = 'your-youtube-api-key-here'; // For YouTube Data API
export const RAPIDAPI_KEY = '88e9d73b57msh9982c178daafdb7p1d1688jsn6d4186f6ca5a'; // For RapidAPI
export const RAPIDAPI_HOST = 'youtube-video-summarizer-gpt-ai.p.rapidapi.com'; // For RapidAPI

// // API URLs
// export const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'; // Kept for backward compatibility
// export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
export const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

// Model configurations
export const AI_MODELS = {
  quizGenerator: "gpt-4o-mini", // Using OpenAI model as fallback
  teacherChat: "gemini-2.0-flash", // Using Gemini model
};

// Quiz generation parameters
export const DEFAULT_QUIZ_PARAMS = {
  numQuestions: 5,
  numOptions: 4,
  temperature: 0.7,
  maxTokens: 2000,
};

// Supported languages
export const SUPPORTED_LANGUAGES = [
  { id: 'english', name: 'English' },
  { id: 'hindi', name: 'Hindi' },
  { id: 'hinglish', name: 'Hinglish' }
];
