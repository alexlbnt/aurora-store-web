const email = 'admin@aurora.com.br';
const password = 'aurora2024';

async function testLogin() {
  try {
    const res = await fetch('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email,
        password,
        redirect: 'false'
      })
    });
    
    console.log('Status code:', res.status);
    
    // Auth.js will return a Set-Cookie on successful login or a redirect.
    const cookies = res.headers.get('set-cookie');
    if (cookies && cookies.includes('authjs.session-token')) {
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
