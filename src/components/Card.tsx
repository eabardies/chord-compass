import type { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  title: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  as?: 'section' | 'article' | 'div';
  headingLevel?: 2 | 3 | 4;
}

export function Card({ title, badge, children, as: Tag = 'section', headingLevel = 2 }: CardProps) {
  const Heading = `h${headingLevel}` as const;
  return (
    <Tag className="card">
      <header className="card__header">
        <Heading className="card__title">{title}</Heading>
        {badge && <span className="card__badge">{badge}</span>}
      </header>
      <div className="card__body">{children}</div>
    </Tag>
  );
}
