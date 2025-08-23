import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { AuthenticationError } from '../../domain/CustomErrors';

export class AuthMiddleware {
  private verifier: ReturnType<typeof CognitoJwtVerifier.create>;

  constructor() {
    const userPoolId = process.env.COGNITO_USER_POOL_ID as string;
    const clientId = process.env.COGNITO_CLIENT_ID as string;

    this.verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'access',
      clientId,
    });
  }

  async authenticate(event: APIGatewayProxyEvent): Promise<any> {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (!authHeader) {
      throw { statusCode: 401, message: 'Authorization header missing' };
    }
    const token = authHeader.replace('Bearer ', '');
    try {
      const payload = await this.verifier.verify(token);
      return payload;
    } catch {
      throw new AuthenticationError('Invalid or expired token');
    }
  }
}
