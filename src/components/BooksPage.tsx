import { useMemo, useState } from 'react';
import BookCard, { type Book } from './BookCard';
import HorizontalRail from './HorizontalRail';
import SearchBar from './SearchBar';
import { cn } from '@/lib/utils';
import booksData from '@/data/books.json';

const GENRE_LABELS: Record<string, string> = {
  fiction: 'Fiction',
  business: 'Business',
  technology: 'Technology',
  'self-help': 'Self Help',
  history: 'History',
  biography: 'Biography',
};

const BooksPage = () => {
  const [query, setQuery] = useState('');
  const books = booksData as (Book & { trending?: boolean })[];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q)
    );
  }, [books, query]);

  const trending = useMemo(() => books.filter((b) => b.trending), [books]);
  const audiobooks = useMemo(() => books.filter((b) => b.format === 'audiobook'), [books]);
  const genres = useMemo(() => {
    const groups: { genre: string; items: Book[] }[] = [];
    books.forEach((b) => {
      const g = groups.find((x) => x.genre === b.genre);
      if (g) g.items.push(b);
      else groups.push({ genre: b.genre, items: [b] });
    });
    return groups;
  }, [books]);

  const itemWidth = 'w-[130px] sm:w-[150px] md:w-[170px]';

  return (
    <div className="space-y-8 animate-page-enter">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Books Library</h1>
        <p className="text-caption text-muted-foreground">
          Read and listen — eBooks and audiobooks curated by genre.
        </p>
      </header>

      <SearchBar value={query} onChange={setQuery} placeholder="Search books & authors..." />

      {query ? (
        <section>
          <h2 className="text-h3 font-semibold mb-3">Results ({filtered.length})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {filtered.map((b) => (
              <BookCard key={b.id} book={b} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">No books found</p>
          )}
        </section>
      ) : (
        <>
          <HorizontalRail title="Trending Books" itemWidthClass={itemWidth}>
            {trending.map((b) => (
              <BookCard key={`t-${b.id}`} book={b} />
            ))}
          </HorizontalRail>

          <HorizontalRail title="Audiobooks" itemWidthClass={itemWidth}>
            {audiobooks.map((b) => (
              <BookCard key={`a-${b.id}`} book={b} />
            ))}
          </HorizontalRail>

          <div className={cn('space-y-10 pt-2')}>
            {genres.map((g) => (
              <section key={g.genre} className="border-t border-border/40 pt-6">
                <HorizontalRail title={GENRE_LABELS[g.genre] ?? g.genre} itemWidthClass={itemWidth}>
                  {g.items.map((b) => (
                    <BookCard key={`${g.genre}-${b.id}`} book={b} />
                  ))}
                </HorizontalRail>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BooksPage;