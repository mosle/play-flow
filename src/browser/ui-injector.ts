import { Page } from 'playwright';

export interface MessageOptions {
  message: string;
  title?: string;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right' | 'center';
  duration?: number;
  style?: 'info' | 'warning' | 'error' | 'success';
  closeButton?: boolean;
  backdrop?: boolean;
  progress?: boolean;
}

export class UIInjector {
  private static stylesInjected = false;

  static async injectStyles(page: Page): Promise<void> {
    if (this.stylesInjected) return;

    await page.addStyleTag({
      content: `
        @keyframes playflow-slide-in {
          from { 
            transform: translateY(-20px) scale(0.95); 
            opacity: 0; 
          }
          to { 
            transform: translateY(0) scale(1); 
            opacity: 1; 
          }
        }
        
        @keyframes playflow-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes playflow-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .playflow-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          z-index: 999998;
          animation: playflow-fade-in 0.3s ease-out;
        }
        
        .playflow-overlay {
          /* CSS Reset */
          all: initial;
          /* Restore necessary properties */
          position: fixed !important;
          top: 20px !important;
          left: 20px !important;
          z-index: 999999 !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          pointer-events: auto !important;
          animation: playflow-slide-in 0.3s ease-out !important;
          background: transparent !important;
          border: none !important;
          margin: 0 !important;
          padding: 0 !important;
          box-sizing: border-box !important;
        }
        
        .playflow-message {
          /* CSS Reset */
          all: initial;
          /* Restore necessary properties */
          background: rgba(26, 26, 26, 0.95) !important;
          color: white !important;
          padding: 12px 16px !important;
          border-radius: 8px !important;
          max-width: 450px !important;
          margin: 0 !important;
          position: relative !important;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3) !important;
          backdrop-filter: blur(8px) !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          box-sizing: border-box !important;
          display: block !important;
        }
        
        .playflow-message::before {
          content: '🎬 PlayFlow' !important;
          position: absolute !important;
          top: -8px !important;
          left: 0 !important;
          background: #4a9eff !important;
          color: white !important;
          padding: 4px 12px !important;
          border-radius: 16px !important;
          font-size: 12px !important;
          font-weight: bold !important;
          letter-spacing: 0.5px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          margin: 0 !important;
          border: none !important;
          display: block !important;
        }
        
        .playflow-message.playflow-info::before {
          background: #3b82f6;
        }
        
        .playflow-message.playflow-warning::before {
          background: #f59e0b;
        }
        
        .playflow-message.playflow-error::before {
          background: #ef4444;
        }
        
        .playflow-message.playflow-success::before {
          background: #10b981;
        }
        
        .playflow-message h3 {
          all: initial !important;
          margin: 16px 0 8px 0 !important;
          font-size: 16px !important;
          font-weight: 600 !important;
          color: #ffffff !important;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8) !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          display: block !important;
        }
        
        .playflow-message p {
          all: initial !important;
          margin: 16px 0 0 0 !important;
          color: #ffffff !important;
          line-height: 1.5 !important;
          white-space: pre-wrap !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8) !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          display: block !important;
        }
        
        .playflow-close {
          all: initial !important;
          position: absolute !important;
          top: 16px !important;
          right: 0 !important;
          background: rgba(0, 0, 0, 0.6) !important;
          border: none !important;
          font-size: 18px !important;
          cursor: pointer !important;
          color: #ffffff !important;
          padding: 0 !important;
          width: 24px !important;
          height: 24px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 50% !important;
          transition: all 0.2s !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          margin: 0 !important;
          outline: none !important;
        }
        
        .playflow-close:hover {
          background: rgba(0, 0, 0, 0.8) !important;
          transform: scale(1.1) !important;
        }
        
        .playflow-progress {
          margin-top: 15px;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
        }
        
        .playflow-progress-bar {
          height: 100%;
          background: #3b82f6;
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        
        /* Position styles - all positions now fixed to top-left */
        .playflow-top-left,
        .playflow-top-center,
        .playflow-top-right,
        .playflow-bottom-left,
        .playflow-bottom-center,
        .playflow-bottom-right,
        .playflow-center {
          /* Position is already set in .playflow-overlay */
        }
      `
    });

    this.stylesInjected = true;
  }

  static async showMessage(page: Page, options: MessageOptions): Promise<void> {
    await this.injectStyles(page);

    await page.evaluate((opts) => {
      // Remove existing overlays
      document.querySelectorAll('.playflow-overlay, .playflow-backdrop').forEach((el: Element) => el.remove());

      // Note: backdrop is disabled for showMessage to avoid interfering with page content

      // Create message overlay
      const overlay = document.createElement('div');
      overlay.className = 'playflow-overlay';
      
      const messageDiv = document.createElement('div');
      messageDiv.className = `playflow-message playflow-${opts.style || 'info'}`;
      
      let html = '';
      if (opts.closeButton !== false) {
        html += '<button class="playflow-close">×</button>';
      }
      if (opts.title) {
        html += `<h3>${opts.title}</h3>`;
      }
      html += `<p>${opts.message}</p>`;
      if (opts.progress) {
        html += '<div class="playflow-progress"><div class="playflow-progress-bar"></div></div>';
      }
      
      messageDiv.innerHTML = html;
      overlay.appendChild(messageDiv);
      document.body.appendChild(overlay);

      // Close button handler
      const closeBtn = overlay.querySelector('.playflow-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          overlay.remove();
          document.querySelector('.playflow-backdrop')?.remove();
        });
      }

      // Auto-remove after duration
      if (opts.duration && opts.duration > 0) {
        setTimeout(() => {
          overlay.remove();
          document.querySelector('.playflow-backdrop')?.remove();
        }, opts.duration);
      }
    }, options);
  }

  static async removeOverlay(page: Page): Promise<void> {
    await page.evaluate(() => {
      document.querySelectorAll('.playflow-overlay, .playflow-backdrop').forEach((el: Element) => el.remove());
    });
  }

  static async showOverlay(page: Page, options: MessageOptions): Promise<void> {
    await this.showMessage(page, {
      ...options,
      backdrop: options.backdrop !== false,
      closeButton: false,
      duration: 0 // Don't auto-close
    });
  }

  static async updateProgress(page: Page, percent: number): Promise<void> {
    await page.evaluate((pct) => {
      const progressBar = document.querySelector('.playflow-progress-bar') as HTMLElement;
      if (progressBar) {
        progressBar.style.width = `${pct}%`;
      }
    }, percent);
  }
}