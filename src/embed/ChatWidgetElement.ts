import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { ChatWidget } from '../components/ChatWidget';
import type { ChatWidgetProps } from '../types';

/**
 * BrainbaseChat - Web Component wrapper for the ChatWidget React component.
 * 
 * Usage:
 * <brainbase-chat embed-id="your-embed-id"></brainbase-chat>
 * <script src="https://unpkg.com/@brainbase-labs/chat-widget/embed" async></script>
 * 
 * Attributes:
 * - embed-id (required): The embed ID from your Brainbase deployment
 * - position: 'bottom-right' | 'bottom-left' | 'inline' (default: 'bottom-right')
 * - primary-color: Hex color for theming (e.g., '#4F46E5')
 * - agent-name: Display name for the agent
 * - welcome-message: Custom welcome message
 * - api-base-url: Override the API base URL
 * - default-open: Whether widget starts open ('true' or 'false')
 */
class ChatWidgetElement extends HTMLElement {
  private root: Root | null = null;
  private container: HTMLDivElement | null = null;
  private styleElement: HTMLStyleElement | null = null;

  static get observedAttributes(): string[] {
    return [
      'embed-id',
      'position',
      'primary-color',
      'agent-name',
      'welcome-message',
      'api-base-url',
      'default-open',
    ];
  }

  connectedCallback(): void {
    // Create shadow DOM for style isolation
    const shadow = this.attachShadow({ mode: 'open' });

    // Create container for React
    this.container = document.createElement('div');
    this.container.style.all = 'initial';
    this.container.style.fontFamily = 'inherit';
    shadow.appendChild(this.container);

    // Inject styles - these will be bundled inline during the IIFE build
    this.styleElement = document.createElement('style');
    this.styleElement.textContent = this.getStyles();
    shadow.appendChild(this.styleElement);

    // Mount React component
    this.root = createRoot(this.container);
    this.render();
  }

  disconnectedCallback(): void {
    // Cleanup React root
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null
  ): void {
    // Re-render when attributes change
    if (oldValue !== newValue && this.root) {
      this.render();
    }
  }

  private render(): void {
    if (!this.root) return;

    const props = this.getProps();
    
    if (!props.embedId) {
      console.warn('brainbase-chat: embed-id attribute is required');
      return;
    }

    this.root.render(
      React.createElement(ChatWidget, props)
    );
  }

  private getProps(): ChatWidgetProps {
    return {
      embedId: this.getAttribute('embed-id') || '',
      position: this.getPositionAttribute(),
      primaryColor: this.getAttribute('primary-color') || undefined,
      agentName: this.getAttribute('agent-name') || undefined,
      welcomeMessage: this.getAttribute('welcome-message') || undefined,
      apiBaseUrl: this.getAttribute('api-base-url') || undefined,
      defaultOpen: this.getAttribute('default-open') === 'true',
    };
  }

  private getPositionAttribute(): 'bottom-right' | 'bottom-left' | 'inline' {
    const position = this.getAttribute('position');
    if (position === 'bottom-left' || position === 'inline') {
      return position;
    }
    return 'bottom-right';
  }

  private getStyles(): string {
    // This will be replaced with actual CSS during the build process
    // The vite-plugin-css-injected-by-js or a custom plugin will inject styles
    // For now, we return a placeholder that includes CSS variable definitions
    return `
      :host {
        /* Inherit nothing from parent - full isolation */
        all: initial;
        display: block;
        font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }

      /* CSS Variables for theming */
      :host {
        --bb-primary-color: #1a1a2e;
        --bb-primary-hover: #16162a;
        --bb-primary-light: rgba(26, 26, 46, 0.1);
        --bb-accent-color: #6366f1;
        --bb-accent-hover: #5558e3;
        --bb-surface-bg: #ffffff;
        --bb-surface-secondary: #f8f9fb;
        --bb-surface-tertiary: #f1f3f9;
        --bb-text-primary: #1a1a2e;
        --bb-text-secondary: #6b7280;
        --bb-text-tertiary: #9ca3af;
        --bb-text-inverse: #ffffff;
        --bb-user-message-bg: var(--bb-primary-color);
        --bb-user-message-text: var(--bb-text-inverse);
        --bb-assistant-message-bg: var(--bb-surface-secondary);
        --bb-assistant-message-text: var(--bb-text-primary);
        --bb-border-color: #e5e7eb;
        --bb-border-color-light: #f1f3f9;
        --bb-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
        --bb-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
        --bb-shadow-lg: 0 12px 40px rgba(0, 0, 0, 0.12);
        --bb-shadow-xl: 0 20px 60px rgba(0, 0, 0, 0.16);
        --bb-radius-sm: 8px;
        --bb-radius-md: 12px;
        --bb-radius-lg: 16px;
        --bb-radius-xl: 20px;
        --bb-radius-full: 9999px;
        --bb-spacing-xs: 4px;
        --bb-spacing-sm: 8px;
        --bb-spacing-md: 12px;
        --bb-spacing-lg: 16px;
        --bb-spacing-xl: 20px;
        --bb-spacing-2xl: 24px;
        --bb-font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        --bb-font-size-xs: 11px;
        --bb-font-size-sm: 13px;
        --bb-font-size-md: 14px;
        --bb-font-size-lg: 16px;
        --bb-font-size-xl: 18px;
        --bb-font-size-2xl: 24px;
        --bb-font-weight-normal: 400;
        --bb-font-weight-medium: 500;
        --bb-font-weight-semibold: 600;
        --bb-font-weight-bold: 700;
        --bb-line-height: 1.5;
        --bb-transition-fast: 150ms ease;
        --bb-transition-normal: 200ms ease;
        --bb-transition-slow: 300ms ease;
        --bb-widget-width: 400px;
        --bb-widget-height: 600px;
        --bb-widget-max-height: 85vh;
        --bb-toggle-size: 60px;
      }
    `;
  }
}

// Register the custom element
if (typeof customElements !== 'undefined' && !customElements.get('brainbase-chat')) {
  customElements.define('brainbase-chat', ChatWidgetElement);
}

export { ChatWidgetElement };

