export function getNextCarouselIndex(length: number, currentIndex: number) {
  if (length <= 0) return 0;
  return (currentIndex + 1 + length) % length;
}
