export default /* css */ `

.slider {
  position: absolute;
  overflow: hidden;
  inset: var(--input-vertical-padding, .1em) 0;
  border-radius: var(--input-border-radius, .25em);
  border: var(--input-border, 1px solid #fff3);
  pointer-events: none;
}

.slider.drag-mode {
  pointer-events: all;
  cursor: ew-resize;
}

.slider .fill {
  position: absolute;
  top: 0;
  left: 0;
  width: calc(100% * var(--slider-alpha, 0));
  height: 100%;
  background-color: var(--slider-background, #fff1);
}

.slider.slider-fill-none .fill {
  display: none;
}

.slider .head {
  position: absolute;
  top: 0;
  left: calc(100% * var(--slider-alpha, 0) - 5px / 2);
  width: 5px;
  height: 100%;
  pointer-events: all;
  cursor: ew-resize;
}

.slider .head::before {
  content: '';
  position: absolute;
  top: 0;
  left: calc((5px - 1px) / 2);
  width: 1px;
  height: 100%;
  background-color:#fff3;
}

`