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

  static get observedAttributes(): string[] {
    return [
      'embed-id',
      'position',
      'primary-color',
      'agent-name',
      'agent-role',
      'welcome-message',
      'api-base-url',
      'default-open',
      'toggle-icon',
      'width',
      'height',
      'message-font-size',
      'theme',
      'header-subtitle',
      'agent-name-font-size',
      'accent-color',
      'primary-gradient',
      'accent-gradient',
      'header-text-color',
      'stream-messages',
      'artificial-delay',
      'home-image',
      'home-title',
      'home-description',
      'time-to-open',
      'voice-token-url',
      'voice-agent-name',
      'enable-voice-mode',
      'show-collapse-button',
    ];
  }

  connectedCallback(): void {
    // Create container for React (no Shadow DOM - CSS modules already provide scoping)
    this.container = document.createElement('div');
    this.container.className = 'brainbase-chat-container';
    this.appendChild(this.container);

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
    // Remove container
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
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
      console.warn('[Brainbase Chat] embed-id attribute is required');
      return;
    }

    this.root.render(
      React.createElement(ChatWidget, props)
    );
  }

  private getProps(): ChatWidgetProps {
    const widthAttr = this.getAttribute('width');
    const heightAttr = this.getAttribute('height');
    const messageFontSizeAttr = this.getAttribute('message-font-size');
    const agentNameFontSizeAttr = this.getAttribute('agent-name-font-size');
    const timeToOpenAttr = this.getAttribute('time-to-open');
    
    return {
      embedId: this.getAttribute('embed-id') || '',
      position: this.getPositionAttribute(),
      primaryColor: this.getAttribute('primary-color') || undefined,
      accentColor: this.getAttribute('accent-color') || undefined,
      primaryGradient: this.getAttribute('primary-gradient') === 'true',
      accentGradient: this.getAttribute('accent-gradient') === 'true',
      headerTextColor: this.getAttribute('header-text-color') || undefined,
      streamMessages: this.getAttribute('stream-messages') === 'true',
      artificialDelay: this.getArtificialDelayAttribute(),
      homeImage: this.getAttribute('home-image') || undefined,
      homeTitle: this.getAttribute('home-title') || undefined,
      homeDescription: this.getAttribute('home-description') || undefined,
      timeToOpen: timeToOpenAttr ? parseFloat(timeToOpenAttr) : undefined,
      voiceTokenUrl: this.getAttribute('voice-token-url') || undefined,
      voiceAgentName: this.getAttribute('voice-agent-name') || undefined,
      enableVoiceMode: this.getAttribute('enable-voice-mode') === 'true',
      showCollapseButton: this.getAttribute('show-collapse-button') !== 'false',
      agentName: this.getAttribute('agent-name') || undefined,
      agentRole: this.getAttribute('agent-role') || undefined,
      headerSubtitle: this.getAttribute('header-subtitle') || undefined,
      welcomeMessage: this.getAttribute('welcome-message') || undefined,
      apiBaseUrl: this.getAttribute('api-base-url') || undefined,
      defaultOpen: this.getAttribute('default-open') === 'true',
      toggleIcon: this.getAttribute('toggle-icon') || undefined,
      width: widthAttr ? parseInt(widthAttr, 10) : undefined,
      height: heightAttr ? parseInt(heightAttr, 10) : undefined,
      messageFontSize: messageFontSizeAttr ? parseInt(messageFontSizeAttr, 10) : undefined,
      agentNameFontSize: agentNameFontSizeAttr ? parseInt(agentNameFontSizeAttr, 10) : undefined,
      theme: this.getThemeAttribute(),
    };
  }

  private getThemeAttribute(): 'light' | 'dark' | 'granite' | undefined {
    const theme = this.getAttribute('theme');
    if (theme === 'dark' || theme === 'granite' || theme === 'light') {
      return theme;
    }
    return undefined;
  }

  private getArtificialDelayAttribute(): [number, number] | undefined {
    const delay = this.getAttribute('artificial-delay');
    if (!delay) return undefined;
    
    // Support formats: "10,50" or "10-50"
    const parts = delay.split(/[,\-]/).map(s => parseFloat(s.trim()));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return [parts[0], parts[1]];
    }
    return undefined;
  }

  private getPositionAttribute(): 'bottom-right' | 'bottom-left' | 'inline' {
    const position = this.getAttribute('position');
    if (position === 'bottom-left' || position === 'inline') {
      return position;
    }
    return 'bottom-right';
  }
}

// Register the custom element
if (typeof customElements !== 'undefined' && !customElements.get('brainbase-chat')) {
  customElements.define('brainbase-chat', ChatWidgetElement);
}

export { ChatWidgetElement };
