"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Hook para navegación en Next.js

const QrScanner = () => {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter(); // Instancia del router

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768); // Detectar si es móvil (máx. 768px)
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (!isMobile) return null; // Ocultar si no es móvil

  const handleNavigation = () => {
    router.push("/protected/scanqr"); // Redirigir a la página de escaneo de QR
  };

  return (
    <div
      className="rounded-2xl bg-lamaPurple p-4 flex-1 min-w-[130px] cursor-pointer hover:bg-lamaYellow transition"
      onClick={handleNavigation} // Redirección al hacer clic
    >
      <div className="flex justify-between items-center">
        <span className="text-[10px] bg-white px-2 py-1 rounded-full text-green-600">
          2025/26
        </span>
      </div>

      <h1 className="text-2xl font-semibold my-4">
        <svg
          className="h-[50px] w-[50px] text-white"
          xmlns="http://www.w3.org/2000/svg"
          width="200"
          height="200"
          viewBox="0 0 16 16"
        >
          <g fill="currentColor">
            <path d="M2 2h2v2H2V2Z" />
            <path d="M6 0v6H0V0h6ZM5 1H1v4h4V1ZM4 12H2v2h2v-2Z" />
            <path d="M6 10v6H0v-6h6Zm-5 1v4h4v-4H1Zm11-9h2v2h-2V2Z" />
            <path d="M10 0v6h6V0h-6Zm5 1v4h-4V1h4ZM8 1V0h1v2H8v2H7V1h1Zm0 5V4h1v2H8ZM6 8V7h1V6h1v2h1V7h5v1h-4v1H7V8H6Zm0 0v1H2V8H1v1H0V7h3v1h3Zm10 1h-1V7h1v2Zm-1 0h-1v2h2v-1h-1V9Zm-4 0h2v1h-1v1h-1V9Zm2 3v-1h-1v1h-1v1H9v1h3v-2h1Zm0 0h3v1h-2v1h-1v-2Zm-4-1v1h1v-2H7v1h2Z" />
            <path d="M7 12h1v3h4v1H7v-4Zm9 2v2h-3v-1h2v-1h1Z" />
          </g>
        </svg>
      </h1>
      <h2 className="capitalize text-sm font-medium text-gray-500">
        QR Scanner Assistance
      </h2>
    </div>
  );
};

export default QrScanner;
