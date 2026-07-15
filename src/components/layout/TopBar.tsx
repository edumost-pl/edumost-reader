import { NavLink, useNavigate } from "react-router-dom";

export function TopBar() {
  const navigate = useNavigate();

  return (
    <header className="top-bar">
      <div className="top-bar__inner">
        <NavLink to="/" className="top-bar__brand" end>
          <span className="top-bar__logo" aria-hidden="true">
            📖
          </span>
          <span className="top-bar__title">EduMost Reader</span>
        </NavLink>

        <nav className="top-bar__nav" aria-label="Главное меню">
          <button
            type="button"
            className="top-bar__btn top-bar__btn--primary"
            onClick={() => navigate("/add")}
          >
            <span aria-hidden="true">➕</span>
            Добавить книгу
          </button>
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `top-bar__btn${isActive ? " top-bar__btn--active" : ""}`
            }
          >
            <span aria-hidden="true">📚</span>
            Моя библиотека
          </NavLink>
          <button type="button" className="top-bar__btn" disabled title="Скоро">
            <span aria-hidden="true">⚙</span>
            Настройки
          </button>
        </nav>
      </div>
    </header>
  );
}
