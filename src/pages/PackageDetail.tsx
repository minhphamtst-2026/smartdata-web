import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { Package } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import { 
  Wifi, 
  Phone, 
  Clock, 
  MessageSquare, 
  Copy, 
  CheckCircle2, 
  ArrowLeft,
  Share2,
  Info,
  ShoppingCart,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const PackageDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderPhone, setOrderPhone] = useState('');
  const [contactMethod, setContactMethod] = useState<'call' | 'zalo' | 'telegram'>('call');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const fetchPackage = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'packages', id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setPkg({ id: snapshot.id, ...snapshot.data() } as Package);
        }
      } catch (error) {
        console.error('Error fetching package detail', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackage();
  }, [id]);

  const handleCopy = () => {
    if (!pkg) return;
    const text = `${pkg.registrationSyntax} gửi ${pkg.registrationNumber}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderPhone.trim() || !pkg) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        packageId: pkg.id,
        packageName: pkg.name,
        customerPhone: orderPhone,
        contactMethod: contactMethod,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setOrderSuccess(true);
      setTimeout(() => {
        setShowOrderModal(false);
        setOrderSuccess(false);
        setOrderPhone('');
      }, 3000);
    } catch (error) {
      handleFirestoreError(error, 'create' as any, 'orders');
      alert('Có lỗi xảy ra, vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const smsUrl = pkg ? `sms:${pkg.registrationNumber}?body=${encodeURIComponent(pkg.registrationSyntax)}` : '#';

  if (loading) return <div className="h-screen flex items-center justify-center animate-pulse">Đang tải...</div>;
  if (!pkg) return <div className="h-screen flex items-center justify-center">Không tìm thấy gói cước.</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <button onClick={() => navigate(-1)} className="inline-flex items-center space-x-2 text-slate-500 hover:text-primary transition-colors font-medium">
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại</span>
      </button>

      <div className="bg-white rounded-[40px] overflow-hidden shadow-2xl border border-slate-100">
        {/* Header section with pricing */}
        {pkg.isSim ? (
          <div className="bg-white px-8 py-12 relative flex flex-col items-center justify-center border-b border-slate-100 overflow-hidden">
             <h1 className="text-4xl md:text-5xl font-black text-blue-500 mb-2 z-10 tracking-tight text-center uppercase">{pkg.name}</h1>
             
             {pkg.dataAmount && (
               <span className="bg-red-600 text-white px-5 py-2 rounded-full text-base font-black shadow-sm mb-4 z-10">
                 {pkg.dataAmount}
               </span>
             )}

             {/* Thẻ SIM Zin CSS */}
             <div className="relative group/sim flex justify-center w-full z-10 my-4" style={{ filter: 'drop-shadow(0 20px 20px rgba(0,0,0,0.2))' }}>
               <div 
                 className={`w-72 h-44 md:w-80 md:h-52 rounded-xl relative flex flex-col overflow-hidden border ${
                   pkg.network === 'viettel' ? 'bg-gradient-to-br from-red-600 via-red-700 to-rose-950 border-red-500/50' :
                   pkg.network === 'mobifone' ? 'bg-gradient-to-br from-blue-600 via-blue-800 to-slate-900 border-blue-500/50' :
                   'bg-gradient-to-br from-slate-900 via-slate-800 to-black border-slate-700'
                 }`}
               >
                  {/* Ánh sáng & tia chớp background giống thẻ Vinaphone */}
                  <div className="absolute inset-0 overflow-hidden">
                     {pkg.network === 'viettel' ? (
                       <>
                         <div className="absolute bottom-0 right-0 w-48 h-24 opacity-80 bg-gradient-to-tl from-white via-red-400 to-transparent blur-md"></div>
                         <div className="absolute top-1/2 left-1/4 w-40 h-[4px] opacity-60 bg-gradient-to-r from-transparent via-yellow-400 to-transparent transform -rotate-12 blur-[1px]"></div>
                         <div className="absolute top-1/3 left-1/3 w-32 h-[3px] opacity-80 bg-gradient-to-r from-transparent via-white to-transparent transform -rotate-12 blur-[1px]"></div>
                       </>
                     ) : pkg.network === 'mobifone' ? (
                       <>
                         <div className="absolute bottom-0 right-0 w-48 h-24 opacity-80 bg-gradient-to-tl from-cyan-400 via-blue-400 to-transparent blur-md"></div>
                         <div className="absolute top-1/2 left-1/4 w-40 h-[4px] opacity-60 bg-gradient-to-r from-transparent via-red-500 to-transparent transform -rotate-12 blur-[1px]"></div>
                         <div className="absolute top-1/3 left-1/3 w-32 h-[3px] opacity-80 bg-gradient-to-r from-transparent via-white to-transparent transform -rotate-12 blur-[1px]"></div>
                       </>
                     ) : (
                       <>
                         <div className="absolute bottom-0 right-0 w-48 h-24 opacity-80 bg-gradient-to-tl from-red-600 via-orange-500 to-transparent blur-md"></div>
                         <div className="absolute top-1/2 left-1/4 w-40 h-[4px] opacity-60 bg-gradient-to-r from-transparent via-cyan-400 to-transparent transform -rotate-12 blur-[1px]"></div>
                         <div className="absolute top-1/3 left-1/3 w-32 h-[3px] opacity-80 bg-gradient-to-r from-transparent via-white to-transparent transform -rotate-12 blur-[1px]"></div>
                       </>
                     )}
                  </div>
                  
                  <div className="relative z-10 w-full h-full p-4 md:p-5 flex flex-col justify-between">
                      <div className="flex items-start justify-between w-full">
                        {pkg.network === 'vinaphone' ? (
                          <span className="text-white text-base md:text-lg font-bold lowercase tracking-wider opacity-90 leading-none">vinaphone</span>
                        ) : pkg.network === 'viettel' ? (
                          <span className="text-white text-base md:text-lg font-black italic tracking-tight opacity-90 leading-none">viettel</span>
                        ) : (
                          <span className="text-white text-base md:text-lg font-bold tracking-tight opacity-90 leading-none">mobifone</span>
                        )}
                        
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full border-[3px] md:border-[4px] border-white shadow-sm flex flex-col items-center justify-center -mr-1 -mt-1 transform shadow-inner ${
                          pkg.network === 'viettel' ? 'bg-gradient-to-br from-red-500 to-rose-700' :
                          pkg.network === 'mobifone' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                          'bg-gradient-to-br from-cyan-400 to-pink-500'
                        }`}>
                          <span className="text-white text-2xl md:text-3xl font-black leading-none drop-shadow">4G</span>
                          <span className="text-white text-[9px] md:text-[11px] font-bold leading-none uppercase">SPEED</span>
                        </div>
                      </div>
                      
                      {/* Chip SIM */}
                      <div className="w-14 h-12 md:w-16 md:h-14 border-[1.5px] border-yellow-600/80 rounded-md bg-gradient-to-br from-yellow-100 via-yellow-300 to-yellow-600 grid grid-cols-3 grid-rows-3 gap-[1.5px] p-[1.5px] shadow-sm ml-1 mb-1">
                        <div className="border border-yellow-700/30 bg-yellow-400/80 rounded-tl-sm"></div>
                        <div className="border border-yellow-700/30 bg-yellow-400/80 col-span-2"></div>
                        <div className="border border-yellow-700/30 bg-yellow-400/80"></div>
                        <div className="border border-yellow-700/30 bg-yellow-400/80"></div>
                        <div className="border border-yellow-700/30 bg-yellow-400/80"></div>
                        <div className="border border-yellow-700/30 bg-yellow-400/80 col-span-2 rounded-bl-sm"></div>
                        <div className="border border-yellow-700/30 bg-yellow-400/80 rounded-br-sm"></div>
                      </div>
                  </div>
               </div>
             </div>
             
             {pkg.voiceMinutes && (
               <div className="flex flex-col sm:flex-row gap-3 mt-8 items-center justify-center z-10 w-full">
                  {pkg.voiceMinutes.split('+').map((part, index) => (
                    <div key={index} className="bg-blue-500 text-white text-sm md:text-base font-bold rounded-full py-2 px-6 shadow-sm tracking-tight text-center">
                       {part.trim()}
                    </div>
                  ))}
               </div>
             )}
             
             {pkg.badge && (
               <span className="absolute top-6 right-6 bg-yellow-400 text-slate-900 px-4 py-1.5 rounded-md text-sm font-black uppercase shadow-sm">
                 {pkg.badge}
               </span>
             )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-primary via-primary to-secondary px-8 py-12 text-white relative">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Wifi className="w-32 h-32" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <div className="flex items-center flex-wrap gap-4 mb-4">
                <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">{pkg.name}</h1>
                <span className="bg-white/20 px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wider">{pkg.network}</span>
              </div>
              <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
                <div className="text-4xl font-black">{formatCurrency(pkg.price)}</div>
                <div className="text-white/80 font-bold flex items-center space-x-2 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>{pkg.validity || '30 Ngày'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-10">
            <section className="space-y-6">
              <h2 className="text-xl font-black flex items-center space-x-2 text-slate-900">
                <div className="w-2 h-6 bg-primary rounded-full"></div>
                <span>Ưu đãi hấp dẫn</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pkg.dataAmount && (
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start space-x-4">
                    <div className="bg-blue-100 p-3 rounded-2xl text-blue-600"><Wifi className="w-6 h-6" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Data tốc độ cao</p>
                      <p className="text-xl font-black text-slate-800">{pkg.dataAmount}</p>
                    </div>
                  </div>
                )}
                {pkg.voiceMinutes && (
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-start space-x-4">
                    <div className="bg-orange-100 p-3 rounded-2xl text-orange-600"><Phone className="w-6 h-6" /></div>
                    <div>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Miễn phí gọi</p>
                      <p className="text-xl font-black text-slate-800">{pkg.voiceMinutes}</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {pkg.longDescription ? (
              <section className="space-y-4">
                <h2 className="text-xl font-black flex items-center space-x-2 text-slate-900">
                  <div className="w-2 h-6 bg-secondary rounded-full"></div>
                  <span>{pkg.isSim ? 'Chi tiết Sản phẩm' : 'Chi tiết gói cước'}</span>
                </h2>
                <div className="text-slate-600 leading-relaxed bg-slate-50/50 p-6 rounded-3xl border markdown-body">
                  <Markdown remarkPlugins={[remarkBreaks]}>{pkg.longDescription}</Markdown>
                </div>
              </section>
            ) : pkg.description && (
              <section className="space-y-4">
                <h2 className="text-xl font-black flex items-center space-x-2 text-slate-900">
                  <div className="w-2 h-6 bg-secondary rounded-full"></div>
                  <span>{pkg.isSim ? 'Chi tiết Sản phẩm' : 'Chi tiết gói cước'}</span>
                </h2>
                <div className="text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50/50 p-6 rounded-3xl border">
                  {pkg.description}
                </div>
              </section>
            )}
          </div>

          {/* Registration Sidebar */}
          <div className="space-y-6">
            <div className={cn(
              "rounded-[32px] p-8 text-white space-y-6 sticky top-24 shadow-2xl",
              pkg.isSim ? "bg-gradient-to-b from-indigo-600 to-indigo-900" : "bg-slate-900"
            )}>
              <h3 className="text-lg font-bold flex items-center space-x-2">
                {pkg.isSim ? (
                  <>
                    <ShoppingCart className="w-5 h-5 text-yellow-400" />
                    <span>Mua sản phẩm / SIM</span>
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-5 h-5 text-secondary" />
                    <span>Đăng ký ngay</span>
                  </>
                )}
              </h3>
              
              <div className="space-y-4">
                {pkg.isSim ? (
                  <div className="bg-white/10 border border-white/10 p-5 rounded-2xl text-center space-y-3">
                     <p className="text-3xl font-black text-yellow-400">{formatCurrency(pkg.price)}</p>
                     <p className="text-white/80 text-sm">Miễn phí giao hàng toàn quốc</p>
                  </div>
                ) : (
                  <div className="bg-white/10 border border-white/10 p-5 rounded-2xl">
                    <p className="text-white/40 text-[10px] font-black uppercase mb-1">Cú pháp nhắn tin</p>
                    <p className="text-xl font-mono font-black text-secondary tracking-widest">{pkg.registrationSyntax}</p>
                    <p className="text-white/40 text-[10px] font-black uppercase mt-2">Gửi đến</p>
                    <p className="text-xl font-mono font-black text-white">{pkg.registrationNumber}</p>
                  </div>
                )}

                {pkg.isSim ? (
                  <button 
                    onClick={() => setShowOrderModal(true)}
                    className="w-full py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all font-bold bg-yellow-400 hover:bg-yellow-500 text-slate-900 shadow-lg shadow-yellow-400/20"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>MUA NGAY (GIAO SIM TẬN NHÀ)</span>
                  </button>
                ) : isMobile ? (
                  <a 
                    href={smsUrl}
                    className="w-full py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all font-bold bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>Đăng ký qua SMS</span>
                  </a>
                ) : (
                  <button 
                    onClick={handleCopy}
                    className={cn(
                      "w-full py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all font-bold",
                      copied ? "bg-green-500 text-white" : "bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20"
                    )}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Đã sao chép!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span>Sao chép cú pháp</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="pt-6 border-t border-white/10 space-y-3">
                {pkg.isSim ? (
                   <>
                     <div className="flex items-center space-x-2 text-xs text-white/50">
                       <CheckCircle2 className="w-3 h-3 shrink-0 text-green-400" />
                       <p>Giao SIM tận nhà, đăng ký chính chủ miễn phí.</p>
                     </div>
                     <div className="flex items-center space-x-2 text-xs text-white/50">
                       <CheckCircle2 className="w-3 h-3 shrink-0 text-green-400" />
                       <p>Quý khách nhận được liên hệ xác nhận trong vài phút.</p>
                     </div>
                   </>
                ) : (
                   <>
                     <div className="flex items-center space-x-2 text-xs text-white/50">
                       <Info className="w-3 h-3 shrink-0" />
                       <p>Hệ thống sẽ gửi tin nhắn xác nhận từ tổng đài nhà mạng.</p>
                     </div>
                     <div className="flex items-center space-x-2 text-xs text-white/50">
                       <CheckCircle2 className="w-3 h-3 shrink-0 text-green-400" />
                       <p>Kích hoạt ngay sau khi đăng ký thành công.</p>
                     </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    <AnimatePresence>
      {showOrderModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-md relative shadow-2xl"
          >
            <button
              onClick={() => setShowOrderModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2"
            >
              <X className="w-5 h-5" />
            </button>

            {orderSuccess ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Đặt Hàng Thành Công!</h3>
                <p className="text-slate-600">Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                  Xác nhận đặt SIM
                </h2>

                <div className="bg-slate-50 p-4 rounded-xl mb-6 border border-slate-100">
                  <p className="text-sm text-slate-500 mb-1">Sản phẩm</p>
                  <p className="font-bold text-slate-800 text-lg mb-2">{pkg.name}</p>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Dung lượng:</span>
                    <span className="font-bold text-slate-800">{pkg.dataAmount || 'Không giới hạn'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-1">
                    <span className="text-slate-600">Thanh toán:</span>
                    <span className="font-bold text-primary text-lg">{formatCurrency(pkg.price)}</span>
                  </div>
                </div>

                <form onSubmit={submitOrder} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Số điện thoại liên hệ *</label>
                    <input
                      type="tel"
                      required
                      value={orderPhone}
                      onChange={(e) => setOrderPhone(e.target.value)}
                      placeholder="Nhập số điện thoại của bạn..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-slate-800 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Hình thức liên hệ mong muốn</label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setContactMethod('call')}
                        className={`py-2 rounded-xl text-sm font-bold border transition-all ${contactMethod === 'call' ? 'bg-primary/10 border-primary text-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        Gọi điện
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactMethod('zalo')}
                        className={`py-2 rounded-xl text-sm font-bold border transition-all ${contactMethod === 'zalo' ? 'bg-blue-50 border-blue-500 text-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        Zalo
                      </button>
                      <button
                        type="button"
                        onClick={() => setContactMethod('telegram')}
                        className={`py-2 rounded-xl text-sm font-bold border transition-all ${contactMethod === 'telegram' ? 'bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        Telegram
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white py-3.5 rounded-xl font-bold uppercase tracking-wide shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center"
                  >
                    {isSubmitting ? 'ĐANG XỬ LÝ...' : 'HOÀN TẤT ĐẶT HÀNG'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    </div>
  );
};
