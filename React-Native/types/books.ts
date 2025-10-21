
export interface BookFormat {
    id: string;
    book_id: string;
    format: 'ebook' | 'hardcover' | 'paperback';
    price: number;
    pages: number | null;
    stock_quantity: number | null;
    is_in_stock: boolean;
    ebook_file_url?: string | null;
    sample_file_url?: string | null;
}

export interface Book {
    id: string;
    title: string;
    author: string | null;
    publisher: string | null;
    description: string | null;
    cover_image_url: string | null;
    language: string | null;
    year_of_publication: number | null;
    formats: BookFormat[];
    table_of_contents?: { title: string; page: number }[] | null;
}