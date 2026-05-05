import React, { useEffect, useState } from 'react';
import { db, handleFirestoreError } from '../../lib/firebase';
import { collection, query, getDocs, updateDoc, doc, deleteDoc, orderBy } from 'firebase/firestore';
import { Order } from '../../types';
import { Phone, MessageSquare, Edit2, Trash2, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
    } catch (error) {
      handleFirestoreError(error, 'list' as any, 'orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: string, status: Order['status']) => {
    try {
      await updateDoc(doc(db, 'orders', id), { status });
      fetchOrders();
    } catch (error) {
      handleFirestoreError(error, 'update' as any, `orders/${id}`);
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) return;
    try {
      await deleteDoc(doc(db, 'orders', id));
      fetchOrders();
    } catch (error) {
      handleFirestoreError(error, 'delete' as any, `orders/${id}`);
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-md text-xs font-bold">Chờ xử lý</span>;
      case 'contacted': return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-bold">Đã liên hệ</span>;
      case 'completed': return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-md text-xs font-bold">Hoàn tất</span>;
      case 'cancelled': return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-md text-xs font-bold">Đã hủy</span>;
      default: return null;
    }
  };

  const getContactMethodBadge = (method: Order['contactMethod']) => {
    switch (method) {
      case 'call': return <span className="flex items-center gap-1 text-slate-600"><Phone className="w-3 h-3"/> Gọi điện</span>;
      case 'zalo': return <span className="flex items-center gap-1 text-blue-600"><MessageSquare className="w-3 h-3"/> Zalo</span>;
      case 'telegram': return <span className="flex items-center gap-1 text-indigo-600"><MessageSquare className="w-3 h-3"/> Telegram</span>;
      default: return null;
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Đang tải đơn hàng...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-black text-slate-800">Quản lý Đơn SIM</h2>
          <p className="text-slate-500">Danh sách khách hàng đặt mua SIM/eSIM</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-bold">Ngày đặt</th>
                <th className="px-6 py-4 font-bold">Khách hàng</th>
                <th className="px-6 py-4 font-bold">Sản phẩm</th>
                <th className="px-6 py-4 font-bold">Liên hệ qua</th>
                <th className="px-6 py-4 font-bold">Trạng thái</th>
                <th className="px-6 py-4 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock className="w-4 h-4" />
                      {order.createdAt?.toDate ? format(order.createdAt.toDate(), 'dd/MM/yyyy HH:mm') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {order.customerPhone}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary">
                    {order.packageName}
                  </td>
                  <td className="px-6 py-4">
                    {getContactMethodBadge(order.contactMethod)}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <select
                        className="p-1.5 rounded-md border text-xs focus:ring-primary outline-none"
                        value={order.status}
                        onChange={(e) => updateStatus(order.id!, e.target.value as Order['status'])}
                      >
                        <option value="pending">Chờ xử lý</option>
                        <option value="contacted">Đã liên hệ</option>
                        <option value="completed">Hoàn tất</option>
                        <option value="cancelled">Đã hủy</option>
                      </select>
                      <button onClick={() => deleteOrder(order.id!)} className="p-2 text-slate-400 hover:text-red-500 bg-white hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Chưa có đơn hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
