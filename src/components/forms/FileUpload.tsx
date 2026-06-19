/**
 * components/forms/FileUpload.tsx
 * Компонент для загрузки файлов
 */

import React, { useRef } from 'react';
import { validateSketchFile } from '../../utils';
import { classNames } from '../../utils';

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number;
  onFileSelect: (file: File | null) => void;
  file?: File | null;
  error?: string;
  preview?: string;
  /** Подсказка о форматах/размере под основным текстом */
  hint?: string;
  /** Текст кнопки выбора файла */
  buttonLabel?: string;
}

export const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  (
    {
      label,
      accept = 'image/*',
      onFileSelect,
      file,
      error,
      preview,
      hint = 'JPG, PNG, WEBP до 20 МБ',
      buttonLabel = 'Выбрать файл',
    },
    ref
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const openPicker = () => inputRef.current?.click();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];

      if (!selectedFile) {
        onFileSelect(null);
        return;
      }

      // Валидация
      const validationError = validateSketchFile(selectedFile);
      if (validationError) {
        console.error(validationError.message);
        onFileSelect(null);
        return;
      }

      onFileSelect(selectedFile);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        const validationError = validateSketchFile(droppedFile);
        if (validationError) {
          console.error(validationError.message);
          return;
        }
        onFileSelect(droppedFile);
      }
    };

    return (
      <div ref={ref} className="w-full">
        {label && (
          <label className="block text-xs font-medium uppercase tracking-wider text-muted mb-3">
            {label}
          </label>
        )}

        {/* Preview */}
        {(preview || file) && (
          <div className="mb-4 relative">
            {preview && (
              <img
                src={preview}
                alt="Preview"
                className="w-full h-auto rounded-2xl max-h-64 object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => onFileSelect(null)}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}

        {/* Upload Area */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={openPicker}
          className={classNames(
            'flex flex-col items-center justify-center text-center min-h-[300px] px-6',
            'border-2 border-dashed rounded-2xl cursor-pointer transition-colors',
            error
              ? 'border-red-500/70 bg-red-500/5'
              : 'border-line hover:border-brand/60 hover:bg-white/[0.02]'
          )}
        >
          <div className="w-20 h-20 rounded-full bg-brand-tint flex items-center justify-center mb-5">
            <svg
              className="w-9 h-9 text-brand-contrast"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.6" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 15l-5-5L5 21"
              />
            </svg>
          </div>

          <p className="text-[17px] font-semibold text-white mb-1">
            {file ? file.name : 'Нажмите для выбора'}
          </p>
          <p className="text-sm text-muted">{hint}</p>

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Select button */}
        <button
          type="button"
          onClick={openPicker}
          className="mt-4 w-full flex items-center justify-center gap-2 bg-card hover:bg-card-2 text-white font-medium rounded-2xl py-4 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.9}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 16V4m0 0L8 8m4-4l4 4M5 20h14"
            />
          </svg>
          {buttonLabel}
        </button>

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';
