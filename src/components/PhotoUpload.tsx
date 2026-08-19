"use client";

import { useState, useRef } from "react";
import { Icons } from "@/components/icons";

/**
 * Lets the user pick an image from their computer. The file is resized in the
 * browser to a compact JPEG data URL and stored in a hidden input (`name`), so
 * it saves with the form without needing external file storage.
 */
export function PhotoUpload({ name = "imageUrl", defaultValue = "" }: { name?: string; defaultValue?: string }) {
  const [preview, setPreview] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")?.drawImage(img, 0, 0, w, h);
        setPreview(canvas.toDataURL("image/jpeg", 0.72));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  return (
    <div>
      <input type="hidden" name={name} value={preview} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative flex h-52 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-lg bg-gray-100 text-gray-400 hover:bg-gray-200"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Property" className="h-full w-full object-cover" />
        ) : (
          Icons.building({ className: "h-12 w-12 text-gray-300" })
        )}
        <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded bg-black/50 px-2 py-1 text-xs text-white">
          {Icons.downloads({ className: "h-4 w-4" })} {preview ? "Change photo" : "Upload photo"}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
    </div>
  );
}
