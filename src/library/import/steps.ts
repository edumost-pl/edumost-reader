import type { ImportStep } from "../types";

/** User-facing import steps (no technical terms). */
export const IMPORT_STEPS: ImportStep[] = [
  { id: "download", label: "Скачиваем книгу" },
  { id: "structure", label: "Проверяем структуру" },
  { id: "languages", label: "Проверяем языки" },
  { id: "illustrations", label: "Проверяем иллюстрации" },
  { id: "card", label: "Создаём карточку книги" },
  { id: "library", label: "Добавляем книгу в библиотеку" },
];

export const STEP_DELAY_MS = 900;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
