export default /* css */ `

.field-color input {
  width: 100%;
  height: 100%;
  opacity: 0;
}

.field-color .color-preview {
  position: absolute;
  inset: var(--input-vertical-padding, .1em) 0;
  border-radius: var(--input-border-radius, .25em);
  border: var(--input-border, 1px solid #fff3);
  background-color: var(--color-preview, #000);
  pointer-events: none;
}

.field-color.focused .color-preview {
  border: 1px solid var(--color-focus, #fff6);
}

`