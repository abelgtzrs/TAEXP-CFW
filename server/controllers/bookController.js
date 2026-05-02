// server/controllers/bookController.js

const Book = require("../models/userSpecific/Book"); // Import the Book model.
const User = require("../models/User"); // Import User model for rewards.

// @desc    Create a new book entry for the logged-in user
// @route   POST /api/books
exports.createBook = async (req, res) => {
  try {
    // Add the user's ID to the request body data.
    req.body.user = req.user.id;

    // Create the book in the database.
    const book = await Book.create(req.body);

    // Send a success response.
    res.status(201).json({ success: true, data: book });
  } catch (error) {
    console.error("Create Book Error:", error);
    res.status(400).json({
      success: false,
      message: "Error creating book entry",
      error: error.message,
    });
  }
};

// @desc    Get all books for the logged-in user
// @route   GET /api/books
exports.getUserBooks = async (req, res) => {
  try {
    // Find all books belonging to the logged-in user.
    const books = await Book.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    // Send the list of books as a response.
    res.status(200).json({ success: true, count: books.length, data: books });
  } catch (error) {
    console.error("Get User Books Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update an existing book entry
// @route   PUT /api/books/:bookId
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);

    if (!book) {
      return res.status(404).json({ success: false, message: "Book entry not found with that ID" });
    }

    if (book.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: "Not authorized to update this entry" });
    }

    const wasFinishedBefore = book.isFinished;

    // Apply updates from the request body to the document we found
    Object.assign(book, req.body);

    // Save the book. This triggers our 'pre-save' hook to auto-finish if pages match.
    const updatedBook = await book.save();

    // Check if the book's status has just changed from not finished to finished.
    if (updatedBook.isFinished && !wasFinishedBefore) {
      const user = await User.findById(req.user.id);

      const BOOK_FINISH_XP = 150;
      const WENDY_HEARTS_AWARD = 25;

      user.wendyHearts = (user.wendyHearts || 0) + WENDY_HEARTS_AWARD;
      user.experience = (user.experience || 0) + BOOK_FINISH_XP;

      if (user.experience >= user.xpToNextLevel) {
        user.level += 1;
        user.experience -= user.xpToNextLevel;
        user.xpToNextLevel = Math.floor(user.xpToNextLevel * 1.25);
      }

      // --- THIS IS THE FIX ---
      // Save the updated user document and capture the result.
      const updatedUser = await user.save();
      // Populate activeAbelPersona so the client doesn't overwrite the theme with a raw ObjectId.
      await updatedUser.populate({ path: "activeAbelPersona", model: "AbelPersonaBase" });
      // We must remove the password before sending it back.
      const userResponse = { ...updatedUser.toObject() };
      delete userResponse.password;

      // Return a special success response INCLUDING the updated user data.
      return res.status(200).json({
        success: true,
        message: `Book finished! +${BOOK_FINISH_XP} XP, +${WENDY_HEARTS_AWARD} Wendy Hearts!`,
        data: updatedBook,
        userData: userResponse, // The frontend will use this to update its global state.
      });
    }

    // If the book was just updated without being finished, send a standard response.
    res.status(200).json({ success: true, data: updatedBook });
  } catch (error) {
    console.error("Update Book Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Delete a book entry
// @route   DELETE /api/books/:bookId
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.bookId);

    if (!book) {
      return res.status(404).json({ success: false, message: "Book entry not found" });
    }

    // Security check: Ensure user owns this entry.
    if (book.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to delete this entry",
      });
    }

    // Remove the book from the database.
    await book.deleteOne();

    res.status(200).json({
      success: true,
      message: "Book entry deleted successfully",
      data: {},
    });
  } catch (error) {
    console.error("Delete Book Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
