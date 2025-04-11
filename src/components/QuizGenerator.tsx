import React, { useState, useRef, useEffect } from 'react';
import { Brain, Youtube, Camera, Loader2, AlertCircle, Sparkles, FileText, ToggleLeft, ToggleRight, BookOpen, Image, Globe } from 'lucide-react';
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

type InputType = 'prompt' | 'youtube' | 'image';
type ImageSource = 'camera' | 'upload' | null;
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
  
  const [imageSource, setImageSource] = useState<ImageSource | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [processedText, setProcessedText] = useState<string | null>(null);
  const [extractionLoading, setExtractionLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [language, setLanguage] = useState<Language>('english');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const setupCamera = async () => {
      if (cameraActive && videoRef.current) {
        try {
          const constraints = {
            video: {
              facingMode: isMobile ? "environment" : "user"
            }
          };
          
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (err) {
          console.error("Error accessing camera:", err);
          toast.error("Could not access camera. Please check permissions.");
          setCameraActive(false);
        }
      }
    };

    setupCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraActive, isMobile]);

  const handleInputTypeChange = (type: InputType) => {
    setInputType(type);
    setError(null);
    
    if (type !== 'image') {
      setImageSource(null);
      setImageData(null);
      setExtractedText(null);
      setProcessedText(null);
      setCameraActive(false);
    }
  };

  const handleImageSourceSelect = () => {
    setImageSource('camera');
    setImageData(null);
    setExtractedText(null);
    setProcessedText(null);
    setCameraActive(true);
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const base64Data = dataUrl.split(',')[1];
        
        console.log("Image captured, base64 data length:", base64Data?.length || 0);
        setImageData(base64Data);
        
        if (video.srcObject) {
          (video.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        }
        setCameraActive(false);
      }
    }
  };

  const processImage = async () => {
    if (!imageData) {
      toast.error("No image to process");
      return;
    }
    
    console.log("Processing image with Gemini, data length:", imageData.length);
    setExtractionLoading(true);
    setExtractedText(null);
    setProcessedText(null);
    
    try {
      toast.info("Analyzing image. This may take a moment...");
      
      const extractedContent = await analyzeImageWithGemini(imageData, language);
      
      if (extractedContent) {
        console.log("Content extracted:", extractedContent);
        setExtractedText(extractedContent);
        
        const processed = await processExtractedText(extractedContent, language);
        setProcessedText(processed);
      } else {
        toast.error("Failed to analyze image. Try again or choose a different image.");
      }
    } catch (error) {
      console.error("Error processing image:", error);
      toast.error("Failed to process image");
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

    if (inputType === 'image' && !processedText && !extractedText) {
      setError('Please process an image first');
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
            onClick={() => handleInputTypeChange('image')}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-300",
              inputType === 'image' 
                ? "bg-gradient-to-r from-quiz-primary to-quiz-secondary text-white shadow-md" 
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            )}
          >
            <Image size={20} />
            <span>Image</span>
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
              {!imageSource ? (
                <div className="flex justify-center">
                  <button
                    onClick={handleImageSourceSelect}
                    className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-quiz-primary transition-colors flex flex-col items-center justify-center gap-2"
                  >
                    <Camera size={32} className="text-quiz-primary" />
                    <span className="text-sm font-medium">Take Photo</span>
                    <span className="text-xs text-gray-500">{isMobile ? "Uses back camera" : "Uses front camera"}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 relative">
                  {cameraActive ? (
                    <div className="space-y-4">
                      <div className="overflow-hidden rounded-xl border border-gray-200 bg-black aspect-video">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex justify-center">
                        <Button 
                          onClick={captureImage}
                          variant="outline"
                          size="lg"
                          className="rounded-full h-14 w-14 p-0 flex items-center justify-center bg-white border-2 border-quiz-primary"
                        >
                          <Camera size={24} className="text-quiz-primary" />
                        </Button>
                      </div>
                    </div>
                  ) : imageData ? (
                    <div className="overflow-hidden rounded-xl border border-gray-200">
                      <img 
                        src={`data:image/jpeg;base64,${imageData}`} 
                        alt="Captured" 
                        className="w-full object-contain max-h-80"
                      />
                    </div>
                  ) : null}
                  
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {!cameraActive && imageData && (
                    <Button 
                      onClick={() => {
                        setImageSource(null);
                        setImageData(null);
                        setExtractedText(null);
                        setProcessedText(null);
                      }}
                      variant="outline"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white"
                    >
                      <AlertCircle size={16} className="text-gray-600" />
                    </Button>
                  )}
                  
                  {imageData && !extractedText && (
                    <Button
                      onClick={processImage}
                      disabled={extractionLoading}
                      className="w-full"
                    >
                      {extractionLoading ? (
                        <>
                          <Loader2 className="animate-spin mr-2" size={16} />
                          Processing...
                        </>
                      ) : (
                        <>
                          <FileText size={16} className="mr-2" />
                          Extract Text from Image
                        </>
                      )}
                    </Button>
                  )}
                  
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
