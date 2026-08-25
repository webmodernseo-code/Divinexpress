'use client';

import { useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';

interface SignatureResponse {
  cloudName: string;
  apiKey: string;
  timestamp: string;
  folder: string;
  signature: string;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * Uploads product images directly to Cloudinary using a server-signed request
 * (the API secret never reaches the browser). Up to `max` images; previews with
 * remove. Emits the full list of URLs via `onChange`.
 */
export function ImageUploader({
  value,
  max = 6,
  onChange,
  labels,
  purpose = 'products',
}: {
  value: string[];
  max?: number;
  onChange: (urls: string[]) => void;
  labels: { add: string; uploading: string; remove: string; hint?: string; sizeHint?: string; more?: string; error?: string };
  purpose?: 'products' | 'promotions';
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function uploadOne(file: File): Promise<string> {
    const sigRes = await fetch('/api/admin/upload-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose }),
    });
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
    const withinSize = Array.from(files).filter((file) => file.size <= MAX_FILE_BYTES);
    const selected = withinSize.slice(0, remaining);
    if (selected.length === 0) {
      if (withinSize.length < files.length) setError('size');
      return;
    }

    setUploading(true);
    setError(withinSize.length < files.length ? 'size' : null);
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
      {value.length === 0 ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(event) => { event.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            handleFiles(event.dataTransfer.files);
          }}
          disabled={uploading}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-10 text-center transition disabled:opacity-60 ${
            dragOver ? 'border-black bg-neutral-50' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
          }`}
        >
          <ImagePlus className="size-6 text-slate-400" />
          <span className="text-sm font-bold text-slate-700">
            {uploading ? labels.uploading : labels.add}
          </span>
          {labels.hint && <span className="text-xs text-admin-muted">{labels.hint}</span>}
          {labels.sizeHint && <span className="text-[11px] text-slate-400">{labels.sizeHint}</span>}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            {value.map((url, index) => (
              <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-admin-border bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => onChange(value.filter((_, position) => position !== index))}
                  aria-label={labels.remove}
                  className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-black/70 text-white hover:bg-black"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
          {value.length < max && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:border-slate-300 hover:bg-slate-50/50 disabled:opacity-60"
            >
              <ImagePlus className="size-3.5" />
              {uploading ? labels.uploading : (labels.more ?? labels.add)}
            </button>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        data-testid="image-uploader-input"
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(event) => handleFiles(event.target.files)}
      />
      {error === 'size' && <p className="mt-1.5 text-xs text-admin-error">{labels.sizeHint ?? '5MB max'}</p>}
      {error === 'upload' && <p className="mt-1.5 text-xs text-admin-error">{labels.error ?? 'Error'}</p>}
    </div>
  );
}
