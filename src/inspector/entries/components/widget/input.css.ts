export default /* css */ `

.input-widget {
  width: 24px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}

.input-widget .background {
  position: absolute;
  overflow: hidden;
  inset: var(--input-vertical-padding, .1em) 0;
  border-radius: var(--input-border-radius, .25em);
  background-color: #fff2;
  border: var(--input-border, 1px solid #fff3);
  pointer-events: none;
}

.input-widget svg {
  display: none;
  position: absolute;
  inset: 4px;
  pointer-events: none;
}

.input-widget svg.active {
  display: block;
}

`
