import logo from './logo.svg';
import './App.css';
import NavBar from './components/NavBar';
import Carousel from './components/Carousel';
import Footer from './components/Footer';
import Carded from './components/Carded';

function App() {
  return (
    <div>
      <NavBar/>
      <Carousel/>
      <Carded/>
      <Footer/>
    </div>
  );
}

export default App;
