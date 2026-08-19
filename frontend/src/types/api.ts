/**
 * Type-safe API and domain models
 * Replaces all `any` types with proper interfaces
 */

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  token: string
  user: User
  expiresIn: number
}

export interface GoogleAuthPayload {
  credential: string
}

export interface GoogleAuthResponse {
  token: string
  user: User
  email: string
}

export interface Purchase {
  id: string
  userId: string
  courseId: string
  productName: string
  amount: number
  currency: string
  status: 'completed' | 'pending' | 'failed'
  transactionId?: string
  createdAt: string
}

export interface UserProfile {
  user: User
  purchases: Purchase[]
}

export interface ApiError {
  error: string
  message: string
  statusCode: number
  timestamp: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface ValidationError {
  field: string
  message: string
}

export type AuthMode = 'login' | 'signup'

export type PaymentState = 'idle' | 'loading' | 'setup' | 'success' | 'cancelled' | 'pending'

/**
 * Type guard functions for runtime type checking
 */
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'email' in obj &&
    'name' in obj
  )
}

export function isAuthResponse(obj: unknown): obj is AuthResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'token' in obj &&
    'user' in obj &&
    isUser((obj as any).user)
  )
}

export function isPurchase(obj: unknown): obj is Purchase {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'userId' in obj &&
    'courseId' in obj
  )
}

export function isApiError(obj: unknown): obj is ApiError {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'error' in obj &&
    'message' in obj
  )
}

/**
 * Safe type casting functions
 */
export function assertUser(value: unknown): User {
  if (!isUser(value)) {
    throw new Error('Invalid user object')
  }
  return value
}

export function assertAuthResponse(value: unknown): AuthResponse {
  if (!isAuthResponse(value)) {
    throw new Error('Invalid auth response')
  }
  return value
}

export function safeParse<T>(
  parser: (value: unknown) => T,
  value: unknown,
  fallback: T
): T {
  try {
    return parser(value)
  } catch {
    return fallback
  }
}
