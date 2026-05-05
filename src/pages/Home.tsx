import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Package, Category, SiteConfig } from '../types';
import { PackageCard } from '../components/PackageCard';
import { motion } from 'motion/react';
import { Rocket, Zap, Clock, Shield, Wifi, Phone, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

import { useNetwork } from '../context/NetworkContext';

import { getValidityType } from '../utils';

const HomePackageSection = ({ 
  categorySlug, 
  title, 
  subtitle, 
  activeNetwork,
  validityFilter
}: { 
  categorySlug?: string; 
  title: string; 
  subtitle: string; 
  activeNetwork: string;
  validityFilter?: 'daily' | 'monthly' | 'long-term';
}) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCategory, setHasCategory] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchSecData = async () => {
      setLoading(true);
      try {
        if (validityFilter) {
          // Virtual section filtering by validity
          const pq = query(
            collection(db, 'packages'),
            where('network', '==', activeNetwork),
            where('active', '==', true)
          );
          const pSnap = await getDocs(pq);
          let pkgs = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
          pkgs = pkgs.filter(p => getValidityType(p.validity) === validityFilter);
          
          if (isMounted) {
            setHasCategory(true); // Virtual categories are always "active"
            const ordered = pkgs.filter(p => p.order && p.order >= 1 && p.order <= 5).sort((a, b) => (a.order || 0) - (b.order || 0));
            const others = pkgs.filter(p => !p.order || p.order < 1 || p.order > 5).sort(() => Math.random() - 0.5);
            setPackages([...ordered, ...others].slice(0, 5));
          }
        } else if (categorySlug) {
          // Standard DB category filtering
          const cq = query(collection(db, 'categories'), where('slug', '==', categorySlug), where('active', '==', true));
          const cSnap = await getDocs(cq);
          
          if (cSnap.empty) {
            if (isMounted) {
              setHasCategory(false);
              setLoading(false);
            }
            return;
          }

          const catId = cSnap.docs[0].id;
          if (isMounted) setHasCategory(true);

          const pq = query(
            collection(db, 'packages'),
            where('categoryId', '==', catId),
            where('network', '==', activeNetwork),
            where('active', '==', true)
          );
          const pSnap = await getDocs(pq);
          let pkgs = pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
          
          if (isMounted) {
            const ordered = pkgs.filter(p => p.order && p.order >= 1 && p.order <= 5).sort((a, b) => (a.order || 0) - (b.order || 0));
            const others = pkgs.filter(p => !p.order || p.order < 1 || p.order > 5).sort(() => Math.random() - 0.5);
            setPackages([...ordered, ...others].slice(0, 5));
          }
        }
      } catch (error) {
        console.error('Error fetching section', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchSecData();
    return () => { isMounted = false; };
  }, [categorySlug, activeNetwork, validityFilter]);

  if (!loading && !hasCategory) return null;
  if (!loading && packages.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 relative z-20 pt-16">
      <div className="flex justify-between items-end mb-10">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">{title}</h2>
          <p className="text-slate-500">{subtitle}</p>
        </div>
        <Link to={`/category/${categorySlug}?network=${activeNetwork}`} className="text-primary font-bold hover:underline">Xem tất cả →</Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {packages.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      )}
    </section>
  );
};

