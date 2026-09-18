
# DentaloreChat — Real-Time Chat Application

DentaloreChat is a full-stack, real-time messaging platform designed with **Clean Architecture** principles. It features instant messaging, real-time emoji reactions, image uploads, voice recording support, and conversation history pagination.

Made by Ekram Ahmad and Malak Saad

Under supervision of Nebras dev team

---

## 🏗️ 1. System Overview & Architecture

The application is structured into distinct layers to ensure high maintainability, separation of concerns, and scalability:

* **Backend (.NET 8):**
* `DentaloreChat.Domain`: Core entities (`Message`, `Conversation`, `User`, `Clinic`, `Reaction`).
* `DentaloreChat.Application`: Business logic, interfaces, and services (`MessageService`, `ConversationService`, etc.).
* `DentaloreChat.Infrastructure`: Data persistence using **Entity Framework Core** with **PostgreSQL** (`AppDbContext`, repositories, and database migrations).
* `DentaloreChat.Server` (Presentation): ASP.NET Core controllers, static file hosting (`wwwroot/uploads`), and **SignalR** real-time hubs (`ChatHub`).


* **Frontend (React + Vite):**
* Built with Vite for high performance and fast hot module reloading (HMR).
* Integrated with `@microsoft/signalr` for instant, live updates.



---

## 🚀 2. Getting Started & Developer Setup

### Prerequisites

* **.NET 8 SDK** installed on your machine.
* Node.js (v18+ recommended) installed.
* PostgreSQL installed and running locally.

### Step-by-Step Installation

1. **Clone the Repository & Setup Database:**
Ensure your PostgreSQL instance is running, and your connection string in `DentaloreChat.Server/appsettings.json` points to your local database instance:
```json
"ConnectionStrings": {
  "DefaultConnection": "Host=localhost;Port=5434;Database=DentaloreChatDb;Username=postgres;Password=your_password"
}

```


2. **Apply Database Migrations:**
Navigate to the Infrastructure project and update the database:
```bash
cd DentaloreChat.Infrastructure
dotnet ef database update --startup-project ../DentaloreChat.Server

```


3. **Start the Backend Server:**
Navigate to the server project and run it:
```bash
cd ../DentaloreChat.Server
dotnet run

```


*(The backend will start listening on its configured development port, e.g., `http://localhost:5123`).*

4. **Start the Frontend Client:**
Open a separate terminal window, navigate to the client folder, install dependencies (including required audio packages like `fix-webm-duration`), and start Vite:
```bash
cd DentaloreChat.Client
npm install
npm install fix-webm-duration
npm run dev

```



---

## 📖 3. User Guide & Features

* **Real-Time Messaging:** Send and receive text messages instantly across connected clients within the same conversation group via SignalR.
* **Image Attachments:** Upload images directly into chats. Files are securely processed and stored on the server under `wwwroot/uploads` and served via static file providers.
* **Interactive Reactions:** Attach emoji reactions to messages that update live across all active participants' screens without refreshing.
* **Voice Messages:** Record and play back audio notes seamlessly.
* **Message Management:** View paginated chat history and manage conversation timelines.

---

## 🔌 4. API Endpoints & SignalR Reference

### REST API Endpoints (`/api/messages`)

* `GET /api/messages/{conversationId}?page=1&pageSize=20` — Fetches paginated history for a conversation.
* `POST /api/messages` — Creates and broadcasts a new text or image message.
* `POST /api/messages/upload` — Handles multi-part form file uploads, saves them to `wwwroot/uploads`, and returns the relative asset URL.

### SignalR Hub Events (`/chathub`)

* `ReceiveMessage` — Broadcasts new messages to conversation groups.
* `ReceiveReactionUpdate` — Synchronizes live emoji reactions across clients.
* `ReceiveMessageDeleted` — Instant removal notification when a message is deleted.
