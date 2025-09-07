
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';
import { SUPPORTED_IMAGE_MIMETYPES, SUPPORTED_IMAGE_ACCEPT } from '../constants';

interface ImageUploaderProps {
  title: string;
  onFileSelect: (file: File) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ title, onFileSelect }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (files: FileList | null) => {
    setError(null);
    if (files && files[0]) {
      const file = files[0];
      if (!SUPPORTED_IMAGE_MIMETYPES.includes(file.type)) {
        setError('Unsupported format. Please use PNG, JPG, WEBP, HEIC, or HEIF.');
        return;
      }
      onFileSelect(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const onDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  }, []);

  return (
    <div className="flex flex-col items-center">
      <h3 className="font-medium text-slate-400 mb-2">{title}</h3>
      <label
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`w-full aspect-[3/4] rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-all duration-300 ${isDragging ? 'border-teal-500 bg-teal-900/50' : 'border-slate-600 hover:border-teal-500 bg-slate-900'}`}
      >
        <div className="text-center p-4">
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
          ) : (
            <>
              <UploadIcon className="mx-auto h-10 w-10 text-slate-500" />
              <p className="mt-2 text-sm text-slate-400">
                <span className="font-semibold text-teal-500">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500">PNG, JPG, WEBP, HEIC, HEIF</p>
              {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
            </>
          )}
        </div>
        <input
          type="file"
          className="hidden"
          accept={SUPPORTED_IMAGE_ACCEPT}
          onChange={(e) => handleFileChange(e.target.files)}
        />
      </label>
    </div>
  );
};