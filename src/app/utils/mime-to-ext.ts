import { MIMETYPE } from '../../shared/mimetype';

export function mimeToExt(mime: string) {
  switch (mime) {
    case MIMETYPE.PNG:
      return 'png';
    case MIMETYPE.JPEG:
      return 'jpg';
    case MIMETYPE.WEBP:
      return 'webp';
    case MIMETYPE.TGA:
      return 'tga';
    case MIMETYPE.AS_IS:
      return '{as_is}';
    default:
      return 'unknown';
  }
}
