"use client"

import Image from "next/image";
import { useEffect, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { UserMenu } from "@/components/user-menu";
import { AuthGuard } from "@/components/auth-guard";
import { ChatModal } from "@/components/chat-modal";
import { TrafficLightDashboard } from "@/components/traffic-light-dashboard";
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
          {isLoadingData ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Cargando dashboard...</p>
              </div>
            </div>
          ) : csvData.length > 0 ? (
            <TrafficLightDashboard csvData={csvData} />
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">No se pudieron cargar los datos</p>
                <Button onClick={() => window.location.reload()}>
                  Reintentar
                </Button>
              </div>
            </div>
          )}
        </main>
        <ChatModal />
      </div>
    </AuthGuard>
  );
}
