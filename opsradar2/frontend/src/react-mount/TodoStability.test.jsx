import { StrictMode } from 'react'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { readFileSync } from 'fs'
import path from 'path'
import TodoScreen from './TodoScreen.jsx'
import {
  getPageTodos,
  getTodoSnapshot,
  pageCount,
  setTodoSearchFieldValue,
  setTodoSearchValue,
  setTodoTab,
} from './todoStateAdapter.js'
import { restoreVanillaTodo } from './todoMountFallback.js'

function todo(id, overrides = {}) {
  return {
    id,
    title: `Todo ${id}`,
    description: `Description ${id}`,
    status: 'approved',
    priority: 'medium',
    assignee: '김희진',
    createdAt: `2026-06-${String(id).padStart(2, '0')}`,
    updatedAt: `2026-06-${String(id).padStart(2, '0')}`,
    grounds: [],
    ...overrides,
  }
}

function createSharedState(todos = [todo(1)]) {
  return {
    todos,
    viewMode: 'table',
    G: {
      currentTodoTab: 'inprogress',
      selectedTodoId: null,
      todoChecked: {},
      todoSearch: { ai: '', inprogress: '', done: '', rejected: '' },
      todoSearchField: { ai: 'all', inprogress: 'all', done: 'all', rejected: 'all' },
      todoPage: { ai: 1, inprogress: 1, done: 1, rejected: 1 },
    },
  }
}

function installBridge(shared) {
  const bridge = {
    getSnapshot: jest.fn(() => ({
      todos: shared.todos.map((item) => ({ ...item })),
      G: {
        ...shared.G,
        todoChecked: { ...shared.G.todoChecked },
        todoSearch: { ...shared.G.todoSearch },
        todoSearchField: { ...shared.G.todoSearchField },
        todoPage: { ...shared.G.todoPage },
      },
      viewMode: shared.viewMode,
    })),
    setTab: jest.fn((tab) => {
      shared.G.currentTodoTab = tab
      shared.G.todoPage[tab] = Math.max(1, shared.G.todoPage[tab] || 1)
      shared.G.selectedTodoId = null
    }),
    setViewMode: jest.fn((mode) => {
      shared.viewMode = mode
    }),
    setSearch: jest.fn((value) => {
      shared.G.todoSearch[shared.G.currentTodoTab] = value
      shared.G.todoPage[shared.G.currentTodoTab] = 1
    }),
    setSearchField: jest.fn((value) => {
      shared.G.todoSearchField[shared.G.currentTodoTab] = value
      shared.G.todoPage[shared.G.currentTodoTab] = 1
    }),
    setPage: jest.fn((page) => {
      shared.G.todoPage[shared.G.currentTodoTab] = Math.max(1, Number(page) || 1)
    }),
    selectTodo: jest.fn((id) => {
      shared.G.selectedTodoId = id
    }),
    toggleCheck: jest.fn((id, checked) => {
      shared.G.todoChecked[id] = checked
    }),
    toggleAll: jest.fn((ids, checked) => {
      ids.forEach((id) => {
        shared.G.todoChecked[id] = checked
      })
    }),
  }
  window.opsRadarTodoBridge = bridge
  window.G = shared.G
  return bridge
}

