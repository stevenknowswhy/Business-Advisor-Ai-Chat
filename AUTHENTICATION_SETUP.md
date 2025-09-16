# 🔐 Clerk-Convex Authentication Setup Guide

## Current Status
✅ **Convex Functions**: Deployed and working  
✅ **Environment Variables**: Properly configured  
✅ **Public Queries**: Working (advisors loading)  
⚠️ **Authentication**: Requires JWT template setup  

## Required Setup Steps

### 1. Create Clerk JWT Template

1. **Open Clerk Dashboard**:
   - Go to: https://dashboard.clerk.com/
   - Navigate to your application: "above-ferret-50"

2. **Create JWT Template**:
   - In the sidebar, click "JWT Templates"
   - Click "New template" button
   - **Template Name**: `convex` (exactly this name)
   - **Signing Algorithm**: RS256 (default)

3. **Configure Claims**:
   Add the following JSON claims configuration:

   ```json
   {
     "iss": "https://above-ferret-50.clerk.accounts.dev",
     "sub": "{{user.id}}",
     "aud": "convex",
     "name": "{{user.first_name}} {{user.last_name}}",
     "email": "{{user.primary_email_address}}",
     "picture": "{{user.profile_image_url}}"
   }
   ```

4. **Save Template**:
   - Click "Save" to create the template
   - The template name MUST be "convex" for the integration to work

### 2. Verify Authentication Flow

After creating the JWT template:

1. **Test Sign-In**:
   - Go to: http://localhost:3001/chat
   - Sign in with your Clerk account
   - Check browser console for errors

2. **Verify Data Loading**:
   - AI Advisors should display in the sidebar
   - User conversations should load
   - No "User not authenticated" errors in console

3. **Check User Sync**:
   - User data should automatically sync to Convex
   - Check Convex dashboard for user records

### 3. Troubleshooting Common Issues

#### "No JWT template exists with name: convex"
- **Solution**: Create the JWT template in Clerk dashboard
- **Template Name**: Must be exactly "convex"
- **Claims**: Must include the required fields above

#### "User not authenticated" 
- **Solution**: Ensure JWT template is properly configured
- **Check**: User is signed in to Clerk
- **Verify**: JWT template name is "convex"

#### "User not found. Please sync your account first."
- **Solution**: The syncUserFromClerk mutation should run automatically
- **Manual Fix**: Call the mutation manually if needed
- **Check**: User record exists in Convex database

#### Advisors Not Loading
- **Check**: Public queries are working (should show advisors)
- **Verify**: No JavaScript errors in browser console
- **Test**: Try refreshing the page after sign-in

### 4. Testing Commands

Run these commands to test the setup:

```bash
# Test authentication integration
npx tsx scripts/test-auth-integration.ts

# Test end-to-end functionality
npx tsx scripts/test-end-to-end.ts

# Check Convex functions status
npx convex dev
```

### 5. Expected Behavior After Setup

1. **Sign-In Flow**:
   - User signs in with Clerk
   - JWT token is generated with "convex" template
   - User data syncs to Convex automatically
   - Protected queries work correctly

2. **Data Access**:
   - AI Advisors display in chat interface
   - User conversations load properly
   - Messages history is accessible
   - Real-time features work

3. **Error-Free Operation**:
   - No authentication errors in console
   - All Convex queries execute successfully
   - User can interact with advisors
   - Chat functionality works end-to-end

## Configuration Details

### Environment Variables
```bash
NEXT_PUBLIC_CONVEX_URL=https://striped-gnat-509.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=***REMOVED***
CLERK_SECRET_KEY=***REMOVED***
```

### Clerk Configuration
- **Domain**: https://above-ferret-50.clerk.accounts.dev
- **Application ID**: convex (for JWT template)
- **JWT Template Name**: convex

### Convex Configuration
- **Deployment**: dev:striped-gnat-509
- **Authentication**: Clerk JWT integration
- **Functions**: All deployed and ready

## Next Steps

1. ✅ **Complete JWT Template Setup** (primary blocker)
2. ✅ **Test Authentication Flow**
3. ✅ **Verify All Features Work**
4. ✅ **Ready for Production**

Once the JWT template is created, the authentication integration will be complete and all features should work correctly.
