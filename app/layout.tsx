import "./globals.css";
export const metadata = { title: "Shymol Chaya Complex LTD." };
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><main>{children}<footer className="app-attribution">Developed by Nishat Nazim</footer></main></body></html>;
}
