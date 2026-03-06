import { SignJWT } from 'jose';

async function main() {
  const secret = new TextEncoder().encode('shenyun-erp-dev-secret-2026');
  const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
  const expirationSeconds = Math.floor((Date.now() + ONE_YEAR_MS) / 1000);

  const salesToken = await new SignJWT({ openId: 'user-jxw', appId: '', name: '纪祥伟' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(expirationSeconds)
    .sign(secret);

  const adminToken = await new SignJWT({ openId: 'user-demo-user', appId: '', name: '系统管理员' })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setExpirationTime(expirationSeconds)
    .sign(secret);

  console.log('SALES_TOKEN=' + salesToken);
  console.log('ADMIN_TOKEN=' + adminToken);
}

main();
