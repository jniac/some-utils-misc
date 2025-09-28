export default /* css */ `
.inspector {
  --entry-width: 280px;
  --entry-height: 24px;
  
  --label-width: 100px;
  
  --input-vertical-padding: .5px;
  --input-border-radius: .25em;
  --input-border: 1px solid #fff3;

  --opacity-dim: 0.6;
}

.inspector {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.inspector * {
  box-sizing: border-box;
  position: relative;
}

input {
  width: 100%;
  height: 100%;
  outline: none;
}

.inspector-header {
  display: flex;
  flex-direction: column;
  padding-bottom: .75em;
}

.inspector-content {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.inspector-fields {
  overflow: hidden scroll;
}

.inspector-title {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  flex: 1;
  cursor: grab;
  user-select: none;
}

.inspector-description {
  font-size: 12px;
  opacity: var(--opacity-dim);
}

.inspector-header .inspector-close {
  padding: 4px;
  cursor: pointer;
}

.inspector-entry {
  width: var(--entry-width);
  height: var(--entry-height);
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 12px;
}

.field {
  display: flex;
  flex-direction: row;
  gap: 2px;
  align-items: center;
}

.field.focused {
  opacity: 1;
}

.field input {
  padding: 0 0.5em;
}

.field > .label-wrapper {
  flex: 0 0 var(--label-width);

  display: flex;
  gap: 1px;

  overflow: hidden;
}

.field > .label-wrapper > *:first-child {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  user-select: none;
}

/* This is hacky and must be rewritten */
.field > .label-wrapper > *:not(:first-child) {
  cursor: pointer;
  flex: 0 0 16px;
  opacity: var(--opacity-dim);
}
.field > .label-wrapper > *:not(:first-child):hover {
  opacity: 1;
}

.field > .label-wrapper.field-label-drag {
  cursor: ew-resize;
}

.field .input-wrapper {
  overflow: hidden;
  flex: 1;
  align-self: stretch;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1px;
}

.field-separator {
  height: 1px;
}

.field-separator.between-fields {
  width: var(--label-width);
  align-self: flex-start;
  background-color: #fff1;
}
`
