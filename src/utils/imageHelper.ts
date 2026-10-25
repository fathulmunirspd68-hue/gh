export interface ImageProcessOptions {
  maxWidth: number;
  maxHeight: number;
  preserveAlpha?: boolean;
  cropPortrait?: boolean;
  quality?: number;
}

const MAX_RAW_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Reads, validates, and resizes/compresses an uploaded image file on the client
 * so logos and student photos remain sharp while staying lightweight in localStorage.
 */
export function processImageFile(
  file: File,
  options: ImageProcessOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Format berkas harus berupa gambar (PNG, JPG, WEBP, atau SVG).'));
      return;
    }

    if (file.size > MAX_RAW_FILE_BYTES) {
      reject(new Error('Ukuran berkas gambar maksimal 10 MB.'));
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas gambar.'));
    };

    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        reject(new Error('Berkas gambar kosong.'));
        return;
      }

      // Keep small SVG logos crisp without rasterizing if under 150 KB
      if (file.type === 'image/svg+xml' && file.size <= 150 * 1024 && options.preserveAlpha) {
        resolve(dataUrl);
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          if (options.cropPortrait) {
            // Center-crop to 3:4 portrait aspect ratio for student ID cards
            const targetAspect = 3 / 4;
            const srcAspect = img.width / img.height;

            let sx = 0;
            let sy = 0;
            let sWidth = img.width;
            let sHeight = img.height;

            if (srcAspect > targetAspect) {
              // Image is wider than 3:4 -> crop horizontal sides
              sWidth = img.height * targetAspect;
              sx = (img.width - sWidth) / 2;
            } else if (srcAspect < targetAspect) {
              // Image is taller than 3:4 -> crop slightly from top/bottom biasing upper face area
              sHeight = img.width / targetAspect;
              sy = (img.height - sHeight) * 0.25;
            }

            const outWidth = Math.min(options.maxWidth, Math.round(sWidth));
            const outHeight = Math.round(outWidth / targetAspect);

            canvas.width = Math.max(outWidth, 120);
            canvas.height = Math.max(outHeight, 160);

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);

            const compressed = canvas.toDataURL('image/jpeg', options.quality ?? 0.84);
            resolve(compressed);
          } else {
            // Proportional scale inside maxWidth x maxHeight (ideal for School Logo)
            let { width, height } = img;
            const ratio = Math.min(options.maxWidth / width, options.maxHeight / height, 1);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));

            canvas.width = width;
            canvas.height = height;

            if (!options.preserveAlpha) {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, width, height);
            } else {
              ctx.clearRect(0, 0, width, height);
            }

            ctx.drawImage(img, 0, 0, width, height);

            const mime = options.preserveAlpha ? 'image/png' : 'image/jpeg';
            const compressed = canvas.toDataURL(mime, options.quality ?? 0.88);
            resolve(compressed);
          }
        } catch {
          reject(new Error('Gagal memproses kompresi gambar.'));
        }
      };

      img.onerror = () => {
        reject(new Error('Berkas gambar rusak atau tidak didukung.'));
      };

      img.src = dataUrl;
    };

    reader.readAsDataURL(file);
  });
}
