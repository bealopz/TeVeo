import React, { useState, useCallback } from 'react';
import ImageUploader from './components/ImageUploader';
import ImageViewer from './components/ImageViewer';
import ComicStrip from './components/ComicStrip';
import Button from './components/Button';
import { generateComicPrompts, generateImageFromPrompt } from './services/geminiService';
import { UploadedImage, ComicPanel, AppView } from './types';
import { DEFAULT_PANEL_COUNT } from './constants';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.UPLOAD);
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null);
  const [uploadedImageMimeType, setUploadedImageMimeType] = useState<string | null>(null);
  const [comicPanels, setComicPanels] = useState<ComicPanel[]>([]);
  const [comicDownloadDataUrl, setComicDownloadDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = useCallback((base64: string, filename: string, mimeType: string) => {
    setUploadedImage({ base64, filename });
    setUploadedImageMimeType(mimeType);
    setView(AppView.PREVIEW);
    setError(null);
  }, []);

  const handleGenerateComic = useCallback(async () => {
    if (!uploadedImage || !uploadedImageMimeType) {
      setError("No hay imagen cargada para generar el cómic.");
      return;
    }

    setLoading(true);
    setError(null);
    setComicPanels([]);
    setComicDownloadDataUrl(null);

    try {
      // Step 1: Generate comic prompts (story outline and image descriptions)
      const panelPrompts = await generateComicPrompts(
        uploadedImage.base64,
        uploadedImageMimeType,
        DEFAULT_PANEL_COUNT
      );

      if (!panelPrompts || panelPrompts.length === 0) {
        throw new Error("El modelo no pudo generar las descripciones para las viñetas del cómic.");
      }

      // Step 2: Generate images for each panel
      const generatedPanels: ComicPanel[] = [];
      for (const prompt of panelPrompts) {
        const imageBase64 = await generateImageFromPrompt(prompt.imagePrompt);
        generatedPanels.push({
          caption: prompt.caption,
          imageBase64: imageBase64,
        });
      }

      setComicPanels(generatedPanels);
      setView(AppView.COMIC);
    } catch (err) {
      console.error("Error al generar el cómic:", err);
      setError(`Error al generar el cómic: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [uploadedImage, uploadedImageMimeType]);

  const handleNewImage = useCallback(() => {
    setUploadedImage(null);
    setUploadedImageMimeType(null);
    setComicPanels([]);
    setComicDownloadDataUrl(null);
    setLoading(false);
    setError(null);
    setView(AppView.UPLOAD);
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-extrabold text-center text-blue-700 mb-8 drop-shadow-md">
        Teseo - Generador de Cómics
      </h1>

      <div className="w-full mx-auto p-4 bg-white rounded-xl shadow-2xl border border-gray-100 mb-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">¡Error! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {view === AppView.UPLOAD && (
          <ImageUploader onImageUpload={handleImageUpload} />
        )}

        {view === AppView.PREVIEW && uploadedImage && uploadedImageMimeType && (
          <div className="flex flex-col gap-6">
            <ImageViewer
              imageBase64={uploadedImage.base64}
              filename={uploadedImage.filename}
              mimeType={uploadedImageMimeType}
            />
            <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
              <Button onClick={handleGenerateComic} loading={loading}>
                Generar Cómic
              </Button>
              <Button onClick={handleNewImage} variant="secondary">
                Cargar Nueva Imagen
              </Button>
            </div>
          </div>
        )}

        {view === AppView.COMIC && (
          <div className="flex flex-col gap-6">
            <ComicStrip
              panels={comicPanels}
              onDownloadReady={setComicDownloadDataUrl}
              loading={loading}
            />
            <div className="flex justify-center mt-4">
              <Button onClick={handleNewImage} variant="secondary">
                Cargar Nueva Imagen
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;