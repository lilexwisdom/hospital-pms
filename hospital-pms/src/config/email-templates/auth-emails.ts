/**
 * Email templates for Supabase Auth
 * These templates should be copied to Supabase Dashboard
 */

export const emailTemplates = {
  confirmation: {
    subject: '[병원 PMS] 이메일 인증을 완료해주세요',
    body: `
<div style="font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
    <h1 style="color: #333; margin: 0;">병원 환자 관리 시스템</h1>
  </div>
  
  <div style="padding: 40px 20px;">
    <h2 style="color: #333; margin-bottom: 20px;">안녕하세요!</h2>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
      병원 환자 관리 시스템에 가입해 주셔서 감사합니다.<br>
      아래 버튼을 클릭하여 이메일 인증을 완료해주세요:
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background-color: #4CAF50; 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                display: inline-block; 
                border-radius: 6px;
                font-weight: bold;
                font-size: 16px;">
        이메일 인증하기
      </a>
    </div>
    
    <p style="color: #999; font-size: 14px; margin-top: 30px;">
      이 링크는 24시간 동안 유효합니다.
    </p>
    
    <p style="color: #666; line-height: 1.6;">
      문의사항이 있으시면 IT 지원팀에 연락해주세요.
    </p>
  </div>
  
  <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
    <p style="font-size: 12px; color: #999; margin: 0;">
      이 이메일은 병원 PMS 시스템에서 자동으로 발송되었습니다.<br>
      본인이 가입하지 않으셨다면 이 이메일을 무시하셔도 됩니다.
    </p>
  </div>
</div>
    `,
  },
  
  passwordReset: {
    subject: '[병원 PMS] 비밀번호 재설정 안내',
    body: `
<div style="font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
    <h1 style="color: #333; margin: 0;">병원 환자 관리 시스템</h1>
  </div>
  
  <div style="padding: 40px 20px;">
    <h2 style="color: #333; margin-bottom: 20px;">비밀번호 재설정</h2>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
      비밀번호 재설정을 요청하셨습니다.<br>
      아래 버튼을 클릭하여 새 비밀번호를 설정해주세요:
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background-color: #FF9800; 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                display: inline-block; 
                border-radius: 6px;
                font-weight: bold;
                font-size: 16px;">
        비밀번호 재설정
      </a>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 30px 0;">
      <p style="color: #856404; margin: 0; font-size: 14px;">
        <strong>⚠️ 보안 알림</strong><br>
        이 링크는 1시간 동안 유효합니다.<br>
        본인이 요청하지 않으셨다면 이 이메일을 무시하고 IT 지원팀에 알려주세요.
      </p>
    </div>
    
    <div style="background-color: #e3f2fd; border: 1px solid #bbdefb; padding: 15px; border-radius: 4px;">
      <p style="color: #1565c0; margin: 0; font-size: 14px;">
        <strong>비밀번호 요구사항:</strong><br>
        • 최소 8자 이상<br>
        • 대문자 포함 (A-Z)<br>
        • 소문자 포함 (a-z)<br>
        • 숫자 포함 (0-9)<br>
        • 특수문자 포함 (!@#$%^&*)
      </p>
    </div>
  </div>
  
  <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
    <p style="font-size: 12px; color: #999; margin: 0;">
      이 이메일은 병원 PMS 시스템에서 자동으로 발송되었습니다.<br>
      보안을 위해 비밀번호는 정기적으로 변경해주시기 바랍니다.
    </p>
  </div>
</div>
    `,
  },
  
  magicLink: {
    subject: '[병원 PMS] 로그인 링크',
    body: `
<div style="font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
    <h1 style="color: #333; margin: 0;">병원 환자 관리 시스템</h1>
  </div>
  
  <div style="padding: 40px 20px;">
    <h2 style="color: #333; margin-bottom: 20px;">로그인 링크</h2>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
      아래 버튼을 클릭하여 로그인하세요:
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background-color: #2196F3; 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                display: inline-block; 
                border-radius: 6px;
                font-weight: bold;
                font-size: 16px;">
        로그인하기
      </a>
    </div>
    
    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 4px; margin: 30px 0;">
      <p style="color: #856404; margin: 0; font-size: 14px;">
        <strong>⏱️ 주의사항</strong><br>
        • 이 링크는 15분 동안 유효합니다.<br>
        • 보안상의 이유로 링크는 한 번만 사용할 수 있습니다.<br>
        • 로그인 후에는 링크가 자동으로 만료됩니다.
      </p>
    </div>
  </div>
  
  <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
    <p style="font-size: 12px; color: #999; margin: 0;">
      이 이메일은 병원 PMS 시스템에서 자동으로 발송되었습니다.<br>
      본인이 요청하지 않으셨다면 이 이메일을 무시하고 IT 지원팀에 알려주세요.
    </p>
  </div>
</div>
    `,
  },
  
  emailChange: {
    subject: '[병원 PMS] 이메일 주소 변경 확인',
    body: `
<div style="font-family: 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #f5f5f5; padding: 20px; text-align: center;">
    <h1 style="color: #333; margin: 0;">병원 환자 관리 시스템</h1>
  </div>
  
  <div style="padding: 40px 20px;">
    <h2 style="color: #333; margin-bottom: 20px;">이메일 주소 변경</h2>
    
    <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
      이메일 주소 변경을 요청하셨습니다.<br>
      아래 버튼을 클릭하여 변경을 확인해주세요:
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="{{ .ConfirmationURL }}" 
         style="background-color: #9C27B0; 
                color: white; 
                padding: 16px 32px; 
                text-decoration: none; 
                display: inline-block; 
                border-radius: 6px;
                font-weight: bold;
                font-size: 16px;">
        이메일 변경 확인
      </a>
    </div>
    
    <p style="color: #666; line-height: 1.6;">
      본인이 요청하지 않으셨다면 즉시 IT 지원팀에 연락해주세요.
    </p>
  </div>
  
  <div style="background-color: #f5f5f5; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
    <p style="font-size: 12px; color: #999; margin: 0;">
      이 이메일은 보안을 위해 발송되었습니다.
    </p>
  </div>
</div>
    `,
  },
};

/**
 * Get email template HTML for copying to Supabase Dashboard
 */
export function getEmailTemplateHTML(type: keyof typeof emailTemplates): string {
  return emailTemplates[type].body.trim();
}

/**
 * Get email subject for copying to Supabase Dashboard
 */
export function getEmailSubject(type: keyof typeof emailTemplates): string {
  return emailTemplates[type].subject;
}