import piexif, { ImageIFD, ExifIFD } from 'piexifjs';

const MIME_JPEG = 'image/jpeg';
const DEFAULT_DPI = [96, 96, 2]; // [x, y, unit]
const JFIF_MARKER = String.fromCharCode(0xFF) + String.fromCharCode(0xE0);

function decodeDataURL(dataURL: string) {
  return atob(dataURL.split(',')[1]);
}

// convert two characters to uint16 value
function parseUint16(str: string, offset: number = 0) {
  return (str.charCodeAt(offset) << 8) + str.charCodeAt(offset + 1);
}

function getResolutionFromJFIF(dataURL: string) {
  const decoded = decodeDataURL(dataURL);

  if (decoded.slice(0x06, 0x0A) !== 'JFIF') {
    // doesn't contain JFIF data
    return DEFAULT_DPI;
  }

  // read resolution
  const unit = decoded.charCodeAt(0x0D) + 1; // JFIF unit -> EXIF Unit
  const xRes = parseUint16(decoded, 0x0E);
  const yRes = parseUint16(decoded, 0x10);

  return xRes && yRes ? [xRes, yRes, unit] : DEFAULT_DPI;
}

// remove JFIF segment
function removeJFIF(decodedStr: string) {
  const startIndex = decodedStr.indexOf(JFIF_MARKER);

  if (startIndex === -1) {
    return decodedStr;
  }

  const lengthByteStart = startIndex + 2;
  const segmentLength = parseUint16(decodedStr, lengthByteStart);

  const endIndex = lengthByteStart + segmentLength;

  return decodedStr.slice(0, startIndex) + decodedStr.slice(endIndex);
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
    }, filetype);
  });
}

export class ImageCanvas {
  readonly width: number;
  readonly height: number;

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly filename: string,
    readonly filetype: string,
    readonly exif?: any,
  ) {
    this.width = canvas.width;
    this.height = canvas.height;

    this.fixExif();
  }

  static async fromFile(file: File): Promise<ImageCanvas> {
    const img = document.createElement('img');
    const canvas = document.createElement('canvas');
    const url = URL.createObjectURL(file);

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

        URL.revokeObjectURL(img.src);
        resolve(new ImageCanvas(canvas, file.name, file.type, exif));
      };

      img.onerror = e => {
        URL.revokeObjectURL(img.src);
        reject(e);
      };

      img.src = url;
    });
  }

  static fromImageData(imageData: ImageData, filename: string, filetype: string, exif?: any) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = imageData.width;
    canvas.height = imageData.height;

    ctx.putImageData(imageData, 0, 0);

    return new ImageCanvas(canvas, filename, filetype, exif);
  }

  async toBlob(): Promise<Blob> {
    if (this.filetype !== MIME_JPEG) {
      return canvasToBlob(this.canvas, this.filetype);
    }

    // add resolution data
    const exif = piexif.dump(this.exif);
    const dataURL = piexif.insert(exif, this.canvas.toDataURL(this.filetype));
    const decoded = decodeDataURL(dataURL);

    const buffer = Uint8Array.from(removeJFIF(decoded), char => char.charCodeAt(0));
    return new Blob([buffer], {
      type: this.filetype,
    });
  }

  getImageData(): ImageData {
    const ctx = this.canvas.getContext('2d')!;
    return ctx.getImageData(0, 0, this.width, this.height);
  }

  private fixExif() {
    if (!this.exif) {
      return;
    }

    // fix dimensions
    this.exif['0th'][ImageIFD.ImageWidth] =
    this.exif['1st'][ImageIFD.ImageWidth] =
    this.exif.Exif[ExifIFD.PixelXDimension] = this.width;

    this.exif['0th'][ImageIFD.ImageLength] =
    this.exif['1st'][ImageIFD.ImageLength] =
    this.exif.Exif[ExifIFD.PixelYDimension] = this.height;

    // fix orientation
    this.exif['0th'][ImageIFD.Orientation] = 1;
  }
}
