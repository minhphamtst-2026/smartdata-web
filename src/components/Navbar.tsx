import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Smartphone, LogIn, User as UserIcon, ShieldCheck, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { auth } from '../lib/firebase';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Category, SiteConfig, MenuItem } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export const Navbar = () => {
  const { user, isAdmin } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      // Fetch categories
      const q = query(
        collection(db, 'categories'),
        where('active', '==', true),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(q);
      setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));

      // Fetch config
      const cq = collection(db, 'config');
      const cSnapshot = await getDocs(cq);
      if (!cSnapshot.empty) {
        setConfig(cSnapshot.docs[0].data() as SiteConfig);
      }

      // Fetch menus
      const mq = query(
        collection(db, 'menus'),
        where('active', '==', true),
        orderBy('order', 'asc')
      );
      const mSnapshot = await getDocs(mq);
      setMenus(mSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    };
    fetchData();
  }, []);

  const topMenus = menus.filter(m => !m.parentId);
  const getSubMenus = (parentId: string) => menus.filter(m => m.parentId === parentId);

  const handleLogout = () => {
    auth.signOut();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={config?.defaultNetwork ? `/?network=${config.defaultNetwork}` : "/?network=vinaphone"} className="flex flex-col group">
              <span className="text-2xl font-black bg-gradient-to-r from-primary via-primary to-secondary bg-clip-text text-transparent leading-none">
                SmartData
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider">
                {config?.bannerImageUrl || 'Lựa Chọn Thông Minh'}
              </span>
            </Link>
            
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {topMenus.length > 0 ? (
                topMenus.map((menu) => {
                  const subMenus = getSubMenus(menu.id);
                  const hasSubs = subMenus.length > 0;
                  
                  return (
                    <div 
                      key={menu.id} 
                      className="relative flex items-center group"
                      onMouseEnter={() => setActiveDropdown(menu.id)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {!hasSubs ? (
                        <Link
                          to={menu.url || '/?network=vinaphone'}
                          className="text-slate-600 hover:text-primary px-1 py-2 text-sm font-bold transition-colors flex items-center gap-1"
                        >
                          {menu.title}
                        </Link>
                      ) : (
                        menu.url ? (
                          <Link
                            to={menu.url}
                            className="text-slate-600 hover:text-primary px-1 py-2 text-sm font-bold transition-colors flex items-center gap-1"
                          >
                            {menu.title}
                            <ChevronDown className="w-3 h-3" />
                          </Link>
                        ) : (
                          <button className="text-slate-600 hover:text-primary px-1 py-2 text-sm font-bold transition-colors flex items-center gap-1">
                            {menu.title}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        )
                      )}

                      {hasSubs && activeDropdown === menu.id && (
                        <div className="absolute top-full left-0 w-48 bg-white border border-slate-100 shadow-xl rounded-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                          {subMenus.map(sub => (
                            <Link
                              key={sub.id}
                              to={sub.url || '#'}
                              className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                            >
                              {sub.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    className="text-slate-600 hover:text-primary px-3 py-2 rounded-md text-sm font-bold transition-colors"
                  >
                    {cat.name}
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center space-x-1 text-slate-600 hover:text-secondary px-3 py-2 rounded-md text-sm font-medium"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Quản trị</span>
              </Link>
            )}
            
            {user && (
              <div className="flex items-center space-x-3">
                <img src={user.photoURL || ''} alt={user.displayName || ''} className="w-8 h-8 rounded-full border" />
                <button
                  onClick={handleLogout}
                  className="text-sm font-medium text-slate-400 hover:text-primary transition-colors"
                >
                  Thoát
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-600 p-2"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t"
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {topMenus.length > 0 ? (
                topMenus.map((menu) => {
                  const subMenus = getSubMenus(menu.id);
                  const hasSubs = subMenus.length > 0;
                  
                  return (
                    <div key={menu.id} className="space-y-1">
                      {!hasSubs ? (
                        <Link
                          to={menu.url || '/?network=vinaphone'}
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center justify-between px-3 py-2 text-base font-bold text-slate-700 hover:bg-slate-50 hover:text-primary rounded-md"
                        >
                          {menu.title}
                        </Link>
                      ) : (
                        menu.url ? (
                          <Link
                            to={menu.url}
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center justify-between px-3 py-2 text-base font-bold text-slate-700 hover:bg-slate-50 hover:text-primary rounded-md"
                          >
                            {menu.title}
                          </Link>
                        ) : (
                          <div className="px-3 py-2 text-base font-bold text-slate-400">
                            {menu.title}
                          </div>
                        )
                      )}
                      
                      {hasSubs && (
                        <div className="pl-4 space-y-1 border-l-2 border-slate-50 ml-3">
                          {subMenus.map(sub => (
                            <Link
                              key={sub.id}
                              to={sub.url || '#'}
                              onClick={() => setIsMenuOpen(false)}
                              className="block px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-primary rounded-md"
                            >
                              {sub.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/category/${cat.slug}`}
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 text-base font-bold text-slate-700 hover:bg-slate-50 hover:text-primary rounded-md"
                  >
                    {cat.name}
                  </Link>
                ))
              )}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium text-secondary hover:bg-slate-50 rounded-md"
                >
                  Hệ thống Quản trị
                </Link>
              )}
              {user && (
                <button
                  onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md font-bold"
                >
                  Đăng xuất ({user.displayName})
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
