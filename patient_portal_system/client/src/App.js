import axios from 'axios';
import './App.css';

const PORT = 8080;

function App() {
  const apiCall = () => {
    axios.get(`http://localhost:${PORT}`).then((data) => {
      console.log(data.data); // looks weird, but it returns an object with data as the content parameters
    });
  }

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={apiCall}>Make API Call</button>
      </header>
    </div>
  );
}

export default App;