export const Home = () => {
  const [featuredPackages, setFeaturedPackages] = useState<Package[]>([]);
  const { activeNetwork, setActiveNetwork } = useNetwork();
  const [config, setConfig] = useState<SiteConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeNetwork]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch featured packages for active network
      const pq = query(
        collection(db, 'packages'),
        where('network', '==', activeNetwork),
        where('featured', '==', true),
        where('active', '==', true)
      );
      const pSnapshot = await getDocs(pq);
      let pkgs = pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
      
      const ordered = pkgs.filter(p => p.order && p.order >= 1 && p.order <= 5).sort((a, b) => (a.order || 0) - (b.order || 0));
      const others = pkgs.filter(p => !p.order || p.order < 1 || p.order > 5).sort(() => Math.random() - 0.5);
      
      setFeaturedPackages([...ordered, ...others].slice(0, 5));

      // Fetch config if not loaded
      if (!config) {
        const cq = collection(db, 'config');
        const cSnapshot = await getDocs(cq);
        if (!cSnapshot.empty) {
          setConfig(cSnapshot.docs[0].data() as SiteConfig);
        }
      }
    } catch (error) {
      console.error('Error fetching home data', error);
    } finally {
      setLoading(false);
    }
  };

  const networks = [
    { id: 'viettel', name: 'Viettel', color: 'bg-[#EE0033]' },
    { id: 'vinaphone', name: 'Vinaphone', color: 'bg-[#0070C0]' },
    { id: 'mobifone', name: 'Mobifone', color: 'bg-[#0055A5]' }
  ];

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-secondary pt-16 pb-32 md:pt-20 md:pb-40">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 -left-1/4 w-1/2 h-full bg-white rounded-full blur-3xl transform -rotate-12"></div>
          <div className="absolute bottom-0 -right-1/4 w-1/2 h-full bg-white rounded-full blur-3xl transform rotate-12"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-white text-xs font-bold uppercase tracking-widest mb-6 border border-white/20">
              ⚡ SmartData.vn - Lựa Chọn Thông Minh
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight tracking-tighter">
              {config?.bannerTitle || 'Đăng Ký 4G/5G Siêu Tốc'}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto font-medium whitespace-pre-wrap">
              {config?.bannerSubtitle || 'SmartData - Lựa chọn Data 4G 5G thông minh\nCho Dế yêu của bạn'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Network Tabs */}
      <section className="max-w-7xl mx-auto px-4 -mt-20 md:-mt-24 relative z-20">
        <div className="bg-white p-1.5 md:p-2 rounded-[32px] shadow-2xl border border-slate-100 flex overflow-x-auto no-scrollbar md:flex-wrap justify-start md:justify-center gap-1.5 md:gap-2 max-w-2xl mx-auto">
          {networks.map((net) => (
            <button
              key={net.id}
              onClick={() => setActiveNetwork(net.id as any)}
              className={cn(
                "flex-1 min-w-[110px] md:min-w-0 px-3 md:px-8 py-2.5 md:py-4 rounded-[24px] md:rounded-[26px] font-black text-[11px] md:text-sm transition-all duration-300 transform active:scale-95 whitespace-nowrap",
                activeNetwork === net.id 
                  ? `${net.color} text-white shadow-xl translate-y-[-2px]` 
                  : "bg-slate-50 text-slate-400 hover:text-slate-600"
              )}
            >
              {net.name}
            </button>
          ))}
        </div>
      </section>

      {/* Featured Packages */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Link to={`/category/data?network=${activeNetwork}`} className="group bg-white p-8 rounded-[32px] shadow-sm border hover:border-primary transition-all flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800">Gói Siêu Data</h3>
              <p className="text-slate-500 text-sm">Nhiều dung lượng, tốc độ cao</p>
            </div>
            <div className="bg-primary/5 p-4 rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors text-primary">
              <Wifi className="w-6 h-6" />
            </div>
          </Link>
          <Link to={`/category/combo?network=${activeNetwork}`} className="group bg-white p-8 rounded-[32px] shadow-sm border hover:border-secondary transition-all flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800">Gói Combo</h3>
              <p className="text-slate-500 text-sm">Data + Thoại siêu ưu đãi</p>
            </div>
            <div className="bg-secondary/5 p-4 rounded-2xl group-hover:bg-secondary group-hover:text-white transition-colors text-secondary">
              <Phone className="w-6 h-6" />
            </div>
          </Link>
          <Link to={`/category/thoai?network=${activeNetwork}`} className="group bg-white p-8 rounded-[32px] shadow-sm border hover:border-slate-900 transition-all flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800">Gói Thoại</h3>
              <p className="text-slate-500 text-sm">Giao lưu thả ga, không lo giá</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-colors text-slate-400">
              <MessageSquare className="w-6 h-6" />
            </div>
          </Link>
        </div>

        <div className="flex justify-between items-end mb-10">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Gói Cước HOT</h2>
            <p className="text-slate-500">Các gói cước được nhiều người dùng lựa chọn nhất</p>
          </div>
          <button className="text-primary font-bold hover:underline">Xem tất cả →</button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-100 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredPackages.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 relative z-20 pt-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {[
            { icon: <Zap className="text-yellow-400" />, title: 'Tốc độ cực đỉnh', desc: 'Hỗ trợ 5G mới nhất' },
            { icon: <Clock className="text-blue-400" />, title: 'Kích hoạt 30s', desc: 'Nhận data ngay lập tức' },
            { icon: <Rocket className="text-red-400" />, title: 'Ưu đãi khủng', desc: 'Rẻ hơn 30% hàng tháng' },
            { icon: <Shield className="text-green-400" />, title: 'An toàn 100%', desc: 'Đại lý chính thức nhà mạng' },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center text-center space-y-3"
            >
              <div className="p-3 bg-slate-50 rounded-xl">{feature.icon}</div>
              <h3 className="font-bold text-slate-800">{feature.title}</h3>
              <p className="text-xs text-slate-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
      {/* Additional package sections */}
      <HomePackageSection 
        validityFilter="daily"
        categorySlug="goi-ngay"
        title="Gói Cước Ngày" 
        subtitle="Sử dụng thả ga trong 24h, cước phí siêu rẻ"
        activeNetwork={activeNetwork}
      />
      
      <HomePackageSection 
        validityFilter="monthly"
        categorySlug="goi-thang"
        title="Gói Cước Tháng" 
        subtitle="Tiết kiệm data trọn vẹn cả tháng"
        activeNetwork={activeNetwork}
      />
      
      <HomePackageSection 
        validityFilter="long-term"
        categorySlug="goi-dai-ngay"
        title="Gói Dài Ngày" 
        subtitle="Đăng ký 1 lần sử dụng 3 tháng, 6 tháng, 1 năm lướt thả ga"
        activeNetwork={activeNetwork}
      />
    </div>
  );
};
