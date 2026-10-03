"use client";

/* eslint-disable @next/next/no-img-element -- A local object URL must use the browser's native decode and error events. */

import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, ImageUp, X } from "lucide-react";
import { Button } from "./Button";

const maximumBytes = 5 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

type ImageFileInputProps = {
  id: string;
  label: string;
  disabled?: boolean;
  onChange?: (file: File | null) => void;
};

type ImageSelection = {
  file: File;
  previewUrl: string;
  decodeFailed: boolean;
};

function formatFileSize(size: number): string {
  const kilobytes = size / 1024;
  const value = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(kilobytes);
  return `${value} KB`;
}

export function ImageFileInput({ id, label, disabled = false, onChange }: ImageFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [selection, setSelection] = useState<ImageSelection | null>(null);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;
    input.value = "";

    if (!file) {
      return;
    }

    if (!acceptedTypes.has(file.type)) {
      setError("Choose a JPEG, PNG or WebP image.");
      return;
    }

    if (file.size > maximumBytes) {
      setError("Choose an image smaller than 5 MiB.");
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current = previewUrl;
    setSelection({ file, previewUrl, decodeFailed: false });
    setError("");
    onChange?.(file);
  }

  function handleRemove() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setSelection(null);
    setError("");
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.focus();
    }
    onChange?.(null);
  }

  function handleDecodeFailure() {
    setSelection((current) => current ? { ...current, decodeFailed: true } : current);
    setError("This image could not be opened. Choose another image.");
  }

  return (
    <section className="image-input" aria-labelledby={`${id}-heading`}>
      <div className="image-input-heading">
        <h3 id={`${id}-heading`}>{label}</h3>
        <p>JPEG, PNG or WebP. Maximum 5 MiB.</p>
      </div>

      <label className="image-choose-control" htmlFor={id} aria-disabled={disabled}>
        <span className="image-choose-icon" aria-hidden="true">
          {selection ? <ImageUp size={18} /> : <ImagePlus size={18} />}
        </span>
        <span id={`${id}-action-label`}>{selection ? "Choose another image" : "Choose image"}</span>
        <input
          ref={inputRef}
          className="image-file-input"
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          aria-labelledby={`${id}-heading ${id}-action-label`}
          aria-describedby={`${id}-help`}
          disabled={disabled}
          onChange={handleChange}
        />
      </label>
      <p className="sr-only" id={`${id}-help`}>JPEG, PNG or WebP. Maximum 5 MiB.</p>

      {selection ? (
        <div className="image-selection">
          <div className="image-preview-frame">
            {selection.decodeFailed ? (
              <div className="image-preview-failed" role="img" aria-label="Image preview could not be opened">
                <ImageUp aria-hidden="true" size={24} />
                <span>Preview unavailable</span>
              </div>
            ) : (
              <img className="image-preview" src={selection.previewUrl} alt="Selected local image preview" onError={handleDecodeFailure} />
            )}
          </div>
          <div className="image-selection-meta">
            <p className="image-file-name">{selection.file.name}</p>
            <p className="supporting-copy">{formatFileSize(selection.file.size)}</p>
            <Button variant="quiet" disabled={disabled} onClick={handleRemove}>
              <X aria-hidden="true" size={16} />
              <span>Remove image</span>
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="image-input-error" role="alert">{error}</p> : null}
    </section>
  );
}
