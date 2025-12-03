/**
 * Helper per gestire la chiave API Gemini salvata in localStorage
 * La chiave viene salvata solo nel browser dell'utente e non viene mai inviata al server
 * se non per le chiamate API dirette a Gemini
 */

const STORAGE_KEY = 'gemini_api_key';

/**
 * Recupera la chiave API salvata in localStorage
 * @returns La chiave API o null se non presente
 */
export function getApiKey(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error reading API key from localStorage:', error);
    return null;
  }
}

/**
 * Salva la chiave API in localStorage
 * @param key La chiave API da salvare
 * @returns true se salvata con successo, false altrimenti
 */
export function setApiKey(key: string): boolean {
  try {
    if (!key || key.trim().length === 0) {
      return false;
    }
    localStorage.setItem(STORAGE_KEY, key.trim());
    return true;
  } catch (error) {
    console.error('Error saving API key to localStorage:', error);
    return false;
  }
}

/**
 * Rimuove la chiave API da localStorage
 */
export function clearApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing API key from localStorage:', error);
  }
}

/**
 * Verifica se esiste una chiave API salvata
 * @returns true se esiste una chiave salvata, false altrimenti
 */
export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

