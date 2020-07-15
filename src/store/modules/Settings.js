import { ipcRenderer } from 'electron';
import { set } from 'lodash';

let store = {}, state, mutations, actions;

state = {
  config: store
};

mutations = {
  updateStore (state, store) {
    if (!store['theme']) {
      store.theme = 'dark';
      ipcRenderer.send('store:set', 'theme', store.theme);
    }
    state.config = store;
  },
  setStore (state, { key, value }) {
    ipcRenderer.send('store:set', key, value);
    set(state.config, key, value);
  },
};

actions = {
  async updateStore ({ commit }, payload) {
    await commit('updateStore', payload);
  },
  async setStore ({ commit }, { key, value }) {
    await commit('setStore', key, value);
  },
};

export default {
  state,
  mutations,
  actions
};
