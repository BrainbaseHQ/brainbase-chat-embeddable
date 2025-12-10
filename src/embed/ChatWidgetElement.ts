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
      'welcome-message',
      'api-base-url',
      'default-open',
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
}

// Register the custom element
if (typeof customElements !== 'undefined' && !customElements.get('brainbase-chat')) {
  customElements.define('brainbase-chat', ChatWidgetElement);
}

export { ChatWidgetElement };
