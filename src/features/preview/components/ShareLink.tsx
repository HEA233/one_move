"use client";

import { useId, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { isAbsoluteWebUrl, isLocalPreviewUrl } from "../format";
import { Button } from "./Button";

type ShareLinkProps = { url: string };

export function ShareLink({ url }: ShareLinkProps) {
  const [copyMessage, setCopyMessage] = useState("");
  const fieldId = useId();

  if (!isAbsoluteWebUrl(url)) {
    return <p className="share-link-error" role="alert">Provide an absolute HTTP or HTTPS URL.</p>;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopyMessage("Link copied");
    } catch {
      setCopyMessage("Copy failed. Select and copy the link above.");
    }
  }

  return (
    <div className="share-link">
      <div className="share-link-controls">
        <div className="share-link-field">
          <label htmlFor={fieldId}>Preview link</label>
          <textarea id={fieldId} rows={2} readOnly value={url} />
        </div>
        <Button variant="secondary" onClick={copyLink}>Copy link</Button>
        <p className="share-link-status" aria-live="polite">{copyMessage}</p>
        {isLocalPreviewUrl(url) ? (
          <p className="share-link-local">Local preview. This address will not open on another device.</p>
        ) : null}
      </div>
      <div className="share-link-qr">
        <QRCodeSVG
          value={url}
          size={160}
          marginSize={4}
          bgColor="#FFFDF8"
          fgColor="#25251F"
          title={`QR code for ${url}`}
        />
        <p>QR generated in this browser</p>
      </div>
    </div>
  );
}
