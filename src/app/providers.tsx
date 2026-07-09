"use client";

import { Provider } from "react-redux";
import { SessionProvider } from "next-auth/react";
import { store } from "@/store/store"; // Adjust this path if your store is located elsewhere
import { ThemeProvider } from "next-themes"; // If you are using next-themes for your dark mode

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        {/* If you use ThemeProvider, wrap it here as well */}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </Provider>
    </SessionProvider>
  );
}