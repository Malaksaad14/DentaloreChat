# Dentalore Internal Chat POC

This repository contains the Week 1 Proof of Concept for the Dentalore Internal Chat application. It is a full-stack hybrid application featuring an ASP.NET Core Web API backend and a React (Vite) frontend.

## Prerequisites
* [.NET 8.0 SDK](https://dotnet.microsoft.com/download)
* [Node.js](https://nodejs.org/)
* Visual Studio Code (with C# Dev Kit extension)

## ⚙️ How to Run the Project

You will need to run the server and the client in two separate terminal windows.

**1. Start the Backend (Server)**
Open a terminal at the root of the project and run:
```bash
cd DentaloreChat.Server
dotnet run
```
*Note: The backend requires PostgreSQL. Make sure your database connection string is correctly configured in `appsettings.json` and that you have run `dotnet ef database update` in the Infrastructure project.*

**2. Start the Frontend (Client)**
Open a second, split terminal and run:
```bash
cd DentaloreChat.Client
npm install
npm run dev
```

**3. Access the App**
Open your browser and navigate to the localhost URL provided by the Vite terminal (typically `http://localhost:5173`).