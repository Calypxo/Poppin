import type { WatercolorMotif } from "../public/MarketDecorations";

export function categoryIllustration(name: string): WatercolorMotif {
  const label = name.toLowerCase();
  if (/\b(coffee|matcha|cafe|tea)\b/.test(label)) return "matcha-latte";
  if (/\b(food|eat|dining|drinks?)\b/.test(label)) return "sandwich";
  if (/\b(fashion|clothing?|thrift)\b/.test(label)) return "printed-shirt";
  if (/\b(books?|reading|literature)\b/.test(label)) return "book-stack";
  if (/\b(music|vinyl)\b/.test(label)) return "vinyl-reference";
  if (/\b(toys?|hobbies|collectibles)\b/.test(label)) return "dumpling-squishy";
  if (/\b(arts?|crafts?|creative|workshops?)\b/.test(label))
    return "woven-bracelets";
  if (/\b(photo|photography|camera)\b/.test(label)) return "camera-reference";
  if (/\b(flowers?|garden)\b/.test(label)) return "flower-bouquet";
  if (/\b(accessories|jewelry|beauty)\b/.test(label)) return "woven-bracelets";
  if (/\b(shopping|shop|bazaar|market)\b/.test(label))
    return "flower-bouquet";
  return "camera-reference";
}
