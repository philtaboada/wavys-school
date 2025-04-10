'use client'

import { useState } from 'react';
import Image from 'next/image';
import CloseSession from './CloseSeesion';

export default function UserMenu() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  return (
    <div className="relative">
      <button 
        id='boton-avatar' 
        className="p-0 border-0 bg-transparent cursor-pointer rounded-full hover:opacity-80 transition-opacity"
        aria-label="Perfil de usuario"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <Image src="/avatar.png" alt="" width={36} height={36} className="rounded-full" />
      </button>
      
      <CloseSession 
        isOpen={isDropdownOpen} 
        onClose={() => setIsDropdownOpen(false)} 
      />
    </div>
  );
}