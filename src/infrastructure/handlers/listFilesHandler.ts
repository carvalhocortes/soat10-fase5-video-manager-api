import { APIGatewayProxyHandler } from 'aws-lambda';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { ErrorMiddleware } from '../middlewares/errorMiddleware';
import { ResponseMiddleware } from '../middlewares/responseMiddleware';
import { FileUploadRepository } from '../db/FileUploadRepository';

export const listFilesHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const auth = new AuthMiddleware();
    const user = await auth.authenticate(event);

    const userId = user.userId || user.username;
    const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit, 10) : 50;
    const validatedLimit = Math.min(Math.max(limit, 1), 100);

    const fileRepository = new FileUploadRepository();
    const fileUploads = await fileRepository.listUserUploads(userId, validatedLimit);

    return ResponseMiddleware.handle(
      {
        data: {
          files: fileUploads,
          count: fileUploads.length,
          limit: validatedLimit,
        },
      },
      200,
    );
  } catch (err: any) {
    return ErrorMiddleware.handle(err);
  }
};
