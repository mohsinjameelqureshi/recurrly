import data from "../constants/brand-icons.json";
import { createBrandIconMatcher } from "./brandIconMatcher";

interface BrandIconData {
  body: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
}

const catalogue: {
  width?: number;
  height?: number;
  icons: Record<string, BrandIconData>;
} = data;

export const findBrandIcon = createBrandIconMatcher(
  Object.keys(catalogue.icons),
);

export function getBrandIconXml(slug?: string): string | undefined {
  if (!slug || !Object.hasOwn(catalogue.icons, slug)) return undefined;
  const icon = catalogue.icons[slug];
  const width = icon.width ?? catalogue.width ?? 16;
  const height = icon.height ?? catalogue.height ?? 16;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.left ?? 0} ${icon.top ?? 0} ${width} ${height}">${icon.body}</svg>`;
}
