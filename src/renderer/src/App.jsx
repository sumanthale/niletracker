import ClockPanel from './components/ClockPanel'

function App() {
  return (
    <>
      <Header />
      <ClockPanel />
    </>
  )
}

export default App
function Header() {
  return (
    <header>
      <button id="close" onClick={() => window.electron.sendFrameAction('CLOSE')} className="group">
        <img
          src="https://cdn-icons-png.flaticon.com/128/9068/9068699.png"
          alt="close"
          className="h-4 opacity-0 group-hover:opacity-100"
        />
      </button>
      <button
        id="minimize"
        className="group"
        onClick={() => window.electron.sendFrameAction('MINIMIZE')}
      >
        <img
          src="https://cdn-icons-png.flaticon.com/128/10629/10629637.png"
          alt="close"
          className="h-4 opacity-0 group-hover:opacity-100"
        />
      </button>
      <button
        id="maximize"
        className="group"
        onClick={() => window.electron.sendFrameAction('MAXIMIZE')}
      >
        <img
          src="https://cdn-icons-png.flaticon.com/128/5423/5423925.png"
          alt="maximize"
          className="h-4 opacity-0 group-hover:opacity-100"
        />
      </button>
    </header>
  )
}
