"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

interface TableSearchProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSearch?: () => void;
}

const TableSearch = ({ value, onChange, onSearch }: TableSearchProps = {}) => {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (onSearch) {
      // Si hay una función onSearch, usarla
      onSearch();
    } else {
      // Comportamiento por defecto
      const input = e.currentTarget[0] as HTMLInputElement;
      const value = input.value;

      const params = new URLSearchParams(window.location.search);
      params.set("search", value);
      router.push(`${window.location.pathname}?${params}`);
    }
  };

  // Función onChange por defecto para evitar el error
  const handleChange = onChange || (() => {});

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2"
    >
      <Image src="/search.png" alt="" width={14} height={14} />
      <input
        type="text"
        placeholder="Buscar..."
        className="w-[200px] p-2 bg-transparent outline-none"
        value={value || ""}
        onChange={handleChange}
      />
    </form>
  );
};

export default TableSearch;
