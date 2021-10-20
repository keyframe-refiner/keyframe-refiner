import piexif, { ImageIFD } from 'piexifjs';

const MIME_JPEG = 'image/jpeg';
const DEFAULT_DPI = [96, 96, 2]; // [x, y, unit]

function decodeDataURL(dataURL: string) {
  return atob(dataURL.split(',')[1]);
}

function hexToUint16(h1: string, h0: string) {
  return (h1.charCodeAt(0) << 8) + h0.charCodeAt(0);
}

function getResolutionFromJFIF(dataURL: string) {
  const decoded = decodeDataURL(dataURL);

  if (decoded.slice(0x06, 0x0A) !== 'JFIF') {
    // doesn't contain JFIF data
    return DEFAULT_DPI;
  }

  // read resolution
  const unit = decoded.charCodeAt(0x0D) + 1; // JFIF unit -> EXIF Unit
  const xRes = hexToUint16(decoded[0x0E], decoded[0x0F]);
  const yRes = hexToUint16(decoded[0x10], decoded[0x11]);

  return xRes && yRes ? [xRes, yRes, unit] : DEFAULT_DPI;
}

async function getEXIF(jpegImg: Blob) {
  const reader = new FileReader();

  return new Promise<any>((resolve, reject) => {
    reader.onload = () => {
      const dataURL = reader.result as string;
      const exif = piexif.load(dataURL);
      const zeroth = exif['0th'];

      if (!zeroth[ImageIFD.XResolution] || !zeroth[ImageIFD.YResolution]) {
        // add resolution data
        const [xRes, yRes, unit] = getResolutionFromJFIF(dataURL);
        zeroth[ImageIFD.XResolution] = [xRes, 1];
        zeroth[ImageIFD.YResolution] = [yRes, 1];
        zeroth[ImageIFD.ResolutionUnit] = unit;
      }

      resolve(exif);
    };

    reader.onerror = reject;

    reader.readAsDataURL(jpegImg);
  });
}

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

// TODO: remove blobURL
export class ImageCanvas {
  readonly width: number;
  readonly height: number;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly filename: string,
    readonly filetype: string,
    readonly blobURL: string,
    readonly exif?: any,
  ) {
    this.width = canvas.width;
    this.height = canvas.height;
  }

  static async fromFile(file: File): Promise<ImageCanvas> {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const url = img.src = URL.createObjectURL(file);

    let exif: any;

    if (file.type === MIME_JPEG) {
      exif = await getEXIF(file);
    }

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

        // URL.revokeObjectURL(img.src);
        resolve(new ImageCanvas(canvas, file.name, file.type, url, exif));
      };

      img.onerror = e => {
        URL.revokeObjectURL(img.src);
        reject(e);
      };
    });
  }

  static async fromCanvas(canvas: HTMLCanvasElement, filename: string, filetype: string, exif?: any) {
    const blob = await canvasToBlob(canvas, filetype);

    return new ImageCanvas(canvas, filename, filetype, URL.createObjectURL(blob), exif);
  }

  async toBlob(): Promise<Blob> {
    if (this.filetype !== MIME_JPEG) {
      return canvasToBlob(this.canvas, this.filetype);
    }

    // add resolution data
    const dataURL = this.canvas.toDataURL(this.filetype, 1.0);
    const exif = piexif.dump(this.exif);
    const inserted = piexif.insert(exif, dataURL);

    const buffer = Array.from(decodeDataURL(inserted), (char) => char.charCodeAt(0));
    return new Blob([new Uint8Array(buffer)], {
      type: this.filetype,
    });
  }

  getImageData(): ImageData {
    const ctx = this.canvas.getContext('2d')!;
    return ctx.getImageData(0, 0, this.width, this.height);
  }

  destory() {
    URL.revokeObjectURL(this.blobURL);
  }
}
