/**
 * lib/api.js — Centralized API utility for the Solar EPC Dashboard
 * 
 * Provides a single `apiCall` function that:
 * - Automatically attaches the JWT token from localStorage
 * - Prepends the base API URL from env vars
 * - Handles JSON parsing and error extraction
 * - Throws meaningful error messages for UI consumption
 * 
 * Usage:
 *   import { apiCall } from '@/lib/api';
 *   const data = await apiCall('/crm/leads');
 *   const result = await apiCall('/crm/leads', { method: 'POST', body: JSON.stringify(payload) });
 */

// Base URL pulled from Next.js public env, with sensible fallback
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Makes an authenticated API call to the backend.
 * @param {string} endpoint - API path (e.g., '/crm/leads')
 * @param {object} options - Standard fetch options (method, body, headers, etc.)
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} With server error message or generic failure text
 */
export const apiCall = async (endpoint, options = {}) => {
  try {
    // Retrieve JWT token from local storage for auth header
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('dashboard_token')
      : null;

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    // Handle non-OK responses by extracting server error message
    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // Response body wasn't valid JSON — use status text
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    // Parse and return the JSON body
    return await response.json();
  } catch (error) {
    // Re-throw with clean message (network errors, parse errors, etc.)
    throw new Error(error.message || 'Network error — please check your connection.');
  }
};

/**
 * Convenience GET wrapper
 */
export const apiGet = (endpoint) => apiCall(endpoint);

/**
 * Convenience POST wrapper
 */
export const apiPost = (endpoint, data) =>
  apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });

/**
 * Convenience PUT wrapper
 */
export const apiPut = (endpoint, data) =>
  apiCall(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

/**
 * Convenience DELETE wrapper
 */
export const apiDelete = (endpoint) =>
  apiCall(endpoint, { method: 'DELETE' });
