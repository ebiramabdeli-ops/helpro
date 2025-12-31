import db, { saveDB } from '../database.js';
import bcrypt from 'bcryptjs';

export class User {
  static create({ id, name, email, password, role, avatar = null }) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = {
      id,
      name,
      email,
      password: hashedPassword,
      role,
      avatar,
      rating: 0,
      review_count: 0,
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
    saveDB();
    return this.findById(id);
  }

  static findById(id) {
    const user = db.users.find(u => u.id === id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  }

  static findByEmail(email) {
    return db.users.find(u => u.email === email);
  }

  static verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  static update(id, { name, avatar }) {
    const user = db.users.find(u => u.id === id);
    if (!user) return null;
    
    if (name) user.name = name;
    if (avatar !== undefined) user.avatar = avatar;
    
    saveDB();
    return this.findById(id);
  }

  static updateRating(userId, newRating) {
    const user = db.users.find(u => u.id === userId);
    if (user) {
      user.rating = (user.rating * user.review_count + newRating) / (user.review_count + 1);
      user.review_count += 1;
      saveDB();
    }
  }

  static getAll({ role = null, limit = 50, offset = 0 } = {}) {
    let users = db.users;
    
    if (role) {
      users = users.filter(u => u.role === role);
    }
    
    return users
      .slice(offset, offset + limit)
      .map(({ password, ...user }) => user);
  }
}
