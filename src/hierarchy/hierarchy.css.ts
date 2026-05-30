export default /* css */ `
.HierarchyView {
  --entry-height: 16px;
  --entry-gap: 2px;
  
  width: 100%;
  height: 100%;
  overflow: scroll;

  font-size: calc(var(--entry-height) * 0.8);

  color: var(--foreground);

  display: flex;
  flex-direction: column;
  gap: 2px;

  scrollbar-width: none;
}

.HierarchyView::-webkit-scrollbar {
  display: none;
}

.HierarchyView .entry {
  flex: 0 0 var(--entry-height);
  line-height: var(--entry-height);

  display: flex;
  flex-direction: row;
  align-items: center;
  gap: calc(var(--entry-height) / 4);

  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  user-select: none;

  cursor: pointer;
}

.HierarchyView .entry:hover {
  background-color: color-mix(in srgb, var(--foreground) 10%, transparent);
}

.HierarchyView .entry.selected {
  background-color: color-mix(in srgb, var(--foreground) 20%, transparent);
}

.HierarchyView .entry .expand-toggle {
  display: inline-block;
  flex: 0 0 var(--entry-height);
  height: var(--entry-height);
  line-height: var(--entry-height);
  text-align: center;
  cursor: pointer;
  background-color: var(--foreground);
  mask-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWNoZXZyb24tcmlnaHQtaWNvbiBsdWNpZGUtY2hldnJvbi1yaWdodCI+PHBhdGggZD0ibTkgMTggNi02LTYtNiIvPjwvc3ZnPg==');
}

.HierarchyView .entry .expand-toggle.expanded {
  transform: rotate(90deg);
}

.HierarchyView .entry .expand-toggle.empty {
  mask-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWRvdC1pY29uIGx1Y2lkZS1kb3QiPjxjaXJjbGUgY3g9IjEyLjEiIGN5PSIxMi4xIiByPSIxIi8+PC9zdmc+');
}

.HierarchyView .entry .name {
  flex: 0 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
}
`