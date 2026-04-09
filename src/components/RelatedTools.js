import Link from 'next/link';
import { TOOLS } from '@/data/tools';

export default function RelatedTools({ relatedIds, currentId }) {
  const related = relatedIds
    .map(id => TOOLS.find(t => t.id === id))
    .filter(t => t && t.id !== currentId)
    .slice(0, 4);

  if (!related.length) return null;

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <div className="section-title" style={{ marginBottom: '0.8rem' }}>People Also Used</div>
      <div className="related-grid">
        {related.map(t => (
          <Link
            key={t.id}
            href={`/${t.category}/${t.slug}/`}
            className="related-card"
          >
            {t.icon} {t.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
