import { describe, it, expect } from 'vitest';
import axios from 'axios';
import { StatusCodes } from 'http-status-codes';
import { getPasswordHash } from '../../src/utils/crypto/hash';
import { config } from 'dotenv';
config();

// Konfiguracja klienta API
const api = axios.create({
    baseURL: 'http://localhost:5000',
    withCredentials: true,
    validateStatus: (status) => status < 500 // Nie odrzucaj odpowiedzi z kodem błędu HTTP
});

// Stałe z pliku konfiguracyjnego lub zmiennych środowiskowych
const SALT = process.env.SALT || 'test_salt';
const PEPPER = process.env.PEPPER || 'test_pepper';

// Dane testowe z unikalnym identyfikatorem
const timestamp = Date.now();
const testUser = {
    username: `testuser_${timestamp}`,
    email: `test_${timestamp}@example.com`,
    password: 'TestPassword123!'
};

// Zmienne do przechowywania danych między testami
let authToken: string;
let userId: string;
let cookie;

// Testy dla endpointów uwierzytelniania
describe('Endpointy uwierzytelniania', () => {
    it('powinien zwrócić pomyślny wynik dla testu API', async () => {
        const response = await api.get('/auth/test');

        expect(response.status).toBe(StatusCodes.OK);
        expect(response.data).toHaveProperty('message');
    });

    it('powinien zarejestrować nowego użytkownika', async () => {
        const response = await api.post('/auth/register', testUser);

        expect(response.status).toBe(StatusCodes.CREATED);
        expect(response.data.success).toBe(true);
        expect(response.data).toHaveProperty('message');
    });

    it('powinien odrzucić rejestrację z istniejącym użytkownikiem', async () => {
        const response = await api.post('/auth/register', testUser);
        expect(response.status).toBe(StatusCodes.CONFLICT);
        expect(response.data.success).toBe(false);
    });

    it('powinien zalogować się poprawnymi danymi', async () => {
        const data = {
            username: testUser.username,
            passwordHash: getPasswordHash(testUser.password, SALT, PEPPER)
        };

        const response = await api.post('/auth/login', data);

        expect(response.status).toBe(StatusCodes.OK);
        expect(response.data.success).toBe(true);
        expect(response.headers).toHaveProperty('set-cookie');

        // Zapisujemy ciasteczka do użycia w kolejnych testach
        cookie = response.headers['set-cookie'];

        // Ustawiamy ciasteczka dla kolejnych requestów
        api.defaults.headers.common['Cookie'] = cookie;

        // Wyciągamy token JWT z ciasteczka (do debugowania)
        authToken = extractJwtFromCookie(cookie || []);

        // Przypisujemy ID użytkownika, jeśli jest dostępne w odpowiedzi
        if (response.data.user && response.data.user.id) {
            userId = response.data.user.id;
        }
    });

    it('powinien odrzucić logowanie z nieprawidłowymi danymi', async () => {
        const invalidLoginData = {
            username: 'nieistniejący_użytkownik',
            passwordHash: getPasswordHash('błędne_hasło', SALT, PEPPER)
        };

        const response = await api.post('/auth/login', invalidLoginData);

        expect(response.status).toBe(StatusCodes.UNAUTHORIZED);
        expect(response.data.success).toBe(false);
    });

    it('powinien pobrać dane zalogowanego użytkownika', async () => {
        // Korzystamy z ustawionych wcześniej ciasteczek
        const response = await api.get('/auth/me');

        expect(response.status).toBe(StatusCodes.OK);
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('displayName', testUser.username);
        expect(response.data).toHaveProperty('email', testUser.email);
        expect(response.data).toHaveProperty('role');
    });

    it('powinien odmówić dostępu z nieważnym tokenem JWT', async () => {
        // Najpierw musimy się zalogować, aby uzyskać prawidłowe podpisane ciasteczko
        const credentials = {
            username: 'test_user',
            password: 'test_password'
        };

        // Zapisujemy oryginalne ciasteczka
        const savedCookie = api.defaults.headers.common['Cookie'];

        // Logujemy się, aby uzyskać prawidłowe ciasteczko
        await api.post('/auth/login', credentials);

        // Pobieramy ciasteczko z odpowiedzi i modyfikujemy je
        let cookieHeader = api.defaults.headers.common['Cookie'];

        if (cookieHeader && typeof cookieHeader === 'string') {
            const cookie = api.defaults.headers.common['Cookie'] as string;
            api.defaults.headers.common['Cookie'] = (cookie === cookie.toUpperCase()) ? cookie.toLowerCase() : cookie.toUpperCase() ;
            console.log('Modified cookie:', api.defaults.headers.common['Cookie']);

            // Wykonujemy żądanie do chronionego endpointu
            const response = await api.get('/auth/me');

            // Zgodnie z middleware, nieprawidłowa weryfikacja tokena powinna zwrócić 401
            expect(response.status).toBe(StatusCodes.UNAUTHORIZED);

            // Przywracamy oryginalne ciasteczka
            if (savedCookie) {
                api.defaults.headers.common['Cookie'] = savedCookie;
            } else {
                delete api.defaults.headers.common['Cookie'];
            }
        }
    });

    it('powinien odmówić dostępu do danych użytkownika bez tokena JWT', async () => {
        // Zapisujemy oryginalne ciasteczka aby przywrócić je po teście
        const savedCookie = api.defaults.headers.common['Cookie'];

        // Usuwamy ciasteczka
        delete api.defaults.headers.common['Cookie'];

        // Wykonujemy żądanie do chronionego endpointu
        const response = await api.get('/auth/me');

        // Sprawdzamy czy serwer zwrócił kod 400 (BAD_REQUEST)
        // Middleware zwraca ten status, gdy brakuje tokena
        expect(response.status).toBe(StatusCodes.BAD_REQUEST);
        expect(response.data).toEqual({ success: false, message: "JWT" });

        // Przywracamy oryginalne ciasteczka dla kolejnych testów
        api.defaults.headers.common['Cookie'] = savedCookie;
    });

    it('powinien wylogować użytkownika', async () => {
        const response = await api.get('/auth/logout');

        expect(response.status).toBe(StatusCodes.OK);
        expect(response.data.success).toBe(true);

        // Sprawdzenie czy cookie zostało usunięte
        expect(response.headers['set-cookie']).toBeDefined();
        const setCookie = response.headers['set-cookie'];
        expect(Array.isArray(setCookie)).toBeTruthy();
        const cookieHeader = setCookie?.[0] || '';
        expect(cookieHeader).toContain('JWT=;');

        // Usunięcie nagłówka autoryzacji po wylogowaniu
        delete api.defaults.headers.common['Cookie'];
    });
});

/**
 * Funkcja pomocnicza do wyodrębniania tokenu JWT z nagłówka ciasteczek
 */
function extractJwtFromCookie(cookieHeader: string[]): string {
    if (!cookieHeader || cookieHeader.length === 0) {
        return '';
    }

    // Próba znalezienia ciasteczka JWT
    const jwtCookie = cookieHeader.find(cookie => cookie.startsWith('JWT='));
    if (!jwtCookie) {
        return '';
    }

    // Wyodrębnienie wartości tokenu
    const match = jwtCookie.match(/JWT=([^;]+)/);
    return match ? match[1] : '';
}

