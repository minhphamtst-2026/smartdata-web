import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Shield, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json'; // Note: check actual path for this file

interface AdminUser {
  id: string; // The UID
  username: string; // The username (derived from fake email)
}

export const AdminAdmins = () => {
  const { user } = useAuth();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const expectedAdmins = [
    'minhpham.tst@gmail.com',
    'minhpham.tst+admin@gmail.com',
    'hongquannguyen.1206@gmail.com',
    'hongquannguyen.1206+admin@gmail.com',
    'admin@smartdata.vn'
  ];
  const isSuperAdmin = expectedAdmins.includes(user?.email || '');

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
  }, [isSuperAdmin]);

  const fetchAdmins = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'admins'));
      const adminData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdminUser));
      setAdmins(adminData);
    } catch (err: any) {
      console.error(err);
      alert('Lỗi tải danh sách QTV');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newPassword) return;
    
    setIsProcessing(true);
    try {
      const username = newUsername.toLowerCase().trim();
      if (!/^[a-z0-9_]+$/.test(username)) {
        throw new Error('Tên đăng nhập chỉ được chứa chữ cái thường, số và dấu gạch dưới');
      }
      
      const email = `${username}@smartdata.vn`;

      // Use a secondary app to create user without signing out the current owner
      let secondaryApp;
      try {
        secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
      } catch (e) {
        // @ts-ignore
        secondaryApp = getApp('SecondaryApp');
      }
      const secondaryAuth = getAuth(secondaryApp);
      
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, newPassword);
      const newUserId = userCredential.user.uid;
      
      await secondaryAuth.signOut(); // Important

      // Now save to Firestore admins collection
      await setDoc(doc(db, 'admins', newUserId), { username, email });
      
      setNewUsername('');
      setNewPassword('');
      setIsAdding(false);
      fetchAdmins();
      alert('Đã thêm Quản trị viên mới thành công.');
    } catch (err: any) {
      if (err.message.includes('auth/email-already-in-use')) {
         alert('Lỗi: Tên đăng nhập này đã tồn tại!');
      } else {
         alert('Lỗi: ' + (err.message || 'Lỗi không xác định'));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveAdmin = async (id: string) => {
    // Note: We cannot delete the Auth user from client SDK, only their Firestore admin access.
    // They will lose access instantly, which is secure.
    if (!confirm('Bạn có chắc chắn muốn xóa quyền Quản trị viên này? Họ sẽ không thể truy cập ngay lập tức, nhưng để xóa hẳn tài khoản, bạn cần vào Firebase Console.')) return;
    try {
      await deleteDoc(doc(db, 'admins', id));
      fetchAdmins();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    }
  };

  if (!isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Quản trị viên</h1>
          <p className="text-slate-500">Quản lý những người có thể truy cập trang Quản trị (Dành riêng cho bạn)</p>
          <p className="text-xs text-blue-600 font-semibold mt-1">Để đặt lại mật khẩu cho thành viên, vui lòng vào Firebase Console &gt; Authentication.</p>
        </div>
        {!isAdding && (
          <button onClick={() => setIsAdding(true)} className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
            <Plus className="w-4 h-4" /> Thêm QTV
          </button>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddAdmin} className="bg-white p-6 rounded-3xl shadow-sm border mb-6 max-w-xl">
          <h2 className="text-lg font-bold mb-4">Thêm Quản trị viên mới</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1 block">Tên đăng nhập</label>
              <input 
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={newUsername} 
                onChange={e => setNewUsername(e.target.value)} 
                placeholder="VD: nhanvien_1"
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-1 block">Mật khẩu</label>
              <input 
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={newPassword} 
                onChange={e => setNewPassword(e.target.value)} 
                placeholder="Nhập mật khẩu cho QTV"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100" disabled={isProcessing}>
                Hủy
              </button>
              <button type="submit" className="bg-primary text-white px-6 py-3 rounded-xl font-bold" disabled={isProcessing}>
                {isProcessing ? 'Đang thêm...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </form>
      )}

      {loading ? (
        <div className="animate-pulse flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
          <ul className="divide-y divide-slate-100">
            <li className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800">minhpham.tst@gmail.com</div>
                  <div className="text-xs font-semibold text-primary">Super Admin (Chủ sở hữu)</div>
                </div>
              </div>
            </li>
            <li className="p-6 flex items-center justify-between border-t border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-800">hongquannguyen.1206@gmail.com</div>
                  <div className="text-xs font-semibold text-primary">Super Admin (Chủ sở hữu)</div>
                </div>
              </div>
            </li>
            {admins.filter((a: any) => 
              !expectedAdmins.includes(a.id) && !expectedAdmins.includes(a.email)
            ).map(admin => (
              <li key={admin.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Shield className="w-5 h-5 text-slate-400" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">{admin.username || (admin as any).email || admin.id}</div>
                    <div className="text-xs text-slate-500">Quản trị viên (Phụ)</div>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveAdmin(admin.id)}
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Xóa QTV"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
