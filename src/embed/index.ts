/**
 * Brainbase Chat Widget - Standalone Embed Entry Point
 * 
 * This file is the entry point for the standalone IIFE bundle that can be
 * loaded via a script tag. It includes React and all dependencies bundled together.
 * 
 * Usage:
 * <brainbase-chat embed-id="your-embed-id"></brainbase-chat>
 * <script src="https://unpkg.com/@brainbase-labs/chat-widget/embed" async></script>
 */

// Import styles - these will be injected into the bundle
import '../styles/variables.css';

// Import and register the web component
import { ChatWidgetElement } from './ChatWidgetElement';

// Re-export for consumers who might want to extend
export { ChatWidgetElement };

// Log that the widget is loaded (helpful for debugging)
if (typeof window !== 'undefined') {
  console.log('[Brainbase Chat] Widget loaded and ready');
}

