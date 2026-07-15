# EduMost Reader v1.0

Главное приложение платформы EduMost — читайте книги, сохранённые на вашем устройстве.

## Экраны

| Маршрут | Экран |
|---------|--------|
| `/` | Моя библиотека |
| `/add` | Добавить книгу |
| `/read/:localId` | Чтение первой страницы книги |

## Чтение

1. Загрузить книгу по `localId`
2. Прочитать `book.toml` из IndexedDB
3. Первый том → первая страница Markdown
4. Отобразить (заголовки, текст, списки, код, изображения)

**Файл для импорта:** zip-папки книги EduMost (с `book.toml` в корне), не release package Publisher.

```
src/reader/
├── api/openBook.ts           # openBookFirstPage(localId)
├── book/                     # book.toml, discover pages
├── content/                  # IndexedDB + extractBookZip
└── markdown/renderMarkdown.ts
```

## Терминология (UI)

- Моя библиотека
- Добавить книгу
- Проверяем книгу
- Подготавливаем книгу
- Книга готова к чтению
- Читать книгу

## Импорт

Единый pipeline:

```
Файл | Ссылка → Blob → extractBookZip → IndexedDB → Library → Reader
```

**По ссылке:** GitHub `/blob/...` автоматически преобразуется в `raw.githubusercontent.com`, ZIP скачивается через `fetch`.

**Из файла:** `.zip` / `.edubook` через File Picker.

Оба способа используют `blobFromSource()` → `extractBookZip()`.

## Разработка

```bash
npm install
npm run dev
```
