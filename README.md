# Japanese Verb & Adjective Conjugator

This project provides a web interface for conjugating Japanese verbs and adjectives. It uses the OpenAI API to generate conjugation tables and example sentences. A list of common verbs and adjectives is included so you can quickly see their forms, or you can input your own words.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the project root and add your OpenAI API key:
   ```
   REACT_APP_OPENAI_API_KEY=your-key-here
   ```
3. Start the development server:
   ```bash
   npm start
   ```
   The app will be available at `http://localhost:3000`.

## Building for Production

To create an optimized build, run:
```bash
npm run build
```
The output will be placed in the `build` directory.

## License

This project is released under the [MIT License](LICENSE).
