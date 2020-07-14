'use strict';

import {
  app,
  remote
} from 'electron';
import path from 'path';
import datastore from 'nedb-promises';

const dbPath = path.join((app || remote.app).getPath('userData'), 'library.db');
const db = datastore.create(dbPath);

db.ensureIndex({ fieldName: 'slug', unique: true })
  .catch(err => console.error('ensureIndex err', err));

export class DbUtils {
  constructor (options = {}) {
    const opt = {
      dbDir: dbPath
    };

    this.options = Object.assign({}, opt, options);
    this.db = db;
  }

  async insert (repoObj) {
    if (repoObj.slug === '/') {
      return await null;
    }
    return await this.db.insert(repoObj);
  }

  async update (updateQuery, repoUpdate, updateType = 'updatedAt') {
    return await this.db.update(
      updateQuery,
      { $set: Object.assign({}, repoUpdate, { [updateType]: new Date() }) }
    );
  }

  updateById (updateId, repoUpdate, updateType) {
    return this.update({ _id: updateId }, repoUpdate, updateType);
  }

  updateBySlug (updateSlug, repoUpdate, updateType) {
    return this.update({ slug: updateSlug }, repoUpdate, updateType);
  }

  async remove (removeQuery) {
    return await this.db.remove(removeQuery, {});
  }

  async removeById (removeId) {
    return await this.remove({ _id: removeId });
  }

  async get (findQuery = {}, sortOptions = { checkedAt: -1, updatedAt: -1, createdAt: -1 }) {
    return await this.db
      .find(findQuery)
      .sort(sortOptions)
  }
}

export default function (opts) {
  return new DbUtils(opts);
}
