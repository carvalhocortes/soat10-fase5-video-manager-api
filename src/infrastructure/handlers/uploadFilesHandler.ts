import { APIGatewayProxyHandler } from 'aws-lambda';
import { AuthMiddleware } from '../auth/authMiddleware';
import { ErrorMiddleware } from '../auth/errorMiddleware';

export const uploadFilesHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const auth = new AuthMiddleware();
    const user = await auth.authenticate(event);

    const result = { message: 'Upload autorizado', user };

    return { statusCode: 201, body: JSON.stringify(result) };
  } catch (err: any) {
    return ErrorMiddleware.handle(err);
  }
};
