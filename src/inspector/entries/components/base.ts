import { DestroyableInstance } from 'some-utils-ts/misc/destroy'

export class FieldComponent extends DestroyableInstance {
  div = document.createElement('div')
}
