import React, { useState } from 'react';
import { Package } from '../types';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../lib/utils';
import { Zap, Wifi, Phone, MessageSquare, Copy, ShoppingCart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const PackageCard: React.FC<{ pkg: Package }> = ({ pkg }) => {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderPhone, setOrderPhone] = useState('');
  const [contactMethod, setContactMethod] = useState<'call' | 'zalo' | 'telegram'>('call');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const handleCopy = () => {
    const text = `${pkg.registrationSyntax} gửi ${pkg.registrationNumber}`;
    navigator.clipboard.writeText(text);
    alert('Đã sao chép cú pháp đăng ký!');
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderPhone.trim()) return;

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
  const smsUrl = isMobile 
    ? `sms:${pkg.registrationNumber}?body=${encodeURIComponent(pkg.registrationSyntax)}` 
    : '#';

  return (
    <>
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all border border-slate-100 flex flex-col group h-full relative"
    >
      {pkg.isSim ? (
        <div className="bg-white p-6 relative flex flex-col items-center justify-center border-b border-slate-100 min-h-[220px] overflow-hidden pt-8">
           <h3 className="text-3xl font-black text-blue-500 mb-2 z-10 tracking-tight text-center">{pkg.name}</h3>
           
           {pkg.dataAmount && (
             <span className="bg-red-600 text-white px-4 py-1.5 rounded-full text-sm font-black shadow-sm mb-4 z-10">
               {pkg.dataAmount}
             </span>
           )}
           
           {/* Thẻ SIM Zin CSS */}
           <div className="relative group/sim flex justify-center w-full z-10 my-2" style={{ filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.15))' }}>
             <div 
               className={`w-56 h-36 rounded-lg border relative flex flex-col overflow-hidden ${
                 pkg.network === 'viettel' ? 'bg-gradient-to-br from-red-600 via-red-700 to-rose-950 border-red-500/50' :
                 pkg.network === 'mobifone' ? 'bg-gradient-to-br from-blue-600 via-blue-800 to-slate-900 border-blue-500/50' :
                 'bg-gradient-to-br from-slate-900 via-slate-800 to-black border-slate-700'
               }`}
             >
                {/* Ánh sáng & tia chớp background giống thẻ Vinaphone */}
                <div className="absolute inset-0 overflow-hidden">
                   {pkg.network === 'viettel' ? (
                     <>
                       <div className="absolute bottom-0 right-0 w-40 h-20 opacity-80 bg-gradient-to-tl from-white via-red-400 to-transparent blur-md"></div>
                       <div className="absolute top-1/2 left-1/4 w-32 h-[3px] opacity-60 bg-gradient-to-r from-transparent via-yellow-400 to-transparent transform -rotate-12 blur-[1px]"></div>
                       <div className="absolute top-1/3 left-1/3 w-24 h-[2px] opacity-80 bg-gradient-to-r from-transparent via-white to-transparent transform -rotate-12 blur-[1px]"></div>
                     </>
                   ) : pkg.network === 'mobifone' ? (
                     <>
                       <div className="absolute bottom-0 right-0 w-40 h-20 opacity-80 bg-gradient-to-tl from-cyan-400 via-blue-400 to-transparent blur-md"></div>
                       <div className="absolute top-1/2 left-1/4 w-32 h-[3px] opacity-60 bg-gradient-to-r from-transparent via-red-500 to-transparent transform -rotate-12 blur-[1px]"></div>
                       <div className="absolute top-1/3 left-1/3 w-24 h-[2px] opacity-80 bg-gradient-to-r from-transparent via-white to-transparent transform -rotate-12 blur-[1px]"></div>
                     </>
                   ) : (
                     <>
                       <div className="absolute bottom-0 right-0 w-40 h-20 opacity-80 bg-gradient-to-tl from-red-600 via-orange-500 to-transparent blur-md"></div>
                       <div className="absolute top-1/2 left-1/4 w-32 h-[3px] opacity-60 bg-gradient-to-r from-transparent via-cyan-400 to-transparent transform -rotate-12 blur-[1px]"></div>
                       <div className="absolute top-1/3 left-1/3 w-24 h-[2px] opacity-80 bg-gradient-to-r from-transparent via-white to-transparent transform -rotate-12 blur-[1px]"></div>
                     </>
                   )}
                </div>
                
                <div className="relative z-10 w-full h-full p-3 flex flex-col justify-between">
                    <div className="flex items-start justify-between w-full">
                      {pkg.network === 'vinaphone' ? (
                        <span className="text-white text-sm font-bold lowercase tracking-wider opacity-90 leading-none">vinaphone</span>
                      ) : pkg.network === 'viettel' ? (
                        <span className="text-white text-sm font-black italic tracking-tight opacity-90 leading-none">viettel</span>
                      ) : (
                        <span className="text-white text-sm font-bold tracking-tight opacity-90 leading-none">mobifone</span>
                      )}
                      
                      <div className={`w-14 h-14 rounded-full border-[3px] border-white shadow-sm flex flex-col items-center justify-center -mr-1 -mt-1 transform shadow-inner ${
                        pkg.network === 'viettel' ? 'bg-gradient-to-br from-red-500 to-rose-700' :
                        pkg.network === 'mobifone' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                        'bg-gradient-to-br from-cyan-400 to-pink-500'
                      }`}>
                        <span className="text-white text-xl font-black leading-none drop-shadow">4G</span>
                        <span className="text-white text-[8px] font-bold leading-none uppercase">SPEED</span>
                      </div>
                    </div>
                    
                    {/* Chip SIM */}
                    <div className="w-12 h-10 border-[1.5px] border-yellow-600/80 rounded-md bg-gradient-to-br from-yellow-100 via-yellow-300 to-yellow-600 grid grid-cols-3 grid-rows-3 gap-[1px] p-[1px] shadow-sm ml-1 mb-1">
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

           {/* Voice Minutes Badges */}
           {pkg.voiceMinutes && (
             <div className="flex flex-col gap-2 mt-4 items-center z-10 w-full px-6">
                {pkg.voiceMinutes.split('+').map((part, index) => {
                  const numMatch = part.match(/\d+[\d\.]*/);
                  const isNoiMang = part.toLowerCase().includes('nội') || part.toLowerCase().includes('noi mang');
                  const isNgoaiMang = part.toLowerCase().includes('ngoại') || part.toLowerCase().includes('ngoai mang');
                  
                  return (
                    <div key={index} className="bg-blue-500 text-white text-sm font-bold rounded-full py-1.5 px-4 shadow-sm w-full text-center tracking-tight">
                       {part.trim()}
                    </div>
                  );
                })}
             </div>
           )}
           
           {pkg.badge && (
             <span className="absolute top-4 right-4 bg-yellow-400 text-slate-900 px-3 py-1 rounded text-xs font-black uppercase shadow-sm">
               {pkg.badge}
             </span>
           )}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-primary to-secondary p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="w-20 h-20 text-white transform rotate-12" />
          </div>
          <div className="relative z-10 text-white">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-2xl font-black">{pkg.name}</h3>
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{pkg.network}</span>
              </div>
              {pkg.badge && (
                <span className="bg-yellow-400 text-slate-900 px-2 py-0.5 rounded text-[10px] font-black uppercase animate-pulse shadow-sm">
                  {pkg.badge}
                </span>
              )}
            </div>
            <p className="text-white/80 text-sm font-medium">{pkg.validity || '30 Ngày'}</p>
          </div>
        </div>
      )}
      
      <div className="p-6 flex-grow flex flex-col space-y-6">
        <div className="space-y-4">
          {pkg.dataAmount && (
            <div className="flex items-center space-x-3 text-slate-700">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500 leading-none mb-1">Dung lượng</p>
                <p className="font-bold text-lg">{pkg.dataAmount}</p>
              </div>
            </div>
          )}
          
          {(pkg.voiceMinutes) && (
            <div className="flex items-center space-x-3 text-slate-700">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-slate-500 leading-none mb-1">Thoại</p>
                <p className="font-bold">{pkg.voiceMinutes}</p>
              </div>
            </div>
          )}

          {pkg.highlightPromo && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
              <p className="text-red-600 text-sm font-semibold whitespace-pre-wrap">{pkg.highlightPromo}</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-50 flex-grow flex flex-col justify-end">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-slate-500 text-[10px] uppercase tracking-wider font-bold mb-1">{pkg.isSim ? 'Giá:' : 'Giá cước'}</p>
              <p className="text-2xl font-black text-primary leading-tight">{formatCurrency(pkg.price)}</p>
            </div>
            
            {!isMobile && (
              <div className="flex flex-col items-end gap-2">
                {pkg.isSim ? (
                  <button
                    onClick={() => setShowOrderModal(true)}
                    className="bg-primary text-white px-5 py-2 rounded-full font-black text-[11px] hover:bg-primary-dark transition-colors shadow-lg uppercase tracking-tight flex items-center gap-1"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    MUA NGAY
                  </button>
                ) : (
                  <a
                    href={smsUrl}
                    className="bg-primary text-white px-5 py-2 rounded-full font-black text-[11px] hover:bg-primary-dark transition-colors shadow-lg uppercase tracking-tight"
                  >
                    {pkg.registerButtonText || 'ĐĂNG KÝ NGAY'}
                  </a>
                )}
              </div>
            )}
          </div>

          {!isMobile ? (
            !pkg.isSim && (
              <div className="bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 mt-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Cú pháp đăng ký</p>
                <div className="flex items-center justify-between">
                  <p className="text-slate-800 font-mono font-bold text-sm flex items-center gap-2">
                    <MessageSquare className="w-3 h-3 text-primary" />
                    {pkg.registrationSyntax} gửi {pkg.registrationNumber}
                  </p>
                  <button onClick={handleCopy} className="text-slate-400 hover:text-primary"><Copy className="w-3 h-3" /></button>
                </div>
              </div>
            )
          ) : pkg.isSim ? (
            <button
              onClick={() => setShowOrderModal(true)}
              className="w-full bg-gradient-to-r from-pink-500 to-blue-500 text-white py-3.5 rounded-full font-black text-sm text-center shadow-lg hover:shadow-xl transition-all uppercase tracking-wide block mb-3 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              MUA NGAY
            </button>
          ) : (
            <a
              href={smsUrl}
              className="w-full bg-gradient-to-r from-pink-500 to-blue-500 text-white py-3.5 rounded-full font-black text-sm text-center shadow-lg hover:shadow-xl transition-all uppercase tracking-wide block mb-3 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              {pkg.registerButtonText || 'ĐĂNG KÝ NGAY'}
            </a>
          )}
          
          <div className="mt-3 text-center">
            <Link
              to={`/package/${pkg.id}`}
              className="inline-flex items-center justify-center gap-1.5 px-6 py-1.5 rounded-full border border-primary text-primary hover:bg-primary/5 transition-colors text-[11px] font-bold uppercase tracking-wide"
            >
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </motion.div>

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
                    className="w-full bg-primary text-white py-3.5 rounded-xl font-bold uppercase tracking-wide shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
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
    </>
  );
};
