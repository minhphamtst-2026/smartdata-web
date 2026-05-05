export const getValidityType = (validity?: string): 'daily' | 'monthly' | 'long-term' | 'unknown' => {
  if (!validity) return 'unknown';
  const str = validity.toLowerCase().trim();
  
  const numMatch = str.match(/\d+/);
  const num = numMatch ? parseInt(numMatch[0], 10) : 0;
  
  if (str.includes('tháng') || str.includes('thang') || str.includes('month')) {
    if (num < 1) return 'daily';
    if (num === 1) return 'monthly';
    if (num > 1) return 'long-term';
  }
  
  if (str.includes('ngày') || str.includes('ngay') || str.includes('day')) {
    if (num < 30) return 'daily';
    if (num === 30 || num === 31) return 'monthly';
    if (num > 31) return 'long-term';
  }
  
  if (str.includes('năm') || str.includes('nam') || str.includes('year')) {
    return 'long-term';
  }
  
  return 'unknown';
};
