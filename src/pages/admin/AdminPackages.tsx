import React, { useState, useEffect, useRef } from 'react';
import { db, handleFirestoreError } from '../../lib/firebase';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { Package, Category } from '../../types';
import { Edit2, Trash2, Plus, X, Save, FileDown, FileUp, Search } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import * as XLSX from 'xlsx';

export const AdminPackages = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [filterNetwork, setFilterNetwork] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Partial<Package>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pSnapshot = await getDocs(collection(db, 'packages'));
      setPackages(pSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Package)));
      
      const cSnapshot = await getDocs(collection(db, 'categories'));
      setCategories(cSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    } catch (e) {
      handleFirestoreError(e, 'list', 'packages');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = packages.map(p => {
       const cat = categories.find(c => c.id === p.categoryId);
       return {
          Name: p.name || '',
          Network: p.network || '',
          Price: p.price || 0,
          DataAmount: p.dataAmount || '',
          VoiceMinutes: p.voiceMinutes || '',
          SmsAmount: p.smsAmount || '',
          Validity: p.validity || '',
          CategorySlug: cat?.slug || '',
          Order: p.order || '',
          RegistrationSyntax: p.registrationSyntax || '',
          RegistrationNumber: p.registrationNumber || '',
          Badge: p.badge || '',
          HighlightPromo: p.highlightPromo || '',
          RegisterButtonText: p.registerButtonText || '',
          Description: p.description || '',
          LongDescription: p.longDescription || '',
          Featured: p.featured ? 'TRUE' : 'FALSE',
          Active: p.active !== false ? 'TRUE' : 'FALSE'
       };
    });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Packages");
    XLSX.writeFile(wb, "Packages_Data.xlsx");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Quá trình nhập dữ liệu có thể mất một vài giây và sẽ tạo các gói cước MỚI. Tiếp tục?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);

    // Yield control to React to render the "Đang thực hiện..." spinner
    setTimeout(() => {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          
          let importedCount = 0;
          let validRows = [];

          for (const row of data as any[]) {
            if (!row.Name || !row.Network || row.Price === undefined || row.Price === '' || !row.RegistrationSyntax || !row.RegistrationNumber) {
              continue; // skip invalid rows
            }
            validRows.push(row);
          }

          if (validRows.length === 0) {
            alert('Không có dữ liệu hợp lệ trong file Excel. Vui lòng kiểm tra lại định dạng các cột (Name, Network, Price, RegistrationSyntax, RegistrationNumber).');
            setIsImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
          }

          // Process in batches of 400 (Firebase max is 500)
          const MAX_BATCH_SIZE = 400;
          for (let i = 0; i < validRows.length; i += MAX_BATCH_SIZE) {
            const chunk = validRows.slice(i, i + MAX_BATCH_SIZE);
            const batch = writeBatch(db);

            for (const row of chunk) {
              let catId = categories[0]?.id || '';
              if (row.CategorySlug) {
                 const cat = categories.find(c => c.slug === row.CategorySlug);
                 if (cat) catId = cat.id;
              }
              
              const networkVal = row.Network.toString().toLowerCase();

              const pkgData: any = {
                name: row.Name.toString(),
                network: (['viettel', 'vinaphone', 'mobifone'].includes(networkVal) ? networkVal : 'viettel') as any,
                price: Number(row.Price),
                dataAmount: row.DataAmount?.toString() || '',
                voiceMinutes: row.VoiceMinutes?.toString() || '',
                smsAmount: row.SmsAmount?.toString() || '',
                validity: row.Validity?.toString() || '',
                categoryId: catId,
                registrationSyntax: row.RegistrationSyntax.toString(),
                registrationNumber: row.RegistrationNumber.toString(),
                badge: row.Badge?.toString() || '',
                highlightPromo: row.HighlightPromo?.toString() || '',
                registerButtonText: row.RegisterButtonText?.toString() || '',
                description: row.Description?.toString() || '',
                longDescription: row.LongDescription?.toString() || '',
                featured: row.Featured === true || row.Featured === 'true' || row.Featured === 'TRUE',
                active: row.Active === undefined ? true : (row.Active === true || row.Active === 'true' || row.Active === 'TRUE'),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };
              if (row.Order !== undefined && row.Order !== null && row.Order !== '') {
                pkgData.order = Number(row.Order);
              }

              const newDocRef = doc(collection(db, 'packages'));
              batch.set(newDocRef, pkgData);
              importedCount++;
            }
            await batch.commit();
          }
          
          alert(`Đã nhập thành công ${importedCount} gói cước từ Excel.`);
          fetchData();
        } catch (err: any) {
          console.error('Import error details:', err);
          alert('Lỗi khi xử lý file Excel hoặc khi lưu vào DataBase. Hệ thống: ' + (err?.message || err?.toString() || 'Không rõ'));
          handleFirestoreError(err, 'write', 'packages');
        } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.onerror = (err) => {
        console.error("FileReader Error: ", err);
        alert('Lỗi khi đọc file.');
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsBinaryString(file);
    }, 50);
  };

  const seedDefaultPackages = async () => {
    if (!categories.length) {
      alert('Vui lòng tạo Danh mục trước khi khởi tạo gói cước!');
      return;
    }
    setLoading(true);
    try {
      const dataCat = categories.find(c => c.slug === 'data')?.id || categories[0].id;
      const comboCat = categories.find(c => c.slug === 'combo')?.id || categories[0].id;

      const defaults = [
        // Viettel
        { name: 'V90C', network: 'viettel', price: 90000, validity: '30 Ngày', dataAmount: '30GB', voiceMinutes: 'Miễn phí nội mạng', categoryId: comboCat, registrationSyntax: 'V90C', registrationNumber: '9123', badge: 'HOT', active: true, featured: true },
        { name: 'V120N', network: 'viettel', price: 120000, validity: '30 Ngày', dataAmount: '120GB', voiceMinutes: 'Miễn phí nội mạng + 50p ngoại mạng', categoryId: comboCat, registrationSyntax: 'V120N', registrationNumber: '9123', badge: 'BÁN CHẠY', active: true, featured: true },
        { name: 'ST90K', network: 'viettel', price: 90000, validity: '30 Ngày', dataAmount: '30GB', categoryId: dataCat, registrationSyntax: 'ST90K', registrationNumber: '9123', badge: 'MỚI', active: true, featured: true },
        
        // Vinaphone
        { name: 'D159V', network: 'vinaphone', price: 159000, validity: '30 Ngày', dataAmount: '180GB', voiceMinutes: '1.500p nội mạng + 200p ngoại mạng', categoryId: comboCat, registrationSyntax: 'D159V P0123456', registrationNumber: '1543', badge: 'HOT', active: true, featured: true },
        { name: 'BIG90', network: 'vinaphone', price: 90000, validity: '30 Ngày', dataAmount: '30GB', categoryId: dataCat, registrationSyntax: 'BIG90 P0123456', registrationNumber: '1543', active: true, featured: true },
        { name: 'YOLO120', network: 'vinaphone', price: 120000, validity: '30 Ngày', dataAmount: '120GB', categoryId: dataCat, registrationSyntax: 'YOLO120 P0123456', registrationNumber: '1543', badge: 'SINH VIÊN', active: true, featured: true },

        // Mobifone
        { name: 'KC90', network: 'mobifone', price: 90000, validity: '30 Ngày', dataAmount: '30GB', voiceMinutes: 'Miễn phí nội mạng < 10p', categoryId: comboCat, registrationSyntax: 'KH KC90', registrationNumber: '9084', badge: 'HOT', active: true, featured: true },
        { name: 'KC120', network: 'mobifone', price: 120000, validity: '30 Ngày', dataAmount: '45GB', voiceMinutes: 'Miễn phí nội mạng < 10p + 50p ngoại mạng', categoryId: comboCat, registrationSyntax: 'KH KC120', registrationNumber: '9084', badge: 'LỰA CHỌN NHIỀU', active: true, featured: true },
        { name: 'PT90', network: 'mobifone', price: 90000, validity: '30 Ngày', dataAmount: '30GB', categoryId: dataCat, registrationSyntax: 'KH PT90', registrationNumber: '9084', active: true, featured: true },
      ];

      for (const pkg of defaults) {
        await addDoc(collection(db, 'packages'), {
          ...pkg,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      alert('Khởi tạo gói cước mẫu thành công!');
      fetchData();
    } catch (e) {
      console.error('Error seeding packages', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.name || !formData.categoryId || !formData.registrationSyntax || formData.price === undefined || formData.price === null) {
        alert('Vui lòng nhập đầy đủ Tên gói, Loại gói cước, Giá và Cú pháp đăng ký.');
        return;
      }
      const dataToSave = { ...formData };
      delete dataToSave.id;
      
      // Clean undefined fields to avoid Firestore error
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key as keyof typeof dataToSave] === undefined) {
          delete dataToSave[key as keyof typeof dataToSave];
        }
      });

      if (editingId) {
        const ref = doc(db, 'packages', editingId);
        await updateDoc(ref, { 
          ...dataToSave, 
          updatedAt: serverTimestamp() 
        });
        setEditingId(null);
      } else if (isAdding) {
        await addDoc(collection(db, 'packages'), {
          ...dataToSave,
          network: dataToSave.network || 'viettel',
          registrationNumber: dataToSave.registrationNumber || '9123',
          active: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setIsAdding(false);
      }
      setFormData({});
      fetchData();
      alert('Đã lưu dữ liệu thành công!');
    } catch (e: any) {
      alert('Lỗi khi lưu dữ liệu, vui lòng kiểm tra xem bạn có bỏ sót trường nào hoặc nhập sai định dạng không. Lỗi hệ thống: ' + (e?.message || ''));
      handleFirestoreError(e, 'write', 'packages');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa gói cước này?')) return;
    try {
      await deleteDoc(doc(db, 'packages', id));
      fetchData();
    } catch (e) {
      handleFirestoreError(e, 'delete', 'packages');
    }
  };

  const openEdit = (pkg: Package) => {
    setEditingId(pkg.id);
    setFormData(pkg);
    setIsAdding(false);
  };

  const openAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({ featured: false, active: true });
  };

  return (
    <div className="space-y-6">
      {isImporting && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-800">Đang thực hiện. Vui lòng chờ...</p>
          </div>
        </div>
      )}

      {loading && !isImporting && !packages.length && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4">
            <div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-bold text-slate-800">Đang tải dữ liệu...</p>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800">Quản lý Gói cước</h1>
          <p className="text-slate-500">Thêm, sửa và quản lý các gói cước 4G/5G</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Tìm kiếm gói cước..."
              className="pl-10 pr-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none text-sm w-48 transition-all focus:w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none bg-white font-semibold text-sm"
            value={filterNetwork}
            onChange={(e) => setFilterNetwork(e.target.value)}
          >
            <option value="">Tất cả nhà mạng</option>
            <option value="viettel">Viettel</option>
            <option value="vinaphone">Vinaphone</option>
            <option value="mobifone">Mobifone</option>
          </select>
          {packages.length > 0 && !isAdding && !editingId && (
            <>
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImport}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center space-x-2"
              >
                <FileUp className="w-4 h-4" /> <span>Nhập Excel</span>
              </button>
              <button 
                onClick={handleExport}
                className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center space-x-2"
              >
                <FileDown className="w-4 h-4" /> <span>Xuất Excel</span>
              </button>
            </>
          )}
          {packages.length === 0 && !isAdding && !editingId && (
            <button 
              onClick={seedDefaultPackages}
              className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-colors"
            >
              Nạp gói mẫu
            </button>
          )}
          {!isAdding && !editingId && (
            <button onClick={openAdd} className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              <Plus className="w-4 h-4" /> Thêm mới
            </button>
          )}
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl p-6 md:p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col max-h-full animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <h2 className="text-2xl font-bold text-slate-800">{isAdding ? 'Thêm gói cước mới' : 'Chỉnh sửa gói cước'}</h2>
              <button 
                onClick={() => { setIsAdding(false); setEditingId(null); }} 
                className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                title="Đóng"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto pr-2 custom-scrollbar space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Tên gói *</label>
              <input 
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={formData.name || ''} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="VD: ST90K"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Nhà mạng</label>
              <select 
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none bg-white"
                value={formData.network || ''} 
                onChange={e => setFormData({...formData, network: e.target.value as any})}
              >
                <option value="">Chọn nhà mạng</option>
                <option value="viettel">Viettel</option>
                <option value="vinaphone">Vinaphone</option>
                <option value="mobifone">Mobifone</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Loại gói cước *</label>
              <select 
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none bg-white"
                value={formData.categoryId || ''} 
                onChange={e => setFormData({...formData, categoryId: e.target.value})}
              >
                <option value="">Chọn loại gói cước...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Nhãn (Badge)</label>
              <input 
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={formData.badge || ''} 
                onChange={e => setFormData({...formData, badge: e.target.value})} 
                placeholder="VD: HOT, NEW, SIÊU ƯU ĐÃI"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Giá (VND) *</label>
              <input 
                type="number"
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={formData.price || ''} 
                onChange={e => setFormData({...formData, price: Number(e.target.value)})} 
                placeholder="VD: 90000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Dung lượng Data</label>
              <input 
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={formData.dataAmount || ''} 
                onChange={e => setFormData({...formData, dataAmount: e.target.value})} 
                placeholder="VD: 30GB (1GB/Ngày)"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Cú pháp đăng ký *</label>
              <input 
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={formData.registrationSyntax || ''} 
                onChange={e => setFormData({...formData, registrationSyntax: e.target.value})} 
                placeholder="VD: ST90K"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Tổng đài nhận tin</label>
              <input 
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={formData.registrationNumber || ''} 
                onChange={e => setFormData({...formData, registrationNumber: e.target.value})} 
                placeholder="VD: 9123 (Viettel) hoặc 1543 (Vina)"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Ưu đãi Thoại (Ví dụ: 1.500p nội mạng)</label>
              <input 
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={formData.voiceMinutes || ''} 
                onChange={e => setFormData({...formData, voiceMinutes: e.target.value})} 
                placeholder="VD: 1.500p nội mạng + 200p ngoại mạng"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">SMS (Tùy chọn)</label>
              <input 
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={formData.smsAmount || ''} 
                onChange={e => setFormData({...formData, smsAmount: e.target.value})} 
                placeholder="VD: 100 SMS nội mạng"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Thứ tự hiển thị (1-5)</label>
              <input 
                type="number"
                min="1" max="5"
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={formData.order || ''} 
                onChange={e => setFormData({...formData, order: e.target.value ? Number(e.target.value) : undefined})} 
                placeholder="Số ưu tiên xuất hiện trước (1-5)"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Nội dung ưu đãi nổi bật (Chữ đỏ tuỳ chỉnh)</label>
              <input 
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={formData.highlightPromo || ''} 
                onChange={e => setFormData({...formData, highlightPromo: e.target.value})} 
                placeholder="VD: Miễn phí: KHÔNG GIỚI HẠN data độc quyền..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Text nút Đăng ký (Tùy chỉnh)</label>
              <input 
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={formData.registerButtonText || ''} 
                onChange={e => setFormData({...formData, registerButtonText: e.target.value})} 
                placeholder="Mặc định: ĐĂNG KÝ NGAY"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Thời hạn</label>
              <input 
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={formData.validity || ''} 
                onChange={e => setFormData({...formData, validity: e.target.value})} 
                placeholder="VD: 30 Ngày"
              />
            </div>
            <div className="space-y-2 md:col-span-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.isSim || false} 
                  onChange={(e) => setFormData({...formData, isSim: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <span className="text-sm font-bold text-slate-800">Là SIM Vật lý / eSIM (Mua trực tiếp)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.featured !== false} // default true or undefined logic? Let's just use boolean
                  onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                  className="w-5 h-5 rounded border-slate-300 text-yellow-500 focus:ring-yellow-500"
                />
                <span className="text-sm font-bold text-slate-800">Gói cước Nổi bật</span>
              </label>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-600">Nội dung chi tiết (Mô tả dài hiển thị ở trang Chi tiết - Hỗ trợ Markdown)</label>
              <textarea 
                rows={5}
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
                value={formData.longDescription || ''} 
                onChange={e => setFormData({...formData, longDescription: e.target.value})} 
                placeholder="# Chi tiết gói cước&#10;Hỗ trợ định dạng **Markdown** giống như trang Thông tin..."
              />
            </div>
          </div>

              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-8 bg-slate-50 p-4 border rounded-xl">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.featured || false} 
                    onChange={e => setFormData({...formData, featured: e.target.checked})}
                    className="w-6 h-6 accent-primary" 
                  />
                  <span className="text-sm font-bold text-slate-800">CÁC GÓI CƯỚC HOT (Hiển thị ngoài trang chủ)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.active || false} 
                    onChange={e => setFormData({...formData, active: e.target.checked})}
                    className="w-6 h-6 accent-green-600" 
                  />
                  <span className="text-sm font-bold text-slate-800">Kích hoạt (Hiển thị)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-6 shrink-0 mt-6 border-t">
              <button 
                onClick={() => { setIsAdding(false); setEditingId(null); }} 
                className="px-6 py-3 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 mr-4 transition-colors"
              >
                Hủy
              </button>
              <button onClick={handleSave} className="btn-secondary px-8 flex items-center gap-2">
                <Save className="w-5 h-5" /> Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Tên gói</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mạng</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nhãn</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Giá</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cú pháp/Đầu số</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {packages
              .filter(p => !filterNetwork || p.network === filterNetwork)
              .filter(p => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.registrationSyntax?.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(pkg => (
              <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-800">{pkg.name}</div>
                  <div className="text-[10px] text-slate-300 font-mono select-all">ID: {pkg.id}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 border px-1.5 py-0.5 rounded">{pkg.network}</span>
                </td>
                <td className="px-6 py-4">
                  {pkg.badge ? (
                    <span className="bg-yellow-400/20 text-yellow-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                      {pkg.badge}
                    </span>
                  ) : (
                    <span className="text-slate-300 text-[10px]">---</span>
                  )}
                </td>
                <td className="px-6 py-4 text-slate-600 font-medium">{formatCurrency(pkg.price)}</td>
                <td className="px-6 py-4">
                  <p className="text-xs font-mono font-bold">{pkg.registrationSyntax}</p>
                  <p className="text-[10px] text-slate-400">gửi {pkg.registrationNumber}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase",
                    pkg.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  )}>
                    {pkg.active ? 'Hoạt động' : 'Ẩn'}
                  </span>
                  {pkg.featured && (
                    <span className="ml-2 px-3 py-1 rounded-full text-[10px] font-black uppercase bg-yellow-100 text-yellow-700">HOT</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => openEdit(pkg)} className="text-blue-500 hover:bg-blue-50 p-2 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(pkg.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
