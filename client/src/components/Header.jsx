/**
 * Header - Application header component with logo and branding.
 * 
 * Displays TuneSwipe logo and title as a clickable link to home page.
 * Provides consistent branding across application pages.
 * Simple layout component with navigation functionality.
 * 
 * @returns {JSX.Element} Header with logo and app title
 */

import { FRONTEND_URL } from '../config';
import logoImg from '/src/assets/logo.png';
import '../styles/App.css';
import '../styles/Header.css';

export default function Header() {
    return (
        <a href={FRONTEND_URL} className="app-header">
            <div className="header-logo">
                <img src={logoImg} alt="TuneSwipe Logo" className="logo-img" />
                <h1 className="header-title">TuneSwipe</h1>
            </div>
        </a>
    )
} 