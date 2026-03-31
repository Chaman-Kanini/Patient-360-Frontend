export interface RetryOptions {
  maxRetries?: number;
  retryDelay?: number;
  exponentialBackoff?: boolean;
  onRetry?: (attempt: number, error: any) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: any;
  attempts: number;
}

export class RetryUtils {
  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<RetryResult<T>> {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      exponentialBackoff = true,
      onRetry
    } = options;

    let lastError: any;
    let attempts = 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      attempts++;
      
      try {
        const result = await operation();
        return {
          success: true,
          data: result,
          attempts
        };
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain error types
        if (this.shouldNotRetry(error)) {
          break;
        }
        
        // If this is the last attempt, don't wait
        if (attempt === maxRetries) {
          break;
        }
        
        // Call retry callback
        if (onRetry) {
          onRetry(attempt + 1, error);
        }
        
        // Calculate delay for next attempt
        const delay = exponentialBackoff 
          ? retryDelay * Math.pow(2, attempt)
          : retryDelay;
        
        // Wait before retrying
        await this.delay(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts
    };
  }

  private static shouldNotRetry(error: any): boolean {
    // Don't retry on authentication errors
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      return true;
    }
    
    // Don't retry on file validation errors
    if (error?.response?.data?.errorType === 'InvalidExtension' ||
        error?.response?.data?.errorType === 'FileTooLarge' ||
        error?.response?.data?.errorType === 'PasswordProtected') {
      return true;
    }
    
    // Don't retry on client-side validation errors
    if (error?.message?.includes('File type not allowed') ||
        error?.message?.includes('File size exceeds') ||
        error?.message?.includes('Password-protected')) {
      return true;
    }
    
    return false;
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static createRetryableUpload(
    uploadFunction: (file: File, patientContextId?: string) => Promise<any>,
    options: RetryOptions = {}
  ) {
    return async (file: File, patientContextId?: string, onProgress?: any) => {
      const retryOptions = {
        maxRetries: 2, // Fewer retries for uploads to avoid duplicate uploads
        retryDelay: 2000,
        onRetry: (attempt: number) => {
          if (onProgress) {
            onProgress({
              file,
              progress: 0,
              status: 'error',
              error: `Upload failed, retrying attempt ${attempt}...`
            });
          }
        },
        ...options
      };

      const result = await this.withRetry(
        () => uploadFunction(file, patientContextId),
        retryOptions
      );

      if (result.success && onProgress) {
        onProgress({
          file,
          progress: 100,
          status: 'success',
          documentId: result.data?.documents?.[0]?.id
        });
      }

      return result;
    };
  }

  static isRetryableError(error: any): boolean {
    return !this.shouldNotRetry(error);
  }

  static getRetryDelay(attempt: number, baseDelay: number = 1000, exponential: boolean = true): number {
    return exponential ? baseDelay * Math.pow(2, attempt - 1) : baseDelay;
  }
}
