import React, { useState, useEffect } from 'react';
import type { TryOnResult } from '../types';
import { DownloadIcon } from './icons/DownloadIcon';
import { PhotoAlbumIcon } from './icons/PhotoAlbumIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';

interface PreviewerProps {
  originalPhoto: string | null;
  generatedResults: TryOnResult[] | null;
  isLoading: boolean;
  error: string | null;
}

export const Previewer: React.FC<PreviewerProps> = ({ originalPhoto, generatedResults, isLoading, error }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (generatedResults && generatedResults.length > 0) {
      setCurrentIndex(0);
    }
  }, [generatedResults]);

  const handleNext = () => {
    if (generatedResults) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % generatedResults.length);
    }
  };

  const handlePrev = () => {
    if (generatedResults) {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + generatedResults.length) % generatedResults.length);
    }
  };

  const downloadImage = (url: string | null, filename: string) => {
    if(!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <svg className="animate-spin h-12 w-12 text-teal-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-lg text-slate-400">Generating your virtual try-on...</p>
        </div>
      );
    }

    if (error && !generatedResults) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center text-red-400 p-4">
                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <p className="font-semibold">Generation Failed</p>
                <p className="text-sm">{error}</p>
            </div>
        );
    }

    if (!generatedResults) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-4">
          <PhotoAlbumIcon className="w-16 h-16 mb-4 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-300">Your Results Will Appear Here</h3>
          <p className="mt-1">Complete the steps on the left to start your virtual try-on.</p>
        </div>
      );
    }
    
    const currentResult = generatedResults[currentIndex];

    return (
      <div className="relative h-full w-full flex items-center justify-center">
        <div className="group relative aspect-[3/4] h-full rounded-lg overflow-hidden">
          <img 
            src={currentResult.image} 
            alt={`Generated try-on ${currentIndex + 1}`} 
            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105" 
          />
          <button 
            onClick={() => downloadImage(currentResult.image, `try-on-result-${currentIndex + 1}.jpg`)} 
            className="absolute bottom-3 right-3 bg-slate-900/70 text-white p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Download Image"
          >
            <DownloadIcon className="w-5 h-5"/>
          </button>
        </div>
        
        {generatedResults.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-slate-900/70 text-white p-2.5 rounded-full hover:bg-slate-800/90 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label="Previous image"
            >
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900/70 text-white p-2.5 rounded-full hover:bg-slate-800/90 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900"
              aria-label="Next image"
            >
              <ArrowRightIcon className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-900/70 text-white text-xs font-mono px-2.5 py-1.5 rounded-full">
              {currentIndex + 1} / {generatedResults.length}
            </div>
          </>
        )}
      </div>
    );
  };
  
  return (
    <div className="h-full min-h-[500px] md:min-h-0 flex flex-col">
        <div className="flex items-center mb-4 flex-shrink-0">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 text-white font-bold text-sm mr-3 flex-shrink-0">4</div>
            <h2 className="text-xl font-semibold text-slate-300">Preview & Export</h2>
        </div>
        <div className="bg-slate-900 rounded-xl p-2 h-full w-full border border-slate-700 overflow-hidden flex-grow">
            {renderContent()}
        </div>
    </div>
  );
};
