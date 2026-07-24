export default function decorate() {
  const id = '48908421';
  if (document.querySelector(`script[src*="hsforms.net/forms/embed/${id}"]`)) return;
  const s = document.createElement('script');
  s.src = `https://js.hsforms.net/forms/embed/${id}.js`;
  s.defer = true;
  document.head.appendChild(s);
}
