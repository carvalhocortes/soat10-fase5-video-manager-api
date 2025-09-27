# AI Coding Assistant Instructions

## Project Overview

This is a **serverless video file management API** built on AWS using TypeScript, Lambda functions, and AWS Cognito authentication. The system handles video upload, download, and listing operations through S3 pre-signed URLs.

### Core Architecture

- **3 Lambda Functions**: `upload-files`, `download-files`, `list-files` (deployed via Terraform)
- **Entry Point**: `src/index.ts` exports all handlers for Lambda deployment
- **Deployment**: Single ZIP file (`lambda.zip`) containing all handlers
- **Infrastructure**: Terraform manages API Gateway, Lambda functions, and AWS service integrations

## Key Patterns & Conventions

### Handler Structure
All handlers follow this pattern in `src/infrastructure/handlers/`:
```typescript
export const handlerName: APIGatewayProxyHandler = async (event) => {
  try {
    const auth = new AuthMiddleware();
    const user = await auth.authenticate(event);
    // Business logic
    return ResponseMiddleware.handle(data, statusCode);
  } catch (err) {
    return ErrorMiddleware.handle(err);
  }
};
```

### Validation with Yup
- Use `yup` schemas for robust input validation (see `src/infrastructure/validation/uploadValidation.ts`)
- Video file validation includes: type, size (1GB max), extension, and MIME type checks
- **Supported formats**: MP4, AVI, MOV, WMV, FLV, WebM, MKV, M4V, 3GP

### Error Handling
- Custom error classes in `src/domain/CustomErrors.ts` with HTTP status codes
- `ErrorMiddleware.handle()` standardizes error responses
- All errors include `statusCode`, `internalCode`, and descriptive messages

### Authentication Pattern
- AWS Cognito JWT verification via `AuthMiddleware`
- Extract user info from JWT payload: `user.sub || user.userId || user.username`
- Environment variables: `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`

## Development Workflows

### Build & Deploy
```bash
npm run deploy-build  # Builds, preps, installs prod deps, and creates lambda.zip
```

### Testing
```bash
npm run test           # Run Jest tests
npm run test:coverage  # Generate coverage reports
npm run test:watch     # Watch mode for development
```

### Local Development
- Use LocalStack via `docker-compose up` for AWS service emulation
- Test with `awslocal` CLI commands instead of `aws` CLI
- Example: `awslocal lambda invoke --function-name listFiles response.json`

### Code Quality
- ESLint configuration in `eslint.config.mjs`
- Husky pre-commit hooks with lint-staged
- TypeScript strict mode enabled

## File Organization

```
src/
├── index.ts                 # Lambda handler exports
├── domain/
│   ├── CustomErrors.ts      # Domain-specific error classes
│   └── FileUploadRecord.ts  # Upload status tracking models
└── infrastructure/
    ├── handlers/            # Lambda function handlers
    ├── middlewares/         # Auth, Error, Response middlewares
    ├── services/           # S3UploadService, external integrations
    ├── db/                 # DynamoDB repositories
    └── validation/         # Yup schemas and validation logic
```

### DynamoDB Integration
- **FileUploadRepository**: Tracks upload status in `file-uploads` table
- **Upload Flow**: Handler saves record with `PENDING` status, S3 events update to `UPLOADED`
- **Status Enum**: `PENDING`, `UPLOADED`, `PROCESSING`, `COMPLETED`, `FAILED`, `EXPIRED`
- **TTL Enabled**: Automatic cleanup of expired records after 24 hours

## When Making Changes

1. **New handlers**: Export from `src/index.ts` and add Terraform Lambda resource
2. **Validation**: Create Yup schemas in `validation/` directory, follow existing patterns
3. **Tests**: Place in `__tests__/` subdirectories, mock external dependencies
4. **Errors**: Use custom error classes for domain-specific errors
5. **S3 operations**: Extend `S3UploadService` for new file operations
6. **DynamoDB operations**: Extend `FileUploadRepository` for upload tracking

## Environment & Infrastructure

- **Runtime**: Node.js 22.x
- **Timeout**: 10 seconds per Lambda
- **IAM Role**: Uses AWS Lab environment `LabRole`
- **Terraform**: All infrastructure as code in `terraform/` directory
- **Secrets**: SSM Parameter Store for Cognito configuration
- **DynamoDB**: `file-uploads` table with GSI on `userId` for listing user files
