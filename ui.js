export default class UI {
  static getEl(id) {
    const element = document.getElementById(id);

    if (!element) {
      throw `Element "${id}" not found`;
    }

    return element;
  }

  static getFrag() {
    return document.createDocumentFragment();
  }
}