"use client"

import Image from "next/image";
import { useEffect, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { UserMenu } from "@/components/user-menu";
import { AuthGuard } from "@/components/auth-guard";
import { ChatModal } from "@/components/chat-modal";
import { Button } from "@/components/ui/button";
import { fetchCSVData, CSVRow } from "@/lib/csv-parser";

export default function Home() {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexMessage, setIndexMessage] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        // Primero cargar los datos del CSV
        const response = await fetch('/api/csv');
        const result = await response.json();

        if (result.error) {
          console.error('Error fetching CSV:', result.error);
          setCsvData([]);
        } else {
          setCsvData(result.data);

          // Nota: La indexación ahora es manual para evitar demoras en la carga
          // Se puede activar desde un botón o configuración
        }
      } catch (error) {
        console.error('Error fetching CSV data:', error);
        setCsvData([]);
      }
      setIsLoadingData(false);
    };

    loadData();
  }, []);

  const handleIndexData = async () => {
    setIsIndexing(true);
    setIndexMessage('');

    try {
      const response = await fetch('/api/index-sheets', {
        method: 'POST',
      });
      const result = await response.json();

      if (result.error) {
        setIndexMessage(`Error: ${result.error}`);
      } else {
        setIndexMessage(result.message || 'Indexación completada');
      }
    } catch (error) {
      setIndexMessage('Error al conectar con el servidor');
    } finally {
      setIsIndexing(false);
    }
  };
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
          <div className="bg-card p-4 sm:p-6 rounded-lg shadow border">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-card-foreground">Datos de Excel</h2>
              <Button
                onClick={handleIndexData}
                disabled={isIndexing || isLoadingData}
                size="sm"
              >
                {isIndexing ? 'Indexando...' : 'Indexar para IA'}
              </Button>
            </div>
            {indexMessage && (
              <div className="mb-4 p-2 bg-muted rounded text-sm">
                {indexMessage}
              </div>
            )}
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
                    {csvData.slice(0, 20).map((row, index) => (
                      <tr key={index} className="border-b">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="p-2 text-sm text-muted-foreground">
                            {value || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {csvData.length > 20 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Mostrando las primeras 20 filas de {csvData.length} registros.
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
        <ChatModal />
      </div>
    </AuthGuard>
  );
}
