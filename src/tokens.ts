import { createContext, useContext } from 'react';

export type Tokens = {
  bg: string; surface: string; surface2: string; line: string; line2: string;
  ink: string; ink2: string; ink3: string; ink4: string;
  sage: string; sageDeep: string; sageSoft: string;
  amber: string; amberSoft: string; rose: string; roseSoft: string;
  sky: string; skySoft: string; plum: string; plumSoft: string;
  shadow1: string; shadow2: string; shadow3: string;
};

const light: Tokens = {
  bg:       '#F8F7F4',
  surface:  '#FFFFFF',
  surface2: '#F2EFE9',
  line:     '#E7E3DB',
  line2:    '#D9D4C8',

  ink:      '#1F1B16',
  ink2:     '#44403C',
  ink3:     '#78716C',
  ink4:     '#A8A29E',

  sage:     '#87A878',
  sageDeep: '#5E7C52',
  sageSoft: '#EAF0E4',

  amber:     '#C89B4A',
  amberSoft: '#F5EBD6',
  rose:      '#B86B5E',
  roseSoft:  '#F3E1DC',
  sky:       '#6F8FA8',
  skySoft:   '#E2EAF0',
  plum:      '#8A6E8C',
  plumSoft:  '#EDE4EE',

  shadow1: '0 1px 2px rgba(41,37,36,0.04), 0 1px 3px rgba(41,37,36,0.06)',
  shadow2: '0 4px 16px rgba(41,37,36,0.06), 0 2px 4px rgba(41,37,36,0.05)',
  shadow3: '0 20px 40px rgba(41,37,36,0.10), 0 8px 16px rgba(41,37,36,0.06)',
};

const dark: Tokens = {
  bg:       '#111111',
  surface:  '#1C1C1E',
  surface2: '#2C2C2E',
  line:     '#3A3A3C',
  line2:    '#48484A',

  ink:      '#F2F2F7',
  ink2:     '#EBEBF5',
  ink3:     '#AEAEB2',
  ink4:     '#636366',

  sage:     '#87A878',
  sageDeep: '#A0C890',
  sageSoft: '#1A2618',

  amber:     '#C89B4A',
  amberSoft: '#2A2010',
  rose:      '#CF8078',
  roseSoft:  '#2D1410',
  sky:       '#7FAABB',
  skySoft:   '#0F1E2A',
  plum:      '#A07EA2',
  plumSoft:  '#1E1422',

  shadow1: '0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.4)',
  shadow2: '0 4px 16px rgba(0,0,0,0.4), 0 2px 4px rgba(0,0,0,0.3)',
  shadow3: '0 20px 40px rgba(0,0,0,0.6), 0 8px 16px rgba(0,0,0,0.4)',
};

export const DarkCtx = createContext(false);
export const useT = (): Tokens => useContext(DarkCtx) ? dark : light;
export const T = light;

export const TYPE = {
  display: "'Source Serif 4', 'Source Serif Pro', Georgia, serif",
  sans:    "'Inter Tight', 'Inter', -apple-system, system-ui, sans-serif",
  mono:    "'JetBrains Mono', ui-monospace, monospace",
} as const;
