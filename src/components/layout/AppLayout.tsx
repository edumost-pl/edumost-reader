import { Outlet } from "react-router-dom";
import { TopBar } from "./TopBar";

export function AppLayout() {
  return (
    <div className="app">
      <TopBar />
      <main className="app__main">
        <Outlet />
      </main>
    </div>
  );
}
