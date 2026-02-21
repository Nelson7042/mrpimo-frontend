/**
 * Utility functions for extracting and handling API error messages
 */

/**
 * Interface for API error response
 */
export interface ApiErrorResponse {
  success?: boolean;
  message?: string;
  error?: string;
  errors?: Record<string, string>;
  details?: Record<string, string>;
  code?: string;
}

/**
 * Interface for parsed error result
 */
export interface ParsedError {
  message: string;
  fieldErrors?: Record<string, string>;
  code?: string;
}

/**
 * Extracts error message from various API error response formats
 * Handles multiple backend error formats:
 * - { success: false, message: "error" }
 * - { success: false, error: "error" }
 * - { message: "error" }
 * - { error: "error" }
 * - { errors: { field: "error" } }
 * - { details: { field: "error" } }
 * 
 * @param error - The error object from catch block or API response
 * @param defaultMessage - Default message if no error message can be extracted
 * @returns ParsedError object with message and optional field errors
 */
export function extractApiError(
  error: unknown,
  defaultMessage: string = 'An unexpected error occurred'
): ParsedError {
  // Handle null/undefined
  if (!error) {
    return { message: defaultMessage };
  }

  // Handle Error instances
  if (error instanceof Error) {
    return { 
      message: error.message || defaultMessage,
      fieldErrors: undefined,
      code: undefined
    };
  }

  // Handle API error response objects
  if (typeof error === 'object') {
    const errorObj = error as ApiErrorResponse;
    
    // Extract main error message
    const message = errorObj.message || errorObj.error || defaultMessage;
    
    // Extract field-specific errors
    const fieldErrors = errorObj.errors || errorObj.details;
    
    // Extract error code
    const code = errorObj.code;
    
    return {
      message,
      fieldErrors,
      code
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return { message: error };
  }

  return { message: defaultMessage };
}

/**
 * Extracts error message from a Response object
 * Useful for handling fetch API responses
 * 
 * @param response - The Response object from fetch
 * @param defaultMessage - Default message if no error message can be extracted
 * @returns Promise<ParsedError> object with message and optional field errors
 */
export async function extractResponseError(
  response: Response,
  defaultMessage: string = 'Request failed'
): Promise<ParsedError> {
  try {
    const data = await response.json();
    return extractApiError(data, defaultMessage);
  } catch {
    // If response body can't be parsed as JSON
    return { 
      message: `${defaultMessage}: ${response.statusText || `Status ${response.status}`}` 
    };
  }
}

/**
 * Formats field errors for display
 * Converts field error object to a readable string
 * 
 * @param fieldErrors - Object with field names as keys and error messages as values
 * @returns Formatted string of field errors
 */
export function formatFieldErrors(fieldErrors: Record<string, string>): string {
  return Object.entries(fieldErrors)
    .map(([field, error]) => `${field}: ${error}`)
    .join(', ');
}

/**
 * Gets a user-friendly error message
 * Combines main message with field errors if present
 * 
 * @param parsedError - The parsed error object
 * @returns User-friendly error message string
 */
export function getDisplayErrorMessage(parsedError: ParsedError): string {
  if (parsedError.fieldErrors && Object.keys(parsedError.fieldErrors).length > 0) {
    const fieldErrorsStr = formatFieldErrors(parsedError.fieldErrors);
    return `${parsedError.message}. ${fieldErrorsStr}`;
  }
  return parsedError.message;
}
