import React from 'react';
import Button from './Button';
import { PLACEHOLDER_IMAGE_URL } from '../constants';

interface ImageViewerProps {
  imageBase64: string;
  filename: string;
  mimeType: string;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ imageBase64, filename, mimeType }) => {
  const imageUrl = `data:${mimeType};base64,${imageBase64}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200 flex flex-col items-center justify-center space-y-4 text-center md:min-h-[400px]">
      <h2 className="text-2xl font-bold text-gray-800">Imagen Cargada</h2>
      <div className="max-w-xs md:max-w-sm lg:max-w-md">
        <img
          src={imageBase64 ? imageUrl : PLACEHOLDER_IMAGE_URL}
          alt={filename || "Imagen cargada"}
          className="max-w-full h-auto rounded-md shadow-md border border-gray-100"
        />
        <p className="text-sm text-gray-500 mt-2">{filename}</p>
      </div>
      <Button onClick={handleDownload} variant="secondary">
        Descargar Imagen
      </Button>
    </div>
  );
};

export default ImageViewer;
