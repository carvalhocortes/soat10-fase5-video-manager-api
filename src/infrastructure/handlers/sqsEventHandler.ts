import { SQSHandler } from 'aws-lambda';
import { FileUploadRepository } from '../db/FileUploadRepository';
import { FileUploadRecordStatus } from '../../domain/FileUploadRecord';

export interface ProcessVideoEvent {
  eventType: 'PROCESS_VIDEO_COMPLETED' | 'PROCESS_VIDEO_FAILURE';
  payload: ProcessVideoCompletedPayload | ProcessVideoFailurePayload;
}

export interface ProcessVideoCompletedPayload {
  fileId: string;
  fileName?: string;
  userId?: string;
  s3Key?: string;
  processedFileS3Key?: string;
}

export interface ProcessVideoFailurePayload {
  fileId: string;
  fileName: string;
  userId: string;
  s3Key: string;
  status: 'FAILED';
  error: string;
}

export const sqsEventHandler: SQSHandler = async (event) => {
  const repository = new FileUploadRepository();

  for (const record of event.Records) {
    try {
      console.log('Processing SQS event:', record.body);

      const eventData = JSON.parse(record.body);
      const { eventType, payload }: ProcessVideoEvent = JSON.parse(eventData?.Message ?? '{}');

      if (!eventType || !payload) {
        console.error('Invalid SQS event:', eventData);
        continue;
      }

      const fileId = payload.fileId;

      if (!fileId) {
        console.error('fileId not found in payload:', payload);
        continue;
      }

      const existingRecord = await repository.getFileUpload(fileId);
      if (!existingRecord) {
        console.error(`Record not found for fileId: ${fileId}`);
        continue;
      }

      switch (eventType) {
        case 'PROCESS_VIDEO_COMPLETED': {
          await repository.updateUploadStatus(fileId, FileUploadRecordStatus.COMPLETED);

          const completedPayload = payload as ProcessVideoCompletedPayload;
          if (completedPayload.processedFileS3Key) {
            await repository.updateProcessedFileS3Key(fileId, completedPayload.processedFileS3Key);
          }
          break;
        }

        case 'PROCESS_VIDEO_FAILURE': {
          await repository.updateUploadStatus(fileId, FileUploadRecordStatus.FAILED);

          const failurePayload = payload as ProcessVideoFailurePayload;
          console.error(`Failed to process video ${fileId}: ${failurePayload.error}`);
          break;
        }

        default:
          console.error(`Unknown event type: ${eventType}`);
      }

      console.log(`Event processed successfully: ${eventType} for fileId: ${fileId}`);
    } catch (error) {
      console.error('Error processing SQS event:', error);
      console.error('Record that caused the error:', record);
    }
  }
};
