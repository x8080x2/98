import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// List of endpoints that should use remote server (Replit)
const REMOTE_ENDPOINTS = [
  '/api/emails/send',
  '/api/emails/status',
  '/api/original/sendMail'
];

// List of endpoints that should read local files directly
const LOCAL_FILE_ENDPOINTS = [
  '/api/config/load',
  '/api/config/loadLeads', 
  '/api/original/readFile',
  '/api/original/listFiles',
  '/api/original/listLogoFiles'
];

// Get the base URL for API requests
const getBaseUrl = (url: string) => {
  const remoteUrl = import.meta.env.VITE_REMOTE_SERVER_URL;
  const useLocalFiles = import.meta.env.VITE_LOCAL_FILES === 'true';
  
  // Check if this is a local file endpoint and local files are enabled
  if (useLocalFiles && LOCAL_FILE_ENDPOINTS.some(endpoint => url.startsWith(endpoint))) {
    return ''; // Use current origin for local files
  }
  
  // All other endpoints (including remote email sending) use remote server
  if (!remoteUrl) {
    console.warn('⚠️  VITE_REMOTE_SERVER_URL not set - falling back to localhost.');
  }
  // Normalize trailing slashes
  const baseUrl = remoteUrl || 'http://localhost:5000';
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

// Handle local file requests by reading files directly from Windows filesystem
async function handleLocalFileRequest(method: string, url: string, data?: unknown): Promise<Response> {
  try {
    if (url === '/api/config/load') {
      // Load local config files - match server response format
      const config = await loadLocalConfig();
      return new Response(JSON.stringify({ success: true, config: { SMTP: config.SMTP || {}, ...config } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url === '/api/config/loadLeads') {
      // Load local leads.txt
      const leads = await loadLocalLeads();
      return new Response(JSON.stringify({ success: true, leads }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.startsWith('/api/original/readFile')) {
      // Read local template file - support both GET with query param and POST with body
      let filepath = '';
      
      if (method === 'GET') {
        // Extract filepath from query parameter
        const urlObj = new URL(url, 'http://localhost');
        filepath = urlObj.searchParams.get('filepath') || '';
      } else if (data && typeof data === 'object' && 'filepath' in data) {
        // Extract filepath from POST body
        filepath = (data as any).filepath;
      }
      
      if (filepath) {
        const content = await readLocalFile(filepath);
        return new Response(JSON.stringify({ success: true, content }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        return new Response(JSON.stringify({ success: false, error: 'No filepath provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (url === '/api/original/listFiles') {
      // List local template files
      const files = await listLocalFiles();
      return new Response(JSON.stringify({ files }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url === '/api/original/listLogoFiles') {
      // List local logo files
      const logoFiles = await listLocalLogoFiles();
      return new Response(JSON.stringify({ files: logoFiles }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Default fallback
    return new Response(JSON.stringify({ success: false, error: 'Local endpoint not implemented' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: 'Failed to read local file' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Local file reading functions
async function loadLocalConfig(): Promise<any> {
  const config: any = {};
  
  try {
    // Try to read smtp.ini
    const smtpResponse = await fetch('/config/smtp.ini');
    if (smtpResponse.ok) {
      const smtpText = await smtpResponse.text();
      const smtpConfig = parseIniFile(smtpText);
      if (smtpConfig.SMTP) {
        config.SMTP = smtpConfig.SMTP;
      }
    }
  } catch (error) {
    console.warn('Could not load local smtp.ini');
  }
  
  try {
    // Try to read setup.ini
    const setupResponse = await fetch('/config/setup.ini');
    if (setupResponse.ok) {
      const setupText = await setupResponse.text();
      const setupConfig = parseIniFile(setupText);
      Object.assign(config, setupConfig);
    }
  } catch (error) {
    console.warn('Could not load local setup.ini');
  }
  
  return config;
}

async function loadLocalLeads(): Promise<string> {
  try {
    const response = await fetch('/files/leads.txt');
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.warn('Could not load local leads.txt');
  }
  return '';
}

async function readLocalFile(filepath: string): Promise<string> {
  try {
    const response = await fetch(`/${filepath}`);
    if (response.ok) {
      return await response.text();
    }
  } catch (error) {
    console.warn(`Could not load local file ${filepath}`);
  }
  return '';
}

async function listLocalFiles(): Promise<string[]> {
  // Common template files to check
  const commonFiles = ['template.html', 'letter.html', 'sample-template.html', 'newsletter.html'];
  const existingFiles: string[] = [];
  
  for (const file of commonFiles) {
    try {
      const response = await fetch(`/files/${file}`);
      if (response.ok) {
        existingFiles.push(file);
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  }
  
  return existingFiles;
}

async function listLocalLogoFiles(): Promise<string[]> {
  // Common logo files to check
  const commonLogos = ['logo.png', 'logo.jpg', 'logo.gif', 'L1.png'];
  const existingFiles: string[] = [];
  
  for (const file of commonLogos) {
    try {
      const response = await fetch(`/files/logo/${file}`);
      if (response.ok) {
        existingFiles.push(file);
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  }
  
  return existingFiles;
}

function parseIniFile(content: string): any {
  const result: any = {};
  let currentSection = '';
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) continue;
    
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      currentSection = trimmed.slice(1, -1);
      if (!result[currentSection]) result[currentSection] = {};
      continue;
    }
    
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmed.slice(0, equalIndex).trim();
      let value: any = trimmed.slice(equalIndex + 1).trim();
      
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      // Parse numbers and booleans
      if (/^\d+$/.test(value)) value = parseInt(value, 10);
      else if (value.toLowerCase() === 'true') value = true;
      else if (value.toLowerCase() === 'false') value = false;
      
      if (currentSection) {
        result[currentSection][key] = value;
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const useLocalFiles = import.meta.env.VITE_LOCAL_FILES === 'true';
  
  // Handle local file endpoints with special logic
  if (useLocalFiles && LOCAL_FILE_ENDPOINTS.some(endpoint => url.startsWith(endpoint))) {
    return handleLocalFileRequest(method, url, data);
  }
  
  // Ensure URL is absolute by prepending base URL if needed
  const fullUrl = url.startsWith('http') ? url : `${getBaseUrl(url)}${url}`;
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const useLocalFiles = import.meta.env.VITE_LOCAL_FILES === 'true';
    
    // Handle local file endpoints with special logic
    if (useLocalFiles && LOCAL_FILE_ENDPOINTS.some(endpoint => url.startsWith(endpoint))) {
      const response = await handleLocalFileRequest('GET', url);
      if (unauthorizedBehavior === "returnNull" && response.status === 401) {
        return null;
      }
      await throwIfResNotOk(response);
      return await response.json();
    }
    
    // Ensure URL is absolute by prepending base URL if needed
    const fullUrl = url.startsWith('http') ? url : `${getBaseUrl(url)}${url}`;
    
    const res = await fetch(fullUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
