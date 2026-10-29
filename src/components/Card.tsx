import type { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  title: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  as?: 'section' | 'article' | 'div';
  headingLevel?: 2 | 3;
}

export function Card({ title, badge, children, as: Tag = 'section', headingLevel = 2 }: CardProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
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
