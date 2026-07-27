export const PER_PAGE = 10;

export function stem() {
  return '';
}

export function queryTerms() {
  return [];
}

export function rank() {
  return [];
}

export function search() {
  return {
    total: 0, page: 0, pages: 0, results: [],
  };
}
