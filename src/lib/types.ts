// Tipos basados en contexto-de-typado.md

export type Credito = {
  idCuenta: number;
  idCredito: number;
  idSolicitud: number;

  fechas: {
    credito: Date;
    dispersion: Date;
    liberado?: Date | null;
    primerPago?: Date | null;
  };

  montos: {
    erogacion: number;
    articulos: number;
    enganche: number;
    apertura: number;
    dispersion: number;
    restructura: number;
    compraDeuda: number;
    comisionPromotor: number;
  };

  sucursal: {
    idEstado: number;
    estado: string;
    ciudad: string;
  };

  disposiciones: number;
  promotor: string;

  metaCumplimiento?: number;
  cumplimiento?: number;

  createdAt?: Date;
  updatedAt?: Date;
};

export type DashboardResumen = {
  totalCreditos: number;
  totalDispersado: number;
  ticketPromedio: number;
  cumplimientoGlobal?: number;

  sucursalTop?: string;
  sucursalBaja?: string;

  tasas: {
    restructura: number;
    compraDeuda: number;
  };
};

export type SucursalResumen = {
  nombre: string;
  estado: string;
  ciudad: string;
  totalCreditos: number;
  totalDispersado: number;
  cumplimiento: number;
  ticketPromedio: number;
};

export type DashboardData = {
  resumen: DashboardResumen;
  sucursales: SucursalResumen[];
  creditos?: Credito[];
};

// Tipos adicionales para el dashboard de semáforo
export type TrafficLightStatus = 'green' | 'yellow' | 'red';

export type SucursalTrafficLight = SucursalResumen & {
  status: TrafficLightStatus;
  statusReason: string;
};