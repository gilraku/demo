export const residentialAssetModels = [
  "building-type-a",
  "building-type-g",
  "building-type-s",
] as const;

export type ResidentialAssetModel = (typeof residentialAssetModels)[number];
