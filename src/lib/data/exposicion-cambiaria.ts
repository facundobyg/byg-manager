export type SensibRow = {
  delta: number;
  tcNuevo: number;
  impactoUSD: number;
  aperturaEquiv: number;
};

export type ExposicionCambiaria = {
  activoUSDDirecto: number;
  activoARS: number;
  activoARSEnUSD: number;
  pasivoUSD: number;
  pasivoARS: number;
  pasivoARSEnUSD: number;
  aperturaUSD: number;
  aperturaARS: number;
  aperturaUSDTotalEquivalente: number;
  tcBlue: number;
  sensibilidad: SensibRow[];
};

type Inputs = {
  cajaUSD: number;
  cajaARS: number;
  carteraUSDDirecto: number;
  carteraARSDirecto: number;
  activoCCUSD: number;
  activoCCARS: number;
  pasivoCCUSD: number;
  pasivoCCARS: number;
  pasivoPFUSD: number;
  pasivoPFARS: number;
  tcBlue: number;
};

const DELTAS = [100, 500, 1000] as const;

/**
 * Calcula la exposición cambiaria de BYG (posición propia).
 * NO incluye custodia de clientes ni comitentes de inversión.
 * Activos = caja + cartera propia + CC activo (clientes deben a BYG).
 * Pasivos = CC positivas clientes + PF activos.
 * Sensibilidad = impacto en apertura total ante subida del TC.
 */
export function calcExposicionCambiaria(inputs: Inputs): ExposicionCambiaria {
  const tc = inputs.tcBlue > 0 ? inputs.tcBlue : 1;

  const activoUSDDirecto =
    inputs.cajaUSD + inputs.carteraUSDDirecto + inputs.activoCCUSD;
  const activoARS =
    inputs.cajaARS + inputs.carteraARSDirecto + inputs.activoCCARS;
  const activoARSEnUSD = activoARS / tc;

  const pasivoUSD = inputs.pasivoCCUSD + inputs.pasivoPFUSD;
  const pasivoARS = inputs.pasivoCCARS + inputs.pasivoPFARS;
  const pasivoARSEnUSD = pasivoARS / tc;

  const aperturaUSD = activoUSDDirecto - pasivoUSD;
  const aperturaARS = activoARS - pasivoARS;
  const aperturaUSDTotalEquivalente =
    activoUSDDirecto + activoARSEnUSD - pasivoUSD - pasivoARSEnUSD;

  const sensibilidad: SensibRow[] = DELTAS.map((delta) => {
    const tcNuevo = tc + delta;
    // Impacto: la parte ARS de la apertura neta vale menos en USD cuando sube el TC
    const impactoUSD = aperturaARS / tcNuevo - aperturaARS / tc;
    const aperturaEquiv = aperturaUSD + aperturaARS / tcNuevo;
    return { delta, tcNuevo, impactoUSD, aperturaEquiv };
  });

  return {
    activoUSDDirecto,
    activoARS,
    activoARSEnUSD,
    pasivoUSD,
    pasivoARS,
    pasivoARSEnUSD,
    aperturaUSD,
    aperturaARS,
    aperturaUSDTotalEquivalente,
    tcBlue: inputs.tcBlue,
    sensibilidad,
  };
}
