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

/**
 * ECharts mesure le texte des axes avec un canvas 2D, que jsdom n'implémente
 * pas : sans ce bouchon, chaque graphique monté inonde la sortie de tests.
 * Seules les méthodes utilisées pour mesurer et dessiner sont fournies.
 */
if (typeof HTMLCanvasElement !== 'undefined') {
  const noop = () => undefined
  HTMLCanvasElement.prototype.getContext = function getContext(kind: string) {
    if (kind !== '2d') return null
    return {
      measureText: (text: string) => ({ width: text.length * 6 }),
      fillText: noop,
      strokeText: noop,
      save: noop,
      restore: noop,
      beginPath: noop,
      closePath: noop,
      moveTo: noop,
      lineTo: noop,
      stroke: noop,
      fill: noop,
      clearRect: noop,
      setTransform: noop,
      scale: noop,
      translate: noop,
      createLinearGradient: () => ({ addColorStop: noop }),
    } as unknown as CanvasRenderingContext2D
  } as typeof HTMLCanvasElement.prototype.getContext
}
