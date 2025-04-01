 
# Moodzic

### Note: This app is deprecated and no longer being hosted.

Moodzic is a web application that leverages AI model called musicgen-small to generate music based on user prompts. Users can request various soundscapes, such as "cafe background noise with water and bird sounds," and the app generates custom audio to match. Each user is allocated 20 free API calls to the AI, after which they are notified of the usage limit. An admin page provides access to all users' API call usage for monitoring and management.


## Features

- **AI Music Generation**: Generates audio based on user text prompts using musicgen-small's AI models.
- **User API Limit**: Each user can make up to 20 API requests to the AI, and usage notifications will be displayed upon reaching the limit.
- **Admin Access**: Admins can view all registered users' API call usage to manage and monitor app usage effectively.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: An API gateway server written in JS provides endpoints to the front end to communicate with the Database and the LLM. The API gateway is hosted in Azure, and the LLM is hosted on our own server.
- **Session Management**: Session storage
- **AI Model**:musicgen-small from Hugging Face for music and sound generation

## Installation

To install the necessary dependencies, run the following command:

```bash
npm install
```

## Usage

To start the application, use:

```bash
npm start
```

## Scripts

- `npm start`: Start the application.
- `npm test`: Run the tests.
