import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, isAdmin: false, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setUser(user);
      if (user) {
        // Simple admin check: hardcoded email or check admins collection
        const expectedAdmins = [
          'minhpham.tst@gmail.com',
          'minhpham.tst+admin@gmail.com',
          'hongquannguyen.1206@gmail.com',
          'hongquannguyen.1206+admin@gmail.com',
          'admin@smartdata.vn'
        ];
        const isMainAdmin = expectedAdmins.includes(user.email || '');
        if (isMainAdmin) {
          setIsAdmin(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, 'admins', user.uid));
            if (adminDoc.exists()) {
              setIsAdmin(true);
            } else if (user.email) {
              const adminDocByEmail = await getDoc(doc(db, 'admins', user.email));
              setIsAdmin(adminDocByEmail.exists());
            } else {
              setIsAdmin(false);
            }
          } catch (error) {
            console.error('Lỗi kiểm tra quyền:', error);
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
