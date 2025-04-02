import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const errorJson = await res.json();
        if (errorJson.message) {
          throw new Error(errorJson.message);
        }
      }
      
      const text = await res.text();
      throw new Error(text || res.statusText || `Error ${res.status}`);
    } catch (e) {
      if (e instanceof Error) {
        throw e;
      }
      throw new Error(`${res.status}: ${res.statusText}`);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`Making ${method} request to ${url}`);
  
  // Get the auth token from localStorage
  const token = localStorage.getItem('auth_token');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('Using Bearer token for request');
  } else {
    console.log('No auth token found in localStorage');
  }
  
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    if (!res.ok) {
      console.error(`API request failed: ${res.status} ${res.statusText}`);
      
      try {
        const errorText = await res.text();
        console.error('Error response:', errorText);
      } catch (e) {
        console.error('Could not read error response');
      }
      
      if (res.status === 401) {
        localStorage.removeItem('auth_token');
        console.warn('Unauthorized request - cleared auth token');
      }
    }
    
    return res;
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Executing query for ${queryKey[0]}`);
    
    // Get the auth token from localStorage
    const token = localStorage.getItem('auth_token');
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('Using Bearer token for query');
    } else {
      console.log('No auth token available for query');
    }
    
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers
      });
      
      if (res.status === 401) {
        console.warn('401 Unauthorized response from query');
        localStorage.removeItem('auth_token');
        
        if (unauthorizedBehavior === "returnNull") {
          console.log('Returning null due to 401 (as configured)');
          return null;
        } else {
          throw new Error("Unauthorized: Please login again");
        }
      }
      
      if (!res.ok) {
        const errorMessage = await res.text();
        console.error(`Query error: ${res.status} - ${errorMessage || res.statusText}`);
        throw new Error(errorMessage || `Error ${res.status}: ${res.statusText}`);
      }
      
      return await res.json();
    } catch (error) {
      console.error('Query execution error:', error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});
