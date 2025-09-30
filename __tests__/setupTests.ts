// Jest setup file

// Mock das variáveis de ambiente necessárias para os testes
process.env.AWS_REGION = 'us-east-1';
process.env.S3_BUCKET_NAME = 'test-bucket';

global.console = {
  ...console,
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
};
