import React, { useState, useRef, useEffect } from 'react';
import { Brain, Youtube, FileUp, Loader2, AlertCircle, Sparkles, FileText, ToggleLeft, ToggleRight, BookOpen, File, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from "sonner";
import { generateQuiz, extractFromYouTube, getSummaryFromYouTube, getProcessedSummaryFromYouTube, analyzeImageWithGemini, processExtractedText } from '@/lib/openai';
import { cn } from '@/lib/utils';
import { DEFAULT_QUIZ_PARAMS, SUPPORTED_LANGUAGES } from '@/lib/config';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FormattedMessage } from './FormattedMessage';

interface QuizQuestion {
  question: string;
  options: {
    text: string;
    correct: boolean;
    explanation: string;
  }[];
}

interface QuizData {
  questions: QuizQuestion[];
}

interface QuizGeneratorProps {
  onQuizGenerated: (quiz: QuizData) => void;
}

type InputType = 'prompt' | 'youtube' | 'pdf';
type Language = 'english' | 'hindi' | 'hinglish';

const AssessmentGenerator = ({ onQuizGenerated }: QuizGeneratorProps) => {
  const [inputType, setInputType] = useState<InputType>('prompt');
  const [userPrompt, setUserPrompt] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [numQuestions, setNumQuestions] = useState(DEFAULT_QUIZ_PARAMS.numQuestions);
  const [numOptions, setNumOptions] = useState(DEFAULT_QUIZ_PARAMS.numOptions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [processedSummary, setProcessedSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryView, setSummaryView] = useState<'raw' | 'processed'>('processed');
  
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [processedText, setProcessedText] = useState<string | null>(null);
  const [extractionLoading, setExtractionLoading] = useState(false);
  const [pdfWorkerLoaded, setPdfWorkerLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [language, setLanguage] = useState<Language>('english');

  useEffect(() => {
    // Load PDF.js worker script
    const loadPdfWorker = async () => {
      if (typeof window !== 'undefined' && !window.pdfjsLib) {
        try {
          // Load PDF.js library
          const pdfJsScript = document.createElement('script');
          pdfJsScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
          pdfJsScript.async = true;
          
          pdfJsScript.onload = () => {
            // Set up PDF.js worker
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
            setPdfWorkerLoaded(true);
          };
          
          document.body.appendChild(pdfJsScript);
        } catch (error) {
          console.error('Failed to load PDF.js:', error);
        }
      } else if (window.pdfjsLib) {
        setPdfWorkerLoaded(true);
      }
    };
    
    loadPdfWorker();
  }, []);

  const handleInputTypeChange = (type: InputType) => {
    setInputType(type);
    setError(null);
    
    if (type !== 'pdf') {
      setSelectedPdf(null);
      setExtractedText(null);
      setProcessedText(null);
    }
  };

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf') {
        setSelectedPdf(file);
        setExtractedText(null);
        setProcessedText(null);
      } else {
        toast.error("Please select a valid PDF file");
        setSelectedPdf(null);
      }
    }
  };

  const extractTextFromPdf = async () => {
    if (!selectedPdf || !window.pdfjsLib) {
      toast.error("No PDF selected or PDF.js not loaded");
      return;
    }
    
    setExtractionLoading(true);
    setExtractedText(null);
    setProcessedText(null);
    
    try {
      toast.info("Extracting text from PDF. This may take a moment...");
      
      // Read the file as ArrayBuffer
      const arrayBuffer = await selectedPdf.arrayBuffer();
      
      // Load the PDF using PDF.js
      const loadingTask = window.pdfjsLib.getDocument(arrayBuffer);
      const pdf = await loadingTask.promise;
      
      let text = '';
      
      // Extract text from each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(' ');
        text += `\n\n--- Page ${i} ---\n\n${pageText}`;
      }
      
      if (text.trim()) {
        setExtractedText(text);
        
        // Process the extracted text
        const processed = await processExtractedText(text, language);
        setProcessedText(processed);
        toast.success("PDF text extracted successfully");
      } else {
        toast.error("Could not extract text from PDF. It might be scanned or protected.");
      }
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      toast.error("Failed to extract text from PDF");
    } finally {
      setExtractionLoading(false);
    }
  };

  const handleGenerateQuiz = async () => {
    if (inputType === 'prompt' && !userPrompt.trim()) {
      setError('Please enter a topic or subject');
      return;
    }

    if (inputType === 'youtube' && !youtubeUrl.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (inputType === 'pdf' && !processedText && !extractedText) {
      setError('Please extract text from a PDF first');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      let prompt: string | null;
      
      if (inputType === 'prompt') {
        prompt = userPrompt.trim();
      } else if (inputType === 'youtube') {
        if (processedSummary) {
          prompt = processedSummary;
          toast.info('Using processed summary for quiz generation');
        } else if (summary) {
          try {
            const parsedSummary = JSON.parse(summary);
            if (parsedSummary && parsedSummary.summary) {
              prompt = parsedSummary.summary;
              toast.info('Using summary from API for quiz generation');
            } else {
              prompt = summary;
            }
          } catch (e) {
            prompt = summary;
          }
        } else {
          prompt = await extractFromYouTube(youtubeUrl.trim());
          toast.info('Using extracted content for quiz generation');
        }
      } else {
        prompt = processedText || extractedText;
        toast.info('Using extracted text for quiz generation');
      }
      
      if (!prompt) {
        throw new Error('Failed to extract content');
      }
      
      const quizData = await generateQuiz(prompt, numQuestions, numOptions, language);
      
      if (quizData) {
        onQuizGenerated(quizData);
        toast.success('Quiz generated successfully!');
      } else {
        throw new Error('Failed to generate quiz');
      }
    } catch (error) {
      console.error('Quiz generation error:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSummary = async () => {
    const newShowSummary = !showSummary;
    setShowSummary(newShowSummary);
    
    if (newShowSummary && inputType === 'youtube' && youtubeUrl && !summary) {
      try {
        setSummaryLoading(true);
        const rawSummary = await getSummaryFromYouTube(youtubeUrl);
        setSummary(rawSummary);
        
        if (rawSummary) {
          const processed = await getProcessedSummaryFromYouTube(rawSummary, language);
          setProcessedSummary(processed);
        }
      } catch (error) {
        console.error('Error getting video summary:', error);
        toast.error('Failed to get video summary');
      } finally {
        setSummaryLoading(false);
      }
    }
  };

  const handleYouTubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setYoutubeUrl(newUrl);
    
    if (newUrl !== youtubeUrl) {
      setSummary(null);
      setProcessedSummary(null);
    }
  };

  return (
    <motion.div 
      className="premium-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold gradient-text">Assessment Generator</h2>
          
          <div className="flex items-center space-x-2">
            <Globe size={16} className="text-quiz-primary" />
            <Select 
              value={language} 
              onValueChange={(value) => setLanguage(value as Language)}
            >
              <SelectTrigger className="w-[120px] h-8 text-sm">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <SelectItem key={lang.id} value={lang.id}>{lang.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="flex gap-4 mb-8" style={{ width: "fit-content", display: "flex", flexFlow: "wrap" }}>

          <button
            onClick={() => handleInputTypeChange('prompt')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300",
              inputType === 'prompt' 
                ? "bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white shadow-md" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <Brain size={20} />
            <span>Direct Prompt</span>
          </button>
          <button
            onClick={() => handleInputTypeChange('youtube')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300",
              inputType === 'youtube' 
                ? "bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white shadow-md" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <Youtube size={20} />
            <span>YouTube Video</span>
          </button>
          <button
            onClick={() => handleInputTypeChange('pdf')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300",
              inputType === 'pdf' 
                ? "bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white shadow-md" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <File size={20} />
            <span>PDF</span>
          </button>
        </div>

        <motion.div
          key={inputType}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          {inputType === 'prompt' ? (
            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Enter your topic or subject here... (e.g., 'The Solar System', 'World War II', 'Basic JavaScript')"
              className="w-full p-4 border border-gray-200 rounded-xl mb-6 h-32 focus:border-quiz-primary transition-all duration-200"
            />
          ) : inputType === 'youtube' ? (
            <div className="space-y-4">
              <input
                type="text"
                value={youtubeUrl}
                onChange={handleYouTubeUrlChange}
                placeholder="Enter YouTube video URL..."
                className="w-full p-4 border border-gray-200 rounded-xl focus:border-quiz-primary transition-all duration-200"
              />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="summary-toggle" 
                    checked={showSummary}
                    onCheckedChange={handleToggleSummary}
                  />
                  <label htmlFor="summary-toggle" className="text-sm text-gray-700 flex items-center cursor-pointer">
                    {showSummary ? <ToggleRight className="h-4 w-4 mr-1" /> : <ToggleLeft className="h-4 w-4 mr-1" />}
                    Show Video Summary
                  </label>
                </div>
                {summaryLoading && <Loader2 className="animate-spin h-4 w-4 text-gray-500" />}
              </div>
              
              {showSummary && (summary || processedSummary) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Summary View</h3>
                    <ToggleGroup type="single" value={summaryView} onValueChange={(value) => value && setSummaryView(value as 'raw' | 'processed')}>
                      <ToggleGroupItem value="raw" size="sm" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" /> Raw API
                      </ToggleGroupItem>
                      <ToggleGroupItem value="processed" size="sm" className="text-xs">
                        <BookOpen className="h-3 w-3 mr-1" /> Processed
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {summaryView === 'raw' && summary ? (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center mb-2">
                        <FileText className="h-4 w-4 text-quiz-primary mr-2" />
                        <h3 className="text-sm font-medium">RapidAPI Response</h3>
                      </div>
                      <pre className="text-xs bg-gray-900 text-green-500 p-3 rounded overflow-x-auto max-h-60 overflow-y-auto">
                        {summary}
                      </pre>
                    </div>
                  ) : summaryView === 'processed' && processedSummary ? (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center mb-2">
                        <BookOpen className="h-4 w-4 text-quiz-primary mr-2" />
                        <h3 className="text-sm font-medium">Processed Summary</h3>
                      </div>
                      <div className="bg-white p-3 rounded border border-gray-100 max-h-60 overflow-y-auto">
                        <FormattedMessage content={processedSummary} />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
                      {summaryLoading ? "Loading summary..." : "No summary available"}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-quiz-primary transition-colors">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileUp size={32} className="text-quiz-primary" />
                    <span className="text-sm font-medium">Upload PDF File</span>
                    <span className="text-xs text-gray-500">Select a PDF document to extract text</span>
                    
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept=".pdf" 
                      onChange={handlePdfSelect}
                      className="block w-full text-sm text-gray-500 mt-2
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-quiz-primary file:text-white
                        hover:file:bg-quiz-secondary
                        cursor-pointer"
                    />
                  </div>
                  
                  {selectedPdf && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                      <div className="flex items-center">
                        <File size={20} className="text-quiz-primary mr-2" />
                        <div>
                          <p className="text-sm font-medium truncate max-w-xs">{selectedPdf.name}</p>
                          <p className="text-xs text-gray-500">{Math.round(selectedPdf.size / 1024)} KB</p>
                        </div>
                      </div>
                      
                      <Button
                        onClick={extractTextFromPdf}
                        disabled={extractionLoading || !pdfWorkerLoaded}
                        className="text-xs"
                        size="sm"
                      >
                        {extractionLoading ? (
                          <>
                            <Loader2 className="animate-spin mr-1" size={14} />
                            Processing...
                          </>
                        ) : !pdfWorkerLoaded ? (
                          "Loading PDF.js..."
                        ) : (
                          <>
                            <FileText size={14} className="mr-1" />
                            Extract Text
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {(extractedText || processedText) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">Extracted Text</h3>
                    <ToggleGroup type="single" value={summaryView} onValueChange={(value) => value && setSummaryView(value as 'raw' | 'processed')}>
                      <ToggleGroupItem value="raw" size="sm" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" /> Raw Text
                      </ToggleGroupItem>
                      <ToggleGroupItem value="processed" size="sm" className="text-xs">
                        <BookOpen className="h-3 w-3 mr-1" /> Processed
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>

                  {summaryView === 'raw' && extractedText ? (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center mb-2">
                        <FileText className="h-4 w-4 text-quiz-primary mr-2" />
                        <h3 className="text-sm font-medium">Raw Extracted Text</h3>
                      </div>
                      <pre className="text-xs bg-gray-900 text-green-500 p-3 rounded overflow-x-auto max-h-60 overflow-y-auto">
                        {extractedText}
                      </pre>
                    </div>
                  ) : summaryView === 'processed' && processedText ? (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center mb-2">
                        <BookOpen className="h-4 w-4 text-quiz-primary mr-2" />
                        <h3 className="text-sm font-medium">Processed Text</h3>
                      </div>
                      <div className="text-sm bg-white p-3 rounded border border-gray-100 max-h-60 overflow-y-auto">
                        <FormattedMessage content={processedText} />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-center text-sm text-gray-500">
                      {extractionLoading ? "Processing text..." : "No text available"}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-2 gap-6 mb-8 mt-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Questions
            </label>
            <input
              type="number"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Math.max(1, Math.min(20, Number(e.target.value))))}
              min="1"
              max="20"
              className="w-full p-3 border border-gray-200 rounded-xl focus:border-quiz-primary transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options per Question
            </label>
            <input
              type="number"
              value={numOptions}
              onChange={(e) => setNumOptions(Math.max(2, Math.min(6, Number(e.target.value))))}
              min="2"
              max="6"
              className="w-full p-3 border border-gray-200 rounded-xl focus:border-quiz-primary transition-all duration-200"
            />
          </div>
        </div>

        <motion.button
          onClick={handleGenerateQuiz}
          disabled={loading}
          className="w-full premium-button flex items-center justify-center gap-2 py-4"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              <span>Generating Assessment...</span>
            </>
          ) : (
            <>
              <Sparkles size={20} />
              <span>Generate Assessment</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default AssessmentGenerator;
