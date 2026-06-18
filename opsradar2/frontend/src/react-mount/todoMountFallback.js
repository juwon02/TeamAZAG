export function restoreVanillaTodo({ container, originalHtml, root }) {
  window.opsRadarReactTodoMounted = false

  try {
    root?.unmount()
  } catch (error) {
    console.warn('Todo React root cleanup failed', error)
  }

  container.innerHTML = originalHtml
  window.renderTodos?.()

  const selectedTodoId = window.G?.selectedTodoId
  if (selectedTodoId !== null && selectedTodoId !== undefined) {
    window.renderTodoDetail?.(selectedTodoId)
  }
}
