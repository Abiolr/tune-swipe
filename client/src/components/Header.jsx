// Header.jsx
import { FRONTEND_URL } from '../config';
import '../styles/App.css';
import '../styles/Header.css';

export default function Header() {
    return (
        <a href={FRONTEND_URL} className="app-header">
            <div className="header-logo">
                <img src="/src/assets/logo.png" alt="TuneSwipe Logo" className="logo-img" />
                <h1 className="header-title">TuneSwipe</h1>
            </div>
        </a>
    )
}