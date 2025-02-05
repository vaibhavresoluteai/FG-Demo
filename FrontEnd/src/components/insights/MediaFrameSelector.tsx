import React, { useRef, useState, useEffect } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useCreateAreaCoordinatesMutation } from "../../store/api/areaCoordinates";
import { Crop } from "react-image-crop";

interface MediaFrameSelectorProps {
  fileURL: string | null;
  isVideo: boolean;
  setCapturedFrame: (frame: string | null) => void;
}

const MediaFrameSelector: React.FC<MediaFrameSelectorProps> = ({ fileURL, isVideo, setCapturedFrame }) => {
  const [createCoordinatesMutation, { isLoading }] = useCreateAreaCoordinatesMutation();
  const [capturedFrame, setLocalCapturedFrame] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    x: 30,
    y: 30,
    width: 25,
    height: 25,
  });
  const [cropCoordinates, setCropCoordinates] = useState<any>(null);
  const [coordinatesSent, setCoordinatesSent] = useState(false);
  const [isRegionConfirmed, setIsRegionConfirmed] = useState(false);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (fileURL && !isVideo) {
      setLocalCapturedFrame(fileURL);
      setCapturedFrame(capturedFrame);
    }
  }, [fileURL, isVideo]);

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameData = canvas.toDataURL("image/png");
        setLocalCapturedFrame(frameData);
        setCapturedFrame(frameData);
        setIsModalOpen(true);
      }
    }
  };

  const onCropComplete = (crop: Crop) => {
    if (crop.width && crop.height && imgRef.current) {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.clientWidth;
      const scaleY = image.naturalHeight / image.clientHeight;
  
      // Ensure crop stays within bounds
      const x = Math.max(0, Math.min(image.naturalWidth, crop.x * scaleX));
      const y = Math.max(0, Math.min(image.naturalHeight, crop.y * scaleY));
      const width = Math.max(1, Math.min(image.naturalWidth - x, crop.width * scaleX));
      const height = Math.max(1, Math.min(image.naturalHeight - y, crop.height * scaleY));
  
      setCropCoordinates({
        p1: [x, y],
        p2: [x + width, y],
        p3: [x, y + height],
        p4: [x + width, y + height],
      });
    }
  };

  const sendCoordinates = () => {
    if (isLoading || coordinatesSent) return;

    createCoordinatesMutation(cropCoordinates);
    setCoordinatesSent(true);
    setIsRegionConfirmed(true);

    // Preserve the crop after confirmation
    setCrop((prevCrop) => ({ ...prevCrop }));

    setIsModalOpen(false);
  };

  return (
    <div className="p-4 flex flex-col items-center w-full">
      <div className="flex justify-center items-center gap-8 w-full max-w-6xl">
        {isVideo && fileURL && (
          <div className="flex flex-col justify-center items-center w-full max-w-md">
            <h2 className="text-xl font-semibold mb-2 self-start">Video Preview:</h2>
            <video ref={videoRef} src={fileURL} controls className="h-auto w-full object-contain border rounded-lg" />
            {!isRegionConfirmed && (
              <button onClick={captureFrame} className="mt-2 px-4 py-2 text-lg bg-blue-500 text-white rounded hover:bg-blue-600">
                Capture Frame
              </button>
            )}
          </div>
        )}

        {capturedFrame && !isRegionConfirmed && (
          <div className="flex flex-col justify-center items-center w-full">
            <h2 className="text-xl font-semibold mb-2 self-start">Captured Frame:</h2>
            <img src={capturedFrame} alt="Captured" className="w-full h-auto object-contain border rounded-lg" />
            <button onClick={() => setIsModalOpen(true)} className="mt-2 px-4 py-2 text-lg bg-gray-500 text-white rounded hover:bg-gray-600">
              Select Region
            </button>
          </div>
        )}

        {isRegionConfirmed && capturedFrame && (
          <div className="flex flex-col justify-center items-center w-full">
            <h2 className="text-xl font-semibold mb-2 self-start">Region Confirmed:</h2>
            <ReactCrop crop={crop} onChange={setCrop} onComplete={onCropComplete} disabled={coordinatesSent}>
              <img ref={imgRef} src={capturedFrame} alt="To crop" className="w-full h-auto object-contain border rounded-lg" />
            </ReactCrop>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {isModalOpen && !isRegionConfirmed && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full overflow-auto">
            <h2 className="text-xl font-semibold mb-4">Select Region</h2>
            <ReactCrop crop={crop} onChange={setCrop} onComplete={onCropComplete} disabled={coordinatesSent}>
              <img ref={imgRef} src={capturedFrame!} alt="To crop" className="w-full h-auto object-contain border rounded-lg" />
            </ReactCrop>
            <div className="flex justify-end gap-4 mt-4">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Cancel
              </button>
              <button
                onClick={sendCoordinates}
                className={`px-4 py-2 text-white rounded ${coordinatesSent ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}`}
                disabled={coordinatesSent}
              >
                {coordinatesSent ? "Region Selected" : isLoading ? "Sending..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaFrameSelector;
