import type { StoredBook } from "../../library";
import { BookCard } from "./BookCard";

interface BookGridProps {
  books: StoredBook[];
}

export function BookGrid({ books }: BookGridProps) {
  return (
    <ul className="book-grid" aria-label="Книги в библиотеке">
      {books.map((book) => (
        <li key={book.localId} className="book-grid__item">
          <BookCard book={book} />
        </li>
      ))}
    </ul>
  );
}
