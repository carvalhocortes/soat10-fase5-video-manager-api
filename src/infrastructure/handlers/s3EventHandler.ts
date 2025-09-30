import { S3Event, S3Handler } from 'aws-lambda';
import { FileUploadRepository } from '../db/FileUploadRepository';
import { FileUploadRecordStatus } from '../../domain/FileUploadRecord';
import { SnsPublisher } from '../services/SnsPublisher';

export const s3EventHandler: S3Handler = async (event: S3Event) => {
  const repository = new FileUploadRepository();
  const snsPublisher = new SnsPublisher();

  for (const record of event.Records) {
    try {
      const bucketName = record.s3.bucket.name;
      const objectKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
      const eventName = record.eventName;

      console.log(`Processing S3 event: ${eventName} for object: ${objectKey} in bucket: ${bucketName}`);

      if (eventName.startsWith('ObjectCreated:')) {
        const fileRecord = await repository.findByS3Key(objectKey);
        console.log(`Found file record for S3 key ${objectKey}:`, fileRecord);
        if (fileRecord) {
          await repository.updateUploadStatus(fileRecord.fileId, FileUploadRecordStatus.UPLOADED);
          console.log(`Updated file ${fileRecord.fileId} status to UPLOADED`);
        }

        await snsPublisher.publish({
          eventType: 'FILE_UPLOADED',
          payload: { ...fileRecord, statusUpload: FileUploadRecordStatus.UPLOADED },
        });
        console.log(`File ${objectKey} uploaded successfully`);
      } else if (eventName.startsWith('ObjectRemoved:')) {
        console.log(`File ${objectKey} was removed`);
      }
    } catch (error) {
      console.error('Error processing S3 event:', error);
    }
  }
};
