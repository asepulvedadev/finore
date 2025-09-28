import { CSVRow } from './csv-parser';
import { SucursalResumen, SucursalTrafficLight, TrafficLightStatus, DashboardResumen, DashboardData } from './types';

export function processCSVToDashboardData(csvData: CSVRow[]): DashboardData {
  // Procesar sucursales
  const sucursalesMap = new Map<string, {
    nombre: string;
    estado: string;
    ciudad: string;
    creditos: any[];
    totalDispersado: number;
  }>();

  // Procesar cada fila del CSV
  csvData.forEach((row, index) => {
    const sucursalKey = `${row.estado || 'Sin Estado'}-${row.ciud_suc || 'Sin Ciudad'}`;
    const montoDispersion = parseFloat(row.MontoDispersion || '0') || 0;

    if (!sucursalesMap.has(sucursalKey)) {
      sucursalesMap.set(sucursalKey, {
        nombre: sucursalKey,
        estado: row.estado || 'Sin Estado',
        ciudad: row.ciud_suc || 'Sin Ciudad',
        creditos: [],
        totalDispersado: 0,
      });
    }

    const sucursal = sucursalesMap.get(sucursalKey)!;
    sucursal.creditos.push({
      id: index,
      montoDispersion,
      promotor: row.Opero || 'Sin Promotor',
      fecha: row.fch_Credito || new Date().toISOString(),
    });
    sucursal.totalDispersado += montoDispersion;
  });

  // Convertir a SucursalResumen con cálculos
  const sucursales: SucursalResumen[] = Array.from(sucursalesMap.values()).map(sucursal => ({
    nombre: sucursal.nombre,
    estado: sucursal.estado,
    ciudad: sucursal.ciudad,
    totalCreditos: sucursal.creditos.length,
    totalDispersado: sucursal.totalDispersado,
    cumplimiento: Math.random() * 100, // Placeholder - calcular basado en metas
    ticketPromedio: sucursal.creditos.length > 0 ? sucursal.totalDispersado / sucursal.creditos.length : 0,
  }));

  // Calcular resumen global
  const totalCreditos = sucursales.reduce((sum, s) => sum + s.totalCreditos, 0);
  const totalDispersado = sucursales.reduce((sum, s) => sum + s.totalDispersado, 0);
  const ticketPromedio = totalCreditos > 0 ? totalDispersado / totalCreditos : 0;

  const resumen: DashboardResumen = {
    totalCreditos,
    totalDispersado,
    ticketPromedio,
    cumplimientoGlobal: 85, // Placeholder
    sucursalTop: sucursales.sort((a, b) => b.totalDispersado - a.totalDispersado)[0]?.nombre,
    sucursalBaja: sucursales.sort((a, b) => a.totalDispersado - b.totalDispersado)[0]?.nombre,
    tasas: {
      restructura: 15, // Placeholder
      compraDeuda: 8,  // Placeholder
    },
  };

  return {
    resumen,
    sucursales,
  };
}

export function calculateTrafficLightStatus(sucursal: SucursalResumen, promedioGlobal: number): SucursalTrafficLight {
  let status: TrafficLightStatus;
  let statusReason: string;

  const cumplimiento = sucursal.cumplimiento || 0;
  const ticketRelativo = sucursal.ticketPromedio / promedioGlobal;

  if (cumplimiento >= 90 && ticketRelativo >= 1.1) {
    status = 'green';
    statusReason = 'Excelente desempeño: alto cumplimiento y ticket superior al promedio';
  } else if (cumplimiento >= 75 && ticketRelativo >= 0.9) {
    status = 'yellow';
    statusReason = 'Buen desempeño: cumplimiento aceptable y ticket en rango normal';
  } else {
    status = 'red';
    statusReason = 'Requiere atención: bajo cumplimiento o ticket por debajo del promedio';
  }

  return {
    ...sucursal,
    status,
    statusReason,
  };
}

export function getTrafficLightColor(status: TrafficLightStatus): string {
  switch (status) {
    case 'green':
      return 'bg-green-500';
    case 'yellow':
      return 'bg-yellow-500';
    case 'red':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}