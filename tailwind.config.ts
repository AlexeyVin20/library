import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		fontFamily: {
  			'ibm-plex-sans': [
  				'IBM Plex Sans',
  				'sans-serif'
  			],
  			'bebas-neue': [
  				'var(--bebas-neue)'
  			]
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: '#6366f1',
  				foreground: 'hsl(var(--accent-foreground))',
  				light: '#818cf8',
  				dark: '#4f46e5'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			brand: {
  				'100': '#070031',
  				'200': '#000957',
  				'300': '#003e89',
  				'400': '#005da9',
  				'500': '#0078c7',
  				'600': '#009ef0',
  				'700': '#3fc2ff',
  				'800': '#6ae6ff',
  				'900': '#78f4ff',
  				'1000': '#91ffff',
  				'1100': '#91ffff',
  				'1200': '#91ffff',
  				DEFAULT: '#0066ff',
  				light: '#3385ff',
  				dark: '#0047b3'
  			},
  			primary: {
  				DEFAULT: '#00B4D8',
  				admin: '#0077B6'
  			},
  			neutral: {
  				'100': '#09002e',
  				'200': '#150054',
  				'300': '#3b348f',
  				'400': '#514fac',
  				'500': '#696aca',
  				'600': '#898cef',
  				'700': '#aaaeff',
  				'800': '#ccd2ff',
  				'900': '#d9e0ff',
  				'1000': '#e9f0ff',
  				'1100': '#edf4ff',
  				'1200': '#edf4ff',
  				DEFAULT: '#7866d2',
  				'600-10': 'rgba(137,140,239,0.1)',
  				'600-30': 'rgba(137,140,239,0.3)',
  				'600-50': 'rgba(137,140,239,0.5)'
  			},
  			solid: {
  				DEFAULT: '#FFFFFF',
  				inverse: '#000000'
  			},
  			green: {
  				'100': '#ECFDF3',
  				'400': '#4C7B62',
  				'500': '#2CC171',
  				'800': '#027A48',
  				DEFAULT: '#027A48'
  			},
  			red: {
  				'400': '#F46F70',
  				'500': '#E27233',
  				'800': '#EF3A4B',
  				DEFAULT: '#EF3A4B'
  			},
  			blue: {
  				'100': '#0089F1'
  			},
  			light: {
  				'100': '#D6E0FF',
  				'200': '#EED1AC',
  				'300': '#F8F8FF',
  				'400': '#EDF1F1',
  				'500': '#8D8D8D',
  				'600': '#F9FAFB',
  				'700': '#E2E8F0',
  				'800': '#F8FAFC'
  			},
  			dark: {
  				'100': '#16191E',
  				'200': '#3A354E',
  				'300': '#232839',
  				'400': '#1E293B',
  				'500': '#0F172A',
  				'600': '#333C5C',
  				'700': '#464F6F',
  				'800': '#1E2230'
  			}
  		},
  		screens: {
  			xs: '480px'
  		},
  		borderRadius: {
  			DEFAULT: '1rem',
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		backgroundImage: {
  			surface: 'linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
  			'gradient-app': 'linear-gradient(135deg,rgba(171, 241, 255, 0) 0%,rgba(0, 47, 255, 0.39) 100%)',
  			'gradient-accent': 'linear-gradient(135deg,rgb(87, 62, 255) 0%,rgb(63, 80, 176) 100%)',
  			'custom-bg': 'url("/images/background.jpg")',
  			'gradient-button': 'linear-gradient(-90deg,#007cf0,#00dfd8,#ff0080,#007cf0)',
  			trial: 'linear-gradient(135deg,#0070f3,#f81ce5)',
  			'book-bind-bg': 'linear-gradient(90deg,hsla(0,0%,100%,0),hsla(0,0%,100%,0) 12%,hsla(0,0%,100%,.25) 29.25%,hsla(0,0%,100%,0) 50.5%,hsla(0,0%,100%,0) 75.25%,hsla(0,0%,100%,.25) 91%,hsla(0,0%,100%,0)),linear-gradient(90deg,rgba(0,0,0,.03),rgba(0,0,0,.1) 12%,transparent 30%,rgba(0,0,0,.02) 50%,rgba(0,0,0,.2) 73.5%,rgba(0,0,0,.5) 75.25%,rgba(0,0,0,.15) 85.25%,transparent)',
  			'book-pages': 'repeating-linear-gradient(90deg,#fff,#efefef 1px,#fff 3px,#9a9a9a 0)'
  		},
  		transitionProperty: {
  			all: 'all 0.3s ease-in-out',
  			DEFAULT: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
  		},
  		scale: {
  			'90': '0.9',
  			'95': '0.95',
  			'100': '1',
  			'105': '1.05',
  			'110': '1.1'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		boxShadow: {
  			book: '0 1.8px 3.6px rgba(0,0,0,.05),0 10.8px 21.6px rgba(0,0,0,.08),inset 0 -.9px 0 rgba(0,0,0,.1),inset 0 1.8px 1.8px hsla(0,0%,100%,.1),inset 3.6px 0 3.6px rgba(0,0,0,.1)'
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
