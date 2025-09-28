import { APIGatewayProxyHandler } from 'aws-lambda';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { ErrorMiddleware } from '../middlewares/errorMiddleware';
import { ResponseMiddleware } from '../middlewares/responseMiddleware';
import { S3UploadService } from '../services/S3UploadService';
import { validateHandlerInput, UploadHandlerInput, UploadRequest } from '../validation/uploadValidation';
import { FileUploadRepository } from '../db/FileUploadRepository';

export const uploadFilesHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const auth = new AuthMiddleware();
    const user = await auth.authenticate(event);
    console.log('Usuário autenticado:', user);
    const userId = user.username;

    let requestBody: UploadHandlerInput;
    try {
      const parsedBody = JSON.parse(event.body ?? '{}');
      requestBody = await validateHandlerInput(parsedBody);
    } catch {
      return ResponseMiddleware.handle({ error: 'JSON inválido ou campos obrigatórios ausentes' }, 400);
    }

    const uploadRequest: UploadRequest = {
      ...requestBody,
      userId,
    };

    const s3Service = new S3UploadService();
    const fileRepository = new FileUploadRepository();

    const uploadResponse = await s3Service.generateUploadUrl(uploadRequest);

    const fileRecord = await fileRepository.createFileUpload({
      userId: uploadRequest.userId,
      fileName: uploadRequest.fileName,
      fileType: uploadRequest.fileType,
      fileSize: uploadRequest.fileSize || 0,
      s3Key: uploadResponse.fileKey,
      uploadUrl: uploadResponse.uploadUrl,
    });

    return ResponseMiddleware.handle(
      {
        data: {
          ...uploadResponse,
          fileId: fileRecord.fileId,
        },
        user: {
          id: userId,
          email: user.email,
        },
      },
      201,
    );
  } catch (err: any) {
    return ErrorMiddleware.handle(err);
  }
};
