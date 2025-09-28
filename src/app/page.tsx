"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function Home() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
  return (
    <div className="min-h-screen bg-finore-secondary">
      <header className="bg-finore-primary shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Image
              src="/logo-finore-horizontal.svg"
              alt="Finore Logo"
              width={200}
              height={50}
              priority
            />
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Dashboard Finore</h1>
              <button
                onClick={() => setIsDark(!isDark)}
                className="px-4 py-2 bg-white text-finore-primary rounded hover:bg-gray-100"
              >
                {isDark ? 'Modo Claro' : 'Modo Oscuro'}
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900">Ingresos</h2>
            <p className="text-3xl font-bold text-green-600">$1,234,567</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900">Gastos</h2>
            <p className="text-3xl font-bold text-red-600">$987,654</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900">Beneficio</h2>
            <p className="text-3xl font-bold text-blue-600">$246,913</p>
          </div>
        </div>
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Financiera</h2>
          <p className="text-gray-600">Aquí se mostrará la información financiera detallada de la empresa Finore.</p>
        </div>
      </main>
    </div>
  );
}
