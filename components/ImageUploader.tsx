import React, { useState, useCallback } from 'react';
import Button from './Button';

interface ImageUploaderProps {
  onImageUpload: (imageBase64: string, filename: string, mimeType: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload }) => {
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile && imagePreview) {
      // Extract base64 part and mimeType
      const [mimePart, base64Data] = imagePreview.split(',');
      const mimeType = mimePart.split(':')[1].split(';')[0];
      onImageUpload(base64Data, selectedFile.name, mimeType);
    }
  };

  return (
    <div
      className="bg-white p-6 rounded-lg shadow-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center space-y-4 text-center md:min-h-[400px] min-h-[300px]"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <h2 className="text-2xl font-bold text-gray-800">Cargar Imagen</h2>
      <p className="text-gray-600 mb-4">Arrastra y suelta una imagen aquí, o haz click para seleccionarla.</p>

      {imagePreview && (
        <div className="mb-4 max-w-xs md:max-w-sm lg:max-w-md">
          <img src={imagePreview} alt="Vista previa de la imagen" className="max-w-full h-auto rounded-md shadow-md" />
          <p className="text-sm text-gray-500 mt-2">{selectedFile?.name}</p>
        </div>
      )}

      <input
        type="file"
        id="file-upload"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex flex-col md:flex-row gap-4">
        <Button
          onClick={triggerFileUpload}
          variant="secondary"
          className={`${dragActive ? 'border-blue-500 bg-blue-50' : ''}`}
        >
          Seleccionar archivo
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!selectedFile}
          className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
        >
          Usar esta imagen
        </Button>
      </div>

      {dragActive && (
        <div className="absolute top-0 left-0 w-full h-full bg-blue-500 bg-opacity-10 pointer-events-none flex items-center justify-center">
          <p className="text-xl font-semibold text-blue-800">Suelta tu imagen aquí</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
