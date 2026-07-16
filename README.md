# EduMost Reader v1.0 · Cloud Library

Открывайте приложение по ссылке GitHub Pages, добавляйте книги из [edumost-books](https://github.com/edumost-pl/edumost-books) и читайте **офлайн**.

## Приложение

**URL:** https://edumost-pl.github.io/edumost-reader/

Можно установить на телефон / компьютер как PWA (**Добавить на экран «Домой»**).

## Как пользоваться

1. Откройте Reader по ссылке выше  
2. **Добавить книгу** → вставьте GitHub-ссылку на `releases/*.zip`  
3. Книга сохранится в **Моей библиотеке** вместе со **ссылкой на источник**  
4. Читайте офлайн — содержимое в IndexedDB  
5. На другом устройстве: **Экспорт ссылок** → перенесите JSON → **Импорт ссылок** → откройте книгу (скачается с GitHub)

Пример ссылки:

```
https://github.com/edumost-pl/edumost-books/blob/main/releases/engineering-roadmap-tom-01.zip
```

## Что хранится

| Данные | Где |
|--------|-----|
| Файлы книги (Markdown, assets) | IndexedDB |
| Карточка + `sourceUrl` | localStorage |
| ZIP-архив | **не хранится** |

Если контент стёрт, а ссылка GitHub есть — Reader **скачает книгу снова** при открытии.

## Экраны

| Маршрут | Экран |
|---------|--------|
| `/` | Моя библиотека |
| `/add` | Добавить по ссылке GitHub |
| `/verify` | Скачивание и проверка |
| `/read/:localId` | Чтение |

## Разработка

```bash
npm install
npm run dev
npm run build
```

Деплой на GitHub Pages — автоматически при push в `main` (Actions → Deploy GitHub Pages).

Локально с другим base:

```bash
VITE_BASE=/ npm run build
```
