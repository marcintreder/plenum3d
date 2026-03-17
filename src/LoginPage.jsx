import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { TOKEN_LIFETIME_MS } from './AuthProvider.jsx';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l6-6C34.4 6.5 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.9 5.1C14.9 16.1 19.1 13 24 13c3 0 5.7 1.1 7.8 2.9l6-6C34.4 6.5 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-3.5-11.2-8.2l-6.9 5.3C9.5 39.4 16.3 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.2 5.6l6.2 5.2C41 35.2 44 30 44 24c0-1.3-.1-2.7-.4-4z"/>
  </svg>
);

const LoginPage = ({ onLogin }) => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
      }).then(r => r.json());

      onLogin({
        id: userInfo.sub,
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture,
        credential: tokenResponse.access_token,
        tokenExpiresAt: Date.now() + TOKEN_LIFETIME_MS,
      });
    },
    onError: (err) => console.error('Google sign-in failed', err),
  });

  return (
    <div className="flex h-screen w-screen bg-[#0F0F0F] text-white items-center justify-center">
      <div className="flex flex-col items-center gap-8">
        {/* Logo / wordmark */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 bg-[#7C3AED]/20 rounded-2xl flex items-center justify-center border border-[#7C3AED]/30">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Plenum<span className="text-[#7C3AED]">3D</span></h1>
          <p className="text-sm text-gray-500">AI-powered 3D modeling</p>
        </div>

        {/* Capabilities pitch */}
        <div className="grid grid-cols-2 gap-3 w-80">
          {[
            { icon: '✦', label: 'AI model generation', desc: 'Describe anything — Claude builds it in 3D' },
            { icon: '◈', label: 'Natural language edits', desc: 'Move, resize, recolor with plain English' },
            { icon: '⬡', label: 'Primitive sculpting', desc: 'Boxes, spheres, lathe, extrude & more' },
            { icon: '↓', label: 'GLB export', desc: 'Drop your models straight into any 3D pipeline' },
          ].map(({ icon, label, desc }) => (
            <div key={label} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-3 flex flex-col gap-1">
              <span className="text-[#7C3AED] text-base leading-none">{icon}</span>
              <span className="text-[11px] font-semibold text-white leading-tight">{label}</span>
              <span className="text-[10px] text-gray-500 leading-tight">{desc}</span>
            </div>
          ))}
        </div>

        {/* Sign-in card */}
        <div className="bg-[#1A1A1A] border border-[#333] rounded-3xl p-8 flex flex-col items-center gap-5 w-80 shadow-2xl">
          <div className="text-center">
            <h2 className="text-lg font-semibold mb-1">Sign in to continue</h2>
            <p className="text-xs text-gray-500">Your projects and scenes are saved to your account</p>
          </div>

          <button
            onClick={() => login()}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 font-medium text-sm py-2.5 px-4 rounded-full transition-colors shadow"
          >
            <GoogleIcon />
            Sign in with Google
          </button>
        </div>

        <p className="text-[10px] text-gray-600 text-center max-w-xs">
          By signing in you agree to use this tool responsibly.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
