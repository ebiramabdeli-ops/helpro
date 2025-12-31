import db, { saveDB } from '../database.js';

export class Booking {
  static create({ id, requestId, customerId, helperId, helperName, price, scheduledDate }) {
    const booking = {
      id,
      requestId,
      customerId,
      helperId,
      helperName,
      status: 'pending',
      price,
      scheduledDate,
      completedAt: null,
      rating: null,
      review: null,
      createdAt: new Date().toISOString(),
    };
    db.bookings.push(booking);
    saveDB();
    return booking;
  }

  static findById(id) {
    return db.bookings.find(b => b.id === id);
  }

  static getAll({ customerId = null, helperId = null, requestId = null, status = null, limit = 50, offset = 0 } = {}) {
    let bookings = db.bookings;
    
    if (customerId) {
      bookings = bookings.filter(b => b.customerId === customerId);
    }
    if (helperId) {
      bookings = bookings.filter(b => b.helperId === helperId);
    }
    if (requestId) {
      bookings = bookings.filter(b => b.requestId === requestId);
    }
    if (status) {
      bookings = bookings.filter(b => b.status === status);
    }
    
    return bookings
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(offset, offset + limit);
  }

  static updateStatus(id, status, completedAt = null) {
    const booking = db.bookings.find(b => b.id === id);
    if (booking) {
      booking.status = status;
      if (completedAt) booking.completedAt = completedAt;
      saveDB();
    }
    return this.findById(id);
  }

  static addReview(id, rating, review) {
    const booking = db.bookings.find(b => b.id === id);
    if (booking) {
      booking.rating = rating;
      booking.review = review;
      saveDB();
    }
    return this.findById(id);
  }

  static delete(id) {
    const index = db.bookings.findIndex(b => b.id === id);
    if (index !== -1) {
      db.bookings.splice(index, 1);
      saveDB();
      return true;
    }
    return false;
  }
}
