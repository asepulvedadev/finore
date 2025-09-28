# Contexto de Typado - Proyecto Finore Dashboard

Este documento describe el contexto de typado que manejaremos para el proyecto Finore Dashboard, un dashboard de información financiera para una empresa financiera.

## Tipos de Datos Principales

### Credito
Representa un crédito individual.

```typescript
type Credito = {
  idCuenta: number;
  idCredito: number;
  idSolicitud: number;

  fechas: {
    credito: Date;            // fch_Credito
    dispersion: Date;         // fch_Dispersion
    liberado?: Date | null;   // fch_Liberado
    primerPago?: Date | null; // fch_1er_pago
  };

  montos: {
    erogacion: number;        // erogacion
    articulos: number;        // articulos
    enganche: number;
    apertura: number;
    dispersion: number;       // MontoDispersion
    restructura: number;
    compraDeuda: number;
    comisionPromotor: number;
  };

  sucursal: {
    idEstado: number;         // IdEstadoSuc
    estado: string;           // EstadoSuc
    ciudad: string;           // ciud_suc
  };

  disposiciones: number;      // NODisposiciones
  promotor: string;           // Opero

  metaCumplimiento?: number;  // meta asignada (si se define)
  cumplimiento?: number;      // calculado (%)

  createdAt?: Date;
  updatedAt?: Date;
};
```

### DashboardResumen
Resumen de indicadores para el dashboard.

```typescript
type DashboardResumen = {
  totalCreditos: number;
  totalDispersado: number;
  ticketPromedio: number;
  cumplimientoGlobal?: number;

  sucursalTop?: string;       // mejor sucursal
  sucursalBaja?: string;      // peor sucursal

  tasas: {
    restructura: number;      // % de créditos con restructura
    compraDeuda: number;      // % de créditos con compra de deuda
  };
};
```

### SucursalResumen
Estructura de sucursal agregada.

```typescript
type SucursalResumen = {
  nombre: string;
  estado: string;
  ciudad: string;
  totalCreditos: number;
  totalDispersado: number;
  cumplimiento: number;       // %
  ticketPromedio: number;
};
```

### DashboardData
Estructura general que consume el dashboard.

```typescript
type DashboardData = {
  resumen: DashboardResumen;
  sucursales: SucursalResumen[];
  creditos?: Credito[]; // opcional si necesitas granularidad
};
```

## Funcionalidades Posibles con este Modelo

- Mostrar semáforo por sucursal.
- Hacer tablas dinámicas de créditos.
- Graficar dispersión histórica.
- Evaluar desempeño de promotores o sucursales.

## Notas de Implementación

- Todos los tipos están definidos con tipado fuerte para asegurar consistencia en el código.
- Las fechas se manejan como objetos Date de JavaScript.
- Los montos son números para facilitar cálculos.
- Los campos opcionales están marcados con `?` para flexibilidad en la API.
- Se incluyen campos de auditoría (createdAt, updatedAt) para seguimiento de cambios.