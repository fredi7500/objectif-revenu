export type PageMetadata = {
  title: string;
  description: string;
};

function getOrCreateMetaDescription() {
  let meta = document.querySelector('meta[name="description"]');

  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }

  return meta;
}

export function applyPageMetadata({ title, description }: PageMetadata) {
  document.title = title;
  getOrCreateMetaDescription().setAttribute('content', description);
  document.documentElement.lang = 'fr';
}
