"use client"

import Footer from '@/components/Home/Footer'
import Header from '@/components/Home/Header'
import React from 'react'
import AuthenticationModal from '../(auth)/authenticationModal';
import { useAuthModalStore } from '@/stores/useAuthModalStore';
import { useCartSync } from '@/hooks/useCartSync';
import { useAuth } from '@/hooks/useAuth';


type HomepageProps = {
  children?: React.ReactNode;
};

const Homepage = ({ children }: HomepageProps) => {
  const { isOpen, closeModal } = useAuthModalStore();
  
  useAuth();
  useCartSync();

  return (
   <div className="font-roboto min-h-screen" style={{ fontFamily: 'var(--font-roboto)' }}>
     <div className="fixed top-0 left-0 right-0 z-50">
       <Header />
     </div>
     <div className="pt-[108px] sm:pt-[130px] md:pt-[140px] min-h-screen">
       {children}
     </div>
     <Footer />

      <AuthenticationModal
        isOpen={isOpen} 
        close={closeModal} 
      />
     </div>
  );
};

export default Homepage