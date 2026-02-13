import './styles/index.css';
import { initApp } from './grid/SpreadsheetApp';

document.addEventListener('DOMContentLoaded', () => {
    initApp().catch(err => {
        console.error('Failed to initialize spreadsheet:', err);
    });
});
