export class ImageCanvas {
  readonly width: number;
  readonly height: number;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly filename: string,
    readonly filetype: string,
  ) {
    this.width = canvas.width;
    this.height = canvas.height;
  }

  static async fromFile(file: File): Promise<ImageCanvas> {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    img.src = URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

        URL.revokeObjectURL(img.src);
        resolve(new ImageCanvas(canvas, file.name, file.type));
      };

      img.onerror = e => {
        URL.revokeObjectURL(img.src);
        reject(e);
      };
    });
  }

  async toBlob(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      this.canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Unable to convert canvas to blob.'));
        }
      }, this.filetype, 1.0);
    });
  }

  getImageData(): ImageData {
    const ctx = this.canvas.getContext('2d')!;
    return ctx.getImageData(0, 0, this.width, this.height);
  }
}