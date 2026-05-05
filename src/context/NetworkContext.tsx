import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SiteConfig } from '../types';

type NetworkType = 'viettel' | 'vinaphone' | 'mobifone';

interface NetworkContextType {
  activeNetwork: NetworkType;
  setActiveNetwork: (network: NetworkType) => void;
}

const NetworkContext = createContext<NetworkContextType>({
  activeNetwork: 'viettel',
  setActiveNetwork: () => {},
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeNetwork, setActiveNetwork] = useState<NetworkType>('vinaphone');
  const [defaultNetwork, setDefaultNetwork] = useState<NetworkType | null>(null);
  const location = useLocation();

// Fetch from config exactly once on boot
  useEffect(() => {
    let isMounted = true;
    const fetchConfig = async () => {
      try {
        const cSnap = await getDocs(collection(db, 'config'));
        if (!cSnap.empty && isMounted) {
          const config = cSnap.docs[0].data() as SiteConfig;
          const defNet = config.defaultNetwork && ['viettel', 'vinaphone', 'mobifone'].includes(config.defaultNetwork) 
            ? (config.defaultNetwork as NetworkType) 
            : 'vinaphone'; // default constraint
          
          setDefaultNetwork(defNet);
        }
      } catch (err) {
        console.error('Error fetching default network', err);
      }
    };
    fetchConfig();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const networkParam = searchParams.get('network') as NetworkType | null;
    
    if (networkParam && ['viettel', 'vinaphone', 'mobifone'].includes(networkParam)) {
      setActiveNetwork(networkParam);
    } else if (defaultNetwork) {
      setActiveNetwork(defaultNetwork);
    }
  }, [location.search, location.pathname, defaultNetwork]);

  return (
    <NetworkContext.Provider value={{ activeNetwork, setActiveNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);

