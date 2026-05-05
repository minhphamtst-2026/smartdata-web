import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { SiteConfig } from '../types';
import { ChevronLeft, FileText, Shield, CreditCard } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';

export const InfoPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<string>('');
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState<React.ReactNode>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'config'));
        if (!snapshot.empty) {
          const config = snapshot.docs[0].data() as SiteConfig;
          let pageData;
          let pageTitle = '';
          let pageIcon;

          let customLink;
          if (slug?.startsWith('custom-info-')) {
            const customId = slug.replace('custom-info-', '');
            customLink = config.infoLinks?.find(link => link.id === customId);
          } else if (slug?.startsWith('custom-')) {
            const customId = slug.replace('custom-', '');
            customLink = config.footerLinks?.find(link => link.id === customId);
          } else {
            customLink = config.footerLinks?.find(link => link.url === `/page/${slug}` || link.url === `page/${slug}`) || 
                         config.infoLinks?.find(link => link.url === `/page/${slug}` || link.url === `page/${slug}`);
          }

          if (customLink) {
            if (customLink.url && customLink.url.startsWith('http')) {
              window.location.href = customLink.url;
              return;
            }
            // Use the content from the custom link if it exists
            if (customLink.content) {
              setContent(customLink.content);
              setTitle(customLink.text);
              setIcon(<FileText className="w-8 h-8 text-indigo-500" />);
              return;
            }
          }

          // Fallback to older default configs if not a custom link
          switch (slug) {
              case 'terms-of-service':
                pageData = config.termsOfService;
                pageTitle = 'Điều khoản dịch vụ';
                pageIcon = <FileText className="w-8 h-8 text-blue-500" />;
                break;
              case 'privacy-policy':
                pageData = config.privacyPolicy;
                pageTitle = 'Chính sách bảo mật';
                pageIcon = <Shield className="w-8 h-8 text-green-500" />;
                break;
              case 'payment-guide':
                pageData = config.paymentGuide;
                pageTitle = 'Hướng dẫn thanh toán';
                pageIcon = <CreditCard className="w-8 h-8 text-orange-500" />;
                break;
            }

            if (pageData) {
              if (pageData.url) {
                window.location.href = pageData.url;
                return;
              }
              setContent(pageData.content || '');
              setTitle(pageTitle);
              setIcon(pageIcon);
            }
        }
      } catch (error) {
        console.error('Error fetching info page:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!content && !loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Nội dung đang được cập nhật</h1>
        <Link to="/" className="btn-primary">Quay lại trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      <div className="bg-white border-b sticky top-16 z-30">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-slate-500 hover:text-slate-900 flex items-center gap-2 font-medium">
            <ChevronLeft className="w-4 h-4" />
            Trang chủ
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-white rounded-[40px] shadow-sm border p-8 md:p-12">
          <div className="flex flex-col items-center text-center mb-10">
            <h1 className="text-3xl font-black text-slate-900">{title}</h1>
          </div>

          <div className="prose prose-slate max-w-none prose-headings:font-black prose-headings:text-slate-900 prose-p:leading-relaxed prose-li:leading-relaxed">
            <Markdown remarkPlugins={[remarkBreaks]}>{content}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
};
