import { useLibrary } from "../../library";
import { BookGrid } from "./BookGrid";
import { EmptyLibrary } from "./EmptyLibrary";

export function LibraryPage() {
  const { books } = useLibrary();

  return (
    <div className="library-page">
      <header className="library-page__header">
        <h1 className="library-page__title">Моя библиотека</h1>
        {books.length > 0 && (
          <p className="library-page__subtitle">
            {books.length === 1
              ? "1 книга"
              : books.length < 5
                ? `${books.length} книги`
                : `${books.length} книг`}
          </p>
        )}
      </header>

      {books.length === 0 ? <EmptyLibrary /> : <BookGrid books={books} />}
    </div>
  );
}
