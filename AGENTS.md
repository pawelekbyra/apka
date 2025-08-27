# Manifest Agenta dla Projektu "Ting Tong"

Witaj, agencie! Ten plik zawiera kluczowe informacje, które pomogą Ci w pracy nad tym projektem.

## 1. Opis Projektu

**Ting Tong** to aplikacja internetowa typu PWA (Progressive Web App) o charakterze medium społecznościowego, skupiona na pionowym przewijaniu krótkich materiałów wideo. Aplikacja jest budowana przez użytkownika, który nie jest programistą, przy wsparciu asystentów AI.

## 2. Architektura i Technologie

Aplikacja składa się z dwóch głównych części:

-   **Frontend:** Jednoplatformowa aplikacja PWA (Single Page Application).
    -   **Plik główny:** `index.html`
    -   **Style:** `assets/css/style.css`
    -   **Logika:** `assets/js/app.js` (jako moduł ES6, importujący inne moduły).
    -   **Moduły JS:** Logika jest podzielona na mniejsze moduły w katalogu `assets/js/modules/` (np. `api.js`, `ui.js`, `video.js`).
    -   **Frameworki:** Brak. Czysty JavaScript (ES6+), HTML5, CSS3.

-   **Backend:** Aplikacja jest zaprojektowana do działania w środowisku WordPress.
    -   **Plik główny:** `functions.php` (zawiera całą logikę backendu, w tym AJAX i REST API).
    -   **Baza Danych:** WordPress (użytkownicy, tabele niestandardowe np. dla polubień).
    -   **Integracja:** Frontend komunikuje się z backendem poprzez `admin-ajax.php` oraz niestandardowe endpointy REST API. Dane początkowe są przekazywane do frontendu za pomocą `wp_localize_script`.

## 3. Kluczowe Zasady Pracy

1.  **Struktura Kodu:** Zawsze utrzymuj kod CSS i JavaScript w osobnych plikach. Dąż do modularności kodu JS, dzieląc go na małe, wyspecjalizowane pliki.
2.  **Tryb Standalone:** Frontend (`index.html`) posiada wbudowany tryb "standalone", który używa danych-zaślepek (`mock data`), gdy nie jest uruchomiony w środowisku WordPress. Pozwala to na niezależne testowanie i rozwijanie interfejsu użytkownika. Zawsze upewnij się, że ten tryb pozostaje funkcjonalny.
3.  **Nazewnictwo:** Trzymaj się angielskich nazw dla funkcji, zmiennych i modułów, ale zachowaj polskie nazwy w tekstach widocznych dla użytkownika i komentarzach, jeśli to konieczne.
4.  **Weryfikacja:** Po każdej zmianie, zwłaszcza w `functions.php`, poinformuj użytkownika o konieczności przetestowania integracji w jego środowisku WordPress, ponieważ nie masz do niego bezpośredniego dostępu.

Twoim celem jest pomoc w rozwijaniu tej aplikacji, utrzymując jednocześnie kod czystym, zorganizowanym i łatwym do dalszego rozwoju.
