
import React from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { SUPPORTED_IMAGE_ACCEPT } from '../constants';

interface DressGalleryProps {
  uploadedItems: string[];
  selectedItems: string[];
  onSelectItem: (url: string) => void;
  onItemUpload: (files: FileList) => void;
}

export const DressGallery: React.FC<DressGalleryProps> = ({
  uploadedItems,
  selectedItems,
  onSelectItem,
  onItemUpload,
}) => {
  return (
    <div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {uploadedItems.map((itemUrl, index) => {
          const isSelected = selectedItems.includes(itemUrl);
          return (
            <div
              key={index}
              onClick={() => onSelectItem(itemUrl)}
              className={`relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-all duration-200 shadow-md hover:shadow-xl hover:shadow-teal-900/50 ${isSelected ? 'ring-2 ring-teal-500 ring-offset-2 ring-offset-slate-800' : 'ring-1 ring-slate-700'}`}
            >
              <img src={itemUrl} alt={`Item ${index + 1}`} className="w-full h-full object-cover" />
              {isSelected && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                </div>
              )}
            </div>
          )
        })}
        <label className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-600 flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-slate-700 transition-colors">
          <UploadIcon className="h-8 w-8 text-slate-500" />
          <span className="mt-1 text-xs text-center text-slate-400">Upload Item</span>
          <input
            type="file"
            className="hidden"
            accept={SUPPORTED_IMAGE_ACCEPT}
            multiple
            onChange={(e) => e.target.files && onItemUpload(e.target.files)}
          />
        </label>
      </div>
    </div>
  );
};