import { remote } from 'electron';

const state = {
  windowState: remote.getCurrentWindow().isMaximized() ? 'maximized' : 'full-screen'
};

const mutations = {
  changeWindowState (state) {
    state.windowState = remote.getCurrentWindow().isMaximized() ? 'maximized' : 'full-screen';
  }
};

const actions = {
  async changeWindowState ({ commit }, payload) {
    await commit('changeWindowState', payload);
  }
};

export default {
  state,
  mutations,
  actions
};
