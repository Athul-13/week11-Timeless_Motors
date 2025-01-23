import { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { RotateCw, Maximize, X, Check } from 'lucide-react';

const ImageCropper = ({ image, onSave, onCancel }) => {
  const [crop, setCrop] = useState();
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const imgRef = useRef(null);

  function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        aspect,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
  }

  function onImageLoad(e) {
    const { width, height } = e.currentTarget;
    const crop = centerAspectCrop(width, height, 16 / 9);
    setCrop(crop);
  }

  function rotateImage() {
    setRotation((prev) => (prev + 90) % 360);
  }

  const getCroppedImg = () => {
    const canvas = document.createElement('canvas');
    const image = imgRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const ctx = canvas.getContext('2d');

    // Calculate dimensions after rotation
    const isRotated90Or270 = rotation === 90 || rotation === 270;
    canvas.width = isRotated90Or270 
      ? crop.height * scaleY 
      : crop.width * scaleX;
    canvas.height = isRotated90Or270 
      ? crop.width * scaleX 
      : crop.height * scaleY;

    // Move to center and rotate
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Draw the cropped image
    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 1);
    });
  };

  const handleSave = async () => {
    if (!crop) return;
    const croppedBlob = await getCroppedImg();
    onSave(croppedBlob);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-4 max-w-4xl w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Edit Image</h3>
          <button 
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative max-h-[60vh] overflow-auto">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            aspect={16 / 9}
          >
            <img
              ref={imgRef}
              src={typeof image === 'string' ? image : URL.createObjectURL(image)}
              alt="Edit"
              style={{ 
                transform: `rotate(${rotation}deg) scale(${scale})`,
                maxWidth: '100%',
                maxHeight: '60vh'
              }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex gap-4">
            <button
              onClick={rotateImage}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200"
            >
              <RotateCw size={16} />
              Rotate
            </button>
            <div className="flex items-center gap-2">
              <Maximize size={16} />
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-24"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Check size={16} />
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageCropper;