import { MIMETYPE } from '../../shared/mimetype';

export function mimeToExt(mime: string) {
  switch (mime) {
    case MIMETYPE.PNG:
      return 'png';
    case MIMETYPE.JPEG:
      return 'jpg';
    case MIMETYPE.WEBP:
      return 'webp';
    default:
      return '{as_is}';
  }
}
