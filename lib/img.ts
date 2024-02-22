import sharp, { Sharp } from 'sharp';
import { put } from "@vercel/blob";

interface PixelDimensions {
  width: number;
  height: number;
}

/**
 * Asynchronous function to retrieve the dimensions (width and height) of an image.
 * 
 * @param {Sharp} image The Sharp object representing the image.
 * @param {Buffer} buffer The buffer containing the image data.
 * @returns {Promise<PixelDimensions>} A promise that resolves to an object
 * containing the width and height of the image.
 */
async function getPixelDimensions(image: Sharp, buffer: Buffer): Promise<PixelDimensions> {
  try {
    const metadata = await image.metadata();
    const originalWidth = metadata.width;
    const originalHeight = metadata.height;
    if (originalWidth && originalHeight) {
      return {
        width: originalWidth,
        height: originalHeight,
      };
    }

    // Ensure buffer is at least 12 bytes long to contain image header
    if (!buffer || buffer.length < 12) {
      throw new Error(`Unknown image size for small buffer ${buffer}`);
    }

    // Read the first 12 bytes of the buffer
    const header = buffer.slice(0, 12);

    const isJPG = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    if (isJPG) {
      const width = header.readUInt16BE(6);
      const height = header.readUInt16BE(4);
      if (width && height) {
        return { width, height };
      }
    }

    const isPNG = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
    if (isPNG) {
      const width = header.readUInt32BE(16);
      const height = header.readUInt32BE(20);
      if (width && height) {
        return { width, height };
      }
    }

    const isPossibleGIF = header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38 && header[5] === 0x61;
    const isGIF = isPossibleGIF && (header[4] === 0x37 || header[4] === 0x39);
    if (isGIF) {
      const width = header.readUInt16LE(6);
      const height = header.readUInt16LE(8);
      if (width && height) {
        return { width, height };
      }
    }

    const isWEBP = header.toString('utf-8', 0, 4) === 'WEBP';
    if (isWEBP) {
      const vp8Signature = header.toString('utf-8', 8, 12);
      if (vp8Signature === 'VP8 ' || vp8Signature === 'VP8L' || vp8Signature === 'VP8X') {
        // Read the image dimensions from WebP chunk
        let pos = 12;
        let width, height;
        while (pos < buffer.length) {
          const chunkHeader = buffer.toString('utf-8', pos, pos + 4);
          pos += 4;
          const chunkSize = buffer.readUIntLE(pos, 3);
          pos += 3;
          if (chunkHeader === 'VP8 ') {
            width = buffer.readUIntLE(pos + 7, 2);
            height = buffer.readUIntLE(pos + 9, 2);
            break;
          }
          pos += chunkSize;
        }
        if (width && height) {
          return { width, height };
        }
      }
    }

    return {
      width: 0,
      height: 0
    }
  } catch (error) {
    console.error(`getPixelDimensions encountered error`, error);
    return {
      width: 0,
      height: 0
    }
  }
}

/**
 * Asynchronous function to retrieve an optimized buffer of an image from a given
 * URL. This function can also resize images to ensure that we aren't storing
 * images larger than we need.
 * 
 * This function is used both to generate a buffer for a 1200px wide image and
 * to generate the buffer for a 10px tall image. The 10px image is used as a
 * blurred placecholder that shows some semblence of what the user can expect
 * after the full image is downloaded.
 * 
 * @param {string} url The URL of the image.
 * @param {number} width The desired width of the optimized image.
 * @param {number} height The desired height of the optimized image.
 * @returns {Promise<Buffer | null>} A promise that resolves to a Buffer 
 * containing the optimized image data, or null if an error occurs.
 */
async function getOptimizedBuffer(url: string, width: number, height: number): Promise<Buffer | null> {
  try {
    if (!url) return null;
    const ArrayBuffer = await (await fetch(url, {
      cache: 'no-store', next: { revalidate: 0 }, 
    })).arrayBuffer();
    const buffer = Buffer.from(ArrayBuffer);

    const image: Sharp = sharp(buffer);

    const imageDimensions = await getPixelDimensions(image, buffer);
    const originalWidth = imageDimensions.width;
    const originalHeight = imageDimensions.height;
    if (!originalHeight || !originalWidth) throw new Error(`Couldn't get pixel dimensions`);

    // If neither width nor height are provided, use the original dimensions
    if (!width && !height) {
      width = originalWidth;
      height = originalHeight;
    } else if (!width || !height) {
      // If only one dimension is provided, calculate the other based on the original aspect ratio
      width = width || Math.round(originalWidth * (height! / originalHeight));
      height = height || Math.round(originalHeight * (width / originalWidth));
    }

    const resizedBuffer = await image
      .resize({ width, height })
      .toFormat("webp")
      .toBuffer();

    return resizedBuffer;
  } catch (error) {
    console.error(`getOptimizedBuffer encountered error`, error);
    return null;
  }
}

/**
 * Asynchronous function to retrieve the base64-encoded representation of an
 * image from a given URL. This function is mainly used to generate a 10px
 * tall image that serves as a blurry placeholder to show the user what they
 * can expect once the image is fully downloaded.
 * 
 * @param {string} url The URL of the image.
 * @param {number} width The desired width of the optimized image.
 * @param {number} height The desired height of the optimized image.
 * @returns {Promise<string>} A promise that resolves to a base64-encoded string
 * representing the optimized image data.
 */
export async function getBase64(url: string, width: number, height: number): Promise<string> {
  const optimizedBuffer = await getOptimizedBuffer(url, width, height);
  if (optimizedBuffer instanceof Buffer) {
    return `data:image/webp;base64,${optimizedBuffer.toString('base64')}`;
  }
  return '';
}

/**
 * Asynchronous function to retrieve a Blob URL for an image from a given URL,
 * resize it, convert it to a webp, and then upload it to vercel blob store.
 * It then returns the url for where the image can be found. This is used
 * to process articles before adding them to the database and cache meta images.
 * 
 * @param {string} url The URL of the image.
 * @param {number} width The desired width of the optimized image.
 * @param {number} height The desired height of the optimized image.
 * @param {string} source The source of the article, linked with the record for easy removal.
 * @returns {Promise<string>} A promise that resolves to a Blob URL for the
 * optimized image data.
 */
export async function getBlobURL(url: string, width: number, height: number, source: string): Promise<string> {
  try {
    const optimizedBuffer = await getOptimizedBuffer(url, width, height);
    if (!(optimizedBuffer instanceof Buffer)) return '';
    const blob = await put(`articles/${encodeURIComponent(source)}.webp`, optimizedBuffer, { access: 'public', addRandomSuffix: false });

    return blob.url || '';
  } catch (error) {
    console.error(`getBlobURL encountered error`, error);
    return '';
  }
}
