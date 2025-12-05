interface OpenLibraryBook {
  title: string;
  author_name?: string[];
  isbn?: string[];
  number_of_pages_median?: number;
  cover_i?: number;
  cover_edition_key?: string;
  first_publish_year?: number;
  subject?: string[];
}

interface OpenLibrarySearchResponse {
  docs: OpenLibraryBook[];
  numFound: number;
}

interface BookSearchResult {
  title: string;
  author: string;
  isbn?: string;
  pages?: number;
  coverUrl?: string;
  publishYear?: number;
  subjects?: string[];
}

export class BookSearchService {
  /**
   * Busca un libro por título o ISBN usando Open Library API
   */
  static async searchBook(query: string): Promise<BookSearchResult | null> {
    try {
      // Si es un ISBN, buscar directamente por ISBN
      const isbnMatch = query.match(/^[\d-]+$/);
      let searchUrl: string;

      if (isbnMatch) {
        // Buscar por ISBN
        const cleanIsbn = query.replace(/-/g, '');
        searchUrl = `https://openlibrary.org/search.json?isbn=${encodeURIComponent(cleanIsbn)}`;
      } else {
        // Buscar por título
        searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=1`;
      }

      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error('Error al buscar el libro');
      }

      const data: OpenLibrarySearchResponse = await response.json();

      if (!data.docs || data.docs.length === 0) {
        return null;
      }

      const book = data.docs[0];

      // Obtener la URL de la portada
      let coverUrl: string | undefined;
      if (book.cover_edition_key) {
        coverUrl = `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-L.jpg`;
      } else if (book.cover_i) {
        coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
      }

      // Obtener ISBN si está disponible
      const isbn = book.isbn?.[0] || book.isbn?.[1];

      // Obtener autor
      const author = book.author_name?.[0] || 'Autor desconocido';

      // Obtener páginas
      const pages = book.number_of_pages_median;

      // Obtener género (primeros subjects)
      const subjects = book.subject?.slice(0, 3);

      return {
        title: book.title,
        author,
        isbn,
        pages,
        coverUrl,
        publishYear: book.first_publish_year,
        subjects,
      };
    } catch (error) {
      console.error('Error searching book:', error);
      return null;
    }
  }

  /**
   * Busca múltiples libros por título (útil para mostrar sugerencias)
   */
  static async searchBooks(query: string, limit: number = 5): Promise<BookSearchResult[]> {
    try {
      const searchUrl = `https://openlibrary.org/search.json?title=${encodeURIComponent(query)}&limit=${limit}`;

      const response = await fetch(searchUrl);
      if (!response.ok) {
        throw new Error('Error al buscar libros');
      }

      const data: OpenLibrarySearchResponse = await response.json();

      if (!data.docs || data.docs.length === 0) {
        return [];
      }

      return data.docs.map((book) => {
        let coverUrl: string | undefined;
        if (book.cover_edition_key) {
          coverUrl = `https://covers.openlibrary.org/b/olid/${book.cover_edition_key}-L.jpg`;
        } else if (book.cover_i) {
          coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
        }

        const isbn = book.isbn?.[0] || book.isbn?.[1];
        const author = book.author_name?.[0] || 'Autor desconocido';

        return {
          title: book.title,
          author,
          isbn,
          pages: book.number_of_pages_median,
          coverUrl,
          publishYear: book.first_publish_year,
          subjects: book.subject?.slice(0, 3),
        };
      });
    } catch (error) {
      console.error('Error searching books:', error);
      return [];
    }
  }
}
