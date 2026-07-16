import styles from './Gallery.module.css';

export function Gallery({ images }: { images: { url: string; alt: string }[] }) {
  if (images.length === 0) {
    return (
      <div className={styles.grid}>
        <div className={styles.placeholder}>Photo</div>
      </div>
    );
  }

  return (
    <div className={styles.grid}>
      {images.map((image) => (
        <img key={image.url} src={image.url} alt={image.alt} className={styles.image} />
      ))}
    </div>
  );
}
