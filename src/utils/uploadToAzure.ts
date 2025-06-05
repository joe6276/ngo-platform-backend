import { containerClient } from '../lib/azureBlob';
import { v4 as uuidv4 } from 'uuid';
import { Readable } from 'stream';

export async function uploadBufferToAzure(file: Express.Multer.File): Promise<string> {
  const blobName = `${uuidv4()}-${file.originalname}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.uploadData(file.buffer, {
    blobHTTPHeaders: { blobContentType: file.mimetype }
  });

  return blockBlobClient.url;
}
