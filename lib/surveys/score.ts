export function averageRating(values: number[]): number | null {
  const ratings = values.filter((value) => value >= 1 && value <= 5);
  if (ratings.length === 0) {
    return null;
  }
  const sum = ratings.reduce((total, value) => total + value, 0);
  return Math.round((sum / ratings.length) * 100) / 100;
}

export function responseRate(
  responses: number,
  audience: number,
): number | null {
  if (audience <= 0) {
    return null;
  }
  return Math.round((responses / audience) * 1000) / 1000;
}
