import { useState, useCallback, useRef, type ChangeEvent } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Button } from "../common/Button";
import { apiRequest } from "../../services/api";

interface AvatarUploadModalProps {
  onClose: () => void;
  onSuccess: (url: string) => void;
}

export function AvatarUploadModal({ onClose, onSuccess }: AvatarUploadModalProps) {
  const [image, setImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => setImage(reader.result as string));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getCroppedImg = async (): Promise<Blob | null> => {
    if (!image || !croppedAreaPixels) return null;

    const canvas = document.createElement("canvas");
    const img = new Image();
    img.src = image;

    await new Promise((resolve) => (img.onload = resolve));

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = 400; // Standardize to 400x400
    canvas.height = 400;

    ctx.drawImage(
      img,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      400,
      400
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/webp", 0.8);
    });
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      setError(null);

      const blob = await getCroppedImg();
      if (!blob) throw new Error("Failed to process image");

      const formData = new FormData();
      formData.append("avatar", blob, "avatar.webp");

      const response = await apiRequest<{ profile_picture_url: string }>("/api/users/avatar", {
        method: "POST",
        body: formData,
        isFormData: true,
      });

      onSuccess(response.profile_picture_url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-upload-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Profile Picture</h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {!image ? (
            <div className="upload-placeholder" onClick={() => fileInputRef.current?.click()}>
              <span className="upload-icon">📷</span>
              <p>Click to select a photo</p>
            </div>
          ) : (
            <div className="cropper-container">
              <Cropper
                image={image}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            style={{ display: "none" }}
          />

          {image && (
            <div className="cropper-controls">
              <label>Zoom</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </div>
          )}

          {error && <p className="error-text">{error}</p>}
        </div>

        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!image || isUploading}
          >
            {isUploading ? "Uploading..." : "Save Profile Picture"}
          </Button>
        </div>
      </div>
    </div>
  );
}
