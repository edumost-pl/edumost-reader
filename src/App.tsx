import { BrowserRouter, Route, Routes } from "react-router-dom";
import { LibraryProvider } from "./library";
import { AppLayout } from "./components/layout/AppLayout";
import { AddBookPage } from "./components/add/AddBookPage";
import { ImportBookPage } from "./components/add/ImportBookPage";
import { VerifyBookPage } from "./components/add/VerifyBookPage";
import { LibraryPage } from "./components/library/LibraryPage";
import { BookReaderPage } from "./components/reader/BookReaderPage";

export function App() {
  return (
    <LibraryProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "") || "/"}>
        <Routes>
          <Route path="read/:localId" element={<BookReaderPage />} />
          <Route element={<AppLayout />}>
            <Route index element={<LibraryPage />} />
            <Route path="add" element={<AddBookPage />} />
            <Route path="verify" element={<VerifyBookPage />} />
            <Route path="import" element={<ImportBookPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </LibraryProvider>
  );
}
