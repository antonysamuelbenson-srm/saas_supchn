export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        mydarktheme: {
          primary: "#3ABFF8",
          secondary: "#F471B5",
          accent: "#37CDBE",
          neutral: "#2A323C",
          "base-100": "#1D232A",
          info: "#3ABFF8",
          success: "#36D399",
          warning: "#FBBD23",
          error: "#F87272",
        },
      },
      "dark",
    ],
  },
};
