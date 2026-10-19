import { useEffect, useState } from 'react';
import { guardarPreferencia, leerPreferencia } from '../utils/preferenciasSesion';

export function usePreferenciaSesion<T extends string | number | null | string[]>(
  clave: string, inicial: T, permitidos?: readonly (string | number | null)[],
) {
  const [valor, setValor] = useState<T>(() => leerPreferencia(clave, inicial, permitidos));
  useEffect(() => { guardarPreferencia(clave, valor); }, [clave, valor]);
  return [valor, setValor] as const;
}
