import puppeteer, { Browser, Page } from 'puppeteer';

export class WhatsAppService {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private isConnected = false;

  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
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
      throw error;
    }
  }

  async sendMessage(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.isConnected || !this.page) {
      throw new Error('WhatsApp is not connected');
    }

    try {
      // Format phone number (remove non-digits and add country code if needed)
      const formattedNumber = phoneNumber.replace(/\D/g, '');
      const url = `https://web.whatsapp.com/send?phone=${formattedNumber}&text=${encodeURIComponent(message)}`;
      
      await this.page.goto(url);
      
      // Wait for chat to load
      await this.page.waitForSelector('[data-testid="conversation-compose-box-input"]', { timeout: 30000 });
      
      // Wait a bit for the message to load in the input
      await this.page.waitForTimeout(2000);
      
      // Click send button
      const sendButton = await this.page.$('[data-testid="send"]');
      if (sendButton) {
        await sendButton.click();
        await this.page.waitForTimeout(1000);
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
