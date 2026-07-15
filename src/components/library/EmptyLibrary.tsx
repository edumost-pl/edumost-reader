import { useNavigate } from "react-router-dom";

export function EmptyLibrary() {
  const navigate = useNavigate();

  return (
    <section className="empty-library" aria-labelledby="empty-library-title">
      <div className="empty-library__visual" aria-hidden="true">
        <div className="empty-library__shelf">
          <div className="empty-library__book empty-library__book--1" />
          <div className="empty-library__book empty-library__book--2" />
          <div className="empty-library__book empty-library__book--3" />
        </div>
      </div>

      <h2 id="empty-library-title" className="empty-library__title">
        Добавьте первую книгу
      </h2>
      <p className="empty-library__text">
        Добавьте книгу EduMost по ссылке — и она появится здесь, готовая к чтению.
      </p>

      <button
        type="button"
        className="empty-library__cta"
        onClick={() => navigate("/add")}
      >
        <span aria-hidden="true">➕</span>
        Добавить книгу
      </button>
    </section>
  );
}
