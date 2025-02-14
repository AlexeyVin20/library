"use client";

import React, { useState } from "react";

interface FileUploadProps {
  type: "image" | "video";
  accept: string;
  placeholder: string;
  onFileChange: (filePath: string) => void;
  value?: string;
}

const FileUpload = ({ type, accept, placeholder, onFileChange, value }: FileUploadProps) => {
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      // Генерируем временный URL для предпросмотра
      const url = URL.createObjectURL(file);
      onFileChange(url);
    }
  };

  return (
    <div>
      <input type="file" accept={accept} onChange={handleFileChange} />
      {fileName && <p>{fileName}</p>}
      {value && (
        <div className="mt-2">
          {type === "image" ? (
            <img src={value} alt="Загруженное изображение" className="max-w-full h-auto" />
          ) : (
            <video src={value} controls className="max-w-full h-auto" />
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
