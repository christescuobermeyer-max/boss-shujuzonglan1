type ShopDateSource = {
  entryDate?: Date | string;
  contractSignedDate?: Date | string;
};

function toValidDate(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveShopOpenedDate(source: ShopDateSource) {
  return toValidDate(source.entryDate) ?? toValidDate(source.contractSignedDate);
}
