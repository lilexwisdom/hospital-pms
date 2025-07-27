#!/usr/bin/env node

/**
 * 긴급 비밀번호 재설정 스크립트
 * Service Role Key를 사용하여 rate limit을 우회합니다
 * 
 * 사용법: node scripts/force-password-reset.js <email> <new-password>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase URL 또는 Service Role Key가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function forcePasswordReset(email, newPassword) {
  try {
    console.log(`🔄 ${email} 사용자의 비밀번호를 재설정합니다...`);
    
    // Admin API를 사용하여 비밀번호 업데이트
    const { data, error } = await supabase.auth.admin.updateUserById(
      userId, // 사용자 ID가 필요합니다
      { password: newPassword }
    );
    
    if (error) {
      console.error('❌ 비밀번호 재설정 실패:', error.message);
      return;
    }
    
    console.log('✅ 비밀번호가 성공적으로 재설정되었습니다.');
    console.log('📧 사용자 이메일:', email);
    
  } catch (err) {
    console.error('❌ 오류 발생:', err);
  }
}

// 먼저 사용자 ID를 찾아야 합니다
async function findUserAndReset(email, newPassword) {
  try {
    // 사용자 조회
    const { data: users, error: searchError } = await supabase.auth.admin.listUsers();
    
    if (searchError) {
      console.error('❌ 사용자 조회 실패:', searchError.message);
      return;
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error('❌ 사용자를 찾을 수 없습니다:', email);
      return;
    }
    
    // 비밀번호 업데이트
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );
    
    if (updateError) {
      console.error('❌ 비밀번호 업데이트 실패:', updateError.message);
      return;
    }
    
    console.log('✅ 비밀번호가 성공적으로 재설정되었습니다!');
    console.log('📧 이메일:', email);
    console.log('🆔 사용자 ID:', user.id);
    
  } catch (err) {
    console.error('❌ 예상치 못한 오류:', err);
  }
}

// CLI 실행
const [,, email, newPassword] = process.argv;

if (!email || !newPassword) {
  console.log('사용법: node scripts/force-password-reset.js <email> <new-password>');
  console.log('예시: node scripts/force-password-reset.js user@example.com newPassword123!');
  process.exit(1);
}

findUserAndReset(email, newPassword);