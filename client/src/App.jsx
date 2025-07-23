import { useState, useEffect } from 'react';
import './styles/App.css';
import Main from './components/Main';
import Header from './components/Header';
import Footer from './components/Footer';

export default function App() {
  return(
    <>
      <Header />
      <Main />
      <Footer />
    </>
  )
}