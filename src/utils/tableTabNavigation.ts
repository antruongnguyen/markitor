import { keymap } from '@codemirror/view'
import { EditorSelection } from '@codemirror/state'
import { parseTableAtCursor, getNextCellPosition, selectCellContent } from './tableUtils'

/**
 * CodeMirror extension that intercepts Tab/Shift-Tab inside markdown tables
 * to navigate between cells instead of inserting tab characters.
 */
export function tableTabNavigation() {
  return keymap.of([
    {
      key: 'Tab',
      run(view) {
        const table = parseTableAtCursor(view)
        if (!table) return false

        const nextPos = getNextCellPosition(view, table, 'forward')
        if (nextPos === null) return false

        // Re-parse after potential position to get target row/col
        // For now, just place cursor at the cell position
        view.dispatch({
          selection: EditorSelection.single(nextPos),
          scrollIntoView: true,
        })

        // Try to select cell content
        const newTable = parseTableAtCursor(view)
        if (newTable) {
          const cell = selectCellContent(
            view,
            newTable,
            newTable.cursorRow,
            newTable.cursorCol,
          )
          if (cell && cell.from !== cell.to) {
            view.dispatch({
              selection: EditorSelection.single(cell.from, cell.to),
            })
          }
        }

        return true
      },
    },
    {
      key: 'Shift-Tab',
      run(view) {
        const table = parseTableAtCursor(view)
        if (!table) return false

        const prevPos = getNextCellPosition(view, table, 'backward')
        if (prevPos === null) return false

        view.dispatch({
          selection: EditorSelection.single(prevPos),
          scrollIntoView: true,
        })

        // Try to select cell content
        const newTable = parseTableAtCursor(view)
        if (newTable) {
          const cell = selectCellContent(
            view,
            newTable,
            newTable.cursorRow,
            newTable.cursorCol,
          )
          if (cell && cell.from !== cell.to) {
            view.dispatch({
              selection: EditorSelection.single(cell.from, cell.to),
            })
          }
        }

        return true
      },
    },
  ])
}
