// Local file service for reading Windows files directly
// This service handles loading local configuration, leads, and templates
// while keeping email sending remote

interface LocalConfig {
  SMTP?: {
    host: string;
    port: string;
    user: string;
    pass: string;
    fromEmail: string;
    fromName: string;
  };
  EMAILPERSECOND?: number;
  SLEEP?: number;
  QRCODE?: boolean;
  [key: string]: any;
}

class LocalFileService {
  private configCache: LocalConfig | null = null;
  private leadsCache: string | null = null;

  // Read local config files
  async loadLocalConfig(): Promise<LocalConfig> {
    if (this.configCache) {
      return this.configCache;
    }

    try {
      // Try to read setup.ini first, then smtp.ini
      const config: LocalConfig = {};
      
      // Read SMTP configuration from local smtp.ini
      try {
        const smtpResponse = await fetch('/config/smtp.ini');
        if (smtpResponse.ok) {
          const smtpText = await smtpResponse.text();
          const smtpConfig = this.parseIniFile(smtpText);
          if (smtpConfig.SMTP) {
            config.SMTP = smtpConfig.SMTP;
          }
        }
      } catch (error) {
        console.warn('Could not load local smtp.ini:', error);
      }

      // Read setup configuration from local setup.ini
      try {
        const setupResponse = await fetch('/config/setup.ini');
        if (setupResponse.ok) {
          const setupText = await setupResponse.text();
          const setupConfig = this.parseIniFile(setupText);
          Object.assign(config, setupConfig);
        }
      } catch (error) {
        console.warn('Could not load local setup.ini:', error);
      }

      this.configCache = config;
      return config;
    } catch (error) {
      console.error('Failed to load local config:', error);
      return {};
    }
  }

  // Read local leads.txt file
  async loadLocalLeads(): Promise<string> {
    if (this.leadsCache) {
      return this.leadsCache;
    }

    try {
      const response = await fetch('/files/leads.txt');
      if (response.ok) {
        const leadsText = await response.text();
        this.leadsCache = leadsText;
        return leadsText;
      }
    } catch (error) {
      console.warn('Could not load local leads.txt:', error);
    }
    
    return '';
  }

  // Read local template files
  async readLocalFile(filepath: string): Promise<string> {
    try {
      const response = await fetch(`/${filepath}`);
      if (response.ok) {
        return await response.text();
      }
    } catch (error) {
      console.warn(`Could not load local file ${filepath}:`, error);
    }
    return '';
  }

  // List local template files
  async listLocalFiles(): Promise<string[]> {
    // Since we can't list directory contents from browser,
    // we'll return a common set of template files
    // Users will need to manually check which files exist
    const commonTemplates = [
      'template.html',
      'letter.html',
      'sample-template.html',
      'newsletter.html',
      'promotion.html'
    ];

    const existingFiles: string[] = [];
    
    for (const file of commonTemplates) {
      try {
        const response = await fetch(`/files/${file}`);
        if (response.ok) {
          existingFiles.push(file);
        }
      } catch (error) {
        // File doesn't exist, skip it
      }
    }

    return existingFiles;
  }

  // Parse INI file format
  private parseIniFile(content: string): any {
    const result: any = {};
    let currentSection = '';

    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith(';')) {
        continue;
      }

      // Section headers
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        currentSection = trimmed.slice(1, -1);
        if (!result[currentSection]) {
          result[currentSection] = {};
        }
        continue;
      }

      // Key-value pairs
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex > 0) {
        const key = trimmed.slice(0, equalIndex).trim();
        const value = trimmed.slice(equalIndex + 1).trim();
        
        if (currentSection) {
          result[currentSection][key] = this.parseValue(value);
        } else {
          result[key] = this.parseValue(value);
        }
      }
    }

    return result;
  }

  private parseValue(value: string): any {
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Parse numbers
    if (/^\d+$/.test(value)) {
      return parseInt(value, 10);
    }

    // Parse booleans
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    return value;
  }

  // Clear caches to force reload
  clearCache(): void {
    this.configCache = null;
    this.leadsCache = null;
  }
}

export const localFileService = new LocalFileService();