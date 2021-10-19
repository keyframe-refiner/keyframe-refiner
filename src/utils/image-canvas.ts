export async function canvasToBlob(canvas: HTMLCanvasElement, filetype: string) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Unable to convert canvas to blob.'));
      }
    }, filetype, 1.0);
  });
}

export class ImageCanvas {
  readonly width: number;
  readonly height: number;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly filename: string,
    readonly filetype: string,
    readonly blobURL: string,
  ) {
    this.width = canvas.width;
    this.height = canvas.height;
  }

  static async fromFile(file: File): Promise<ImageCanvas> {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const url = img.src = URL.createObjectURL(file);

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

        // URL.revokeObjectURL(img.src);
        resolve(new ImageCanvas(canvas, file.name, file.type, url));
      };

      img.onerror = e => {
        URL.revokeObjectURL(img.src);
        reject(e);
      };
    });
  }

  static async fromCanvas(canvas: HTMLCanvasElement, filename: string, filetype: string) {
    const blob = await canvasToBlob(canvas, filetype);

    return new ImageCanvas(canvas, filename, filetype, URL.createObjectURL(blob));
  }

  async toBlob(): Promise<Blob> {
    return canvasToBlob(this.canvas, this.filetype);
  }

  getImageData(): ImageData {
    const ctx = this.canvas.getContext('2d')!;
    return ctx.getImageData(0, 0, this.width, this.height);
  }

  destory() {
    URL.revokeObjectURL(this.blobURL);
  }
}
