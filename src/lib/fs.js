import del from 'del';
import trash from 'trash';
import Store from 'electron-store';

const store = new Store();

export const rmdir = store.get('repo.removeToTrash') ? trash : del;