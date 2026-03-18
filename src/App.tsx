import { SplitPane } from './components/SplitPane'
import { Editor } from './components/Editor'
import { Preview } from './components/Preview'

function App() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900">
      <SplitPane
        left={<Editor />}
        right={<Preview />}
      />
    </div>
  )
}

export default App
