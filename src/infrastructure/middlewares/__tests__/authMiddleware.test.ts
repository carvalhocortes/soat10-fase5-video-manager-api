import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { AuthMiddleware } from '../authMiddleware';

// Mock aws-jwt-verify
jest.mock('aws-jwt-verify', () => ({
  CognitoJwtVerifier: {
    create: jest.fn().mockReturnValue({
      verify: jest.fn(),
    }),
  },
}));

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockVerify: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockVerify = jest.fn();
    (CognitoJwtVerifier.create as jest.Mock).mockReturnValue({
      verify: mockVerify,
    });

    // Set environment variables
    process.env.COGNITO_USER_POOL_ID = 'us-west-2_test123';
    process.env.COGNITO_CLIENT_ID = 'test-client-id';

    authMiddleware = new AuthMiddleware();
  });

  afterEach(() => {
    delete process.env.COGNITO_USER_POOL_ID;
    delete process.env.COGNITO_CLIENT_ID;
  });

  const createMockEvent = (authorizationHeader?: string): APIGatewayProxyEvent => ({
    body: null,
    headers: authorizationHeader ? { Authorization: authorizationHeader } : {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/test',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '123456789',
      apiId: 'test-api',
      protocol: 'HTTP/1.1',
      httpMethod: 'GET',
      path: '/test',
      stage: 'dev',
      requestId: 'test-request-id',
      requestTime: '01/Jan/2021:00:00:00 +0000',
      requestTimeEpoch: 1609459200,
      resourceId: 'test-resource',
      resourcePath: '/test',
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'test-user-agent',
        userArn: null,
      },
      authorizer: null,
    },
    resource: '/test',
  });

  describe('authenticate', () => {
    it('should successfully authenticate with valid Bearer token', async () => {
      const mockUser = {
        sub: 'test-user-id',
        email: 'test@example.com',
        'cognito:username': 'testuser',
      };

      mockVerify.mockResolvedValue(mockUser);

      const event = createMockEvent('Bearer valid-token');
      const result = await authMiddleware.authenticate(event);

      expect(result).toEqual(mockUser);
      expect(mockVerify).toHaveBeenCalledWith('valid-token');
    });

    it('should throw error when Authorization header is missing', async () => {
      const event = createMockEvent();

      await expect(authMiddleware.authenticate(event)).rejects.toEqual({
        statusCode: 401,
        message: 'Authorization header missing',
      });
    });

    it('should throw error when token verification fails', async () => {
      mockVerify.mockRejectedValue(new Error('Invalid token'));

      const event = createMockEvent('Bearer invalid-token');

      await expect(authMiddleware.authenticate(event)).rejects.toThrow('Invalid or expired token');
    });

    it('should handle authorization header with lowercase', async () => {
      const mockUser = {
        sub: 'test-user-id',
        email: 'test@example.com',
      };

      mockVerify.mockResolvedValue(mockUser);

      const event = createMockEvent();
      event.headers = { authorization: 'Bearer valid-token' };

      const result = await authMiddleware.authenticate(event);

      expect(result).toEqual(mockUser);
      expect(mockVerify).toHaveBeenCalledWith('valid-token');
    });

    it('should strip Bearer prefix from token', async () => {
      const mockUser = {
        sub: 'test-user-id',
      };

      mockVerify.mockResolvedValue(mockUser);

      const event = createMockEvent('Bearer test-token-123');

      await authMiddleware.authenticate(event);

      expect(mockVerify).toHaveBeenCalledWith('test-token-123');
    });
  });
});
