# Daum Postcode Integration Debugging Guide

## Changes Made

### 1. **Security Headers Updated** (`/src/lib/supabase/middleware.ts`)
- Removed `X-Frame-Options: DENY` header that was blocking iframes
- Added comprehensive CSP (Content Security Policy) headers that specifically allow Daum postcode domains:
  - `script-src`: Allows scripts from `t1.daumcdn.net` and `postcode.map.daum.net`
  - `frame-src`: Allows iframes from `postcode.map.daum.net`
  - `style-src`: Allows styles from `t1.daumcdn.net`
  - `connect-src`: Allows API connections to Daum domains

### 2. **Created Alternative Modal Implementation** (`/src/components/survey/address-search-modal-simple.tsx`)
- Simple modal without using Radix UI Dialog component
- Direct DOM manipulation approach
- No CSS Grid conflicts
- Currently active in the survey form for testing

### 3. **Enhanced Original Modal** (`/src/components/survey/address-search-modal.tsx`)
- Added better debugging logs
- Increased initialization delays
- Added forced iframe styling
- Added postcodeRef to store instance

### 4. **Created Test Page** (`/src/app/test-daum-postcode/page.tsx`)
- Standalone test page at `/test-daum-postcode`
- Includes both embedded and popup modes
- Comprehensive logging system
- Shows real-time debug information

## Debugging Steps

### 1. **Test Basic Functionality**
Navigate to `/test-daum-postcode` and:
- Check if the script loads successfully
- Try the popup mode first (usually more reliable)
- Try the embedded mode
- Check the debug logs for any errors

### 2. **Check Browser Console**
Look for:
- CSP violations
- Mixed content warnings
- JavaScript errors from Daum postcode
- Network errors loading resources

### 3. **Verify Network Requests**
In browser DevTools Network tab:
- Check if `postcode.v2.js` loads successfully
- Check if iframe content loads from `postcode.map.daum.net`
- Look for any blocked requests

### 4. **Common Issues and Solutions**

#### Issue: Iframe not visible
**Solutions:**
- Check if parent container has proper dimensions
- Verify no CSS `display: none` or `visibility: hidden`
- Check z-index conflicts
- Ensure no overflow hidden on parents

#### Issue: Script fails to load
**Solutions:**
- Check network connectivity
- Verify CSP headers allow the domain
- Try with `https:` prefix instead of `//`
- Check for ad blockers

#### Issue: Modal conflicts
**Solutions:**
- Use the simple modal implementation
- Remove CSS Grid from dialog content
- Set explicit dimensions on containers

## Testing Checklist

1. [ ] Test page (`/test-daum-postcode`) works with popup mode
2. [ ] Test page works with embedded mode
3. [ ] Survey form (`/survey/[token]`) shows address modal
4. [ ] Address selection populates form fields correctly
5. [ ] Modal closes after selection
6. [ ] No console errors or warnings
7. [ ] Works in both light and dark themes

## Production Deployment Notes

1. **Environment Variables**: No additional env vars needed
2. **Domain Whitelisting**: Ensure your production domain allows frames from `postcode.map.daum.net`
3. **HTTPS**: Production must use HTTPS for security
4. **CSP Headers**: May need adjustment based on your production security requirements

## Rollback Instructions

To rollback to original Dialog-based modal:
1. In `/src/components/survey/steps/step2-contact-info.tsx`:
   - Change `AddressSearchModalSimple` back to `AddressSearchModal`
   - Remove the simple modal import

2. In `/src/lib/supabase/middleware.ts`:
   - Restore `X-Frame-Options: DENY` if needed
   - Remove CSP headers if causing issues

## Alternative Solutions

If Daum postcode continues to have issues:

1. **Use Popup Mode Only**: Modify to always use `.open()` instead of `.embed()`
2. **Server-Side Proxy**: Create an API route that fetches postcode data
3. **Alternative Services**: Consider Korea Post API or Kakao Maps API
4. **Manual Entry**: Provide fallback manual address entry form