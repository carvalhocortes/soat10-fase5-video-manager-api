import { APIGatewayProxyHandler } from 'aws-lambda';
import { AuthMiddleware } from '../auth/authMiddleware';
import { ErrorMiddleware } from '../auth/errorMiddleware';

export const downloadFilesHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const auth = new AuthMiddleware();
    const user = await auth.authenticate(event);

    const result = { message: 'Download autorizado', user };
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (err: any) {
    return ErrorMiddleware.handle(err);
  }
};
