import {
  AuthenticationError,
  AuthorizationError,
  InternalServerError,
  NotFoundError,
  ValidationError,
} from '../../src/domain/CustomErrors';

describe('CustomErrors', () => {
  describe('ValidationError', () => {
    it('should create ValidationError with correct properties', () => {
      const message = 'Test validation error';
      const error = new ValidationError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('ValidationError');
      expect(error.statusCode).toBe(400);
      expect(error.internalCode).toBe('BAD_REQUEST');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ValidationError);
    });

    it('should be throwable and catchable', () => {
      const message = 'Test validation error';

      expect(() => {
        throw new ValidationError(message);
      }).toThrow(ValidationError);

      expect(() => {
        throw new ValidationError(message);
      }).toThrow(message);
    });
  });

  describe('AuthenticationError', () => {
    it('should create AuthenticationError with correct properties', () => {
      const message = 'Test authentication error';
      const error = new AuthenticationError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('AuthenticationError');
      expect(error.statusCode).toBe(401);
      expect(error.internalCode).toBe('UNAUTHORIZED');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthenticationError);
    });

    it('should be throwable and catchable', () => {
      const message = 'Test authentication error';

      expect(() => {
        throw new AuthenticationError(message);
      }).toThrow(AuthenticationError);

      expect(() => {
        throw new AuthenticationError(message);
      }).toThrow(message);
    });
  });

  describe('AuthorizationError', () => {
    it('should create AuthorizationError with correct properties', () => {
      const message = 'Test authorization error';
      const error = new AuthorizationError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('AuthorizationError');
      expect(error.statusCode).toBe(403);
      expect(error.internalCode).toBe('FORBIDDEN');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AuthorizationError);
    });

    it('should be throwable and catchable', () => {
      const message = 'Test authorization error';

      expect(() => {
        throw new AuthorizationError(message);
      }).toThrow(AuthorizationError);

      expect(() => {
        throw new AuthorizationError(message);
      }).toThrow(message);
    });
  });

  describe('NotFoundError', () => {
    it('should create NotFoundError with correct properties', () => {
      const message = 'Test not found error';
      const error = new NotFoundError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('NotFoundError');
      expect(error.statusCode).toBe(404);
      expect(error.internalCode).toBe('NOT_FOUND');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NotFoundError);
    });

    it('should be throwable and catchable', () => {
      const message = 'Test not found error';

      expect(() => {
        throw new NotFoundError(message);
      }).toThrow(NotFoundError);

      expect(() => {
        throw new NotFoundError(message);
      }).toThrow(message);
    });
  });

  describe('InternalServerError', () => {
    it('should create InternalServerError with correct properties', () => {
      const message = 'Test internal server error';
      const error = new InternalServerError(message);

      expect(error.message).toBe(message);
      expect(error.name).toBe('InternalServerError');
      expect(error.statusCode).toBe(500);
      expect(error.internalCode).toBe('INTERNAL_SERVER_ERROR');
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(InternalServerError);
    });

    it('should be throwable and catchable', () => {
      const message = 'Test internal server error';

      expect(() => {
        throw new InternalServerError(message);
      }).toThrow(InternalServerError);

      expect(() => {
        throw new InternalServerError(message);
      }).toThrow(message);
    });
  });

  describe('Error inheritance', () => {
    it('should all inherit from Error', () => {
      const validationError = new ValidationError('test');
      const authenticationError = new AuthenticationError('test');
      const authorizationError = new AuthorizationError('test');
      const notFoundError = new NotFoundError('test');
      const internalServerError = new InternalServerError('test');

      expect(validationError).toBeInstanceOf(Error);
      expect(authenticationError).toBeInstanceOf(Error);
      expect(authorizationError).toBeInstanceOf(Error);
      expect(notFoundError).toBeInstanceOf(Error);
      expect(internalServerError).toBeInstanceOf(Error);
    });

    it('should have correct error stack traces', () => {
      const validationError = new ValidationError('test');
      expect(validationError.stack).toBeDefined();
      expect(validationError.stack).toContain('ValidationError');
    });
  });
});
