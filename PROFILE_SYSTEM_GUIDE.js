/**
 * USER PROFILE SYSTEM - COMPLETE GUIDE
 * =====================================
 */

// ============================================
// PAGES CREATED
// ============================================

// 1. /profile - View own profile
// 2. /profile/edit - Edit profile (with avatar upload)
// 3. /profile/[userId] - View public user profile

// ============================================
// API ROUTES CREATED
// ============================================

// GET /api/users/[userId] - Get user profile with statistics
// GET /api/users/profile - Get own profile
// PUT /api/users/profile - Update own profile
// GET /api/users/[userId]/listings - Get user's auction listings (paginated)
// POST /api/upload/avatar - Upload avatar image

// ============================================
// FILE UPLOAD - LOCAL STORAGE (CURRENT SETUP)
// ============================================

// Files are stored in: /public/uploads/avatars/
// Public URL format: /uploads/avatars/[userId]-[timestamp].[ext]
// Max file size: 5MB
// Allowed formats: JPEG, PNG, GIF, WebP

// Usage Example:
/*
import AvatarUpload from '@/components/AvatarUpload'

<AvatarUpload
  currentAvatar={user.avatar}
  onUploadSuccess={(url) => {
    setFormData({ ...formData, avatar: url })
  }}
  onRemove={() => {
    setFormData({ ...formData, avatar: '' })
  }}
/>
*/

// ============================================
// AWS S3 SETUP GUIDE (PRODUCTION RECOMMENDED)
// ============================================

/*
STEP 1: Install AWS SDK
------------------------
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

STEP 2: Create S3 Bucket
------------------------
1. Go to AWS Console > S3
2. Create new bucket (e.g., "your-app-avatars")
3. Set region (e.g., us-east-1)
4. Block public access: OFF (for public avatars)
5. Enable versioning (optional)
6. Add CORS configuration:

{
  "CORSConfiguration": {
    "CORSRules": [
      {
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedHeaders": ["*"],
        "MaxAgeSeconds": 3000
      }
    ]
  }
}

STEP 3: Create IAM User & Policy
---------------------------------
1. Go to IAM > Users > Create user
2. Attach inline policy:

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-app-avatars/*"
    }
  ]
}

3. Create access keys and save them securely

STEP 4: Update .env file
------------------------
Add these to your .env file:

AWS_S3_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-app-avatars
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_ENDPOINT=https://s3.us-east-1.amazonaws.com

STEP 5: Create S3 Utility
--------------------------
Create /lib/s3.js:
*/

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

export async function uploadToS3(file, folder = 'avatars') {
  const timestamp = Date.now()
  const fileName = `${folder}/${timestamp}-${file.name}`

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: file,
    ContentType: file.type,
    ACL: 'public-read',
  })

  await s3Client.send(command)

  // Return public URL
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_S3_REGION}.amazonaws.com/${fileName}`
}

export async function deleteFromS3(fileUrl) {
  // Extract key from URL
  const url = new URL(fileUrl)
  const key = url.pathname.substring(1)

  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

/*
STEP 6: Update Upload API Route
--------------------------------
Replace /app/api/upload/avatar/route.js with:
*/

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { uploadToS3, deleteFromS3 } from '@/lib/s3'

export async function POST(req) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Validate
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large' }, { status: 400 })
    }

    // Upload to S3
    const url = await uploadToS3(file, 'avatars')

    return NextResponse.json({ message: 'Upload successful', url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// ============================================
// CLOUDINARY SETUP (ALTERNATIVE)
// ============================================

/*
STEP 1: Install Cloudinary
---------------------------
npm install cloudinary

STEP 2: Create Cloudinary Account
----------------------------------
1. Sign up at cloudinary.com
2. Get your Cloud Name, API Key, API Secret from Dashboard

STEP 3: Add to .env
-------------------
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

STEP 4: Create /lib/cloudinary.js
----------------------------------
*/

import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export async function uploadToCloudinary(file) {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'fill' },
          { quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result.secure_url)
      }
    )

    uploadStream.end(buffer)
  })
}

// ============================================
// USAGE EXAMPLES
// ============================================

// 1. Fetch user profile
const response = await fetch(`/api/users/${userId}`)
const { user } = await response.json()

// 2. Update profile
const response = await fetch('/api/users/profile', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fullName: 'John Doe',
    username: 'johndoe',
    email: 'john@example.com',
    phone: '+1-555-0123',
    address: '123 Main St',
    avatar: '/uploads/avatars/avatar.jpg',
  }),
})

// 3. Get user's listings
const response = await fetch(`/api/users/${userId}/listings?page=1&limit=12&status=LIVE`)
const { listings, pagination } = await response.json()

// 4. Upload avatar
const formData = new FormData()
formData.append('file', fileInput.files[0])

const response = await fetch('/api/upload/avatar', {
  method: 'POST',
  body: formData,
})

const { url } = await response.json()

// ============================================
// PRODUCTION CONSIDERATIONS
// ============================================

/*
1. Image Optimization:
   - Use Next.js Image component for automatic optimization
   - Implement lazy loading for profile images
   - Add WebP format support

2. Security:
   - Validate file types on both client and server
   - Implement rate limiting for uploads
   - Scan uploads for malware
   - Use signed URLs for S3 (temporary access)

3. Performance:
   - Add CDN for image delivery (CloudFront, CloudFlare)
   - Implement image caching strategy
   - Use thumbnail generation for list views
   - Add image compression before upload

4. Backup:
   - Enable S3 versioning
   - Set up lifecycle policies for old files
   - Implement backup strategy

5. Monitoring:
   - Track upload success/failure rates
   - Monitor storage usage
   - Set up alerts for quota limits
*/

export {}
