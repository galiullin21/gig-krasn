// Таблица транслитерации кириллицы в латиницу
const cyrillicToLatin: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
  'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
  'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
  'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
  'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
  'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
  'э': 'e', 'ю': 'yu', 'я': 'ya',
  // Украинские буквы
  'і': 'i', 'ї': 'yi', 'є': 'ye', 'ґ': 'g',
};

/**
 * Транслитерация текста из кириллицы в латиницу
 */
export function transliterate(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map(char => cyrillicToLatin[char] ?? char)
    .join('');
}

/**
 * Генерация slug из заголовка с транслитерацией
 */
export function generateSlug(title: string): string {
  return transliterate(title)
    .replace(/[^\w\s-]/gi, '') // Удаляем все кроме букв, цифр, пробелов и дефисов
    .replace(/[\s_]+/g, '-')   // Заменяем пробелы и подчеркивания на дефисы
    .replace(/-+/g, '-')       // Убираем множественные дефисы
    .replace(/^-+|-+$/g, '');  // Убираем дефисы в начале и конце
}
