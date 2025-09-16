import piexif, { ImageIFD, ExifIFD } from 'piexifjs';
import type { IDecodedTga, IEncodeTgaOptions } from 't-tga-codec';

import { MIMETYPE } from '../../shared/mimetype';
import { mimeToExt } from '../utils/mime-to-ext';

type TGAMeta = IDecodedTga['details']

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
    readonly filetype: MIMETYPE,
    readonly exif?: any,
    readonly tgaMeta?: TGAMeta,
  ) {
    this.width = canvas.width;
    this.height = canvas.height;

    this.fixExif();
  }

  static async fromFile(file: File): Promise<ImageCanvas> {
    const canvas = document.createElement('canvas');

    if (file.type === MIMETYPE.TGA) {
      const { decodeTga } = await import('t-tga-codec');
      const decoded = await decodeTga(new Uint8Array(await file.arrayBuffer()));

      const imageData = new ImageData(
        new Uint8ClampedArray(decoded.image.data),
        decoded.image.width,
        decoded.image.height,
      );

      return ImageCanvas.fromImageData(imageData, file.name, file.type, undefined, decoded.details);
    }

    const img = document.createElement('img');
    const url = URL.createObjectURL(file);

    let exif: any;

    if (file.type === MIMETYPE.JPEG) {
      exif = await getEXIF(file);
    }

    return new Promise((resolve, reject) => {
      img.onload = () => {
        const ctx = canvas.getContext('2d')!;
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

        URL.revokeObjectURL(img.src);
        resolve(new ImageCanvas(canvas, file.name, file.type as MIMETYPE, exif));
      };

      img.onerror = e => {
        URL.revokeObjectURL(img.src);
        reject(e);
      };

      img.src = url;
    });
  }

  static fromImageData(imageData: ImageData, filename: string, filetype: MIMETYPE, exif?: any, tgaMeta?: TGAMeta) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    canvas.width = imageData.width;
    canvas.height = imageData.height;

    ctx.putImageData(imageData, 0, 0);

    return new ImageCanvas(canvas, filename, filetype, exif, tgaMeta);
  }

  async toBlob(filetype?: string): Promise<Blob> {
    const outputFiletype = filetype || this.filetype;

    if (outputFiletype === MIMETYPE.TGA) {
      const { encodeTga } = await import('t-tga-codec');
      const imageData = this.getImageData();
      const options: IEncodeTgaOptions = {};

      if (this.tgaMeta) {
        options.bitDepth = this.tgaMeta.header.bitDepth;
        options.imageId = this.tgaMeta.imageId;
        options.imageType = this.tgaMeta.header.imageType;
        options.origin = this.tgaMeta.header.origin;
        options.screenOrigin = this.tgaMeta.header.screenOrigin;
      }

      const tgaData = await encodeTga({
        width: imageData.width,
        height: imageData.height,
        data: new Uint8Array(imageData.data.buffer),
      }, options);

      return new Blob([new Uint8Array(tgaData.data)], {
        type: outputFiletype,
      });
    }

    if (outputFiletype !== MIMETYPE.JPEG || !this.exif) {
      return canvasToBlob(this.canvas, outputFiletype);
    }

    // add resolution data
    const exif = piexif.dump(this.exif);
    const dataURL = piexif.insert(exif, this.canvas.toDataURL(outputFiletype, 1.0));
    const decoded = decodeDataURL(dataURL);

    const buffer = Uint8Array.from(removeJFIF(decoded), char => char.charCodeAt(0));
    return new Blob([buffer], {
      type: outputFiletype,
    });
  }

  getImageData(): ImageData {
    const ctx = this.canvas.getContext('2d')!;
    return ctx.getImageData(0, 0, this.width, this.height);
  }

  rename(newName: string) {
    return new ImageCanvas(this.canvas, newName, this.filetype, this.exif, this.tgaMeta);
  }

  changeFiletype(newFiletype: MIMETYPE) {
    if (newFiletype === this.filetype || newFiletype === MIMETYPE.AS_IS) {
      return this;
    }

    const filename = this.filename.replace(/\.[^/.]+$/, '');
    const ext = mimeToExt(newFiletype);

    return new ImageCanvas(this.canvas, `${filename}.${ext}`, newFiletype, this.exif, this.tgaMeta);
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
