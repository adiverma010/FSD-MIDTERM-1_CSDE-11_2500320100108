const express = require('express');
const app = express();
const books = [];

// Task 1: Initialize Express and JSON middleware.
app.use(express.json());

// Shared helper: Find a book by ID and validate book details.
function findBook(id) {
  return books.find(book => String(book.id) === id);
}

function validBook(book) {
  return (typeof book.id === 'string' || Number.isInteger(book.id)) && String(book.id).trim() &&
    ['title', 'author', 'category'].every(key => typeof book[key] === 'string' && book[key].trim()) &&
    Number.isInteger(book.quantity) && book.quantity >= 0 &&
    Number.isInteger(book.available) && book.available >= 0 &&
    book.available <= book.quantity;
}

// Task 2: Add a new book.
app.post('/api/books', (req, res) => {
  const book = { ...req.body };
  if (book.available === undefined) book.available = book.quantity;
  if (!validBook(book)) return res.status(400).json({ error: 'Invalid or missing book details.' });
  if (findBook(String(book.id))) return res.status(409).json({ error: 'Book ID already exists.' });
  books.push(book);
  res.status(201).json(book);
});

// Task 3: Retrieve all books or one book by ID.
app.get('/api/books', (req, res) => {
  res.json(books);
});

// Task 6: Search books by title, ignoring letter case.
app.get('/api/books/search', (req, res) => {
  const title = (req.query.title || '').toLowerCase();
  const matches = books.filter(book => book.title.toLowerCase().includes(title));
  if (matches.length === 0) return res.status(404).json({ message: 'No matching books found.' });
  res.json(matches);
});

app.get('/api/books/:id', (req, res) => {
  const book = findBook(req.params.id);
  book ? res.json(book) : res.status(404).json({ error: 'Book not found.' });
});

// Task 4: Update a book without changing its ID.
app.put('/api/books/:id', (req, res) => {
  const book = findBook(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found.' });
  const updated = { ...book, ...req.body, id: book.id };
  if (!validBook(updated)) return res.status(400).json({ error: 'Invalid book details.' });
  Object.assign(book, updated);
  res.json(book);
});

// Task 5: Delete a book only when all copies are available.
app.delete('/api/books/:id', (req, res) => {
  const index = books.findIndex(book => String(book.id) === req.params.id);
  if (index < 0) return res.status(404).json({ error: 'Book not found.' });
  if (books[index].available < books[index].quantity) {
    return res.status(400).json({ error: 'Cannot delete a book while copies are issued.' });
  }
  res.json({ message: 'Book deleted successfully.', book: books.splice(index, 1)[0] });
});

// Issue and return book copies.
app.post('/api/books/:id/issue', (req, res) => {
  const book = findBook(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found.' });
  if (book.available === 0) return res.status(400).json({ error: 'No copies available.' });
  book.available--;
  res.json(book);
});

app.post('/api/books/:id/return', (req, res) => {
  const book = findBook(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found.' });
  if (book.available === book.quantity) return res.status(400).json({ error: 'All copies are already available.' });
  book.available++;
  res.json(book);
});

// Handle invalid JSON request bodies.
app.use((err, req, res, next) => res.status(400).json({ error: 'Invalid JSON.' }));

// Start the server on port 3000 by default.
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Library API running at http://localhost:${port}`));
