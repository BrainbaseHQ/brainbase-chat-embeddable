import type { Preview } from '@storybook/react-vite';
import '../src/styles/variables.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      values: [
        { name: 'light', value: '#f5f5f5' },
        { name: 'dark', value: '#1a1a2e' },
        { name: 'white', value: '#ffffff' },
      ],
      default: 'light',
    },
  },

  initialGlobals: {
    backgrounds: {
      value: '#f5f5f5',
    },
  },
};

export default preview;

