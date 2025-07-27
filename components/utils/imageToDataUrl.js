// components/utils/imageToDataUrl.js
export function fileToDataURL(file, maxSize = 256, quality = 0.85) {
  // 画像を読み込んで、最大辺 maxSize にリサイズ → JPEG DataURL を返す
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error("No file"));

    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        const scale = Math.min(1, maxSize / Math.max(width, height));
        const w = Math.round(width * scale);
        const h = Math.round(height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const url = canvas.toDataURL("image/jpeg", quality);
        resolve(url);
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}
