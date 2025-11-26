"use client"

import Footer from '@/components/Home/Footer'
import Header from '@/components/Home/Header'
import React from 'react'
import AuthenticationModal from '../(auth)/authenticationModal';
import { useAuthModalStore } from '@/stores/useAuthModalStore';
import { useCartSync } from '@/hooks/useCartSync';


type HomepageProps = {
  children?: React.ReactNode;
};

const Homepage = ({ children }: HomepageProps) => {
  const { isOpen, closeModal } = useAuthModalStore();
  
  // Initialize cart synchronization
  useCartSync();

  return (
    <div className="font-roboto min-h-screen" style={{ fontFamily: 'var(--font-roboto)' }}>
     <Header />
     {children}
     <Footer />

      <AuthenticationModal
        isOpen={isOpen} 
        close={closeModal} 
      />
     </div>
  );
};

export default Homepage