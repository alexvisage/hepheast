/**
 * Préparation commune des tests de composants.
 *
 * jsdom reflète l'attribut `open` de <dialog> mais n'implémente ni `show()`,
 * ni `showModal()`, ni `close()`. Les composants de l'application s'appuient
 * sur le dialogue natif (piège du focus, Échap, fond inerte) : ces méthodes
 * sont donc simulées ici, au plus près du comportement du navigateur.
 */
const prototype = HTMLDialogElement.prototype

if (typeof prototype.showModal !== 'function') {
  const open = function (this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  prototype.show = open
  prototype.showModal = open
  prototype.close = function (this: HTMLDialogElement, returnValue?: string) {
    if (!this.open) return
    this.removeAttribute('open')
    if (returnValue !== undefined) this.returnValue = returnValue
    this.dispatchEvent(new Event('close'))
  }
}
