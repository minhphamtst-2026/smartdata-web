export interface Package {
  id: string;
  name: string;
  network: 'viettel' | 'vinaphone' | 'mobifone';
  price: number;
  dataAmount?: string;
  voiceMinutes?: string;
  smsAmount?: string;
  validity?: string;
  categoryId: string;
  order?: number;
  registrationSyntax: string;
  registrationNumber: string;
  badge?: string;
  highlightPromo?: string;
  registerButtonText?: string;
  description?: string;
  longDescription?: string;
  isSim?: boolean;
  featured?: boolean;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Order {
  id?: string;
  packageId: string;
  packageName: string;
  customerPhone: string;
  contactMethod: 'call' | 'zalo' | 'telegram';
  status: 'pending' | 'contacted' | 'completed' | 'cancelled';
  createdAt?: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active?: boolean;
  order?: number;
}

export interface SiteConfig {
  defaultNetwork?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerImageUrl?: string;
  registrationNumber?: string;
  footerText?: string;
  contactPhone?: string;
  // Footer content
  siteFooterDescription?: string;
  viettelContact?: string;
  viettelTerms?: string;
  vinaphoneContact?: string;
  vinaphoneTerms?: string;
  mobifoneContact?: string;
  mobifoneTerms?: string;
  footerLinks?: { id: string; text: string; url?: string; content?: string }[];
  infoLinks?: { id: string; text: string; url?: string; content?: string }[];
  // Dynamic pages content/links
  termsOfService?: { content: string; url?: string };
  privacyPolicy?: { content: string; url?: string };
  paymentGuide?: { content: string; url?: string };
}

export interface MenuItem {
  id: string;
  title: string;
  url?: string;
  parentId?: string | null;
  order: number;
  active?: boolean;
}
