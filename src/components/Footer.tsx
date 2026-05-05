import React, { useEffect, useState } from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { SiteConfig } from '../types';
import { useNetwork } from '../context/NetworkContext';
import { cn } from '../lib/utils';

export const Footer = () => {
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const { activeNetwork } = useNetwork();

  useEffect(() => {
    const fetchConfig = async () => {
      const snapshot = await getDocs(collection(db, 'config'));
      if (!snapshot.empty) {
        setConfig(snapshot.docs[0].data() as SiteConfig);
      }
    };
    fetchConfig();
  }, []);

  const getNetworkSpecificContent = () => {
    if (!config) return { contact: '', terms: '' };
    switch (activeNetwork) {
      case 'viettel':
        return { 
          contact: config.viettelContact || '', 
          terms: config.viettelTerms || '' 
        };
      case 'vinaphone':
        return { 
          contact: config.vinaphoneContact || '', 
          terms: config.vinaphoneTerms || '' 
        };
      case 'mobifone':
        return { 
          contact: config.mobifoneContact || '', 
          terms: config.mobifoneTerms || '' 
        };
      default:
        return { contact: '', terms: '' };
    }
  };

  const networkContent = getNetworkSpecificContent();

  const getLogoColor = () => {
    switch (activeNetwork) {
      case 'viettel': return 'from-[#EE0033] to-[#EE0033]';
      case 'vinaphone': return 'from-[#0070C0] to-[#0070C0]';
      case 'mobifone': return 'from-[#0055A5] to-[#F15A22]'; 
      default: return 'from-primary to-secondary';
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Cột 1 */}
          <div className="space-y-4">
            <div className="flex flex-col group">
              <span className={cn(
                "text-2xl font-black bg-gradient-to-r bg-clip-text text-transparent leading-none",
                getLogoColor()
              )}>
                SmartData
              </span>
              <span className="text-[10px] font-bold text-slate-500 tracking-wider">
                {config?.bannerImageUrl || 'Lựa Chọn Thông Minh'}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400 whitespace-pre-wrap">
              {config?.siteFooterDescription || 'SmartData - Lựa chọn Data 4G 5G thông minh cho Dế yêu của bạn. Chúng tôi cung cấp các gói cước tối ưu nhất từ các nhà mạng lớn.'}
            </p>
          </div>
          
          {/* Cột 2 */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest border-l-2 border-primary pl-2">Liên hệ</h3>
            <div className="text-sm leading-relaxed text-slate-400 whitespace-pre-wrap">
              {networkContent.contact || (
                <ul className="space-y-3">
                  <li className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-secondary" />
                    <span>Hotline: {config?.contactPhone || '1900 8198'}</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-secondary" />
                    <span>Email: {config?.footerText || 'hotro@smartdata.vn'}</span>
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* Cột 3 */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest border-l-2 border-primary pl-2">Thông tin & Kết nối</h3>
            <div className="text-sm leading-relaxed text-slate-400">
              {config?.infoLinks && config.infoLinks.length > 0 ? (
                <ul className="space-y-3">
                  {config.infoLinks.map((link, index) => {
                    const toUrl = link.url || `/page/custom-info-${link.id}`;
                    const isExternal = link.url && (link.url.startsWith('http') || link.url.startsWith('//'));
                    return (
                      <li key={index}>
                        {isExternal ? (
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                             {link.text}
                          </a>
                        ) : (
                          <Link to={toUrl} className="hover:text-primary transition-colors flex items-center gap-2">
                             {link.text}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p>Nội dung đang cập nhật</p>
              )}
            </div>
          </div>

          {/* Cột 4 */}
          <div>
            <h3 className="text-white font-bold mb-4 uppercase text-xs tracking-widest border-l-2 border-secondary pl-2">Điều khoản & Điều kiện</h3>
            <div className="text-sm leading-relaxed text-slate-400">
              {config?.footerLinks && config.footerLinks.length > 0 ? (
                <ul className="space-y-3">
                  {config.footerLinks.map((link, index) => {
                    const toUrl = link.url || `/page/custom-${link.id}`;
                    const isExternal = link.url && (link.url.startsWith('http') || link.url.startsWith('//'));
                    return (
                      <li key={index}>
                        {isExternal ? (
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                             {link.text}
                          </a>
                        ) : (
                          <Link to={toUrl} className="hover:text-primary transition-colors flex items-center gap-2">
                             {link.text}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : networkContent.terms ? (
                <div className="whitespace-pre-wrap">{networkContent.terms}</div>
              ) : (
                <ul className="space-y-3">
                  <li>
                    <Link to="/page/terms-of-service" className="hover:text-primary transition-colors flex items-center gap-2">
                       Điều khoản dịch vụ
                    </Link>
                  </li>
                  <li>
                    <Link to="/page/privacy-policy" className="hover:text-primary transition-colors flex items-center gap-2">
                       Chính sách bảo mật
                    </Link>
                  </li>
                  <li>
                    <Link to="/page/payment-guide" className="hover:text-primary transition-colors flex items-center gap-2">
                       Hướng dẫn thanh toán
                    </Link>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 text-center text-xs text-slate-500 relative">
          <p>© {new Date().getFullYear()} SmartData - Kênh đăng ký gói cước di động thông minh. Mọi quyền được bảo lưu.</p>
          <Link to="/login" className="absolute right-0 bottom-0 opacity-10 hover:opacity-100 transition-opacity p-2">Admin</Link>
        </div>
      </div>
    </footer>
  );
};
