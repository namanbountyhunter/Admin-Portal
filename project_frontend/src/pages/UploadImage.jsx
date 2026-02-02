import React, { useState } from "react";
import axios from "axios";

const UploadImage = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setMessage("");
    setUploadedImageUrl(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      setUploading(true);
      const response = await axios.post(
        "http://127.0.0.1:8000/api/upload-image/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const fullUrl= new URL(response.data.image_url,window.location.origin).href;
      const relativeUrl=response.data.relative_url;

      if (fullUrl && relativeUrl) {
        setMessage("Upload successful!");
        setUploadedImageUrl(fullUrl);
        onUploadSuccess && onUploadSuccess(response.data.image_url);
      } else {
        setMessage("Upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("An error occurred while uploading.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ margin: "1rem 0" }}>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {uploading && <p>Uploading...</p>}
      {message && <p>{message}</p>}

      {uploadedImageUrl && (
        <div style={{ marginTop: "1rem" }}>
          <p>Image Preview:</p>
          <img
            src={uploadedImageUrl}
            alt="Uploaded"
            style={{ maxWidth: "300px", borderRadius: "8px" }}
          />
        </div>
      )}
    </div>
  );
};

export default UploadImage;