function loadTodoCompatHelpers() {
  const source = readFileSync(
    path.resolve(process.cwd(), 'public/static/js/app.js'),
    'utf8',
  )
  const match = source.match(/\/\* TODO_COMPAT_HELPER_START \*\/([\s\S]*?)\/\* TODO_COMPAT_HELPER_END \*\//)
  if (!match) throw new Error('Todo compatibility helper not found')
  // app.js 전체를 실행하지 않고 폴백 분기 헬퍼만 평가한다.
  // eslint-disable-next-line no-new-func
  return new Function(`${match[1]}; return { createTodoCompatDispatcher, createTodoCompatActions };`)()
}

afterEach(() => {
  cleanup()
  delete window.getFilteredTodos
  delete window.opsRadarTodoBridge
  delete window.opsRadarReactTodoMounted
  delete window.G
  localStorage.removeItem('opsradar_react_todo')
})

test('Todo snapshot is read through the bridge', () => {
  const shared = createSharedState([todo(1), todo(2)])
  installBridge(shared)

  expect(getTodoSnapshot()).toMatchObject({
    todos: [{ id: 1 }, { id: 2 }],
    activeTab: 'inprogress',
    viewMode: 'table',
  })
})

test('React tab changes mutate shared state once and emit one refresh', () => {
  const shared = createSharedState()
  shared.G.todoPage.done = 3
  const bridge = installBridge(shared)
  const refresh = jest.fn()
  window.addEventListener('opsradar:todo-refresh', refresh)

  setTodoTab('done')

  expect(bridge.setTab).toHaveBeenCalledTimes(1)
  expect(bridge.setTab).toHaveBeenCalledWith('done')
  expect(shared.G.todoPage.done).toBe(3)
  expect(refresh).toHaveBeenCalledTimes(1)
  window.removeEventListener('opsradar:todo-refresh', refresh)
})

test('search value and field reset only the active tab page', () => {
  const shared = createSharedState()
  shared.G.todoPage.inprogress = 4
  shared.G.todoPage.done = 2
  const bridge = installBridge(shared)

  setTodoSearchValue('지연')
  expect(bridge.setSearch).toHaveBeenCalledTimes(1)
  expect(shared.G.todoPage.inprogress).toBe(1)
  expect(shared.G.todoPage.done).toBe(2)

  shared.G.todoPage.inprogress = 3
  setTodoSearchFieldValue('assignee')
  expect(bridge.setSearchField).toHaveBeenCalledTimes(1)
  expect(shared.G.todoPage.inprogress).toBe(1)
  expect(shared.G.todoPage.done).toBe(2)
})

test('external tab and select events refresh React without mutating shared state again', async () => {
  const shared = createSharedState([
    todo(1),
    todo(2, { status: 'done' }),
  ])
  const bridge = installBridge(shared)
  render(
    <StrictMode>
      <TodoScreen />
    </StrictMode>,
  )
  await waitFor(() => expect(window.opsRadarReactTodoMounted).toBe(true))
  bridge.setTab.mockClear()
  bridge.selectTodo.mockClear()

  shared.G.currentTodoTab = 'done'
  act(() => {
    window.dispatchEvent(new CustomEvent('opsradar:todo-tab-change', { detail: { tabId: 'done' } }))
  })
  await waitFor(() => {
    expect(screen.getByText(/완료/, { selector: '[data-todo-tab="done"]' })).toHaveClass('active')
  })
  expect(bridge.setTab).not.toHaveBeenCalled()

  shared.G.selectedTodoId = 2
  act(() => {
    window.dispatchEvent(new CustomEvent('opsradar:todo-select', { detail: { id: 2 } }))
  })
  expect(await screen.findByText('우선순위')).toBeInTheDocument()
  expect(bridge.selectTodo).not.toHaveBeenCalled()
})

test('StrictMode setup-cleanup-setup leaves the Todo mount flag true', async () => {
  const shared = createSharedState()
  installBridge(shared)
  const view = render(
    <StrictMode>
      <TodoScreen />
    </StrictMode>,
  )

  await waitFor(() => expect(window.opsRadarReactTodoMounted).toBe(true))
  view.unmount()
  expect(window.opsRadarReactTodoMounted).toBe(false)
})

test('out-of-range page immediately renders the clamped page and syncs shared state once', async () => {
  const shared = createSharedState([todo(1), todo(2), todo(3)])
  shared.G.todoPage.inprogress = 2
  const bridge = installBridge(shared)

  render(
    <StrictMode>
      <TodoScreen />
    </StrictMode>,
  )

  expect(screen.getAllByText('Todo 3').length).toBeGreaterThan(0)
  await waitFor(() => expect(shared.G.todoPage.inprogress).toBe(1))
  expect(bridge.setPage).toHaveBeenCalledTimes(1)
  expect(getPageTodos(shared.todos, 1)).toHaveLength(3)
  expect(pageCount(shared.todos.length)).toBe(1)
})

test('empty Todo results keep the shared page at one without a correction loop', async () => {
  const shared = createSharedState([])
  shared.G.todoPage.inprogress = 2
  const bridge = installBridge(shared)

  render(
    <StrictMode>
      <TodoScreen />
    </StrictMode>,
  )

  expect(screen.getByText('아직 Todo가 없습니다')).toBeInTheDocument()
  await waitFor(() => expect(shared.G.todoPage.inprogress).toBe(1))
  expect(bridge.setPage).toHaveBeenCalledTimes(1)
  expect(pageCount(0)).toBe(1)
})

test('compat dispatcher calls vanilla renderers unless React Todo is actually mounted', () => {
  const { createTodoCompatDispatcher: createDispatcher } = loadTodoCompatHelpers()
  const reactRenderer = jest.fn(() => 'react')
  const vanillaRenderer = jest.fn(() => 'vanilla')
  const dispatch = createDispatcher(() => window.opsRadarReactTodoMounted === true)

  delete window.opsRadarReactTodoMounted
  expect(dispatch(reactRenderer, vanillaRenderer, ['missing'])).toBe('vanilla')
  expect(vanillaRenderer).toHaveBeenCalledWith('missing')

  vanillaRenderer.mockClear()
  localStorage.setItem('opsradar_react_todo', 'off')
  window.opsRadarReactTodoMounted = false
  expect(dispatch(reactRenderer, vanillaRenderer, ['off'])).toBe('vanilla')
  expect(vanillaRenderer).toHaveBeenCalledWith('off')
  expect(reactRenderer).not.toHaveBeenCalled()

  vanillaRenderer.mockClear()
  window.opsRadarReactTodoMounted = true
  expect(dispatch(reactRenderer, vanillaRenderer, ['mounted'])).toBe('react')
  expect(reactRenderer).toHaveBeenCalledTimes(1)
  expect(vanillaRenderer).not.toHaveBeenCalled()
})

test('external Todo compatibility actions mutate tab and selection once before notifying React', () => {
  const { createTodoCompatActions } = loadTodoCompatHelpers()
  const state = {
    currentTodoTab: 'inprogress',
    selectedTodoId: 7,
    todoSearch: { inprogress: '', done: '' },
    todoSearchField: { inprogress: 'all', done: 'all' },
    todoPage: { inprogress: 2, done: 3 },
  }
  const emit = jest.fn()
  const setViewMode = jest.fn()
  const actions = createTodoCompatActions({ state, emit, setViewMode })

  actions.switchTab('done')
  expect(state.currentTodoTab).toBe('done')
  expect(state.todoPage.done).toBe(3)
  expect(state.selectedTodoId).toBeNull()
  expect(emit).toHaveBeenCalledTimes(1)
  expect(emit).toHaveBeenLastCalledWith('opsradar:todo-tab-change', { tabId: 'done' })

  emit.mockClear()
  actions.select(11)
  expect(state.selectedTodoId).toBe(11)
  expect(emit).toHaveBeenCalledTimes(1)
  expect(emit).toHaveBeenLastCalledWith('opsradar:todo-select', { id: 11 })
})

test('vanilla HTML restoration clears the mount flag and invokes Todo vanilla entry points', () => {
  render(<div data-testid="todo-container"><div>React content</div></div>)
  const container = screen.getByTestId('todo-container')
  const root = { unmount: jest.fn() }
  window.opsRadarReactTodoMounted = true
  window.G = { selectedTodoId: 7 }
  window.renderTodos = jest.fn()
  window.renderTodoDetail = jest.fn()

  restoreVanillaTodo({
    container,
    originalHtml: '<div id="todoBody">Vanilla content</div>',
    root,
  })

  expect(window.opsRadarReactTodoMounted).toBe(false)
  expect(root.unmount).toHaveBeenCalledTimes(1)
  expect(container).toHaveTextContent('Vanilla content')
  expect(window.renderTodos).toHaveBeenCalledTimes(1)
  expect(window.renderTodoDetail).toHaveBeenCalledWith(7)
})
