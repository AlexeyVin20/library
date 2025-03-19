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
        "ibm-plex-sans": ["IBM Plex Sans", "sans-serif"],
        "bebas-neue": ["var(--bebas-neue)"],
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#6366f1",
          foreground: "hsl(var(--accent-foreground))",
          light: "#818cf8",
          dark: "#4f46e5",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        brand: {
          DEFAULT: "#0066ff",
          100: "#070031",
          200: "#000957",
          300: "#003e89",
          400: "#005da9",
          500: "#0078c7",
          600: "#009ef0",
          700: "#3fc2ff",
          800: "#6ae6ff",
          900: "#78f4ff",
          1000: "#91ffff",
          1100: "#91ffff",
          1200: "#91ffff",
          light: "#3385ff",
          dark: "#0047b3",
        },
        primary: {
          DEFAULT: "#00B4D8", // Cyan (Brand)
          admin: "#0077B6", // Темный синий для админки
        },
        neutral: {
          DEFAULT: "#7866d2", // Нейтральный цвет (песочный)
          100: "#09002e",
          200: "#150054",
          300: "#3b348f",
          400: "#514fac",
          500: "#696aca",
          600: "#898cef",
          "600-10": "rgba(137,140,239,0.1)",
          "600-30": "rgba(137,140,239,0.3)",
          "600-50": "rgba(137,140,239,0.5)",
          700: "#aaaeff",
          800: "#ccd2ff",
          900: "#d9e0ff",
          1000: "#e9f0ff",
          1100: "#edf4ff",
          1200: "#edf4ff",
        },
        solid: {
          DEFAULT: "#FFFFFF", // Контрастный белый
          inverse: "#000000", // Инверсия
        },
        green: {
          DEFAULT: "#027A48",
          100: "#ECFDF3",
          400: "#4C7B62",
          500: "#2CC171",
          800: "#027A48",
        },
        red: {
          DEFAULT: "#EF3A4B",
          400: "#F46F70",
          500: "#E27233",
          800: "#EF3A4B",
        },
        blue: {
          100: "#0089F1",
        },
        light: {
          100: "#D6E0FF",
          200: "#EED1AC",
          300: "#F8F8FF",
          400: "#EDF1F1",
          500: "#8D8D8D",
          600: "#F9FAFB",
          700: "#E2E8F0",
          800: "#F8FAFC",
        },
        dark: {
          100: "#16191E",
          200: "#3A354E",
          300: "#232839",
          400: "#1E293B",
          500: "#0F172A",
          600: "#333C5C",
          700: "#464F6F",
          800: "#1E2230",
        },
      },
      screens: {
        xs: "480px",
      },
      borderRadius: {
        DEFAULT: "1rem",
        lg: "1.5rem", // Playful стиль границ
        md: "1rem",
        sm: "0.75rem",
      },
      backgroundImage: {
        surface: "linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0.05))", // Полупрозрачные поверхности (translucent)
        'gradient-app': 'linear-gradient(135deg,rgba(171, 241, 255, 0) 0%,rgba(0, 47, 255, 0.39) 100%)',
        'gradient-accent': 'linear-gradient(135deg,rgb(87, 62, 255) 0%,rgb(63, 80, 176) 100%)',
        'custom-bg': "url('/images/background.jpg')",
      },
      transitionProperty: {
        all: "all 0.3s ease-in-out", // Полностью анимированные переходы
        DEFAULT: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      scale: {
        90: "0.9",
        95: "0.95",
        100: "1",
        105: "1.05",
        110: "1.1",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
