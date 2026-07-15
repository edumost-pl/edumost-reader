# EduMost Reader v1.0 · Cloud Library

Читайте книги из облачного репозитория [edumost-books](https://github.com/edumost-pl/edumost-books) — без хранения ZIP на компьютере.

## Экраны

| Маршрут | Экран |
|---------|--------|
| `/` | Моя библиотека |
| `/add` | Добавить книгу (по ссылке GitHub) |
| `/verify` | Скачивание и подготовка |
| `/read/:localId` | Чтение книги |

## Облачная библиотека

1. Пользователь вставляет ссылку на `releases/*.zip` в GitHub (`edumost-books`)
2. Reader преобразует GitHub Blob URL → Raw URL и скачивает архив через `fetch()`
3. Единый pipeline `processBookArchive()` — для ссылки и для локального файла
4. Содержимое книги сохраняется в **IndexedDB**; карточка и `sourceUrl` — в **localStorage**
5. ZIP **не хранится** — после импорта книга работает **офлайн**

```
Ссылка GitHub | Файл (.zip)
        ↓
  blobFromSource()
        ↓
  processBookArchive()     ← extractBookZip + validateBookContent
        ↓
     IndexedDB
        ↓
  localStorage (карточка + sourceUrl)
        ↓
       Reader
```

### Импорт по ссылке (основной)

```typescript
importBook({ type: "link", url: "https://github.com/edumost-pl/edumost-books/blob/main/releases/engineering-roadmap-tom-01.zip" }, onStep)
```

GitHub `/blob/...` автоматически преобразуется в `raw.githubusercontent.com`.

### Импорт из файла (авторы / разработка)

Скрыт под «Для авторов и разработки» на экране добавления. Использует тот же `processBookArchive()`.

## Каталог (следующий этап)

`catalog.json` в репозитории `edumost-books` описывает опубликованные книги.

```typescript
import { fetchCloudCatalog, importBookFromUrl, catalogReleaseUrl } from "./library";

const catalog = await fetchCloudCatalog();
// UI каталога — не реализован в v1
await importBookFromUrl(catalogReleaseUrl(catalog.books[0]), onStep);
```

## Модули

```
src/library/
├── import/
│   ├── bookImporter.ts       # importBook, importBookFromUrl
│   ├── processBookArchive.ts # единая обработка ZIP
│   ├── validateBookContent.ts
│   ├── downloadBookZip.ts
│   └── resolveBookZipUrl.ts  # resolveGitHubRawUrl
├── catalog/
│   ├── types.ts
│   └── fetchCatalog.ts
└── storage/
    └── localLibraryStore.ts
```

## Разработка

```bash
npm install
npm run dev
```
