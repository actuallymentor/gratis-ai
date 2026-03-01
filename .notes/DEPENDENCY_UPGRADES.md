# Major Dependency Upgrade Research (Feb 2026)

Research for upgrading 9 major dependencies. See conversation for full details.

## Summary

| Dependency | From | To | Effort | Key Risk |
|:-----------|:-----|:---|:-------|:---------|
| @vitejs/plugin-react | ^4 | ^5 | Low | Node 20+ required, resolve.dedupe no longer auto-configured |
| eslint | ^9 | ^10 | Low-Medium | Config file lookup changed, new recommended rules |
| react | ^18 | ^19 | Medium-High | Removed APIs (forwardRef optional, PropTypes gone, string refs gone) |
| react-dom | ^18 | ^19 | Medium-High | ReactDOM.render removed, error handling changed |
| react-markdown | ^9 | ^10 | Low | Only className prop removed |
| react-router-dom | ^6 | ^7 | Medium | Package renamed to react-router, future flags needed first |
| uuid | ^9 | ^13 | Low-Medium | CommonJS removed (v12), browser exports default (v13) |
| vite | ^5 | ^7 | Medium | Two major jumps, Node 20+, Sass legacy API removed, Rolldown replaces esbuild |
| vite-plugin-pwa | ^0.21 | ^1.2 | Low | Mainly Vite 7 compatibility, workbox 7.3.0 |

## Recommended Upgrade Order

1. vite ^5 -> ^7 (foundation — everything depends on this)
2. @vitejs/plugin-react ^4 -> ^5 (must match vite)
3. vite-plugin-pwa ^0.21 -> ^1.2 (must match vite)
4. eslint ^9 -> ^10 (independent)
5. uuid ^9 -> ^13 (independent, low risk)
6. react-markdown ^9 -> ^10 (independent, trivial)
7. react + react-dom ^18 -> ^19 (biggest change, do together)
8. react-router-dom ^6 -> ^7 (after React 19, enable future flags first)
