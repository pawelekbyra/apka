Manifest Agenta dla Projektu "Ting Tong"

Witaj, agencie! Ten plik zawiera kluczowe informacje, które pomogą Ci w pracy nad tym projektem.

1. Opis Projektu

Ting Tong to aplikacja internetowa typu PWA (Progressive Web App) o charakterze medium społecznościowego, skupiona na pionowym przewijaniu krótkich materiałów wideo. Pracujemy nad tym, aby aplikacja na urządzeniach z Androidem mogła działać również jako natywna APK poprzez WebView — czyli w praktyce otwierając tę samą stronę www w formie aplikacji mobilnej.

Użytkownicy będą mogli:

instalować Ting Tong bezpośrednio na ekranie głównym telefonu jako PWA,

lub pobierać wersję APK na Androida, korzystając z tej samej funkcjonalności i treści.

Projekt rozwijany jest w taki sposób, aby feed wideo był prosty, responsywny i działał wyłącznie na urządzeniach mobilnych.

2. Architektura i Technologie

Aplikacja składa się z dwóch głównych części:

Frontend: Jednoplatformowa aplikacja PWA (Single Page Application)

Plik główny: index.html

Style: assets/css/style.css

Logika: assets/js/app.js (moduł ES6, importujący inne moduły)

Moduły JS: Logika jest podzielona na mniejsze moduły w katalogu assets/js/modules/ (np. api.js, ui.js, video.js)

Frameworki: Brak. Czysty JavaScript (ES6+), HTML5, CSS3

Backend: Minimalistyczny motyw WordPress

Plik główny: functions.php (zawiera całą logikę backendu, w tym AJAX i REST API)

Baza danych: WordPress (użytkownicy, tabele niestandardowe np. dla polubień)

Integracja: Frontend komunikuje się z backendem poprzez admin-ajax.php oraz niestandardowe endpointy REST API. Dane początkowe przekazywane są do frontendu za pomocą wp_localize_script.

Cel długoterminowy: Projektujemy system tak, aby w przyszłości backend mógł zostać przeniesiony na inne środowiska, np. Firebase, bez konieczności przebudowy frontend
