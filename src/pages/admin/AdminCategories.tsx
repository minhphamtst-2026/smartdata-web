import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../../lib/firebase';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { Category } from '../../types';
import { Plus, Edit2, Trash2, X, Save } from 'lucide-react';
import { cn } from '../../lib/utils';

export const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({});
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'categories'), orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category));
      setCategories(data);
    } catch (e) {
      handleFirestoreError(e, 'list', 'categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateDoc(doc(db, 'categories', editingId), formData);
        setEditingId(null);
      } else {
        await addDoc(collection(db, 'categories'), { ...formData, active: true });
        setIsAdding(false);
      }
      setFormData({});
      fetchData();
    } catch (e) {
      handleFirestoreError(e, 'write', 'categories');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa danh mục sẽ ảnh hưởng đến các gói cước liên quan. Tiếp tục?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      fetchData();
    } catch (e) {
      handleFirestoreError(e, 'delete', 'categories');
    }
  };

  const seedCategories = async () => {
    const defaults = [
      { name: 'Gói Data', slug: 'data', order: 1, active: true },
      { name: 'Gói Combo', slug: 'combo', order: 2, active: true },
      { name: 'Gói Thoại', slug: 'thoai', order: 3, active: true },
    ];
    for (const cat of defaults) {
      await addDoc(collection(db, 'categories'), cat);
    }
    fetchData();
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Danh mục</h1>
        <div className="space-x-2">
          {categories.length === 0 && (
            <button onClick={seedCategories} className="text-slate-500 hover:text-slate-700 text-sm font-bold bg-slate-100 px-4 py-2 rounded-full">
              Khởi tạo mặc định
            </button>
          )}
          <button onClick={() => setIsAdding(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Thêm danh mục
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">{isAdding ? 'Thêm danh mục mới' : 'Sửa danh mục'}</h2>
            <button onClick={() => { setIsAdding(false); setEditingId(null); }} className="text-slate-400 hover:text-slate-600">
              <X />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              placeholder="Tên danh mục (VD: Gói Data)" 
              className="px-4 py-2 rounded-xl border"
              value={formData.name || ''} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
            <input 
              placeholder="Slug (VD: data)" 
              className="px-4 py-2 rounded-xl border"
              value={formData.slug || ''} 
              onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} 
            />
            <input 
              type="number" 
              placeholder="Thứ tự hiển thị" 
              className="px-4 py-2 rounded-xl border"
              value={formData.order || ''} 
              onChange={e => setFormData({...formData, order: Number(e.target.value)})} 
            />
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave} className="btn-secondary px-8 flex items-center gap-2">
              <Save className="w-4 h-4" /> Lưu
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Thứ tự</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Tên</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Slug</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {categories.map(cat => (
              <tr key={cat.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-slate-400">{cat.order}</td>
                <td className="px-6 py-4 font-bold text-slate-800">{cat.name}</td>
                <td className="px-6 py-4 text-slate-600">/{cat.slug}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => { setEditingId(cat.id); setFormData(cat); }} className="text-blue-500 p-2"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(cat.id)} className="text-red-500 p-2"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
