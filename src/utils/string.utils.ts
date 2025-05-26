/**
 * Utility functions for string operations
 */

/**
 * Obtiene el último carácter de un string
 * @param str El string del cual obtener el último carácter
 * @returns El último carácter del string o una cadena vacía si el string está vacío
 */
export const getLastCharacter = (str: string): string => {
  if (!str || str.length === 0) {
    return '';
  }
  return str[str.length - 1];
};

/**
 * Obtiene el último dígito de un string
 * @param str El string del cual obtener el último dígito
 * @returns El último dígito del string o null si no hay dígitos en el string
 */
export const getLastDigit = (str: string): string | null => {
  if (!str || str.length === 0) {
    return null;
  }
  
  // Buscar dígitos en el string de derecha a izquierda
  for (let i = str.length - 1; i >= 0; i--) {
    if (/\d/.test(str[i])) {
      return str[i];
    }
  }
  
  return null; // No se encontraron dígitos
};

/**
 * Verifica si el último carácter de un string es un dígito
 * @param str El string a verificar
 * @returns true si el último carácter es un dígito, false en caso contrario
 */
export const isLastCharacterDigit = (str: string): boolean => {
  if (!str || str.length === 0) {
    return false;
  }
  return /\d/.test(str[str.length - 1]);
};