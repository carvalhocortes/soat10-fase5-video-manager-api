import {
  uploadRequestSchema,
  uploadHandlerInputSchema,
  validationConfigSchema,
  validateUploadRequest,
  validateHandlerInput,
  VALIDATION_CONFIG,
} from '../uploadValidation';

describe('Upload Validation with Yup', () => {
  describe('uploadRequestSchema', () => {
    it('should validate valid request', async () => {
      const validRequest = {
        fileName: 'test-video.mp4',
        fileType: 'video/mp4',
        fileSize: 50 * 1024 * 1024,
        userId: 'user123',
      };

      const result = await uploadRequestSchema.validate(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('should reject empty fileName', async () => {
      const invalidRequest = {
        fileName: '',
        fileType: 'video/mp4',
        userId: 'user123',
      };

      await expect(uploadRequestSchema.validate(invalidRequest)).rejects.toThrow('File name is required');
    });

    it('should reject fileName with invalid characters', async () => {
      const invalidRequest = {
        fileName: 'test<>video.mp4',
        fileType: 'video/mp4',
        userId: 'user123',
      };

      await expect(uploadRequestSchema.validate(invalidRequest)).rejects.toThrow(
        'File name must contain only letters, numbers, dots, hyphens and underscores',
      );
    });

    it('should reject not allowed extension', async () => {
      const invalidRequest = {
        fileName: 'document.pdf',
        fileType: 'video/mp4',
        userId: 'user123',
      };

      await expect(uploadRequestSchema.validate(invalidRequest)).rejects.toThrow('File extension not allowed');
    });

    it('should reject not allowed MIME type', async () => {
      const invalidRequest = {
        fileName: 'video.mp4',
        fileType: 'application/pdf',
        userId: 'user123',
      };

      await expect(uploadRequestSchema.validate(invalidRequest)).rejects.toThrow('File type not allowed');
    });

    it('should reject file too large', async () => {
      const invalidRequest = {
        fileName: 'large-video.mp4',
        fileType: 'video/mp4',
        fileSize: 2 * 1024 * 1024 * 1024, // 2GB (above 1GB limit)
        userId: 'user123',
      };

      await expect(uploadRequestSchema.validate(invalidRequest)).rejects.toThrow('File too large');
    });

    it('should reject empty userId', async () => {
      const invalidRequest = {
        fileName: 'video.mp4',
        fileType: 'video/mp4',
        userId: '',
      };

      await expect(uploadRequestSchema.validate(invalidRequest)).rejects.toThrow('User ID is required');
    });
  });

  describe('uploadHandlerInputSchema', () => {
    it('should validate valid handler input', async () => {
      const validInput = {
        fileName: 'test-video.mp4',
        fileType: 'video/mp4',
        fileSize: 50 * 1024 * 1024,
      };

      const result = await uploadHandlerInputSchema.validate(validInput);
      expect(result).toEqual(validInput);
    });

    it('should accept input without fileSize', async () => {
      const validInput = {
        fileName: 'test-video.mp4',
        fileType: 'video/mp4',
      };

      const result = await uploadHandlerInputSchema.validate(validInput);
      expect(result).toEqual(validInput);
    });
  });

  describe('validationConfigSchema', () => {
    it('should validate valid configuration', async () => {
      const validConfig = {
        maxFileSize: 50 * 1024 * 1024,
        allowedMimeTypes: ['video/mp4'],
        allowedExtensions: ['.mp4'],
      };

      const result = await validationConfigSchema.validate(validConfig);
      expect(result).toEqual(validConfig);
    });

    it('should reject extension without dot', async () => {
      const invalidConfig = {
        allowedExtensions: ['mp4'],
      };

      await expect(validationConfigSchema.validate(invalidConfig)).rejects.toThrow('Extension must start with dot');
    });

    it('should reject maximum size too small', async () => {
      const invalidConfig = {
        maxFileSize: 500, // Smaller than 1KB
      };

      await expect(validationConfigSchema.validate(invalidConfig)).rejects.toThrow('Minimum size must be at least 1KB');
    });
  });

  describe('Helper functions', () => {
    it('validateUploadRequest should work correctly', async () => {
      const validRequest = {
        fileName: 'test-video.mp4',
        fileType: 'video/mp4',
        fileSize: 50 * 1024 * 1024,
        userId: 'user123',
      };

      const result = await validateUploadRequest(validRequest);
      expect(result).toEqual(validRequest);
    });

    it('validateUploadRequest should aggregate multiple errors', async () => {
      const invalidRequest = {
        fileName: '',
        fileType: 'invalid-type',
        fileSize: -1,
        userId: '',
      };

      await expect(validateUploadRequest(invalidRequest)).rejects.toThrow();
    });

    it('validateHandlerInput should work correctly', async () => {
      const validInput = {
        fileName: 'test-video.mp4',
        fileType: 'video/mp4',
      };

      const result = await validateHandlerInput(validInput);
      expect(result).toEqual(validInput);
    });
  });

  describe('VALIDATION_CONFIG constants', () => {
    it('should have valid default configuration', () => {
      expect(VALIDATION_CONFIG.maxFileSize).toBe(1024 * 1024 * 1024); // 1GB
      expect(Array.isArray(VALIDATION_CONFIG.allowedMimeTypes)).toBe(true);
      expect(Array.isArray(VALIDATION_CONFIG.allowedExtensions)).toBe(true);
      expect(VALIDATION_CONFIG.allowedMimeTypes.length).toBeGreaterThan(0);
      expect(VALIDATION_CONFIG.allowedExtensions.length).toBeGreaterThan(0);
    });

    it('should include common video MIME types', () => {
      expect(VALIDATION_CONFIG.allowedMimeTypes).toContain('video/mp4');
      expect(VALIDATION_CONFIG.allowedMimeTypes).toContain('video/avi');
      expect(VALIDATION_CONFIG.allowedMimeTypes).toContain('video/mov');
    });

    it('should include common video file extensions', () => {
      expect(VALIDATION_CONFIG.allowedExtensions).toContain('.mp4');
      expect(VALIDATION_CONFIG.allowedExtensions).toContain('.avi');
      expect(VALIDATION_CONFIG.allowedExtensions).toContain('.mov');
    });
  });
});
