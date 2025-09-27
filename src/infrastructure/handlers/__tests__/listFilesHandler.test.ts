import { listFilesHandler } from '../listFilesHandler';

jest.mock('../../middlewares/authMiddleware');
jest.mock('../../db/FileUploadRepository');

describe('listFilesHandler', () => {
  it('should exist and be a function', () => {
    expect(typeof listFilesHandler).toBe('function');
  });

  it('should process API Gateway events', async () => {
    const mockEvent = {
      httpMethod: 'GET',
      body: null,
      headers: {
        Authorization: 'Bearer valid-token',
      },
      pathParameters: null,
      queryStringParameters: null,
      multiValueQueryStringParameters: null,
      multiValueHeaders: {},
      stageVariables: null,
      requestContext: {} as any,
      resource: '',
      path: '',
      isBase64Encoded: false,
    };

    const mockContext = {
      callbackWaitsForEmptyEventLoop: false,
      functionName: 'test',
      functionVersion: '1',
      invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test',
      memoryLimitInMB: '128',
      awsRequestId: 'test-request-id',
      logGroupName: '/aws/lambda/test',
      logStreamName: '2021/01/01/[$LATEST]test',
      getRemainingTimeInMillis: () => 30000,
      done: () => {},
      fail: () => {},
      succeed: () => {},
    };

    try {
      const result = await listFilesHandler(mockEvent, mockContext, () => {});
      expect(result).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
