import { APIGatewayProxyHandler } from 'aws-lambda';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { ErrorMiddleware } from '../middlewares/errorMiddleware';
import { ResponseMiddleware } from '../middlewares/responseMiddleware';
import { FileUploadRepository } from '../db/FileUploadRepository';
import { S3UploadService } from '../services/S3UploadService';
import { FileUploadRecordStatus } from '../../domain/FileUploadRecord';
import { NotFoundError, ValidationError, AuthorizationError } from '../../domain/CustomErrors';

export const downloadFilesHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const auth = new AuthMiddleware();
    const user = await auth.authenticate(event);

    const userId = user.username;

    const fileId = event.pathParameters?.fileId;
    if (!fileId) {
      throw new ValidationError('FileId is required');
    }

    const repository = new FileUploadRepository();
    const fileRecord = await repository.getFileUpload(fileId);

    if (!fileRecord) {
      throw new NotFoundError('File not found');
    }

    if (fileRecord.userId !== userId) {
      throw new AuthorizationError('You do not have permission to download this file');
    }

    if (fileRecord.status !== FileUploadRecordStatus.COMPLETED) {
      throw new ValidationError(`File is not available for download. Current status: ${fileRecord.status}`);
    }

    if (!fileRecord.processedFileS3Key) {
      throw new ValidationError('Processed file not found in the system');
    }

    const s3Service = new S3UploadService();
    const downloadResponse = await s3Service.generateDownloadUrl(fileRecord.processedFileS3Key, 'frames.zip');

    const result = {
      fileId: fileRecord.fileId,
      fileName: fileRecord.fileName,
      fileType: fileRecord.fileType,
      fileSize: fileRecord.fileSize,
      downloadUrl: downloadResponse.downloadUrl,
      expiresIn: downloadResponse.expiresIn,
      status: fileRecord.status,
    };

    return ResponseMiddleware.handle(result);
  } catch (err: any) {
    return ErrorMiddleware.handle(err);
  }
};
