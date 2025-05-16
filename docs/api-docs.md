# BuddyShare API Documentation

## Overview
Ten dokument opisuje dostępne endpointy API aplikacji BuddyShare oraz jak korzystać z nich poprzez composable `useApi()`.

## Użycie
```typescript
const api = useApi()

// Przykładowe wywołania
const { data, error } = await api.auth.getCurrentUser()
const { data: profile } = await api.users.getProfile('username')

// Aktualizacja danych
const { error } = await api.streams.updateStream('username', 'streamId', { 
  title: 'Nowy tytuł', 
  description: 'Nowy opis' 
})
```

## Dostępne endpointy

### Authentication
- `POST /auth/login` - `auth.login(username, passwordHash)`
  ```typescript
  const { data, error } = await api.auth.login('user', 'hash')
  ```

- `POST /auth/register` - `auth.register(username, email, password)`
  ```typescript
  const { data, error } = await api.auth.register('user', 'email@example.com', 'pass')
  ```

- `GET /auth/me` - `auth.getCurrentUser()`
  ```typescript
  const { data, error } = await api.auth.getCurrentUser()
  ```

- `GET /auth/logout` - `auth.logout()`
  ```typescript
  const { data, error } = await api.auth.logout()
  ```

- `GET /auth/test` - `auth.test()`
  ```typescript
  const { data, error } = await api.auth.test()
  ```

### Media
- `GET /media` - `media.getAllStreams()`
- `POST /media` - `media.createStream(streamData)`
  ```typescript
  const { data, error } = await api.media.createStream({
    title: 'Tytuł streamu',
    description: 'Opis streamu',
    thumbnail: 'url/do/miniaturki.jpg'
  })
  ```
- `GET /media/:id` - `media.getStream(id)`
- `PUT /media/:id` - `media.updateStream(id, streamData)`
  ```typescript
  const { data, error } = await api.media.updateStream('streamId', {
    title: 'Zaktualizowany tytuł',
    description: 'Zaktualizowany opis',
    thumbnail: 'url/do/nowej/miniaturki.jpg'
  })
  ```
- `PATCH /media/:id` - `media.patchStream(id, partialData)`
- `DELETE /media/:id` - `media.deleteStream(id)`

### Users
- `GET /users/:username` - `users.checkIfExists(username)`
- `GET /users/` - `users.getAll()`
- `GET /users/brief` - `users.getBriefInfo()`
- `PATCH /users/:username/ban` - `users.banUser(username)`
- `PATCH /users/:username/unban` - `users.unbanUser(username)`
- `GET /users/:username/role` - `users.getRole(username)`
- `PATCH /users/:username/role` - `users.changeRole(username, role)`
  ```typescript
  const { data, error } = await api.users.changeRole('username', 'ADMIN')
  ```
- `GET /users/:username/profile` - `users.getProfile(username)`
- `PATCH /users/:username/profile` - `users.updateProfile(username, profileData)`
  ```typescript
  const { data, error } = await api.users.updateProfile('username', {
    description: 'Nowy opis profilu',
    profilePicture: 'url/do/zdjecia.jpg'
  })
  ```
- `GET /users/:username/settings` - `users.getSettings(username)`
- `PATCH /users/:username/settings` - `users.updateSettings(username, settings)`
  ```typescript
  const { data, error } = await api.users.updateSettings('username', {
    notificationsEnabled: true,
    darkMode: false,
    language: 'pl'
  })
  ```
- `PATCH /users/:username/settings/:id` - `users.updateSingleSetting(username, settingId, value)`
- `POST /users/:username/follow` - `users.followUser(username)`
- `POST /users/:username/unfollow` - `users.unfollowUser(username)`
- `GET /users/:username/followers` - `users.getFollowers(username)`
- `GET /users/:username/followers/count` - `users.getFollowersCount(username)`
- `GET /users/:username/following` - `users.getFollowing(username)`
- `GET /users/:username/following/count` - `users.getFollowingCount(username)`
- `GET /users/:username/subscriptions` - `users.getSubscriptions(username)`
- `GET /users/:username/notifications` - `users.getNotifications(username)`
- `PUT /users/:username/notifications` - `users.updateNotifications(username, notifications)`
- `DELETE /users/:username/notifications` - `users.deleteNotifications(username, notificationIds)`
- `PATCH /users/:username/notifications/:id` - `users.updateNotification(username, notificationId, data)`
- `DELETE /users/:username/notifications/:id` - `users.deleteNotification(username, notificationId)`

### Streamers
- `GET /streamers/` - `streamers.getAll()`
- `GET /streamers/:username` - `streamers.getByUsername(username)`
- `GET /streamers/:username/moderators` - `streamers.getModerators(username)`
- `GET /streamers/:username/moderators/:modusername` - `streamers.getModerator(username, modUsername)`
- `PUT /streamers/:username/moderators/:modusername` - `streamers.addModerator(username, modUsername)`
- `DELETE /streamers/:username/moderators/:modusername` - `streamers.removeModerator(username, modUsername)`
- `GET /streamers/:username/token` - `streamers.getToken(username)`
- `PATCH /streamers/:username/token` - `streamers.updateToken(username)`
- `GET /streamers/:username/subscribers` - `streamers.getSubscribers(username)`
- `POST /streamers/:username/subscribers` - `streamers.subscribe(username)`
- `DELETE /streamers/:username/subscribers` - `streamers.unsubscribe(username)`

### Streams
- `GET /streams` - `streams.getAll()`
- `GET /streams/:username/:id` - `streams.getStream(username, id)`
- `PATCH /streams/:username/:id` - `streams.updateStream(username, id, streamData)`
  ```typescript
  // Aktualizacja szczegółów streamu
  const { error } = await api.streams.updateStream('username', 'streamId', {
    title: 'Nowy tytuł streamu',
    description: 'Szczegółowy opis streamu',
    isPublic: true,
    thumbnail: 'url/do/miniaturki.jpg'
  })
  ```
- `DELETE /streams/:username/:id` - `streams.deleteStream(username, id)`
- `GET /streams/notify/start` - `streams.notify.start()`
- `GET /streams/notify/end` - `streams.notify.end()`
- `GET /streams/token` - `streams.getToken()`

### Moderators
- `GET /moderators/:modusername` - `moderators.getModerator(modusername)`

## Propozycje na przyszłość
1. Dodanie typów TypeScript dla wszystkich parametrów i zwracanych wartości
2. Standaryzacja nazw endpointów
3. Dodanie wersjonowania API
4. Ujednolicenie nazw metod w `useApi.ts` z dokumentacją API