import { DestroyableInstance } from 'some-utils-ts/misc/destroy'


export class InspectorDomEntry extends DestroyableInstance {
  /**
   * Unique identifier for the entry.
   * This is used to differentiate between different entries in the inspector.
   */
  static #nextId = 0;

  static css = /* css */` 
    .inspector-entry {
      width: var(--entry-width);
      height: var(--entry-height);
      display: flex;
      flex-direction: row;
      align-items: center;
      font-size: 12px;
      opacity: var(--opacity-dim);
    }
    
    .inspector-entry:hover {
      opacity: 1;
    }
  `;

  readonly id = InspectorDomEntry.#nextId++;

  div = document.createElement('div');

  constructor() {
    super()
    this.div.classList.add('inspector-entry')
  }
}
