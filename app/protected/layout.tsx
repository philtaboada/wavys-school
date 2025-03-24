import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import SidebarToggle from "@/components/SidebarToggle";
import SidebarContent from "@/components/SidebarContent";
import MainContent from "@/components/MainContent";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarToggle>
      <div className="flex h-screen w-full overflow-hidden">
        <SidebarContent>
          <Link
            href="/"
            className="flex items-center justify-center lg:justify-start gap-2 mb-6"
          >
            <Image src="/logocolegio1.png" alt="logo" width={320} height={32} />
          </Link>
          <Menu />
        </SidebarContent>
        
        <MainContent>
          <Navbar />
          <div className="p-4 overflow-auto h-[calc(100vh-64px)]">
            {children}
          </div>
        </MainContent>
      </div>
    </SidebarToggle>
  );
}
