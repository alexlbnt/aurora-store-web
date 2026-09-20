const email = 'admin@aurora.com.br';
const password = 'aurora2024';

async function testLogin() {
  try {
    // 1. Obter CSRF token e cookies de sessão iniciais
    const csrfRes = await fetch('http://localhost:3000/api/auth/csrf');
    const csrfData = await csrfRes.json();
    const csrfCookies = csrfRes.headers.getSetCookie ? csrfRes.headers.getSetCookie() : [csrfRes.headers.get('set-cookie')];
    const initialCookie = csrfCookies.map(c => c.split(';')[0]).join('; ');

    // 2. Realizar autenticação via Credentials
    const res = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': initialCookie
      },
      body: new URLSearchParams({
        email,
        password,
        csrfToken: csrfData.csrfToken,
        redirect: 'false'
      }),
      redirect: 'manual'
    });
    
    console.log('Status code:', res.status);
    
    // Auth.js will return a Set-Cookie on successful login or a redirect.
    const loginCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [res.headers.get('set-cookie')];
    const sessionCookie = loginCookies.find(c => c.includes('authjs.session-token'));

    if (sessionCookie) {
        console.log('SUCCESS: Session token cookie received!');
    } else {
        console.log('FAILED: No session token received. Looking into response...');
        const text = await res.text();
        console.log('Body:', text.substring(0, 200));
        console.log('Headers:', Object.fromEntries(res.headers.entries()));
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testLogin();
