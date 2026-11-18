"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Tema = "dark" | "light";

interface ThemeContextValue {
  tema: Tema;
  alternarTema: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  tema: "dark",
  alternarTema: () => {},
});

const STORAGE_KEY = "catraca-tema";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>("dark");

  useEffect(() => {
    const salvo = localStorage.getItem(STORAGE_KEY);
    const inicial: Tema = salvo === "light" ? "light" : "dark";
    queueMicrotask(() => setTema(inicial));
    document.documentElement.classList.toggle("dark", inicial === "dark");
  }, []);

  const alternarTema = useCallback(() => {
    setTema((atual) => {
      const proximo: Tema = atual === "dark" ? "light" : "dark";
      localStorage.setItem(STORAGE_KEY, proximo);
      document.documentElement.classList.toggle("dark", proximo === "dark");
      return proximo;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
