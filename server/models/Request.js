import db, { saveDB } from '../database.js';

export class Request {
  static create({ id, customerId, customerName, title, description, category, budget, location, scheduledDate = null }) {
    const request = {
      id,
      customerId,
      customerName,
      title,
      description,
      category,
      budget,
      location,
      scheduledDate,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    db.requests.push(request);
    saveDB();
    return request;
  }

  static findById(id) {
    return db.requests.find(r => r.id === id);
  }

  static getAll({ customerId = null, status = null, category = null, limit = 50, offset = 0 } = {}) {
    let requests = db.requests;
    
    if (customerId) {
      requests = requests.filter(r => r.customerId === customerId);
    }
    if (status) {
      requests = requests.filter(r => r.status === status);
    }
    if (category) {
      requests = requests.filter(r => r.category === category);
    }
    
    return requests
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(offset, offset + limit);
  }

  static updateStatus(id, status) {
    const request = db.requests.find(r => r.id === id);
    if (request) {
      request.status = status;
      saveDB();
    }
    return this.findById(id);
  }

  static update(id, { title, description, budget, location, scheduledDate }) {
    const request = db.requests.find(r => r.id === id);
    if (!request) return null;
    
    if (title) request.title = title;
    if (description) request.description = description;
    if (budget !== undefined) request.budget = budget;
    if (location) request.location = location;
    if (scheduledDate !== undefined) request.scheduledDate = scheduledDate;
    
    saveDB();
    return request;
  }

  static delete(id) {
    const index = db.requests.findIndex(r => r.id === id);
    if (index !== -1) {
      db.requests.splice(index, 1);
      saveDB();
      return true;
    }
    return false;
  }
}
