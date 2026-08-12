'use client';

import { useRef, useState } from 'react';

interface SignatureResponse {
  cloudName: string;
  apiKey: string;
  timestamp: string;
  folder: string;
  signature: string;
}

/**
 * Uploads product images directly to Cloudinary using a server-signed request
 * (the API secret never reaches the browser). Up to `max` images; previews with
 * remove. Emits the full list of URLs via `onChange`.
 */
export function ImageUploader({
  value,
  max = 6,
  onChange,
  labels
}: {
  value: string[];
  max?: number;
  onChange: (urls: string[]) => void;
  labels: { add: string; uploading: string; remove: string };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadOne(file: File): Promise<string> {
    const sigRes = await fetch('/api/admin/upload-signature', { method: 'POST' });
    if (!sigRes.ok) throw new Error('signature failed');
    const sig = (await sigRes.json()) as SignatureResponse;

    const form = new FormData();
    form.append('file', file);
    form.append('api_key', sig.apiKey);
    form.append('timestamp', sig.timestamp);
    form.append('folder', sig.folder);
    form.append('signature', sig.signature);

    const upRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
      method: 'POST',
      body: form
    });
    if (!upRes.ok) throw new Error('upload failed');
    const up = (await upRes.json()) as { secure_url: string };
    return up.secure_url;
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = max - value.length;
    const selected = Array.from(files).slice(0, remaining);
    if (selected.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const file of selected) {
        urls.push(await uploadOne(file));
      }
      onChange([...value, ...urls]);
    } catch {
      setError('upload');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((url, index) => (
          <div key={url} className="relative size-16 overflow-hidden rounded-lg border border-admin-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="size-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, position) => position !== index))}
              aria-label={labels.remove}
              className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-black/70 text-[11px] text-white"
            >
              ×
            </button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="grid size-16 place-items-center rounded-lg border border-dashed border-admin-border text-xs text-admin-muted disabled:opacity-60"
          >
            {uploading ? labels.uploading : labels.add}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        data-testid="image-uploader-input"
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => handleFiles(event.target.files)}
      />
      {error && <p className="mt-1 text-xs text-admin-danger">{error}</p>}
    </div>
  );
}
