import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../../lib/firebase';
import { collection, getDocs, setDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { SiteConfig } from '../../types';
import { Save, ShieldAlert, Globe, Radio, Phone, FileText, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';

export const AdminSettings = () => {
  const [config, setConfig] = useState<SiteConfig>({});
  const [loading, setLoading] = useState(true);
  const [docId, setDocId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'viettel' | 'vinaphone' | 'mobifone' | 'pages'>('general');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'config'));
      if (!snapshot.empty) {
        setDocId(snapshot.docs[0].id);
        setConfig(snapshot.docs[0].data() as SiteConfig);
      }
    } catch (e) {
      handleFirestoreError(e, 'get', 'config');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (docId) {
        await updateDoc(doc(db, 'config', docId), config as any);
      } else {
        const res = await addDoc(collection(db, 'config'), config);
        setDocId(res.id);
      }
      alert('Đã lưu cấu hình thành công!');
    } catch (e) {
      handleFirestoreError(e, 'write', 'config');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl space-y-8 pb-20">
      <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex items-start space-x-3 text-orange-800">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm">
          <strong>Lưu ý:</strong> Cấu hình trang web ảnh hưởng trực tiếp đến giao diện người dùng trên toàn bộ hệ thống. Các nội dung Liên hệ và Điều khoản sẽ thay đổi theo từng nhà mạng tương ứng.
        </p>
      </div>

      <div className="flex space-x-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {[
          { id: 'general', label: 'Cấu hình chung', icon: Globe },
          { id: 'viettel', label: 'Viettel', icon: Radio },
          { id: 'vinaphone', label: 'Vinaphone', icon: Radio },
          { id: 'mobifone', label: 'Mobifone', icon: Radio },
          { id: 'pages', label: 'Trang nội dung', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-white text-slate-900 shadow-sm" 
                : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'general' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Cấu hình chung
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Tiêu đề Website (SEO)</label>
                <input 
                  className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                  value={config.bannerTitle || ''} 
                  onChange={e => setConfig({...config, bannerTitle: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Mạng mặc định (Trang chủ)</label>
                <select 
                  className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none bg-white"
                  value={config.defaultNetwork || 'viettel'} 
                  onChange={e => setConfig({...config, defaultNetwork: e.target.value})}
                >
                  <option value="viettel">Viettel</option>
                  <option value="vinaphone">Vinaphone</option>
                  <option value="mobifone">Mobifone</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Slogan (Logo Subtitle)</label>
              <input 
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={config.bannerImageUrl || ''} 
                onChange={e => setConfig({...config, bannerImageUrl: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Mô tả Banner (Hero Subtitle)</label>
              <textarea 
                rows={2}
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={config.bannerSubtitle || ''} 
                onChange={e => setConfig({...config, bannerSubtitle: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600">Mô tả giới thiệu Footer (Cột 1)</label>
              <textarea 
                rows={4}
                className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                value={config.siteFooterDescription || ''} 
                onChange={e => setConfig({...config, siteFooterDescription: e.target.value})}
                placeholder="VD: SmartData là đại lý ủy quyền chính thức chuyên cung cấp các gói ưu đãi..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Email hỗ trợ</label>
                <input 
                  type="email"
                  className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                  value={config.footerText || ''} 
                  onChange={e => setConfig({...config, footerText: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Hotline liên hệ</label>
                <input 
                  className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                  value={config.contactPhone || ''} 
                  onChange={e => setConfig({...config, contactPhone: e.target.value})}
                />
              </div>
            </div>

            {/* Quản lý liên kết Footer (Cột 3) */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-600">Liên kết Footer (Cột 3 - Thông tin & Kết nối)</label>
                <button
                  onClick={() => setConfig({
                    ...config,
                    infoLinks: [...(config.infoLinks || []), { id: Date.now().toString(), text: '', url: '', content: '' }]
                  })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors"
                >
                  + Thêm liên kết
                </button>
              </div>
              <div className="space-y-6">
                {(config.infoLinks || []).map((link, index) => (
                  <div key={index} className="flex flex-col gap-3 p-4 bg-slate-50 border rounded-2xl">
                    <div className="flex gap-4 items-start">
                      <input
                        className="flex-1 px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none bg-white"
                        placeholder="Tên liên kết (VD: Về chúng tôi)"
                        value={link.text}
                        onChange={(e) => {
                          const newLinks = [...(config.infoLinks || [])];
                          newLinks[index].text = e.target.value;
                          setConfig({ ...config, infoLinks: newLinks });
                        }}
                      />
                      <input
                        className="flex-1 px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none bg-white"
                        placeholder="Đường dẫn ngoài (Nút sẽ mở link này nếu có)"
                        value={link.url || ''}
                        onChange={(e) => {
                          const newLinks = [...(config.infoLinks || [])];
                          newLinks[index].url = e.target.value;
                          setConfig({ ...config, infoLinks: newLinks });
                        }}
                      />
                      <button
                        onClick={() => {
                          const newLinks = [...(config.infoLinks || [])];
                          newLinks.splice(index, 1);
                          setConfig({ ...config, infoLinks: newLinks });
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl transition-colors font-bold"
                      >
                        Xoá
                      </button>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">Nội dung trang (Hỗ trợ Markdown) - Sẽ hiển thị nếu không có Đường dẫn ngoài</label>
                       <textarea 
                        rows={4}
                        className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none font-mono text-sm bg-white"
                        value={link.content || ''} 
                        onChange={e => {
                          const newLinks = [...(config.infoLinks || [])];
                          newLinks[index].content = e.target.value;
                          setConfig({ ...config, infoLinks: newLinks });
                        }}
                        placeholder="# Nội dung..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quản lý liên kết Footer (Cột 4) */}
            <div className="space-y-4 pt-6 border-t">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-600">Liên kết Footer (Cột 4 - Điều khoản & Điều kiện)</label>
                <button
                  onClick={() => setConfig({
                    ...config,
                    footerLinks: [...(config.footerLinks || []), { id: Date.now().toString(), text: '', url: '', content: '' }]
                  })}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors"
                >
                  + Thêm liên kết
                </button>
              </div>
              <div className="space-y-6">
                {(config.footerLinks || []).map((link, index) => (
                  <div key={index} className="flex flex-col gap-3 p-4 bg-slate-50 border rounded-2xl">
                    <div className="flex gap-4 items-start">
                      <input
                        className="flex-1 px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none bg-white"
                        placeholder="Tên liên kết (VD: Điều khoản sử dụng)"
                        value={link.text}
                        onChange={(e) => {
                          const newLinks = [...(config.footerLinks || [])];
                          newLinks[index].text = e.target.value;
                          setConfig({ ...config, footerLinks: newLinks });
                        }}
                      />
                      <input
                        className="flex-1 px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none bg-white"
                        placeholder="Đường dẫn ngoài (Nút sẽ mở link này nếu có)"
                        value={link.url || ''}
                        onChange={(e) => {
                          const newLinks = [...(config.footerLinks || [])];
                          newLinks[index].url = e.target.value;
                          setConfig({ ...config, footerLinks: newLinks });
                        }}
                      />
                      <button
                        onClick={() => {
                          const newLinks = [...(config.footerLinks || [])];
                          newLinks.splice(index, 1);
                          setConfig({ ...config, footerLinks: newLinks });
                        }}
                        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 rounded-xl transition-colors font-bold"
                      >
                        Xoá
                      </button>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">Nội dung trang (Hỗ trợ Markdown) - Sẽ hiển thị nếu không có Đường dẫn ngoài</label>
                       <textarea 
                        rows={4}
                        className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none font-mono text-sm bg-white"
                        value={link.content || ''} 
                        onChange={e => {
                          const newLinks = [...(config.footerLinks || [])];
                          newLinks[index].content = e.target.value;
                          setConfig({ ...config, footerLinks: newLinks });
                        }}
                        placeholder="# Nội dung..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'viettel' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[#EE0033] flex items-center gap-2">
              <Radio className="w-5 h-5" />
              Nội dung Footer Viettel
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Thông tin Liên hệ (Cột 2)</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-[#EE0033] outline-none"
                  value={config.viettelContact || ''} 
                  onChange={e => setConfig({...config, viettelContact: e.target.value})}
                  placeholder="Địa chỉ, số điện thoại chăm sóc khách hàng Viettel..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Điều kiện & Điều khoản (Cột 3)</label>
                <textarea 
                  rows={6}
                  className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-[#EE0033] outline-none"
                  value={config.viettelTerms || ''} 
                  onChange={e => setConfig({...config, viettelTerms: e.target.value})}
                  placeholder="Các lưu ý khi đăng ký gói cước Viettel..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vinaphone' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[#0070C0] flex items-center gap-2">
              <Radio className="w-5 h-5" />
              Nội dung Footer Vinaphone
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Thông tin Liên hệ (Cột 2)</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-[#0070C0] outline-none"
                  value={config.vinaphoneContact || ''} 
                  onChange={e => setConfig({...config, vinaphoneContact: e.target.value})}
                  placeholder="Địa chỉ, số điện thoại chăm sóc khách hàng Vinaphone..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Điều kiện & Điều khoản (Cột 3)</label>
                <textarea 
                  rows={6}
                  className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-[#0070C0] outline-none"
                  value={config.vinaphoneTerms || ''} 
                  onChange={e => setConfig({...config, vinaphoneTerms: e.target.value})}
                  placeholder="Các lưu ý khi đăng ký gói cước Vinaphone..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mobifone' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-[#0055A5] flex items-center gap-2">
              <Radio className="w-5 h-5" />
              Nội dung Footer Mobifone
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Thông tin Liên hệ (Cột 2)</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-[#0055A5] outline-none"
                  value={config.mobifoneContact || ''} 
                  onChange={e => setConfig({...config, mobifoneContact: e.target.value})}
                  placeholder="Địa chỉ, số điện thoại chăm sóc khách hàng Mobifone..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">Điều kiện & Điều khoản (Cột 3)</label>
                <textarea 
                  rows={6}
                  className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-[#0055A5] outline-none"
                  value={config.mobifoneTerms || ''} 
                  onChange={e => setConfig({...config, mobifoneTerms: e.target.value})}
                  placeholder="Các lưu ý khi đăng ký gói cước Mobifone..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="space-y-10">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Quản lý trang nội dung
            </h2>

            {/* Terms of Service */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-800">Điều khoản dịch vụ</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Đường dẫn ngoài (Nếu có URL sẽ tự động chuyển hướng thay vì hiện text)</label>
                  <input 
                    className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                    value={config.termsOfService?.url || ''} 
                    onChange={e => setConfig({
                      ...config, 
                      termsOfService: { ...config.termsOfService, content: config.termsOfService?.content || '', url: e.target.value }
                    })}
                    placeholder="https://example.com/terms"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nội dung trang (Hỗ trợ Markdown) (Trỏ tới /page/terms-of-service)</label>
                  <textarea 
                    rows={8}
                    className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
                    value={config.termsOfService?.content || ''} 
                    onChange={e => setConfig({
                      ...config, 
                      termsOfService: { ...config.termsOfService, url: config.termsOfService?.url || '', content: e.target.value }
                    })}
                    placeholder="# Điều khoản dịch vụ..."
                  />
                </div>
              </div>
            </div>

            {/* Privacy Policy */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-800">Chính sách bảo mật</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Đường dẫn ngoài</label>
                  <input 
                    className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                    value={config.privacyPolicy?.url || ''} 
                    onChange={e => setConfig({
                      ...config, 
                      privacyPolicy: { ...config.privacyPolicy, content: config.privacyPolicy?.content || '', url: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nội dung trang (Trỏ tới /page/privacy-policy)</label>
                  <textarea 
                    rows={8}
                    className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
                    value={config.privacyPolicy?.content || ''} 
                    onChange={e => setConfig({
                      ...config, 
                      privacyPolicy: { ...config.privacyPolicy, url: config.privacyPolicy?.url || '', content: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>

            {/* Payment Guide */}
            <div className="space-y-4 p-6 bg-slate-50 rounded-3xl border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <h3 className="font-black text-slate-800">Hướng dẫn thanh toán</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Đường dẫn ngoài</label>
                  <input 
                    className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none"
                    value={config.paymentGuide?.url || ''} 
                    onChange={e => setConfig({
                      ...config, 
                      paymentGuide: { ...config.paymentGuide, content: config.paymentGuide?.content || '', url: e.target.value }
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nội dung trang (Trỏ tới /page/payment-guide)</label>
                  <textarea 
                    rows={8}
                    className="w-full px-4 py-2 rounded-xl border focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
                    value={config.paymentGuide?.content || ''} 
                    onChange={e => setConfig({
                      ...config, 
                      paymentGuide: { ...config.paymentGuide, url: config.paymentGuide?.url || '', content: e.target.value }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="pt-6 border-t flex justify-end">
          <button onClick={handleSave} className="btn-primary px-12 flex items-center gap-2">
            <Save className="w-4 h-4" /> Lưu cấu hình
          </button>
        </div>
      </div>
    </div>
  );
};
