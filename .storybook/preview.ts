import type { Preview } from '@storybook/react';
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
      default: 'light',
      values: [
        { name: 'light', value: '#f5f5f5' },
        { name: 'dark', value: '#1a1a2e' },
        { name: 'white', value: '#ffffff' },
      ],
    },
  },
};

export default preview;

