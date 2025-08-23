export class ValidationError extends Error {
  public readonly statusCode: number = 400;
  public readonly internalCode: string = 'BAD_REQUEST';

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  public readonly statusCode: number = 401;
  public readonly internalCode: string = 'UNAUTHORIZED';

  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  public readonly statusCode: number = 403;
  public readonly internalCode: string = 'FORBIDDEN';

  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error {
  public readonly statusCode: number = 404;
  public readonly internalCode: string = 'NOT_FOUND';

  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class InternalServerError extends Error {
  public readonly statusCode: number = 500;
  public readonly internalCode: string = 'INTERNAL_SERVER_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'InternalServerError';
  }
}
