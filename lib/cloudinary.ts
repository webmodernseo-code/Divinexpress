import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const UPLOAD_FOLDER = 'divinexpress/products';

export function getUploadSignature(): {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
} {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: UPLOAD_FOLDER },
    process.env.CLOUDINARY_API_SECRET ?? ''
  );
  return {
    timestamp,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    folder: UPLOAD_FOLDER
  };
}

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Failed to delete Cloudinary image', publicId, err);
  }
}
