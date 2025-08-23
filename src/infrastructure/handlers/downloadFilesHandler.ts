import { APIGatewayProxyHandler } from 'aws-lambda';
import { AuthMiddleware } from '../middlewares/authMiddleware';
import { ErrorMiddleware } from '../middlewares/errorMiddleware';
import { ResponseMiddleware } from '../middlewares/responseMiddleware';

export const downloadFilesHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const auth = new AuthMiddleware();
    const user = await auth.authenticate(event);

    const result = { message: 'Download autorizado', user };
    return ResponseMiddleware.handle(result);
  } catch (err: any) {
    return ErrorMiddleware.handle(err);
  }
};
