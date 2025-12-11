import type { Preview } from '@storybook/react-vite';
import '../src/styles/variables.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      options: {
        light: { name: 'light', value: '#f5f5f5' },
        dark: { name: 'dark', value: '#1a1a2e' },
        white: { name: 'white', value: '#ffffff' }
      }
    },
  },

  initialGlobals: {
    backgrounds: {
      value: 'light'
    }
  }
};

export default preview;

