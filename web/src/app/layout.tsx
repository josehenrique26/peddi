import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Providers } from "@/components/Providers";

export const metadata = {
  title: "Peddi — Pedidos e Entregas",
  description: "Sistema para pequenos negócios de alimentação gerenciarem cardápio, pedidos e entregas.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased flex flex-col">
        <Providers>
          <Navbar />
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
