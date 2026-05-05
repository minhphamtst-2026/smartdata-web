import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Package, Category } from '../types';
import { PackageCard } from '../components/PackageCard';
import { motion } from 'motion/react';
import { getValidityType } from '../utils';

const VIRTUAL_CATEGORIES = {
  'goi-ngay': {
    id: 'goi-ngay',
    name: 'Gói Cước Ngày',
    slug: 'goi-ngay',
    active: true,
    description: 'Sử dụng thả ga trong 24h, cước phí siêu rẻ',
    type: 'daily'
  },
  'goi-thang': {
    id: 'goi-thang',
    name: 'Gói Cước Tháng',
    slug: 'goi-thang',
    active: true,
    description: 'Tiết kiệm data trọn vẹn cả tháng',
    type: 'monthly'
  },
  'goi-dai-ngay': {
    id: 'goi-dai-ngay',
    name: 'Gói Dài Ngày',
    slug: 'goi-dai-ngay',
    active: true,
    description: 'Đăng ký 1 lần sử dụng 3 tháng, 6 tháng, 1 năm lướt thả ga',
    type: 'long-term'
  }
};

export const CategoryPage = () => {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const networkParam = searchParams.get('network'); // Remove default 'viettel'
  const [category, setCategory] = useState<Category | null>(null);

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (slug && VIRTUAL_CATEGORIES[slug as keyof typeof VIRTUAL_CATEGORIES]) {
          const vCat = VIRTUAL_CATEGORIES[slug as keyof typeof VIRTUAL_CATEGORIES];
          setCategory({
            id: vCat.id,
            name: vCat.name,
            slug: vCat.slug,
            active: vCat.active,
            description: vCat.description
          } as Category);

          const queries: any[] = [where('active', '==', true)];
          if (networkParam) {
            queries.push(where('network', '==', networkParam));
          }
          
          const pq = query(collection(db, 'packages'), ...queries);
          const pSnapshot = await getDocs(pq);
          let pkgs = pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
          
          pkgs = pkgs.filter(p => getValidityType(p.validity) === vCat.type);

          const ordered = pkgs.filter(p => p.order && p.order >= 1 && p.order <= 5).sort((a, b) => (a.order || 0) - (b.order || 0));
          const others = pkgs.filter(p => !p.order || p.order < 1 || p.order > 5).sort(() => Math.random() - 0.5);
          setPackages([...ordered, ...others]);
        } else {
          // Find real category
          const cq = query(collection(db, 'categories'), where('slug', '==', slug), where('active', '==', true));
          const cSnapshot = await getDocs(cq);
          
          if (!cSnapshot.empty) {
            const matchedCats = cSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
            setCategory(matchedCats[0]);

            const catIds = matchedCats.map(c => c.id).slice(0, 10); // Firestore max 10 for 'in'

            // Find packages
            const queries: any[] = [
              where('categoryId', 'in', catIds),
              where('active', '==', true)
            ];
            
            if (networkParam) {
              queries.push(where('network', '==', networkParam));
            }

            const pq = query(collection(db, 'packages'), ...queries);
            const pSnapshot = await getDocs(pq);
            let pkgs = pSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Package));
            
            const ordered = pkgs.filter(p => p.order && p.order >= 1 && p.order <= 5).sort((a, b) => (a.order || 0) - (b.order || 0));
            const others = pkgs.filter(p => !p.order || p.order < 1 || p.order > 5).sort(() => Math.random() - 0.5);
            
            setPackages([...ordered, ...others]);
          } else {
             setCategory(null);
          }
        }
      } catch (error) {
        console.error('Error fetching category data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, networkParam]);

  if (loading) return <div className="h-96 flex items-center justify-center animate-pulse text-slate-400">Đang tải gói cước...</div>;
  if (!category) return <div className="h-96 flex items-center justify-center">Không tìm thấy danh mục.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
      <header className="space-y-4">
        <h1 className={`text-4xl font-black ${
          category.name.toLowerCase().includes('vinaphone') ? 'bg-gradient-to-r from-[#0070C0] to-[#00AEEF] bg-clip-text text-transparent inline-block pb-2' : 
          category.name.toLowerCase().includes('viettel') ? 'bg-gradient-to-r from-red-600 to-rose-700 bg-clip-text text-transparent inline-block pb-2' :
          category.name.toLowerCase().includes('mobifone') ? 'bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent inline-block pb-2' :
          'text-slate-900'
        }`}>
          {category.name
            .replace(/sim vinaphone/i, "SIM Data Vinaphone")
            .replace(/sim viettel/i, "SIM Data Viettel")
            .replace(/sim mobifone/i, "SIM Data Mobifone")}
        </h1>
        {category.description && <p className="text-slate-600 max-w-2xl">{category.description}</p>}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {packages.length > 0 ? (
          packages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)
        ) : (
          <div className="col-span-full py-20 text-center text-slate-400 font-medium bg-white rounded-3xl border border-dashed">
            Chưa có sản phẩm nào trong mục này.
          </div>
        )}
      </div>
    </div>
  );
};
