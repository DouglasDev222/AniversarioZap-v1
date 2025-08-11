import puppeteer, { Browser, Page } from 'puppeteer';

export class WhatsAppService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isConnected = false;
  private simulateMode = true; // Modo simulação para desenvolvimento

  async initialize(): Promise<void> {
    if (this.simulateMode) {
      console.log('WhatsApp Service initialized in simulation mode');
      this.isConnected = true;
      return;
    }

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      this.page = await this.browser.newPage();
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      await this.page.goto('https://web.whatsapp.com');
      
      // Wait for QR code or main interface
      await this.page.waitForSelector('[data-testid="qr-code"], [data-testid="search"]', { timeout: 60000 });
      
      // Check if already logged in
      const searchBox = await this.page.$('[data-testid="search"]');
      if (searchBox) {
        this.isConnected = true;
        console.log('WhatsApp Web connected successfully');
      } else {
        console.log('Please scan QR code to connect WhatsApp Web');
        // Wait for login completion
        await this.page.waitForSelector('[data-testid="search"]', { timeout: 300000 });
        this.isConnected = true;
        console.log('WhatsApp Web logged in successfully');
      }
    } catch (error) {
      console.error('Failed to initialize WhatsApp:', error);
      console.log('Falling back to simulation mode');
      this.simulateMode = true;
      this.isConnected = true;
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

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const whatsappService = new WhatsAppService();
