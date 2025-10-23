import React, { useState, useRef, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

interface SignatureEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signature: { type: 'text' | 'png', data: string }) => void;
}

const SignatureEditDialog: React.FC<SignatureEditDialogProps> = ({ isOpen, onClose, onSave }) => {
   const [selectedColor, setSelectedColor] = useState<string>('#000000');
   const [isDrawing, setIsDrawing] = useState<boolean>(false);
   const [activeTab, setActiveTab] = useState<'draw' | 'type' | 'upload'>('draw');
   const [typedSignature, setTypedSignature] = useState<string>('');
   const [uploadedFile, setUploadedFile] = useState<File | null>(null);
   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
   const [isSaving, setIsSaving] = useState<boolean>(false);
   const canvasRef = useRef<HTMLCanvasElement>(null);

  const resetState = () => {
    setSelectedColor('#000000');
    setIsDrawing(false);
    setActiveTab('draw');
    setTypedSignature('');
    setUploadedFile(null);
    setPreviewUrl(null);
    setIsSaving(false);
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetState();
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === 'type' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'upload') {
      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      setUploadedFile(null);
      setPreviewUrl(null);
    }
  }, [activeTab]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = 2;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = selectedColor;
        ctx.lineWidth = 2;
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      if (ctx) {
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDrawing(false);
  };

  const validateFile = (file: File): boolean => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      alert('Please upload a valid image file (JPEG, PNG, GIF, or WebP).');
      return false;
    }

    if (file.size > maxSize) {
      alert('File size must be less than 5MB.');
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center">
      <div className="mt-8 bg-white rounded-lg w-80 h-96 p-4 relative shadow-xl">
        {/* Close button */}
        <button onClick={onClose} disabled={isSaving} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <h2 className="text-lg font-semibold mb-4">Signature</h2>

        {/* Tabs */}
        <div className="flex space-x-4 mb-4">
          <button
            onClick={() => setActiveTab('draw')}
            className={`font-bold ${activeTab === 'draw' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            Draw
          </button>
          <button
            onClick={() => setActiveTab('type')}
            className={`font-bold ${activeTab === 'type' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            Type
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`font-bold ${activeTab === 'upload' ? 'text-blue-500' : 'text-gray-500'}`}
          >
            Upload
          </button>
        </div>

        {/* Drawing area */}
        {activeTab === 'draw' && (
          <canvas
            ref={canvasRef}
            width={288}
            height={176}
            className="w-72 h-44 border border-gray-300 mb-4"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          ></canvas>
        )}
        {activeTab === 'type' && (
          <div className="w-72 h-44 border border-gray-300 mb-4 flex items-center justify-center">
            <input
              type="text"
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              placeholder="Type your signature"
              className="w-full h-full text-center text-2xl font-signature border-none outline-none bg-transparent"
              style={{ fontFamily: 'cursive' }}
            />
          </div>
        )}
        {activeTab === 'upload' && (
          <div className="w-72 h-44 border-2 border-dashed border-gray-300 mb-4 flex flex-col items-start justify-start relative">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Signature preview"
                className="max-w-full max-h-full object-contain object-left"
              />
            ) : (
              <>
                <div
                  className="w-full h-full flex flex-col items-start justify-start cursor-pointer"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('file-input')?.click()}
                >
                  <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="text-gray-500 text-sm text-left">
                    Drag & drop an image here<br />or click to select
                  </span>
                </div>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </>
            )}
          </div>
        )}

        {/* Color selection dots - only show for Draw tab */}
        {activeTab === 'draw' && (
          <div className="flex space-x-2 mb-4 justify-start">
            <button
              onClick={() => setSelectedColor('#000000')}
              className={`w-4 h-4 bg-black rounded-full ${selectedColor === '#000000' ? 'ring-2 ring-gray-400' : ''}`}
            ></button>
            <button
              onClick={() => setSelectedColor('#3b82f6')}
              className={`w-4 h-4 bg-blue-500 rounded-full ${selectedColor === '#3b82f6' ? 'ring-2 ring-gray-400' : ''}`}
            ></button>
            <button
              onClick={() => setSelectedColor('#ef4444')}
              className={`w-4 h-4 bg-red-500 rounded-full ${selectedColor === '#ef4444' ? 'ring-2 ring-gray-400' : ''}`}
            ></button>
          </div>
        )}

        {/* Buttons */}
        <button
          onClick={() => {
            resetState();
            onClose();
          }}
          className="absolute left-4 bottom-4 px-4 py-2 bg-gray-200 rounded"
        >
          Cancel
        </button>
        <button
          onClick={async () => {
            setIsSaving(true);
            try {
              let signatureData: { type: 'text' | 'png', data: string } | null = null;
              if (activeTab === 'draw' && canvasRef.current) {
                signatureData = { type: 'png', data: canvasRef.current.toDataURL('image/png') };
              } else if (activeTab === 'type' && typedSignature) {
                // Save typed signature as text directly
                signatureData = { type: 'text', data: typedSignature };
              } else if (activeTab === 'upload' && previewUrl) {
                // Convert uploaded image to PNG
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise<void>((resolve, reject) => {
                  img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 288;
                    canvas.height = 176;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                      signatureData = { type: 'png', data: canvas.toDataURL('image/png') };
                      resolve();
                    } else {
                      reject(new Error('Could not get canvas context'));
                    }
                  };
                  img.onerror = () => reject(new Error('Failed to load image'));
                  img.src = previewUrl;
                });
              }
              if (signatureData) {
                await onSave(signatureData);
                resetState();
                onClose();
              }
            } catch (error) {
              console.error('Error saving signature:', error);
            } finally {
              setIsSaving(false);
            }
          }}
          disabled={isSaving}
          className="absolute right-4 bottom-4 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>
    </div>
  );
};

export default SignatureEditDialog;