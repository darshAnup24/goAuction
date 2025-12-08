import { z } from 'zod'

// Profile update validation schema
export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
  address: z.string().max(500).optional(),
  avatar: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
})

// User registration validation schema
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  address: z.string().max(500).optional(),
})

// Login validation schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Listing creation validation schema
export const createListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image is required').max(10),
  startingPrice: z.number().positive('Starting price must be positive').min(0.01),
  reservePrice: z.number().positive('Reserve price must be positive').optional(),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
  category: z.enum(['ELECTRONICS', 'FASHION', 'ART', 'COLLECTIBLES', 'MUSIC', 'SPORTS', 'HOME', 'AUTOMOTIVE', 'OTHER'], {
    errorMap: () => ({ message: 'Invalid category' }),
  }),
}).refine(
  (data) => {
    const start = new Date(data.startTime)
    const end = new Date(data.endTime)
    return end > start
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
).refine(
  (data) => {
    if (data.reservePrice) {
      return data.reservePrice >= data.startingPrice
    }
    return true
  },
  {
    message: 'Reserve price must be greater than or equal to starting price',
    path: ['reservePrice'],
  }
)

// Listing update validation schema
export const updateListingSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).optional(),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000).optional(),
  images: z.array(z.string().url('Invalid image URL')).min(1).max(10).optional(),
  startingPrice: z.number().positive('Starting price must be positive').min(0.01).optional(),
  reservePrice: z.number().positive('Reserve price must be positive').optional(),
  startTime: z.string().datetime('Invalid start time').optional(),
  endTime: z.string().datetime('Invalid end time').optional(),
  category: z.enum(['ELECTRONICS', 'FASHION', 'ART', 'COLLECTIBLES', 'MUSIC', 'SPORTS', 'HOME', 'AUTOMOTIVE', 'OTHER']).optional(),
})

// Bid placement validation schema
export const placeBidSchema = z.object({
  listingId: z.string().cuid('Invalid listing ID'),
  amount: z.number()
    .positive('Bid amount must be positive')
    .min(0.01, 'Bid amount must be at least $0.01')
    .refine(
      (val) => Number.isFinite(val) && val === Number(val.toFixed(2)),
      'Bid amount must have at most 2 decimal places'
    ),
})

// Bid query validation schema
export const bidQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  status: z.enum(['ACTIVE', 'OUTBID', 'WINNING', 'LOST', 'all']).optional().default('all'),
})
