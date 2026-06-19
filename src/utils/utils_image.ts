/**
 * utils/utils_image.ts
 * Сжатие изображения в data URL (для отправки эскиза/чека на сервер).
 */

/**
 * Читает картинку, ужимает до maxDim по большей стороне и возвращает JPEG data URL.
 */
export async function compressImageToDataUrl(
  file: File,
  maxDim = 1000,
  quality = 0.6
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width >= height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > width && height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas context'));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('image load error'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('file read error'));
    reader.readAsDataURL(file);
  });
}
