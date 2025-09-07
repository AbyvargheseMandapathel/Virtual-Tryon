
import React, { useState, useEffect } from 'react';
import { generateColorVariations, generateSingleColorVariation } from '../services/geminiService';
import { SparklesIcon } from './icons/SparklesIcon';

interface AiColorSelectorProps {
  selectedItem: string | null;
  onColorSwap: (originalUrl: string, newUrl:string) => void;
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
}

export const AiColorSelector: React.FC<AiColorSelectorProps> = ({
  selectedItem,
  onColorSwap,
  isGenerating,
  setIsGenerating,
  setError,
}) => {
  const [colorVariations, setColorVariations] = useState<string[]>([]);
  const [lastSelectedItem, setLastSelectedItem] = useState<string | null>(null);

  const [customColor, setCustomColor] = useState('');
  const [isCustomLoading, setIsCustomLoading] = useState(false);

  useEffect(() => {
    if (selectedItem && selectedItem !== lastSelectedItem) {
      setLastSelectedItem(selectedItem);
      setColorVariations([]);
      setIsGenerating(true);
      setError(null);

      generateColorVariations(selectedItem)
        .then(variations => {
          setColorVariations(variations);
        })
        .catch(err => {
          console.error(err);
          if (err instanceof Error) {
            setError(err.message || 'Could not generate color variations.');
          } else {
            setError('An unknown error occurred while generating colors.');
          }
        })
        .finally(() => {
          setIsGenerating(false);
        });
    } else if (!selectedItem) {
      // Clear everything if no item is selected
      setLastSelectedItem(null);
      setColorVariations([]);
    }
  }, [selectedItem, lastSelectedItem, setIsGenerating, setError]);

  if (!selectedItem) {
    return null; // Don't show the component if no single item is selected
  }

  const handleColorClick = (newColorUrl: string) => {
    if (selectedItem) {
        onColorSwap(selectedItem, newColorUrl);
        // Set the last selected item to the new URL so we don't re-trigger generation
        setLastSelectedItem(newColorUrl); 
    }
  };

  const handleCustomColorApply = async () => {
    if (!customColor.trim() || !selectedItem) return;

    setIsCustomLoading(true);
    setError(null);
    try {
        const newColorUrl = await generateSingleColorVariation(selectedItem, customColor);
        onColorSwap(selectedItem, newColorUrl);
        setLastSelectedItem(newColorUrl);
        setCustomColor(''); // Clear input on success
    } catch (err) {
        console.error(err);
        if (err instanceof Error) {
            setError(err.message || 'Could not generate custom color.');
        } else {
            setError('An unknown error occurred while generating custom color.');
        }
    } finally {
        setIsCustomLoading(false);
    }
  };

  const isBusy = isGenerating || isCustomLoading;

  return (
    <div className="mt-6 border border-slate-700 rounded-xl p-4 bg-slate-900">
      <div className="flex items-center space-x-2 mb-3">
        <SparklesIcon className="w-5 h-5 text-teal-500" />
        <h3 className="font-semibold text-slate-300">AI Color Selector</h3>
      </div>
      
      {isGenerating && (
         <div className="flex items-center justify-center space-x-2 text-sm text-slate-400 h-24">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <span>Generating color palette...</span>
         </div>
      )}

      {!isGenerating && colorVariations.length > 0 && (
        <div className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-2">Click a swatch to change the item's color:</p>
              <div className="grid grid-cols-5 gap-3">
                  {colorVariations.map((colorUrl, index) => (
                      <button
                          key={index}
                          onClick={() => handleColorClick(colorUrl)}
                          disabled={isBusy}
                          className="aspect-square rounded-lg overflow-hidden cursor-pointer ring-1 ring-slate-600 hover:ring-2 hover:ring-teal-500 focus:ring-2 focus:ring-teal-500 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`Select color variation ${index + 1}`}
                      >
                          <img src={colorUrl} alt={`Color variation ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                  ))}
              </div>
            </div>

            <div className="border-t border-slate-700 pt-4">
              <p className="text-sm font-medium text-slate-400 mb-2">Or, try a custom color:</p>
              <div className="flex space-x-2">
                <input 
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="e.g., hot pink with sparkles"
                  disabled={isBusy}
                  className="flex-grow block w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg shadow-sm placeholder-slate-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm text-slate-200 disabled:bg-slate-700"
                />
                <button
                  onClick={handleCustomColorApply}
                  disabled={!customColor.trim() || isBusy}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-teal-500 disabled:bg-teal-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isCustomLoading ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  ) : "Apply"}
                </button>
              </div>
            </div>
        </div>
      )}
    </div>
  );
};