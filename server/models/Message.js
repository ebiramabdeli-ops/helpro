import db, { saveDB } from '../database.js';

export class Message {
  static create({ id, bookingId, senderId, senderName, content }) {
    const message = {
      id,
      bookingId,
      senderId,
      senderName,
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };
    db.messages.push(message);
    saveDB();
    return message;
  }

  static findById(id) {
    return db.messages.find(m => m.id === id);
  }

  static getByBooking(bookingId, { limit = 100, offset = 0 } = {}) {
    return db.messages
      .filter(m => m.bookingId === bookingId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .slice(offset, offset + limit);
  }

  static getByUser(userId, { limit = 50, offset = 0 } = {}) {
    const userBookings = db.bookings
      .filter(b => b.customerId === userId || b.helperId === userId)
      .map(b => b.id);
    
    return db.messages
      .filter(m => userBookings.includes(m.bookingId))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(offset, offset + limit);
  }

  static markAsRead(id) {
    const message = db.messages.find(m => m.id === id);
    if (message) {
      message.read = true;
      saveDB();
    }
    return message;
  }

  static markBookingMessagesAsRead(bookingId, userId) {
    let count = 0;
    db.messages
      .filter(m => m.bookingId === bookingId && m.senderId !== userId)
      .forEach(m => {
        m.read = true;
        count++;
      });
    if (count > 0) saveDB();
    return count;
  }

  static delete(id) {
    const index = db.messages.findIndex(m => m.id === id);
    if (index !== -1) {
      db.messages.splice(index, 1);
      saveDB();
      return true;
    }
    return false;
  }
}
