const state = {
  list: []
};

const mutations = {
  resetList (state, list) {
    state.list = [];
    state.list = state.list.concat(list);
  },
  addRepo (state, repo) {
    state.list.unshift(repo);
  },
  removeRepo (state, repo) {
    const repoIndex = findIndex(repo);
    state.list.splice(repoIndex, 1);
  },
  updateRepo (state, repo) {
    const repoIndex = findIndex(repo);
    const repoUpdate = Object.assign({}, state.list[repoIndex], repo);
    state.list.splice(repoIndex, 1, repoUpdate);
  },
  updateProgress (state, repo) {
    const repoIndex = findIndex(repo);
    const repoUpdate = Object.assign({}, state.list[repoIndex], repo);
    state.list.splice(repoIndex, 1, repoUpdate);
  },
  finishProgress (state, repo) {
    const repoIndex = findIndex(repo);
    repo.receivingObjectsPercent = 100;
    repo.resolvingDeltasPercent = 100;
    const repoUpdate = Object.assign({}, state.list[repoIndex], repo);
    state.list.splice(repoIndex, 1, repoUpdate);
  }
};

const actions = {
  resetList ({ commit }, payload) {
    commit('resetList', payload);
  },
  addRepo ({ commit }, payload) {
    commit('addRepo', payload);
  },
  removeRepo ({ commit }, payload) {
    commit('removeRepo', payload);
  },
  updateRepo ({ commit }, payload) {
    commit('updateRepo', payload);
  },
  updateProgress ({ commit }, payload) {
    commit('updateProgress', payload);
  },
  finishProgress ({ commit }, payload) {
    commit('finishProgress', payload);
  }
};

function findIndex (repo) {
  return state.list.findIndex((element) => {
    return element._id === repo._id;
  });
}

export default {
  state,
  mutations,
  actions
};
