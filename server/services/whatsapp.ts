import puppeteer, { Browser, Page } from 'puppeteer';

export class WhatsAppService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isConnected = false;
  private simulateMode = true; // Habilitado por padrão no ambiente Replit
  private qrCode: string | null = null;
  private connectionStatus: 'disconnected' | 'waiting_qr' | 'connecting' | 'connected' = 'disconnected';

  async initialize(): Promise<void> {
    if (this.simulateMode) {
      console.log('✅ WhatsApp Service initialized in simulation mode (recommended for Replit)');
      this.isConnected = true;
      this.connectionStatus = 'connected';
      return;
    }

    this.connectionStatus = 'connecting';
    console.log('Iniciando conexão com WhatsApp Web...');

    try {
      // Use the bundled Chromium from Puppeteer but with additional flags for Replit environment
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-blink-features=AutomationControlled',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-gpu',
          '--disable-software-rasterizer',
          '--single-process', // Important for limited memory environments
          '--no-zygote'       // Important for containerized environments
        ]
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1200, height: 800 });
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      console.log('Navegando para WhatsApp Web...');
      await this.page.goto('https://web.whatsapp.com', { waitUntil: 'networkidle2' });
      
      // Wait for QR code or main interface
      console.log('Aguardando QR code ou interface principal...');
      await this.page.waitForSelector('[data-testid="qr-code"], [data-testid="search"], [data-testid="intro-md-beta-logo-dark"], [data-testid="intro-md-beta-logo-light"]', { timeout: 30000 });
      
      // Check if already logged in
      const searchBox = await this.page.$('[data-testid="search"]');
      if (searchBox) {
        this.isConnected = true;
        this.connectionStatus = 'connected';
        console.log('WhatsApp Web já está conectado!');
        return;
      }

      // Look for QR code
      this.connectionStatus = 'waiting_qr';
      console.log('Aguardando scan do QR code...');
      
      // Try to capture QR code
      await this.captureQRCode();
      
      // Wait for login completion
      await this.page.waitForSelector('[data-testid="search"]', { timeout: 120000 });
      this.isConnected = true;
      this.connectionStatus = 'connected';
      this.qrCode = null;
      console.log('WhatsApp Web conectado com sucesso!');
      
    } catch (error) {
      console.error('Falha ao inicializar WhatsApp:', error);
      console.log('ATENÇÃO: Para usar o WhatsApp real, você precisa:');
      console.log('1. Rodar o projeto em um ambiente local (não no Replit)');
      console.log('2. Instalar dependências do sistema: apt-get install -y libgbm1 libnss3 libxss1 libgtk-3-0 libasound2');
      console.log('3. Ou usar Docker com uma imagem que suporte Puppeteer');
      console.log('Retornando ao modo simulação devido a limitações do ambiente Replit');
      this.connectionStatus = 'disconnected';
      this.simulateMode = true;
      this.isConnected = true;
      this.connectionStatus = 'connected';
    }
  }

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('WhatsApp is not connected');
    }

    if (this.simulateMode) {
      console.log(`📱 Simulando envio de mensagem para ${phoneNumber}:`);
      console.log(`💬 ${message}`);
      console.log('✅ Mensagem "enviada" com sucesso (modo simulação)');
      return true;
    }

    if (!this.page) {
      throw new Error('WhatsApp page is not initialized');
    }

    try {
      // Format phone number (remove non-digits and add country code if needed)
      const formattedNumber = phoneNumber.replace(/\D/g, '');
      const url = `https://web.whatsapp.com/send?phone=${formattedNumber}&text=${encodeURIComponent(message)}`;
      
      await this.page.goto(url);
      
      // Wait for chat to load
      await this.page.waitForSelector('[data-testid="conversation-compose-box-input"]', { timeout: 30000 });
      
      // Wait a bit for the message to load in the input
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click send button
      const sendButton = await this.page.$('[data-testid="send"]');
      if (sendButton) {
        await sendButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
        return true;
      } else {
        throw new Error('Send button not found');
      }
    } catch (error) {
      console.error(`Failed to send message to ${phoneNumber}:`, error);
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    if (this.simulateMode) {
      console.log('🔍 Testando conexão WhatsApp (modo simulação)');
      return this.isConnected;
    }

    if (!this.page) return false;
    
    try {
      await this.page.reload();
      await this.page.waitForSelector('[data-testid="search"]', { timeout: 10000 });
      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isConnected = false;
    }
  }

  async captureQRCode(): Promise<void> {
    if (!this.page) return;

    try {
      // Wait for QR code to appear
      await this.page.waitForSelector('[data-testid="qr-code"]', { timeout: 10000 });
      
      // Get QR code element
      const qrElement = await this.page.$('[data-testid="qr-code"] canvas');
      if (qrElement) {
        // Take screenshot of QR code
        const qrBuffer = await qrElement.screenshot({ encoding: 'base64' });
        this.qrCode = `data:image/png;base64,${qrBuffer}`;
        console.log('QR Code capturado com sucesso');
      }
    } catch (error) {
      console.log('Não foi possível capturar o QR code:', error);
    }
  }

  getConnectionStatus(): { 
    isConnected: boolean; 
    status: string; 
    qrCode: string | null; 
    simulateMode: boolean;
  } {
    return {
      isConnected: this.isConnected,
      status: this.connectionStatus,
      qrCode: this.qrCode,
      simulateMode: this.simulateMode
    };
  }

  async refreshQRCode(): Promise<string | null> {
    if (!this.page || this.connectionStatus !== 'waiting_qr') return null;
    
    try {
      await this.captureQRCode();
      return this.qrCode;
    } catch (error) {
      console.error('Erro ao atualizar QR code:', error);
      return null;
    }
  }

  async enableSimulationMode(): Promise<void> {
    this.simulateMode = true;
    this.isConnected = true;
    this.connectionStatus = 'connected';
    this.qrCode = null;
    
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    
    console.log('Modo simulação ativado');
  }

  async enableRealMode(): Promise<void> {
    console.log('Desabilitando modo simulação - iniciando conexão real com WhatsApp Web');
    
    // Close any existing browser connection
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    
    this.simulateMode = false;
    this.isConnected = false;
    this.connectionStatus = 'disconnected';
    this.qrCode = null;
    
    console.log('Modo real ativado - use o endpoint /api/whatsapp/connect para conectar');
  }
}

export const whatsappService = new WhatsAppService();
