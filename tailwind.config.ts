import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Custom colors for headers
        adminHeaderDark: {
          DEFAULT: "#1A2B42", // Dark blue/black from the latest screenshot
          light: "rgba(26, 43, 66, 0.8)", // Slightly lighter for hover
        },
        adminHeaderPurple: {
          DEFAULT: "#673AB7", // Purple for buttons from screenshot
          light: "rgba(103, 58, 183, 0.8)", // Lighter shade for hover
        },
        salesHeaderRose: {
          DEFAULT: "#e11d48", // Original rose color for sales
          light: "rgba(244, 63, 94, 0.8)", // Lighter shade for hover
        },
        // Custom colors for department cards (from previous context)
        salesHeader: "#FF6B6B", // Red
        logisticsHeader: "#5DADE2", // Blue
        accountingHeader: "#C34A8D", // Pink/Magenta
        treasuryHeader: "#347C4B", // Dark Green
        itHeader: "#00B8A9", // Teal
        fleetHeader: "#808080", // Gray
        creativesHeader: "#E67E22", // Orange
        financeHeader: "#8BC34A", // Lime Green
        mediaHeader: "#4ECDC4", // Light Blue/Cyan
        businessDevHeader: "#6A5ACD", // Darker Blue/Purple
        legalHeader: "#B22222", // Dark Red
        corporateHeader: "#00BFFF", // Bright Blue
        hrHeader: "#FF69B4", // Bright Pink
        specialTeamHeader: "#8A2BE2", // Purple
        marketingHeader: "#FF0000", // Red
        addDepartmentHeader: "#333333", // Dark Gray/Black
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
