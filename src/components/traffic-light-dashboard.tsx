"use client"

import { useMemo } from 'react';
import { CSVRow } from '@/lib/csv-parser';
import { processCSVToDashboardData, calculateTrafficLightStatus, getTrafficLightColor, formatCurrency, formatPercentage } from '@/lib/dashboard-utils';
import { SucursalTrafficLight, DashboardData } from '@/lib/types';

interface TrafficLightDashboardProps {
  csvData: CSVRow[];
}

export function TrafficLightDashboard({ csvData }: TrafficLightDashboardProps) {
  const dashboardData: DashboardData = useMemo(() => {
    return processCSVToDashboardData(csvData);
  }, [csvData]);

  const trafficLightSucursales: SucursalTrafficLight[] = useMemo(() => {
    const promedioGlobal = dashboardData.resumen.ticketPromedio;
    return dashboardData.sucursales.map(sucursal =>
      calculateTrafficLightStatus(sucursal, promedioGlobal)
    );
  }, [dashboardData]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header con métricas globales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-lg border shadow">
          <h3 className="text-sm font-medium text-muted-foreground">Total Créditos</h3>
          <p className="text-2xl font-bold text-card-foreground">
            {dashboardData.resumen.totalCreditos.toLocaleString()}
          </p>
        </div>
        <div className="bg-card p-4 rounded-lg border shadow">
          <h3 className="text-sm font-medium text-muted-foreground">Total Dispersado</h3>
          <p className="text-2xl font-bold text-card-foreground">
            {formatCurrency(dashboardData.resumen.totalDispersado)}
          </p>
        </div>
        <div className="bg-card p-4 rounded-lg border shadow">
          <h3 className="text-sm font-medium text-muted-foreground">Ticket Promedio</h3>
          <p className="text-2xl font-bold text-card-foreground">
            {formatCurrency(dashboardData.resumen.ticketPromedio)}
          </p>
        </div>
        <div className="bg-card p-4 rounded-lg border shadow">
          <h3 className="text-sm font-medium text-muted-foreground">Cumplimiento Global</h3>
          <p className="text-2xl font-bold text-card-foreground">
            {formatPercentage(dashboardData.resumen.cumplimientoGlobal || 0)}
          </p>
        </div>
      </div>

      {/* Grid de semáforos por sucursal */}
      <div className="bg-card p-6 rounded-lg border shadow">
        <h2 className="text-xl font-semibold mb-6 text-center">Semáforo de Sucursales</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {trafficLightSucursales.map((sucursal, index) => (
            <div
              key={sucursal.nombre}
              className="bg-background border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Indicador de semáforo */}
              <div className="flex items-center justify-between mb-3">
                <div className={`w-4 h-4 rounded-full ${getTrafficLightColor(sucursal.status)} shadow-lg`} />
                <span className="text-xs font-medium text-muted-foreground">
                  #{index + 1}
                </span>
              </div>

              {/* Información de la sucursal */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-card-foreground truncate">
                  {sucursal.ciudad}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {sucursal.estado}
                </p>

                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Créditos:</span>
                    <span className="font-medium">{sucursal.totalCreditos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dispersado:</span>
                    <span className="font-medium">{formatCurrency(sucursal.totalDispersado)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ticket:</span>
                    <span className="font-medium">{formatCurrency(sucursal.ticketPromedio)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cumplimiento:</span>
                    <span className="font-medium">{formatPercentage(sucursal.cumplimiento)}</span>
                  </div>
                </div>

                {/* Razón del estado */}
                <div className="mt-3 p-2 bg-muted rounded text-xs">
                  <p className="text-muted-foreground">{sucursal.statusReason}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span>Excelente (≥90% cumplimiento)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span>Bueno (75-89% cumplimiento)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>Requiere atención (menos del 75% cumplimiento)</span>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card p-4 rounded-lg border shadow">
          <h3 className="font-semibold mb-2">Sucursal Líder</h3>
          <p className="text-muted-foreground">{dashboardData.resumen.sucursalTop || 'N/A'}</p>
        </div>
        <div className="bg-card p-4 rounded-lg border shadow">
          <h3 className="font-semibold mb-2">Sucursal con Oportunidad</h3>
          <p className="text-muted-foreground">{dashboardData.resumen.sucursalBaja || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}