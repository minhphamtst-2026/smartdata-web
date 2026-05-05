import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound } from 'lucide-react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export const Login = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  useEffect(() => {
    if (user && !authLoading) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        // If they are logged in but not an admin
        setError('Tài khoản của bạn không có quyền quản trị viên.');
        const auth = getAuth();
        auth.signOut();
      }
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetMessage('');
    
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setLoading(true);
    try {
      const auth = getAuth();
      if (isRegistering) {
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        await createUserWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.toLowerCase().trim(), password);
      }
    } catch (err: any) {
      console.error('Auth failed', err);
      if (err.message.includes('auth/invalid-credential') || err.message.includes('auth/user-not-found')) {
        setError('Email hoặc mật khẩu không chính xác.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Email này đã được đăng ký. Vui lòng chuyển sang tab Đăng nhập.');
      } else if (err.code === 'auth/weak-password') {
        setError('Mật khẩu quá yếu, vui lòng chọn mật khẩu dài hơn.');
      } else {
        setError('Lỗi xác thực: ' + (err.message || 'Không xác định'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Vui lòng nhập email mục trên để gửi link khôi phục');
      return;
    }
    
    setLoading(true);
    setError('');
    setResetMessage('');
    try {
      const { sendPasswordResetEmail, createUserWithEmailAndPassword, getAuth } = await import('firebase/auth');
      const auth = getAuth();
      const targetEmail = email.toLowerCase().trim();
      
      try {
        await sendPasswordResetEmail(auth, targetEmail);
      } catch (innerErr: any) {
        if (innerErr.code === 'auth/user-not-found' || innerErr.message?.includes('user-not-found')) {
          // If user doesn't exist, create a dummy one using a secondary app
          const { initializeApp, getApp } = await import('firebase/app');
          const firebaseConfig = (await import('../../firebase-applet-config.json')).default;
          
          let secondaryApp;
          try {
            secondaryApp = initializeApp(firebaseConfig, 'SecondaryAppReset');
          } catch (e) {
            secondaryApp = getApp('SecondaryAppReset');
          }
          const secondaryAuth = getAuth(secondaryApp);
          const randomPass = Math.random().toString(36).slice(-10) + 'A1!'; // strong password
          
          // Create the user
          await createUserWithEmailAndPassword(secondaryAuth, targetEmail, randomPass);
          await secondaryAuth.signOut();
          
          // Add a small delay so Firebase backend syncs the new user
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Now standard auth can send the reset email
          await sendPasswordResetEmail(auth, targetEmail);
        } else {
          throw innerErr;
        }
      }
      setResetMessage(`Đã gửi hướng dẫn thiết lập mật khẩu đến ${email}. Hãy kiểm tra hộp thư của bạn (cả mục Spam) để tạo mật khẩu đăng nhập.`);
    } catch (err: any) {
      console.error('Reset password failed', err);
      setError('Không thể gửi email. Lỗi: ' + (err.message || 'Lỗi mạng.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100 text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-800">Quản trị</h1>
          <p className="text-slate-500 font-medium">Hệ thống quản trị SmartData</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            className={`flex-1 py-2 font-bold text-sm rounded-lg transition-colors ${!isRegistering ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setIsRegistering(false)}
          >
            Đăng nhập
          </button>
          <button 
            className={`flex-1 py-2 font-bold text-sm rounded-lg transition-colors ${isRegistering ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setIsRegistering(true)}
          >
            Đăng ký
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm font-semibold border border-red-100">
            {error}
          </div>
        )}

        {resetMessage && (
          <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm font-semibold border border-green-100">
            {resetMessage}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4 text-left">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
              placeholder="VD: email@gmail.com"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mật khẩu {isRegistering ? '(Mới)' : ''}</label>
              {!isRegistering && (
                <button type="button" onClick={handleForgotPassword} className="text-xs font-bold text-primary hover:underline">
                  Quên mật khẩu?
                </button>
              )}
            </div>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
              placeholder="Nhập mật khẩu"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 px-8 rounded-2xl font-bold flex items-center justify-center space-x-3 hover:bg-primary-dark transition-all shadow-xl shadow-primary/20 disabled:opacity-70 mt-2"
          >
            <KeyRound className="w-5 h-5" />
            <span>{loading ? 'Đang xử lý...' : (isRegistering ? 'Tạo tài khoản' : 'Đăng nhập')}</span>
          </button>
        </form>

        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          Chỉ có Quản trị viên mới được truy cập
        </p>
      </div>
    </div>
  );
};
