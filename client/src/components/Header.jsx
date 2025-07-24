import '../styles/App.css';
import '../styles/Header.css';

export default function Header() {
    return (
        <a href='http://localhost:5173/' className="app-header">
            <div className="header-logo">
                <img src="/src/assets/logo.png" alt="TuneSwipe Logo" className="logo-img" />
                <h1 className="header-title">TuneSwipe</h1>
            </div>
        </a>
    )
}