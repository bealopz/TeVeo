import React, { useRef, useEffect, useState, useCallback } from 'react';
import Button from './Button';
import { ComicPanel } from '../types';
import { PANEL_WIDTH, PANEL_HEIGHT, CAPTION_HEIGHT, COMIC_PADDING, PLACEHOLDER_IMAGE_URL, DEFAULT_PANEL_COUNT } from '../constants';

interface ComicStripProps {
  panels: ComicPanel[];
  comicTitle?: string;
  onDownloadReady: (dataUrl: string) => void;
  loading?: boolean;
}

const ComicStrip: React.FC<ComicStripProps> = ({ panels, comicTitle = "Mi Cómic", onDownloadReady, loading }) => {
  // This canvas is used for generating the *downloadable* single image.
  // It won't be directly displayed in the UI, but will be in the DOM.
  const hiddenCanvasRef = useRef<HTMLCanvasElement>(null);
  const [downloadLink, setDownloadLink] = useState<string | null>(null);

  const drawComicForDownload = useCallback(async () => {
    if (!hiddenCanvasRef.current || panels.length === 0) {
      return;
    }

    const canvas = hiddenCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate dimensions for the downloadable strip (single row)
    const numPanels = panels.length;
    const totalWidth = numPanels * PANEL_WIDTH + (numPanels - 1) * COMIC_PADDING + 2 * COMIC_PADDING;
    const totalHeight = PANEL_HEIGHT + CAPTION_HEIGHT + 2 * COMIC_PADDING;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    ctx.fillStyle = '#f9fafb'; // A light gray background for the strip
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    ctx.font = '20px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';

    let currentX = COMIC_PADDING;

    for (const panel of panels) {
      const img = new Image();
      img.src = panel.imageBase64 ? `data:image/png;base64,${panel.imageBase64}` : PLACEHOLDER_IMAGE_URL;

      await new Promise<void>((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, currentX, COMIC_PADDING, PANEL_WIDTH, PANEL_HEIGHT);
          // Draw caption
          ctx.fillText(panel.caption, currentX + PANEL_WIDTH / 2, COMIC_PADDING + PANEL_HEIGHT + CAPTION_HEIGHT / 2 + 10); // Adjust Y for caption
          currentX += PANEL_WIDTH + COMIC_PADDING;
          resolve();
        };
        img.onerror = () => {
          console.error("Failed to load image for panel:", panel.caption);
          // Draw a fallback rectangle and text if image fails to load
          ctx.fillStyle = '#e0e0e0';
          ctx.fillRect(currentX, COMIC_PADDING, PANEL_WIDTH, PANEL_HEIGHT);
          ctx.fillStyle = '#666';
          ctx.fillText('Error cargando imagen', currentX + PANEL_WIDTH / 2, COMIC_PADDING + PANEL_HEIGHT / 2);
          // Draw caption even if image fails
          ctx.fillStyle = '#333';
          ctx.fillText(panel.caption, currentX + PANEL_WIDTH / 2, COMIC_PADDING + PANEL_HEIGHT + CAPTION_HEIGHT / 2 + 10);
          currentX += PANEL_WIDTH + COMIC_PADDING;
          resolve();
        };
      });
    }

    const dataUrl = canvas.toDataURL('image/png');
    setDownloadLink(dataUrl);
    onDownloadReady(dataUrl);
  }, [panels, onDownloadReady]);

  useEffect(() => {
    if (panels.length > 0 && !loading) {
      drawComicForDownload();
    }
  }, [panels, drawComicForDownload, loading]);

  const handleDownload = () => {
    if (downloadLink) {
      const link = document.createElement('a');
      link.href = downloadLink;
      link.download = `${comicTitle.replace(/\s/g, '_')}_comic.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const loadingPanels = Array(DEFAULT_PANEL_COUNT).fill(0); // Use DEFAULT_PANEL_COUNT for placeholders

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl border border-gray-200 flex flex-col items-center justify-center space-y-4 text-center overflow-x-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Tu Cómic Generado</h2>
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 w-full max-w-2xl">
          {loadingPanels.map((_, index) => (
            <div key={index} className="flex flex-col items-center justify-center bg-gray-100 rounded-lg p-4 h-[300px] border border-gray-200 shadow-sm animate-pulse" role="status" aria-label={`Cargando viñeta ${index + 1}`}>
              <svg className="animate-spin h-8 w-8 text-blue-500 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-600 text-sm">Cargando viñeta {index + 1}...</p>
            </div>
          ))}
          <p className="text-gray-700 text-lg mt-4 col-span-full">Creando las viñetas del cómic...</p>
          <p className="text-gray-500 text-sm col-span-full">Esto puede tardar unos momentos.</p>
        </div>
      ) : (
        panels.length > 0 && (
          <>
            {/* Display individual panels in a grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-4 w-full max-w-2xl" role="region" aria-label="Cómic Generado">
              {panels.map((panel, index) => (
                <div key={index} className="flex flex-col items-center border border-gray-300 rounded-lg overflow-hidden shadow-md bg-gray-50 p-2">
                  <img
                    src={panel.imageBase64 ? `data:image/png;base64,${panel.imageBase64}` : PLACEHOLDER_IMAGE_URL}
                    alt={`Panel ${index + 1}`}
                    className="w-full h-auto object-cover rounded-md max-h-[250px] md:max-h-[300px]"
                    style={{ aspectRatio: '1/1' }} // Ensure square aspect ratio for consistency
                  />
                  <p className="text-center text-gray-700 text-sm mt-2 p-1 font-semibold" aria-label={`Caption for panel ${index + 1}: ${panel.caption}`}>{panel.caption}</p>
                </div>
              ))}
            </div>
            {/* Hidden canvas for generating the downloadable image */}
            <canvas ref={hiddenCanvasRef} className="hidden" aria-hidden="true"></canvas>

            <Button onClick={handleDownload} disabled={!downloadLink} className="mt-4">
              Descargar Cómic (.png)
            </Button>
          </>
        )
      )}
    </div>
  );
};

export default ComicStrip;