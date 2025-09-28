"use client"

import Image from "next/image";
import { useEffect, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { UserMenu } from "@/components/user-menu";
import { AuthGuard } from "@/components/auth-guard";
import { fetchCSVData, CSVRow } from "@/lib/csv-parser";

export default function Home() {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/csv');
        const result = await response.json();

        if (result.error) {
          console.error('Error fetching CSV:', result.error);
          setCsvData([]);
        } else {
          setCsvData(result.data);
        }
      } catch (error) {
        console.error('Error fetching CSV data:', error);
        setCsvData([]);
      }
      setIsLoadingData(false);
    };

    loadData();
  }, []);
  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <header className="bg-card shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4">
              <Image
                src="/logo-finore-horizontal.svg"
                alt="Finore Logo"
                width={200}
                height={50}
                priority
                className="w-32 sm:w-48"
              />
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground text-center sm:text-left">Dashboard Finore</h1>
                <div className="flex items-center gap-2">
                  <ModeToggle />
                  <UserMenu />
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-card p-4 sm:p-6 rounded-lg shadow border">
              <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Ingresos</h2>
              <p className="text-2xl sm:text-3xl font-bold text-green-600">$1,234,567</p>
            </div>
            <div className="bg-card p-4 sm:p-6 rounded-lg shadow border">
              <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Gastos</h2>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">$987,654</p>
            </div>
            <div className="bg-card p-4 sm:p-6 rounded-lg shadow border sm:col-span-2 lg:col-span-1">
              <h2 className="text-base sm:text-lg font-semibold text-card-foreground">Beneficio</h2>
              <p className="text-2xl sm:text-3xl font-bold text-blue-600">$246,913</p>
            </div>
          </div>
          <div className="mt-6 sm:mt-8 bg-card p-4 sm:p-6 rounded-lg shadow border">
            <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-4">Información Financiera</h2>
            <p className="text-sm sm:text-base text-muted-foreground">Aquí se mostrará la información financiera detallada de la empresa Finore.</p>
          </div>

          <div className="mt-6 sm:mt-8 bg-card p-4 sm:p-6 rounded-lg shadow border">
            <h2 className="text-lg sm:text-xl font-semibold text-card-foreground mb-4">Datos de Excel</h2>
            {isLoadingData ? (
              <p className="text-sm sm:text-base text-muted-foreground">Cargando datos...</p>
            ) : csvData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="border-b">
                      {Object.keys(csvData[0]).map((header) => (
                        <th key={header} className="text-left p-2 text-sm font-medium text-card-foreground">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 10).map((row, index) => (
                      <tr key={index} className="border-b">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="p-2 text-sm text-muted-foreground">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvData.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Mostrando las primeras 10 filas de {csvData.length} registros.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm sm:text-base text-muted-foreground">
                No se pudieron cargar los datos. Verifica la URL del CSV.
              </p>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
