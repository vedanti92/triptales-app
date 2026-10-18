# TripTales — Travel Listing & Review Platform

TripTales is a travel listing platform where users can explore places to stay, publish listings, and share reviews.

## Features
- User registration, login, and session-based authentication
- Create, edit, and delete listings with image uploads
- Reviews with ratings and author-based permissions
- Search and category-based listing filters
- Map integration for location display
- Input validation and centralized error handling

## Tech Stack
- **Backend:** Node.js, Express.js
- **Frontend:** EJS, Bootstrap, JavaScript
- **Database:** MongoDB, Mongoose
- **Authentication:** Passport.js, express-session
- **Integrations:** Cloudinary, Mapbox
- **Testing & CI:** Jest, GitHub Actions

## Live Demo
[Open TripTales](https://triptales-qxe8.onrender.com/listings)

## Run Locally

**Prerequisites:** Node.js 18.17.0, npm, and a MongoDB database.

1. Clone the repository and install dependencies:

   ```bash
   npm install
   ```

2. Create a `.env` file with your MongoDB connection string (`ATLASDB_URL`), session secret (`SECRET`), Cloudinary credentials (`CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`), and the Mapbox token required by the map integration.

3. Start the application using your configured local entry point. The server listens on port `8080`.

## Tests
Run the test suite with:

```bash
npm test
```

GitHub Actions runs the Jest tests on pushes and pull requests to the configured branches.

## Screenshots
<!-- <img width="500" alt="image" src="https://github.com/user-attachments/assets/59b786e1-4b67-427c-bb10-659a03c3252f" /> -->
<!-- <img width="500" alt="image" src="https://github.com/user-attachments/assets/6f603bee-6be4-45e5-900c-be3b439af281" /> -->

<img width="1763" height="1865" alt="Screenshot_18-10-2026_202244_triptales-qxe8 onrender com" src="https://github.com/user-attachments/assets/6770c71b-5cd7-417a-8062-2f72177a6019" />
<img width="1763" height="1453" alt="Screenshot_18-10-2026_201727_triptales-qxe8 onrender com" src="https://github.com/user-attachments/assets/76c95d5b-8c64-4836-a837-10623ec409c0" />

