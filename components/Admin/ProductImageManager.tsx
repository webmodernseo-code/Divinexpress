// components/Admin/ProductImageManager.tsx
'use client';

import { useRef, useState } from 'react';
import {
  getCloudinarySignatureAction,
  attachProductImage,
  removeProductImage,
  reorderProductImages
} from '@/app/admin/(dashboard)/produits/imageActions';
import styles from './ProductImageManager.module.css';

type ProductImage = { id: string; url: string; alt: string; position: number };

export function ProductImageManager({
  productId,
  initialImages
}: {
  productId: string;
  initialImages: ProductImage[];
}) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const dragOriginRef = useRef<ProductImage[] | null>(null);
  const droppedRef = useRef(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || busy) return;

    setBusy(true);
    setUploading(true);
    setError(null);
    try {
      const signature = await getCloudinarySignatureAction();
      const body = new FormData();
      body.append('file', file);
      body.append('api_key', signature.apiKey);
      body.append('timestamp', String(signature.timestamp));
      body.append('signature', signature.signature);
      body.append('folder', signature.folder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, {
        method: 'POST',
        body
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      const uploaded: { secure_url: string; public_id: string } = await response.json();
      const created = await attachProductImage(productId, {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        alt: ''
      });
      setImages((current) => [...current, created]);
    } catch {
      setError("L'envoi de la photo a échoué, réessayez.");
    } finally {
      setUploading(false);
      setBusy(false);
    }
  }

  async function handleRemove(imageId: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    const previous = images;
    setImages((current) => current.filter((img) => img.id !== imageId));
    try {
      await removeProductImage(imageId);
    } catch {
      setImages(previous);
      setError('La suppression de la photo a échoué, réessayez.');
    } finally {
      setBusy(false);
    }
  }

  function handleDragStart(index: number) {
    if (busy) return;
    dragOriginRef.current = images;
    droppedRef.current = false;
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    if (busy || dragIndex === null || dragIndex === index) return;
    setImages((current) => {
      const next = [...current];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  }

  async function handleDrop() {
    if (busy) {
      setDragIndex(null);
      return;
    }
    droppedRef.current = true;
    setDragIndex(null);
    setBusy(true);
    setError(null);
    const origin = dragOriginRef.current;
    try {
      await reorderProductImages(
        productId,
        images.map((img) => img.id)
      );
    } catch {
      if (origin) setImages(origin);
      setError('Le réordonnancement des photos a échoué, réessayez.');
    } finally {
      dragOriginRef.current = null;
      setBusy(false);
    }
  }

  function handleDragEnd() {
    if (!droppedRef.current && dragOriginRef.current) {
      setImages(dragOriginRef.current);
    }
    dragOriginRef.current = null;
    setDragIndex(null);
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Photos</h2>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.grid}>
        {images.map((image, index) => (
          <div
            key={image.id}
            draggable={!busy}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
            className={styles.imageCard}
          >
            <img src={image.url} alt={image.alt} className={styles.image} />
            <button type="button" onClick={() => handleRemove(image.id)} disabled={busy} className={styles.removeButton}>
              Supprimer
            </button>
          </div>
        ))}
      </div>
      <label className={styles.uploadButton}>
        {uploading ? 'Envoi en cours…' : '+ Ajouter une photo'}
        <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading || busy} hidden />
      </label>
    </section>
  );
}
