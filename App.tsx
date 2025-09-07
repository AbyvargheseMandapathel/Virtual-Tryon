
import React, { useState, useCallback } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { DressGallery } from './components/DressGallery';
import { AiColorSelector } from './components/AiDesigner';
import { Previewer } from './components/Previewer';
import { generateTryOnImages, enhanceBackgroundPrompt, enhanceImageQuality } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import type { TryOnResult } from './types';
import { SUPPORTED_IMAGE_MIMETYPES } from './constants';
import { SparklesIcon } from './components/icons/SparklesIcon';

const StepHeading: React.FC<{ number: number; title: string }> = ({ number, title }) => (
    <div className="flex items-center mb-4">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 text-white font-bold text-sm mr-3 flex-shrink-0">{number}</div>
        <h2 className="text-xl font-semibold text-slate-300">{title}</h2>
    </div>
);


const App: React.FC = () => {
  const [bodyPhoto, setBodyPhoto] = useState<File | null>(null);
  const [customBackgroundPrompt, setCustomBackgroundPrompt] = useState<string>('');
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<boolean>(false);
  const [selectedItemUrls, setSelectedItemUrls] = useState<string[]>([]);
  const [uploadedItems, setUploadedItems] = useState<string[]>([]);
  
  const [generatedResults, setGeneratedResults] = useState<TryOnResult[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDesigning, setIsDesigning] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleItemUpload = async (files: FileList) => {
    const fileArray = Array.from(files);
    setError(null);

    const validFiles = fileArray.filter(file => SUPPORTED_IMAGE_MIMETYPES.includes(file.type));
    const invalidFilesCount = fileArray.length - validFiles.length;

    if (invalidFilesCount > 0) {
      setError(`${invalidFilesCount} image(s) had an unsupported format and were not uploaded. Please use PNG, JPG, WEBP, HEIC, or HEIF.`);
    }

    if (validFiles.length > 0) {
      const base64Items = await Promise.all(validFiles.map(fileToBase64));
      setUploadedItems(prev => [...prev, ...base64Items]);
    }
  };

  const handleToggleItemSelection = (url: string) => {
    setSelectedItemUrls(prev =>
      prev.includes(url)
        ? prev.filter(u => u !== url)
        : [...prev, url]
    );
  };

  const handleColorSwap = (originalUrl: string, newUrl: string) => {
    setUploadedItems(prev => prev.map(item => item === originalUrl ? newUrl : item));
    setSelectedItemUrls(prev => prev.map(item => item === originalUrl ? newUrl : item));
  };

  const handleEnhancePrompt = async () => {
    if (!customBackgroundPrompt.trim()) {
        setError("Please enter a background idea first.");
        return;
    }
    setIsEnhancingPrompt(true);
    setError(null);
    try {
        const enhancedPrompt = await enhanceBackgroundPrompt(customBackgroundPrompt);
        setCustomBackgroundPrompt(enhancedPrompt);
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            setError(err.message || "Failed to enhance prompt.");
        } else {
            setError("An unknown error occurred while enhancing the prompt.");
        }
    } finally {
        setIsEnhancingPrompt(false);
    }
  };
  
  const handleGenerate = useCallback(async () => {
    if (!bodyPhoto || selectedItemUrls.length === 0) {
      setError("Please upload a full-body photo and select at least one item.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage('Preparing your virtual try-on...');
    setError(null);
    setGeneratedResults(null);

    try {
      const bodyPhotoBase64 = await fileToBase64(bodyPhoto);
      
      const results: TryOnResult[] = [];
      for (let i = 0; i < selectedItemUrls.length; i++) {
        const itemUrl = selectedItemUrls[i];
        
        // Step 1: Generate the base image
        setLoadingMessage(`Generating try-on for item ${i + 1} of ${selectedItemUrls.length}...`);
        const itemPhotoBase64 = itemUrl;
        const generatedImage = await generateTryOnImages(bodyPhotoBase64, itemPhotoBase64, customBackgroundPrompt);

        // Step 2: Enhance the generated image
        setLoadingMessage(`Enhancing quality for item ${i + 1}...`);
        const enhancedImage = await enhanceImageQuality(generatedImage);

        results.push({ itemUrl: itemPhotoBase64, image: enhancedImage });
      }

      setGeneratedResults(results);

    } catch (err)
 {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message || "An error occurred while generating the images. Please try again.");
      } else {
        setError("An unknown error occurred while generating the images. Please try again.");
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [bodyPhoto, selectedItemUrls, customBackgroundPrompt]);

  const canGenerate = bodyPhoto && selectedItemUrls.length > 0 && !isDesigning;
  const backgroundOptions = [
    { name: 'Default', value: '' },
    { name: 'No BG', value: 'a plain, solid white background' },
    { name: 'Runway', value: 'a professional fashion runway with dramatic lighting' },
    { name: 'Beach', value: 'a sunny tropical beach with turquoise water and white sand' },
    { name: 'City', value: 'a bustling, modern cityscape at dusk with neon lights' }
  ];
  
  const singleSelectedItem = selectedItemUrls.length === 1 ? selectedItemUrls[0] : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans">
      <header className="bg-slate-800 p-6 shadow-md">
        <h1 className="text-3xl font-bold text-center text-slate-100 tracking-tight">AI Virtual Outfit Try-On</h1>
        <p className="text-center text-slate-400 mt-1">See yourself in any outfit, instantly. Now with AI-powered design!</p>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel: Inputs */}
          <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl flex flex-col space-y-8 border border-slate-700">
            <section>
              <StepHeading number={1} title="Upload Your Photo" />
              <div className="grid grid-cols-1 gap-4">
                <ImageUploader title="Full-Body Photo" onFileSelect={setBodyPhoto} />
              </div>
            </section>

            {bodyPhoto && (
              <section>
                <StepHeading number={2} title="Choose a Background" />
                <p className="text-sm text-slate-400 mb-3">Select a preset or create your own with AI.</p>
                <div className="flex flex-wrap gap-3 mb-4">
                  {backgroundOptions.map(opt => (
                     <button
                        key={opt.name}
                        onClick={() => setCustomBackgroundPrompt(opt.value)}
                        className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${customBackgroundPrompt === opt.value ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600 hover:border-slate-500'}`}
                     >
                       {opt.name}
                     </button>
                  ))}
                </div>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={customBackgroundPrompt}
                        onChange={(e) => setCustomBackgroundPrompt(e.target.value)}
                        placeholder="e.g., a serene forest at dawn"
                        className="flex-grow block w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg shadow-sm placeholder-slate-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-slate-200"
                    />
                    <button
                        onClick={handleEnhancePrompt}
                        disabled={isEnhancingPrompt || !customBackgroundPrompt.trim()}
                        className="px-3 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-500 disabled:bg-teal-400 disabled:cursor-not-allowed flex items-center"
                        title="Enhance with AI"
                    >
                        {isEnhancingPrompt ? (
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        ) : (
                            <SparklesIcon className="w-5 h-5" />
                        )}
                        <span className="ml-2 hidden sm:inline">Enhance</span>
                    </button>
                </div>
              </section>
            )}

            <section>
              <StepHeading number={3} title="Select or Design an Outfit" />
              <DressGallery
                uploadedItems={uploadedItems}
                selectedItems={selectedItemUrls}
                onSelectItem={handleToggleItemSelection}
                onItemUpload={handleItemUpload}
              />
              <AiColorSelector
                selectedItem={singleSelectedItem}
                onColorSwap={handleColorSwap}
                isGenerating={isDesigning}
                setIsGenerating={setIsDesigning}
                setError={setError}
              />
            </section>

            <div>
              {error && (
                  <div className="mb-4 text-center p-3 bg-red-900/50 text-red-300 rounded-lg text-sm border border-red-800">
                    <p>{error}</p>
                  </div>
              )}
              <button
                onClick={handleGenerate}
                disabled={!canGenerate || isLoading}
                className="w-full bg-teal-600 text-white font-bold text-lg py-3 px-6 rounded-xl hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-teal-500/30 disabled:shadow-none flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {loadingMessage || 'Generating...'}
                  </>
                ) : "Generate Try-On"}
              </button>
            </div>
          </div>

          {/* Right Panel: Preview */}
          <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700">
             <Previewer
                originalPhoto={bodyPhoto ? URL.createObjectURL(bodyPhoto) : null}
                generatedResults={generatedResults}
                isLoading={isLoading}
                error={null} // Error is displayed in the left panel now
             />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
