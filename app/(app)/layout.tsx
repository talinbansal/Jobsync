import Navbar from ".././reusable-components/navbar";
import Sidebar from ".././reusable-components/sidebar";
import TotalPointsProvider from "./providers/TotalPointsProvider";
import CheckSession from "../reusable-components/checksession";
import WebSocketProvider from "./providers/WebSocketProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TotalPointsProvider>
      <WebSocketProvider>
        <div className="h-screen flex flex-col bg-[#F8FAFC] text-slate-900 overflow-hidden">
          <Navbar />

          <div className="flex flex-1 min-h-0">
            <Sidebar />

            <main className="flex-1 min-h-0">
              <CheckSession>{children}</CheckSession>
            </main>
          </div>
        </div>
      </WebSocketProvider>
    </TotalPointsProvider>
  );
}
