import { downloadFilesHandler, listFilesHandler, s3EventHandler, uploadFilesHandler } from '../index';

describe('Index exports', () => {
  it('should export uploadFilesHandler', () => {
    expect(uploadFilesHandler).toBeDefined();
    expect(typeof uploadFilesHandler).toBe('function');
  });

  it('should export downloadFilesHandler', () => {
    expect(downloadFilesHandler).toBeDefined();
    expect(typeof downloadFilesHandler).toBe('function');
  });

  it('should export listFilesHandler', () => {
    expect(listFilesHandler).toBeDefined();
    expect(typeof listFilesHandler).toBe('function');
  });

  it('should export s3EventHandler', () => {
    expect(s3EventHandler).toBeDefined();
    expect(typeof s3EventHandler).toBe('function');
  });
});
