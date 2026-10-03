"use client";
import { ImageFileInput } from "../components/ImageFileInput";
import { SandboxScene } from "../components/SandboxScene";

export function AssetsSandbox() {
  return <SandboxScene title="A local image, for your eyes only." description="Preview a JPEG, PNG or WebP here. The image stays in this browser and is never uploaded.">
    <ImageFileInput id="asset-image" label="Choose a local image" />
  </SandboxScene>;
}
