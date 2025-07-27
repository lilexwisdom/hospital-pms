# Supabase Auth Configuration Guide

## Overview

This guide provides step-by-step instructions for configuring Supabase Auth settings for the Hospital Patient Management System. These settings must be configured through the Supabase Dashboard.

## Dashboard Access

1. Navigate to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** section in the sidebar

## 1. Email/Password Authentication Setup

### Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Find **Email** provider
3. Toggle **Enable Email provider** to ON
4. Configure the following settings:

```
✅ Enable Email provider
✅ Confirm email (recommended for production)
❌ Enable email link sign-in (disabled for security)
✅ Use a custom SMTP server (for production)
```

### SMTP Configuration (Production)

Configure custom SMTP for reliable email delivery:

```
SMTP Host: smtp.gmail.com (or your provider)
SMTP Port: 587
SMTP User: your-email@hospital.com
SMTP Pass: your-app-specific-password
Sender Email: noreply@hospital.com
Sender Name: Hospital PMS
```

## 2. Session Configuration

### Navigate to Authentication → Settings

Configure session settings:

```
Session Duration: 28800 (8 hours)
JWT Expiry: 28800 (8 hours)
```

### Session Configuration Rationale

- **8-hour session**: Balances security with user convenience for a workday
- Sessions expire at the end of a typical work shift
- Users must re-authenticate daily for security

## 3. Password Policy Configuration

### Navigate to Authentication → Settings → Password Policy

Configure strong password requirements:

```yaml
Minimum Password Length: 8
Password Requirements:
  ✅ Require uppercase letter (A-Z)
  ✅ Require lowercase letter (a-z)
  ✅ Require number (0-9)
  ✅ Require special character (!@#$%^&*)
  
Password Strength Meter: Enabled
Check Pwned Passwords: Enabled (recommended)
```

### Password Policy Enforcement

```typescript
// Example validation regex (matches Supabase policy)
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
```

## 4. Email Templates Configuration

### Navigate to Authentication → Email Templates

Customize email templates for Korean users:

### 4.1 Confirmation Email (Sign Up)

**Subject**: `[병원 PMS] 이메일 인증을 완료해주세요`

**Body**:
```html
<h2>안녕하세요!</h2>
<p>병원 환자 관리 시스템에 가입해 주셔서 감사합니다.</p>
<p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요:</p>
<p>
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #4CAF50; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">
    이메일 인증하기
  </a>
</p>
<p>이 링크는 24시간 동안 유효합니다.</p>
<p>문의사항이 있으시면 IT 지원팀에 연락해주세요.</p>
<hr>
<p style="font-size: 12px; color: #666;">
  이 이메일은 병원 PMS 시스템에서 자동으로 발송되었습니다.
  본인이 가입하지 않으셨다면 이 이메일을 무시하셔도 됩니다.
</p>
```

### 4.2 Password Reset Email

**Subject**: `[병원 PMS] 비밀번호 재설정 안내`

**Body**:
```html
<h2>비밀번호 재설정</h2>
<p>비밀번호 재설정을 요청하셨습니다.</p>
<p>아래 버튼을 클릭하여 새 비밀번호를 설정해주세요:</p>
<p>
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #FF9800; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">
    비밀번호 재설정
  </a>
</p>
<p>이 링크는 1시간 동안 유효합니다.</p>
<p>본인이 요청하지 않으셨다면 이 이메일을 무시하고 IT 지원팀에 알려주세요.</p>
<hr>
<p style="font-size: 12px; color: #666;">
  보안을 위해 비밀번호는 다음 조건을 충족해야 합니다:
  <br>• 최소 8자 이상
  <br>• 대문자, 소문자, 숫자, 특수문자 포함
</p>
```

### 4.3 Magic Link Email (if enabled)

**Subject**: `[병원 PMS] 로그인 링크`

**Body**:
```html
<h2>로그인 링크</h2>
<p>아래 버튼을 클릭하여 로그인하세요:</p>
<p>
  <a href="{{ .ConfirmationURL }}" 
     style="background-color: #2196F3; color: white; padding: 14px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">
    로그인하기
  </a>
</p>
<p>이 링크는 15분 동안 유효합니다.</p>
<p>보안상의 이유로 링크는 한 번만 사용할 수 있습니다.</p>
```

## 5. Security Settings

### Navigate to Authentication → Settings → Security

Configure security settings:

```yaml
Enable RLS for auth schema: ✅ Enabled
Enable captcha protection: ✅ Enabled (for sign-up)
Captcha provider: hCaptcha (recommended)
```

### Rate Limiting

Configure rate limiting for auth endpoints:

```yaml
Sign-up rate limit: 5 per hour per IP
Sign-in rate limit: 10 per hour per IP
Password reset rate limit: 3 per hour per IP
```

## 6. Redirect URLs Configuration

### Navigate to Authentication → URL Configuration

Configure allowed redirect URLs:

```
Site URL: https://your-hospital-domain.com
Redirect URLs:
  - https://your-hospital-domain.com/**
  - http://localhost:3000/** (development only)
```

## 7. User Management Settings

### Default User Metadata

When creating users, include role information:

```json
{
  "user_metadata": {
    "role": "bd",
    "department": "Business Development",
    "name": "홍길동"
  }
}
```

### Automatic Profile Creation

The database trigger `on_auth_user_created` automatically creates a profile when a user signs up. Ensure this trigger is active.

## 8. Environment Variables

Update your `.env.local` file with Supabase Auth variables:

```bash
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Session Configuration
NEXT_PUBLIC_SESSION_TIMEOUT=28800000  # 8 hours in milliseconds
```

## 9. Testing Configuration

### Test Checklist

After configuration, test the following:

1. **Sign Up Flow**
   - [ ] User can sign up with email/password
   - [ ] Confirmation email is received
   - [ ] Email confirmation works
   - [ ] Profile is auto-created

2. **Sign In Flow**
   - [ ] User can sign in with correct credentials
   - [ ] Invalid credentials show error
   - [ ] Session persists for 8 hours

3. **Password Reset**
   - [ ] Reset email is sent
   - [ ] Reset link works
   - [ ] New password meets policy

4. **Security**
   - [ ] Rate limiting works
   - [ ] Password policy enforced
   - [ ] RLS policies active

## 10. Monitoring & Logs

### Enable Auth Logs

1. Go to **Authentication** → **Logs**
2. Monitor for:
   - Failed login attempts
   - Password reset requests
   - Sign-up patterns
   - Suspicious activity

### Set Up Alerts

Configure alerts for:
- Multiple failed login attempts
- Unusual sign-up volume
- Password reset abuse

## Maintenance

### Regular Tasks

1. **Weekly**
   - Review auth logs for anomalies
   - Check failed login patterns

2. **Monthly**
   - Review and update rate limits
   - Audit user sessions
   - Update email templates if needed

3. **Quarterly**
   - Review password policy
   - Update security settings
   - Rotate SMTP credentials

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check SMTP configuration
   - Verify sender email is verified
   - Check email logs in dashboard

2. **Session expires too quickly**
   - Verify JWT expiry matches session duration
   - Check client-side session handling

3. **Password reset not working**
   - Confirm redirect URLs are configured
   - Check email template variables
   - Verify rate limits

## Support

For issues with Supabase Auth configuration:

1. Check [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
2. Review auth logs in dashboard
3. Contact IT support team
4. Submit ticket to Supabase support (for infrastructure issues)