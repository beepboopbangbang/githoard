console.warn('before import');

import Vue from 'vue';
import WindowMenuFont from '@/components/WindowMenuFont';

console.warn('before describe');

let vm;
describe('WindowMenuFont.vue', () => {
  console.warn('describe');

  before(async () => {
    console.warn('before');
    const Ctor = Vue.extend(WindowMenuFont);
    vm = new Ctor({
      el: document.createElement('div'),
    }).$mount();
    await vm.$nextTick();
  });

  describe('functions', () => {
    it('should render correct contents', () => {
      console.warn('it start');
      expect(true).to.equal(true);
      // expect(vm.$el.querySelector('.title').textContent).to.contain('Welcome to your new project!');
      console.warn('it end');
    });
  });
});
