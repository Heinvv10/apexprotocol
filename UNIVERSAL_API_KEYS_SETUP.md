# Universal API Keys Setup - Complete Implementation

## Overview
A complete universal API keys management system has been implemented. This allows administrators to configure OpenAI, Anthropic, and Gemini API keys that all users will use automatically.

## ✅ What's Been Implemented

### 1. Database Schema
**File**: `src/lib/db/schema/system-settings.ts`
- New `system_settings` table for storing universal configuration
- Supports API keys, feature flags, and other global settings
- Encrypted storage using AES-256-GCM

### 2. Updated API Keys Schema
**File**: `src/lib/db/schema/api-keys.ts`
- Added `gemini` to the `apiKeyTypeEnum`
- Now supports: anthropic, openai, gemini, serper, pinecone, custom, user

### 3. Encryption Utility
**File**: `src/lib/encryption.ts`
- AES-256-GCM encryption for secure API key storage
- Generates initialization vectors and authentication tags
- SHA-256 hashing for key lookup without decryption

### 4. Universal API Keys Utility
**File**: `src/lib/universal-api-keys.ts`
- `getUniversalApiKey(provider)` - Get decrypted API key for a provider
- `getAllUniversalApiKeys()` - Get all configured keys
- `hasUniversalApiKey(provider)` - Check if key is configured

### 5. Admin API Endpoint
**File**: `src/app/api/admin/universal-api-keys/route.ts`
- **GET** - Retrieve configured API keys (returns masked versions)
- **POST** - Set or update an API key
- **DELETE** - Remove an API key
- Admin-only access (checks for `role: "admin"` in Clerk metadata)

### 6. Admin UI
**File**: `src/app/dashboard/admin/api-keys/page.tsx`
- User-friendly interface for managing API keys
- Shows/hides keys with eye icon
- Displays masked current keys
- Real-time save/error feedback

### 7. Environment Configuration
**File**: `.env.local`
- Generated encryption key: `ad416710f32e16e0d51d1e22a55ac7566d3ac7430adb75e17971e3c031831990`
- Ready for DATABASE_URL configuration

## 🔐 API Keys Provided

You provided the following API keys to be stored:

1. **OpenAI**: `REDACTED_OPENAI_KEY`

2. **Anthropic**: `REDACTED_ANTHROPIC_KEY`

3. **Gemini**: `AIzaSyAPZQNuFnoLK01QZPqR8MwBtCt8Pd7UE8I`

## 📋 Next Steps

### Step 1: Add Database URL
Edit `.env.local` and add your database connection string:
```bash
DATABASE_URL=postgresql://username:password@host:5432/database
```

### Step 2: Run Database Migration
```bash
cd "C:\Jarvis\AI Workspace\Apex"
npm run db:push
```

This will create the `system_settings` table in your database.

### Step 3: Access Admin UI
Navigate to: `http://localhost:3000/dashboard/admin/api-keys`

### Step 4: Store API Keys
1. Log in as an admin user (requires `role: "admin"` in Clerk metadata)
2. Paste each API key into the corresponding field
3. Click "Save" for each provider
4. Keys will be encrypted and stored in the database

### Step 5: Use Universal API Keys in Your Application
```typescript
import { getUniversalApiKey } from "@/lib/universal-api-keys";

// Example: Get OpenAI key
const openaiKey = await getUniversalApiKey("openai");
if (openaiKey) {
  // Use the key with OpenAI SDK
  const openai = new OpenAI({ apiKey: openaiKey });
}

// Example: Get Anthropic key
const anthropicKey = await getUniversalApiKey("anthropic");
if (anthropicKey) {
  // Use the key with Anthropic SDK
  const anthropic = new Anthropic({ apiKey: anthropicKey });
}

// Example: Get Gemini key
const geminiKey = await getUniversalApiKey("gemini");
if (geminiKey) {
  // Use the key with Google Generative AI
  const genAI = new GoogleGenerativeAI(geminiKey);
}
```

## 🔒 Security Features

1. **Encryption at Rest**
   - All API keys encrypted with AES-256-GCM
   - Unique IV (initialization vector) per key
   - Authentication tags prevent tampering

2. **Access Control**
   - Admin-only endpoints
   - Clerk role-based authentication
   - Masked keys in API responses

3. **Audit Trail**
   - Tracks who last modified each key
   - Timestamps for all changes
   - System audit logs support (planned)

4. **Safe Key Rotation**
   - Update keys without downtime
   - Soft delete support (inactive flag)
   - Version tracking for rotation history

## 🎯 Benefits

1. **Centralized Management**
   - Update API keys once, apply to all users
   - No need for users to provide their own keys

2. **Cost Control**
   - Single billing account for all API usage
   - Easier to track and limit spending

3. **Simplified Onboarding**
   - New users can use AI features immediately
   - No API key configuration required

4. **Future Admin Functions**
   - The admin UI can be extended to manage:
     - Usage limits per organization
     - Feature flags
     - System-wide settings
     - Rate limiting rules

## 📁 File Structure
```
src/
├── app/
│   ├── api/
│   │   └── admin/
│   │       └── universal-api-keys/
│   │           └── route.ts              # Admin API endpoint
│   └── dashboard/
│       └── admin/
│           └── api-keys/
│               └── page.tsx              # Admin UI page
├── lib/
│   ├── db/
│   │   └── schema/
│   │       ├── api-keys.ts               # Updated with Gemini
│   │       └── system-settings.ts        # New schema
│   ├── encryption.ts                     # Encryption utilities
│   └── universal-api-keys.ts             # Helper functions
└── .env.local                            # Environment config
```

## 🚀 Future Enhancements

1. **Usage Tracking**
   - Monitor API usage per organization
   - Set spending limits
   - Alert when approaching limits

2. **Key Rotation Automation**
   - Scheduled key rotation
   - Notifications before expiry
   - Automatic rollover

3. **Advanced Admin Features**
   - Multi-admin approval for key changes
   - Detailed audit logs
   - Key usage analytics dashboard

4. **Provider Selection**
   - Allow users to choose which provider to use
   - Load balancing across providers
   - Fallback to alternative providers

---

## Support

If you encounter any issues:
1. Check that ENCRYPTION_KEY is set in .env.local
2. Verify DATABASE_URL is configured correctly
3. Ensure your user has admin role in Clerk
4. Check browser console and server logs for errors

**Implementation Date**: 2025-12-28
**Status**: ✅ Complete - Ready for database migration and testing
