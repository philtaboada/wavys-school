'use client'
import { useRef, useEffect } from 'react';
import router, { useRouter } from 'next/router';
import Link from 'next/link';
import { signOutAction } from "@/app/actions";


interface CloseSessionProps {
  isOpen: boolean;
  onClose: () => void;
}

const CloseSession: React.FC<CloseSessionProps> = ({ isOpen, onClose }) => {

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown si se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    await signOutAction();
    router.push('/login');
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50"
    >
      <div className="py-1" role="menu" aria-orientation="vertical">
        <Link
          href="/perfil"
          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          role="menuitem"
        >
          Mi Perfil
        </Link>
        <Link
          href="/configuracion"
          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          role="menuitem"
        >
          Configuración
        </Link>
        <button
          onClick={handleSignOut}
          className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
          role="menuitem"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default CloseSession;
