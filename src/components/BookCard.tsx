import { useState } from 'react';
import { BookOpen, Headphones, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEFAULT_BOOK_COVER } from '@/lib/media';

export interface Book {
  id: string;
  title: string;
  author: string;
  cover?: string;
  genre: string;
  format: string;
  rating?: number;
  pages?: number;
}

interface BookCardProps {
  book: Book;
  onClick?: () => void;
}

const BookCard = ({ book, onClick }: BookCardProps) => {
  const [src, setSrc] = useState(book.cover || DEFAULT_BOOK_COVER);
  const isAudio = book.format === 'audiobook';

  return (
    <button
      onClick={onClick}
      className={cn(
        'group w-full text-left rounded-2xl overflow-hidden bg-card border border-border/50',
        'transition-all duration-300 hover:-translate-y-1 hover:border-primary/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background'
      )}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        <img
          src={src}
          alt={`${book.title} cover`}
          loading="lazy"
          onError={() => setSrc(DEFAULT_BOOK_COVER)}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        <div className="absolute top-2 left-2 badge-category flex items-center gap-1">
          {isAudio ? <Headphones className="h-3 w-3" /> : <BookOpen className="h-3 w-3" />}
          {isAudio ? 'Audio' : 'eBook'}
        </div>
        {book.rating !== undefined && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-caption text-white/90">
            <Star className="h-3 w-3 fill-current text-yellow-400" />
            {book.rating.toFixed(1)}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-body line-clamp-1">{book.title}</h3>
        <p className="text-caption text-muted-foreground line-clamp-1">{book.author}</p>
      </div>
    </button>
  );
};

export default BookCard;