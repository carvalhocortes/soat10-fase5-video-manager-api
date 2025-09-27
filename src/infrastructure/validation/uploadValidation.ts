import * as yup from 'yup';

export const VALIDATION_CONFIG = {
  maxFileSize: 1024 * 1024 * 1024, // 1GB
  allowedMimeTypes: [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/flv',
    'video/webm',
    'video/mkv',
    'video/m4v',
    'video/3gp',
    'video/quicktime',
  ],
  allowedExtensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp'],
};

export const uploadRequestSchema = yup.object({
  fileName: yup
    .string()
    .required('File name is required')
    .min(1, 'File name cannot be empty')
    .test('valid-extension', 'File extension not allowed', function (value) {
      if (!value) return false;
      const extension = value.toLowerCase().substring(value.lastIndexOf('.'));
      const isValidExtension = VALIDATION_CONFIG.allowedExtensions.includes(extension);
      if (!isValidExtension) {
        return this.createError({
          message: `File extension not allowed. Allowed extensions: ${VALIDATION_CONFIG.allowedExtensions.join(', ')}`,
        });
      }
      return true;
    })
    .test('safe-filename', 'File name contains invalid characters', function (value) {
      if (!value) return false;
      const safePattern = /^[a-zA-Z0-9._-]+$/;
      if (!safePattern.test(value)) {
        return this.createError({
          message: 'File name must contain only letters, numbers, dots, hyphens and underscores',
        });
      }

      return true;
    }),
  fileType: yup
    .string()
    .required('File type is required')
    .oneOf(
      VALIDATION_CONFIG.allowedMimeTypes,
      `File type not allowed. Accepted types: ${VALIDATION_CONFIG.allowedMimeTypes.join(', ')}`,
    ),
  fileSize: yup
    .number()
    .positive('File size must be positive')
    .max(
      VALIDATION_CONFIG.maxFileSize,
      `File too large. Maximum allowed size: ${VALIDATION_CONFIG.maxFileSize / (1024 * 1024)}MB`,
    )
    .optional(),

  userId: yup.string().required('User ID is required').min(1, 'User ID cannot be empty'),
});

export const uploadHandlerInputSchema = yup.object({
  fileName: yup.string().required('File name is required').min(1, 'File name cannot be empty'),
  fileType: yup
    .string()
    .required('File type is required')
    .oneOf(
      VALIDATION_CONFIG.allowedMimeTypes,
      `File type not allowed. Accepted types: ${VALIDATION_CONFIG.allowedMimeTypes.join(', ')}`,
    ),
  fileSize: yup
    .number()
    .positive('File size must be positive')
    .max(
      VALIDATION_CONFIG.maxFileSize,
      `File too large. Maximum allowed size: ${VALIDATION_CONFIG.maxFileSize / (1024 * 1024)}MB`,
    )
    .optional(),
});

export const validationConfigSchema = yup.object({
  maxFileSize: yup
    .number()
    .positive('Maximum size must be positive')
    .min(1024, 'Minimum size must be at least 1KB')
    .max(1024 * 1024 * 1024, 'Maximum size cannot exceed 1GB')
    .optional(),
  allowedMimeTypes: yup.array().of(yup.string().required()).min(1, 'Must have at least one allowed MIME type').optional(),
  allowedExtensions: yup
    .array()
    .of(
      yup
        .string()
        .required()
        .test('starts-with-dot', 'Extension must start with dot', (value) => value?.startsWith('.') === true),
    )
    .min(1, 'Must have at least one allowed extension')
    .optional(),
});

export type UploadRequest = yup.InferType<typeof uploadRequestSchema>;
export type UploadHandlerInput = yup.InferType<typeof uploadHandlerInputSchema>;
export type ValidationConfig = yup.InferType<typeof validationConfigSchema>;

export async function validateUploadRequest(data: unknown): Promise<UploadRequest> {
  try {
    return await uploadRequestSchema.validate(data, { abortEarly: false });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(error.errors.join('; '));
    }
    throw error;
  }
}

export async function validateHandlerInput(data: unknown): Promise<UploadHandlerInput> {
  try {
    return await uploadHandlerInputSchema.validate(data, { abortEarly: false });
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      throw new Error(error.errors.join('; '));
    }
    throw error;
  }
}
