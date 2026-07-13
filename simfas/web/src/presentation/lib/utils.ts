import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Gabung className Tailwind dengan resolusi konflik. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
