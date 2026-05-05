import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, where } from 'firebase/firestore';
import { MenuItem } from '../../types';
import { Plus, Edit2, Trash2, Save, X, MoveUp, MoveDown, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export const AdminMenus = () => {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MenuItem>>({
    title: '',
    url: '',
    parentId: null,
    order: 0,
    active: true
  });

  useEffect(() => {
    fetchMenus();
  }, []);

  const fetchMenus = async () => {
    try {
      const q = query(collection(db, 'menus'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      setMenus(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MenuItem)));
    } catch (error) {
      console.error('Error fetching menus', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'menus', editingId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'menus'), {
          ...formData,
          order: menus.length,
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setIsAdding(false);
      setEditingId(null);
      setFormData({ title: '', url: '', parentId: null, order: 0, active: true });
      fetchMenus();
    } catch (error) {
      console.error('Error saving menu', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa menu này?')) return;
    try {
      await deleteDoc(doc(db, 'menus', id));
      fetchMenus();
    } catch (error) {
      console.error('Error deleting menu', error);
    }
  };

  const startEdit = (menu: MenuItem) => {
    setFormData(menu);
    setEditingId(menu.id);
    setIsAdding(true);
  };

  const topMenus = menus.filter(m => !m.parentId);
  const getSubMenus = (parentId: string) => menus.filter(m => m.parentId === parentId);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Quản lý Menu</h1>
          <p className="text-slate-500">Thiết lập menu chính và menu cấp 2 cho website</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setFormData({ title: '', url: '', parentId: null, order: 0, active: true });
          }}
          className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
        >
          <Plus className="w-5 h-5" />
          <span>Thêm Menu</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-[32px] shadow-xl border border-slate-100 animate-in fade-in slide-in-from-top-4">
          <form onSubmit={handleSave} className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800">
              {editingId ? 'Chỉnh sửa Menu' : 'Thêm Menu mới'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Tiêu đề Menu</label>
                <input 
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})} 
                  placeholder="VD: Khuyến mãi"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Đường dẫn (URL)</label>
                <input 
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                  value={formData.url || ''} 
                  onChange={e => setFormData({...formData, url: e.target.value})} 
                  placeholder="VD: /khuyen-mai"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Menu Cha (để tạo menu cấp 2)</label>
                <select 
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none bg-white"
                  value={formData.parentId || ''} 
                  onChange={e => setFormData({...formData, parentId: e.target.value || null})}
                >
                  <option value="">Không có (Menu cấp 1)</option>
                  {topMenus.filter(m => m.id !== editingId).map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Thứ tự hiển thị</label>
                <input 
                  type="number"
                  className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                  value={formData.order} 
                  onChange={e => setFormData({...formData, order: Number(e.target.value)})} 
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button 
                type="submit"
                className="bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20"
              >
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="divide-y divide-slate-100">
          {topMenus.map(menu => (
            <div key={menu.id}>
              <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="bg-slate-100 p-2 rounded-lg font-bold text-slate-500 text-xs">#{menu.order}</div>
                  <div>
                    <h3 className="font-bold text-slate-800">{menu.title}</h3>
                    <p className="text-xs text-slate-400 font-mono">{menu.url || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={() => startEdit(menu)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(menu.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Submenus */}
              <div className="bg-slate-50/50 divide-y divide-slate-100">
                {getSubMenus(menu.id).map(sub => (
                  <div key={sub.id} className="p-4 pl-12 flex items-center justify-between hover:bg-slate-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                      <div>
                        <h4 className="font-semibold text-slate-700 text-sm">{sub.title}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">{sub.url || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => startEdit(sub)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg">
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button onClick={() => handleDelete(sub.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {loading && <div className="p-12 text-center text-slate-400">Đang tải dữ liệu...</div>}
          {!loading && topMenus.length === 0 && <div className="p-12 text-center text-slate-400 italic">Chưa có menu nào. Nhấn "Thêm Menu" để bắt đầu.</div>}
        </div>
      </div>
    </div>
  );
};
