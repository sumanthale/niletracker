import { createContext, useContext, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

const ScreenshotContext = createContext({
  captureScreenshot: async () => null
});

export const ScreenshotProvider = ({ children }) => {
  const videoRef = useRef(document.createElement('video'));

  const captureScreenshot = useCallback(async () => {
    try {
      const sources = await window.electron.getScreenSources();
      if (!sources || sources.length === 0) {
        console.error('No screen sources found');
        return null;
      }

      // Randomly pick one screen source
      const screenSource = sources[Math.floor(Math.random() * sources.length)];

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: screenSource.id,
            minWidth: 1280,
            minHeight: 720,
            maxWidth: 1920,
            maxHeight: 1080
          }
        }
      });

      return new Promise((resolve) => {
        const video = videoRef.current;

        video.onloadedmetadata = () => {
          video.play();
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const dataUrl = canvas.toDataURL('image/png');
            resolve(dataUrl);
          } else {
            resolve(null);
          }

          // Clean up
          video.pause();
          video.srcObject = null;
          stream.getTracks().forEach((track) => track.stop());
        };

        video.srcObject = stream;
      });
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      return null;
    }
  }, []);

  return (
    <ScreenshotContext.Provider value={{ captureScreenshot }}>
      {children}
    </ScreenshotContext.Provider>
  );
};

ScreenshotProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useScreenshot = () => useContext(ScreenshotContext);
