import { Outfit } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/app/Providers";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
    title: "GoCart. - Shop smarter",
    description: "GoCart. - Shop smarter",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={`${outfit.className} antialiased`}>
                <Providers>
                    <Toaster />
                    {children}
                </Providers>
            </body>
        </html>
    );
}
