import type { Clinica, Paciente, Tratamiento } from '../../types';
import { formatCurrency } from '../../lib/currency';
import { formatDate } from '../../lib/date';

export interface BuildPresupuestoHtmlInput {
  paciente: Paciente;
  tratamientosValidos: Tratamiento[];
  total: number;
  clinica: Clinica;
  logoDataUri: string;
  fecha: Date;
}

/**
 * Escapa texto antes de insertarlo en el HTML del PDF.
 * El orden importa: `&` debe reemplazarse primero.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Construye la plantilla HTML del presupuesto.
 * Función pura: no lee archivos, no usa el contexto y no guarda nada.
 */
export function buildPresupuestoHtml({
  paciente,
  tratamientosValidos,
  total,
  clinica,
  logoDataUri,
  fecha,
}: BuildPresupuestoHtmlInput): string {
  const logoHtml = logoDataUri
    ? `<img class="logo" src="${escapeHtml(logoDataUri)}" />`
    : '';

  const filas = tratamientosValidos
    .map(
      (tratamiento) => `
<tr>
  <td>
    <b>${escapeHtml(tratamiento.nombre)}</b>
    <div class="descripcion">
      ${escapeHtml(tratamiento.descripcion)}
    </div>
  </td>
  <td class="precio">
    $${formatCurrency(tratamiento.precio)} MXN
  </td>
</tr>
`
    )
    .join('');

  return `
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>

body {
  font-family: Arial, sans-serif;
  background: #f4f6f9;
  padding: 15px; /* menos espacio */
  color: #111827;
}

/*  HEADER */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #1e3a8a, #38bdf8);
  color: white;
  padding: 18px 22px; /*  más compacto */
  border-radius: 14px;
}

.header-text {
  flex: 1;
  text-align: center;
}

.logo {
  width: 75px;
  height: 75px;
  object-fit: contain;
}

.clinica {
  font-size: 26px;
  font-weight: bold;
}

.doctora {
  font-size: 16px;
  margin-top: 4px;
  opacity: 0.9;
}

/* INFO COMPACTA */
.info {
  margin-top: 15px;
  background: white;
  padding: 12px;
  border-radius: 10px;
}

.info-line {
  font-size: 16px;
}

/* TABLA */
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 15px;
  background: white;
  border-radius: 10px;
  overflow: hidden;
}

.table th {
  background: #1e3a8a;
  color: white;
  padding: 10px;
  text-align: left;
  font-size: 13px;
}

.table th:last-child {
  text-align: right;
}

.table td {
  padding: 10px 12px; /* 🔥 menos altura */
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle; /* 🔥 centra precio */
  word-break: break-word;
}

/*  DESCRIPCIÓN */
.descripcion {
  margin-top: 3px;
  color: #4b5563;
  max-width: 85%;
  line-height: 1.3;
  font-size: 13px;
}

/*  PRECIO PERFECTO */
.precio {
  text-align: right;
  font-weight: bold;
  color: #1d4ed8;
  white-space: nowrap;
  vertical-align: middle;
  font-size: 14px;
}

/*  TOTAL COMPACTO */
.total {
  margin-top: 15px;
  background: linear-gradient(90deg, #2563eb, #38bdf8);
  color: white;
  padding: 14px; /*  reducido */
  border-radius: 12px;
  text-align: right; /* 🔥 estilo más pro */
  font-size: 16px;
  font-weight: bold;
}

</style>
</head>

<body>

<div class="header">
  <div class="header-text">
    <div class="clinica">${escapeHtml(clinica.nombre)}</div>
    <div class="doctora">${escapeHtml(clinica.doctora)}</div>
  </div>
  ${logoHtml}
</div>

<div class="info">
  <div class="info-line">
    <b>Paciente:</b> ${escapeHtml(paciente.nombre)}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    <b>Edad:</b> ${escapeHtml(paciente.edad)}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    <b>Fecha:</b> ${escapeHtml(formatDate(fecha))}
  </div>
</div>

<table class="table">
<tr>
  <th>Tratamiento</th>
  <th>Costo</th>
</tr>
${filas}
</table>

<div class="total">
  TOTAL: $${formatCurrency(total)} MXN
</div>

</body>
</html>
`;
}
